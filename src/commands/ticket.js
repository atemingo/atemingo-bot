'use strict';

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  PermissionFlagsBits,
  ChannelType,
  Events,
} = require('discord.js');
const { GOLD } = require('../ui');
const { t, addLangOption, resolveLang } = require('../i18n');

const builder = addLangOption(
  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Open a private ticket channel')
    .setDescriptionLocalizations({ tr: 'Özel destek kanalı aç' })
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('What do you need help with?')
        .setDescriptionLocalizations({ tr: 'Ne için yardım istiyorsun?' })
        .setRequired(false)
        .setMaxLength(300),
    ),
);

function staffMember(member, config) {
  if (!member) return false;
  if (member.permissions?.has(PermissionFlagsBits.Administrator)) return true;
  return (config.staffRoleIds || []).some((id) => id && member.roles.cache.has(id));
}

function closeRow(lang) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket:close')
      .setLabel(t(lang, 'ticket.closeButton'))
      .setStyle(ButtonStyle.Danger),
  );
}

async function resolveCategory(guild, config) {
  const configured = config.channels?.ticketCategory;
  if (configured) {
    const found =
      guild.channels.cache.get(configured) || (await guild.channels.fetch(configured).catch(() => null));
    if (found?.type === ChannelType.GuildCategory) return found;
  }
  const existing = guild.channels.cache.find(
    (channel) => channel.type === ChannelType.GuildCategory && channel.name.toLowerCase() === 'başvurular',
  );
  if (existing) return existing;
  return guild.channels
    .create({ name: 'Başvurular', type: ChannelType.GuildCategory })
    .catch(() => null);
}

async function openTicket(guild, user, config, { slug = 'ticket', reason = '-' } = {}) {
  const me = guild.members.me;
  if (!me?.permissions.has(PermissionFlagsBits.ManageChannels)) return null;

  const parent = await resolveCategory(guild, config);

  const name = `${slug}-${user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90) || slug;
  const staffRole = config.staffRoleIds?.[0];

  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
  ];
  if (staffRole) {
    overwrites.push({
      id: staffRole,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
      ],
    });
  }
  if (me.id) {
    overwrites.push({ id: me.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] });
  }

  return guild.channels
    .create({
      name,
      type: ChannelType.GuildText,
      topic: `ticket:${user.id}`,
      permissionOverwrites: overwrites,
      parent: parent?.id || undefined,
    })
    .catch(() => null);
}

module.exports = {
  staffOnly: false,
  data: builder,
  openTicket,
  closeRow,
  staffMember,

  async run(interaction, { config, store }) {
    const lang = resolveLang(interaction, store, config);
    const reason = interaction.options.getString('reason') || '-';

    const me = interaction.guild.members.me;
    if (!me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
      await interaction.reply({ content: t(lang, 'ticket.noPerm'), flags: MessageFlags.Ephemeral });
      return;
    }

    const staffRole = config.staffRoleIds?.[0];
    const channel = await openTicket(interaction.guild, interaction.user, config, { reason });

    if (!channel) {
      await interaction.reply({ content: t(lang, 'ticket.failed'), flags: MessageFlags.Ephemeral });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(GOLD)
      .setTitle(t(lang, 'ticket.title'))
      .setDescription(t(lang, 'ticket.body', { user: `<@${interaction.user.id}>`, staff: staffRole ? `<@&${staffRole}>` : '-', reason: reason.slice(0, 300) }));

    await channel.send({ content: staffRole ? `<@&${staffRole}>` : undefined, embeds: [embed], components: [closeRow(lang)] });

    await interaction.reply({
      content: t(lang, 'ticket.opened', { channel: `<#${channel.id}>` }),
      flags: MessageFlags.Ephemeral,
    });
  },

  attach(client, config, store) {
    client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isButton() || interaction.customId !== 'ticket:close') return;
      const lang = resolveLang(interaction, store, config);
      const owner = (interaction.channel?.topic || '').match(/ticket:(\d{15,20})/)?.[1];
      const allowed = interaction.user.id === owner || staffMember(interaction.member, config);
      if (!allowed) {
        await interaction.reply({ content: t(lang, 'ticket.denied'), flags: MessageFlags.Ephemeral }).catch(() => {});
        return;
      }
      await interaction
        .reply({ content: t(lang, 'ticket.closing'), flags: MessageFlags.Ephemeral })
        .catch(() => {});
      setTimeout(() => interaction.channel?.delete().catch(() => {}), 3000);
    });
  },
};
