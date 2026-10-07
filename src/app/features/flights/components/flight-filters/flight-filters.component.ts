import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core';
import { outputFromObservable } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

import {
  DEFAULT_FLIGHT_FILTERS,
  FilterOptions,
  FlightFilters,
  SortOption,
  StopOption,
} from '../../utils/flight-filters';

const FILTER_DEBOUNCE_MS = 250;
const PRICE_STEP = 100;

@Component({
  selector: 'app-flight-filters',
  standalone: true,
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSliderModule,
  ],
  templateUrl: './flight-filters.component.html',
  styleUrl: './flight-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlightFiltersComponent {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly options = input.required<FilterOptions>();
  readonly currency = input('INR');

  protected readonly priceStep = PRICE_STEP;
  protected readonly stopOptions: { value: StopOption; label: string }[] = [
    { value: 0, label: 'Non-stop' },
    { value: 1, label: '1 stop' },
    { value: 2, label: '2+ stops' },
  ];
  protected readonly sortOptions: { value: SortOption; label: string }[] = [
    { value: 'price', label: 'Lowest price' },
    { value: 'duration', label: 'Shortest duration' },
    { value: 'departure', label: 'Earliest departure' },
  ];

  protected readonly form = this.fb.group({
    maxPrice: this.fb.control(0),
    stops: this.fb.control<StopOption[]>([]),
    airlines: this.fb.control<string[]>([]),
    sortBy: this.fb.control<SortOption>(DEFAULT_FLIGHT_FILTERS.sortBy),
  });

  /** Debounced so dragging the price slider doesn't re-filter on every pixel. */
  readonly filtersChange = outputFromObservable(
    this.form.valueChanges.pipe(
      debounceTime(FILTER_DEBOUNCE_MS),
      map(() => this.toFilters()),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    ),
  );

  constructor() {
    // A new result set brings new bounds/airlines, so start from a clean slate without emitting.
    effect(() => {
      const options = this.options();
      untracked(() => this.reset(options, false));
    });
  }

  protected onReset(): void {
    this.reset(this.options(), true);
  }

  protected toggleAirline(code: string, checked: boolean): void {
    const selected = new Set(this.form.controls.airlines.value);
    if (checked) {
      selected.add(code);
    } else {
      selected.delete(code);
    }
    this.form.controls.airlines.setValue([...selected]);
  }

  private reset(options: FilterOptions, emitEvent: boolean): void {
    this.form.reset({ ...DEFAULT_FLIGHT_FILTERS, maxPrice: this.roundUpToStep(options.maxPrice) }, { emitEvent });
  }

  private toFilters(): FlightFilters {
    const { maxPrice, stops, airlines, sortBy } = this.form.getRawValue();
    return {
      // Slider at its upper bound means "no limit".
      maxPrice: maxPrice >= this.options().maxPrice ? null : maxPrice,
      stops: [...stops].sort(),
      airlines: [...airlines].sort(),
      sortBy,
    };
  }

  private roundUpToStep(value: number): number {
    return Math.ceil(value / PRICE_STEP) * PRICE_STEP;
  }

  protected get sliderMin(): number {
    return Math.floor(this.options().minPrice / PRICE_STEP) * PRICE_STEP;
  }

  protected get sliderMax(): number {
    return this.roundUpToStep(this.options().maxPrice);
  }
}
