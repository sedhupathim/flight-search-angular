import { Routes } from '@angular/router';

import { validSearchGuard } from './guards/valid-search.guard';

export const FLIGHT_ROUTES: Routes = [
  {
    path: 'search',
    title: 'Search flights',
    loadComponent: () => import('./pages/search-page/search-page.component').then((m) => m.SearchPageComponent),
  },
  {
    path: 'results',
    title: 'Flight results',
    canActivate: [validSearchGuard],
    loadComponent: () => import('./pages/results-page/results-page.component').then((m) => m.ResultsPageComponent),
  },
  {
    path: 'flights/:id',
    title: 'Flight details',
    loadComponent: () =>
      import('./pages/flight-details-page/flight-details-page.component').then((m) => m.FlightDetailsPageComponent),
  },
];
