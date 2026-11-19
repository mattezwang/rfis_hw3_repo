// V2: T038 (suggestTimes: FR-026, A-19, SC-010, FR-008), T040 (affectedSummary: FR-028).
import { describe, expect, it } from 'vitest';
import { createSeed, JANELLE_RETURN_TRIP } from '../src/domain/seed';
import { affectedSummary, suggestTimes } from '../src/domain/suggest';
import { computeImpact } from '../src/domain/impact';
import { submitTimeChange } from '../src/domain/store';
import { hm } from '../src/domain/time';

const NOW = hm(14, 30);

describe('suggestTimes (FR-026, A-19)', () => {
  it('offers 1–3 times near the request, nearest first, each confirmed when submitted (SC-010)', () => {
    const seed = createSeed();
    const requested = hm(15, 45);
    const s = suggestTimes(seed, JANELLE_RETURN_TRIP, requested, NOW);
    expect(s.length).toBeGreaterThanOrEqual(1);
    expect(s.length).toBeLessThanOrEqual(3);
    const distances = s.map((x) => Math.abs(x.windowStart - requested));
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
    for (const x of s) {
      expect(x.windowStart).not.toBe(requested);
      expect(Math.abs(x.windowStart - requested)).toBeLessThanOrEqual(90);
      expect((x.windowStart - requested) % 5).toBe(0);
      const r = submitTimeChange(seed, JANELLE_RETURN_TRIP, x.windowStart, NOW);
      expect(r.ok && r.value.request.status).toBe('confirmed');
    }
  });

  it('gives each suggestion the rider’s own estimated pickup and arrival', () => {
    const s = suggestTimes(createSeed(), JANELLE_RETURN_TRIP, hm(15, 45), NOW);
    for (const x of s) {
      expect(x.estimatedPickup).not.toBeNull();
      expect(x.estimatedArrival!).toBeGreaterThan(x.estimatedPickup!);
    }
  });

  it('offers suggestions when the rider’s own window is unreachable', () => {
    expect(suggestTimes(createSeed(), JANELLE_RETURN_TRIP, hm(15, 30), NOW).length).toBeGreaterThan(0);
  });

  it('never suggests a time that is not later than now', () => {
    const s = suggestTimes(createSeed(), JANELLE_RETURN_TRIP, hm(14, 40), NOW);
    expect(s.every((x) => x.windowStart > NOW)).toBe(true);
  });

  it('contains times only, nothing about other riders (FR-008)', () => {
    const s = suggestTimes(createSeed(), JANELLE_RETURN_TRIP, hm(15, 45), NOW);
    for (const x of s) expect(Object.keys(x).sort()).toEqual(['estimatedArrival', 'estimatedPickup', 'windowStart']);
    expect(JSON.stringify(s)).not.toMatch(/Grace|Omar|Ruth|Luis|Mei|t-/);
  });
});

describe('affectedSummary (FR-028)', () => {
  it('names Grace as pushed outside her window for S2', () => {
    const impact = computeImpact({ tripId: JANELLE_RETURN_TRIP, kind: 'time-change', newWindowStart: hm(15, 45) }, createSeed());
    const items = affectedSummary(impact);
    expect(items).toContainEqual(
      expect.objectContaining({ tripId: 't-grace', riderName: 'Grace T.', reason: 'pushed-outside-window' }),
    );
  });

  it('includes an over-capacity item for S3', () => {
    const impact = computeImpact({ tripId: JANELLE_RETURN_TRIP, kind: 'time-change', newWindowStart: hm(15, 15) }, createSeed());
    expect(affectedSummary(impact).some((i) => i.reason === 'over-capacity')).toBe(true);
  });

  it('is empty for a change that affects no one (S1)', () => {
    const impact = computeImpact({ tripId: JANELLE_RETURN_TRIP, kind: 'time-change', newWindowStart: hm(16, 30) }, createSeed());
    expect(affectedSummary(impact)).toEqual([]);
  });
});
