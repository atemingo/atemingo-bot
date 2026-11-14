'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { GOLD, fetchVersion, downloadRow } = require('../ui');
const { t, addLangOption, resolveLang } = require('../i18n');

const builder = addLangOption(
  new SlashCommandBuilder()
    .setName('download')
    .setDescription('Atemingo Launcher download links')
    .setDescriptionLocalizations({ tr: 'Atemingo Launcher indirme bağlantıları' }),
);

module.exports = {
  data: builder,
  async run(interaction, { config, store }) {
    const lang = resolveLang(interaction, store, config);
    await interaction.deferReply();
    const version = await fetchVersion(config);
    const embed = new EmbedBuilder()
      .setColor(GOLD)
      .setTitle(version ? `Atemingo Launcher v${version.version}` : 'Atemingo Launcher')
      .setURL(config.links.site)
      .setDescription(t(lang, 'indir.desc'))
      .setThumbnail(`${config.links.site}/icon.png`)
      .addFields(
        { name: t(lang, 'indir.windows'), value: `[${t(lang, 'indir.windows')}](${version?.url || config.links.windows})`, inline: true },
        { name: t(lang, 'indir.linux'), value: `[${t(lang, 'indir.linux')}](${version?.linux_url || config.links.linux})`, inline: true },
        { name: t(lang, 'indir.github'), value: `[GitHub](${config.links.github})`, inline: true },
      )
      .setFooter({ text: t(lang, 'indir.footer') });
    await interaction.editReply({ embeds: [embed], components: [downloadRow(config, version)] });
  },
};
