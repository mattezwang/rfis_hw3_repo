// Read-only projections of the state for each view.
// Implements: FR-001 (rider's trips), FR-004 and FR-008 (rider preview with no other riders'
// data), FR-022 and FR-024 (driver manifest with change marks), A-13 (attendant shown),
// V2: FR-025 (own arrival time), FR-026 (suggestions after a decline), FR-027 (own window
// unreachable). Constitution Principle VI.
import type {
  AppData,
  ChangeMark,
  ChangeRequest,
  Minutes,
  RiderPreview,
  RouteImpact,
  SuggestedTime,
  Trip,
} from './types';
import { simulateRun } from './impact';
import { suggestTimes } from './suggest';
import { windowEnd } from './time';

/**
 * Only the requesting rider's own fields are copied (FR-008, data-model.md RiderPreview).
 * V2 adds her estimated arrival (FR-025) and whether her own window is unreachable (FR-027).
 */
export function toRiderPreview(impact: RouteImpact): RiderPreview {
  const own = impact.rows.find((r) => r.isRequester && r.kind === 'pickup');
  const ownDropoff = impact.rows.find((r) => r.isRequester && r.kind === 'dropoff');
  return {
    tripId: impact.tripId,
    newWindowStart: own?.windowStart ?? null,
    newWindowEnd: own?.windowEnd ?? null,
    estimatedPickup: impact.requesterPickupAfter,
    needsApproval: impact.decision === 'route-to-dispatcher',
    estimatedArrival: ownDropoff?.after ?? null,
    ownWindowUnreachable: impact.requesterOutsideWindow,
  };
}

/** V2: the rider's own estimated arrival on the run as it stands (FR-025). */
export function estimatedArrivalFor(data: AppData, tripId: string): Minutes | null {
  const trip = data.trips[tripId];
  if (!trip || trip.status !== 'scheduled') return null;
  const run = data.runs[trip.runId]!;
  const i = run.stops.findIndex((s) => s.tripId === tripId && s.kind === 'dropoff');
  return i < 0 ? null : (simulateRun(run, data)[i]?.time ?? null);
}

export interface RiderTripView {
  trip: Trip;
  pickupLabel: string;
  dropoffLabel: string;
  windowStart: Minutes;
  windowEnd: Minutes;
  canChange: boolean;
  pending: ChangeRequest | undefined;
  latest: ChangeRequest | undefined;
  /** V2: own estimated arrival for a scheduled trip (FR-025). */
  estimatedArrival: Minutes | null;
  /** V2: times that would confirm now, after a decline (FR-026). */
  suggestions: SuggestedTime[];
}

/** The rider's own trips for the day (FR-001). Contains nothing about other riders. */
export function riderTrips(data: AppData, riderId: string, now: Minutes): RiderTripView[] {
  return Object.values(data.trips)
    .filter((t) => t.riderId === riderId)
    .sort((a, b) => a.windowStart - b.windowStart)
    .map((trip) => {
      const requests = data.requests.filter((r) => r.tripId === trip.id);
      const latest = requests[requests.length - 1];
      const declined =
        trip.status === 'scheduled' && latest?.status === 'not-accepted' && latest.requestedWindowStart !== null;
      return {
        estimatedArrival: estimatedArrivalFor(data, trip.id),
        suggestions: declined ? suggestTimes(data, trip.id, latest.requestedWindowStart!, now) : [],
        trip,
        pickupLabel: data.locations[trip.pickupLocationId]?.label ?? '',
        dropoffLabel: data.locations[trip.dropoffLocationId]?.label ?? '',
        windowStart: trip.windowStart,
        windowEnd: windowEnd(trip.windowStart),
        canChange: trip.status === 'scheduled',
        pending: requests.find((r) => r.status === 'pending'),
        latest,
      };
    });
}

export interface ManifestRow {
  tripId: string;
  kind: 'pickup' | 'dropoff';
  riderName: string;
  locationLabel: string;
  time: Minutes | null;
  windowStart: Minutes | null;
  windowEnd: Minutes | null;
  mobilityNote: string;
  attendant: boolean;
  completed: boolean;
  removed: boolean;
  changeMark: ChangeMark | null;
}

export interface ManifestView {
  runId: string;
  label: string;
  driverName: string;
  vehicleLabel: string;
  seats: number;
  wheelchairPositions: number;
  rows: ManifestRow[];
}

/** The driver's manifest: accepted state only, with change marks (FR-022, FR-023, FR-024). */
export function toManifestView(data: AppData, runId: string): ManifestView {
  const run = data.runs[runId]!;
  const vehicle = data.vehicles[run.vehicleId]!;
  const estimates = simulateRun(run, data);
  return {
    runId,
    label: run.label,
    driverName: run.driverName,
    vehicleLabel: vehicle.label,
    seats: vehicle.seats,
    wheelchairPositions: vehicle.wheelchairPositions,
    rows: run.stops.map((stop, i) => {
      const trip = data.trips[stop.tripId]!;
      const rider = data.riders[trip.riderId]!;
      const loc = stop.kind === 'pickup' ? trip.pickupLocationId : trip.dropoffLocationId;
      return {
        tripId: stop.tripId,
        kind: stop.kind,
        riderName: rider.name,
        locationLabel: data.locations[loc]?.label ?? loc,
        time: estimates[i]?.time ?? null,
        windowStart: stop.kind === 'pickup' ? trip.windowStart : null,
        windowEnd: stop.kind === 'pickup' ? windowEnd(trip.windowStart) : null,
        mobilityNote: rider.mobilityNote,
        attendant: trip.attendant,
        completed: stop.completedAt !== null,
        removed: trip.status === 'cancelled',
        changeMark: stop.changeMark,
      };
    }),
  };
}
