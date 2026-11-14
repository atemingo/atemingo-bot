'use strict';

const net = require('node:net');
const dns = require('node:dns').promises;

const PROTOCOL = 772;
const CACHE_MS = 45 * 1000;

function writeVarInt(value) {
  const bytes = [];
  let rest = value >>> 0;
  do {
    let byte = rest & 0x7f;
    rest >>>= 7;
    if (rest) byte |= 0x80;
    bytes.push(byte);
  } while (rest);
  return Buffer.from(bytes);
}

function readVarInt(buffer, offset) {
  let value = 0;
  let shift = 0;
  let index = offset;
  while (index < buffer.length) {
    const byte = buffer[index];
    index += 1;
    value |= (byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) return [value >>> 0, index];
    shift += 7;
    if (shift > 35) return null;
  }
  return null;
}

function parseStatus(buffer) {
  const head = readVarInt(buffer, 0);
  if (!head) return null;
  const [length, start] = head;
  if (buffer.length < start + length) return null;
  const packet = readVarInt(buffer, start);
  if (!packet || packet[0] !== 0) return null;
  const text = readVarInt(buffer, packet[1]);
  if (!text) return null;
  const [textLength, textStart] = text;
  if (buffer.length < textStart + textLength) return null;
  try {
    return JSON.parse(buffer.slice(textStart, textStart + textLength).toString('utf8'));
  } catch {
    return null;
  }
}

async function resolveTarget(host, port) {
  if (port) return { host, port };
  try {
    const records = await dns.resolveSrv(`_minecraft._tcp.${host}`);
    if (records.length) return { host: records[0].name, port: records[0].port };
  } catch {
    // SRV yok: varsayilan port
  }
  return { host, port: 25565 };
}

function ping(host, port, timeout) {
  return new Promise((resolve) => {
    let settled = false;
    let data = Buffer.alloc(0);

    const socket = net.createConnection({ host, port });
    const finish = (value) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(timeout);
    socket.on('timeout', () => finish(null));
    socket.on('error', () => finish(null));
    socket.on('close', () => finish(null));

    socket.on('connect', () => {
      const hostName = Buffer.from(host, 'utf8');
      const handshake = Buffer.concat([
        Buffer.from([0x00]),
        writeVarInt(PROTOCOL),
        writeVarInt(hostName.length),
        hostName,
        Buffer.from([(port >> 8) & 0xff, port & 0xff]),
        Buffer.from([0x01]),
      ]);
      socket.write(Buffer.concat([writeVarInt(handshake.length), handshake]));
      const request = Buffer.from([0x00]);
      socket.write(Buffer.concat([writeVarInt(request.length), request]));
    });

    socket.on('data', (chunk) => {
      data = Buffer.concat([data, chunk]);
      const parsed = parseStatus(data);
      if (parsed) finish(parsed);
    });
  });
}

async function minecraftStatus(config) {
  const server = (config.servers || [])[0];
  if (!server?.ip) return null;
  const [host, portText] = server.ip.split(':');
  const port = portText ? Number(portText) : 0;
  try {
    const target = await resolveTarget(host, port);
    const status = await ping(target.host, target.port, 4000);
    if (!status?.players) return null;
    return {
      online: status.players.online ?? 0,
      max: status.players.max ?? 0,
      version: status.version?.name || '',
      name: server.name || host,
    };
  } catch {
    return null;
  }
}

// Launcher'in gercek kullanicilari: friends-server'daki /launcher/ping kayitlari.
// Uc yalnizca PLUGIN_KEY ile acilir; yoksa sayi gosterilmez.
async function launcherActive(config) {
  const url = config.stats?.launcherUrl;
  if (!url) return null;
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/stats`, {
      headers: { 'User-Agent': 'atemingo-bot' },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return typeof json.online === 'number' ? json.online : null;
  } catch {
    return null;
  }
}

let cache = { at: 0, value: null };

async function snapshot(config, guildCount) {
  if (Date.now() - cache.at < CACHE_MS && cache.value) {
    return { ...cache.value, discord: guildCount };
  }
  const [minecraft, launcher] = await Promise.all([minecraftStatus(config), launcherActive(config)]);
  const value = { at: Date.now(), minecraft, launcher };
  cache = value;
  return { ...value, discord: guildCount };
}

function presenceText(data) {
  const parts = [`DISCORD: ${data.discord ?? 0}`];
  if (data.minecraft) parts.push(`MINECRAFT: ${data.minecraft.online}`);
  if (data.launcher !== null && data.launcher !== undefined) parts.push(`LAUNCHER: ${data.launcher}`);
  return parts.join(' • ');
}

module.exports = { snapshot, presenceText, minecraftStatus, launcherActive };
