import { type NovaCanonicalEvent } from '../../domain/transient/nova-canonical-event';
import { NovaCanonicalEvent as NovaCanonicalEventModel } from '../../domain/transient/nova-canonical-event';
import { NovaStellarLineageStage } from '../../domain/transient/nova-stellar-lineage';
import {
  StellarNovaEligibilityResolver,
  type StellarNovaGroundTruthComponent,
  type StellarNovaInteractionContext,
} from './stellar-nova-eligibility-resolver';

const YEARS_PER_GYR = 1e9;

export class StellarNovaCanonicalEventResolver {
  private constructor() {}

  static resolveGroundTruthSystem(
    context: StellarNovaInteractionContext,
    components: readonly StellarNovaGroundTruthComponent[],
  ): readonly NovaCanonicalEvent[] {
    const lineages = StellarNovaEligibilityResolver.resolveGroundTruthSystem(context, components);
    return Object.freeze(lineages
      .filter(lineage => lineage.stage !== NovaStellarLineageStage.INELIGIBLE)
      .map(lineage => {
        const profile = lineage.eventProfile!;
        const recurrenceYears = profile.recurrenceIntervalYears;
        const currentYears = lineage.currentStellarAgeBillionYears * YEARS_PER_GYR;
        const phase01 = stablePhase01(
          `${context.generationKey.universeSeed.normalizedValue}:${context.generationKey.generatorVersionCode}:${lineage.stellarDesignation}:${lineage.componentLabel.name}`,
        );
        const elapsedSincePreviousYears = recurrenceYears * phase01;
        const previousYears = Math.max(0, currentYears - elapsedSincePreviousYears);
        const nextYears = currentYears + Math.max(1e-9, recurrenceYears - elapsedSincePreviousYears);

        return new NovaCanonicalEventModel(
          lineage.componentLabel,
          lineage.donorComponentLabel!,
          lineage.stellarDesignation,
          lineage.stage,
          lineage.currentStellarAgeBillionYears,
          recurrenceYears,
          previousYears / YEARS_PER_GYR,
          nextYears / YEARS_PER_GYR,
          profile,
        );
      }));
  }
}

function stablePhase01(value: string): number {
  let hash = 2166136261 >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  // avoid exactly 0/1 so previous and next are always distinct around now
  return (hash + 0.5) / 4294967296;
}
