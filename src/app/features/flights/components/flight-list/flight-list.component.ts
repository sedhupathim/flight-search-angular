import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Flight } from '@core/models/flight.model';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { FlightCardComponent } from '@shared/components/flight-card/flight-card.component';

@Component({
  selector: 'app-flight-list',
  standalone: true,
  imports: [RouterLink, EmptyStateComponent, FlightCardComponent],
  template: `
    @if (totalCount() === 0) {
      <app-empty-state
        icon="flight"
        title="No flights found"
        message="There are no flights on this route for the selected date and number of passengers. Try a different date or route."
      />
    } @else {
      <p class="list__summary" aria-live="polite">Showing {{ flights().length }} of {{ totalCount() }} flights</p>
      <ul class="list" role="list">
        @for (flight of flights(); track flight.id) {
          <li>
            <a
              class="list__link"
              [routerLink]="['/flights', flight.id]"
              [queryParams]="{ date: travelDate(), pax: passengers() }"
              [attr.aria-label]="flight.airline.name + ' ' + flight.flightNumber + ', view details'"
            >
              <app-flight-card [flight]="flight" />
            </a>
          </li>
        } @empty {
          <app-empty-state
            icon="filter_alt_off"
            title="No flights match your filters"
            message="Try widening the price range or selecting more airlines or stops."
          />
        }
      </ul>
    }
  `,
  styleUrl: './flight-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlightListComponent {
  readonly flights = input.required<Flight[]>();
  /** Number of flights before filtering, used to tell "no results" from "filtered out". */
  readonly totalCount = input.required<number>();
  readonly travelDate = input.required<string>();
  readonly passengers = input.required<number>();
}
