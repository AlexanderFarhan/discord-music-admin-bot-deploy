import {
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import {
  auditReason,
  COLORS,
  replyPrivate,
  requireBotPermission,
  requireMemberPermission,
  sendModerationLog,
} from '../utils/discord.js';

const MINUTE = 60_000;

async function fetchMember(interaction, optionName = 'anggota') {
  const user = interaction.options.getUser(optionName, true);
  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  return { user, member };
}

function invalidTarget(interaction, member) {
  if (member?.id === interaction.user.id) {
    void replyPrivate(interaction, 'Kamu tidak dapat menargetkan dirimu sendiri.');
    return true;
  }
  if (member?.id === interaction.client.user.id) {
    void replyPrivate(interaction, 'Bot tidak dapat menargetkan dirinya sendiri.');
    return true;
  }
  if (member?.id === interaction.guild.ownerId) {
    void replyPrivate(interaction, 'Pemilik server tidak dapat dimoderasi.');
    return true;
  }
  return false;
}

export const moderationCommand = {
  data: new SlashCommandBuilder()
    .setName('moderasi')
    .setDescription('Kelola dan moderasi server')
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('bersihkan')
        .setDescription('Hapus sejumlah pesan terbaru')
        .addIntegerOption((option) =>
          option.setName('jumlah').setDescription('Jumlah pesan 1 sampai 100').setMinValue(1).setMaxValue(100).setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('kick')
        .setDescription('Keluarkan anggota dari server')
        .addUserOption((option) => option.setName('anggota').setDescription('Anggota yang dikeluarkan').setRequired(true))
        .addStringOption((option) => option.setName('alasan').setDescription('Alasan tindakan').setMaxLength(400)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('ban')
        .setDescription('Blokir anggota dari server')
        .addUserOption((option) => option.setName('anggota').setDescription('Anggota yang diblokir').setRequired(true))
        .addIntegerOption((option) =>
          option.setName('hapus_hari').setDescription('Hapus pesan 0 sampai 7 hari terakhir').setMinValue(0).setMaxValue(7),
        )
        .addStringOption((option) => option.setName('alasan').setDescription('Alasan tindakan').setMaxLength(400)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('timeout')
        .setDescription('Batasi anggota untuk sementara')
        .addUserOption((option) => option.setName('anggota').setDescription('Anggota yang dibatasi').setRequired(true))
        .addIntegerOption((option) =>
          option
            .setName('menit')
            .setDescription('Durasi 1 menit sampai 28 hari')
            .setMinValue(1)
            .setMaxValue(40_320)
            .setRequired(true),
        )
        .addStringOption((option) => option.setName('alasan').setDescription('Alasan tindakan').setMaxLength(400)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('untimeout')
        .setDescription('Hapus timeout anggota')
        .addUserOption((option) => option.setName('anggota').setDescription('Anggota yang dipulihkan').setRequired(true))
        .addStringOption((option) => option.setName('alasan').setDescription('Alasan tindakan').setMaxLength(400)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('slowmode')
        .setDescription('Atur jeda kirim pesan di kanal ini')
        .addIntegerOption((option) =>
          option.setName('detik').setDescription('0 untuk nonaktif; maksimum 6 jam').setMinValue(0).setMaxValue(21_600).setRequired(true),
        ),
    )
    .addSubcommand((subcommand) => subcommand.setName('kunci').setDescription('Larang @everyone mengirim pesan di kanal ini'))
    .addSubcommand((subcommand) => subcommand.setName('buka').setDescription('Buka kembali kanal ini untuk @everyone')),

  async execute(interaction, { config }) {
    const action = interaction.options.getSubcommand();

    if (action === 'bersihkan') {
      if (!requireMemberPermission(interaction, PermissionFlagsBits.ManageMessages, 'Manage Messages')) return;
      if (!requireBotPermission(interaction, PermissionFlagsBits.ManageMessages, 'Manage Messages')) return;

      const amount = interaction.options.getInteger('jumlah', true);
      await interaction.deferReply({ ephemeral: true });
      const deleted = await interaction.channel.bulkDelete(amount, true);
      await sendModerationLog(interaction, config, {
        action: 'Bersihkan pesan',
        target: `#${interaction.channel.name}`,
        reason: `${deleted.size} pesan dihapus`,
      });
      return interaction.editReply(`🧹 **${deleted.size}** pesan berhasil dihapus. Pesan yang berusia lebih dari 14 hari dilewati.`);
    }

    if (action === 'slowmode') {
      if (!requireMemberPermission(interaction, PermissionFlagsBits.ManageChannels, 'Manage Channels')) return;
      if (!requireBotPermission(interaction, PermissionFlagsBits.ManageChannels, 'Manage Channels')) return;
      if (typeof interaction.channel.setRateLimitPerUser !== 'function') {
        return replyPrivate(interaction, 'Slowmode tidak tersedia pada jenis kanal ini.');
      }

      const seconds = interaction.options.getInteger('detik', true);
      await interaction.channel.setRateLimitPerUser(seconds, auditReason(interaction, 'Mengubah slowmode'));
      await sendModerationLog(interaction, config, {
        action: 'Slowmode',
        target: `#${interaction.channel.name}`,
        reason: seconds === 0 ? 'Dinonaktifkan' : `${seconds} detik`,
      });
      return interaction.reply(seconds === 0 ? '✅ Slowmode dinonaktifkan.' : `✅ Slowmode diatur ke **${seconds} detik**.`);
    }

    if (action === 'kunci' || action === 'buka') {
      if (!requireMemberPermission(interaction, PermissionFlagsBits.ManageChannels, 'Manage Channels')) return;
      if (!requireBotPermission(interaction, PermissionFlagsBits.ManageChannels, 'Manage Channels')) return;
      if (!interaction.channel.permissionOverwrites) {
        return replyPrivate(interaction, 'Pengaturan izin tidak tersedia pada jenis kanal ini.');
      }

      const locked = action === 'kunci';
      await interaction.channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        { SendMessages: locked ? false : null },
        { reason: auditReason(interaction, locked ? 'Mengunci kanal' : 'Membuka kanal') },
      );
      await sendModerationLog(interaction, config, {
        action: locked ? 'Kunci kanal' : 'Buka kanal',
        target: `#${interaction.channel.name}`,
        reason: locked ? '@everyone tidak dapat mengirim pesan' : 'Izin Send Messages dikembalikan ke bawaan',
      });
      return interaction.reply(locked ? '🔒 Kanal ini dikunci.' : '🔓 Kanal ini dibuka kembali.');
    }

    const { user, member } = await fetchMember(interaction);
    const reason = interaction.options.getString('alasan')?.trim() || 'Tidak ada alasan';
    if (invalidTarget(interaction, member)) return;

    if (action === 'kick') {
      if (!requireMemberPermission(interaction, PermissionFlagsBits.KickMembers, 'Kick Members')) return;
      if (!member) return replyPrivate(interaction, 'Anggota tersebut tidak ditemukan di server.');
      if (!member.kickable) return replyPrivate(interaction, 'Bot tidak dapat mengeluarkan anggota itu. Periksa urutan role bot.');

      await member.kick(auditReason(interaction, reason));
      await sendModerationLog(interaction, config, { action: 'Kick', target: `${user.tag} (${user.id})`, reason, color: COLORS.danger });
      return interaction.reply(`👢 **${user.tag}** dikeluarkan dari server.`);
    }

    if (action === 'ban') {
      if (!requireMemberPermission(interaction, PermissionFlagsBits.BanMembers, 'Ban Members')) return;
      if (!requireBotPermission(interaction, PermissionFlagsBits.BanMembers, 'Ban Members')) return;
      if (member && !member.bannable) return replyPrivate(interaction, 'Bot tidak dapat memblokir anggota itu. Periksa urutan role bot.');

      const deleteDays = interaction.options.getInteger('hapus_hari') ?? 0;
      await interaction.guild.members.ban(user.id, {
        deleteMessageSeconds: deleteDays * 86_400,
        reason: auditReason(interaction, reason),
      });
      await sendModerationLog(interaction, config, { action: 'Ban', target: `${user.tag} (${user.id})`, reason, color: COLORS.danger });
      return interaction.reply(`🔨 **${user.tag}** diblokir dari server.`);
    }

    if (!requireMemberPermission(interaction, PermissionFlagsBits.ModerateMembers, 'Moderate Members')) return;
    if (!member) return replyPrivate(interaction, 'Anggota tersebut tidak ditemukan di server.');
    if (!member.moderatable) return replyPrivate(interaction, 'Bot tidak dapat membatasi anggota itu. Periksa urutan role bot.');

    if (action === 'timeout') {
      const minutes = interaction.options.getInteger('menit', true);
      await member.timeout(minutes * MINUTE, auditReason(interaction, reason));
      await sendModerationLog(interaction, config, { action: 'Timeout', target: `${user.tag} (${user.id})`, reason: `${minutes} menit • ${reason}` });
      return interaction.reply(`⏳ **${user.tag}** diberi timeout selama **${minutes} menit**.`);
    }

    await member.timeout(null, auditReason(interaction, reason));
    await sendModerationLog(interaction, config, { action: 'Hapus timeout', target: `${user.tag} (${user.id})`, reason, color: COLORS.success });
    return interaction.reply(`✅ Timeout **${user.tag}** dihapus.`);
  },
};

