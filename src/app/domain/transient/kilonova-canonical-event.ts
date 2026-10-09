import { type StellarSystemComponentLabel } from '../stellar/stellar-system-component-label';
import { type KilonovaEventProfile } from './kilonova-event-profile';
import { KilonovaStellarLineageStage, type KilonovaStellarLineageStage as KilonovaStellarLineageStageValue } from './kilonova-stellar-lineage';
import { KilonovaType } from './kilonova-type';

export const KILONOVA_CANONICAL_EVENT_VERSION = 'KILONOVA_CANONICAL_EVENT_V1' as const;

export class KilonovaCanonicalEvent {
  readonly version = KILONOVA_CANONICAL_EVENT_VERSION;
  constructor(
    readonly primaryComponentLabel: StellarSystemComponentLabel,
    readonly secondaryComponentLabel: StellarSystemComponentLabel,
    readonly primaryDesignation: string,
    readonly secondaryDesignation: string,
    readonly sourceLineageStage: KilonovaStellarLineageStageValue,
    readonly currentStellarAgeBillionYears: number,
    readonly mergerDelayYears: number,
    readonly mergerStellarAgeBillionYears: number,
    readonly profile: KilonovaEventProfile,
  ) {
    if (!Number.isFinite(currentStellarAgeBillionYears) || currentStellarAgeBillionYears < 0 ||
        !Number.isFinite(mergerDelayYears) || mergerDelayYears <= 0 ||
        !Number.isFinite(mergerStellarAgeBillionYears) ||
        mergerStellarAgeBillionYears <= currentStellarAgeBillionYears) {
      throw new RangeError('Canonical kilonova must be one future compact-object merger.');
    }
    const resolvedNsNs = sourceLineageStage === KilonovaStellarLineageStage.FUTURE_NS_NS_MERGER &&
      profile.type === KilonovaType.BINARY_NEUTRON_STAR;
    const resolvedNsBh = sourceLineageStage === KilonovaStellarLineageStage.FUTURE_NS_BH_TIDAL_DISRUPTION &&
      profile.type === KilonovaType.NEUTRON_STAR_BLACK_HOLE;
    if (!resolvedNsNs && !resolvedNsBh) {
      throw new RangeError('Canonical kilonova requires one resolved merger lineage matching its event family.');
    }
  }
  get eventKey(): string { return `KILONOVA:${this.primaryComponentLabel.name}-${this.secondaryComponentLabel.name}`; }
}
