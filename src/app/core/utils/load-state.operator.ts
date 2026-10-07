import { Observable, OperatorFunction, catchError, map, of, startWith } from 'rxjs';

import { AppError } from '../models/app-error.model';
import { LoadState } from '../models/load-state.model';

/** Wraps a request stream into loading / success / error states so templates never deal with raw errors. */
export function toLoadState<T>(): OperatorFunction<T, LoadState<T>> {
  return (source: Observable<T>) =>
    source.pipe(
      map((data): LoadState<T> => ({ status: 'success', data })),
      catchError((error: unknown) =>
        of<LoadState<T>>({
          status: 'error',
          error: error instanceof AppError ? error : new AppError('unknown', 'Something went wrong. Please try again.'),
        }),
      ),
      startWith<LoadState<T>>({ status: 'loading' }),
    );
}
