'use strict';

const { EmbedBuilder, Events, PermissionsBitField } = require('discord.js');
const { t } = require('./i18n');

const GOLD = 0xd4af37;
const DAY = 24 * 60 * 60 * 1000;
const MINUTE = 60 * 1000;

const TLD = 'com|net|org|io|gg|me|xyz|ru|tk|link|site|online|shop|store|top|dev|app|tv|co|info|biz|cc|vip|club|pro|live|fun|gg';
const LINK_RE = new RegExp(
  `https?:\\/\\/|www\\.|discord(?:app)?\\.com\\/invite\\/|discord\\.gg\\/|(?:^|[\\s.,;:!?(\\[])((?:[a-z0-9-]+\\.)+(?:${TLD}))(?:[\\/\\s.,;:!?)\\]]|$)`,
  'i',
);

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
  if (member.permissions?.has(PermissionsBitField.Flags.Administrator)) return true;
  const exempt = [...(config.staffRoleIds || []), ...(config.moderation?.exemptRoleIds || [])];
  if (exempt.some((id) => id && member.roles?.cache?.has(id))) return true;
  return false;
}

function escalate(record, mod) {
  const ladder = (mod.timeoutsMinutes || []).map((m) => Math.max(1, Number(m) || 0) * MINUTE);
  const index = record.strikes - 1;
  if (ladder.length && index < ladder.length) {
    return { kind: 'timeout', ms: ladder[index] };
  }
  return { kind: 'ban' };
}

function allowedDomain(url, guard) {
  const allow = guard.allowDomains || [];
  if (!allow.length) return false;
  const lower = String(url).toLowerCase();
  return allow.some((domain) => lower.includes(String(domain).toLowerCase()));
}

function detect(message, config, matchers) {
  const guard = config.guard || {};

  if (guard.blockAttachments !== false && message.attachments.size > 0) {
    return { reason: 'file', label: message.attachments.first()?.name || 'dosya' };
  }

  const content = message.content || '';
  if (guard.blockLinks !== false) {
    const match = content.match(LINK_RE);
    if (match && !allowedDomain(match[0], guard)) {
      return { reason: 'link', label: (match[1] || match[0]).trim() };
    }
  }

  const text = normalize(content);
  if (text.trim()) {
    const hit = matchers.find((m) => m.regex.test(text));
    if (hit) return { reason: 'word', label: hit.word };
  }
  return null;
}

async function logAction(client, config, lang, fields, title) {
  const logId = config.moderation?.logChannel;
  if (!logId) return;
  const channel = await client.channels.fetch(logId).catch(() => null);
  if (!channel?.isTextBased()) return;
  await channel
    .send({ embeds: [new EmbedBuilder().setColor(GOLD).setTitle(title || t(lang, 'mod.log')).addFields(fields)] })
    .catch(() => {});
}

async function punish(client, message, config, store, hit) {
  const member = message.member;
  const meta = store.meta();
  const users = (meta.users = meta.users || {});
  const record = (users[member.id] = users[member.id] || {});
  const mod = config.moderation || {};
  const guard = config.guard || {};
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
      .timeout(action.ms, `Atemingo koruma: ${hit.reason}/${hit.label}`)
      .then(() => true)
      .catch(() => false);
    applied = ok
      ? t(config.language, 'mod.timeout', { min: Math.round(action.ms / MINUTE) })
      : t(config.language, 'mod.timeoutFail');
  } else if (guard.banOnLastStrike === false) {
    applied = t(config.language, 'mod.banSkipped');
  } else {
    await member
      .send({
        content: [
          `You were banned from **${message.guild.name}**.`,
          '',
          `Reason: ${hit.reason} (${hit.label})`,
          'Ban appeals: https://discord.gg/jknhMGrrVG',
        ].join('\n'),
      })
      .catch(() => {});
    const ok = await member
      .ban({ reason: `Atemingo koruma: ${hit.reason}/${hit.label}`, deleteMessageSeconds: 3600 })
      .then(() => true)
      .catch(() => false);
    applied = ok ? t(config.language, 'mod.ban') : t(config.language, 'mod.banFail');
  }

  store.save();

  const notice = await message.channel
    .send({
      content: t(config.language, `mod.warn.${hit.reason}`, {
        user: `<@${member.id}>`,
        label: hit.label,
        action: applied,
      }),
      allowedMentions: { users: [] },
    })
    .catch(() => null);
  if (notice) setTimeout(() => notice.delete().catch(() => {}), 10000);

  await logAction(client, config, config.language, [
    { name: 'Kullanıcı', value: `${member.user.tag} (<@${member.id}>)` },
    { name: 'Tür', value: `${hit.reason}: ${hit.label}` },
    { name: 'Ceza', value: applied, inline: true },
    { name: 'Uyarı sayısı', value: String(strikes), inline: true },
    { name: 'Kanal', value: `<#${message.channelId}>`, inline: true },
    { name: 'Mesaj', value: (message.content || '-').slice(0, 900) },
  ]);
}

