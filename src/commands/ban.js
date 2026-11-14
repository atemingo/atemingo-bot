'use strict';

const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { GOLD } = require('../ui');
const { t, addLangOption, resolveLang } = require('../i18n');

const builder = addLangOption(
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member')
    .setDescriptionLocalizations({ tr: 'Üyeyi banla' })
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('Member to ban')
        .setDescriptionLocalizations({ tr: 'Banlanacak üye' })
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Reason')
        .setDescriptionLocalizations({ tr: 'Sebep' })
        .setRequired(false)
        .setMaxLength(300),
    )
    .addIntegerOption((option) =>
      option
        .setName('delete_days')
        .setDescription('Delete messages from the last N days (0-7)')
        .setDescriptionLocalizations({ tr: 'Son N günün mesajlarını sil (0-7)' })
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false),
    ),
);

module.exports = {
  staffOnly: true,
  data: builder,

  async run(interaction, { config, store }) {
    const lang = resolveLang(interaction, store, config);
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || `${interaction.user.username} (ban)`;
    const days = interaction.options.getInteger('delete_days') || 0;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (user.id === interaction.user.id) {
      await interaction.editReply({ content: t(lang, 'ban.self') });
      return;
    }

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      await interaction.editReply({ content: t(lang, 'ban.notMember', { user: user.tag }) });
      return;
    }
    if (!member.bannable) {
      await interaction.editReply({ content: t(lang, 'ban.notBannable', { user: user.tag }) });
      return;
    }

    const ok = await interaction.guild.members
      .ban(user.id, { reason, deleteMessageSeconds: Math.min(days, 7) * 86400 })
      .then(() => true)
      .catch(() => false);

    if (!ok) {
      await interaction.editReply({ content: t(lang, 'ban.notBannable', { user: user.tag }) });
      return;
    }

    const users = store.meta().users || {};
    if (users[user.id]?.mod) {
      users[user.id].mod.strikes = 0;
      users[user.id].mod.at = 0;
      store.save();
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(GOLD)
          .setTitle(t(lang, 'ban.title'))
          .setDescription(t(lang, 'ban.done', { user: `<@${user.id}>` }))
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
                .setTitle(t(lang, 'ban.title'))
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
