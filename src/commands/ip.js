'use strict';

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { GOLD } = require('../ui');
const { t, addLangOption, resolveLang } = require('../i18n');

const builder = addLangOption(
  new SlashCommandBuilder()
    .setName('ip')
    .setDescription('Minecraft server addresses')
    .setDescriptionLocalizations({ tr: 'Minecraft sunucu adresleri' })
    .addStringOption((option) =>
      option
        .setName('search')
        .setDescription('Search by server name')
        .setDescriptionLocalizations({ tr: 'Sunucu adında ara' })
        .setRequired(false)
        .setMaxLength(40),
    ),
);

module.exports = {
  data: builder,
  async run(interaction, { config, store }) {
    const lang = resolveLang(interaction, store, config);
    const query = (interaction.options.getString('search') || '').toLocaleLowerCase(lang);
    const servers = (config.servers || []).filter((server) =>
      query ? `${server.name} ${server.ip}`.toLocaleLowerCase(lang).includes(query) : true,
    );
    if (!servers.length) {
      await interaction.reply({ content: t(lang, 'common.noServer'), flags: MessageFlags.Ephemeral });
      return;
    }
    const embed = new EmbedBuilder()
      .setColor(GOLD)
      .setTitle(t(lang, 'ip.title'))
      .setDescription(
        servers
          .map((server) => {
            const meta = [server.version, server.note].filter(Boolean).join(' · ');
            return `**${server.name}**${meta ? ` — ${meta}` : ''}\n\`${server.ip}\``;
          })
          .join('\n\n'),
      )
      .setFooter({ text: t(lang, 'ip.footer') });
    await interaction.reply({ embeds: [embed] });
  },
};
