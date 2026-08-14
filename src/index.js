import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import {
  AppleMusicExtractor,
  ReverbnationExtractor,
  SoundCloudExtractor,
  SpotifyExtractor,
  VimeoExtractor,
} from '@discord-player/extractor';
import { Player } from 'discord-player';
import ffmpegPath from 'ffmpeg-static';
import { commands } from './commands/index.js';
import { loadConfig } from './config.js';
import { startHealthServer } from './health-server.js';
import { createLogger } from './logger.js';
import { registerCommands } from './register-commands.js';
import { COLORS, baseEmbed, replyPrivate } from './utils/discord.js';

async function main() {
  const config = loadConfig();
  const logger = createLogger(config.logLevel);
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  });
  const healthServer = startHealthServer({
    isReady: () => client.isReady(),
    logger,
  });
  const player = new Player(client, { ffmpegPath });
  const commandMap = new Collection(commands.map((command) => [command.data.name, command]));

  await player.extractors.loadMulti([
    SoundCloudExtractor,
    VimeoExtractor,
    ReverbnationExtractor,
    AppleMusicExtractor,
    SpotifyExtractor,
  ]);

  player.events.on('playerStart', async (queue, track) => {
    logger.info('Pemutaran musik dimulai', {
      guildId: queue.guild.id,
      track: track.title,
      source: track.source,
    });
    const channel = queue.metadata?.channel;
    if (!channel?.isTextBased()) return;

    const embed = baseEmbed('ðŸŽ¶ Sekarang Diputar', COLORS.success)
      .setDescription(`[${track.title}](${track.url})`)
      .addFields(
        { name: 'Artis', value: track.author || 'Tidak diketahui', inline: true },
        { name: 'Durasi', value: track.live ? 'LIVE' : track.duration, inline: true },
      )
      .setThumbnail(track.thumbnail || null);
    await channel.send({ embeds: [embed] }).catch(() => null);
  });

  player.events.on('error', (queue, error) => {
    logger.error('Kesalahan antrean musik', { guildId: queue.guild.id, error: error.message });
  });
  player.events.on('playerError', (queue, error, track) => {
    logger.error('Kesalahan pemutaran musik', {
      guildId: queue.guild.id,
      track: track?.title,
      error: error.message,
    });
  });

  client.once(Events.ClientReady, (readyClient) => {
    logger.info('Bot siap', { user: readyClient.user.tag, guilds: readyClient.guilds.cache.size });
    readyClient.user.setActivity('/bantuan â€¢ Musik & Moderasi');
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commandMap.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, { client, player, config, logger });
    } catch (error) {
      logger.error('Perintah gagal', {
        command: interaction.commandName,
        guildId: interaction.guildId,
        userId: interaction.user.id,
        error: error.stack || error.message,
      });
      await replyPrivate(interaction, 'Terjadi kesalahan saat menjalankan perintah. Silakan periksa log bot.').catch(() => null);
    }
  });

  const shutdown = async (signal) => {
    logger.info('Bot dimatikan', { signal });
    for (const queue of player.nodes.cache.values()) queue.delete();
    client.destroy();
    await new Promise((resolve) => healthServer.close(resolve));
    process.exit(0);
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));

  await registerCommands(commands, config, logger);
  await client.login(config.token);
}

main().catch((error) => {
  console.error(JSON.stringify({ time: new Date().toISOString(), level: 'error', message: error.stack || error.message }));
  process.exit(1);
});

