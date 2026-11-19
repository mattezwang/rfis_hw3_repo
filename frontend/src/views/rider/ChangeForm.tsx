// Request a new pickup time: enter, review (preview), submit.
// Implements: FR-002 (new pickup time), FR-004 (own new window and approval need before
// submitting), FR-005 and FR-006 (outcome on submit), FR-008 (preview has no other riders' data:
// it renders a RiderPreview and SuggestedTimes only), FR-009 (labelled input, errors tied to the
// field, focus kept with the task), A-11, A-12.
// V2: FR-025 (own estimated arrival), FR-026 (times that would confirm right away),
// FR-027 (plain message when the van cannot reach the requested window).
import { useEffect, useId, useRef, useState } from 'react';
import type { RiderTripView } from '../../domain/projections';
import { toRiderPreview } from '../../domain/projections';
import { previewTimeChange } from '../../domain/store';
import { suggestTimes } from '../../domain/suggest';
import { fmt, fmtWindow, parseHM } from '../../domain/time';
import type { Minutes, RiderPreview, SuggestedTime } from '../../domain/types';
import { useAppState } from '../../state/AppState';
import type { Outcome } from './OutcomeStatus';

interface Preview {
  start: Minutes;
  p: RiderPreview;
  suggestions: SuggestedTime[];
}

export function SuggestionList({
  suggestions,
  onChoose,
  label,
}: {
  suggestions: SuggestedTime[];
  onChoose: (start: Minutes) => void;
  label: string;
}) {
  if (suggestions.length === 0) return null;
  return (
    <div className="suggestions">
      <p className="suggestions-title">{label}</p>
      <ul>
        {suggestions.map((s) => (
          <li key={s.windowStart}>
            <button type="button" className="secondary" onClick={() => onChoose(s.windowStart)}>
              Pickup {fmtWindow(s.windowStart)}
              <span className="small">
                {' '}
                · van about {fmt(s.estimatedPickup)} · home about {fmt(s.estimatedArrival)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChangeForm({
  trip,
  initialStart,
  onDone,
}: {
  trip: RiderTripView;
  /** V2: open straight to the preview of a suggested time. */
  initialStart?: Minutes;
  onDone: (o: Outcome | null) => void;
}) {
  const { data, now, submitChange } = useAppState();
  const inputId = useId();
  const errorId = useId();
  const [value, setValue] = useState(fmt(initialStart ?? trip.windowStart));
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewHeadingRef = useRef<HTMLHeadingElement>(null);

  function review(start: Minutes | null) {
    if (start === null) {
      setError('Enter a time as HH:MM, for example 16:30.');
      inputRef.current?.focus();
      return;
    }
    const r = previewTimeChange(data, trip.trip.id, start, now);
    if (!r.ok) {
      setError(r.error);
      setPreview(null);
      inputRef.current?.focus();
      return;
    }
    setError(null);
    setValue(fmt(start));
    const p = toRiderPreview(r.value);
    // FR-026: suggestions only when the requested time cannot be confirmed right away.
    const suggestions = p.needsApproval ? suggestTimes(data, trip.trip.id, start, now) : [];
    setPreview({ start, p, suggestions });
  }

  // Open a suggested time straight to its preview.
  useEffect(() => {
    if (initialStart !== undefined) review(initialStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep keyboard focus with the task as the form changes step (FR-009).
  useEffect(() => {
    if (preview) previewHeadingRef.current?.focus();
    else inputRef.current?.focus();
  }, [preview]);

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
        detail: `The van will pick you up at ${trip.pickupLabel}. You should be home around ${fmt(preview.p.estimatedArrival)}. No call needed.`,
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
            review(parseHM(value));
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
            <div>
              <dt>Estimated arrival home</dt>
              <dd>{fmt(preview.p.estimatedArrival)}</dd>
            </div>
          </dl>
          {preview.p.ownWindowUnreachable && (
            <p className="note note-declined">
              The van can’t reach you between {fmt(preview.p.newWindowStart)} and {fmt(preview.p.newWindowEnd)}. The
              earliest it could pick you up is about {fmt(preview.p.estimatedPickup)}.
            </p>
          )}
          <p className={preview.p.needsApproval ? 'note note-pending' : 'note note-confirmed'}>
            {preview.p.needsApproval
              ? 'This change affects the van’s schedule, so a dispatcher needs to approve it. Your current pickup stays in place until they decide.'
              : 'This change can be confirmed right away.'}
          </p>
          {preview.p.needsApproval &&
            (preview.suggestions.length > 0 ? (
              <SuggestionList
                suggestions={preview.suggestions}
                label="These times can be confirmed right away:"
                onChoose={(start) => review(start)}
              />
            ) : (
              <p className="hint">No nearby time can be confirmed right away. You can still send this request to the dispatcher.</p>
            ))}
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
