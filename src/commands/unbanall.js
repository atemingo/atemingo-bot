'use strict';

const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { GOLD } = require('../ui');
const { t, addLangOption, resolveLang } = require('../i18n');

const builder = addLangOption(
  new SlashCommandBuilder()
    .setName('unbanall')
    .setDescription('Lift every ban')
    .setDescriptionLocalizations({ tr: 'Tüm banları kaldır' })
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addBooleanOption((option) =>
      option
        .setName('confirm')
        .setDescription('Confirm lifting every ban')
        .setDescriptionLocalizations({ tr: 'Tüm banları kaldırmayı onayla' })
        .setRequired(true),
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
    const confirm = interaction.options.getBoolean('confirm', true);
    const reason = interaction.options.getString('reason') || `${interaction.user.username} (unbanall)`;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!confirm) {
      await interaction.editReply({ content: t(lang, 'unbanall.needConfirm') });
      return;
    }

    const bans = await interaction.guild.bans.fetch().catch(() => null);
    if (!bans) {
      await interaction.editReply({ content: t(lang, 'unbanall.failed') });
      return;
    }
    if (bans.size === 0) {
      await interaction.editReply({ content: t(lang, 'unbanall.none') });
      return;
    }

    let ok = 0;
    let failed = 0;
    const users = store.meta().users || {};
    for (const ban of bans.values()) {
      const removed = await interaction.guild.bans
        .remove(ban.user.id, reason)
        .then(() => true)
        .catch(() => false);
      if (removed) {
        ok += 1;
        if (users[ban.user.id]?.mod) {
          users[ban.user.id].mod.strikes = 0;
          users[ban.user.id].mod.at = 0;
        }
      } else failed += 1;
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    if (ok) store.save();

    const embed = new EmbedBuilder()
      .setColor(GOLD)
      .setTitle(t(lang, 'unbanall.title'))
      .setDescription(t(lang, 'unbanall.done', { ok, failed, total: bans.size }))
      .addFields({ name: t(lang, 'unban.reason'), value: reason.slice(0, 300) });

    await interaction.editReply({ embeds: [embed] });

    const logId = config.moderation?.logChannel;
    if (logId) {
      const channel = await interaction.client.channels.fetch(logId).catch(() => null);
      if (channel?.isTextBased()) {
        await channel
          .send({
            embeds: [
              new EmbedBuilder()
                .setColor(GOLD)
                .setTitle(t(lang, 'unbanall.logTitle'))
                .addFields(
                  { name: 'Yetkili', value: `${interaction.user.tag}`, inline: true },
                  { name: 'Kaldırılan', value: String(ok), inline: true },
                  { name: 'Başarısız', value: String(failed), inline: true },
                  { name: t(lang, 'unban.reason'), value: reason.slice(0, 300) },
                ),
            ],
          })
          .catch(() => {});
      }
    }
  },
};
