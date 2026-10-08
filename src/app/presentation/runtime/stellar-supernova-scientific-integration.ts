import { GeneratorVersion } from '../../domain/generation/generator-version';
import { type SystemLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { type SupernovaCanonicalEventRepository } from '../../domain/repository/supernova-canonical-event-repository';
import { GalaxySectorKeyCodec } from '../../domain/sector/galaxy-sector-key-codec';
import { StellarSystemComponentLabel } from '../../domain/stellar/stellar-system-component-label';
import { type SupernovaCanonicalEvent } from '../../domain/transient/supernova-canonical-event';
import { type SupernovaStellarLineage } from '../../domain/transient/supernova-stellar-lineage';
import { type SupernovaStellarConsequence } from '../../domain/transient/supernova-stellar-consequence';
import { GalaxySectorGridGenerator } from '../../simulation/sector/galaxy-sector-grid-generator';
import { GalaxySectorStellarDensityGenerator } from '../../simulation/sector/galaxy-sector-stellar-density-generator';
import { GalaxySectorStellarPopulationPropertiesGenerator } from '../../simulation/sector/galaxy-sector-stellar-population-properties-generator';
import { StellarDesignationGenerator } from '../../simulation/stellar/stellar-designation-generator';
import { StellarGenerator } from '../../simulation/stellar/stellar-generator';
import { StellarMultihostFormation } from '../../simulation/stellar/stellar-multihost-formation';
import { multihostPhysicalSourceKey } from '../../simulation/stellar/stellar-multihost-physical-source-key';
import { stellarMultihostPublicComponentDesignation } from '../../simulation/stellar/stellar-multihost-public-designation';
import { StellarPopulationProfileGenerator } from '../../simulation/stellar/stellar-population-profile-generator';
import { StellarSystemGenerator } from '../../simulation/stellar/stellar-system-generator';
import {
  StellarSupernovaCanonicalEventResolver,
} from '../../simulation/transient/stellar-supernova-canonical-event-resolver';
import {
  StellarSupernovaConsequenceResolver,
} from '../../simulation/transient/stellar-supernova-consequence-resolver';
import {
  StellarSupernovaEligibilityResolver,
  type StellarSupernovaGroundTruthComponent,
  type StellarSupernovaInteractionContext,
} from '../../simulation/transient/stellar-supernova-eligibility-resolver';
import { GalaxyGenerator } from '../../simulation/universe/galaxy-generator';

export interface StellarSupernovaScientificSnapshot {
  readonly lineages: readonly SupernovaStellarLineage[];
  readonly events: readonly SupernovaCanonicalEvent[];
  readonly consequences: readonly SupernovaStellarConsequence[];
}

export interface StellarSupernovaMaterializedGroundTruth {
  readonly context: StellarSupernovaInteractionContext;
  readonly components: readonly StellarSupernovaGroundTruthComponent[];
}

/**
 * 29.1E shared scientific read boundary for SystemPage, Archive and catalogue.
 *
 * It resolves the same physical A/B/C sources used by the active generation
 * version, writes the canonical 29.1C event set under the PUBLIC parent system
 * identity, then derives 29.1D consequences from the persisted round-trip.
 * No discovery state, PD or stellar object is mutated here.
 */
export class StellarSupernovaScientificIntegration {
  private constructor() {}

  static async synchronize(
    repository: SupernovaCanonicalEventRepository,
    generationKey: UniverseGenerationKey,
    locator: SystemLocator,
  ): Promise<StellarSupernovaScientificSnapshot> {
    const groundTruth = materializeGroundTruth(generationKey, locator);

    const lineages = StellarSupernovaEligibilityResolver.resolveGroundTruthSystem(
      groundTruth.context,
      groundTruth.components,
    );

    const events = StellarSupernovaCanonicalEventResolver.resolveGroundTruthSystem(
      groundTruth.context,
      groundTruth.components,
    );

    // Read first so opening a fiche/catalogue row is idempotent. 29.1E writes
    // only when the deterministic 29.1C Ground Truth is absent or stale; an
    // already-canonical system does not churn persistence timestamps on read.
    let persistedEvents = await repository.loadForSystem(
      generationKey,
      locator,
    );

    if (!sameCanonicalEventSet(events, persistedEvents)) {
      // Persist under the PUBLIC parent generation key. V2 component generation
      // may use private V1 physical scopes, but those scopes never become IDs.
      await repository.replaceForSystem(
        generationKey,
        locator,
        events,
      );

      persistedEvents = await repository.loadForSystem(
        generationKey,
        locator,
      );
    }

    const consequences = StellarSupernovaConsequenceResolver.resolveEvents(
      persistedEvents,
    );

    return Object.freeze({
      lineages,
      events: persistedEvents,
      consequences,
    });
  }
}

export function materializeStellarTransientGroundTruth(
  generationKey: UniverseGenerationKey,
  locator: SystemLocator,
): StellarSupernovaMaterializedGroundTruth {
  return materializeGroundTruth(generationKey, locator);
}

function materializeGroundTruth(
  generationKey: UniverseGenerationKey,
  locator: SystemLocator,
): StellarSupernovaMaterializedGroundTruth {
  if (generationKey.generatorVersion === GeneratorVersion.V2) {
    return materializeV2GroundTruth(generationKey, locator);
  }

  return materializeLegacyGroundTruth(generationKey, locator);
}

function materializeLegacyGroundTruth(
  generationKey: UniverseGenerationKey,
  locator: SystemLocator,
): StellarSupernovaMaterializedGroundTruth {
  const galaxy = GalaxyGenerator.generate(
    generationKey,
    locator.galaxyIndex,
  );
  const grid = GalaxySectorGridGenerator.generate(galaxy);
  const coordinates = GalaxySectorKeyCodec.decode(locator.sectorKey);
  const density = GalaxySectorStellarDensityGenerator.generate(
    galaxy,
    grid,
    coordinates,
  );
  const sectorPopulation = GalaxySectorStellarPopulationPropertiesGenerator.generate(
    galaxy,
    density,
  );
  const populationProfile = StellarPopulationProfileGenerator.generate(
    generationKey,
    galaxy.physicalProperties,
    sectorPopulation,
  );
  const system = StellarSystemGenerator.generate(
    generationKey,
    locator,
    sectorPopulation,
    populationProfile,
  );
  const primaryPhysical = StellarGenerator.generatePhysicalProperties(
    generationKey,
    locator,
    sectorPopulation,
    populationProfile,
  );
  const primaryLifetime = StellarGenerator.generateLifetimeProfile(
    generationKey,
    locator,
    primaryPhysical,
    sectorPopulation,
    populationProfile,
  );

  const components: StellarSupernovaGroundTruthComponent[] = [
    Object.freeze({
      componentLabel: StellarSystemComponentLabel.A,
      designation: system.primaryComponentDesignation.name,
      physicalProperties: primaryPhysical,
      lifetimeProfile: primaryLifetime,
    }),
  ];

  if (system.secondaryCompanion !== null) {
    components.push(Object.freeze({
      componentLabel: StellarSystemComponentLabel.B,
      designation: system.secondaryCompanion.designation.name,
      physicalProperties: system.secondaryCompanion.physicalProperties,
      lifetimeProfile: system.secondaryCompanion.lifetimeProfile,
    }));
  }

  if (system.tertiaryCompanion !== null) {
    components.push(Object.freeze({
      componentLabel: StellarSystemComponentLabel.C,
      designation: system.tertiaryCompanion.designation.name,
      physicalProperties: system.tertiaryCompanion.physicalProperties,
      lifetimeProfile: system.tertiaryCompanion.lifetimeProfile,
    }));
  }

  return Object.freeze({
    context: Object.freeze({
      generationKey,
      innerPeriastronAu: system.orbitHierarchy.innerOrbit?.periastronAu ?? null,
      outerPeriastronAu: system.orbitHierarchy.outerOrbit?.periastronAu ?? null,
    }),
    components: Object.freeze(components),
  });
}

function materializeV2GroundTruth(
  generationKey: UniverseGenerationKey,
  locator: SystemLocator,
): StellarSupernovaMaterializedGroundTruth {
  const physicalKey = multihostPhysicalSourceKey(generationKey);
  const systemName = StellarDesignationGenerator.generate(
    physicalKey,
    locator,
  ).name;
  const multiple = StellarMultihostFormation.generateOrNull(
    generationKey,
    locator,
  );

  if (multiple !== null) {
    const components = multiple.components.map((host) => Object.freeze({
      componentLabel: componentLabel(host.label),
      designation: stellarMultihostPublicComponentDesignation(
        systemName,
        host.label,
      ),
      physicalProperties: host.physical,
      lifetimeProfile: host.lifetime,
    }));

    return Object.freeze({
      context: Object.freeze({
        generationKey: physicalKey,
        innerPeriastronAu: multiple.innerOrbit.periastronAu,
        outerPeriastronAu: multiple.outerOrbit?.periastronAu ?? null,
      }),
      components: Object.freeze(components),
    });
  }

  const single = StellarMultihostFormation.generateSingleOrNull(
    generationKey,
    locator,
  );

  if (single === null) {
    throw new RangeError('V2 stellar supernova integration could not materialize the real host.');
  }

  return Object.freeze({
    context: Object.freeze({
      generationKey: physicalKey,
      innerPeriastronAu: null,
      outerPeriastronAu: null,
    }),
    components: Object.freeze([
      Object.freeze({
        componentLabel: StellarSystemComponentLabel.A,
        designation: stellarMultihostPublicComponentDesignation(systemName, 'A'),
        physicalProperties: single.physical,
        lifetimeProfile: single.lifetime,
      }),
    ]),
  });
}

function componentLabel(
  label: 'A' | 'B' | 'C',
): typeof StellarSystemComponentLabel.A |
  typeof StellarSystemComponentLabel.B |
  typeof StellarSystemComponentLabel.C {
  switch (label) {
    case 'A':
      return StellarSystemComponentLabel.A;
    case 'B':
      return StellarSystemComponentLabel.B;
    case 'C':
      return StellarSystemComponentLabel.C;
  }
}
function sameCanonicalEventSet(
  expected: readonly SupernovaCanonicalEvent[],
  persisted: readonly SupernovaCanonicalEvent[],
): boolean {
  if (expected.length !== persisted.length) {
    return false;
  }

  const byComponent = new Map(
    persisted.map((event) => [event.componentLabel.code, event] as const),
  );

  return expected.every((event) => {
    const other = byComponent.get(event.componentLabel.code);
    return other !== undefined && canonicalEventSignature(event) === canonicalEventSignature(other);
  });
}

function canonicalEventSignature(event: SupernovaCanonicalEvent): string {
  const profile = event.profile;
  const progenitor = profile.progenitor;

  return JSON.stringify({
    component: event.componentLabel.code,
    stellarDesignation: event.stellarDesignation,
    sourceLineageStage: event.sourceLineageStage,
    temporalStatus: event.temporalStatus,
    currentStellarAgeBillionYears: event.currentStellarAgeBillionYears,
    eventStellarAgeBillionYears: event.eventStellarAgeBillionYears,
    requiresBinaryInteraction: event.requiresBinaryInteraction,
    profile: {
      type: profile.type,
      progenitor: {
        channel: progenitor.channel,
        initialMassSolar: progenitor.initialMassSolar,
        preExplosionMassSolar: progenitor.preExplosionMassSolar,
        metallicitySolarRatio: progenitor.metallicitySolarRatio,
        hydrogenEnvelopeFraction: progenitor.hydrogenEnvelopeFraction,
        heliumEnvelopeFraction: progenitor.heliumEnvelopeFraction,
        whiteDwarfMassSolar: progenitor.whiteDwarfMassSolar,
        compactRemnantHint: progenitor.compactRemnantHint,
      },
      ejectaMassSolar: profile.ejectaMassSolar,
      nickel56MassSolar: profile.nickel56MassSolar,
      explosionEnergyJoules: profile.explosionEnergyJoules,
      characteristicEjectaVelocityKmS: profile.characteristicEjectaVelocityKmS,
      peakBolometricLuminosityWatts: profile.peakBolometricLuminosityWatts,
      peakAbsoluteBolometricMagnitude: profile.peakAbsoluteBolometricMagnitude,
      peakPhotosphericTemperatureKelvin: profile.peakPhotosphericTemperatureKelvin,
      riseTimeDays: profile.riseTimeDays,
      plateauDurationDays: profile.plateauDurationDays,
      earlyRemnantTransitionDays: profile.earlyRemnantTransitionDays,
      transientCompletionDays: profile.transientCompletionDays,
      compactRemnantKind: profile.compactRemnantKind,
      compactRemnantMassSolar: profile.compactRemnantMassSolar,
    },
  });
}
