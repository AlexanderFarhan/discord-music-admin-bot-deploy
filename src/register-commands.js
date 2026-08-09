import { REST, Routes } from 'discord.js';

export async function registerCommands(commands, config, logger) {
  const rest = new REST({ version: '10' }).setToken(config.token);
  const payload = commands.map((command) => command.data.toJSON());

  if (config.guildId) {
    await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: payload });
    logger.info('Slash command terdaftar untuk satu server', { guildId: config.guildId, count: payload.length });
    return;
  }

  await rest.put(Routes.applicationCommands(config.clientId), { body: payload });
  logger.info('Slash command global terdaftar', { count: payload.length });
}

