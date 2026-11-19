// The rider's trips with status and actions.
// Implements: FR-001 (trips, windows, status, pending), FR-003 (cancel with confirmation),
// FR-005 and FR-007 (pending shows the original pickup still stands; not accepted shows the
// dispatcher's reason), FR-008 (no routing details or other riders), FR-009, US1-5.
// V2: FR-025 (own estimated arrival on each scheduled trip), FR-026 (times that would confirm
// right away, after a decline).
import { useEffect, useRef, useState } from 'react';
import type { RiderTripView } from '../../domain/projections';
import { fmt, fmtWindow } from '../../domain/time';
import type { Minutes } from '../../domain/types';
import { useAppState } from '../../state/AppState';
import { ChangeForm, SuggestionList } from './ChangeForm';
import type { Outcome } from './OutcomeStatus';

const STATUS_TEXT = {
  scheduled: 'Scheduled',
  'picked-up': 'Picked up',
  completed: 'Completed',
  cancelled: 'Cancelled',
} as const;

function tripTitle(t: RiderTripView): string {
  return `${t.pickupLabel} → ${t.dropoffLabel}`;
}

function StatusNote({ t, onChoose }: { t: RiderTripView; onChoose: (start: Minutes) => void }) {
  if (t.pending && t.pending.requestedWindowStart !== null) {
    return (
      <p className="note note-pending">
        <strong>Change pending dispatcher review:</strong> you asked for{' '}
        {fmtWindow(t.pending.requestedWindowStart)}. Your original pickup {fmtWindow(t.windowStart)} still
        stands until the dispatcher decides.
      </p>
    );
  }
  const latest = t.latest;
  if (latest?.status === 'not-accepted' && latest.requestedWindowStart !== null) {
    return (
      <div className="note note-declined">
        <strong>Change not accepted:</strong> your request for {fmtWindow(latest.requestedWindowStart)} was
        not accepted. Reason from the dispatcher: “{latest.declineReason}”. Your pickup is still{' '}
        {fmtWindow(t.windowStart)}.
        {t.suggestions.length > 0 && (
          <SuggestionList
            suggestions={t.suggestions}
            label="These times can be confirmed right away:"
            onChoose={onChoose}
          />
        )}
      </div>
    );
  }
  if (latest?.status === 'confirmed' && latest.kind === 'time-change') {
    return (
      <p className="note note-confirmed">
        <strong>Change confirmed:</strong> your pickup is now {fmtWindow(t.windowStart)}.
      </p>
    );
  }
  return null;
}

export function TripList({
  trips,
  onOutcome,
}: {
  trips: RiderTripView[];
  onOutcome: (o: Outcome) => void;
}) {
  const { cancel } = useAppState();
  const [changing, setChanging] = useState<string | null>(null);
  const [startAt, setStartAt] = useState<Minutes | undefined>(undefined);
  const [confirmingCancel, setConfirmingCancel] = useState<string | null>(null);
  // After a change or cancellation finishes, return focus to that trip's heading so keyboard
  // and screen-reader users keep their place (FR-009).
  const [returnFocusTo, setReturnFocusTo] = useState<string | null>(null);
  const headings = useRef<Record<string, HTMLHeadingElement | null>>({});
  useEffect(() => {
    if (returnFocusTo) {
      headings.current[returnFocusTo]?.focus();
      setReturnFocusTo(null);
    }
  }, [returnFocusTo]);

  return (
    <ul className="trip-list">
      {trips.map((t) => {
        const id = t.trip.id;
        const headingId = `trip-${id}`;
        return (
          <li key={id} className="card" aria-labelledby={headingId}>
            <h3
              id={headingId}
              tabIndex={-1}
              ref={(el) => {
                headings.current[id] = el;
              }}
            >
              {tripTitle(t)}
            </h3>
            <dl className="facts">
              <div>
                <dt>Pickup window</dt>
                <dd>{t.trip.status === 'cancelled' ? '—' : fmtWindow(t.windowStart)}</dd>
              </div>
              {t.estimatedArrival !== null && (
                <div>
                  <dt>Estimated arrival</dt>
                  <dd>{fmt(t.estimatedArrival)}</dd>
                </div>
              )}
              <div>
                <dt>Status</dt>
                <dd>{t.pending ? 'Scheduled · change pending' : STATUS_TEXT[t.trip.status]}</dd>
              </div>
            </dl>
            <StatusNote
              t={t}
              onChoose={(start) => {
                setStartAt(start);
                setChanging(id);
              }}
            />

            {t.canChange && changing !== id && confirmingCancel !== id && (
              <div className="actions">
                <button
                  type="button"
                  onClick={() => {
                    setStartAt(undefined);
                    setChanging(id);
                  }}
                  disabled={Boolean(t.pending)}
                >
                  Change pickup time
                </button>
                <button type="button" className="secondary" onClick={() => setConfirmingCancel(id)}>
                  Cancel trip
                </button>
                {t.pending && (
                  <p className="hint">You can change the time again once the dispatcher has decided.</p>
                )}
              </div>
            )}

            {changing === id && (
              <ChangeForm
                trip={t}
                initialStart={startAt}
                onDone={(o) => {
                  setChanging(null);
                  setReturnFocusTo(id);
                  if (o) onOutcome(o);
                }}
              />
            )}

            {confirmingCancel === id && (
              <div className="confirm-box" role="group" aria-label="Confirm cancellation">
                <p>Cancel this trip? This cannot be undone.</p>
                <div className="actions">
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      const r = cancel(id);
                      setConfirmingCancel(null);
                      setReturnFocusTo(id);
                      onOutcome(
                        r.ok
                          ? {
                              kind: 'confirmed',
                              title: 'Trip cancelled.',
                              detail: `${tripTitle(t)} (${fmtWindow(t.windowStart)}) is cancelled.`,
                            }
                          : { kind: 'error', title: 'The trip was not cancelled.', detail: r.error },
                      );
                    }}
                  >
                    Yes, cancel trip
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    autoFocus
                    onClick={() => {
                      setConfirmingCancel(null);
                      setReturnFocusTo(id);
                    }}
                  >
                    Keep trip
                  </button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
