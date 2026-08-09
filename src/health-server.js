import { createServer } from 'node:http';

function resolvePort(value = '3000') {
  const port = Number.parseInt(value, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT harus berupa angka 1 sampai 65535.');
  }
  return port;
}

export function createHealthServer({ isReady = () => true } = {}) {
  return createServer((request, response) => {
    if (request.method !== 'GET' || !['/', '/health'].includes(request.url)) {
      response.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ status: 'not-found' }));
      return;
    }

    const ready = Boolean(isReady());
    response.writeHead(ready ? 200 : 503, {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
    });
    response.end(JSON.stringify({ status: ready ? 'ok' : 'starting' }));
  });
}

export function startHealthServer({ isReady, logger, portValue = process.env.PORT } = {}) {
  const port = resolvePort(portValue ?? '3000');
  const server = createHealthServer({ isReady });

  server.on('error', (error) => {
    logger?.error('Health server gagal', { error: error.message, port });
  });
  server.listen(port, '0.0.0.0', () => {
    logger?.info('Health server siap', { port });
  });

  return server;
}

