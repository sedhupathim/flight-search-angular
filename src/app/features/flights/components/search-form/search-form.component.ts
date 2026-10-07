import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroupDirective,
  NgForm,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ErrorStateMatcher, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Observable, catchError, combineLatest, debounceTime, distinctUntilChanged, map, of, startWith } from 'rxjs';

import { Airport } from '@core/models/airport.model';
import { FlightSearchCriteria } from '@core/models/search-criteria.model';
import { AirportService } from '@core/services/airport.service';
import { parseIsoDate, startOfToday, toIsoDate } from '@core/utils/date.utils';
import { MAX_PASSENGERS, MIN_PASSENGERS } from '../../flight-search.constants';
import {
  airportCodeValidator,
  dateRangeValidator,
  differentAirportsValidator,
  notInPastValidator,
} from '../../validators/flight-search.validators';

type TripType = 'round' | 'oneway';

const AUTOCOMPLETE_LIMIT = 8;

/** Shows a control as invalid when it, or the given group-level error, is present. */
class GroupErrorStateMatcher implements ErrorStateMatcher {
  constructor(private readonly groupErrorKey: string) {}

  isErrorState(control: AbstractControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const hasError = !!control?.invalid || !!form?.form.hasError(this.groupErrorKey);
    return hasError && (!!control?.touched || !!form?.submitted);
  }
}

@Component({
  selector: 'app-search-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './search-form.component.html',
  styleUrl: './search-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchFormComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly airportService = inject(AirportService);
  private readonly destroyRef = inject(DestroyRef);

  /** Pre-fills the form, e.g. with the criteria of the search currently displayed. */
  readonly initialCriteria = input<FlightSearchCriteria | null>(null);
  readonly search = output<FlightSearchCriteria>();

  protected readonly minPassengers = MIN_PASSENGERS;
  protected readonly maxPassengers = MAX_PASSENGERS;
  protected readonly today = startOfToday();
  protected readonly sameAirportsMatcher = new GroupErrorStateMatcher('sameAirports');
  protected readonly dateRangeMatcher = new GroupErrorStateMatcher('returnBeforeDeparture');

  protected readonly form = this.fb.group(
    {
      tripType: this.fb.control<TripType>('round'),
      from: this.fb.control('', [Validators.required, airportCodeValidator]),
      to: this.fb.control('', [Validators.required, airportCodeValidator]),
      departureDate: new FormControl<Date | null>(null, [Validators.required, notInPastValidator]),
      returnDate: new FormControl<Date | null>(null, [Validators.required]),
      passengers: this.fb.control(1, [
        Validators.required,
        Validators.min(MIN_PASSENGERS),
        Validators.max(MAX_PASSENGERS),
      ]),
    },
    {
      validators: [differentAirportsValidator('from', 'to'), dateRangeValidator('departureDate', 'returnDate')],
    },
  );

  private readonly airports$ = this.airportService.airports$.pipe(catchError(() => of<Airport[]>([])));
  protected readonly fromOptions = toSignal(this.filterAirports(this.form.controls.from), { initialValue: [] });
  protected readonly toOptions = toSignal(this.filterAirports(this.form.controls.to), { initialValue: [] });

  private readonly departureDate = toSignal(this.form.controls.departureDate.valueChanges, {
    initialValue: this.form.controls.departureDate.value,
  });
  /** Return date cannot be earlier than the chosen departure date. */
  protected readonly minReturnDate = computed(() => this.departureDate() ?? this.today);

  constructor() {
    effect(() => {
      const criteria = this.initialCriteria();
      // Patching emits valueChanges (which feed signals), so keep it outside the reactive context.
      if (criteria) {
        untracked(() => this.patchFromCriteria(criteria));
      }
    });
  }

  ngOnInit(): void {
    this.form.controls.tripType.valueChanges
      .pipe(startWith(this.form.controls.tripType.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((tripType) => {
        const returnDate = this.form.controls.returnDate;
        if (tripType === 'oneway') {
          returnDate.disable();
          returnDate.reset();
        } else {
          returnDate.enable();
        }
      });
  }

  protected get isRoundTrip(): boolean {
    return this.form.controls.tripType.value === 'round';
  }

  protected swapAirports(): void {
    const { from, to } = this.form.controls;
    const origin = from.value;
    from.setValue(to.value);
    to.setValue(origin);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { from, to, departureDate, returnDate, passengers } = this.form.getRawValue();
    this.search.emit({
      from: from.trim().toUpperCase(),
      to: to.trim().toUpperCase(),
      departureDate: toIsoDate(departureDate!),
      returnDate: this.isRoundTrip && returnDate ? toIsoDate(returnDate) : undefined,
      passengers,
    });
  }

  protected airportLabel(airport: Airport): string {
    return `${airport.city} (${airport.code})`;
  }

  private patchFromCriteria(criteria: FlightSearchCriteria): void {
    this.form.patchValue({
      tripType: criteria.returnDate ? 'round' : 'oneway',
      from: criteria.from,
      to: criteria.to,
      departureDate: parseIsoDate(criteria.departureDate),
      returnDate: parseIsoDate(criteria.returnDate),
      passengers: criteria.passengers,
    });
  }

  /** Autocomplete suggestions: matches on code, city or airport name as the user types. */
  private filterAirports(control: FormControl<string>): Observable<Airport[]> {
    const term$ = control.valueChanges.pipe(
      startWith(control.value),
      debounceTime(150),
      map((value) => value.trim().toLowerCase()),
      distinctUntilChanged(),
    );

    return combineLatest([this.airports$, term$]).pipe(
      map(([airports, term]) =>
        airports
          .filter(
            (airport) =>
              !term ||
              airport.code.toLowerCase().startsWith(term) ||
              airport.city.toLowerCase().includes(term) ||
              airport.name.toLowerCase().includes(term),
          )
          .slice(0, AUTOCOMPLETE_LIMIT),
      ),
    );
  }
}
