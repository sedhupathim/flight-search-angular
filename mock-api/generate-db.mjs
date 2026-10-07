/**
 * Generates mock-api/db.json with airports and a deterministic daily flight schedule.
 * Run with: npm run mock:generate
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const airports = [
  { code: 'MAA', city: 'Chennai', name: 'Chennai International Airport', country: 'India', lat: 12.99, lon: 80.17 },
  {
    code: 'DEL',
    city: 'New Delhi',
    name: 'Indira Gandhi International Airport',
    country: 'India',
    lat: 28.56,
    lon: 77.1,
  },
  {
    code: 'BOM',
    city: 'Mumbai',
    name: 'Chhatrapati Shivaji Maharaj International Airport',
    country: 'India',
    lat: 19.09,
    lon: 72.87,
  },
  { code: 'BLR', city: 'Bengaluru', name: 'Kempegowda International Airport', country: 'India', lat: 13.2, lon: 77.71 },
  {
    code: 'HYD',
    city: 'Hyderabad',
    name: 'Rajiv Gandhi International Airport',
    country: 'India',
    lat: 17.24,
    lon: 78.43,
  },
  {
    code: 'CCU',
    city: 'Kolkata',
    name: 'Netaji Subhas Chandra Bose International Airport',
    country: 'India',
    lat: 22.65,
    lon: 88.45,
  },
  { code: 'COK', city: 'Kochi', name: 'Cochin International Airport', country: 'India', lat: 10.15, lon: 76.4 },
  { code: 'GOI', city: 'Goa', name: 'Goa International Airport', country: 'India', lat: 15.38, lon: 73.83 },
  { code: 'DXB', city: 'Dubai', name: 'Dubai International Airport', country: 'UAE', lat: 25.25, lon: 55.36 },
  { code: 'SIN', city: 'Singapore', name: 'Singapore Changi Airport', country: 'Singapore', lat: 1.36, lon: 103.99 },
];

const domesticAirlines = [
  { code: '6E', name: 'IndiGo' },
  { code: 'AI', name: 'Air India' },
  { code: 'QP', name: 'Akasa Air' },
  { code: 'SG', name: 'SpiceJet' },
  { code: 'IX', name: 'Air India Express' },
];
const internationalAirlines = [
  { code: 'EK', name: 'Emirates' },
  { code: 'SQ', name: 'Singapore Airlines' },
  { code: 'AI', name: 'Air India' },
  { code: '6E', name: 'IndiGo' },
];

const hubs = ['DEL', 'BOM', 'BLR', 'HYD'];
const aircraft = ['Airbus A320neo', 'Airbus A321neo', 'Boeing 737 MAX 8', 'Boeing 787-8', 'ATR 72-600'];
const amenityPool = ['Wi-Fi', 'In-seat power', 'Complimentary meal', 'Snacks for purchase', 'Extra legroom'];

// Seeded PRNG (mulberry32) so the generated file is reproducible.
let seed = 20261007;
function random() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const randInt = (min, max) => Math.floor(random() * (max - min + 1)) + min;
const pick = (items) => items[Math.floor(random() * items.length)];

function distanceKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const pad = (n) => String(n).padStart(2, '0');
const toTime = (minutes) => `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`;

function buildFlight(id, origin, destination, international) {
  const airline = pick(international ? internationalAirlines : domesticAirlines);
  const stops = random() < 0.55 ? 0 : random() < 0.75 ? 1 : 2;
  const km = distanceKm(origin, destination);
  const flyingMinutes = Math.round(35 + (km / 780) * 60);

  const layoverCandidates = hubs.filter((code) => code !== origin.code && code !== destination.code);
  const layovers = [...layoverCandidates]
    .sort(() => random() - 0.5)
    .slice(0, stops)
    .map((airport) => ({ airport, durationMinutes: randInt(4, 16) * 15 }));
  const durationMinutes =
    flyingMinutes + stops * 45 + layovers.reduce((sum, layover) => sum + layover.durationMinutes, 0);

  const departureMinutes = randInt(20, 92) * 15; // 05:00 - 23:00
  const arrivalTotal = departureMinutes + durationMinutes;

  const basePrice = 1800 + km * (international ? 6.5 : 4.2);
  const price = Math.round((basePrice * (1 - stops * 0.12) * (0.8 + random() * 0.6)) / 10) * 10;

  return {
    id: `FL${id}`,
    airline,
    flightNumber: `${airline.code} ${randInt(100, 9899)}`,
    origin: origin.code,
    destination: destination.code,
    departureTime: toTime(departureMinutes),
    arrivalTime: toTime(arrivalTotal),
    arrivalDayOffset: Math.floor(arrivalTotal / (24 * 60)),
    durationMinutes,
    stops,
    layovers,
    price,
    currency: 'INR',
    cabinClass: 'Economy',
    aircraft: pick(aircraft),
    baggage: { cabinKg: 7, checkedKg: international ? 30 : pick([15, 20, 25]) },
    refundable: random() < 0.4,
    seatsAvailable: randInt(1, 40),
    amenities: amenityPool.filter(() => random() < 0.4),
  };
}

const flights = [];
let nextId = 1001;
for (const origin of airports) {
  for (const destination of airports) {
    if (origin.code === destination.code) continue;
    const international = origin.country !== 'India' || destination.country !== 'India';
    // Keep international coverage to routes touching the major Indian hubs.
    if (international && ![origin.code, destination.code].some((code) => ['MAA', 'DEL', 'BOM', 'BLR'].includes(code))) {
      continue;
    }
    const count = randInt(4, 8);
    for (let i = 0; i < count; i++) {
      flights.push(buildFlight(nextId++, origin, destination, international));
    }
  }
}

const db = {
  airports: airports.map(({ lat, lon, ...airport }) => airport),
  flights,
};

const outFile = join(dirname(fileURLToPath(import.meta.url)), 'db.json');
writeFileSync(outFile, JSON.stringify(db, null, 2) + '\n');
console.log(`Wrote ${db.airports.length} airports and ${flights.length} flights to ${outFile}`);
