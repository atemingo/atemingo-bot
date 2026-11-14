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
    .setName('lock')
    .setDescription('Lock or unlock a channel for @everyone')
    .setDescriptionLocalizations({ tr: 'Kanalı @everyone için kilitle veya aç' })
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('Channel (defaults to this one)')
        .setDescriptionLocalizations({ tr: 'Kanal (boşsa bu kanal)' })
        .setRequired(false),
    )
    .addBooleanOption((option) =>
      option
        .setName('unlock')
        .setDescription('Lift the lock instead of applying it')
        .setDescriptionLocalizations({ tr: 'Kilit uygulamak yerine kaldır' })
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
    const unlock = interaction.options.getBoolean('unlock') || false;
    const reason = interaction.options.getString('reason') || `${interaction.user.username} (${unlock ? 'unlock' : 'lock'})`;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const channel = target
      ? await interaction.guild.channels.fetch(target.id).catch(() => null)
      : interaction.channel;

    if (!channel || !LOCKABLE.has(channel.type)) {
      await interaction.editReply({ content: t(lang, 'lock.notChannel') });
      return;
    }

    const overwrite = {
      SendMessages: unlock ? null : false,
      SendMessagesInThreads: unlock ? null : false,
      AddReactions: unlock ? null : false,
    };

    const ok = await channel.permissionOverwrites
      .edit(interaction.guild.roles.everyone, overwrite, { reason })
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
          .setTitle(t(lang, unlock ? 'lock.unlockedTitle' : 'lock.title'))
          .setDescription(t(lang, unlock ? 'lock.unlocked' : 'lock.locked', { channel: `<#${channel.id}>` }))
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
                .setTitle(t(lang, unlock ? 'lock.unlockedTitle' : 'lock.title'))
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
