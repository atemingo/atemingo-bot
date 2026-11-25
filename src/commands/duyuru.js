'use strict';

const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { GOLD } = require('../ui');
const { t, addLangOption, resolveLang } = require('../i18n');

const builder = addLangOption(
  new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Post an announcement')
    .setDescriptionLocalizations({ tr: 'Duyuru gönder' })
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) =>
      option
        .setName('title')
        .setDescription('Title')
        .setDescriptionLocalizations({ tr: 'Başlık' })
        .setRequired(true)
        .setMaxLength(200),
    )
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('Message')
        .setDescriptionLocalizations({ tr: 'İçerik' })
        .setRequired(true)
        .setMaxLength(3500),
    )
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('Target channel')
        .setDescriptionLocalizations({ tr: 'Hedef kanal' })
        .setRequired(false),
    )
    .addBooleanOption((option) =>
      option
        .setName('mention')
        .setDescription('Mention @everyone')
        .setDescriptionLocalizations({ tr: '@everyone etiketle' })
        .setRequired(false),
    ),
);

module.exports = {
  staffOnly: true,
  data: builder,

  async run(interaction, { config, store }) {
    const lang = resolveLang(interaction, store, config);
    const title = interaction.options.getString('title');
    const message = interaction.options.getString('message');
    const target = interaction.options.getChannel('channel');
    const mention = interaction.options.getBoolean('mention') || false;

    const channelId = target?.id || interaction.channelId;
    const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      await interaction.reply({ content: t(lang, 'duyuru.badChannel'), flags: MessageFlags.Ephemeral });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(GOLD)
      .setTitle(title)
      .setDescription(message)
      .setFooter({ text: `${interaction.user.username} · ${new Date().toLocaleString(lang === 'en' ? 'en-GB' : 'tr-TR')}` });

    await channel.send({ content: mention ? '@everyone' : undefined, embeds: [embed] });
    await interaction.reply({
      content: t(lang, 'duyuru.sent', { channel: channel.id }),
      flags: MessageFlags.Ephemeral,
    });
  },
};
