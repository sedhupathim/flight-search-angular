# SkyFinder: Flight Search (Angular 18)

A small flight search app built with Angular 18. You search for flights between two airports, see the results, narrow them with filters, and open a details page for any flight. Flight data comes from a local REST API (json-server) through `HttpClient`.

## Setup

**Prerequisites:** Node.js 18.19+ or 20+ (tested with Node 20.20, npm 10.8).

```bash
npm install
npm start          # starts the mock API (port 3000) and the Angular dev server (port 4200)
```

Then open http://localhost:4200.

| Script                  | Purpose                                                                   |
| ----------------------- | ------------------------------------------------------------------------- |
| `npm start`             | Runs the mock API and the Angular dev server together (`concurrently`)    |
| `npm run api`           | Mock REST API only (json-server, with 700 ms of simulated latency)        |
| `npm run serve`         | Angular dev server only, proxying `/api` to `localhost:3000`              |
| `npm test`              | Unit tests (Karma + Jasmine)                                              |
| `npm run test:ci`       | Unit tests once, in headless Chrome                                       |
| `npm run build`         | Production build to `dist/`                                               |
| `npm run format`        | Formats code with Prettier                                                |
| `npm run mock:generate` | Regenerates `mock-api/db.json` (seeded, so the output is always the same) |

> If port 4200 is busy: `npm run api` in one terminal, `npx ng serve --proxy-config proxy.conf.json --port 4300` in another.

## Technologies

- **Angular 18.2**: standalone components, signals, built-in control flow (`@if`, `@for`, `@let`), functional guards and interceptors, `withComponentInputBinding`
- **TypeScript 5.5** in strict mode
- **RxJS 7.8**
- **Angular Material 18**: form fields, datepicker, autocomplete, slider, tabs, snackbar
- **json-server 0.17**: mock REST API
- **Karma + Jasmine**: unit tests
- **Prettier**: formatting

## API details

### Why a mock API?

Before building, I checked the public flight APIs:

- **Amadeus Self-Service**, the usual free choice, was shut down on 17 July 2026.
- **Duffel** has a free sandbox, but it needs a secret token. That token can't be put safely in a browser app, so a backend proxy would be needed.
- **Other providers** need sign-up and API keys, have usage limits, and may block browser requests (CORS).

Any of these would mean a reviewer needs their own credentials just to run the project. A local REST API works straight after `npm install`, always returns the same data, and makes it easy to show loading and error states. The task brief allows this option.

### Endpoints

The Angular dev server proxies `/api/*` to json-server (`proxy.conf.json`), so the app always calls relative URLs. The base URL is set in `src/environments/` and injected with the `API_CONFIG` token.

| Method | Endpoint           | Used for                                             |
| ------ | ------------------ | ---------------------------------------------------- |
| GET    | `/api/airports`    | Airport autocomplete and airport names (cached once) |
| GET    | `/api/flights`     | Search. Query params below                           |
| GET    | `/api/flights/:id` | Flight details. Returns `404` for an unknown ID      |

Search query parameters (filtered on the server by json-server):

```
GET /api/flights?origin=MAA&destination=DEL&seatsAvailable_gte=2&_sort=departureTime
```

Example flight record:

```json
{
  "id": "FL1001",
  "airline": { "code": "QP", "name": "Akasa Air" },
  "flightNumber": "QP 6115",
  "origin": "MAA",
  "destination": "DEL",
  "departureTime": "19:30",
  "arrivalTime": "22:20",
  "arrivalDayOffset": 0,
  "durationMinutes": 170,
  "stops": 0,
  "layovers": [],
  "price": 7600,
  "currency": "INR",
  "cabinClass": "Economy",
  "aircraft": "Airbus A320neo",
  "baggage": { "cabinKg": 7, "checkedKg": 15 },
  "refundable": true,
  "seatsAvailable": 40,
  "amenities": ["Complimentary meal", "Extra legroom"]
}
```

The dataset has 10 airports (8 in India, plus Dubai and Singapore) and about 430 flights. Every route between Indian airports is covered, and international routes connect to MAA, DEL, BOM or BLR.

Some routes to try: **MAA → DEL**, **BLR → BOM**, **DEL → DXB**, **BOM → SIN**.

## Project structure

```
src/app/
├── core/                         Singletons and code shared across the whole app
│   ├── config/api.config.ts      API_CONFIG injection token (base URL from environment)
│   ├── handlers/                 GlobalErrorHandler: logs the error and shows a snackbar
│   ├── interceptors/             httpErrorInterceptor: retries, then converts errors to AppError
│   ├── models/                   Flight / FlightDto, Airport, FlightSearchCriteria, AppError, LoadState
│   ├── services/                 FlightApiService, AirportService, PageTitleStrategy
│   └── utils/                    Date helpers, toLoadState() RxJS operator
├── shared/                       Reusable UI that knows nothing about any feature
│   ├── components/               flight-card, loader, error-message, empty-state
│   └── pipes/                    duration (125 → "2h 05m"), stops (0 → "Non-stop")
├── features/
│   ├── flights/
│   │   ├── components/           search-form, flight-filters, flight-list
│   │   ├── pages/                search-page, results-page, flight-details-page (lazy-loaded)
│   │   ├── guards/               validSearchGuard
│   │   ├── utils/                search-params (URL ⇄ criteria), flight-filters (pure functions)
│   │   ├── validators/           Custom form validators (single-field and cross-field)
│   │   └── flights.routes.ts
│   └── not-found/
└── app.config.ts / app.routes.ts
mock-api/                         db.json, generator script, json-server route mapping
```

### Routes

