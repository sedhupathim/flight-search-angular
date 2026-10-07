export interface FlightSearchCriteria {
  from: string;
  to: string;
  /** ISO calendar date, `yyyy-MM-dd`. */
  departureDate: string;
  /** ISO calendar date, `yyyy-MM-dd`. Absent for one-way trips. */
  returnDate?: string;
  passengers: number;
}

export interface RoundTripResults<T> {
  outbound: T[];
  inbound: T[] | null;
}
