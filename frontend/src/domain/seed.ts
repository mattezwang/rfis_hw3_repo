// Mock service day: riders, vehicles, locations, travel times, runs and trips.
// Implements: A-1 (deferred booking, run building and vehicle matching replaced by seed data),
// A-13 (attendant seat), A-14 (30-minute windows), A-18 (boarding minutes per mobility need),
// PR-003 (scenarios S1–S4 in data-model.md §Seed design), data-model.md (all entities).
// All names other than Janelle (rider) and Frank (dispatcher), who are the interviewed
// stakeholders, are fictional.
import type { AppData, Location, Rider, Run, Stop, TravelTable, Trip, Vehicle } from './types';
import { hm } from './time';
import { sequenceStops } from './impact';

export const RIDER_ID = 'r-janelle';
export const RIDER_NAME = 'Janelle';
export const DISPATCHER_NAME = 'Frank';
export const JANELLE_RETURN_TRIP = 't-janelle-return';

/** Boarding minutes by mobility need (A-18). */
const BOARDING = { ambulatory: 2, wheelchair: 5, 'wheelchair-large': 7 } as const;

function rider(id: string, name: string, mobility: Rider['mobility'], mobilityNote: string): Rider {
  return { id, name, mobility, boardingMinutes: BOARDING[mobility], mobilityNote };
}

const riders: Rider[] = [
  rider(RIDER_ID, RIDER_NAME, 'wheelchair-large', 'Larger-than-standard power chair; needs full ramp clearance'),
  rider('r-ahmed', 'Ahmed K.', 'ambulatory', 'Walker'),
  rider('r-ruth', 'Ruth P.', 'wheelchair', 'Manual wheelchair'),
  rider('r-luis', 'Luis M.', 'wheelchair', 'Power wheelchair'),
  rider('r-grace', 'Grace T.', 'ambulatory', 'Low vision; travels with attendant'),
  rider('r-omar', 'Omar S.', 'ambulatory', 'Cane'),
  rider('r-mei', 'Mei L.', 'wheelchair', 'Manual wheelchair'),
  rider('r-dorothy', 'Dorothy W.', 'ambulatory', 'None'),
  rider('r-sam', 'Sam R.', 'wheelchair', 'Power wheelchair'),
  rider('r-ines', 'Inés V.', 'ambulatory', 'Walker'),
];

const vehicles: Vehicle[] = [
  { id: 'v-07', label: 'Van 07', seats: 6, wheelchairPositions: 2 },
  { id: 'v-11', label: 'Van 11', seats: 6, wheelchairPositions: 2 },
  { id: 'v-03', label: 'Van 03', seats: 6, wheelchairPositions: 2 },
];

/** Locations on a simple grid (km). Travel time = 4 + 2 min per km, Manhattan distance. */
const places: Array<Location & { x: number; y: number }> = [
  { id: 'garage', label: 'North Garage', x: 0, y: 0 },
  { id: 'office-park', label: 'Office Park, Building 4', x: 6, y: 2 },
  { id: 'janelle-home', label: 'Janelle’s home', x: 1, y: 6 },
  { id: 'senior-center', label: 'Riverside Senior Center', x: 5, y: 0 },
  { id: 'clinic', label: 'Eastside Clinic', x: 4, y: 4 },
  { id: 'ruth-home', label: 'Ruth’s home', x: 7, y: 5 },
  { id: 'market', label: 'Hillcrest Market', x: 3, y: 7 },
  { id: 'luis-home', label: 'Luis’s home', x: 6, y: 6 },
  { id: 'library', label: 'Central Library', x: 3, y: 2 },
  { id: 'grace-home', label: 'Grace’s home', x: 6, y: 0 },
  { id: 'omar-home', label: 'Omar’s home', x: 8, y: 1 },
  { id: 'mei-pickup', label: 'Community Pool', x: 4, y: 3 },
  { id: 'mei-home', label: 'Mei’s home', x: 1, y: 2 },
  { id: 'dorothy-home', label: 'Dorothy’s home', x: 2, y: 5 },
  { id: 'sam-home', label: 'Sam’s home', x: 7, y: 3 },
  { id: 'ines-home', label: 'Inés’s home', x: 0, y: 4 },
];

function travelTable(): TravelTable {
  const table: TravelTable = {};
  for (const a of places) {
    table[a.id] = {};
    for (const b of places) {
      table[a.id]![b.id] = a.id === b.id ? 0 : 4 + 2 * (Math.abs(a.x - b.x) + Math.abs(a.y - b.y));
    }
  }
  return table;
}

function trip(
  id: string,
  riderId: string,
  runId: string,
  from: string,
  to: string,
  windowStart: number,
  extra: Partial<Trip> = {},
): Trip {
  return {
    id,
    riderId,
    runId,
    pickupLocationId: from,
    dropoffLocationId: to,
    windowStart,
    attendant: false,
    status: 'scheduled',
    ...extra,
  };
}

