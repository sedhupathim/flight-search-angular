import { convertToParamMap } from '@angular/router';

import { parseSearchParams, toSearchQueryParams } from './search-params';

describe('search params', () => {
  const valid = { from: 'MAA', to: 'DEL', depart: '2026-10-20', return: '2026-10-25', pax: '2' };

  it('parses valid round-trip params', () => {
    expect(parseSearchParams(convertToParamMap(valid))).toEqual({
      from: 'MAA',
      to: 'DEL',
      departureDate: '2026-10-20',
      returnDate: '2026-10-25',
      passengers: 2,
    });
  });

  it('parses one-way params and normalises airport case', () => {
    const { return: _, ...oneWay } = valid;
    expect(parseSearchParams(convertToParamMap({ ...oneWay, from: 'maa' }))).toEqual(
      jasmine.objectContaining({ from: 'MAA', returnDate: undefined }),
    );
  });

  it('round-trips through toSearchQueryParams', () => {
    const criteria = parseSearchParams(convertToParamMap(valid))!;
    expect(parseSearchParams(convertToParamMap(toSearchQueryParams(criteria)))).toEqual(criteria);
  });

  const invalidCases: [string, Record<string, string>][] = [
    ['missing origin', { ...valid, from: '' }],
    ['same airports', { ...valid, to: 'MAA' }],
    ['impossible date', { ...valid, depart: '2026-02-31' }],
    ['return before departure', { ...valid, return: '2026-10-01' }],
    ['too many passengers', { ...valid, pax: '10' }],
    ['fractional passengers', { ...valid, pax: '1.5' }],
  ];

  invalidCases.forEach(([label, params]) => {
    it(`returns null for ${label}`, () => {
      expect(parseSearchParams(convertToParamMap(params))).toBeNull();
    });
  });
});
