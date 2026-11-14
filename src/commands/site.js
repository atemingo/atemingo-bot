'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { GOLD } = require('../ui');
const { t, addLangOption, resolveLang } = require('../i18n');

const builder = addLangOption(
  new SlashCommandBuilder()
    .setName('site')
    .setDescription('Atemingo links')
    .setDescriptionLocalizations({ tr: 'Atemingo bağlantıları' }),
);

module.exports = {
  data: builder,
  async run(interaction, { config, store }) {
    const lang = resolveLang(interaction, store, config);
    const embed = new EmbedBuilder()
      .setColor(GOLD)
      .setTitle(t(lang, 'site.title'))
      .setDescription(
        [
          `${t(lang, 'site.site')}: ${config.links.site}`,
          `${t(lang, 'site.github')}: ${config.links.github}`,
          `${t(lang, 'site.discord')}: ${config.links.discord}`,
        ].join('\n'),
      );
    await interaction.reply({ embeds: [embed] });
  },
};
