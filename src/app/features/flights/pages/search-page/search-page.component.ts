import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { FlightSearchCriteria } from '@core/models/search-criteria.model';
import { SearchFormComponent } from '../../components/search-form/search-form.component';
import { toSearchQueryParams } from '../../utils/search-params';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [SearchFormComponent],
  template: `
    <section class="hero">
      <div class="container">
        <h1 class="hero__title">Find your next flight</h1>
        <p class="hero__subtitle">Compare fares across airlines and book with confidence.</p>
        <div class="panel">
          <app-search-form (search)="onSearch($event)" />
        </div>
      </div>
    </section>
  `,
  styles: `
    .hero {
      padding: 56px 0 72px;
      background: linear-gradient(160deg, var(--app-primary-soft), transparent 70%);
    }
    .hero__title {
      margin: 0 0 8px;
      font-size: clamp(1.8rem, 4vw, 2.6rem);
      font-weight: 600;
    }
    .hero__subtitle {
      margin: 0 0 28px;
      color: var(--app-text-muted);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPageComponent {
  private readonly router = inject(Router);

  protected onSearch(criteria: FlightSearchCriteria): void {
    void this.router.navigate(['/results'], { queryParams: toSearchQueryParams(criteria) });
  }
}
