import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="empty">
      <mat-icon class="empty__icon" aria-hidden="true">{{ icon() }}</mat-icon>
      <h2 class="empty__title">{{ title() }}</h2>
      @if (message()) {
        <p class="empty__message">{{ message() }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: `
    .empty {
      text-align: center;
      padding: 48px 16px;
      color: var(--app-text-muted);
    }
    .empty__icon {
      width: 48px;
      height: 48px;
      font-size: 48px;
    }
    .empty__title {
      margin: 12px 0 4px;
      font-size: 1.1rem;
      font-weight: 500;
      color: var(--app-text);
    }
    .empty__message {
      margin: 0 0 16px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly icon = input('search_off');
  readonly title = input.required<string>();
  readonly message = input<string>();
}
