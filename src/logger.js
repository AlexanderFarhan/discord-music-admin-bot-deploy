const LEVELS = Object.freeze({ debug: 10, info: 20, warn: 30, error: 40 });

export function createLogger(level = 'info') {
  const threshold = LEVELS[level] ?? LEVELS.info;

  function write(name, message, details) {
    if (LEVELS[name] < threshold) return;

    const line = {
      time: new Date().toISOString(),
      level: name,
      message,
      ...(details ? { details } : {}),
    };

    const output = JSON.stringify(line);
    if (name === 'error') console.error(output);
    else if (name === 'warn') console.warn(output);
    else console.log(output);
  }

  return {
    debug: (message, details) => write('debug', message, details),
    info: (message, details) => write('info', message, details),
    warn: (message, details) => write('warn', message, details),
    error: (message, details) => write('error', message, details),
  };
}

