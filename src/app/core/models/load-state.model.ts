import { AppError } from './app-error.model';

export type LoadState<T> =
  { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: AppError };
