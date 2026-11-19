// Route impact: the only place stop times, windows and capacity are calculated.
// Implements: FR-010 (impact on every stop), FR-013 (requester's own window unreachable),
// FR-015 (one calculation for preview, decision and dispatcher view), A-4, A-13, A-15, A-16,
// research.md R-3, contracts/decision-module.md (simulateRun, computeImpact).
// Pure functions: no clock, no React (constitution Principle V).
import type {
  ImpactRow,
  ProposedChange,
  RouteImpact,
  Run,
  Stop,
  StopEstimate,
  Trip,
  World,
} from './types';
import { windowEnd } from './time';
import { decideChange } from './decide';

function travel(world: World, from: string, to: string): number {
  if (from === to) return 0;
  const minutes = world.travel[from]?.[to];
  if (minutes === undefined) throw new Error(`No travel time from ${from} to ${to}`);
  return minutes;
}

function usesWheelchair(world: World, trip: Trip): boolean {
  return world.riders[trip.riderId]?.mobility !== 'ambulatory';
}

/** Seats a trip occupies: the rider if ambulatory, plus an attendant (A-13). */
function seatsFor(world: World, trip: Trip): number {
  return (usesWheelchair(world, trip) ? 0 : 1) + (trip.attendant ? 1 : 0);
}

/**
 * Simulates a run stop by stop (research.md R-3).
 * Completed stops keep their recorded time. A van that reaches a pickup early waits for the
 * window to open (A-4). Cancelled trips' stops are skipped.
 */
export function simulateRun(run: Run, world: World): StopEstimate[] {
  let location = run.startLocationId;
  let clock = run.startTime;
  let seats = 0;
  let wheelchairs = 0;
  const out: StopEstimate[] = [];

  for (const stop of run.stops) {
    const trip = world.trips[stop.tripId];
    if (!trip) throw new Error(`Unknown trip ${stop.tripId}`);
    if (trip.status === 'cancelled') {
      out.push({
        tripId: stop.tripId,
        kind: stop.kind,
        time: null,
        outsideWindow: false,
        onboardSeats: seats,
        onboardWheelchairs: wheelchairs,
        skipped: true,
      });
      continue;
    }
    const rider = world.riders[trip.riderId];
    if (!rider) throw new Error(`Unknown rider ${trip.riderId}`);
    const stopLocation = stop.kind === 'pickup' ? trip.pickupLocationId : trip.dropoffLocationId;

    let time: number;
    if (stop.completedAt !== null) {
      time = stop.completedAt;
    } else {
      const arrival = clock + travel(world, location, stopLocation);
      time = stop.kind === 'pickup' ? Math.max(arrival, trip.windowStart) : arrival;
    }

    const sign = stop.kind === 'pickup' ? 1 : -1;
    seats += sign * seatsFor(world, trip);
    wheelchairs += sign * (usesWheelchair(world, trip) ? 1 : 0);

    out.push({
      tripId: stop.tripId,
      kind: stop.kind,
      time,
      outsideWindow: stop.kind === 'pickup' && time > windowEnd(trip.windowStart),
      onboardSeats: seats,
      onboardWheelchairs: wheelchairs,
      skipped: false,
    });

    clock = time + rider.boardingMinutes;
    location = stopLocation;
  }
  return out;
}

/** Scheduled time a stop is ordered by (A-15). A drop-off follows its own pickup. */
function anchor(world: World, stop: Stop): number {
  const trip = world.trips[stop.tripId]!;
  if (stop.kind === 'pickup') return trip.windowStart;
  const rider = world.riders[trip.riderId]!;
  return (
    trip.windowStart +
    rider.boardingMinutes +
    travel(world, trip.pickupLocationId, trip.dropoffLocationId)
  );
}

/**
 * Orders a run's stops by scheduled time (A-15). Completed stops stay first, in their recorded
 * order. Ties keep the existing order, so unchanged stops never swap places.
 */
export function sequenceStops(stops: Stop[], world: World): Stop[] {
  const done = stops.filter((s) => s.completedAt !== null);
  const open = stops
    .filter((s) => s.completedAt === null)
    .map((s, i) => ({ s, i, a: anchor(world, s) }))
    .sort((x, y) => x.a - y.a || x.i - y.i)
    .map((x) => x.s);
  return [...done, ...open];
}

