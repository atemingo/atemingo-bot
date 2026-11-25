'use strict';

const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { t, addLangOption, resolveLang } = require('../i18n');
const events = require('../creditevent');

const builder = addLangOption(
  new SlashCommandBuilder()
    .setName('creditevent')
    .setDescription('Start a launcher credit event')
    .setDescriptionLocalizations({ tr: 'Launcher kredi etkinliği başlat' })
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addIntegerOption((option) =>
      option
        .setName('minutes')
        .setDescription('Event duration in minutes')
        .setDescriptionLocalizations({ tr: 'Etkinlik süresi (dakika)' })
        .setMinValue(1)
        .setMaxValue(10080)
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName('credits')
        .setDescription('Credits awarded to the winner')
        .setDescriptionLocalizations({ tr: 'Kazanana verilecek kredi' })
        .setMinValue(1)
        .setMaxValue(1000000)
        .setRequired(true),
    ),
);

module.exports = {
  staffOnly: true,
  data: builder,

  async run(interaction, { client, config, store }) {
    const lang = resolveLang(interaction, store, config);
    const minutes = interaction.options.getInteger('minutes');
    const credits = interaction.options.getInteger('credits');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const event = await events.create(client, config, store, interaction, minutes, credits, lang);
    if (!event) {
      await interaction.editReply({ content: t(lang, 'creditevent.failed') });
      return;
    }
    await interaction.editReply({ content: t(lang, 'creditevent.posted', { channel: `<#${event.channelId}>` }) });
  },

  attach(client, config, store) {
    events.attach(client, config, store);
  },
};
