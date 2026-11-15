'use strict';

async function snapshot(_config, guildCount, launcher) {
  return {
    at: Date.now(),
    discord: guildCount ?? 0,
    launcher: typeof launcher === 'number' ? launcher : 0,
  };
}

function presenceText(data) {
  return `DISCORD: ${data.discord ?? 0} • LAUNCHER: ${data.launcher ?? 0}`;
}

module.exports = { snapshot, presenceText };
