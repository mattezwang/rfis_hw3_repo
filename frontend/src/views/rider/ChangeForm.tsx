// Request a new pickup time: enter, review (preview), submit.
// Implements: FR-002 (new pickup time), FR-004 (own new window and approval need before
// submitting), FR-005 and FR-006 (outcome on submit), FR-008 (preview has no other riders' data:
// it renders a RiderPreview only), FR-009 (labelled input, errors tied to the field), A-11, A-12.
import { useEffect, useId, useRef, useState } from 'react';
import type { RiderTripView } from '../../domain/projections';
import { toRiderPreview } from '../../domain/projections';
import { previewTimeChange } from '../../domain/store';
import { fmt, fmtWindow, parseHM } from '../../domain/time';
import type { RiderPreview } from '../../domain/types';
import { useAppState } from '../../state/AppState';
import type { Outcome } from './OutcomeStatus';

export function ChangeForm({
  trip,
  onDone,
}: {
  trip: RiderTripView;
  onDone: (o: Outcome | null) => void;
}) {
  const { data, now, submitChange } = useAppState();
  const inputId = useId();
  const errorId = useId();
  const [value, setValue] = useState(fmt(trip.windowStart));
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ start: number; p: RiderPreview } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewHeadingRef = useRef<HTMLHeadingElement>(null);

  // Keep keyboard focus with the task as the form changes step (FR-009).
  useEffect(() => {
    if (preview) previewHeadingRef.current?.focus();
    else inputRef.current?.focus();
  }, [preview]);

  function review() {
    const start = parseHM(value);
    if (start === null) {
      setError('Enter a time as HH:MM, for example 16:30.');
      inputRef.current?.focus();
      return;
    }
    const r = previewTimeChange(data, trip.trip.id, start, now);
    if (!r.ok) {
      setError(r.error);
      inputRef.current?.focus();
      return;
    }
    setError(null);
    setPreview({ start, p: toRiderPreview(r.value) });
  }

  function submit() {
    if (!preview) return;
    const r = submitChange(trip.trip.id, preview.start);
    if (!r.ok) {
      onDone({ kind: 'error', title: 'Your change was not submitted.', detail: r.error });
      return;
    }
    const req = r.value.request;
    if (req.status === 'confirmed') {
      onDone({
        kind: 'confirmed',
        title: `Your new pickup window is ${fmtWindow(preview.start)}.`,
        detail: `The van will pick you up at ${trip.pickupLabel}. No call needed.`,
      });
    } else {
      onDone({
        kind: 'pending',
        title: `Your request for ${fmtWindow(preview.start)} has been sent to the dispatcher.`,
        detail: `Your original pickup ${fmtWindow(trip.windowStart)} still stands until the dispatcher decides. This page will show the decision.`,
      });
    }
  }

  return (
    <div className="change-form" role="group" aria-label="Change pickup time">
      {!preview && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            review();
          }}
        >
          <label htmlFor={inputId}>New pickup time</label>
          <p className="hint" id={`${inputId}-hint`}>
            Current pickup window: {fmtWindow(trip.windowStart)}. Your window will start at the time you choose
            and last 30 minutes.
          </p>
          <input
            id={inputId}
            ref={inputRef}
            type="time"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-describedby={`${inputId}-hint${error ? ` ${errorId}` : ''}`}
            aria-invalid={Boolean(error)}
            required
          />
          {error && (
            <p id={errorId} className="field-error">
              {error}
            </p>
          )}
          <div className="actions">
            <button type="submit">Review change</button>
            <button type="button" className="secondary" onClick={() => onDone(null)}>
              Back
            </button>
          </div>
        </form>
      )}

      {preview && (
        <div className="preview">
          <h4 ref={previewHeadingRef} tabIndex={-1}>
            Review your change
          </h4>
          <dl className="facts">
            <div>
              <dt>New pickup window</dt>
              <dd>
                {fmt(preview.p.newWindowStart)}–{fmt(preview.p.newWindowEnd)}
              </dd>
            </div>
            <div>
              <dt>Estimated pickup</dt>
              <dd>{fmt(preview.p.estimatedPickup)}</dd>
            </div>
          </dl>
          <p className={preview.p.needsApproval ? 'note note-pending' : 'note note-confirmed'}>
            {preview.p.needsApproval
              ? 'This change affects the van’s schedule, so a dispatcher needs to approve it. Your current pickup stays in place until they decide.'
              : 'This change can be confirmed right away.'}
          </p>
          <div className="actions">
            <button type="button" onClick={submit}>
              Submit change
            </button>
            <button type="button" className="secondary" onClick={() => setPreview(null)}>
              Edit time
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
