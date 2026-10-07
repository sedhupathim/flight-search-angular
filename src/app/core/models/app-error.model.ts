export type AppErrorKind = 'network' | 'not-found' | 'bad-request' | 'server' | 'unknown';

/** Normalised, UI-safe error produced by the HTTP error interceptor. */
export class AppError extends Error {
  constructor(
    readonly kind: AppErrorKind,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
