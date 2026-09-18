/**
 * Minimal structured logger. Serverless-friendly (writes to stdout/stderr only,
 * never to the filesystem). Good enough for the MVP per the spec — no external
 * logging infrastructure.
 */
type LogMeta = Record<string, unknown>;

function emit(level: 'info' | 'warn' | 'error', message: string, meta?: LogMeta): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ?? {}),
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, meta?: LogMeta) => emit('info', message, meta),
  warn: (message: string, meta?: LogMeta) => emit('warn', message, meta),
  error: (message: string, meta?: LogMeta) => emit('error', message, meta),
};
