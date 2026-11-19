// T011: computeImpact, decideChange, toRiderPreview (FR-004, FR-008, FR-010–FR-015, A-3, A-15).
import { describe, expect, it } from 'vitest';
import { computeImpact } from '../src/domain/impact';
import { decideChange } from '../src/domain/decide';
import { toRiderPreview } from '../src/domain/projections';
import { createSeed, JANELLE_RETURN_TRIP } from '../src/domain/seed';
import { hm } from '../src/domain/time';

describe('decideChange (contracts/decision-module.md)', () => {
  const none = { othersOutsideWindow: [], capacityExceeded: false, requesterOutsideWindow: false };

  it('confirms a time change that affects no one (FR-011)', () => {
    expect(decideChange({ requestKind: 'time-change', ...none })).toEqual({ decision: 'confirm', reasons: [] });
  });

  it('routes and reports every reason that applies (FR-012, FR-013)', () => {
    expect(
      decideChange({
        requestKind: 'time-change',
        othersOutsideWindow: ['t-x'],
        capacityExceeded: true,
        requesterOutsideWindow: true,
      }),
    ).toEqual({
      decision: 'route-to-dispatcher',
      reasons: ['other-pickup-outside-window', 'capacity-exceeded', 'requester-window-unreachable'],
    });
  });

  it('always confirms a cancellation (FR-014, A-4)', () => {
    expect(
      decideChange({ requestKind: 'cancel', othersOutsideWindow: ['t-x'], capacityExceeded: true, requesterOutsideWindow: false }),
    ).toEqual({ decision: 'confirm', reasons: [] });
  });
});

describe('computeImpact', () => {
  it('moves the changed pickup and its drop-off to the position for the new time (A-15)', () => {
    const data = createSeed();
    const impact = computeImpact({ tripId: JANELLE_RETURN_TRIP, kind: 'time-change', newWindowStart: hm(16, 30) }, data);
    const order = impact.rows.map((r) => `${r.tripId}:${r.kind}`);
    const pickup = order.indexOf(`${JANELLE_RETURN_TRIP}:pickup`);
    const dropoff = order.indexOf(`${JANELLE_RETURN_TRIP}:dropoff`);
    expect(pickup).toBeGreaterThan(order.indexOf('t-grace:dropoff'));
    expect(dropoff).toBeGreaterThan(pickup);
    expect(dropoff).toBeLessThan(order.indexOf('t-omar:pickup'));
  });

  it('reports before and after times for every stop (FR-010, FR-017)', () => {
    const data = createSeed();
    const impact = computeImpact({ tripId: JANELLE_RETURN_TRIP, kind: 'time-change', newWindowStart: hm(15, 45) }, data);
    const grace = impact.rows.find((r) => r.tripId === 't-grace' && r.kind === 'pickup')!;
    expect(grace.before).not.toBeNull();
    expect(grace.after).toBeGreaterThan(grace.before!);
    expect(grace.outsideWindowAfter).toBe(true);
  });

  it('does not count a pickup that was already outside its window before the change', () => {
    const data = createSeed();
    // Make Mei's window impossible before any change.
    data.trips['t-mei'] = { ...data.trips['t-mei']!, windowStart: hm(17, 0) };
    const impact = computeImpact({ tripId: JANELLE_RETURN_TRIP, kind: 'time-change', newWindowStart: hm(16, 30) }, data);
    expect(impact.othersOutsideWindow).not.toContain('t-mei');
  });

  it('routes a change when the van cannot reach the requester within the new window (FR-013, A-10)', () => {
    const data = createSeed();
    const impact = computeImpact({ tripId: JANELLE_RETURN_TRIP, kind: 'time-change', newWindowStart: hm(15, 30) }, data);
    expect(impact.requesterOutsideWindow).toBe(true);
    expect(impact.reasons).toContain('requester-window-unreachable');
  });
});

describe('toRiderPreview (FR-004, FR-008)', () => {
  it('contains only the rider’s own window, estimate and approval need', () => {
    const data = createSeed();
    const impact = computeImpact({ tripId: JANELLE_RETURN_TRIP, kind: 'time-change', newWindowStart: hm(15, 45) }, data);
    const preview = toRiderPreview(impact);
    expect(Object.keys(preview).sort()).toEqual(
      ['estimatedPickup', 'needsApproval', 'newWindowEnd', 'newWindowStart', 'tripId'].sort(),
    );
    expect(preview).toMatchObject({ newWindowStart: hm(15, 45), newWindowEnd: hm(16, 15), needsApproval: true });
    expect(JSON.stringify(preview)).not.toMatch(/Grace|Omar|Ruth|Luis|Mei/);
  });
});
