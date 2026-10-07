import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';

import { API_CONFIG } from '../config/api.config';
import { Flight, FlightDto } from '../models/flight.model';
import { FlightSearchCriteria, RoundTripResults } from '../models/search-criteria.model';
import { combineDateAndTime, parseIsoDate } from '../utils/date.utils';

@Injectable({ providedIn: 'root' })
export class FlightApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_CONFIG).baseUrl}/flights`;

  /** Searches the outbound leg and, for round trips, the return leg in parallel. */
  searchFlights(criteria: FlightSearchCriteria): Observable<RoundTripResults<Flight>> {
    const outbound$ = this.searchLeg(criteria.from, criteria.to, criteria.departureDate, criteria.passengers);
    const inbound$ = criteria.returnDate
      ? this.searchLeg(criteria.to, criteria.from, criteria.returnDate, criteria.passengers)
      : of(null);

    return forkJoin({ outbound: outbound$, inbound: inbound$ });
  }

  getFlightById(id: string, travelDate: string): Observable<Flight> {
    return this.http
      .get<FlightDto>(`${this.baseUrl}/${encodeURIComponent(id)}`)
      .pipe(map((dto) => this.toFlight(dto, travelDate)));
  }

  private searchLeg(origin: string, destination: string, travelDate: string, passengers: number): Observable<Flight[]> {
    const params = new HttpParams()
      .set('origin', origin)
      .set('destination', destination)
      .set('seatsAvailable_gte', passengers)
      .set('_sort', 'departureTime');

    return this.http
      .get<FlightDto[]>(this.baseUrl, { params })
      .pipe(map((dtos) => dtos.map((dto) => this.toFlight(dto, travelDate))));
  }

  /** Maps a schedule entry onto the requested travel date. */
  private toFlight(dto: FlightDto, travelDate: string): Flight {
    const date = parseIsoDate(travelDate) ?? new Date();
    const { departureTime, arrivalTime, arrivalDayOffset, ...rest } = dto;

    return {
      ...rest,
      departureTime: combineDateAndTime(date, departureTime),
      arrivalTime: combineDateAndTime(date, arrivalTime, arrivalDayOffset),
    };
  }
}
