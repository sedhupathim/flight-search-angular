import { ParamMap, Params } from '@angular/router';

import { FlightSearchCriteria } from '@core/models/search-criteria.model';
import { parseIsoDate } from '@core/utils/date.utils';
import { AIRPORT_CODE_PATTERN, MAX_PASSENGERS, MIN_PASSENGERS } from '../flight-search.constants';

/** Query parameter names used for the results URL, e.g. `/results?from=MAA&to=DEL&depart=2026-10-20&pax=2`. */
const PARAM = {
  from: 'from',
  to: 'to',
  departureDate: 'depart',
  returnDate: 'return',
  passengers: 'pax',
} as const;

export function toSearchQueryParams(criteria: FlightSearchCriteria): Params {
  return {
    [PARAM.from]: criteria.from,
    [PARAM.to]: criteria.to,
    [PARAM.departureDate]: criteria.departureDate,
    [PARAM.returnDate]: criteria.returnDate ?? null,
    [PARAM.passengers]: criteria.passengers,
  };
}

/** Parses and validates search criteria from the URL. Returns `null` when the parameters are missing or invalid. */
export function parseSearchParams(params: ParamMap): FlightSearchCriteria | null {
  const from = params.get(PARAM.from)?.toUpperCase() ?? '';
  const to = params.get(PARAM.to)?.toUpperCase() ?? '';
  const departureDate = params.get(PARAM.departureDate) ?? '';
  const returnDate = params.get(PARAM.returnDate) ?? undefined;
  const passengers = Number(params.get(PARAM.passengers));

  const departure = parseIsoDate(departureDate);
  const returning = returnDate ? parseIsoDate(returnDate) : null;

  const isValid =
    AIRPORT_CODE_PATTERN.test(from) &&
    AIRPORT_CODE_PATTERN.test(to) &&
    from !== to &&
    departure !== null &&
    (returnDate === undefined || (returning !== null && returning >= departure)) &&
    Number.isInteger(passengers) &&
    passengers >= MIN_PASSENGERS &&
    passengers <= MAX_PASSENGERS;

  return isValid ? { from, to, departureDate, returnDate, passengers } : null;
}

export function isSameCriteria(a: FlightSearchCriteria, b: FlightSearchCriteria): boolean {
  return (
    a.from === b.from &&
    a.to === b.to &&
    a.departureDate === b.departureDate &&
    a.returnDate === b.returnDate &&
    a.passengers === b.passengers
  );
}
