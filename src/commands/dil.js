'use strict';

const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { t, LANG_NAMES, addLangOption, resolveLang } = require('../i18n');

const builder = addLangOption(
  new SlashCommandBuilder()
    .setName('language')
    .setDescription('Response language')
    .setDescriptionLocalizations({ tr: 'Yanıt dili' }),
);

module.exports = {
  data: builder,
  async run(interaction, { config, store }) {
    const lang = resolveLang(interaction, store, config);
    await interaction.reply({
      content: t(lang, 'dil.set', { lang: LANG_NAMES[lang] }),
      flags: MessageFlags.Ephemeral,
    });
  },
};
