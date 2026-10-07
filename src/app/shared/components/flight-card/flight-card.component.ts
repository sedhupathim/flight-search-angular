import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { Flight } from '@core/models/flight.model';
import { DurationPipe } from '../../pipes/duration.pipe';
import { StopsPipe } from '../../pipes/stops.pipe';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Presentational summary of a single flight. Navigation is left to the parent. */
@Component({
  selector: 'app-flight-card',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, MatIconModule, DurationPipe, StopsPipe],
  templateUrl: './flight-card.component.html',
  styleUrl: './flight-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlightCardComponent {
  readonly flight = input.required<Flight>();

  /** Number of calendar days between departure and arrival (for the "+1" badge). */
  protected readonly dayOffset = computed(() => {
    const { departureTime, arrivalTime } = this.flight();
    const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    return Math.round((startOfDay(arrivalTime) - startOfDay(departureTime)) / MS_PER_DAY);
  });
}
