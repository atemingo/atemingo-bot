'use strict';

const { SlashCommandBuilder } = require('discord.js');
const stats = require('../stats');
const presence = require('../presence');
const { statusEmbed } = require('../ui');
const { addLangOption, resolveLang } = require('../i18n');

const builder = addLangOption(
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Live status: Discord members, server, launcher')
    .setDescriptionLocalizations({ tr: 'Canlı durum: Discord üyeleri, sunucu, launcher' }),
);

module.exports = {
  data: builder,
  async run(interaction, { config, store }) {
    const lang = resolveLang(interaction, store, config);
    await interaction.deferReply();
    const data = await stats.snapshot(
      config,
      interaction.guild?.memberCount ?? 0,
      presence.recentCount(interaction.guild, config),
    );
    await interaction.editReply({ embeds: [statusEmbed(data, config, lang)] });
  },
};
