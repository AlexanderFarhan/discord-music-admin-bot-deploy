import { commands } from '../src/commands/index.js';

const names = new Set();
for (const command of commands) {
  const json = command.data.toJSON();
  if (names.has(json.name)) throw new Error(`Nama command duplikat: ${json.name}`);
  if (typeof command.execute !== 'function') throw new Error(`Command ${json.name} tidak memiliki execute()`);
  names.add(json.name);
}

console.log(`Validasi berhasil: ${commands.length} command (${[...names].join(', ')}).`);

