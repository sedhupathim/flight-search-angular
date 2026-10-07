import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink, MatButtonModule, EmptyStateComponent],
  template: `
    <div class="container">
      <app-empty-state icon="explore_off" title="Page not found" message="The page you are looking for doesn't exist.">
        <a mat-flat-button color="primary" routerLink="/search">Search flights</a>
      </app-empty-state>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPageComponent {}
