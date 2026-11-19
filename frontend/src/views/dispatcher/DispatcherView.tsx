// Dispatcher view: pending queue, impact of the selected change, decision, history.
// Implements: FR-016–FR-021. The impact is computed by the domain module against the current
// state every render (FR-015, A-16); this component holds no impact logic (Principle V).
import { useState } from 'react';
import { useAppState } from '../../state/AppState';
import { currentImpact, pendingQueue } from '../../domain/store';
import { PendingQueue } from './PendingQueue';
import { ImpactTable } from './ImpactTable';
import { DecisionPanel } from './DecisionPanel';
import { ChangeHistory } from './ChangeHistory';

export function DispatcherView() {
  const { data } = useAppState();
  const queue = pendingQueue(data);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastDecision, setLastDecision] = useState<string | null>(null);
  const selected = queue.find((r) => r.id === selectedId) ?? queue[0];
  const impact = selected ? currentImpact(data, selected) : null;

  return (
    <section aria-labelledby="dispatcher-heading" className="view">
      <h2 id="dispatcher-heading">Same-day changes awaiting a decision</h2>
      <div aria-live="polite" className="outcome-region">
        {lastDecision && <p className="outcome outcome-confirmed">{lastDecision}</p>}
      </div>
      <div className="dispatcher-layout">
        <PendingQueue
          queue={queue}
          selectedId={selected?.id ?? null}
          onSelect={(id) => {
            setSelectedId(id);
            setLastDecision(null);
          }}
        />
        <div className="impact-pane">
          {selected && impact ? (
            <>
              <ImpactTable request={selected} impact={impact} />
              <DecisionPanel
                key={selected.id}
                request={selected}
                onDecided={(msg) => {
                  setLastDecision(msg);
                  setSelectedId(null);
                }}
              />
            </>
          ) : (
            <p className="empty">No changes are waiting. Changes that affect no other rider are confirmed automatically.</p>
          )}
        </div>
      </div>
      <ChangeHistory />
    </section>
  );
}
