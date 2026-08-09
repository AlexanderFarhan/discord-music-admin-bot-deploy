import 'dotenv/config';

const REQUIRED_ENV = ['DISCORD_TOKEN', 'CLIENT_ID'];

export function loadConfig(env = process.env) {
  const missing = REQUIRED_ENV.filter((key) => !env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Konfigurasi belum lengkap: ${missing.join(', ')}. Salin .env.example menjadi .env lalu isi nilainya.`,
    );
  }

  const defaultVolume = Number.parseInt(env.DEFAULT_VOLUME ?? '50', 10);
  if (!Number.isInteger(defaultVolume) || defaultVolume < 1 || defaultVolume > 100) {
    throw new Error('DEFAULT_VOLUME harus berupa angka 1 sampai 100.');
  }

  const allowedLogLevels = new Set(['debug', 'info', 'warn', 'error']);
  const logLevel = (env.LOG_LEVEL ?? 'info').toLowerCase();
  if (!allowedLogLevels.has(logLevel)) {
    throw new Error('LOG_LEVEL harus salah satu dari: debug, info, warn, error.');
  }

  return Object.freeze({
    token: env.DISCORD_TOKEN.trim(),
    clientId: env.CLIENT_ID.trim(),
    guildId: env.GUILD_ID?.trim() || null,
    modLogChannelId: env.MOD_LOG_CHANNEL_ID?.trim() || null,
    defaultVolume,
    logLevel,
  });
}

