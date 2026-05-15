export type LogMeta = Record<string, unknown>;

function print(level: 'info' | 'warn' | 'error', message: string, meta?: LogMeta) {
  if (!__DEV__ && level === 'info') return;
  const payload = meta ? [message, meta] : [message];
  if (level === 'error') console.error(...payload);
  else if (level === 'warn') console.warn(...payload);
  else console.log(...payload);
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    print('info', `[INFO] ${message}`, meta);
  },
  warn(message: string, meta?: LogMeta) {
    print('warn', `[WARN] ${message}`, meta);
  },
  error(message: string, meta?: LogMeta) {
    print('error', `[ERROR] ${message}`, meta);
  },
};