// Store transitions: T013 (validation), T020 (accept/decline, A-12, A-16), T025 (withdraw on
// cancel), T031 (history). FR-002, FR-003, FR-005, FR-018–FR-020, SC-007.
import { describe, expect, it } from 'vitest';
import { createSeed, DISPATCHER_NAME, JANELLE_RETURN_TRIP } from '../src/domain/seed';
import {
  acceptChange,
  cancelTrip,
  currentImpact,
  declineChange,
  pendingQueue,
  submitTimeChange,
} from '../src/domain/store';
import { hm } from '../src/domain/time';

const NOW = hm(14, 30);

function ok<T>(r: { ok: true; value: T } | { ok: false; error: string }): T {
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

describe('submitTimeChange validation (A-11, A-12)', () => {
  it('rejects the current pickup time', () => {
    const r = submitTimeChange(createSeed(), JANELLE_RETURN_TRIP, hm(17, 0), NOW);
    expect(r).toMatchObject({ ok: false });
    if (!r.ok) expect(r.error).toMatch(/already your pickup time/);
  });

  it('rejects a time not later than now', () => {
    const r = submitTimeChange(createSeed(), JANELLE_RETURN_TRIP, hm(14, 0), NOW);
    expect(r.ok).toBe(false);
  });

  it('rejects a time outside the service day', () => {
    const r = submitTimeChange(createSeed(), JANELLE_RETURN_TRIP, hm(20, 45), NOW);
    expect(r.ok).toBe(false);
  });

  it('rejects changes to a trip that is not scheduled (data-model.md Trip.status)', () => {
    const r = submitTimeChange(createSeed(), 't-janelle-morning', hm(16, 0), NOW);
    expect(r.ok).toBe(false);
  });

  it('rejects a second change while one is pending (A-12)', () => {
    const first = ok(submitTimeChange(createSeed(), JANELLE_RETURN_TRIP, hm(15, 45), NOW));
    const second = submitTimeChange(first.data, JANELLE_RETURN_TRIP, hm(16, 30), NOW);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error).toMatch(/waiting for the dispatcher/);
  });
});

describe('dispatcher decisions', () => {
  it('accept applies the change (FR-018, FR-022)', () => {
    const s = ok(submitTimeChange(createSeed(), JANELLE_RETURN_TRIP, hm(15, 45), NOW));
    const a = ok(acceptChange(s.data, s.request.id, DISPATCHER_NAME, hm(14, 33)));
    expect(a.request).toMatchObject({ status: 'confirmed', decidedBy: DISPATCHER_NAME });
    expect(a.data.trips[JANELLE_RETURN_TRIP]!.windowStart).toBe(hm(15, 45));
    expect(pendingQueue(a.data)).toHaveLength(0);
  });

  it('decline requires a reason and leaves the trip unchanged (FR-019, FR-023)', () => {
    const s = ok(submitTimeChange(createSeed(), JANELLE_RETURN_TRIP, hm(15, 15), NOW));
    expect(declineChange(s.data, s.request.id, DISPATCHER_NAME, '   ', hm(14, 33)).ok).toBe(false);
    const d = ok(declineChange(s.data, s.request.id, DISPATCHER_NAME, 'No wheelchair position free', hm(14, 33)));
    expect(d.request).toMatchObject({ status: 'not-accepted', declineReason: 'No wheelchair position free' });
    expect(d.data.trips[JANELLE_RETURN_TRIP]!.windowStart).toBe(hm(17, 0));
  });

  it('recalculates a pending change against the current run (A-16)', () => {
    let data = createSeed();
    const pending = ok(submitTimeChange(data, JANELLE_RETURN_TRIP, hm(15, 45), NOW));
    data = pending.data;
    const before = currentImpact(data, pending.request);
    expect(before.othersOutsideWindow).toContain('t-grace');
    // Grace cancels by phone (simulated directly), so the run changes under the pending request.
    data = { ...data, trips: { ...data.trips, 't-grace': { ...data.trips['t-grace']!, status: 'cancelled' } } };
    const after = currentImpact(data, pending.request);
    expect(after.othersOutsideWindow).not.toContain('t-grace');
    // Not re-decided automatically: it is still pending.
    expect(pendingQueue(data).map((r) => r.id)).toEqual([pending.request.id]);
  });

  it('orders the pending queue by requested pickup time (FR-016)', () => {
    const a = ok(submitTimeChange(createSeed(), JANELLE_RETURN_TRIP, hm(15, 45), NOW));
    const base = a.request;
    // Add two more pending requests on other trips, submitted in a different order.
    const data = {
      ...a.data,
      requests: [
        { ...base, id: 'c-late', tripId: 't-omar', requestedWindowStart: hm(18, 0) },
        ...a.data.requests,
        { ...base, id: 'c-early', tripId: 't-ruth', requestedWindowStart: hm(15, 20) },
      ],
    };
    expect(pendingQueue(data).map((r) => r.id)).toEqual(['c-early', base.id, 'c-late']);
  });
});

describe('cancelTrip (FR-003, FR-014, A-12)', () => {
  it('withdraws a pending change and confirms the cancellation', () => {
    const s = ok(submitTimeChange(createSeed(), JANELLE_RETURN_TRIP, hm(15, 45), NOW));
    const c = ok(cancelTrip(s.data, JANELLE_RETURN_TRIP, hm(14, 40)));
    const statuses = c.data.requests.map((r) => r.status);
    expect(statuses).toEqual(['withdrawn', 'confirmed']);
    expect(c.data.trips[JANELLE_RETURN_TRIP]!.status).toBe('cancelled');
  });

  it('cannot cancel a completed trip', () => {
    expect(cancelTrip(createSeed(), 't-janelle-morning', NOW).ok).toBe(false);
  });
});

describe('change history (FR-020, SC-007)', () => {
  it('records every transition with actor, role and time; automatic decisions are "system"', () => {
    let data = createSeed();
    const s1 = ok(submitTimeChange(data, JANELLE_RETURN_TRIP, hm(16, 30), hm(14, 31)));
    const s2 = ok(submitTimeChange(s1.data, JANELLE_RETURN_TRIP, hm(15, 45), hm(14, 32)));
    const dec = ok(declineChange(s2.data, s2.request.id, DISPATCHER_NAME, 'Grace would be late', hm(14, 34)));
    const can = ok(cancelTrip(dec.data, JANELLE_RETURN_TRIP, hm(14, 36)));
    data = can.data;

    expect(data.history.map((h) => [h.event, h.actorRole])).toEqual([
      ['submitted', 'rider'],
      ['confirmed', 'system'],
      ['submitted', 'rider'],
      ['routed', 'system'],
      ['declined', 'dispatcher'],
      ['cancelled', 'rider'],
      ['confirmed', 'system'],
    ]);
    for (const h of data.history) {
      expect(h.actor).toBeTruthy();
      expect(typeof h.at).toBe('number');
      expect(h.from).toMatch(/Pickup/);
      expect(h.to).toBeTruthy();
    }
    const auto = data.history.filter((h) => h.actorRole === 'system');
    expect(auto.every((h) => h.actor === 'system')).toBe(true);
    expect(data.history.find((h) => h.event === 'declined')!.reason).toBe('Grace would be late');
  });
});