/** The world as it would be if the change were applied (used for "after"). */
export function applyToWorld(world: World, change: ProposedChange): World {
  const trip = world.trips[change.tripId];
  if (!trip) throw new Error(`Unknown trip ${change.tripId}`);
  const changedTrip: Trip =
    change.kind === 'cancel'
      ? { ...trip, status: 'cancelled' }
      : { ...trip, windowStart: change.newWindowStart ?? trip.windowStart };
  const trips = { ...world.trips, [trip.id]: changedTrip };
  const next: World = { ...world, trips };
  const run = world.runs[trip.runId]!;
  const runs = { ...world.runs, [run.id]: { ...run, stops: sequenceStops(run.stops, next) } };
  return { ...next, runs };
}

function key(e: { tripId: string; kind: string }): string {
  return `${e.tripId}:${e.kind}`;
}

/**
 * Impact of a proposed change on its run, comparing the run before and after
 * (contracts/decision-module.md). Called against the current world every time a pending
 * change is previewed, shown or accepted (A-16).
 */
export function computeImpact(change: ProposedChange, world: World): RouteImpact {
  const trip = world.trips[change.tripId];
  if (!trip) throw new Error(`Unknown trip ${change.tripId}`);
  const runBefore = world.runs[trip.runId]!;
  const vehicle = world.vehicles[runBefore.vehicleId]!;

  const before = new Map(simulateRun(runBefore, world).map((e) => [key(e), e]));
  const afterWorld = applyToWorld(world, change);
  const runAfter = afterWorld.runs[trip.runId]!;
  const afterEstimates = simulateRun(runAfter, afterWorld);

  const beforeOverCapacity = [...before.values()].some(
    (e) => e.onboardSeats > vehicle.seats || e.onboardWheelchairs > vehicle.wheelchairPositions,
  );

  const rows: ImpactRow[] = afterEstimates.map((after, i) => {
    const stop = runAfter.stops[i]!;
    const t = afterWorld.trips[after.tripId]!;
    const rider = afterWorld.riders[t.riderId]!;
    const locationId = after.kind === 'pickup' ? t.pickupLocationId : t.dropoffLocationId;
    const prior = before.get(key(after));
    return {
      tripId: after.tripId,
      riderName: rider.name,
      kind: after.kind,
      locationLabel: afterWorld.locations[locationId]?.label ?? locationId,
      mobilityNote: rider.mobilityNote,
      attendant: t.attendant,
      windowStart: after.kind === 'pickup' ? t.windowStart : null,
      windowEnd: after.kind === 'pickup' ? windowEnd(t.windowStart) : null,
      before: prior?.time ?? null,
      after: after.time,
      outsideWindowAfter: after.outsideWindow,
      onboardSeatsAfter: after.onboardSeats,
      onboardWheelchairsAfter: after.onboardWheelchairs,
      overCapacityAfter:
        !after.skipped &&
        (after.onboardSeats > vehicle.seats ||
          after.onboardWheelchairs > vehicle.wheelchairPositions),
      isRequester: after.tripId === change.tripId,
      completed: stop.completedAt !== null,
    };
  });

  // A pickup already outside its window before the change was not pushed there by it.
  const othersOutsideWindow = afterEstimates
    .filter(
      (e) =>
        e.kind === 'pickup' &&
        e.tripId !== change.tripId &&
        e.outsideWindow &&
        !before.get(key(e))?.outsideWindow,
    )
    .map((e) => e.tripId);

  const capacityExceeded =
    !beforeOverCapacity && rows.some((r) => r.overCapacityAfter);

  const requesterPickup = afterEstimates.find(
    (e) => e.tripId === change.tripId && e.kind === 'pickup',
  );
  const requesterOutsideWindow =
    change.kind === 'time-change' && Boolean(requesterPickup?.outsideWindow);

  const partial = {
    requestKind: change.kind,
    tripId: change.tripId,
    runId: trip.runId,
    vehicle,
    rows,
    capacityExceeded,
    othersOutsideWindow,
    requesterOutsideWindow,
    requesterPickupAfter: requesterPickup?.time ?? null,
  };
  const { decision, reasons } = decideChange(partial);
  return { ...partial, decision, reasons };
}
