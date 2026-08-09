import { EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { COLORS } from '../utils/discord.js';

export const helpCommand = {
  data: new SlashCommandBuilder()
    .setName('bantuan')
    .setDescription('Lihat daftar perintah bot')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.primary)
      .setTitle('Bantuan Bot')
      .setDescription('Semua fitur menggunakan slash command. Ketik `/` untuk mulai.')
      .addFields(
        {
          name: '🎵 Musik',
          value: '`/musik putar` • `jeda` • `lanjut` • `lewati` • `berhenti` • `antrean` • `sekarang` • `volume`',
        },
        {
          name: '🛡️ Moderasi',
          value: '`/moderasi bersihkan` • `kick` • `ban` • `timeout` • `untimeout` • `slowmode` • `kunci` • `buka`',
        },
        { name: 'ℹ️ Informasi', value: '`/info server` • `/info anggota`' },
      )
      .setFooter({ text: 'Perintah moderasi memerlukan izin Discord yang sesuai.' });
    return interaction.reply({ embeds: [embed] });
  },
};

