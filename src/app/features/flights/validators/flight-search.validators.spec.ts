import { FormControl, FormGroup } from '@angular/forms';

import { startOfToday } from '@core/utils/date.utils';
import {
  airportCodeValidator,
  dateRangeValidator,
  differentAirportsValidator,
  notInPastValidator,
} from './flight-search.validators';

describe('flight search validators', () => {
  describe('airportCodeValidator', () => {
    it('accepts empty values (left to Validators.required) and 3-letter codes', () => {
      expect(airportCodeValidator(new FormControl(''))).toBeNull();
      expect(airportCodeValidator(new FormControl('MAA'))).toBeNull();
      expect(airportCodeValidator(new FormControl('del'))).toBeNull();
    });

    it('rejects anything that is not a 3-letter code', () => {
      expect(airportCodeValidator(new FormControl('Chennai'))).toEqual({ airportCode: true });
      expect(airportCodeValidator(new FormControl('M1A'))).toEqual({ airportCode: true });
    });
  });

  describe('notInPastValidator', () => {
    it('accepts today and future dates', () => {
      const today = startOfToday();
      const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      expect(notInPastValidator(new FormControl(today))).toBeNull();
      expect(notInPastValidator(new FormControl(tomorrow))).toBeNull();
    });

    it('rejects past dates', () => {
      const today = startOfToday();
      const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
      expect(notInPastValidator(new FormControl(yesterday))).toEqual({ pastDate: true });
    });
  });

  describe('differentAirportsValidator', () => {
    const validator = differentAirportsValidator('from', 'to');

    it('flags identical origin and destination, ignoring case', () => {
      const group = new FormGroup({ from: new FormControl('MAA'), to: new FormControl('maa') });
      expect(validator(group)).toEqual({ sameAirports: true });
    });

    it('passes when airports differ or one is empty', () => {
      expect(validator(new FormGroup({ from: new FormControl('MAA'), to: new FormControl('DEL') }))).toBeNull();
      expect(validator(new FormGroup({ from: new FormControl('MAA'), to: new FormControl('') }))).toBeNull();
    });
  });

  describe('dateRangeValidator', () => {
    const validator = dateRangeValidator('start', 'end');
    const group = (start: Date, end: Date | null) =>
      new FormGroup({ start: new FormControl(start), end: new FormControl(end) });

    it('flags a return date before departure', () => {
      expect(validator(group(new Date(2026, 9, 20), new Date(2026, 9, 19)))).toEqual({ returnBeforeDeparture: true });
    });

    it('allows same-day and later returns, or no return date', () => {
      expect(validator(group(new Date(2026, 9, 20), new Date(2026, 9, 20)))).toBeNull();
      expect(validator(group(new Date(2026, 9, 20), new Date(2026, 9, 25)))).toBeNull();
      expect(validator(group(new Date(2026, 9, 20), null))).toBeNull();
    });

    it('ignores a disabled return date (one-way trip)', () => {
      const form = group(new Date(2026, 9, 20), new Date(2026, 9, 1));
      form.controls.end.disable();
      expect(validator(form)).toBeNull();
    });
  });
});
