import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { startOfToday } from '@core/utils/date.utils';
import { AIRPORT_CODE_PATTERN } from '../flight-search.constants';

/** Value must look like an IATA airport code (3 letters). */
export const airportCodeValidator: ValidatorFn = (control: AbstractControl<string>): ValidationErrors | null => {
  const value = control.value?.trim();
  return !value || AIRPORT_CODE_PATTERN.test(value) ? null : { airportCode: true };
};

/** Date must be today or later. */
export const notInPastValidator: ValidatorFn = (control: AbstractControl<Date | null>): ValidationErrors | null => {
  const value = control.value;
  return value && value < startOfToday() ? { pastDate: true } : null;
};

/** Group validator: origin and destination must differ. */
export function differentAirportsValidator(fromKey: string, toKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const from = (group.get(fromKey)?.value as string | null)?.trim().toUpperCase();
    const to = (group.get(toKey)?.value as string | null)?.trim().toUpperCase();
    return from && to && from === to ? { sameAirports: true } : null;
  };
}

/** Group validator: the return date (when present and enabled) must not be before the departure date. */
export function dateRangeValidator(startKey: string, endKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start = group.get(startKey);
    const end = group.get(endKey);
    if (!start?.value || !end?.value || end.disabled) {
      return null;
    }
    return (end.value as Date) < (start.value as Date) ? { returnBeforeDeparture: true } : null;
  };
}
