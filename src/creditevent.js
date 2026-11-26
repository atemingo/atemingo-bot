'use strict';

const crypto = require('node:crypto');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} = require('discord.js');
const { GOLD } = require('./ui');
const { t } = require('./i18n');

const TICK_MS = 30 * 1000;
const NAME_RE = /^[A-Za-z0-9_]{3,16}$/;
const KEEP_EVENTS = 20;
const GRANT_TIMEOUT_MS = 15 * 1000;

function eventsOf(store) {
  const meta = store.meta();
  if (!Array.isArray(meta.creditEvents)) meta.creditEvents = [];
  return meta.creditEvents;
}

function findEvent(store, id) {
  return eventsOf(store).find((event) => event.id === id) || null;
}

function panelEmbed(event, lang) {
  const ends = Math.floor(event.endsAt / 1000);
  const names = event.participants.map((entry) => entry.name);
  const shown = names.slice(0, 60).join(', ') + (names.length > 60 ? '…' : '');
  const embed = new EmbedBuilder()
    .setColor(GOLD)
    .setTitle(t(lang, 'creditevent.title', { credits: event.credits }))
    .setDescription(t(lang, 'creditevent.desc'))
    .addFields(
      { name: t(lang, 'creditevent.prize'), value: `**${event.credits}**`, inline: true },
      { name: t(lang, 'creditevent.ends'), value: `<t:${ends}:R>`, inline: true },
      { name: t(lang, 'creditevent.count'), value: `**${event.participants.length}**`, inline: true },
    );
  if (names.length) embed.addFields({ name: t(lang, 'creditevent.names'), value: shown.slice(0, 1024) });
  if (event.status !== 'open') {
    if (event.winner) {
      embed.addFields({
        name: t(lang, 'creditevent.winnerLabel'),
        value: `<@${event.winner.userId}> — **${event.winner.name}**`,
      });
    } else {
      embed.setFooter({ text: t(lang, 'creditevent.noParticipants') });
    }
  }
  return embed;
}

