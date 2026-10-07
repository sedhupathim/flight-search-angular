import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { AppError } from '../models/app-error.model';
import { httpErrorInterceptor, toAppError } from './http-error.interceptor';

describe('httpErrorInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([httpErrorInterceptor])), provideHttpClientTesting()],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('retries transient GET failures with backoff, then succeeds', fakeAsync(() => {
    let body: unknown;
    client.get('/api/flights').subscribe((b) => (body = b));

    http.expectOne('/api/flights').flush(null, { status: 503, statusText: 'Unavailable' });
    tick(500);
    http.expectOne('/api/flights').flush(null, { status: 0, statusText: 'Unknown Error' });
    tick(1000);
    http.expectOne('/api/flights').flush({ ok: true });

    expect(body).toEqual({ ok: true });
  }));

  it('gives up after the retry limit and emits an AppError', fakeAsync(() => {
    let error: unknown;
    client.get('/api/flights').subscribe({ error: (e) => (error = e) });

    http.expectOne('/api/flights').flush(null, { status: 500, statusText: 'Error' });
    tick(500);
    http.expectOne('/api/flights').flush(null, { status: 500, statusText: 'Error' });
    tick(1000);
    http.expectOne('/api/flights').flush(null, { status: 500, statusText: 'Error' });

    expect(error).toEqual(jasmine.any(AppError));
    expect((error as AppError).kind).toBe('server');
  }));

  it('does not retry client errors', () => {
    let error: AppError | undefined;
    client.get('/api/flights/x').subscribe({ error: (e: AppError) => (error = e) });

    http.expectOne('/api/flights/x').flush(null, { status: 404, statusText: 'Not Found' });

    expect(error?.kind).toBe('not-found');
  });
});

describe('toAppError', () => {
  const response = (status: number) => new HttpErrorResponse({ status });

  it('maps HTTP statuses to error kinds', () => {
    expect(toAppError(response(0)).kind).toBe('network');
    expect(toAppError(response(400)).kind).toBe('bad-request');
    expect(toAppError(response(404)).kind).toBe('not-found');
    expect(toAppError(response(502)).kind).toBe('server');
    expect(toAppError(new Error('boom')).kind).toBe('unknown');
  });
});
