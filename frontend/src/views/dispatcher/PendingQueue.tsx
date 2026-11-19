// Queue of pending changes, ordered by requested pickup time.
// Implements: FR-016.
import type { ChangeRequest } from '../../domain/types';
import { useAppState } from '../../state/AppState';
import { fmt, fmtWindow } from '../../domain/time';
import { REASON_TEXT } from '../../domain/decide';

export function PendingQueue({
  queue,
  selectedId,
  onSelect,
}: {
  queue: ChangeRequest[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { data } = useAppState();
  return (
    <nav aria-label="Pending changes" className="queue">
      <h3>Pending ({queue.length})</h3>
      {queue.length === 0 ? (
        <p className="empty">None</p>
      ) : (
        <ul>
          {queue.map((r) => {
            const trip = data.trips[r.tripId]!;
            const rider = data.riders[trip.riderId]!;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  className="queue-item"
                  aria-current={r.id === selectedId ? 'true' : undefined}
                  onClick={() => onSelect(r.id)}
                >
                  <strong>{rider.name}</strong> · run {trip.runId}
                  <br />
                  {fmtWindow(r.previousWindowStart)} → {fmtWindow(r.requestedWindowStart ?? r.previousWindowStart)}
                  <br />
                  <span className="small">
                    Submitted {fmt(r.submittedAt)} · {r.decisionReasons.map((x) => REASON_TEXT[x]).join('; ')}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
