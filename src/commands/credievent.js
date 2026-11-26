'use strict';

const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { t, addLangOption, resolveLang } = require('../i18n');
const events = require('../creditevent');

const MAX_MINUTES = 365 * 1440;

function parseDuration(raw) {
  const text = String(raw || '').trim().toLowerCase().replace(/\s+/g, '');
  const minutes = /^(\d{1,6})(dk|dakika|m|min)?$/.exec(text);
  if (minutes) return Number(minutes[1]);
  const days = /^(\d{1,5})(g|gun|gün|d|day)$/.exec(text);
  if (days) return Number(days[1]) * 1440;
  return 0;
}

const builder = addLangOption(
  new SlashCommandBuilder()
    .setName('credievent')
    .setDescription('Start a launcher credit event')
    .setDescriptionLocalizations({ tr: 'Launcher kredi etkinliği başlat' })
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) =>
      option
        .setName('sure')
        .setDescription('Duration — e.g. 30dk, 90m, 2g')
        .setDescriptionLocalizations({ tr: 'Süre — ör. 30dk, 90m, 2g' })
        .setMinLength(1)
        .setMaxLength(10)
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
    const raw = interaction.options.getString('sure');
    const credits = interaction.options.getInteger('credits');
    const minutes = parseDuration(raw);
    if (minutes < 1 || minutes > MAX_MINUTES) {
      await interaction.reply({ content: t(lang, 'creditevent.badDuration'), flags: MessageFlags.Ephemeral });
      return;
    }
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
