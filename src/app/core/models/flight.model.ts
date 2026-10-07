export interface Airline {
  code: string;
  name: string;
}

export interface Layover {
  airport: string;
  durationMinutes: number;
}

export interface Baggage {
  cabinKg: number;
  checkedKg: number;
}

/** Shape returned by the REST API: a recurring daily schedule entry. */
export interface FlightDto {
  id: string;
  airline: Airline;
  flightNumber: string;
  origin: string;
  destination: string;
  /** Local time of day, `HH:mm`. */
  departureTime: string;
  /** Local time of day, `HH:mm`. */
  arrivalTime: string;
  /** Days after departure that the flight lands (0 = same day). */
  arrivalDayOffset: number;
  durationMinutes: number;
  stops: number;
  layovers: Layover[];
  price: number;
  currency: string;
  cabinClass: string;
  aircraft: string;
  baggage: Baggage;
  refundable: boolean;
  seatsAvailable: number;
  amenities: string[];
}

/** Flight as used by the UI, with concrete departure/arrival timestamps for the travel date. */
export interface Flight extends Omit<FlightDto, 'departureTime' | 'arrivalTime' | 'arrivalDayOffset'> {
  departureTime: Date;
  arrivalTime: Date;
}
