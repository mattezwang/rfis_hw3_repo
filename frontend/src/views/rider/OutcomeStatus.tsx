// Outcome of the rider's last action, announced to assistive technology.
// Implements: FR-005 (confirmed / not accepted / pending), FR-006 (shown immediately on submit),
// FR-009 (aria-live region; status in text, not colour alone).

export type OutcomeKind = 'confirmed' | 'pending' | 'not-accepted' | 'error';

export interface Outcome {
  kind: OutcomeKind;
  title: string;
  detail: string;
}

const LABEL: Record<OutcomeKind, string> = {
  confirmed: 'Confirmed',
  pending: 'Pending dispatcher review',
  'not-accepted': 'Not accepted',
  error: 'Could not submit',
};

export function OutcomeStatus({ outcome }: { outcome: Outcome | null }) {
  return (
    <div aria-live="polite" aria-atomic="true" className="outcome-region">
      {outcome && (
        <div className={`outcome outcome-${outcome.kind}`}>
          <p className="outcome-title">
            <span className="badge">{LABEL[outcome.kind]}</span> {outcome.title}
          </p>
          <p>{outcome.detail}</p>
        </div>
      )}
    </div>
  );
}
