// Seeded acceptance scenarios S1–S4 (data-model.md §Seed design).
// T012 (S1), T019 (S2, S3), T025 (S4), T028 (manifest). SC-003, SC-004, SC-006.
import { describe, expect, it } from 'vitest';
import { createSeed, DISPATCHER_NAME, JANELLE_RETURN_TRIP } from '../src/domain/seed';
import { acceptChange, cancelTrip, declineChange, submitTimeChange } from '../src/domain/store';
import { toManifestView } from '../src/domain/projections';
import { simulateRun } from '../src/domain/impact';
import { hm } from '../src/domain/time';
import type { AppData } from '../src/domain/types';

const NOW = hm(14, 30);

function ok<T>(r: { ok: true; value: T } | { ok: false; error: string }): T {
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

function manifestOrder(data: AppData, runId = 'R-12'): string[] {
  return toManifestView(data, runId).rows.map((r) => `${r.tripId}:${r.kind}`);
}

describe('seed baseline', () => {
  it('has every pickup inside its window and no run over capacity', () => {
    const data = createSeed();
    for (const run of Object.values(data.runs)) {
      const vehicle = data.vehicles[run.vehicleId]!;
      for (const e of simulateRun(run, data)) {
        expect(e.outsideWindow).toBe(false);
        expect(e.onboardSeats).toBeLessThanOrEqual(vehicle.seats);
        expect(e.onboardWheelchairs).toBeLessThanOrEqual(vehicle.wheelchairPositions);
      }
    }
  });
});

describe('S1: change to 16:30 affects no one', () => {
  it('is confirmed immediately and the trip window becomes 16:30–17:00 (FR-011, SC-004)', () => {
    const { data, request } = ok(submitTimeChange(createSeed(), JANELLE_RETURN_TRIP, hm(16, 30), NOW));
    expect(request.status).toBe('confirmed');
    expect(request.decidedBy).toBe('system');
    expect(data.trips[JANELLE_RETURN_TRIP]!.windowStart).toBe(hm(16, 30));
  });
});

describe('S2: change to 15:45 pushes Grace outside her window', () => {
  it('is routed to the dispatcher and nothing changes while pending (FR-012, FR-023, SC-003)', () => {
    const seed = createSeed();
    const before = manifestOrder(seed);
    const { data, request } = ok(submitTimeChange(seed, JANELLE_RETURN_TRIP, hm(15, 45), NOW));
    expect(request.status).toBe('pending');
    expect(request.decisionReasons).toEqual(['other-pickup-outside-window']);
    expect(data.trips[JANELLE_RETURN_TRIP]!.windowStart).toBe(hm(17, 0));
    expect(manifestOrder(data)).toEqual(before);
    expect(toManifestView(data, 'R-12').rows.every((r) => r.changeMark === null)).toBe(true);
  });
});

describe('S3: change to 15:15 exceeds wheelchair capacity', () => {
  it('is routed with capacity-exceeded (FR-012)', () => {
    const { request } = ok(submitTimeChange(createSeed(), JANELLE_RETURN_TRIP, hm(15, 15), NOW));
    expect(request.status).toBe('pending');
    expect(request.decisionReasons).toContain('capacity-exceeded');
  });
});

describe('S4: cancel the return trip', () => {
  it('is confirmed and Janelle’s wheelchair position is released (FR-014, G-53)', () => {
    const { data, request } = ok(cancelTrip(createSeed(), JANELLE_RETURN_TRIP, NOW));
    expect(request.status).toBe('confirmed');
    expect(data.trips[JANELLE_RETURN_TRIP]!.status).toBe('cancelled');
    const est = simulateRun(data.runs['R-12']!, data);
    const janelleStops = est.filter((e) => e.tripId === JANELLE_RETURN_TRIP);
    expect(janelleStops.every((e) => e.skipped)).toBe(true);
    // Between Janelle's former pickup and drop-off only Omar's ambulatory seat is in use.
    const omarPickup = est.find((e) => e.tripId === 't-omar' && e.kind === 'pickup')!;
    expect(omarPickup.onboardWheelchairs).toBe(0);
  });
});

describe('Manifest reflects accepted changes only (US4, SC-006)', () => {
  it('shows an accepted change with marks, and ignores declined and pending ones', () => {
    let data = createSeed();
    // Pending → declined (S3).
    const s3 = ok(submitTimeChange(data, JANELLE_RETURN_TRIP, hm(15, 15), NOW));
    data = ok(declineChange(s3.data, s3.request.id, DISPATCHER_NAME, 'No wheelchair position free', hm(14, 35))).data;
    expect(toManifestView(data, 'R-12').rows.every((r) => r.changeMark === null)).toBe(true);

    // Pending → accepted (S2).
    const s2 = ok(submitTimeChange(data, JANELLE_RETURN_TRIP, hm(15, 45), hm(14, 40)));
    data = ok(acceptChange(s2.data, s2.request.id, DISPATCHER_NAME, hm(14, 42))).data;
    const rows = toManifestView(data, 'R-12').rows;
    const marked = rows.filter((r) => r.changeMark);
    expect(marked.map((r) => r.tripId)).toEqual([JANELLE_RETURN_TRIP, JANELLE_RETURN_TRIP]);
    expect(marked.every((r) => r.changeMark!.kind === 'changed' && r.changeMark!.at === hm(14, 42))).toBe(true);
    expect(data.trips[JANELLE_RETURN_TRIP]!.windowStart).toBe(hm(15, 45));

    // A new pending change does not move anything.
    const pendingAgain = ok(submitTimeChange(data, JANELLE_RETURN_TRIP, hm(15, 15), hm(14, 50)));
    expect(pendingAgain.request.status).toBe('pending');
    expect(manifestOrder(pendingAgain.data)).toEqual(manifestOrder(data));
  });

  it('shows a cancelled trip as removed with the time (FR-024)', () => {
    const { data } = ok(cancelTrip(createSeed(), JANELLE_RETURN_TRIP, hm(14, 45)));
    const rows = toManifestView(data, 'R-12').rows.filter((r) => r.tripId === JANELLE_RETURN_TRIP);
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.removed && r.changeMark?.kind === 'removed' && r.changeMark.at === hm(14, 45))).toBe(true);
  });

  it('does not change other runs', () => {
    const seed = createSeed();
    const { data } = ok(submitTimeChange(seed, JANELLE_RETURN_TRIP, hm(16, 30), NOW));
    expect(toManifestView(data, 'R-14')).toEqual(toManifestView(seed, 'R-14'));
  });
});
