import { type StellarSystemComponentLabel } from '../stellar/stellar-system-component-label';
import { type KilonovaEventProfile } from './kilonova-event-profile';
import { type KilonovaProgenitorProfile } from './kilonova-progenitor';

export const KilonovaStellarLineageStage = Object.freeze({
  INELIGIBLE: 'INELIGIBLE',
  FUTURE_NS_NS_MERGER: 'FUTURE_NS_NS_MERGER',
  /** The compact pair will merge, but 27.1 deliberately has no Kerr spin/orientation model. */
  NS_BH_SPIN_UNRESOLVED: 'NS_BH_SPIN_UNRESOLVED',
  FUTURE_NS_BH_TIDAL_DISRUPTION: 'FUTURE_NS_BH_TIDAL_DISRUPTION',
} as const);
export type KilonovaStellarLineageStage = typeof KilonovaStellarLineageStage[keyof typeof KilonovaStellarLineageStage];

export class KilonovaStellarLineage {
  constructor(
    readonly stage: KilonovaStellarLineageStage,
    readonly primaryComponentLabel: StellarSystemComponentLabel,
    readonly secondaryComponentLabel: StellarSystemComponentLabel,
    readonly primaryDesignation: string,
    readonly secondaryDesignation: string,
    readonly currentStellarAgeBillionYears: number,
    readonly progenitor: KilonovaProgenitorProfile | null,
    readonly eventProfile: KilonovaEventProfile | null,
  ) {
    if (!Number.isFinite(currentStellarAgeBillionYears) || currentStellarAgeBillionYears < 0) {
      throw new RangeError('currentStellarAgeBillionYears must be finite and non-negative.');
    }
    const resolvedEvent =
      stage === KilonovaStellarLineageStage.FUTURE_NS_NS_MERGER ||
      stage === KilonovaStellarLineageStage.FUTURE_NS_BH_TIDAL_DISRUPTION;
    if (resolvedEvent !== (progenitor !== null && eventProfile !== null)) {
      throw new RangeError('Kilonova lineage stage and physical profile disagree.');
    }
    if (stage === KilonovaStellarLineageStage.NS_BH_SPIN_UNRESOLVED &&
        (progenitor !== null || eventProfile !== null)) {
      throw new RangeError('An NS-BH spin-unresolved candidate cannot invent a canonical kilonova profile.');
    }
  }
}
