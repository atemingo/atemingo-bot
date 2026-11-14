'use strict';

const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { GOLD } = require('../ui');
const { t, addLangOption, resolveLang } = require('../i18n');

const MAX_MINUTES = 40320;

const builder = addLangOption(
  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Timeout a member (0 lifts it)')
    .setDescriptionLocalizations({ tr: 'Üyeye zaman aşımı at (0 kaldırır)' })
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('Member')
        .setDescriptionLocalizations({ tr: 'Üye' })
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName('minutes')
        .setDescription('Duration in minutes (0 lifts the timeout)')
        .setDescriptionLocalizations({ tr: 'Dakika cinsinden süre (0 kaldırır)' })
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(MAX_MINUTES),
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
    const user = interaction.options.getUser('user', true);
    const minutes = interaction.options.getInteger('minutes', true);
    const reason = interaction.options.getString('reason') || `${interaction.user.username} (mute)`;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      await interaction.editReply({ content: t(lang, 'mute.notMember', { user: user.tag }) });
      return;
    }
    if (!member.moderatable) {
      await interaction.editReply({ content: t(lang, 'mute.notModeratable', { user: user.tag }) });
      return;
    }

    if (minutes === 0) {
      const ok = await member.timeout(null, reason).then(() => true).catch(() => false);
      await interaction.editReply({ content: t(lang, ok ? 'mute.removed' : 'mute.failed', { user: user.tag }) });
      return;
    }

    const ms = Math.min(minutes, MAX_MINUTES) * 60000;
    const ok = await member.timeout(ms, reason).then(() => true).catch(() => false);
    if (!ok) {
      await interaction.editReply({ content: t(lang, 'mute.failed', { user: user.tag }) });
      return;
    }

    const label = minutes >= 1440 ? `${Math.round(minutes / 1440)} gün` : minutes >= 60 ? `${Math.round(minutes / 60)} saat` : `${minutes} dk`;

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(GOLD)
          .setTitle(t(lang, 'mute.title'))
          .setDescription(t(lang, 'mute.done', { user: `<@${user.id}>`, time: label }))
          .setFooter({ text: reason.slice(0, 200) }),
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
                .setTitle(t(lang, 'mute.title'))
                .addFields(
                  { name: 'Kullanıcı', value: `${user.tag} (<@${user.id}>)` },
                  { name: 'Süre', value: label, inline: true },
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
