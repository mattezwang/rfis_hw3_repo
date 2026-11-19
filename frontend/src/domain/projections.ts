// Read-only projections of the state for each view.
// Implements: FR-001 (rider's trips), FR-004 and FR-008 (rider preview with no other riders'
// data), FR-022 and FR-024 (driver manifest with change marks), A-13 (attendant shown),
// constitution Principle VI.
import type { AppData, ChangeMark, ChangeRequest, Minutes, RiderPreview, RouteImpact, Trip } from './types';
import { simulateRun } from './impact';
import { windowEnd } from './time';

/** Only the requesting rider's own fields are copied (FR-008, data-model.md RiderPreview). */
export function toRiderPreview(impact: RouteImpact): RiderPreview {
  const own = impact.rows.find((r) => r.isRequester && r.kind === 'pickup');
  return {
    tripId: impact.tripId,
    newWindowStart: own?.windowStart ?? null,
    newWindowEnd: own?.windowEnd ?? null,
    estimatedPickup: impact.requesterPickupAfter,
    needsApproval: impact.decision === 'route-to-dispatcher',
  };
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
}

/** The rider's own trips for the day (FR-001). Contains nothing about other riders. */
export function riderTrips(data: AppData, riderId: string): RiderTripView[] {
  return Object.values(data.trips)
    .filter((t) => t.riderId === riderId)
    .sort((a, b) => a.windowStart - b.windowStart)
    .map((trip) => {
      const requests = data.requests.filter((r) => r.tripId === trip.id);
      return {
        trip,
        pickupLabel: data.locations[trip.pickupLocationId]?.label ?? '',
        dropoffLabel: data.locations[trip.dropoffLocationId]?.label ?? '',
        windowStart: trip.windowStart,
        windowEnd: windowEnd(trip.windowStart),
        canChange: trip.status === 'scheduled',
        pending: requests.find((r) => r.status === 'pending'),
        latest: requests[requests.length - 1],
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
