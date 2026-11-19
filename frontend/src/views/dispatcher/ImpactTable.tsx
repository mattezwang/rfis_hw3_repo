// Whole-route impact of a pending change on one screen.
// Implements: FR-017 (every affected rider and window, before and after, outside-window flags,
// onboard capacity, mobility needs), FR-015 (renders RouteImpact from the domain module only),
// G-72, G-75, G-76. V2: FR-028 (summary of affected riders and why, from affectedSummary).
import type { ChangeRequest, RouteImpact } from '../../domain/types';
import { fmt, fmtWindow } from '../../domain/time';
import { REASON_TEXT } from '../../domain/decide';
import { useAppState } from '../../state/AppState';
import { affectedSummary } from '../../domain/suggest';

function AffectedSummary({ impact }: { impact: RouteImpact }) {
  const items = affectedSummary(impact);
  if (items.length === 0) return null;
  return (
    <div className="affected-summary">
      <h4>Riders affected if you accept</h4>
      <ul>
        {items.map((i) => (
          <li key={`${i.tripId}-${i.reason}`}>
            <strong>{i.riderName}</strong>:{' '}
            {i.reason === 'pushed-outside-window'
              ? `pickup would be ${fmt(i.newTime)}, after their window ends at ${fmt(i.windowEnd)}`
              : 'on board while the van would be over capacity'}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ImpactTable({ request, impact }: { request: ChangeRequest; impact: RouteImpact }) {
  const { data } = useAppState();
  const trip = data.trips[request.tripId]!;
  const rider = data.riders[trip.riderId]!;
  const v = impact.vehicle;

  return (
    <div className="impact">
      <h3>
        {rider.name}: pickup {fmtWindow(request.previousWindowStart)} →{' '}
        {fmtWindow(request.requestedWindowStart ?? request.previousWindowStart)}
      </h3>
      <p>
        Run {impact.runId}, {v.label} ({v.seats} seats, {v.wheelchairPositions} wheelchair positions). Impact
        recalculated against the run as it is now.
      </p>
      <AffectedSummary impact={impact} />
      {impact.reasons.length > 0 ? (
        <ul className="reasons">
          {impact.reasons.map((r) => (
            <li key={r}>⚠ {REASON_TEXT[r]}</li>
          ))}
        </ul>
      ) : (
        <p className="note note-confirmed">With the current run, this change no longer affects any other rider.</p>
      )}
      <div className="table-scroll">
        <table>
          <caption className="sr-only">Stops on run {impact.runId} if the change is accepted</caption>
          <thead>
            <tr>
              <th scope="col">Stop</th>
              <th scope="col">Rider</th>
              <th scope="col">Mobility</th>
              <th scope="col">Pickup window</th>
              <th scope="col">Now</th>
              <th scope="col">If accepted</th>
              <th scope="col">Window check</th>
              <th scope="col">Onboard seats</th>
              <th scope="col">Onboard wheelchairs</th>
            </tr>
          </thead>
          <tbody>
            {impact.rows.map((r) => {
              const moved = r.before !== r.after;
              const classes = [
                r.isRequester ? 'row-requester' : '',
                r.outsideWindowAfter && !r.isRequester ? 'row-flag' : '',
                r.completed ? 'row-done' : '',
              ].join(' ');
              return (
                <tr key={`${r.tripId}-${r.kind}`} className={classes}>
                  <td>
                    {r.kind === 'pickup' ? 'Pickup' : 'Drop-off'}
                    {r.completed ? ' (done)' : ''}
                    <br />
                    <span className="small">{r.locationLabel}</span>
                  </td>
                  <td>
                    {r.riderName}
                    {r.isRequester ? ' (requesting)' : ''}
                  </td>
                  <td className="small">
                    {r.mobilityNote}
                    {r.attendant ? '; attendant rides free' : ''}
                  </td>
                  <td>{r.windowStart !== null ? `${fmt(r.windowStart)}–${fmt(r.windowEnd)}` : '—'}</td>
                  <td>{fmt(r.before)}</td>
                  <td>
                    {fmt(r.after)}
                    {moved && r.before !== null && r.after !== null ? ` (${r.after > r.before ? '+' : ''}${r.after - r.before} min)` : ''}
                  </td>
                  <td>{r.kind === 'pickup' && !r.completed ? (r.outsideWindowAfter ? 'OUTSIDE window' : 'OK') : '—'}</td>
                  <td className={r.onboardSeatsAfter > v.seats ? 'over' : ''}>
                    {r.onboardSeatsAfter}/{v.seats}
                    {r.onboardSeatsAfter > v.seats ? ' OVER' : ''}
                  </td>
                  <td className={r.onboardWheelchairsAfter > v.wheelchairPositions ? 'over' : ''}>
                    {r.onboardWheelchairsAfter}/{v.wheelchairPositions}
                    {r.onboardWheelchairsAfter > v.wheelchairPositions ? ' OVER' : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
