'use strict';

const path = require('node:path');
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  PermissionFlagsBits,
  Events,
} = require('discord.js');
const { GOLD } = require('../ui');
const { t, addLangOption, resolveLang } = require('../i18n');
const { openTicket, closeRow } = require('./ticket');

const BANNER = path.join(__dirname, '..', '..', 'assets', 'ticket-banner.png');

const KINDS = {
  partner: { slug: 'partner', emoji: '🤝', style: ButtonStyle.Success },
  bug: { slug: 'bug', emoji: '⚠️', style: ButtonStyle.Danger },
  install: { slug: 'install', emoji: '🎟️', style: ButtonStyle.Primary },
};

const builder = addLangOption(
  new SlashCommandBuilder()
    .setName('ticketgui')
    .setDescription('Post the ticket panel with buttons')
    .setDescriptionLocalizations({ tr: 'Butonlu destek paneli gönder' })
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('Channel (defaults to this one)')
        .setDescriptionLocalizations({ tr: 'Kanal (boşsa bu kanal)' })
        .setRequired(false),
    ),
);

function panelRow(lang) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticketgui:partner')
      .setLabel(t(lang, 'ticketgui.partnerLabel'))
      .setEmoji(KINDS.partner.emoji)
      .setStyle(KINDS.partner.style),
    new ButtonBuilder()
      .setCustomId('ticketgui:bug')
      .setLabel(t(lang, 'ticketgui.bugLabel'))
      .setEmoji(KINDS.bug.emoji)
      .setStyle(KINDS.bug.style),
    new ButtonBuilder()
      .setCustomId('ticketgui:install')
      .setLabel(t(lang, 'ticketgui.installLabel'))
      .setEmoji(KINDS.install.emoji)
      .setStyle(KINDS.install.style),
  );
}

module.exports = {
  staffOnly: true,
  data: builder,

  async run(interaction, { config, store }) {
    const lang = resolveLang(interaction, store, config);
    const target = interaction.options.getChannel('channel');
    const channel = target
      ? await interaction.guild.channels.fetch(target.id).catch(() => null)
      : interaction.channel;

    if (!channel?.isTextBased()) {
      await interaction.reply({ content: t(lang, 'ticketgui.failed'), flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const embed = new EmbedBuilder()
      .setColor(GOLD)
      .setImage('attachment://ticket-banner.png')
      .setDescription(t(lang, 'ticketgui.desc'));

    const sent = await channel
      .send({
        embeds: [embed],
        components: [panelRow(lang)],
        files: [{ attachment: BANNER, name: 'ticket-banner.png' }],
      })
      .catch(() => null);

    if (!sent) {
      await interaction.editReply({ content: t(lang, 'ticketgui.failed') });
      return;
    }

    await interaction.editReply({ content: t(lang, 'ticketgui.posted', { channel: `<#${channel.id}>` }) });
  },

  attach(client, config, store) {
    client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isButton()) return;
      const kind = interaction.customId.startsWith('ticketgui:')
        ? KINDS[interaction.customId.slice('ticketgui:'.length)]
        : null;
      if (!kind) return;

      const lang = resolveLang(interaction, store, config);
      await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});
      const key = interaction.customId.slice('ticketgui:'.length);

      const existing = interaction.guild.channels.cache.find(
        (channel) => channel.topic === `ticket:${interaction.user.id}`,
      );
      if (existing) {
        await interaction.editReply({
          content: t(lang, 'ticketgui.alreadyOpen', { channel: `<#${existing.id}>` }),
        });
        return;
      }

      const channel = await openTicket(interaction.guild, interaction.user, config, { slug: kind.slug });
      if (!channel) {
        await interaction.editReply({ content: t(lang, 'ticket.failed') });
        return;
      }

      const staffRole = config.staffRoleIds?.[0];
      const embed = new EmbedBuilder()
        .setColor(GOLD)
        .setTitle(t(lang, `ticketgui.${key}Title`))
        .setDescription(
          t(lang, 'ticketgui.intro', {
            user: `<@${interaction.user.id}>`,
            staff: staffRole ? `<@&${staffRole}>` : '-',
          }),
        );

      await channel
        .send({ content: staffRole ? `<@&${staffRole}>` : undefined, embeds: [embed], components: [closeRow(lang)] })
        .catch(() => {});

      await interaction.editReply({ content: t(lang, 'ticket.opened', { channel: `<#${channel.id}>` }) });
    });
  },
};
