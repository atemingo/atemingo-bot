'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { fetchVersion, releaseEmbed, downloadRow } = require('../ui');
const { t, addLangOption, resolveLang } = require('../i18n');

const builder = addLangOption(
  new SlashCommandBuilder()
    .setName('version')
    .setDescription('Current version and release notes')
    .setDescriptionLocalizations({ tr: 'Yayındaki sürüm numarası ve değişiklik notları' }),
);

module.exports = {
  data: builder,
  async run(interaction, { config, store }) {
    const lang = resolveLang(interaction, store, config);
    await interaction.deferReply();
    const version = await fetchVersion(config);
    if (!version?.version) {
      await interaction.editReply({ content: t(lang, 'surum.noData', { site: config.links.site }) });
      return;
    }
    await interaction.editReply({
      embeds: [releaseEmbed(version, config, null, lang)],
      components: [downloadRow(config, version)],
    });
  },
};
