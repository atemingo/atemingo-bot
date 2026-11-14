'use strict';

const { Events, MessageFlags, EmbedBuilder, ActivityType } = require('discord.js');
const { GOLD, fetchVersion, releaseEmbed, downloadRow, statusEmbed } = require('./ui');
const { t, resolveLang } = require('./i18n');
const stats = require('./stats');
const moderation = require('./moderation');

const WATCH_INTERVAL = 5 * 60 * 1000;

function isStaff(member, config) {
  if (!member) return false;
  if (member.permissions.has('Administrator')) return true;
  return (config.staffRoleIds || []).some((id) => member.roles.cache.has(id));
}

function attach(client, config, store) {
  moderation.attach(client, config, store);

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    if (command.staffOnly && !isStaff(interaction.member, config)) {
      const lang = resolveLang(interaction, store, config);
      await interaction.reply({ content: t(lang, 'common.staffOnly'), flags: MessageFlags.Ephemeral }).catch(() => {});
      return;
    }
    try {
      await command.run(interaction, { client, config, store });
    } catch (error) {
      console.error(`[cmd] ${interaction.commandName}:`, error);
      const lang = resolveLang(interaction, store, config);
      const payload = { content: t(lang, 'common.error'), flags: MessageFlags.Ephemeral };
      if (interaction.deferred || interaction.replied) await interaction.followUp(payload).catch(() => {});
      else await interaction.reply(payload).catch(() => {});
    }
  });

  client.on(Events.GuildMemberAdd, async (member) => {
    try {
      if (config.guildId && member.guild.id !== config.guildId) return;
      const roleId = config.roles?.uye;
      if (roleId) {
        const role = member.guild.roles.cache.get(roleId) || (await member.guild.roles.fetch(roleId).catch(() => null));
        if (role) await member.roles.add(role).catch(() => {});
      }
      const channelId = config.channels?.hosgeldin;
      if (!channelId) return;
      const channel = await member.guild.channels.fetch(channelId).catch(() => null);
      if (!channel || !channel.isTextBased()) return;
      const lang = config.language === 'en' ? 'en' : 'tr';
      const embed = new EmbedBuilder()
        .setColor(GOLD)
        .setTitle(t(lang, 'hosgeldin.title', { user: member.user.username }))
        .setDescription(t(lang, 'hosgeldin.desc', { id: member.id, site: config.links.site }))
        .setThumbnail(member.user.displayAvatarURL());
      await channel.send({ embeds: [embed] }).catch(() => {});
    } catch (error) {
      console.error('[uye] karsilama hatasi:', error.message);
    }
  });
}

function startWatcher(client, config, store) {
  let busy = false;

  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      const version = await fetchVersion(config);
      if (!version?.version) return;
      const meta = store.meta();
      if (meta.version === version.version) return;
      const firstRun = !meta.version;
      meta.version = version.version;
      meta.checkedAt = Date.now();
      store.save();
      if (firstRun) return;
      const channelId = config.channels?.duyuru;
      if (!channelId) return;
      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (!channel || !channel.isTextBased()) return;
      const lang = config.language === 'en' ? 'en' : 'tr';
      await channel.send({
        content: t(lang, 'surum.announce'),
        embeds: [releaseEmbed(version, config, t(lang, 'surum.new', { version: version.version }), lang)],
        components: [downloadRow(config, version)],
      });
    } catch (error) {
      console.error('[watcher] hata:', error.message);
    } finally {
      busy = false;
    }
  };

  tick();
  setInterval(tick, WATCH_INTERVAL);
}

function startStats(clients, config, store) {
  const seconds = Math.max(30, Number(config.stats?.refreshSeconds) || 60);
  const primary = clients[0];
  let busy = false;

  const memberCount = () => {
    const guild = config.guildId
      ? primary.guilds.cache.get(config.guildId)
      : primary.guilds.cache.first();
    return guild?.memberCount ?? 0;
  };

  const updatePanel = async (data) => {
    const channelId = config.stats?.panelChannel;
    if (!channelId) return;
    const channel = await primary.channels.fetch(channelId).catch(() => null);
    if (!channel?.isTextBased()) return;
    const meta = store.meta();
    if (meta.panelMessage) {
      const message = await channel.messages.fetch(meta.panelMessage).catch(() => null);
      if (message) {
        await message.edit({ embeds: [statusEmbed(data, config, config.language === 'en' ? 'en' : 'tr')] }).catch(() => {});
        return;
      }
    }
    const sent = await channel
      .send({ embeds: [statusEmbed(data, config, config.language === 'en' ? 'en' : 'tr')] })
      .catch(() => null);
    if (sent) {
      meta.panelMessage = sent.id;
      store.save();
    }
  };

  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      const data = await stats.snapshot(config, memberCount());
      const text = stats.presenceText(data);
      for (const client of clients) {
        if (!client.user) continue;
        try {
          client.user.setPresence({
            status: 'online',
            activities: [{ name: text, state: text, type: ActivityType.Custom }],
          });
        } catch (error) {
          console.error('[stats] presence hatasi:', error.message);
        }
      }
      await updatePanel(data);
    } catch (error) {
      console.error('[stats] hata:', error.message);
    } finally {
      busy = false;
    }
  };

  tick();
  setInterval(tick, seconds * 1000);
}

module.exports = { attach, startWatcher, startStats, isStaff };
