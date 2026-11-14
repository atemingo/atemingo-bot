'use strict';

const { Events, PermissionFlagsBits } = require('discord.js');
const { t } = require('./i18n');

const TR_CHARS = /[çğıöşüÇĞİÖŞÜ]/;
const TR_WORDS =
  /\b(bir|nasıl|nerede|nereden|nerden|indir|indire|değil|için|yok|var|teşekkür|merhaba|selam|lütfen|hangi|çalış|açıl|hata|sorun|yardım|bekliyorum|olur|mı|mi|mu|mü)\b/i;

const DOWNLOAD =
  /(indir|download|setup|kurulum|kurmak|kurucam|kuraca|install|nerden|nereden|link|dosya|exe|msi|\.deb|get it|where do i)/i;
const TRUST =
  /(\brat\b|trojan|virüs|virus|token ?steal|stealer|keylog|malware|truva|backdoor|arka ?kap|zararlı|false positive|virustotal|tehlikeli|güvenli|safe|antivir|defender|malicious)/i;
const WINDOWS = /(\bwindows\b|\bwin ?(?:10|11)\b|\bw10\b|\bw11\b)/i;
const LINUX = /(\blinux\b|ubuntu|debian|mint|arch|fedora|manjaro|pop!?_?os|\bdeb\b|\bgnu\b)/i;

const OS_WINDOW = 30 * 60 * 1000;
const FALLBACK_THROTTLE = 10 * 60 * 1000;

function detectLang(text) {
  if (TR_CHARS.test(text)) return 'tr';
  return TR_WORDS.test(text) ? 'tr' : 'en';
}

function isStaff(message, config) {
  const member = message.member;
  if (!member) return false;
  if (member.permissions?.has(PermissionFlagsBits.Administrator)) return true;
  return (config.staffRoleIds || []).some((id) => id && member.roles.cache.has(id));
}

function linkFor(os, config, lang) {
  const links = config.links || {};
  if (os === 'windows') return t(lang, 'auto.windows', { windows: links.windows });
  if (os === 'linux') return t(lang, 'auto.linux', { linux: links.linux });
  return t(lang, 'auto.siteOnly', { site: links.site });
}

async function respond(message, config, store) {
  const channel = message.channel;
  const topic = channel.topic || '';
  if (!/^ticket:\d{15,20}/.test(topic)) return;
  if (message.author.bot) return;
  if (isStaff(message, config)) return;

  const text = message.content || '';
  if (!text.trim()) return;

  const lang = detectLang(text);
  const meta = store.meta();
  const tickets = (meta.tickets = meta.tickets || {});
  const record = (tickets[channel.id] = tickets[channel.id] || {});
  const now = Date.now();

  const os = WINDOWS.test(text) ? 'windows' : LINUX.test(text) ? 'linux' : null;
  const awaitingOs = record.osAwait && now - record.osAwait < OS_WINDOW;

  let reply = null;
  let fallback = false;

  if (awaitingOs && os) {
    reply = linkFor(os, config, lang);
    record.osAwait = 0;
  } else if (os && record.askedOs) {
    reply = linkFor(os, config, lang);
    record.askedOs = 0;
    record.osAwait = 0;
  } else if (DOWNLOAD.test(text)) {
    if (os) {
      reply = linkFor(os, config, lang);
      record.osAwait = 0;
    } else {
      reply = t(lang, 'auto.askOs');
      record.osAwait = now;
      record.askedOs = now;
    }
  } else if (TRUST.test(text)) {
    reply = t(lang, 'auto.trust', { github: config.links?.github, site: config.links?.site });
  } else {
    reply = t(lang, 'auto.founder', { owner: channel.guild.ownerId });
    fallback = true;
  }

  if (!reply) return;
  if (fallback) {
    if (record.lastFallback && now - record.lastFallback < FALLBACK_THROTTLE) return;
    record.lastFallback = now;
  }
  store.save();

  await message
    .reply({ content: reply, allowedMentions: { repliedUser: false } })
    .catch(() => {});
}

function attach(client, config, store) {
  if (config.ticketAuto?.enabled === false) return;
  client.on(Events.MessageCreate, (message) => {
    if (message.author.bot || !message.guild) return;
    respond(message, config, store).catch((error) => console.error('[ticketauto] hata:', error.message));
  });
}

module.exports = { attach, respond, detectLang };
