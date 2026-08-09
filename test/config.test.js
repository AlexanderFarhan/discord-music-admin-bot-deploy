import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig } from '../src/config.js';

test('loadConfig membaca konfigurasi valid', () => {
  const config = loadConfig({
    DISCORD_TOKEN: 'token-test',
    CLIENT_ID: 'client-test',
    GUILD_ID: 'guild-test',
    DEFAULT_VOLUME: '70',
    LOG_LEVEL: 'debug',
  });

  assert.equal(config.defaultVolume, 70);
  assert.equal(config.guildId, 'guild-test');
  assert.equal(config.logLevel, 'debug');
});

test('loadConfig menolak variabel wajib yang kosong', () => {
  assert.throws(() => loadConfig({}), /DISCORD_TOKEN, CLIENT_ID/);
});

test('loadConfig menolak volume di luar batas', () => {
  assert.throws(
    () => loadConfig({ DISCORD_TOKEN: 'x', CLIENT_ID: 'y', DEFAULT_VOLUME: '101' }),
    /DEFAULT_VOLUME/,
  );
});

