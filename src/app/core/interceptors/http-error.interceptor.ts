import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, retry, throwError, timer } from 'rxjs';

import { AppError } from '../models/app-error.model';

const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 500;

/** Retries transient failures of idempotent requests and converts every HTTP failure into an `AppError`. */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    retry({
      count: MAX_RETRIES,
      delay: (error: unknown, attempt: number) =>
        req.method === 'GET' && isTransient(error)
          ? timer(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1))
          : throwError(() => error),
    }),
    catchError((error: unknown) => throwError(() => toAppError(error))),
  );

function isTransient(error: unknown): boolean {
  return error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500);
}

export function toAppError(error: unknown): AppError {
  if (!(error instanceof HttpErrorResponse)) {
    return new AppError('unknown', 'Something went wrong. Please try again.');
  }
  if (error.status === 0) {
    return new AppError('network', 'Unable to reach the server. Please check your connection and try again.', 0);
  }
  if (error.status === 404) {
    return new AppError('not-found', 'The requested information could not be found.', 404);
  }
  if (error.status >= 400 && error.status < 500) {
    return new AppError(
      'bad-request',
      'The request was invalid. Please review your search and try again.',
      error.status,
    );
  }
  if (error.status >= 500) {
    return new AppError(
      'server',
      'Our flight service is temporarily unavailable. Please try again shortly.',
      error.status,
    );
  }
  return new AppError('unknown', 'Something went wrong. Please try again.', error.status);
}
