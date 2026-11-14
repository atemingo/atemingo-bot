'use strict';

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { GOLD } = require('../ui');
const { t, addLangOption, resolveLang } = require('../i18n');

const builder = addLangOption(
  new SlashCommandBuilder()
    .setName('sponsor')
    .setDescription('Sponsors and partners')
    .setDescriptionLocalizations({ tr: 'Sponsorlar ve iş ortakları' }),
);

module.exports = {
  data: builder,
  async run(interaction, { config, store }) {
    const lang = resolveLang(interaction, store, config);
    const sponsors = config.sponsors || [];
    if (!sponsors.length) {
      await interaction.reply({ content: t(lang, 'common.noSponsor'), flags: MessageFlags.Ephemeral });
      return;
    }
    const embed = new EmbedBuilder()
      .setColor(GOLD)
      .setTitle(t(lang, 'sponsor.title'))
      .setDescription(
        sponsors
          .map((sponsor) => {
            const note = sponsor.note ? ` — ${sponsor.note}` : '';
            return sponsor.url ? `[${sponsor.name}](${sponsor.url})${note}` : `**${sponsor.name}**${note}`;
          })
          .join('\n'),
      );
    await interaction.reply({ embeds: [embed] });
  },
};
