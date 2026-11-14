'use strict';

const { EmbedBuilder, Events, PermissionsBitField } = require('discord.js');
const { t } = require('./i18n');

const GOLD = 0xd4af37;
const DAY = 24 * 60 * 60 * 1000;

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');
}

function buildMatchers(keywords) {
  return (keywords || [])
    .map((word) => normalize(word).trim())
    .filter(Boolean)
    .map((word) => ({
      word,
      regex: new RegExp(`\\b${word.replace(/\s+/g, '\\s+')}\\b`),
    }));
}

function isExempt(member, config) {
  if (!member) return true;
  if (member.id === member.guild.ownerId) return true;
  if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;
  const exempt = [...(config.staffRoleIds || []), ...(config.moderation?.exemptRoleIds || [])];
  if (exempt.some((id) => id && member.roles.cache.has(id))) return true;
  return false;
}

function escalate(record, mod) {
  const ladder = (mod.timeoutsMinutes || []).map((m) => Math.max(1, Number(m) || 0) * 60000);
  const index = record.strikes - 1;
  if (ladder.length && index < ladder.length) {
    return { kind: 'timeout', ms: ladder[index] };
  }
  return { kind: 'ban' };
}

async function handle(client, message, config, store, matchers) {
  if (!message.inGuild() || message.author.bot) return;
  if (config.guildId && message.guild.id !== config.guildId) return;
  const member = message.member;
  if (!member || isExempt(member, config)) return;

  const text = normalize(message.content);
  if (!text.trim()) return;
  const hit = matchers.find((m) => m.regex.test(text));
  if (!hit) return;

  const meta = store.meta();
  const users = (meta.users = meta.users || {});
  const record = (users[member.id] = users[member.id] || {});
  const mod = config.moderation || {};
  if (!record.mod || typeof record.mod !== 'object') record.mod = { strikes: 0, at: 0 };
  const resetMs = Math.max(1, Number(mod.resetAfterDays) || 30) * DAY;
  if (record.mod.at && Date.now() - record.mod.at > resetMs) record.mod.strikes = 0;
  record.mod.strikes = (Number(record.mod.strikes) || 0) + 1;
  record.mod.at = Date.now();
  const strikes = record.mod.strikes;

  await message.delete().catch(() => {});

  const action = escalate(record, mod);
  let applied;
  if (action.kind === 'timeout') {
    const ok = await member
      .timeout(action.ms, `Atemingo otomatik moderasyon: ${hit.word}`)
      .then(() => true)
      .catch(() => false);
    applied = ok
      ? t(config.language, 'mod.timeout', { min: Math.round(action.ms / 60000) })
      : t(config.language, 'mod.timeoutFail');
  } else {
    const ok = await member
      .ban({ reason: `Atemingo otomatik moderasyon: ${hit.word}`, deleteMessageSeconds: 3600 })
      .then(() => true)
      .catch(() => false);
    applied = ok ? t(config.language, 'mod.ban') : t(config.language, 'mod.banFail');
  }

  store.save();

  const notice = await message.channel
    .send({
      content: t(config.language, 'mod.warn', { user: `<@${member.id}>`, word: hit.word, action: applied }),
      allowedMentions: { users: [] },
    })
    .catch(() => null);
  if (notice) setTimeout(() => notice.delete().catch(() => {}), 10000);

  const logId = mod.logChannel;
  if (logId) {
    const channel = await client.channels.fetch(logId).catch(() => null);
    if (channel?.isTextBased()) {
      const embed = new EmbedBuilder()
        .setColor(GOLD)
        .setTitle(t(config.language, 'mod.log'))
        .addFields(
          { name: 'Kullanıcı', value: `${member.user.tag} (<@${member.id}>)`, inline: false },
          { name: 'Kelime', value: hit.word, inline: true },
          { name: 'Ceza', value: applied, inline: true },
          { name: 'Uyarı sayısı', value: String(strikes), inline: true },
          { name: 'Kanal', value: `<#${message.channelId}>`, inline: true },
          { name: 'Mesaj', value: message.content.slice(0, 900) || '-' },
        );
      await channel.send({ embeds: [embed] }).catch(() => {});
    }
  }
}

function attach(client, config, store) {
  const mod = config.moderation;
  if (!mod?.enabled) return;
  const matchers = buildMatchers(mod.keywords);
  if (!matchers.length) return;
  client.on(Events.MessageCreate, (message) => {
    handle(client, message, config, store, matchers).catch((error) => {
      console.error('[mod] hata:', error.message);
    });
  });
}

module.exports = { attach, normalize, buildMatchers };
