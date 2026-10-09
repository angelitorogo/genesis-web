import { type SystemLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { type KilonovaCanonicalEventRepository } from '../../domain/repository/kilonova-canonical-event-repository';
import { type KilonovaCanonicalEvent } from '../../domain/transient/kilonova-canonical-event';
import { type KilonovaStellarLineage } from '../../domain/transient/kilonova-stellar-lineage';
import { type KilonovaStellarConsequence } from '../../domain/transient/kilonova-stellar-consequence';
import { StellarKilonovaCanonicalEventResolver } from '../../simulation/transient/stellar-kilonova-canonical-event-resolver';
import { StellarKilonovaConsequenceResolver } from '../../simulation/transient/stellar-kilonova-consequence-resolver';
import { StellarKilonovaEligibilityResolver } from '../../simulation/transient/stellar-kilonova-eligibility-resolver';
import { materializeStellarTransientGroundTruth } from './stellar-supernova-scientific-integration';

export interface StellarKilonovaScientificSnapshot {
  readonly lineage: KilonovaStellarLineage | null;
  readonly events: readonly KilonovaCanonicalEvent[];
  readonly consequences: readonly KilonovaStellarConsequence[];
}

/** 29.3 shared read/persistence boundary. Only the existing inner A-B compact pair is considered. */
export class StellarKilonovaScientificIntegration {
  private constructor() {}

  static async synchronize(
    repository: KilonovaCanonicalEventRepository,
    generationKey: UniverseGenerationKey,
    locator: SystemLocator,
  ): Promise<StellarKilonovaScientificSnapshot> {
    const groundTruth = materializeStellarTransientGroundTruth(generationKey, locator);
    const designation = new Map(groundTruth.components.map(component => [component.componentLabel.name, component.designation] as const));
    const lineage = StellarKilonovaEligibilityResolver.resolve(
      groundTruth.compactBinary,
      { A: designation.get('A') ?? 'Componente A', B: designation.get('B') ?? 'Componente B' },
    );
    const events = StellarKilonovaCanonicalEventResolver.resolve(lineage);
    let persisted = await repository.loadForSystem(generationKey, locator);
    if (!sameSet(events, persisted)) {
      await repository.replaceForSystem(generationKey, locator, events);
      persisted = await repository.loadForSystem(generationKey, locator);
    }
    return Object.freeze({ lineage, events: persisted,
      consequences: StellarKilonovaConsequenceResolver.resolveEvents(persisted) });
  }
}

function sameSet(expected: readonly KilonovaCanonicalEvent[], persisted: readonly KilonovaCanonicalEvent[]): boolean {
  if (expected.length !== persisted.length) return false;
  if (expected.length === 0) return true;
  return signature(expected[0]!) === signature(persisted[0]!);
}
function signature(event: KilonovaCanonicalEvent): string {
  const p = event.profile; const g = p.progenitor;
  return JSON.stringify({
    key: event.eventKey, stage: event.sourceLineageStage, age: event.currentStellarAgeBillionYears,
    delay: event.mergerDelayYears, mergerAge: event.mergerStellarAgeBillionYears,
    p: { type: p.type, total: p.totalEjectaMassSolar, blue: p.blueEjectaMassSolar, red: p.redEjectaMassSolar,
      r: p.rProcessMassSolar, bv: p.characteristicBlueVelocityFractionC, rv: p.characteristicRedVelocityFractionC,
      e: p.kineticEnergyJoules, bt: p.bluePeakTimeDays, rt: p.redPeakTimeDays,
      bl: p.bluePeakLuminosityWatts, rl: p.redPeakLuminosityWatts, remnant: p.remnantKind, rm: p.remnantMassSolar,
      g: { type: g.type, a: g.primaryMassSolar, b: g.secondaryMassSolar, nsr: g.neutronStarRadiusKm,
        sma: g.orbitalSemiMajorAxisAu, ecc: g.orbitalEccentricity, inspiral: g.referenceInspiralYears,
        spin: g.blackHoleSpinDimensionless, disruption: g.tidalDisruptionRatio } },
  });
}
