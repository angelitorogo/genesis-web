import { type StellarSystemComponentLabel } from '../stellar/stellar-system-component-label';
import { type NovaEventProfile } from './nova-event-profile';
import { type NovaStellarLineageStage } from './nova-stellar-lineage';

export const NOVA_CANONICAL_EVENT_VERSION = 'NOVA_CANONICAL_EVENT_V1' as const;

/** Persisted deterministic nova cycle; no wall-clock timestamp is part of Ground Truth. */
export class NovaCanonicalEvent {
  readonly version = NOVA_CANONICAL_EVENT_VERSION;

  constructor(
    readonly componentLabel: StellarSystemComponentLabel,
    readonly donorComponentLabel: StellarSystemComponentLabel,
    readonly stellarDesignation: string,
    readonly sourceLineageStage: NovaStellarLineageStage,
    readonly currentStellarAgeBillionYears: number,
    readonly recurrenceIntervalYears: number,
    readonly previousEruptionStellarAgeBillionYears: number,
    readonly nextEruptionStellarAgeBillionYears: number,
    readonly profile: NovaEventProfile,
  ) {
    assertAge(currentStellarAgeBillionYears, 'currentStellarAgeBillionYears');
    assertAge(previousEruptionStellarAgeBillionYears, 'previousEruptionStellarAgeBillionYears');
    assertAge(nextEruptionStellarAgeBillionYears, 'nextEruptionStellarAgeBillionYears');
    if (!Number.isFinite(recurrenceIntervalYears) || recurrenceIntervalYears <= 0) {
      throw new RangeError('recurrenceIntervalYears must be finite and > 0.');
    }
    if (previousEruptionStellarAgeBillionYears > currentStellarAgeBillionYears + 1e-12) {
      throw new RangeError('Previous nova eruption cannot be in the future.');
    }
    if (nextEruptionStellarAgeBillionYears + 1e-12 < currentStellarAgeBillionYears) {
      throw new RangeError('Next nova eruption cannot be in the past.');
    }
    if (componentLabel.code === donorComponentLabel.code) {
      throw new RangeError('Nova accretor and donor must be different stellar components.');
    }
  }

  get eventKey(): string {
    return `NOVA:${this.componentLabel.name}`;
  }
}

function assertAge(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be finite and non-negative.`);
}
