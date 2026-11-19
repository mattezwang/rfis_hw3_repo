// T007: simulateRun (research.md R-3, A-4, A-13, A-18).
import { describe, expect, it } from 'vitest';
import { simulateRun, sequenceStops } from '../src/domain/impact';
import type { Run, World } from '../src/domain/types';

/** A tiny world: garage G, locations A, B, C; 10 minutes between any two. */
function world(overrides: Partial<World> = {}): World {
  const ids = ['G', 'A', 'B', 'C'];
  const travel: World['travel'] = {};
  for (const a of ids) {
    travel[a] = {};
    for (const b of ids) travel[a]![b] = a === b ? 0 : 10;
  }
  return {
    riders: {
      amb: { id: 'amb', name: 'Amb', mobility: 'ambulatory', boardingMinutes: 2, mobilityNote: '' },
      wc: { id: 'wc', name: 'Wc', mobility: 'wheelchair', boardingMinutes: 5, mobilityNote: '' },
    },
    vehicles: { v: { id: 'v', label: 'V', seats: 2, wheelchairPositions: 1 } },
    locations: { G: { id: 'G', label: 'G' }, A: { id: 'A', label: 'A' }, B: { id: 'B', label: 'B' }, C: { id: 'C', label: 'C' } },
    travel,
    trips: {
      t1: { id: 't1', riderId: 'amb', runId: 'r', pickupLocationId: 'A', dropoffLocationId: 'B', windowStart: 600, attendant: true, status: 'scheduled' },
      t2: { id: 't2', riderId: 'wc', runId: 'r', pickupLocationId: 'B', dropoffLocationId: 'C', windowStart: 640, attendant: false, status: 'scheduled' },
    },
    runs: {},
    ...overrides,
  };
}

function run(stops: Run['stops'], startTime = 570): Run {
  return { id: 'r', label: 'r', vehicleId: 'v', driverName: 'D', startLocationId: 'G', startTime, stops };
}

const s = (tripId: string, kind: 'pickup' | 'dropoff', completedAt: number | null = null) => ({
  tripId,
  kind,
  completedAt,
  changeMark: null,
});

describe('simulateRun', () => {
  it('waits for the window to open when the van arrives early (A-4)', () => {
    const est = simulateRun(run([s('t1', 'pickup'), s('t1', 'dropoff')]), world());
    expect(est[0]!.time).toBe(600); // arrives 580, waits until 600
    expect(est[1]!.time).toBe(612); // 600 + 2 boarding + 10 travel
  });

  it('adds boarding time per rider and flags a pickup served after its window end', () => {
    const est = simulateRun(
      run([s('t1', 'pickup'), s('t2', 'pickup'), s('t1', 'dropoff'), s('t2', 'dropoff')], 640),
      world(),
    );
    expect(est[0]!.time).toBe(650); // late pull-out: 640 + 10, after the 600–630 window
    expect(est[0]!.outsideWindow).toBe(true);
    expect(est[1]!.time).toBe(662); // 650 + 2 + 10, window 640–670
    expect(est[1]!.outsideWindow).toBe(false);
  });

  it('keeps completed stops at their recorded times', () => {
    const est = simulateRun(run([s('t1', 'pickup', 605), s('t1', 'dropoff')]), world());
    expect(est[0]!.time).toBe(605);
    expect(est[1]!.time).toBe(617);
  });

  it('counts an attendant as a seat and a wheelchair rider as a position (A-13)', () => {
    const est = simulateRun(
      run([s('t1', 'pickup'), s('t2', 'pickup'), s('t1', 'dropoff'), s('t2', 'dropoff')]),
      world(),
    );
    expect(est[0]!.onboardSeats).toBe(2); // rider + attendant
    expect(est[1]!.onboardWheelchairs).toBe(1);
    expect(est[2]!.onboardSeats).toBe(0);
    expect(est[3]!.onboardWheelchairs).toBe(0);
  });

  it('skips the stops of a cancelled trip', () => {
    const w = world();
    w.trips.t1 = { ...w.trips.t1!, status: 'cancelled' };
    const est = simulateRun(run([s('t1', 'pickup'), s('t1', 'dropoff'), s('t2', 'pickup')]), w);
    expect(est[0]!.skipped).toBe(true);
    expect(est[0]!.time).toBeNull();
    expect(est[2]!.time).toBe(640); // straight from the garage at 570 + 10, waits to 640
  });
});

describe('sequenceStops (A-15)', () => {
  it('keeps completed stops first and orders the rest by scheduled time', () => {
    const w = world();
    const ordered = sequenceStops([s('t2', 'pickup'), s('t1', 'pickup'), s('t2', 'dropoff'), s('t1', 'dropoff')], w);
    expect(ordered.map((x) => `${x.tripId}:${x.kind}`)).toEqual([
      't1:pickup',
      't1:dropoff',
      't2:pickup',
      't2:dropoff',
    ]);
  });
});
