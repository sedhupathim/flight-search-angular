import { Flight } from '@core/models/flight.model';
import { DEFAULT_FLIGHT_FILTERS, applyFlightFilters, buildFilterOptions } from './flight-filters';

function flight(overrides: Partial<Flight> & Pick<Flight, 'id'>): Flight {
  return {
    airline: { code: '6E', name: 'IndiGo' },
    flightNumber: '6E 100',
    origin: 'MAA',
    destination: 'DEL',
    departureTime: new Date(2026, 9, 20, 8, 0),
    arrivalTime: new Date(2026, 9, 20, 11, 0),
    durationMinutes: 180,
    stops: 0,
    layovers: [],
    price: 5000,
    currency: 'INR',
    cabinClass: 'Economy',
    aircraft: 'Airbus A320neo',
    baggage: { cabinKg: 7, checkedKg: 15 },
    refundable: false,
    seatsAvailable: 10,
    amenities: [],
    ...overrides,
  };
}

describe('flight filters', () => {
  const flights = [
    flight({ id: 'a', price: 7000, stops: 0, durationMinutes: 170, departureTime: new Date(2026, 9, 20, 18, 0) }),
    flight({ id: 'b', price: 4000, stops: 1, airline: { code: 'AI', name: 'Air India' }, durationMinutes: 300 }),
    flight({
      id: 'c',
      price: 3000,
      stops: 2,
      airline: { code: 'SG', name: 'SpiceJet' },
      durationMinutes: 420,
      departureTime: new Date(2026, 9, 20, 6, 0),
    }),
  ];
  const ids = (result: Flight[]) => result.map((f) => f.id);

  it('returns everything sorted by price with default filters', () => {
    expect(ids(applyFlightFilters(flights, DEFAULT_FLIGHT_FILTERS))).toEqual(['c', 'b', 'a']);
  });

  it('filters by max price', () => {
    expect(ids(applyFlightFilters(flights, { ...DEFAULT_FLIGHT_FILTERS, maxPrice: 4000 }))).toEqual(['c', 'b']);
  });

  it('filters by stops, treating 2 as "2 or more"', () => {
    expect(ids(applyFlightFilters(flights, { ...DEFAULT_FLIGHT_FILTERS, stops: [0, 2] }))).toEqual(['c', 'a']);
    expect(ids(applyFlightFilters([flight({ id: 'd', stops: 3 })], { ...DEFAULT_FLIGHT_FILTERS, stops: [2] }))).toEqual(
      ['d'],
    );
  });

  it('filters by airline', () => {
    expect(ids(applyFlightFilters(flights, { ...DEFAULT_FLIGHT_FILTERS, airlines: ['AI', '6E'] }))).toEqual(['b', 'a']);
  });

  it('combines filters', () => {
    expect(applyFlightFilters(flights, { ...DEFAULT_FLIGHT_FILTERS, maxPrice: 5000, stops: [0] })).toEqual([]);
  });

  it('sorts by duration and departure time', () => {
    expect(ids(applyFlightFilters(flights, { ...DEFAULT_FLIGHT_FILTERS, sortBy: 'duration' }))).toEqual([
      'a',
      'b',
      'c',
    ]);
    expect(ids(applyFlightFilters(flights, { ...DEFAULT_FLIGHT_FILTERS, sortBy: 'departure' }))).toEqual([
      'c',
      'b',
      'a',
    ]);
  });

  it('does not mutate the input array', () => {
    const input = [...flights];
    applyFlightFilters(input, DEFAULT_FLIGHT_FILTERS);
    expect(ids(input)).toEqual(['a', 'b', 'c']);
  });

  it('builds filter options from results', () => {
    expect(buildFilterOptions(flights)).toEqual({
      airlines: [
        { code: 'AI', name: 'Air India' },
        { code: '6E', name: 'IndiGo' },
        { code: 'SG', name: 'SpiceJet' },
      ],
      minPrice: 3000,
      maxPrice: 7000,
    });
    expect(buildFilterOptions([])).toEqual({ airlines: [], minPrice: 0, maxPrice: 0 });
  });
});
