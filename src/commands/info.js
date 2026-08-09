import { EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { COLORS } from '../utils/discord.js';

export const infoCommand = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Lihat informasi server atau anggota')
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((subcommand) => subcommand.setName('server').setDescription('Tampilkan informasi server'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('anggota')
        .setDescription('Tampilkan informasi anggota')
        .addUserOption((option) => option.setName('pengguna').setDescription('Pengguna yang ingin dilihat')),
    ),

  async execute(interaction) {
    const action = interaction.options.getSubcommand();

    if (action === 'server') {
      const guild = interaction.guild;
      const owner = await guild.fetchOwner();
      const embed = new EmbedBuilder()
        .setColor(COLORS.primary)
        .setTitle(guild.name)
        .setThumbnail(guild.iconURL({ size: 256 }))
        .addFields(
          { name: 'Pemilik', value: `${owner.user.tag}`, inline: true },
          { name: 'Anggota', value: guild.memberCount.toLocaleString('id-ID'), inline: true },
          { name: 'Kanal', value: guild.channels.cache.size.toLocaleString('id-ID'), inline: true },
          { name: 'Role', value: guild.roles.cache.size.toLocaleString('id-ID'), inline: true },
          { name: 'Dibuat', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false },
          { name: 'Server ID', value: guild.id, inline: false },
        );
      return interaction.reply({ embeds: [embed] });
    }

    const user = interaction.options.getUser('pengguna') ?? interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    const roles = member?.roles.cache
      .filter((role) => role.id !== interaction.guild.id)
      .sort((a, b) => b.position - a.position)
      .first(10)
      .map((role) => role.toString())
      .join(', ') || 'Tidak ada';

    const embed = new EmbedBuilder()
      .setColor(member?.displayColor || COLORS.primary)
      .setTitle(user.tag)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'User ID', value: user.id, inline: false },
        { name: 'Akun dibuat', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: false },
        { name: 'Bergabung', value: member?.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : 'Tidak ada di server', inline: false },
        { name: 'Role (maks. 10)', value: roles, inline: false },
      );
    return interaction.reply({ embeds: [embed] });
  },
};

