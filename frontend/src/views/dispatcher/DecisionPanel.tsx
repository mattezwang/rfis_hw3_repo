// Accept, or decline with a reason, shown only beside the impact table.
// Implements: FR-018 (accept from the impact screen), FR-019 (decline requires a reason that the
// rider will see), G-74, G-146.
import { useId, useState } from 'react';
import type { ChangeRequest } from '../../domain/types';
import { useAppState } from '../../state/AppState';
import { fmtWindow } from '../../domain/time';

export function DecisionPanel({
  request,
  onDecided,
}: {
  request: ChangeRequest;
  onDecided: (message: string) => void;
}) {
  const { accept, decline, data } = useAppState();
  const reasonId = useId();
  const errorId = useId();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const riderName = data.riders[data.trips[request.tripId]!.riderId]!.name;
  const to = fmtWindow(request.requestedWindowStart ?? request.previousWindowStart);

  return (
    <div className="decision">
      <h3>Decision</h3>
      <div className="actions">
        <button
          type="button"
          onClick={() => {
            const r = accept(request.id);
            if (r.ok) onDecided(`Accepted: ${riderName}'s pickup is now ${to}. The driver's manifest is updated.`);
            else setError(r.error);
          }}
        >
          Accept change
        </button>
      </div>
      <form
        className="decline-form"
        onSubmit={(e) => {
          e.preventDefault();
          const r = decline(request.id, reason);
          if (r.ok) onDecided(`Declined: ${riderName} has been told why. Their pickup stays ${fmtWindow(request.previousWindowStart)}.`);
          else setError(r.error);
        }}
      >
        <label htmlFor={reasonId}>Reason for declining (shown to the rider)</label>
        <textarea
          id={reasonId}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
        />
        {error && (
          <p id={errorId} className="field-error">
            {error}
          </p>
        )}
        <div className="actions">
          <button type="submit" className="danger">
            Decline change
          </button>
        </div>
      </form>
    </div>
  );
}
