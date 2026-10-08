import { type StellarSystemComponentLabel } from '../stellar/stellar-system-component-label';
import { type NovaEventProfile } from './nova-event-profile';
import { type NovaProgenitorProfile } from './nova-progenitor';

export const NovaStellarLineageStage = Object.freeze({
  INELIGIBLE: 'INELIGIBLE',
  ACCRETING_WHITE_DWARF: 'ACCRETING_WHITE_DWARF',
  CLASSICAL_NOVA_CHANNEL: 'CLASSICAL_NOVA_CHANNEL',
  RECURRENT_NOVA_CHANNEL: 'RECURRENT_NOVA_CHANNEL',
} as const);

export type NovaStellarLineageStage =
  typeof NovaStellarLineageStage[keyof typeof NovaStellarLineageStage];

export class NovaStellarLineage {
  constructor(
    readonly componentLabel: StellarSystemComponentLabel,
    readonly stellarDesignation: string,
    readonly stage: NovaStellarLineageStage,
    readonly currentStellarAgeBillionYears: number,
    readonly progenitor: NovaProgenitorProfile | null,
    readonly eventProfile: NovaEventProfile | null,
    readonly donorComponentLabel: StellarSystemComponentLabel | null,
  ) {
    if (!Number.isFinite(currentStellarAgeBillionYears) || currentStellarAgeBillionYears < 0) {
      throw new RangeError('currentStellarAgeBillionYears must be finite and non-negative.');
    }
    if ((progenitor === null) !== (eventProfile === null)) {
      throw new RangeError('Nova lineage must carry progenitor and event profile together.');
    }
    const eligible = stage !== NovaStellarLineageStage.INELIGIBLE;
    if (eligible !== (progenitor !== null) || eligible !== (donorComponentLabel !== null)) {
      throw new RangeError('Eligible nova lineages require a progenitor and donor component.');
    }
  }
}
