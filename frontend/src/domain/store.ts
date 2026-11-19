// State transitions for same-day changes, and the change history.
// Implements: FR-002 (request a new pickup time), FR-003 (cancel), FR-005 (three outcomes),
// FR-007 (pending leaves the original trip standing), FR-011–FR-014 (decision applied),
// FR-018 (dispatcher accepts), FR-019 (decline needs a reason), FR-020 (every event recorded),
// FR-022 (manifest and rider confirmation from one acceptance), FR-023 (pending or declined
// changes never alter the manifest), FR-024 (change marks), A-7, A-11, A-12, A-16, DP-3, DP-5.
// Contract: contracts/decision-module.md (Store transitions).
import type {
  AppData,
  ChangeRecord,
  ChangeRequest,
  Minutes,
  ProposedChange,
  RecordEvent,
  ActorRole,
  Result,
  RouteImpact,
  Trip,
} from './types';
import { applyToWorld, computeImpact } from './impact';
import { REASON_TEXT } from './decide';
import { fmt, fmtWindow, windowEnd } from './time';

export const SYSTEM_ACTOR = 'system';

function riderNameFor(data: AppData, trip: Trip): string {
  return data.riders[trip.riderId]?.name ?? trip.riderId;
}

function nextId(data: AppData, prefix: string): [string, AppData] {
  return [`${prefix}-${data.nextId}`, { ...data, nextId: data.nextId + 1 }];
}

function record(
  data: AppData,
  req: ChangeRequest,
  event: RecordEvent,
  actor: string,
  actorRole: ActorRole,
  at: Minutes,
  reason: string | null = null,
): AppData {
  const trip = data.trips[req.tripId]!;
  const [id, next] = nextId(data, 'h');
  const entry: ChangeRecord = {
    id,
    at,
    requestId: req.id,
    tripId: req.tripId,
    riderName: riderNameFor(data, trip),
    actor,
    actorRole,
    event,
    from: `Pickup ${fmtWindow(req.previousWindowStart)}`,
    to:
      req.kind === 'cancel'
        ? 'Cancelled'
        : `Pickup ${fmtWindow(req.requestedWindowStart ?? req.previousWindowStart)}`,
    reason,
  };
  return { ...next, history: [...next.history, entry] };
}

function replaceRequest(data: AppData, req: ChangeRequest): AppData {
  return { ...data, requests: data.requests.map((r) => (r.id === req.id ? req : r)) };
}

export function pendingRequestFor(data: AppData, tripId: string): ChangeRequest | undefined {
  return data.requests.find((r) => r.tripId === tripId && r.status === 'pending');
}

/** Applies a confirmed change to trips and run, and marks the trip's stops (FR-022, FR-024). */
function applyChange(data: AppData, change: ProposedChange, at: Minutes): AppData {
  const world = applyToWorld(data, change);
  const trip = world.trips[change.tripId]!;
  const run = world.runs[trip.runId]!;
  const mark = { kind: change.kind === 'cancel' ? ('removed' as const) : ('changed' as const), at };
  const stops = run.stops.map((s) => (s.tripId === change.tripId ? { ...s, changeMark: mark } : s));
  return { ...data, trips: world.trips, runs: { ...world.runs, [run.id]: { ...run, stops } } };
}

/**
 * Validation of a requested pickup time (data-model.md ChangeRequest.requestedWindowStart,
 * A-11, A-12). Messages are written for the rider.
 */
