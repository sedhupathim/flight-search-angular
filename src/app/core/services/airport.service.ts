import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

import { API_CONFIG } from '../config/api.config';
import { Airport } from '../models/airport.model';

@Injectable({ providedIn: 'root' })
export class AirportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_CONFIG).baseUrl;

  /** Airport list is static, so it is fetched once and cached. A failed request is retried on next subscribe. */
  readonly airports$: Observable<Airport[]> = this.http
    .get<Airport[]>(`${this.baseUrl}/airports`)
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));
}
