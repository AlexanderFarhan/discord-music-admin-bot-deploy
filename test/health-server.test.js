import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHealthServer } from '../src/health-server.js';

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return server.address().port;
}

test('health server melaporkan bot siap', async (context) => {
  const server = createHealthServer({ isReady: () => true });
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const port = await listen(server);

  const response = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('health server melaporkan bot masih memulai', async (context) => {
  const server = createHealthServer({ isReady: () => false });
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const port = await listen(server);

  const response = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { status: 'starting' });
});

