'use strict';

const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { GOLD } = require('../ui');
const { t, addLangOption, resolveLang } = require('../i18n');

const builder = addLangOption(
  new SlashCommandBuilder()
    .setName('otorol')
    .setDescription('Manage roles given automatically to new members')
    .setDescriptionLocalizations({ tr: 'Yeni üyelere otomatik verilen rolleri yönet' })
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addRoleOption((option) =>
      option
        .setName('role')
        .setDescription('Role to add to autoroles')
        .setDescriptionLocalizations({ tr: 'Otorole eklenecek rol' })
        .setRequired(false),
    )
    .addRoleOption((option) =>
      option
        .setName('remove')
        .setDescription('Role to remove from autoroles')
        .setDescriptionLocalizations({ tr: 'Otorolden kaldırılacak rol' })
        .setRequired(false),
    ),
);

function list(store) {
  const meta = store.meta();
  const ids = Array.isArray(meta.autorole) ? meta.autorole : (meta.autorole = []);
  return ids;
}

module.exports = {
  staffOnly: true,
  data: builder,

  async run(interaction, { config, store }) {
    const lang = resolveLang(interaction, store, config);
    const add = interaction.options.getRole('role');
    const remove = interaction.options.getRole('remove');

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const ids = list(store);
    if (add?.managed) {
      await interaction.editReply({ content: t(lang, 'otorol.managed') });
      return;
    }
    if (add && !ids.includes(add.id)) ids.push(add.id);
    if (remove) {
      const at = ids.indexOf(remove.id);
      if (at !== -1) ids.splice(at, 1);
    }
    store.save();

    const shown = ids.map((id) => `<@&${id}>`);
    const fixed = config.roles?.uye ? [`<@&${config.roles.uye}>`] : [];
    const all = [...new Set([...fixed, ...shown])];
    const embed = new EmbedBuilder()
      .setColor(GOLD)
      .setTitle(t(lang, 'otorol.title'))
      .setDescription(all.length ? t(lang, 'otorol.list', { roles: all.join(', ') }) : t(lang, 'otorol.empty'));

    if (add) embed.addFields({ name: t(lang, 'otorol.added'), value: `<@&${add.id}>` });
    if (remove) embed.addFields({ name: t(lang, 'otorol.removed'), value: `<@&${remove.id}>` });

    await interaction.editReply({ embeds: [embed] });

    if (add || remove) {
      require('../autorole')
        .grantToAll(interaction.client, config, store)
        .catch((error) => console.error('[otorol] senkron:', error.message));
    }
  },
};
