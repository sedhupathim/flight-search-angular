import { Routes } from '@angular/router';

import { FLIGHT_ROUTES } from '@features/flights/flights.routes';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'search' },
  ...FLIGHT_ROUTES,
  {
    path: '**',
    title: 'Page not found',
    loadComponent: () => import('@features/not-found/not-found-page.component').then((m) => m.NotFoundPageComponent),
  },
];
