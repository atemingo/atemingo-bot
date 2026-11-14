'use strict';

const fs = require('node:fs');
const path = require('node:path');

const FILE = path.join(__dirname, '..', 'config.json');

const DEFAULTS = {
  language: 'tr',
  guildId: '',
  staffRoleIds: [],
  roles: { uye: '' },
  channels: { duyuru: '', hosgeldin: '' },
  links: {
    site: 'https://atemingo.github.io/AtemingoLauncher',
    version: 'https://atemingo.github.io/AtemingoLauncher/updates/version.json',
    windows: 'https://github.com/atemingo/AtemingoLauncher/releases/latest',
    linux: 'https://github.com/atemingo/AtemingoLauncher/releases/latest',
    github: 'https://github.com/atemingo/AtemingoLauncher',
    discord: 'https://discord.gg/jknhMGrrVG',
  },
  servers: [],
  stats: {
    refreshSeconds: 60,
    panelChannel: '',
    launcherUrl: '',
  },
  sponsors: [],
  moderation: {
    enabled: true,
    logChannel: '',
    timeoutsMinutes: [5, 30, 120, 720, 1440, 10080],
    resetAfterDays: 30,
    exemptRoleIds: [],
    keywords: [],
  },
  guard: {
    enabled: true,
    blockLinks: true,
    blockAttachments: true,
    allowDomains: ['atemingo.github.io'],
    skipBots: true,
    banOnLastStrike: true,
    raid: {
      joinsPerMinute: 8,
      lockMinutes: 30,
      minAccountAgeDays: 7,
      youngAction: 'kick',
      raidAction: 'ban',
    },
  },
  launcherRole: {
    enabled: true,
    roleId: '1571274984062451894',
    activityMatch: ['ATEMINGO LAUNCHER'],
    expireDays: 7,
    sweepMinutes: 10,
  },
};

function merge(base, extra) {
  const out = { ...base };
  for (const [key, value] of Object.entries(extra || {})) {
    const isObject = value && typeof value === 'object' && !Array.isArray(value);
    out[key] = isObject && base[key] && typeof base[key] === 'object' ? merge(base[key], value) : value;
  }
  return out;
}

let config = DEFAULTS;
try {
  config = merge(DEFAULTS, JSON.parse(fs.readFileSync(FILE, 'utf8')));
} catch (error) {
  console.error('[config] config.json okunamadi, varsayilanlar kullaniliyor:', error.message);
}

module.exports = config;
