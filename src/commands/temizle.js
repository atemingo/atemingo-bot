'use strict';

const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { GOLD } = require('../ui');
const { t, addLangOption, resolveLang } = require('../i18n');

const builder = addLangOption(
  new SlashCommandBuilder()
    .setName('temizle')
    .setDescription('Delete the last N messages in a channel')
    .setDescriptionLocalizations({ tr: 'Kanaldaki son N mesajı sil' })
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((option) =>
      option
        .setName('miktar')
        .setDescription('How many messages (1-100)')
        .setDescriptionLocalizations({ tr: 'Kaç mesaj (1-100)' })
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100),
    )
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('Channel (defaults to this one)')
        .setDescriptionLocalizations({ tr: 'Kanal (boşsa bu kanal)' })
        .setRequired(false),
    ),
);

module.exports = {
  staffOnly: true,
  data: builder,

  async run(interaction, { config, store }) {
    const lang = resolveLang(interaction, store, config);
    const amount = interaction.options.getInteger('miktar', true);
    const target = interaction.options.getChannel('channel');

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const channel = target
      ? await interaction.guild.channels.fetch(target.id).catch(() => null)
      : interaction.channel;

    if (!channel?.isTextBased() || typeof channel.bulkDelete !== 'function') {
      await interaction.editReply({ content: t(lang, 'temizle.failed') });
      return;
    }

    const deleted = await channel.bulkDelete(amount, true).catch(() => null);
    if (!deleted) {
      await interaction.editReply({ content: t(lang, 'temizle.failed') });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(GOLD)
      .setTitle(t(lang, 'temizle.title'))
      .setDescription(t(lang, 'temizle.done', { count: deleted.size, channel: `<#${channel.id}>` }));

    if (deleted.size < amount) {
      embed.setFooter({ text: t(lang, 'temizle.old', { count: amount - deleted.size }) });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
