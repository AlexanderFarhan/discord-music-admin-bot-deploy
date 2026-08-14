import {
  EmbedBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { useQueue } from 'discord-player';
import { COLORS, replyPrivate, sameVoiceChannel } from '../utils/discord.js';

function queueFor(interaction) {
  return useQueue(interaction.guildId);
}

function activeQueue(interaction) {
  const queue = queueFor(interaction);
  if (!queue?.currentTrack) {
    void replyPrivate(interaction, 'Belum ada musik yang sedang diputar.');
    return null;
  }
  return queue;
}

export function playableQuery(input) {
  const value = input.trim();
  try {
    const url = new URL(value);
    const supportedDomains = [
      'soundcloud.com',
      'spotify.com',
      'apple.com',
      'vimeo.com',
      'reverbnation.com',
    ];
    const isSupported =
      url.protocol === 'https:' &&
      supportedDomains.some(
        (domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`),
      );
    if (!isSupported) {
      throw new Error('Tautan hanya dapat berasal dari sumber musik yang didukung.');
    }
    return value;
  } catch (error) {
    if (/^[a-z][a-z\d+.-]*:\/\//i.test(value)) throw error;
    return `scsearch:${value}`;
  }
}

function trackLine(track, index) {
  const duration = track.live ? 'LIVE' : track.duration;
  return `**${index}.** [${track.title}](${track.url}) â€¢ ${duration}`;
}

export const musicCommand = {
  data: new SlashCommandBuilder()
    .setName('musik')
    .setDescription('Putar dan atur musik di voice channel')
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('putar')
        .setDescription('Putar lagu dari judul atau tautan')
        .addStringOption((option) =>
          option
            .setName('lagu')
            .setDescription('Judul lagu atau tautan yang didukung')
            .setMaxLength(500)
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) => subcommand.setName('jeda').setDescription('Jeda musik'))
    .addSubcommand((subcommand) => subcommand.setName('lanjut').setDescription('Lanjutkan musik'))
    .addSubcommand((subcommand) => subcommand.setName('lewati').setDescription('Lewati lagu saat ini'))
    .addSubcommand((subcommand) => subcommand.setName('berhenti').setDescription('Hentikan musik dan kosongkan antrean'))
    .addSubcommand((subcommand) => subcommand.setName('antrean').setDescription('Lihat antrean musik'))
    .addSubcommand((subcommand) => subcommand.setName('sekarang').setDescription('Lihat lagu yang sedang diputar'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('volume')
        .setDescription('Atur volume musik')
        .addIntegerOption((option) =>
          option.setName('persen').setDescription('Volume 1 sampai 100').setMinValue(1).setMaxValue(100).setRequired(true),
        ),
    ),

  async execute(interaction, { player, config }) {
    const action = interaction.options.getSubcommand();

    if (action === 'putar') {
      const voiceChannel = sameVoiceChannel(interaction);
      if (!voiceChannel) return;

      const botPermissions = voiceChannel.permissionsFor(interaction.guild.members.me);
      if (!botPermissions?.has(PermissionFlagsBits.Connect) || !botPermissions.has(PermissionFlagsBits.Speak)) {
        return replyPrivate(interaction, 'Bot memerlukan izin **Connect** dan **Speak** di voice channel tersebut.');
      }

      await interaction.deferReply();
      const input = interaction.options.getString('lagu', true);

      try {
        const result = await player.play(voiceChannel, playableQuery(input), {
          requestedBy: interaction.user,
          nodeOptions: {
            metadata: { channel: interaction.channel },
            volume: config.defaultVolume,
            bufferingTimeout: 60_000,
            leaveOnStop: true,
            leaveOnStopCooldown: 5_000,
            leaveOnEnd: true,
            leaveOnEndCooldown: 15_000,
            leaveOnEmpty: true,
            leaveOnEmptyCooldown: 60_000,
            skipOnNoStream: true,
          },
        });

        result.queue.setMetadata({ channel: interaction.channel });
        return interaction.editReply(`ðŸŽµ **${result.track.title}** ditambahkan ke antrean.`);
      } catch (error) {
        return interaction.editReply(
          `Tidak dapat memutar permintaan itu. Pastikan judul atau tautannya valid dan sumbernya didukung.\nDetail: ${error.message}`,
        );
      }
    }

    if (!sameVoiceChannel(interaction)) return;
    const queue = activeQueue(interaction);
    if (!queue) return;

    if (action === 'jeda') {
      if (queue.node.isPaused()) return replyPrivate(interaction, 'Musik sudah dijeda.');
      queue.node.pause();
      return interaction.reply('â¸ï¸ Musik dijeda.');
    }

    if (action === 'lanjut') {
      if (!queue.node.isPaused()) return replyPrivate(interaction, 'Musik tidak sedang dijeda.');
      queue.node.resume();
      return interaction.reply('â–¶ï¸ Musik dilanjutkan.');
    }

    if (action === 'lewati') {
      const skipped = queue.currentTrack;
      queue.node.skip();
      return interaction.reply(`â­ï¸ **${skipped.title}** dilewati.`);
    }

    if (action === 'berhenti') {
      queue.delete();
      return interaction.reply('â¹ï¸ Musik dihentikan dan antrean dikosongkan.');
    }

    if (action === 'volume') {
      const volume = interaction.options.getInteger('persen', true);
      queue.node.setVolume(volume);
      return interaction.reply(`ðŸ”Š Volume diatur ke **${volume}%**.`);
    }

    if (action === 'sekarang') {
      const track = queue.currentTrack;
      const progress = queue.node.createProgressBar() || 'Memuat progresâ€¦';
      const embed = new EmbedBuilder()
        .setColor(COLORS.primary)
        .setTitle('Sedang Diputar')
        .setDescription(`[${track.title}](${track.url})`)
        .addFields(
          { name: 'Artis', value: track.author || 'Tidak diketahui', inline: true },
          { name: 'Durasi', value: track.live ? 'LIVE' : track.duration, inline: true },
          { name: 'Progres', value: progress },
        )
        .setThumbnail(track.thumbnail || null)
        .setFooter({ text: `Diminta oleh ${track.requestedBy?.tag ?? 'anggota'}` });
      return interaction.reply({ embeds: [embed] });
    }

    const upcoming = queue.tracks.toArray().slice(0, 10);
    const current = queue.currentTrack;
    const description = [
      `**Sekarang:** [${current.title}](${current.url})`,
      '',
      upcoming.length > 0
        ? upcoming.map((track, index) => trackLine(track, index + 1)).join('\n')
        : '_Tidak ada lagu berikutnya._',
    ].join('\n');

    const embed = new EmbedBuilder()
      .setColor(COLORS.primary)
      .setTitle(`Antrean Musik â€¢ ${queue.size} berikutnya`)
      .setDescription(description)
      .setFooter({ text: upcoming.length < queue.size ? `Menampilkan 10 dari ${queue.size} lagu` : 'Semua lagu ditampilkan' });
    return interaction.reply({ embeds: [embed] });
  },
};

