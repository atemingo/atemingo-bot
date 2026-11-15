'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { t } = require('./i18n');

const GOLD = 0xd4af37;

async function fetchVersion(config) {
  try {
    const res = await fetch(config.links.version, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = await res.json();
    return json && typeof json === 'object' ? json : null;
  } catch {
    return null;
  }
}

function downloadRow(config, version) {
  const buttons = [
    new ButtonBuilder().setLabel('Windows').setStyle(ButtonStyle.Link).setURL(version?.url || config.links.windows),
    new ButtonBuilder().setLabel('Linux').setStyle(ButtonStyle.Link).setURL(version?.linux_url || config.links.linux),
    new ButtonBuilder().setLabel('Site').setStyle(ButtonStyle.Link).setURL(config.links.site),
    new ButtonBuilder().setLabel('Discord').setStyle(ButtonStyle.Link).setURL(config.links.discord),
  ];
  return new ActionRowBuilder().addComponents(...buttons);
}

function releaseEmbed(version, config, heading, lang = 'tr') {
  const embed = new EmbedBuilder()
    .setColor(GOLD)
    .setTitle(heading || t(lang, 'surum.title', { version: version.version }))
    .setURL(config.links.site)
    .setFooter({ text: 'atemingo.github.io/AtemingoLauncher' });
  if (version.notes) embed.setDescription(version.notes);
  const platforms = [];
  if (version.url) platforms.push(`Windows: [setup](${version.url})`);
  if (version.linux_url) platforms.push(`Linux: [AppImage](${version.linux_url})`);
  if (version.linux_deb) platforms.push(`Debian: [.deb](${version.linux_deb})`);
  if (platforms.length) embed.addFields({ name: t(lang, 'surum.release'), value: platforms.join('\n') });
  return embed;
}

function statusEmbed(data, config, lang = 'tr') {
  const fields = [
    { name: 'Discord', value: `**${data.discord ?? 0}** ${t(lang, 'durum.discord')}`, inline: true },
    { name: 'Launcher', value: `**${data.launcher ?? 0}** ${t(lang, 'durum.active')}`, inline: true },
  ];
  return new EmbedBuilder()
    .setColor(GOLD)
    .setTitle(t(lang, 'durum.title'))
    .addFields(...fields)
    .setFooter({ text: t(lang, 'durum.updated', { time: new Date().toLocaleTimeString(lang === 'en' ? 'en-GB' : 'tr-TR') }) });
}

module.exports = { GOLD, fetchVersion, downloadRow, releaseEmbed, statusEmbed };
