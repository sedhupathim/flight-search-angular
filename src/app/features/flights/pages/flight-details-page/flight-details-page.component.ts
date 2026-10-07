import { CurrencyPipe, DatePipe, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, numberAttribute } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { Subject, catchError, map, of, startWith, switchMap } from 'rxjs';

import { Airport } from '@core/models/airport.model';
import { Flight } from '@core/models/flight.model';
import { LoadState } from '@core/models/load-state.model';
import { AirportService } from '@core/services/airport.service';
import { FlightApiService } from '@core/services/flight-api.service';
import { parseIsoDate, startOfToday, toIsoDate } from '@core/utils/date.utils';
import { toLoadState } from '@core/utils/load-state.operator';
import { ErrorMessageComponent } from '@shared/components/error-message/error-message.component';
import { LoaderComponent } from '@shared/components/loader/loader.component';
import { DurationPipe } from '@shared/pipes/duration.pipe';
import { StopsPipe } from '@shared/pipes/stops.pipe';
import { MAX_PASSENGERS, MIN_PASSENGERS } from '../../flight-search.constants';

@Component({
  selector: 'app-flight-details-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    DurationPipe,
    StopsPipe,
    ErrorMessageComponent,
    LoaderComponent,
  ],
  templateUrl: './flight-details-page.component.html',
  styleUrl: './flight-details-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlightDetailsPageComponent {
  private readonly flightApi = inject(FlightApiService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  /** Bound from the `:id` route parameter (withComponentInputBinding). */
  readonly id = input.required<string>();
  /** Bound from the `?date=` query parameter. */
  readonly date = input<string>();
  /** Bound from the `?pax=` query parameter. */
  readonly pax = input(MIN_PASSENGERS, { transform: numberAttribute });

  private readonly retry$ = new Subject<void>();

  protected readonly travelDate = computed(() => {
    const date = parseIsoDate(this.date());
    return toIsoDate(date ?? startOfToday());
  });

  protected readonly passengers = computed(() => {
    const pax = this.pax();
    return Number.isInteger(pax) && pax >= MIN_PASSENGERS && pax <= MAX_PASSENGERS ? pax : MIN_PASSENGERS;
  });

  protected readonly state = toSignal(
    toObservable(computed(() => ({ id: this.id(), date: this.travelDate() }))).pipe(
      switchMap(({ id, date }) =>
        this.retry$.pipe(
          startWith(undefined),
          switchMap(() => this.flightApi.getFlightById(id, date).pipe(toLoadState())),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } as LoadState<Flight> },
  );

  /** Airport names are a nice-to-have: on failure, codes are shown instead of breaking the page. */
  private readonly airports = toSignal(
    inject(AirportService).airports$.pipe(
      map((airports) => new Map(airports.map((airport): [string, Airport] => [airport.code, airport]))),
      catchError(() => of(new Map<string, Airport>())),
    ),
    { initialValue: new Map<string, Airport>() },
  );

  protected readonly totalPrice = computed(() => {
    const state = this.state();
    return state.status === 'success' ? state.data.price * this.passengers() : 0;
  });

  protected airport(code: string): Airport | undefined {
    return this.airports().get(code);
  }

  protected onRetry(): void {
    this.retry$.next();
  }

  /** Returns to the results list when we came from it, otherwise to a fresh search. */
  protected goBack(): void {
    if (this.router.lastSuccessfulNavigation?.previousNavigation) {
      this.location.back();
    } else {
      void this.router.navigate(['/search']);
    }
  }
}
