import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '../config/api.config';
import { Flight, FlightDto } from '../models/flight.model';
import { RoundTripResults } from '../models/search-criteria.model';
import { FlightApiService } from './flight-api.service';

const dto: FlightDto = {
  id: 'FL1',
  airline: { code: '6E', name: 'IndiGo' },
  flightNumber: '6E 100',
  origin: 'MAA',
  destination: 'DEL',
  departureTime: '22:30',
  arrivalTime: '01:15',
  arrivalDayOffset: 1,
  durationMinutes: 165,
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
};

describe('FlightApiService', () => {
  let service: FlightApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: '/api' } },
      ],
    });
    service = TestBed.inject(FlightApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('searches a one-way trip with the right query params and maps times onto the travel date', () => {
    let result: RoundTripResults<Flight> | undefined;
    service
      .searchFlights({ from: 'MAA', to: 'DEL', departureDate: '2026-10-20', passengers: 3 })
      .subscribe((r) => (result = r));

    const req = http.expectOne((r) => r.url === '/api/flights');
    expect(req.request.params.get('origin')).toBe('MAA');
    expect(req.request.params.get('destination')).toBe('DEL');
    expect(req.request.params.get('seatsAvailable_gte')).toBe('3');
    req.flush([dto]);

    expect(result?.inbound).toBeNull();
    const [flight] = result!.outbound;
    expect(flight.departureTime).toEqual(new Date(2026, 9, 20, 22, 30));
    expect(flight.arrivalTime).toEqual(new Date(2026, 9, 21, 1, 15));
  });

  it('searches both legs in parallel for a round trip', () => {
    let result: RoundTripResults<Flight> | undefined;
    service
      .searchFlights({ from: 'MAA', to: 'DEL', departureDate: '2026-10-20', returnDate: '2026-10-25', passengers: 1 })
      .subscribe((r) => (result = r));

    const requests = http.match((r) => r.url === '/api/flights');
    expect(requests.length).toBe(2);
    expect(requests[1].request.params.get('origin')).toBe('DEL');
    expect(requests[1].request.params.get('destination')).toBe('MAA');

    requests[0].flush([dto]);
    expect(result).toBeUndefined(); // forkJoin waits for both legs
    requests[1].flush([]);

    expect(result?.outbound.length).toBe(1);
    expect(result?.inbound).toEqual([]);
  });

  it('fetches a single flight by id', () => {
    let flight: Flight | undefined;
    service.getFlightById('FL1', '2026-10-20').subscribe((f) => (flight = f));

    http.expectOne('/api/flights/FL1').flush(dto);
    expect(flight?.id).toBe('FL1');
  });
});
