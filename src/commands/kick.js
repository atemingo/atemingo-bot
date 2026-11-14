'use strict';

const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { GOLD } = require('../ui');
const { t, addLangOption, resolveLang } = require('../i18n');

const builder = addLangOption(
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member')
    .setDescriptionLocalizations({ tr: 'Üyeyi sunucudan at' })
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('Member to kick')
        .setDescriptionLocalizations({ tr: 'Atılacak üye' })
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Reason (sent to the member via DM)')
        .setDescriptionLocalizations({ tr: 'Sebep (üyeye DM ile gönderilir)' })
        .setRequired(false)
        .setMaxLength(300),
    ),
);

module.exports = {
  staffOnly: true,
  data: builder,

  async run(interaction, { config, store }) {
    const lang = resolveLang(interaction, store, config);
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || `${interaction.user.username} (kick)`;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (user.id === interaction.user.id) {
      await interaction.editReply({ content: t(lang, 'kick.self') });
      return;
    }

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      await interaction.editReply({ content: t(lang, 'kick.notMember', { user: user.tag }) });
      return;
    }
    if (!member.kickable) {
      await interaction.editReply({ content: t(lang, 'kick.notKickable', { user: user.tag }) });
      return;
    }

    await member
      .send({
        content: [
          `You were kicked from **${interaction.guild.name}**.`,
          '',
          `Reason: ${reason}`,
          `Rejoin: ${config.links.discord}`,
        ].join('\n'),
      })
      .catch(() => {});

    const ok = await member.kick(reason).then(() => true).catch(() => false);
    if (!ok) {
      await interaction.editReply({ content: t(lang, 'kick.notKickable', { user: user.tag }) });
      return;
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(GOLD)
          .setTitle(t(lang, 'kick.title'))
          .setDescription(t(lang, 'kick.done', { user: `<@${user.id}>` }))
          .addFields(
            { name: t(lang, 'unban.reason'), value: reason.slice(0, 300), inline: false },
            { name: 'Yetkili', value: interaction.user.tag, inline: true },
          ),
      ],
    });

    const logId = config.moderation?.logChannel;
    if (logId) {
      const channel = await interaction.client.channels.fetch(logId).catch(() => null);
      if (channel?.isTextBased()) {
        await channel
          .send({
            embeds: [
              new EmbedBuilder()
                .setColor(GOLD)
                .setTitle(t(lang, 'kick.title'))
                .addFields(
                  { name: 'Kullanıcı', value: `${user.tag} (<@${user.id}>)` },
                  { name: 'Yetkili', value: interaction.user.tag, inline: true },
                  { name: t(lang, 'unban.reason'), value: reason.slice(0, 300), inline: true },
                ),
            ],
          })
          .catch(() => {});
      }
    }
  },
};
