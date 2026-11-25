'use strict';

const { matches } = require('./presence');

const DAY = 24 * 60 * 60 * 1000;

// Launcher sayısı Discord varlığından okunur: aktivitesi "ATEMINGO LAUNCHER"
// olan üyeler şu an launcher'ı açık olanlardır. Sunucu sayacı kullanılmaz.
function launcherCounts(guild, config, store) {
  const cfg = config.launcherRole;
  let online = 0;
  if (guild && cfg?.activityMatch) {
    for (const presence of guild.presences.cache.values()) {
      if (presence.member?.user.bot) continue;
      if (matches(presence, cfg)) online += 1;
    }
  }
  const users = store?.meta?.().users || {};
  const now = Date.now();
  let day = 0;
  let total = 0;
  for (const record of Object.values(users)) {
    if (!record?.launcherAt) continue;
    total += 1;
    if (now - record.launcherAt < DAY) day += 1;
  }
  return { online, day, total };
}

async function snapshot(config, guildCount, launcher) {
  return {
    at: Date.now(),
    discord: guildCount ?? 0,
    launcher: launcher?.online ?? 0,
    launcherDay: launcher?.day ?? 0,
    launcherTotal: launcher?.total ?? 0,
  };
}

// "Aktif" = şu an çevrimiçi/boşta/rahatsız etme durumundaki botsuz üyeler.
function activeMembers(guild) {
  if (!guild) return 0;
  let count = 0;
  for (const member of guild.members.cache.values()) {
    if (member.user.bot) continue;
    if (member.presence && member.presence.status !== 'offline') count += 1;
  }
  return count;
}

function presenceText(data) {
  return `DISCORD: ${data.discord ?? 0} • LAUNCHER: ${data.launcher ?? 0}`;
}

module.exports = { snapshot, presenceText, launcherCounts, activeMembers };