function panelRow(event, lang) {
  if (event.status !== 'open') return [];
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ce:join:${event.id}`)
        .setLabel(t(lang, 'creditevent.join'))
        .setEmoji('🎟️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`ce:leave:${event.id}`)
        .setLabel(t(lang, 'creditevent.leave'))
        .setStyle(ButtonStyle.Secondary),
    ),
  ];
}

async function refreshPanel(client, event) {
  const channel = await client.channels.fetch(event.channelId).catch(() => null);
  if (!channel?.isTextBased()) return;
  const message = await channel.messages.fetch(event.messageId).catch(() => null);
  if (!message) return;
  await message
    .edit({ embeds: [panelEmbed(event, event.lang)], components: panelRow(event, event.lang) })
    .catch((error) => console.error('[etkinlik] panel duzenlenemedi:', error.message));
}

async function deliverGrant(config, event) {
  const key = process.env.CREDITS_KEY;
  const base = String(config.credits?.serverUrl || '').replace(/\/+$/, '');
  if (!key || !base || !event.winner) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GRANT_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/credits/grant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-plugin-key': key, 'User-Agent': 'atemingo-bot' },
      body: JSON.stringify({
        name: event.winner.name,
        amount: event.credits,
        reason: `credit event ${event.id}`,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`[etkinlik] kredi yazilamadi: ${res.status} ${(await res.text()).slice(0, 200)}`);
      return null;
    }
    const json = await res.json().catch(() => ({}));
    return json.id || 'ok';
  } catch (error) {
    console.error('[etkinlik] kredi hatasi:', error.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function startTicker(client, config, store) {
  let busy = false;

  const announceWinner = async (event) => {
    const channel = await client.channels.fetch(event.channelId).catch(() => null);
    if (!channel?.isTextBased()) return;
    const key = event.grantedId ? 'creditevent.winner' : 'creditevent.winnerRetry';
    const embed = new EmbedBuilder()
      .setColor(GOLD)
      .setTitle(t(event.lang, 'creditevent.winnerTitle'))
      .setDescription(
        t(event.lang, key, { user: `<@${event.winner.userId}>`, name: event.winner.name, credits: event.credits }),
      );
    await channel.send({ embeds: [embed] }).catch(() => {});
  };

  const finish = async (event) => {
    if (!event.participants.length) {
      event.status = 'empty';
      event.finishedAt = Date.now();
      store.save();
      await refreshPanel(client, event);
      return;
    }
    const pick = event.participants[crypto.randomInt(event.participants.length)];
    event.winner = { userId: pick.userId, name: pick.name };
    event.status = 'drawn';
    event.finishedAt = Date.now();
    store.save();
    const grantedId = await deliverGrant(config, event);
    if (grantedId) {
      event.status = 'done';
      event.grantedId = grantedId;
      event.grantedAt = Date.now();
      store.save();
    }
    await announceWinner(event);
    await refreshPanel(client, event);
  };

  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      const now = Date.now();
      for (const event of eventsOf(store)) {
        if (event.status === 'open' && now >= event.endsAt) await finish(event);
        else if (event.status === 'drawn' && !event.grantedId) {
          const grantedId = await deliverGrant(config, event);
          if (grantedId) {
            event.status = 'done';
            event.grantedId = grantedId;
            event.grantedAt = Date.now();
            store.save();
            await refreshPanel(client, event);
          }
        }
      }
      const events = eventsOf(store);
      if (events.length > KEEP_EVENTS) {
        events.sort((a, b) => a.createdAt - b.createdAt);
        events.splice(0, events.length - KEEP_EVENTS);
        store.save();
      }
    } catch (error) {
      console.error('[etkinlik] tur hatasi:', error.message);
    } finally {
      busy = false;
    }
  };

  setTimeout(tick, 5000);
  setInterval(tick, TICK_MS);
}

function attach(client, config, store) {
  if (client.isPrimary) startTicker(client, config, store);

  client.on('interactionCreate', async (interaction) => {
    try {
      if (interaction.isButton() && interaction.customId.startsWith('ce:join:')) {
        const id = interaction.customId.slice('ce:join:'.length);
        const event = findEvent(store, id);
        const lang = event?.lang || 'tr';
        if (!event || event.status !== 'open' || Date.now() >= event.endsAt) {
          await interaction.reply({ content: t(lang, 'creditevent.closed'), flags: MessageFlags.Ephemeral });
          return;
        }
        if (event.participants.some((entry) => entry.userId === interaction.user.id)) {
          await interaction.reply({ content: t(lang, 'creditevent.already'), flags: MessageFlags.Ephemeral });
          return;
        }
        const modal = new ModalBuilder().setCustomId(`ce:modal:${event.id}`).setTitle(t(lang, 'creditevent.modalTitle'));
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('name')
              .setLabel(t(lang, 'creditevent.modalLabel'))
              .setPlaceholder(t(lang, 'creditevent.modalHint'))
              .setMinLength(3)
              .setMaxLength(16)
              .setStyle(TextInputStyle.Short)
              .setRequired(true),
          ),
        );
        await interaction.showModal(modal);
        return;
      }

      if (interaction.isButton() && interaction.customId.startsWith('ce:leave:')) {
        const id = interaction.customId.slice('ce:leave:'.length);
        const event = findEvent(store, id);
        const lang = event?.lang || 'tr';
        if (!event || event.status !== 'open' || Date.now() >= event.endsAt) {
          await interaction.reply({ content: t(lang, 'creditevent.closed'), flags: MessageFlags.Ephemeral });
          return;
        }
        const index = event.participants.findIndex((entry) => entry.userId === interaction.user.id);
        if (index === -1) {
          await interaction.reply({ content: t(lang, 'creditevent.notJoined'), flags: MessageFlags.Ephemeral });
          return;
        }
        const [gone] = event.participants.splice(index, 1);
        store.save();
        await interaction.reply({ content: t(lang, 'creditevent.left', { name: gone.name }), flags: MessageFlags.Ephemeral });
        await refreshPanel(client, event);
        return;
      }

      if (interaction.isModalSubmit() && interaction.customId.startsWith('ce:modal:')) {
        const id = interaction.customId.slice('ce:modal:'.length);
        const event = findEvent(store, id);
        const lang = event?.lang || 'tr';
        if (!event || event.status !== 'open' || Date.now() >= event.endsAt) {
          await interaction.reply({ content: t(lang, 'creditevent.closed'), flags: MessageFlags.Ephemeral });
          return;
        }
        const name = String(interaction.fields.getTextInputValue('name') || '').trim();
        if (!NAME_RE.test(name)) {
          await interaction.reply({ content: t(lang, 'creditevent.badName'), flags: MessageFlags.Ephemeral });
          return;
        }
        if (event.participants.some((entry) => entry.userId === interaction.user.id)) {
          await interaction.reply({ content: t(lang, 'creditevent.already'), flags: MessageFlags.Ephemeral });
          return;
        }
        if (event.participants.some((entry) => entry.name.toLowerCase() === name.toLowerCase())) {
          await interaction.reply({ content: t(lang, 'creditevent.taken'), flags: MessageFlags.Ephemeral });
          return;
        }
        event.participants.push({ userId: interaction.user.id, name, at: Date.now() });
        store.save();
        await interaction.reply({ content: t(lang, 'creditevent.joined', { name }), flags: MessageFlags.Ephemeral });
        await refreshPanel(client, event);
      }
    } catch (error) {
      console.error('[etkinlik] etkilesim hatasi:', error.message);
    }
  });
}

async function create(client, config, store, interaction, minutes, credits, lang) {
  const channel = interaction.channel?.isTextBased()
    ? interaction.channel
    : await interaction.guild.channels.fetch(interaction.channelId).catch(() => null);
  if (!channel?.isTextBased()) return null;
  const event = {
    id: crypto.randomUUID().slice(0, 8),
    guildId: interaction.guildId,
    channelId: channel.id,
    messageId: null,
    hostId: interaction.user.id,
    lang,
    credits,
    createdAt: Date.now(),
    endsAt: Date.now() + minutes * 60 * 1000,
    status: 'open',
    participants: [],
    winner: null,
  };
  const sent = await channel.send({ embeds: [panelEmbed(event, lang)], components: panelRow(event, lang) }).catch((error) => {
    console.error('[etkinlik] panel gonderilemedi:', error.message);
    return null;
  });
  if (!sent) return null;
  event.messageId = sent.id;
  eventsOf(store).push(event);
  store.save();
  return event;
}

module.exports = { attach, create, findEvent };
