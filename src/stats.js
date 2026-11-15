'use strict';

async function launcherStats(config) {
  const url = config.stats?.launcherUrl;
  if (!url) return null;
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/stats`, {
      headers: { 'User-Agent': 'atemingo-bot' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return typeof json.online === 'number' ? json : null;
  } catch {
    return null;
  }
}

async function snapshot(config, guildCount, roleCount) {
  const live = await launcherStats(config);
  return {
    at: Date.now(),
    discord: guildCount ?? 0,
    launcher: live ? live.online : typeof roleCount === 'number' ? roleCount : 0,
    launcherDay: live?.day ?? null,
    launcherTotal: live?.total ?? null,
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

module.exports = { snapshot, presenceText, launcherStats, activeMembers };
