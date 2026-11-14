'use strict';

const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { GOLD } = require('../ui');
const { t, addLangOption, resolveLang } = require('../i18n');

const builder = addLangOption(
  new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Lift a ban')
    .setDescriptionLocalizations({ tr: 'Ban kaldır' })
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((option) =>
      option
        .setName('user_id')
        .setDescription('User ID or username#tag')
        .setDescriptionLocalizations({ tr: 'Kullanıcı ID veya ad#etiket' })
        .setRequired(true)
        .setMaxLength(64),
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

async function resolveBan(guild, query) {
  const cleaned = query.trim().replace(/^<@!?/, '').replace(/>$/, '');
  if (/^\d{15,20}$/.test(cleaned)) {
    const ban = await guild.bans.fetch(cleaned).catch(() => null);
    return ban || null;
  }
  const bans = await guild.bans.fetch().catch(() => null);
  if (!bans) return null;
  const needle = cleaned.toLowerCase();
  return (
    bans.find((ban) => ban.user.username.toLowerCase() === needle) ||
    bans.find((ban) => `${ban.user.username}#${ban.user.discriminator}`.toLowerCase() === needle) ||
    bans.find((ban) => ban.user.tag?.toLowerCase() === needle) ||
    null
  );
}

module.exports = {
  staffOnly: true,
  data: builder,

  async run(interaction, { config, store }) {
    const lang = resolveLang(interaction, store, config);
    const query = interaction.options.getString('user_id', true);
    const reason = interaction.options.getString('reason') || `${interaction.user.username} (unban)`;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const ban = await resolveBan(interaction.guild, query);
    if (!ban) {
      await interaction.editReply({ content: t(lang, 'unban.notFound', { query }) });
      return;
    }

    const removed = await interaction.guild.bans
      .remove(ban.user.id, reason)
      .then(() => true)
      .catch(() => false);

    if (!removed) {
      await interaction.editReply({ content: t(lang, 'unban.failed', { user: ban.user.tag }) });
      return;
    }

    const users = store.meta().users || {};
    if (users[ban.user.id]?.mod) {
      users[ban.user.id].mod.strikes = 0;
      users[ban.user.id].mod.at = 0;
      store.save();
    }

    const embed = new EmbedBuilder()
      .setColor(GOLD)
      .setTitle(t(lang, 'unban.title'))
      .setDescription(t(lang, 'unban.done', { user: `<@${ban.user.id}>` }))
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
                .setTitle(t(lang, 'unban.logTitle'))
                .addFields(
                  { name: 'Kullanıcı', value: `${ban.user.tag} (<@${ban.user.id}>)` },
                  { name: 'Yetkili', value: `${interaction.user.tag}`, inline: true },
                  { name: 'Sebep', value: reason.slice(0, 300), inline: true },
                ),
            ],
          })
          .catch(() => {});
      }
    }
  },
};
