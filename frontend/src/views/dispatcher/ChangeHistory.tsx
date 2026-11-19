// Change history for the service day, newest first.
// Implements: FR-021, FR-020 (shows actor, role, time, from and to, reason), G-77.
import { useAppState } from '../../state/AppState';
import { fmt } from '../../domain/time';

const EVENT_TEXT = {
  submitted: 'Change requested',
  confirmed: 'Confirmed',
  routed: 'Sent to dispatcher',
  accepted: 'Accepted',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
  cancelled: 'Cancellation requested',
} as const;

export function ChangeHistory() {
  const { data } = useAppState();
  const rows = [...data.history].reverse();
  return (
    <section aria-labelledby="history-heading" className="history">
      <h3 id="history-heading">Change history</h3>
      {rows.length === 0 ? (
        <p className="empty">No changes yet today.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Rider</th>
                <th scope="col">Event</th>
                <th scope="col">By</th>
                <th scope="col">From</th>
                <th scope="col">To</th>
                <th scope="col">Reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((h) => (
                <tr key={h.id}>
                  <td>{fmt(h.at)}</td>
                  <td>{h.riderName}</td>
                  <td>{EVENT_TEXT[h.event]}</td>
                  <td>
                    {h.actor} <span className="small">({h.actorRole})</span>
                  </td>
                  <td>{h.from}</td>
                  <td>{h.to}</td>
                  <td>{h.reason ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
