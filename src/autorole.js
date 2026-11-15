'use strict';

const { Events } = require('discord.js');

function targetIds(config, store) {
  return [...new Set([config.roles?.uye, ...(store.meta().autorole || [])].filter(Boolean))];
}

let busy = false;

async function grantToAll(client, config, store) {
  if (busy) return 0;
  busy = true;
  try {
    const guild = config.guildId ? client.guilds.cache.get(config.guildId) : client.guilds.cache.first();
    if (!guild) return 0;
    const ids = targetIds(config, store);
    if (!ids.length) return 0;

    const roles = [];
    for (const id of ids) {
      const role = guild.roles.cache.get(id) || (await guild.roles.fetch(id).catch(() => null));
      if (role && !role.managed) roles.push(role);
    }
    if (!roles.length) return 0;

    const members = await guild.members.fetch().catch(() => null);
    if (!members) return 0;

    let given = 0;
    for (const member of members.values()) {
      if (member.user.bot) continue;
      for (const role of roles) {
        if (member.roles.cache.has(role.id)) continue;
        const ok = await member.roles
          .add(role, 'otorol')
          .then(() => true)
          .catch(() => false);
        if (ok) given += 1;
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
    if (given) console.log(`[otorol] ${given} rol atandi (${roles.length} otorol)`);
    return given;
  } finally {
    busy = false;
  }
}

function attach(client, config, store) {
  client.once(Events.ClientReady, () => {
    setTimeout(() => {
      grantToAll(client, config, store).catch((error) => console.error('[otorol] hata:', error.message));
    }, 10000);
  });
}

module.exports = { attach, grantToAll, targetIds };
