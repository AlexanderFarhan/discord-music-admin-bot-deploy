import assert from 'node:assert/strict';
import test from 'node:test';
import { playableQuery } from '../src/commands/music.js';

test('judul lagu diarahkan ke pencarian SoundCloud', () => {
  assert.equal(playableQuery('Nadin Amizah Sorai'), 'scsearch:Nadin Amizah Sorai');
});

test('tautan sumber yang didukung diterima', () => {
  const url = 'https://soundcloud.com/example/track';
  assert.equal(playableQuery(url), url);
});

test('tautan dari domain lain ditolak', () => {
  assert.throws(() => playableQuery('https://example.com/audio.mp3'), /sumber musik yang didukung/);
});

test('tautan non-HTTPS ditolak', () => {
  assert.throws(() => playableQuery('http://soundcloud.com/example/track'), /sumber musik yang didukung/);
});
