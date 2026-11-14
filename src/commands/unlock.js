'use strict';

const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits, ChannelType } = require('discord.js');
const { GOLD } = require('../ui');
const { t, addLangOption, resolveLang } = require('../i18n');

const LOCKABLE = new Set([
  ChannelType.GuildText,
  ChannelType.GuildAnnouncement,
  ChannelType.GuildForum,
  ChannelType.GuildVoice,
]);

const builder = addLangOption(
  new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock a locked channel for @everyone')
    .setDescriptionLocalizations({ tr: 'Kilitli kanalı @everyone için aç' })
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('Channel (defaults to this one)')
        .setDescriptionLocalizations({ tr: 'Kanal (boşsa bu kanal)' })
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Reason')
        .setDescriptionLocalizations({ tr: 'Sebep' })
        .setRequired(false)
        .setMaxLength(300),
    ),
);

module.exports = {
  staffOnly: true,
  data: builder,

  async run(interaction, { config, store }) {
    const lang = resolveLang(interaction, store, config);
    const target = interaction.options.getChannel('channel');
    const reason = interaction.options.getString('reason') || `${interaction.user.username} (unlock)`;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const channel = target
      ? await interaction.guild.channels.fetch(target.id).catch(() => null)
      : interaction.channel;

    if (!channel || !LOCKABLE.has(channel.type)) {
      await interaction.editReply({ content: t(lang, 'lock.notChannel') });
      return;
    }

    const ok = await channel.permissionOverwrites
      .edit(
        interaction.guild.roles.everyone,
        { SendMessages: null, SendMessagesInThreads: null, AddReactions: null },
        { reason },
      )
      .then(() => true)
      .catch(() => false);

    if (!ok) {
      await interaction.editReply({ content: t(lang, 'lock.failed', { channel: `<#${channel.id}>` }) });
      return;
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(GOLD)
          .setTitle(t(lang, 'lock.unlockedTitle'))
          .setDescription(t(lang, 'lock.unlocked', { channel: `<#${channel.id}>` }))
          .setFooter({ text: reason.slice(0, 200) }),
      ],
    });

    const logId = config.moderation?.logChannel;
    if (logId) {
      const log = await interaction.client.channels.fetch(logId).catch(() => null);
      if (log?.isTextBased()) {
        await log
          .send({
            embeds: [
              new EmbedBuilder()
                .setColor(GOLD)
                .setTitle(t(lang, 'lock.unlockedTitle'))
                .addFields(
                  { name: 'Kanal', value: `<#${channel.id}>`, inline: true },
                  { name: 'Yetkili', value: interaction.user.tag, inline: true },
                  { name: t(lang, 'unban.reason'), value: reason.slice(0, 300) },
                ),
            ],
          })
          .catch(() => {});
      }
    }
  },
};
