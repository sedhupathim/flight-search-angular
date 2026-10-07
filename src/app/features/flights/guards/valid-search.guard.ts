import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { parseSearchParams } from '../utils/search-params';

/** Sends users back to the search page when the results URL has missing or invalid criteria. */
export const validSearchGuard: CanActivateFn = (route) =>
  parseSearchParams(route.queryParamMap) !== null || inject(Router).createUrlTree(['/search']);
