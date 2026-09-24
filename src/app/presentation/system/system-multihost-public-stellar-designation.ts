import { type MultihostLabel } from '../../simulation/stellar/stellar-multihost-formation';
import { stellarMultihostPublicComponentDesignation } from '../../simulation/stellar/stellar-multihost-public-designation';

/**
 * Presentation compatibility alias. The actual naming rule lives in the
 * simulation-layer public-designation boundary shared by cards and scenes.
 */
export function systemMultihostPublicStellarComponentDesignation(
  systemName: string,
  componentLabel: MultihostLabel,
): string {
  return stellarMultihostPublicComponentDesignation(systemName, componentLabel);
}
