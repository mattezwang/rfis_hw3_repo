// Driver manifest for a run, showing accepted changes only, with change marks.
// Implements: FR-022 (updated stop order and times), FR-023 (pending and declined changes never
// shown; the manifest is built from accepted state only), FR-024 ("Changed HH:MM",
// "Removed HH:MM"), G-64, G-145, G-149; A-13 (attendant note from seeded data).
import { useId, useState } from 'react';
import { useAppState } from '../../state/AppState';
import { toManifestView } from '../../domain/projections';
import { fmt } from '../../domain/time';

export function DriverView() {
  const { data } = useAppState();
  const runIds = Object.keys(data.runs);
  const [runId, setRunId] = useState(runIds.includes('R-12') ? 'R-12' : runIds[0]!);
  const selectId = useId();
  const m = toManifestView(data, runId);

  return (
    <section aria-labelledby="driver-heading" className="view">
      <h2 id="driver-heading">Driver manifest</h2>
      <div className="field-inline">
        <label htmlFor={selectId}>Run</label>
        <select id={selectId} value={runId} onChange={(e) => setRunId(e.target.value)}>
          {runIds.map((id) => (
            <option key={id} value={id}>
              {data.runs[id]!.label} · {data.runs[id]!.driverName}
            </option>
          ))}
        </select>
      </div>
      <p>
        {m.label} · driver {m.driverName} · {m.vehicleLabel} ({m.seats} seats, {m.wheelchairPositions} wheelchair
        positions)
      </p>
      <div className="table-scroll">
        <table className="manifest">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Time</th>
              <th scope="col">Stop</th>
              <th scope="col">Rider</th>
              <th scope="col">Where</th>
              <th scope="col">Pickup window</th>
              <th scope="col">Notes</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {m.rows.map((r, i) => {
              const status = r.removed
                ? `Removed ${fmt(r.changeMark?.at)}`
                : r.changeMark
                  ? `Changed ${fmt(r.changeMark.at)}`
                  : r.completed
                    ? 'Done'
                    : '';
              return (
                <tr
                  key={`${r.tripId}-${r.kind}`}
                  className={[r.removed ? 'row-removed' : '', r.changeMark && !r.removed ? 'row-changed' : '', r.completed ? 'row-done' : ''].join(' ')}
                >
                  <td>{i + 1}</td>
                  <td>{r.removed ? '—' : fmt(r.time)}</td>
                  <td>{r.kind === 'pickup' ? 'Pickup' : 'Drop-off'}</td>
                  <td>{r.riderName}</td>
                  <td>{r.locationLabel}</td>
                  <td>{r.windowStart !== null ? `${fmt(r.windowStart)}–${fmt(r.windowEnd)}` : '—'}</td>
                  <td className="small">
                    {r.mobilityNote}
                    {r.attendant ? '; attendant rides at no charge' : ''}
                  </td>
                  <td>{status && <strong>{status}</strong>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
