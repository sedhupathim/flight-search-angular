import { ErrorHandler, Injectable, NgZone, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/** Last line of defence for errors not handled by a component (e.g. bugs thrown during rendering). */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly snackBar = inject(MatSnackBar);
  private readonly zone = inject(NgZone);

  handleError(error: unknown): void {
    console.error('[GlobalErrorHandler]', error);

    this.zone.run(() =>
      this.snackBar.open('An unexpected error occurred. Please try again.', 'Dismiss', { duration: 5000 }),
    );
  }
}
