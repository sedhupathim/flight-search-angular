import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, distinctUntilChanged, filter, map, startWith, switchMap, tap } from 'rxjs';

import { Flight } from '@core/models/flight.model';
import { LoadState } from '@core/models/load-state.model';
import { FlightSearchCriteria, RoundTripResults } from '@core/models/search-criteria.model';
import { FlightApiService } from '@core/services/flight-api.service';
import { parseIsoDate } from '@core/utils/date.utils';
import { toLoadState } from '@core/utils/load-state.operator';
import { ErrorMessageComponent } from '@shared/components/error-message/error-message.component';
import { LoaderComponent } from '@shared/components/loader/loader.component';
import { FlightFiltersComponent } from '../../components/flight-filters/flight-filters.component';
import { FlightListComponent } from '../../components/flight-list/flight-list.component';
import { SearchFormComponent } from '../../components/search-form/search-form.component';
import {
  DEFAULT_FLIGHT_FILTERS,
  FlightFilters,
  applyFlightFilters,
  buildFilterOptions,
} from '../../utils/flight-filters';
import { isSameCriteria, parseSearchParams, toSearchQueryParams } from '../../utils/search-params';

type SearchState = LoadState<RoundTripResults<Flight>>;

@Component({
  selector: 'app-results-page',
  standalone: true,
  imports: [
    DatePipe,
    MatTabsModule,
    ErrorMessageComponent,
    FlightFiltersComponent,
    FlightListComponent,
    LoaderComponent,
    SearchFormComponent,
  ],
  templateUrl: './results-page.component.html',
  styleUrl: './results-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly flightApi = inject(FlightApiService);

  private readonly retry$ = new Subject<void>();

  /** The URL is the single source of truth for the search, so results survive refreshes and can be shared. */
  private readonly criteria$ = this.route.queryParamMap.pipe(
    map(parseSearchParams),
    filter((criteria): criteria is FlightSearchCriteria => criteria !== null),
    distinctUntilChanged(isSameCriteria),
  );

  protected readonly criteria = toSignal(this.criteria$, { initialValue: null });
  protected readonly filters = signal<FlightFilters>(DEFAULT_FLIGHT_FILTERS);

  /** `switchMap` cancels an in-flight request when the user searches again before it completes. */
  protected readonly state = toSignal(
    this.criteria$.pipe(
      tap(() => this.filters.set(DEFAULT_FLIGHT_FILTERS)),
      switchMap((criteria) =>
        this.retry$.pipe(
          startWith(undefined),
          switchMap(() => this.flightApi.searchFlights(criteria).pipe(toLoadState())),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } as SearchState },
  );

  private readonly results = computed(() => {
    const state = this.state();
    return state.status === 'success' ? state.data : null;
  });

  protected readonly filterOptions = computed(() => {
    const results = this.results();
    return results ? buildFilterOptions([...results.outbound, ...(results.inbound ?? [])]) : null;
  });

  protected readonly outbound = computed(() => applyFlightFilters(this.results()?.outbound ?? [], this.filters()));
  protected readonly inbound = computed(() => applyFlightFilters(this.results()?.inbound ?? [], this.filters()));

  protected readonly departureDate = computed(() => parseIsoDate(this.criteria()?.departureDate));
  protected readonly returnDate = computed(() => parseIsoDate(this.criteria()?.returnDate));

  protected onSearch(criteria: FlightSearchCriteria): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: toSearchQueryParams(criteria) });
  }

  protected onRetry(): void {
    this.retry$.next();
  }
}