export function validateTimeChange(
  data: AppData,
  tripId: string,
  newStart: Minutes,
  now: Minutes,
): Result<Trip> {
  const trip = data.trips[tripId];
  if (!trip) return { ok: false, error: 'That trip could not be found.' };
  if (trip.status !== 'scheduled') {
    return { ok: false, error: 'This trip can no longer be changed because it has already started or ended.' };
  }
  if (pendingRequestFor(data, tripId)) {
    return {
      ok: false,
      error: 'You already have a change to this trip waiting for the dispatcher. You can cancel the trip, or wait for a decision.',
    };
  }
  if (newStart === trip.windowStart) {
    return { ok: false, error: `${fmt(newStart)} is already your pickup time. Choose a different time.` };
  }
  if (newStart <= now) {
    return { ok: false, error: `Choose a time later than the current time (${fmt(now)}).` };
  }
  if (newStart < data.serviceDay.start || windowEnd(newStart) > data.serviceDay.end) {
    return {
      ok: false,
      error: `Choose a pickup time between ${fmt(data.serviceDay.start)} and ${fmt(data.serviceDay.end - 30)}.`,
    };
  }
  return { ok: true, value: trip };
}

/** Impact of a proposed time change, for the rider's preview (FR-004, FR-015). */
export function previewTimeChange(
  data: AppData,
  tripId: string,
  newStart: Minutes,
  now: Minutes,
): Result<RouteImpact> {
  const valid = validateTimeChange(data, tripId, newStart, now);
  if (!valid.ok) return valid;
  return {
    ok: true,
    value: computeImpact({ tripId, kind: 'time-change', newWindowStart: newStart }, data),
  };
}

export interface TransitionResult {
  data: AppData;
  request: ChangeRequest;
}

/** Rider submits a new pickup time (FR-002). Decided by route impact (FR-011–FR-013). */
export function submitTimeChange(
  data: AppData,
  tripId: string,
  newStart: Minutes,
  now: Minutes,
): Result<TransitionResult> {
  const valid = validateTimeChange(data, tripId, newStart, now);
  if (!valid.ok) return valid;
  const trip = valid.value;
  const impact = computeImpact({ tripId, kind: 'time-change', newWindowStart: newStart }, data);

  const [id, d1] = nextId(data, 'c');
  const submitted: ChangeRequest = {
    id,
    tripId,
    kind: 'time-change',
    requestedWindowStart: newStart,
    previousWindowStart: trip.windowStart,
    submittedAt: now,
    status: 'pending',
    decisionReasons: impact.reasons,
    declineReason: null,
    decidedAt: null,
    decidedBy: null,
  };
  let d = { ...d1, requests: [...d1.requests, submitted] };
  d = record(d, submitted, 'submitted', riderNameFor(d, trip), 'rider', now);

  if (impact.decision === 'confirm') {
    const confirmed: ChangeRequest = { ...submitted, status: 'confirmed', decidedAt: now, decidedBy: SYSTEM_ACTOR };
    d = applyChange(d, { tripId, kind: 'time-change', newWindowStart: newStart }, now);
    d = replaceRequest(d, confirmed);
    d = record(d, confirmed, 'confirmed', SYSTEM_ACTOR, 'system', now, 'No other rider affected');
    return { ok: true, value: { data: d, request: confirmed } };
  }

  // Routed: the trip and the manifest stay as they are while pending (FR-007, FR-023, A-7).
  d = record(
    d,
    submitted,
    'routed',
    SYSTEM_ACTOR,
    'system',
    now,
    impact.reasons.map((r) => REASON_TEXT[r]).join('; '),
  );
  return { ok: true, value: { data: d, request: submitted } };
}

