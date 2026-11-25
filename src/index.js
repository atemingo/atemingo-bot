'use strict';

const fs = require('node:fs');
const path = require('node:path');

try {
  process.loadEnvFile(path.join(__dirname, '..', '.env'));
} catch {
  // .env yoksa ortam degiskenleri kullanilir
}

const { Client, GatewayIntentBits, Partials, Events } = require('discord.js');
const config = require('./config');
const store = require('./store');
const handlers = require('./handlers');

function parseTokens(raw) {
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const cut = entry.indexOf(':');
      return cut === -1 ? { id: '', token: entry } : { id: entry.slice(0, cut).trim(), token: entry.slice(cut + 1).trim() };
    })
    .filter((entry) => entry.token);
}

const tokens = parseTokens(process.env.BOT_TOKENS || process.env.BOT_TOKEN || '');
if (!tokens.length) {
  console.error('[bot] BOT_TOKENS bos. .env dosyasina <id>:<token> yaz.');
  process.exit(1);
}

const commands = [];
const commandMap = new Map();
const commandDir = path.join(__dirname, 'commands');

for (const file of fs.readdirSync(commandDir).filter((name) => name.endsWith('.js'))) {
  const command = require(path.join(commandDir, file));
  if (!command?.data?.name || typeof command.run !== 'function') {
    console.error(`[bot] ${file} atlandi (data.name veya run eksik)`);
    continue;
  }
  commandMap.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

const body = commands;

const clients = tokens.map((entry, index) => {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildPresences,
    ],
    partials: [Partials.GuildMember],
  });
  client.commands = commandMap;
  client.tokenValue = entry.token;
  client.isPrimary = index === 0;
  handlers.attach(client, config, store);
  return client;
});

// Bir bot 20 sn içinde hazır olmazsa boot kilitlenmesin; kalanlarla devam edilir.
const readyPromises = clients.map(
  (client) =>
    new Promise((resolve) => {
      const timer = setTimeout(() => {
        console.error(`[bot] ${client.tokenValue.slice(0, 8)}… 20 sn içinde hazır olmadı`);
        resolve(null);
      }, 20000);
      client.once(Events.ClientReady, () => {
        clearTimeout(timer);
        resolve(client);
      });
    }),
);

async function registerCommands(client, applicationId) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const res = await fetch(`https://discord.com/api/v10/applications/${applicationId}/commands`, {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${client.tokenValue}`,
        'Content-Type': 'application/json',
        'User-Agent': 'atemingo-bot',
      },
      body: JSON.stringify(body),
    });
    if (res.status === 429) {
      const wait = Number((await res.json().catch(() => ({}))).retry_after) || 10;
      console.error(`[bot] komut kaydi 429, ${wait}s bekleniyor (deneme ${attempt}/3)`);
      await new Promise((resolve) => setTimeout(resolve, wait * 1000 + 500));
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
    return res.json();
  }
  throw new Error('komut kaydi rate limit yuzunden tamamlanamadi');
}

async function boot() {
  await store.load();

  for (const client of clients) {
    client.once(Events.ClientReady, async (ready) => {
      console.log(`[bot] ${ready.user.tag} hazir (${ready.guilds.cache.size} sunucu)`);
      try {
        const registered = await registerCommands(client, ready.user.id);
        console.log(`[bot] ${ready.user.tag} ${registered.length} komut kaydedildi`);
      } catch (error) {
        console.error(`[bot] ${ready.user.tag} komut kaydi basarisiz:`, error.message);
      }
    });
    client.login(client.tokenValue).catch((error) => {
      console.error('[bot] giris basarisiz:', error.message);
    });
  }

  const readies = (await Promise.all(readyPromises)).filter(Boolean);
  if (!readies.length) throw new Error('hiçbir bot hazır olmadı');
  handlers.startWatcher(readies[0], config, store);
  handlers.startStats(readies, config, store);
  console.log(`[bot] ${readies.length}/${clients.length} bot canli, durum dongusu basladi`);
  scheduleRelaunch();
}

// Actions isi 6 saatte kesiliyor ve zamanlanmis tetikler gecikebiliyor.
// 5. saatte yeni kosu tetiklenir; concurrency ayari eskisini iptal eder.
function scheduleRelaunch() {
  if (process.env.GITHUB_ACTIONS !== 'true') return;
  const repo = process.env.GH_STATE_REPO;
  const token = process.env.GH_STATE_TOKEN;
  if (!repo || !token) return;
  setTimeout(async () => {
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/bot.yml/dispatches`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'atemingo-bot',
        },
        body: JSON.stringify({ ref: 'main' }),
      });
      console.log(`[bot] yeniden baslatma tetigi: ${res.status}`);
      if (!res.ok) console.error(`[bot] tetik reddedildi: ${(await res.text()).slice(0, 200)}`);
    } catch (error) {
      console.error('[bot] yeniden baslatma hatasi:', error.message);
    }
  }, 5 * 60 * 60 * 1000);
}

async function shutdown(signal) {
  console.log(`[bot] ${signal} alindi, kapatiliyor`);
  await store.flush();
  for (const client of clients) await client.destroy().catch(() => {});
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

boot().catch((error) => {
  console.error('[bot] baslatma hatasi:', error);
  process.exit(1);
});