function attach(client, config, store) {
  const mod = config.moderation;
  const guard = config.guard;
  const matchers = buildMatchers(mod?.keywords);

  if (mod?.enabled) {
    client.on(Events.MessageCreate, (message) => {
      if (!message.inGuild() || message.author.bot) return;
      if (config.guildId && message.guild.id !== config.guildId) return;
      if (/^ticket:\d{15,20}/.test(message.channel?.topic || '')) return;
      const member = message.member;
      if (!member || isExempt(member, config)) return;
      const hit = detect(message, config, matchers);
      if (!hit) return;
      punish(client, message, config, store, hit).catch((error) => {
        console.error('[mod] hata:', error.message);
      });
    });
  }

  if (guard?.enabled) attachGuard(client, config, store);
}

function attachGuard(client, config, store) {
  const guard = config.guard || {};
  const raidCfg = guard.raid || {};
  const joins = [];

  client.on(Events.GuildMemberAdd, async (member) => {
    try {
      if (config.guildId && member.guild.id !== config.guildId) return;
      if (guard.skipBots !== false && member.user.bot) return;

      const now = Date.now();
      const meta = store.meta();
      const raid = meta.raid || { until: 0 };

      joins.push(now);
      while (joins.length && now - joins[0] > MINUTE) joins.shift();

      const threshold = Math.max(2, Number(raidCfg.joinsPerMinute) || 8);
      let raidUntil = raid.until || 0;
      if (joins.length >= threshold && raidUntil < now) {
        raidUntil = now + Math.max(1, Number(raidCfg.lockMinutes) || 30) * MINUTE;
        meta.raid = { until: raidUntil, at: now, joins: joins.length };
        store.save();
        await logAction(client, config, config.language, [
          { name: 'Durum', value: `Raid modu açık · ${Math.round((raidUntil - now) / MINUTE)} dk` },
          { name: 'Eşik', value: `${joins.length} katılım / dk` },
        ], t(config.language, 'mod.raidTitle'));
      }

      const inRaid = raidUntil > now;
      const minAge = Math.max(0, Number(raidCfg.minAccountAgeDays) || 0);
      const young = minAge > 0 && now - member.user.createdTimestamp < minAge * DAY;
      if (!inRaid && !young) return;

      const kick = inRaid ? raidCfg.raidAction !== 'ban' : raidCfg.youngAction !== 'ban';
      const why = inRaid ? 'raid' : 'young';
      const reason = `Atemingo koruma: ${why} (${member.user.tag})`;
      const whyText = why === 'raid' ? 'raid protection' : `account younger than ${minAge} days`;

      await member
        .send({
          content: [
            `You were ${kick ? 'kicked' : 'banned'} from **${member.guild.name}**.`,
            '',
            `Reason: ${whyText}`,
            'If this was a mistake, rejoin and open a ticket.',
          ].join('\n'),
        })
        .catch(() => {});

      const ok = kick
        ? await member.kick(reason).then(() => true).catch(() => false)
        : await member.ban({ reason, deleteMessageSeconds: 3600 }).then(() => true).catch(() => false);

      await logAction(client, config, config.language, [
        { name: 'Kullanıcı', value: `${member.user.tag} (<@${member.id}>)` },
        { name: 'Sebep', value: why === 'raid' ? 'raid modu' : `hesap yaşı < ${minAge} gün`, inline: true },
        { name: 'İşlem', value: ok ? (kick ? 'kick' : 'ban') : 'başarısız (yetki)', inline: true },
      ], t(config.language, 'mod.raidTitle'));
    } catch (error) {
      console.error('[guard] hata:', error.message);
    }
  });
}

module.exports = { attach, normalize, buildMatchers, detect, LINK_RE };
