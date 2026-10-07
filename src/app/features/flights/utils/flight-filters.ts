import { Airline, Flight } from '@core/models/flight.model';

/** Stop buckets offered in the UI; `2` means "2 or more". */
export type StopOption = 0 | 1 | 2;
export type SortOption = 'price' | 'duration' | 'departure';

export interface FlightFilters {
  /** `null` means no upper price limit. */
  maxPrice: number | null;
  /** Empty means any number of stops. */
  stops: StopOption[];
  /** Airline codes; empty means all airlines. */
  airlines: string[];
  sortBy: SortOption;
}

export interface FilterOptions {
  airlines: Airline[];
  minPrice: number;
  maxPrice: number;
}

export const DEFAULT_FLIGHT_FILTERS: FlightFilters = {
  maxPrice: null,
  stops: [],
  airlines: [],
  sortBy: 'price',
};

const SORTERS: Record<SortOption, (a: Flight, b: Flight) => number> = {
  price: (a, b) => a.price - b.price,
  duration: (a, b) => a.durationMinutes - b.durationMinutes,
  departure: (a, b) => a.departureTime.getTime() - b.departureTime.getTime(),
};

const toStopOption = (stops: number): StopOption => (stops >= 2 ? 2 : (stops as StopOption));

export function applyFlightFilters(flights: readonly Flight[], filters: FlightFilters): Flight[] {
  const stops = new Set(filters.stops);
  const airlines = new Set(filters.airlines);

  return flights
    .filter(
      (flight) =>
        (filters.maxPrice === null || flight.price <= filters.maxPrice) &&
        (stops.size === 0 || stops.has(toStopOption(flight.stops))) &&
        (airlines.size === 0 || airlines.has(flight.airline.code)),
    )
    .sort(SORTERS[filters.sortBy]);
}

/** Derives the available filter values (airlines, price bounds) from a result set. */
export function buildFilterOptions(flights: readonly Flight[]): FilterOptions {
  const airlines = new Map<string, Airline>();
  let minPrice = Number.POSITIVE_INFINITY;
  let maxPrice = 0;

  for (const flight of flights) {
    airlines.set(flight.airline.code, flight.airline);
    minPrice = Math.min(minPrice, flight.price);
    maxPrice = Math.max(maxPrice, flight.price);
  }

  return {
    airlines: [...airlines.values()].sort((a, b) => a.name.localeCompare(b.name)),
    minPrice: flights.length ? minPrice : 0,
    maxPrice,
  };
}
