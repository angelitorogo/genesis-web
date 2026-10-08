import { type SystemLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { type NovaCanonicalEventRepository } from '../../domain/repository/nova-canonical-event-repository';
import { type NovaCanonicalEvent } from '../../domain/transient/nova-canonical-event';
import { type NovaStellarLineage } from '../../domain/transient/nova-stellar-lineage';
import { type NovaStellarConsequence } from '../../domain/transient/nova-stellar-consequence';
import { StellarNovaCanonicalEventResolver } from '../../simulation/transient/stellar-nova-canonical-event-resolver';
import { StellarNovaConsequenceResolver } from '../../simulation/transient/stellar-nova-consequence-resolver';
import { StellarNovaEligibilityResolver } from '../../simulation/transient/stellar-nova-eligibility-resolver';
import { materializeStellarTransientGroundTruth } from './stellar-supernova-scientific-integration';

export interface StellarNovaScientificSnapshot {
  readonly lineages: readonly NovaStellarLineage[];
  readonly events: readonly NovaCanonicalEvent[];
  readonly consequences: readonly NovaStellarConsequence[];
}

/** 29.2 shared read/persistence boundary; no discovery state or stellar Ground Truth is mutated. */
export class StellarNovaScientificIntegration {
  private constructor() {}

  static async synchronize(
    repository: NovaCanonicalEventRepository,
    generationKey: UniverseGenerationKey,
    locator: SystemLocator,
  ): Promise<StellarNovaScientificSnapshot> {
    const groundTruth = materializeStellarTransientGroundTruth(generationKey, locator);
    const lineages = StellarNovaEligibilityResolver.resolveGroundTruthSystem(
      groundTruth.context,
      groundTruth.components,
    );
    const events = StellarNovaCanonicalEventResolver.resolveGroundTruthSystem(
      groundTruth.context,
      groundTruth.components,
    );

    let persistedEvents = await repository.loadForSystem(generationKey, locator);
    if (!sameCanonicalEventSet(events, persistedEvents)) {
      await repository.replaceForSystem(generationKey, locator, events);
      persistedEvents = await repository.loadForSystem(generationKey, locator);
    }

    return Object.freeze({
      lineages,
      events: persistedEvents,
      consequences: StellarNovaConsequenceResolver.resolveEvents(persistedEvents),
    });
  }
}

function sameCanonicalEventSet(
  expected: readonly NovaCanonicalEvent[],
  persisted: readonly NovaCanonicalEvent[],
): boolean {
  if (expected.length !== persisted.length) return false;
  const map = new Map(persisted.map(event => [event.componentLabel.code, signature(event)] as const));
  return expected.every(event => map.get(event.componentLabel.code) === signature(event));
}

function signature(event: NovaCanonicalEvent): string {
  const p = event.profile;
  return JSON.stringify({
    component: event.componentLabel.code,
    donor: event.donorComponentLabel.code,
    designation: event.stellarDesignation,
    stage: event.sourceLineageStage,
    currentAge: event.currentStellarAgeBillionYears,
    recurrence: event.recurrenceIntervalYears,
    previous: event.previousEruptionStellarAgeBillionYears,
    next: event.nextEruptionStellarAgeBillionYears,
    profile: {
      type: p.type,
      wdMass: p.progenitor.whiteDwarfMassSolar,
      donorMass: p.progenitor.donorMassSolar,
      metallicity: p.progenitor.metallicitySolarRatio,
      periastron: p.progenitor.orbitalPeriastronAu,
      accretion: p.progenitor.effectiveAccretionRateSolarPerYear,
      ignition: p.progenitor.ignitionEnvelopeMassSolar,
      composition: p.progenitor.whiteDwarfComposition,
      ejecta: p.ejectaMassSolar,
      retained: p.retainedEnvelopeMassSolar,
      energy: p.kineticEnergyJoules,
      velocity: p.characteristicEjectaVelocityKmS,
      peak: p.peakBolometricLuminosityWatts,
      rise: p.riseTimeDays,
      t2: p.declineTwoMagnitudeDays,
      nebular: p.nebularTransitionDays,
      quiet: p.returnToQuiescenceDays,
    },
  });
}
