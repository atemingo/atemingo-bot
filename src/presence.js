'use strict';

const { EmbedBuilder, Events } = require('discord.js');
const GOLD = 0xd4af37;
const DAY = 24 * 60 * 60 * 1000;

function normalizeText(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/İ/g, 'I')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function matches(presence, cfg) {
  const terms = (cfg.activityMatch || ['ATEMINGO LAUNCHER']).map(normalizeText);
  for (const activity of presence?.activities || []) {
    const parts = [activity.name, activity.state, activity.details]
      .filter(Boolean)
      .map(normalizeText);
    if (parts.some((part) => terms.some((term) => part.includes(term)))) return true;
  }
  return false;
}

async function logLine(client, config, title, fields) {
  const logId = config.moderation?.logChannel;
  if (!logId) return;
  const channel = await client.channels.fetch(logId).catch(() => null);
  if (!channel?.isTextBased()) return;
  await channel
    .send({ embeds: [new EmbedBuilder().setColor(GOLD).setTitle(title).addFields(fields)] })
    .catch(() => {});
}

async function grant(client, config, store, member) {
  const cfg = config.launcherRole;
  const role = member.guild.roles.cache.get(cfg.roleId) || (await member.guild.roles.fetch(cfg.roleId).catch(() => null));
  if (!role) return;
  const meta = store.meta();
  const users = (meta.users = meta.users || {});
  const record = (users[member.id] = users[member.id] || {});
  record.launcherAt = Date.now();
  if (!member.roles.cache.has(role.id)) {
    const ok = await member.roles.add(role, 'Atemingo Launcher tespit edildi').then(() => true).catch(() => false);
    store.save();
    await logLine(client, config, 'Launcher rolü verildi', [
      { name: 'Kullanıcı', value: `${member.user.tag} (<@${member.id}>)` },
      { name: 'Rol', value: `<@&${role.id}>`, inline: true },
      { name: 'Durum', value: ok ? 'verildi' : 'başarısız (yetki)', inline: true },
    ]);
    return;
  }
  store.save();
}

async function sweep(client, config, store) {
  const cfg = config.launcherRole;
  const guild = config.guildId ? client.guilds.cache.get(config.guildId) : client.guilds.cache.first();
  if (!guild) return;
  const role = await guild.roles.fetch(cfg.roleId).catch(() => null);
  if (!role) return;
  const members = await guild.members.fetch().catch(() => null);
  if (!members) return;
  const meta = store.meta();
  const users = (meta.users = meta.users || {});
  const expireMs = Math.max(1, Number(cfg.expireDays) || 7) * DAY;
  const now = Date.now();
  let changed = false;

  for (const member of members.values()) {
    if (!member.roles.cache.has(role.id)) continue;
    const record = (users[member.id] = users[member.id] || {});
    if (!record.launcherAt) {
      record.launcherAt = now;
      changed = true;
      continue;
    }
    if (now - record.launcherAt < expireMs) continue;
    const ok = await member.roles.remove(role, 'Atemingo Launcher 7 gündür açılmadı').then(() => true).catch(() => false);
    record.launcherAt = 0;
    changed = true;
    await logLine(client, config, 'Launcher rolü alındı', [
      { name: 'Kullanıcı', value: `${member.user.tag} (<@${member.id}>)` },
      { name: 'Rol', value: `<@&${role.id}>`, inline: true },
      { name: 'Durum', value: ok ? 'alındı' : 'başarısız (yetki)', inline: true },
    ]);
  }
  if (changed) store.save();
}

function attach(client, config, store) {
  const cfg = config.launcherRole;
  if (!cfg?.enabled || !cfg.roleId) return;

  client.on(Events.PresenceUpdate, async (_old, presence) => {
    try {
      if (!presence?.guild) return;
      if (config.guildId && presence.guild.id !== config.guildId) return;
      if (!matches(presence, cfg)) return;
      const member = presence.member || (await presence.guild.members.fetch(presence.userId).catch(() => null));
      if (!member) return;
      await grant(client, config, store, member);
    } catch (error) {
      console.error('[presence] hata:', error.message);
    }
  });

  client.once(Events.ClientReady, () => {
    setTimeout(async () => {
      const guild = config.guildId ? client.guilds.cache.get(config.guildId) : client.guilds.cache.first();
      if (guild) {
        for (const presence of guild.presences.cache.values()) {
          if (!matches(presence, cfg)) continue;
          const member = presence.member || guild.members.cache.get(presence.userId);
          if (member) await grant(client, config, store, member).catch(() => {});
        }
      }
      await sweep(client, config, store).catch(() => {});
    }, 15000);

    const every = Math.max(5, Number(cfg.sweepMinutes) || 10) * 60 * 1000;
    setInterval(() => sweep(client, config, store).catch(() => {}), every);
  });
}

module.exports = { attach, matches, normalizeText };
