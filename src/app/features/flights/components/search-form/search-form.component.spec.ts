import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { FlightSearchCriteria } from '@core/models/search-criteria.model';
import { AirportService } from '@core/services/airport.service';
import { SearchFormComponent } from './search-form.component';

describe('SearchFormComponent', () => {
  let fixture: ComponentFixture<SearchFormComponent>;
  let emitted: FlightSearchCriteria[];

  const futureDate = (daysAhead: number) => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + daysAhead);
  };

  // Accesses the protected form for test setup.
  const form = () => (fixture.componentInstance as unknown as { form: SearchFormComponent['form'] }).form;
  const submit = () => fixture.nativeElement.querySelector('button[type="submit"]').click();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SearchFormComponent],
      providers: [provideNoopAnimations(), { provide: AirportService, useValue: { airports$: of([]) } }],
    });
    fixture = TestBed.createComponent(SearchFormComponent);
    emitted = [];
    fixture.componentInstance.search.subscribe((c) => emitted.push(c));
    fixture.detectChanges();
  });

  it('does not emit and shows errors when the form is invalid', () => {
    submit();
    fixture.detectChanges();

    expect(emitted).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('Origin is required');
  });

  it('emits normalised criteria for a valid one-way search', () => {
    const depart = futureDate(5);
    form().patchValue({ tripType: 'oneway', from: 'maa', to: 'del', departureDate: depart, passengers: 2 });
    submit();

    expect(emitted.length).toBe(1);
    expect(emitted[0]).toEqual(
      jasmine.objectContaining({ from: 'MAA', to: 'DEL', passengers: 2, returnDate: undefined }),
    );
  });

  it('requires a return date for round trips and disables it for one-way', () => {
    form().patchValue({ tripType: 'round' });
    expect(form().controls.returnDate.enabled).toBeTrue();
    expect(form().controls.returnDate.hasError('required')).toBeTrue();

    form().patchValue({ tripType: 'oneway' });
    expect(form().controls.returnDate.disabled).toBeTrue();
  });

  it('flags identical airports', () => {
    form().patchValue({ from: 'MAA', to: 'MAA' });
    expect(form().hasError('sameAirports')).toBeTrue();
  });

  it('pre-fills from initial criteria', () => {
    fixture.componentRef.setInput('initialCriteria', {
      from: 'BLR',
      to: 'BOM',
      departureDate: '2030-01-10',
      returnDate: '2030-01-12',
      passengers: 3,
    });
    fixture.detectChanges();

    expect(form().getRawValue()).toEqual(
      jasmine.objectContaining({ tripType: 'round', from: 'BLR', to: 'BOM', passengers: 3 }),
    );
  });
});