/** Rider cancels a trip (FR-003). Always confirmed (FR-014, A-4); withdraws any pending change (A-12). */
export function cancelTrip(data: AppData, tripId: string, now: Minutes): Result<TransitionResult> {
  const trip = data.trips[tripId];
  if (!trip) return { ok: false, error: 'That trip could not be found.' };
  if (trip.status !== 'scheduled') {
    return { ok: false, error: 'This trip can no longer be cancelled because it has already started or ended.' };
  }
  let d = data;
  const riderName = riderNameFor(d, trip);
  const pending = pendingRequestFor(d, tripId);
  if (pending) {
    const withdrawn: ChangeRequest = { ...pending, status: 'withdrawn', decidedAt: now, decidedBy: riderName };
    d = replaceRequest(d, withdrawn);
    d = record(d, withdrawn, 'withdrawn', riderName, 'rider', now, 'Trip cancelled by rider');
  }
  const [id, d1] = nextId(d, 'c');
  const request: ChangeRequest = {
    id,
    tripId,
    kind: 'cancel',
    requestedWindowStart: null,
    previousWindowStart: trip.windowStart,
    submittedAt: now,
    status: 'confirmed',
    decisionReasons: [],
    declineReason: null,
    decidedAt: now,
    decidedBy: SYSTEM_ACTOR,
  };
  d = { ...d1, requests: [...d1.requests, request] };
  d = record(d, request, 'cancelled', riderName, 'rider', now);
  d = applyChange(d, { tripId, kind: 'cancel', newWindowStart: null }, now);
  d = record(d, request, 'confirmed', SYSTEM_ACTOR, 'system', now, 'Cancellations are always confirmed');
  return { ok: true, value: { data: d, request } };
}

/** Impact of a pending change against the run as it is now (A-16, FR-017). */
export function currentImpact(data: AppData, req: ChangeRequest): RouteImpact {
  return computeImpact(
    { tripId: req.tripId, kind: req.kind, newWindowStart: req.requestedWindowStart },
    data,
  );
}

function pendingOrError(data: AppData, requestId: string): Result<ChangeRequest> {
  const req = data.requests.find((r) => r.id === requestId);
  if (!req) return { ok: false, error: 'That change request could not be found.' };
  if (req.status !== 'pending') return { ok: false, error: 'That change has already been decided.' };
  const trip = data.trips[req.tripId];
  if (!trip || trip.status !== 'scheduled') {
    return { ok: false, error: 'The trip is no longer scheduled.' };
  }
  return { ok: true, value: req };
}

/** Dispatcher accepts after seeing the impact (FR-018). Applies the change (FR-022). */
export function acceptChange(
  data: AppData,
  requestId: string,
  dispatcher: string,
  now: Minutes,
): Result<TransitionResult> {
  const found = pendingOrError(data, requestId);
  if (!found.ok) return found;
  const req = found.value;
  // Recalculated against the current run before applying (A-16). The impact is not used to
  // re-decide: the dispatcher has made the decision.
  currentImpact(data, req);
  const accepted: ChangeRequest = { ...req, status: 'confirmed', decidedAt: now, decidedBy: dispatcher };
  let d = applyChange(
    data,
    { tripId: req.tripId, kind: req.kind, newWindowStart: req.requestedWindowStart },
    now,
  );
  d = replaceRequest(d, accepted);
  d = record(d, accepted, 'accepted', dispatcher, 'dispatcher', now);
  return { ok: true, value: { data: d, request: accepted } };
}

/** Dispatcher declines with a reason (FR-019). The trip and manifest are unchanged (FR-023). */
export function declineChange(
  data: AppData,
  requestId: string,
  dispatcher: string,
  reason: string,
  now: Minutes,
): Result<TransitionResult> {
  const found = pendingOrError(data, requestId);
  if (!found.ok) return found;
  const trimmed = reason.trim();
  if (!trimmed) return { ok: false, error: 'Enter a reason. The rider will see it.' };
  const declined: ChangeRequest = {
    ...found.value,
    status: 'not-accepted',
    declineReason: trimmed,
    decidedAt: now,
    decidedBy: dispatcher,
  };
  let d = replaceRequest(data, declined);
  d = record(d, declined, 'declined', dispatcher, 'dispatcher', now, trimmed);
  return { ok: true, value: { data: d, request: declined } };
}

/** Pending requests, ordered by requested pickup time (FR-016). */
export function pendingQueue(data: AppData): ChangeRequest[] {
  return data.requests
    .filter((r) => r.status === 'pending')
    .sort((a, b) => (a.requestedWindowStart ?? 0) - (b.requestedWindowStart ?? 0));
}
