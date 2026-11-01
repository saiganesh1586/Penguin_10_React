import type { EventRequest, ProposalVersion } from '../data-store';

/** Return the exact, latest mutually accepted proposal instead of assuming array order. */
export function acceptedProposalFor(
  request: Pick<EventRequest, 'proposals' | 'currentProposalVersion'>
): ProposalVersion | undefined {
  const accepted = (request.proposals || []).filter(proposal => proposal.status === 'accepted');
  const selected = accepted.find(proposal => proposal.version === request.currentProposalVersion);
  return (
    selected || accepted.sort((left, right) => Number(right.version) - Number(left.version))[0]
  );
}