| Path                                                                 | Page                                                 |
| -------------------------------------------------------------------- | ---------------------------------------------------- |
| `/search`                                                            | Search form (default route)                          |
| `/results?from=MAA&to=DEL&depart=2026-10-20&return=2026-10-25&pax=2` | Results and filters. Protected by `validSearchGuard` |
| `/flights/:id?date=…&pax=…`                                          | Flight details                                       |
| `**`                                                                 | Not found                                            |

All pages are lazy-loaded with `loadComponent`.

## Key implementation decisions

1. **The URL holds the search.** The search form only navigates to `/results?...`. The results page reads its criteria from `queryParamMap`, so a refresh, a shared link or the back button all show the same results. `validSearchGuard` sends broken or hand-edited URLs back to `/search`.

2. **RxJS for anything asynchronous, signals for view state.**
   - Search: `queryParamMap → map(parse) → distinctUntilChanged → switchMap(api)`. `switchMap` cancels an older request when a new search starts, so stale responses can't overwrite newer ones.
   - Round trip: `forkJoin` fetches the outbound and return legs in parallel.
   - Retry: a `Subject` re-runs the current request, nested inside `switchMap`.
   - Filters: `valueChanges → debounceTime(250) → distinctUntilChanged`, exposed as a component output with `outputFromObservable`.
   - Airport autocomplete: `combineLatest(airports$, debounced input)`. The airport list is cached with `shareReplay`.
   - Filtering and sorting results is synchronous work on data already loaded, so it uses `computed()` signals. Filtering runs in the browser, so changing a filter never makes a new API call.

3. **Errors are handled at layers.**
   - The **interceptor** retries GET requests that fail with a network error or 5xx, twice, with exponential backoff (500 ms, then 1 s). Client errors (4xx) are never retried. Every failure becomes a typed `AppError` (`network | not-found | bad-request | server | unknown`) with a message that's safe to show users.
   - The **`toLoadState()` operator** turns each request into `loading | success | error`, so templates never handle raw errors and the stream never dies after an error.
   - **Pages** show specific states: a loader, an error with a retry button, "Flight not found" for a 404, "no flights found", and "no flights match your filters".
   - **`GlobalErrorHandler`** catches anything else, logs it and shows a snackbar.
   - Missing airport names are not treated as an error: the details page falls back to airport codes.

4. **The API's data format is kept separate from the app's.** The API returns a daily schedule (`FlightDto`, times as `"HH:mm"` plus `arrivalDayOffset`). `FlightApiService` converts it into a `Flight` with real `Date` objects for the date the user picked. Components only ever see `Flight`.

5. **Reusable, presentational components.** `flight-card`, `loader`, `error-message` and `empty-state` take data through inputs and send events through outputs. They don't inject services or know about routes. `search-form` is reused on the search page and the results page, where it's pre-filled through `initialCriteria`. `flight-list` is reused for the outbound and return tabs.

6. **Typed reactive forms with validation.**
   - Required fields, 3-letter airport codes, and passengers between 1 and 9.
   - Departure date can't be in the past, and the datepicker blocks earlier dates.
   - Cross-field rules: origin ≠ destination, and return date ≥ departure date.
   - Return date is disabled for one-way trips. A custom `ErrorStateMatcher` highlights the right field when a cross-field rule fails.

7. **Performance and accessibility.**
   - Every component uses `OnPush` change detection, and `@for` uses `track`.
   - Each flight card is a real link, so it works with the keyboard and can open in a new tab.
   - Includes ARIA labels, live regions for loading and result counts, `role="alert"` on errors, and a skip link.

8. **Responsive layout** with CSS grid. At phone width the filters stack above the results and the search form becomes a single column. Colours and spacing are CSS custom properties defined in `styles.scss`.

## Assumptions

- **Flights repeat daily.** The mock data is a timetable, not dated inventory, so the same flights appear on any date you pick. Times are applied to the chosen departure or return date.
- **Prices are per traveller, in INR, including taxes.** The details page shows the total for the number of travellers.
- **Seats:** only flights with at least as many seats left as the number of travellers are returned (`seatsAvailable_gte`).
- **Round trips** show outbound and return flights in two separate tabs. You choose each leg on its own, and the filters apply to both.
- **Airports** must be entered as 3-letter IATA codes. The autocomplete fills these in from a city or airport name. An unknown but well-formed code just returns "no flights found".
- **Dates** use the browser's locale through Material's `NativeDateAdapter` (MM/DD/YYYY in en-US). URLs always use ISO `yyyy-MM-dd`.
- **Booking, login and payments are out of scope.**
- **Passengers** are limited to 1–9, the usual online booking limit.

## Testing

```bash
npm run test:ci
```

40 unit tests cover:

- **Validators:** each rule, including cross-field rules and the disabled one-way case.
- **URL parsing:** valid and invalid parameters (impossible dates, return before departure, passenger limits), plus round-tripping criteria through the URL.
- **Filters:** price, stops (including "2 or more"), airlines, combined filters, the three sort orders, and not mutating the input.
- **`FlightApiService`** (with `HttpTestingController`): query parameters, date mapping, the parallel round-trip requests.
- **Interceptor:** retry and backoff (`fakeAsync`), giving up after the limit, no retries on 4xx, and the status-to-error mapping.
- **`SearchFormComponent`:** blocking invalid submits, normalising the emitted criteria, the trip-type toggle, and pre-filling.
- **Pipes.**

## Possible improvements

- Store the selected filters in the URL as well, so they survive the back button.
- Let users pick an outbound and a return flight together, with a combined price.
- Add end-to-end tests (Playwright) for the full search → filter → details flow.
- Add a small backend proxy to switch to a real provider such as Duffel. Only `FlightApiService` and its mapper would need to change.
