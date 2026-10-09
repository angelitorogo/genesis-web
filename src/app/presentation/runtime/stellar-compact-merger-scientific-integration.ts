import { type SystemLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { type CompactMergerCanonicalEventRepository } from '../../domain/repository/compact-merger-canonical-event-repository';
import { type CompactMergerCanonicalEvent } from '../../domain/transient/compact-merger-canonical-event';
import { type CompactMergerStellarConsequence } from '../../domain/transient/compact-merger-stellar-consequence';
import { type CompactMergerStellarLineage } from '../../domain/transient/compact-merger-stellar-lineage';
import { StellarCompactMergerCanonicalEventResolver } from '../../simulation/transient/stellar-compact-merger-canonical-event-resolver';
import { StellarCompactMergerConsequenceResolver } from '../../simulation/transient/stellar-compact-merger-consequence-resolver';
import { StellarCompactMergerEligibilityResolver } from '../../simulation/transient/stellar-compact-merger-eligibility-resolver';
import { materializeStellarTransientGroundTruth } from './stellar-supernova-scientific-integration';

export interface StellarCompactMergerScientificSnapshot {
  readonly lineage: CompactMergerStellarLineage | null;
  readonly events: readonly CompactMergerCanonicalEvent[];
  readonly consequences: readonly CompactMergerStellarConsequence[];
}

export class StellarCompactMergerScientificIntegration {
  private constructor() {}
  static async synchronize(
    repository: CompactMergerCanonicalEventRepository,
    generationKey: UniverseGenerationKey,
    locator: SystemLocator,
  ): Promise<StellarCompactMergerScientificSnapshot> {
    const groundTruth = materializeStellarTransientGroundTruth(generationKey, locator);
    const designation = new Map(groundTruth.components.map(component => [component.componentLabel.name, component.designation] as const));
    const lineage = StellarCompactMergerEligibilityResolver.resolve(
      groundTruth.compactBinary,
      { A: designation.get('A') ?? 'Componente A', B: designation.get('B') ?? 'Componente B' },
    );
    const events = StellarCompactMergerCanonicalEventResolver.resolve(lineage);
    let persisted = await repository.loadForSystem(generationKey, locator);
    if (!sameSet(events, persisted)) {
      await repository.replaceForSystem(generationKey, locator, events);
      persisted = await repository.loadForSystem(generationKey, locator);
    }
    return Object.freeze({ lineage, events: persisted, consequences: StellarCompactMergerConsequenceResolver.resolveEvents(persisted) });
  }
}

function sameSet(expected: readonly CompactMergerCanonicalEvent[], persisted: readonly CompactMergerCanonicalEvent[]): boolean {
  if (expected.length !== persisted.length) return false;
  if (expected.length === 0) return true;
  return signature(expected[0]!) === signature(persisted[0]!);
}
function signature(event: CompactMergerCanonicalEvent): string {
  const p = event.profile; const g = p.progenitor;
  return JSON.stringify({
    key: event.eventKey, stage: event.sourceLineageStage, age: event.currentStellarAgeBillionYears,
    delay: event.mergerDelayYears, mergerAge: event.mergerStellarAgeBillionYears,
    p: { type: p.type, total: p.totalMassSolar, chirp: p.chirpMassSolar, q: p.massRatio, eta: p.symmetricMassRatio,
      counterpart: p.counterpartKind, resolution: p.massBudgetResolution, remnant: p.remnantKind,
      remnantMass: p.remnantMassSolar, ejecta: p.resolvedMatterEjectaMassSolar, radiated: p.resolvedRadiatedMassSolar,
      g: { type: g.type, a: g.primaryMassSolar, b: g.secondaryMassSolar, nsr: g.neutronStarReferenceRadiusKm,
        sma: g.orbitalSemiMajorAxisAu, ecc: g.orbitalEccentricity, inspiral: g.referenceInspiralYears } },
  });
}
