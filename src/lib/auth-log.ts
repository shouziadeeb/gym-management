import type { LogMeta } from '@/lib/logger';
import { logger } from '@/lib/logger';

type AuthLogScope = 'AUTH' | 'GOOGLE_SIGNIN' | 'SESSION' | 'PROFILE' | 'NAVIGATION';

function scoped(scope: AuthLogScope, message: string, meta?: LogMeta) {
  logger.info(`${scope} ${message}`, meta);
}

function scopedWarn(scope: AuthLogScope, message: string, meta?: LogMeta) {
  logger.warn(`${scope} ${message}`, meta);
}

function scopedError(scope: AuthLogScope, message: string, meta?: LogMeta) {
  logger.error(`${scope} ${message}`, meta);
}

/** Structured auth logging with consistent scope prefixes. */
export const authLog = {
  auth: (message: string, meta?: LogMeta) => scoped('AUTH', message, meta),
  authWarn: (message: string, meta?: LogMeta) => scopedWarn('AUTH', message, meta),
  authError: (message: string, meta?: LogMeta) => scopedError('AUTH', message, meta),

  google: (message: string, meta?: LogMeta) => scoped('GOOGLE_SIGNIN', message, meta),
  googleWarn: (message: string, meta?: LogMeta) => scopedWarn('GOOGLE_SIGNIN', message, meta),
  googleError: (message: string, meta?: LogMeta) => scopedError('GOOGLE_SIGNIN', message, meta),

  session: (message: string, meta?: LogMeta) => scoped('SESSION', message, meta),
  sessionWarn: (message: string, meta?: LogMeta) => scopedWarn('SESSION', message, meta),

  profile: (message: string, meta?: LogMeta) => scoped('PROFILE', message, meta),
  profileWarn: (message: string, meta?: LogMeta) => scopedWarn('PROFILE', message, meta),

  navigation: (message: string, meta?: LogMeta) => scoped('NAVIGATION', message, meta),
};
