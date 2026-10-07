import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="error" role="alert">
      <mat-icon class="error__icon" aria-hidden="true">error_outline</mat-icon>
      <div class="error__body">
        <h2 class="error__title">{{ title() }}</h2>
        <p class="error__message">{{ message() }}</p>
        @if (retryable()) {
          <button mat-stroked-button type="button" (click)="retry.emit()">
            <mat-icon>refresh</mat-icon>
            Try again
          </button>
        }
        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './error-message.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorMessageComponent {
  readonly title = input('Something went wrong');
  readonly message = input.required<string>();
  readonly retryable = input(true);
  readonly retry = output<void>();
}
