// Rider view: today's trips, change and cancel, outcomes.
// Implements: FR-001, FR-005, FR-006 (outcome shown on submit), FR-009 (live region),
// constitution Principle VI (only the rider's own data).
import { useState } from 'react';
import { useAppState } from '../../state/AppState';
import { riderTrips } from '../../domain/projections';
import { RIDER_ID, RIDER_NAME } from '../../domain/seed';
import { TripList } from './TripList';
import { OutcomeStatus, type Outcome } from './OutcomeStatus';

export function RiderView() {
  const { data } = useAppState();
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const trips = riderTrips(data, RIDER_ID);

  return (
    <section aria-labelledby="rider-heading" className="view">
      <h2 id="rider-heading">Hi {RIDER_NAME}, here are your trips today</h2>
      <OutcomeStatus outcome={outcome} />
      <TripList trips={trips} onOutcome={setOutcome} />
    </section>
  );
}
