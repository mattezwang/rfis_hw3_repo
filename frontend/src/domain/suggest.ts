// V2: suggested pickup times and the dispatcher's affected-rider summary.
// Implements: FR-026 (offer up to 3 times that would be confirmed immediately, nearest first),
// A-19 (5-minute steps, up to 90 minutes either side, later than now, inside the service day),
// FR-008 (times only, no other riders' data), FR-015 (reuses computeImpact), FR-028 (summary).
// Contract: contracts/decision-module.md (suggestTimes, affectedSummary). Pure functions.
import type { AffectedSummaryItem, AppData, Minutes, RouteImpact, SuggestedTime } from './types';
import { computeImpact } from './impact';
import { validateTimeChange } from './store';

const STEP = 5;
const RANGE = 90;
const MAX_SUGGESTIONS = 3;

/** Candidate starts ordered by distance from the request, later first on ties. */
function candidates(requested: Minutes): Minutes[] {
  const out: Minutes[] = [];
  for (let d = STEP; d <= RANGE; d += STEP) out.push(requested + d, requested - d);
  return out;
}

export function suggestTimes(
  data: AppData,
  tripId: string,
  requested: Minutes,
  now: Minutes,
): SuggestedTime[] {
  const found: SuggestedTime[] = [];
  for (const start of candidates(requested)) {
    if (found.length >= MAX_SUGGESTIONS) break;
    if (!validateTimeChange(data, tripId, start, now).ok) continue;
    const impact = computeImpact({ tripId, kind: 'time-change', newWindowStart: start }, data);
    if (impact.decision !== 'confirm' || impact.requesterOutsideWindow) continue;
    const dropoff = impact.rows.find((r) => r.isRequester && r.kind === 'dropoff');
    found.push({
      windowStart: start,
      estimatedPickup: impact.requesterPickupAfter,
      estimatedArrival: dropoff?.after ?? null,
    });
  }
  return found;
}

/** Each other rider the change would affect, and why (FR-028). Dispatcher only. */
export function affectedSummary(impact: RouteImpact): AffectedSummaryItem[] {
  const items: AffectedSummaryItem[] = [];
  for (const tripId of impact.othersOutsideWindow) {
    const row = impact.rows.find((r) => r.tripId === tripId && r.kind === 'pickup');
    if (row) {
      items.push({
        tripId,
        riderName: row.riderName,
        reason: 'pushed-outside-window',
        newTime: row.after,
        windowEnd: row.windowEnd,
      });
    }
  }
  if (impact.capacityExceeded) {
    const seen = new Set<string>();
    for (const row of impact.rows) {
      if (row.overCapacityAfter && !row.isRequester && !seen.has(row.tripId)) {
        seen.add(row.tripId);
        items.push({ tripId: row.tripId, riderName: row.riderName, reason: 'over-capacity', newTime: row.after, windowEnd: null });
      }
    }
    // Over capacity only at the requester's own stop: name the riders already on board.
    if (seen.size === 0) {
      const at = impact.rows.findIndex((r) => r.overCapacityAfter);
      const onboard = new Set<string>();
      impact.rows.slice(0, at + 1).forEach((r) => {
        if (r.kind === 'pickup') onboard.add(r.tripId);
        else onboard.delete(r.tripId);
      });
      for (const id of onboard) {
        const row = impact.rows.find((r) => r.tripId === id && r.kind === 'pickup')!;
        if (!row.isRequester) {
          items.push({ tripId: id, riderName: row.riderName, reason: 'over-capacity', newTime: row.after, windowEnd: null });
        }
      }
    }
  }
  return items;
}
