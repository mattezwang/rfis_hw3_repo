// Decision rule for a same-day change: confirm automatically or route to the dispatcher.
// Implements: FR-011 (confirm when no one else is affected), FR-012 (route when another pickup
// is pushed outside its window or capacity is exceeded), FR-013 (route when the requester's own
// window is unreachable), FR-014 (cancellations always confirm), A-3, A-4, A-10.
// Resolves conflict C-1 as specified (spec.md, Requirements Decisions).
import type { Decision, DecisionReason, RouteImpact } from './types';

type DecisionInput = Pick<
  RouteImpact,
  'requestKind' | 'othersOutsideWindow' | 'capacityExceeded' | 'requesterOutsideWindow'
>;

export function decideChange(impact: DecisionInput): {
  decision: Decision;
  reasons: DecisionReason[];
} {
  if (impact.requestKind === 'cancel') return { decision: 'confirm', reasons: [] };

  const reasons: DecisionReason[] = [];
  if (impact.othersOutsideWindow.length > 0) reasons.push('other-pickup-outside-window');
  if (impact.capacityExceeded) reasons.push('capacity-exceeded');
  if (impact.requesterOutsideWindow) reasons.push('requester-window-unreachable');

  return { decision: reasons.length > 0 ? 'route-to-dispatcher' : 'confirm', reasons };
}

/** Wording for the dispatcher only. The rider is told just that approval is needed (FR-008). */
export const REASON_TEXT: Record<DecisionReason, string> = {
  'other-pickup-outside-window': "Pushes another rider's pickup outside their window",
  'capacity-exceeded': 'Exceeds the van’s seat or wheelchair capacity',
  'requester-window-unreachable': 'The van cannot reach this rider within the new window',
};