const trips: Trip[] = [
  // Morning run R-3 (all completed).
  trip('t-janelle-morning', RIDER_ID, 'R-3', 'janelle-home', 'office-park', hm(7, 30), { status: 'completed' }),
  trip('t-dorothy-morning', 'r-dorothy', 'R-3', 'dorothy-home', 'clinic', hm(7, 45), { status: 'completed' }),

  // Afternoon run R-12 (Van 07): Janelle's return trip is on this run.
  trip('t-ahmed', 'r-ahmed', 'R-12', 'senior-center', 'clinic', hm(14, 5), { status: 'completed' }),
  trip('t-ruth', 'r-ruth', 'R-12', 'clinic', 'ruth-home', hm(15, 0)),
  trip('t-luis', 'r-luis', 'R-12', 'market', 'luis-home', hm(15, 10)),
  trip('t-grace', 'r-grace', 'R-12', 'library', 'grace-home', hm(15, 50), { attendant: true }),
  trip(JANELLE_RETURN_TRIP, RIDER_ID, 'R-12', 'office-park', 'janelle-home', hm(17, 0)),
  trip('t-omar', 'r-omar', 'R-12', 'office-park', 'omar-home', hm(17, 20)),
  trip('t-mei', 'r-mei', 'R-12', 'mei-pickup', 'mei-home', hm(18, 15)),

  // Afternoon run R-14 (Van 11): unaffected by Janelle's trips.
  trip('t-sam', 'r-sam', 'R-14', 'sam-home', 'clinic', hm(15, 0)),
  trip('t-ines', 'r-ines', 'R-14', 'ines-home', 'library', hm(15, 30)),
  trip('t-dorothy-pm', 'r-dorothy', 'R-14', 'clinic', 'dorothy-home', hm(16, 15)),
  trip('t-sam-return', 'r-sam', 'R-14', 'clinic', 'sam-home', hm(17, 0)),
];

function stopsFor(tripIds: string[], completed: Record<string, [number, number]> = {}): Stop[] {
  return tripIds.flatMap((id) => [
    { tripId: id, kind: 'pickup' as const, completedAt: completed[id]?.[0] ?? null, changeMark: null },
    { tripId: id, kind: 'dropoff' as const, completedAt: completed[id]?.[1] ?? null, changeMark: null },
  ]);
}

const runs: Run[] = [
  {
    id: 'R-3',
    label: 'R-3 (morning)',
    vehicleId: 'v-03',
    driverName: 'Pat Okafor',
    startLocationId: 'garage',
    startTime: hm(7, 0),
    stops: [
      { tripId: 't-janelle-morning', kind: 'pickup', completedAt: hm(7, 34), changeMark: null },
      { tripId: 't-dorothy-morning', kind: 'pickup', completedAt: hm(7, 52), changeMark: null },
      { tripId: 't-dorothy-morning', kind: 'dropoff', completedAt: hm(8, 6), changeMark: null },
      { tripId: 't-janelle-morning', kind: 'dropoff', completedAt: hm(8, 20), changeMark: null },
    ],
  },
  {
    id: 'R-12',
    label: 'R-12 (afternoon)',
    vehicleId: 'v-07',
    driverName: 'Dana Morales',
    startLocationId: 'garage',
    startTime: hm(14, 0),
    stops: stopsFor(
      ['t-ahmed', 't-ruth', 't-luis', 't-grace', JANELLE_RETURN_TRIP, 't-omar', 't-mei'],
      { 't-ahmed': [hm(14, 14), hm(14, 28)] },
    ),
  },
  {
    id: 'R-14',
    label: 'R-14 (afternoon)',
    vehicleId: 'v-11',
    driverName: 'Chris Lindqvist',
    startLocationId: 'garage',
    startTime: hm(14, 30),
    stops: stopsFor(['t-sam', 't-ines', 't-dorothy-pm', 't-sam-return']),
  },
];

function byId<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map((i) => [i.id, i]));
}

/** A fresh copy of the seeded service day. */
export function createSeed(): AppData {
  const data: AppData = {
    riders: byId(riders),
    vehicles: byId(vehicles),
    locations: byId(places.map(({ id, label }) => ({ id, label }))),
    travel: travelTable(),
    trips: byId(trips.map((t) => ({ ...t }))),
    runs: {},
    serviceDay: { start: hm(6, 0), end: hm(21, 0) },
    requests: [],
    history: [],
    nextId: 1,
  };
  // Order every afternoon run by scheduled time (A-15) so later re-sequencing never reorders
  // unchanged stops.
  for (const run of runs) {
    data.runs[run.id] = {
      ...run,
      stops: run.id === 'R-3' ? run.stops.map((s) => ({ ...s })) : sequenceStops(run.stops.map((s) => ({ ...s })), data),
    };
  }
  return data;
}
