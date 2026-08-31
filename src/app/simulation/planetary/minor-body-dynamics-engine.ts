import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type AsteroidBeltSystem,
} from '../../domain/planetary/asteroid-belt-system';

import {
  type Atmosphere,
} from '../../domain/planetary/atmosphere';

import {
  type CapturedExtrasolarObjectSystem,
} from '../../domain/planetary/captured-extrasolar-object-system';

import {
  type CometSystem,
} from '../../domain/planetary/comet-system';

import {
  type EarlyPlanetaryDynamicsOutcome,
} from '../../domain/planetary/early-planetary-dynamics-outcome';

import {
  type FormationCollisionMoonOriginCatalog,
} from '../../domain/planetary/formation-collision-moon-origin-catalog';

import {
  type InterstellarObjectSystem,
} from '../../domain/planetary/interstellar-object-system';

import {
  MinorBodyDynamicsState,
} from '../../domain/planetary/minor-body-dynamics-state';

import {
  type MinorBodyOrbitalElementsCatalog,
} from '../../domain/planetary/minor-body-orbital-elements-catalog';

import {
  type MinorBodyOrbitProximityCatalog,
} from '../../domain/planetary/minor-body-orbit-proximity-catalog';

import {
  type MinorBodyResonanceCatalog,
} from '../../domain/planetary/minor-body-resonance-catalog';

import {
  type MinorBodyGiantInfluenceCatalog,
} from '../../domain/planetary/minor-body-giant-influence-catalog';

import {
  type MinorBodyCloseEncounterCatalog,
} from '../../domain/planetary/minor-body-close-encounter-catalog';

import {
  type MinorBodyImpactRiskCatalog,
} from '../../domain/planetary/minor-body-impact-risk-catalog';

import {
  type MinorBodyTemporalImpactProbabilityCatalog,
} from '../../domain/planetary/minor-body-temporal-impact-probability-catalog';

import {
  type MinorBodyImpactEnergyCatalog,
} from '../../domain/planetary/minor-body-impact-energy-catalog';

import {
  type MinorBodyImpactEffectsCatalog,
} from '../../domain/planetary/minor-body-impact-effects-catalog';

import {
  type MinorBodyEarlyDeliveryCatalog,
} from '../../domain/planetary/minor-body-early-delivery-catalog';

import {
  type PlanetaryImpactHistoryCatalog,
} from '../../domain/planetary/planetary-impact-history-catalog';

import {
  type MoonSystem,
} from '../../domain/planetary/moon-system';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  type TransNeptunianObjectSystem,
} from '../../domain/planetary/trans-neptunian-object-system';

import {
  MinorBodyOrbitalElementsEngine,
} from './minor-body-orbital-elements-engine';

import {
  MinorBodyOrbitProximityEngine,
} from './minor-body-orbit-proximity-engine';

import {
  MinorBodyResonanceEngine,
} from './minor-body-resonance-engine';

import {
  MinorBodyGiantInfluenceEngine,
} from './minor-body-giant-influence-engine';

import {
  MinorBodyCloseEncounterEngine,
} from './minor-body-close-encounter-engine';

import {
  ImpactRiskEngine,
} from './impact-risk-engine';

import {
  TemporalImpactProbabilityEngine,
} from './temporal-impact-probability-engine';

import {
  ImpactEnergyClassificationEngine,
} from './impact-energy-classification-engine';

import {
  ImpactEffectsEngine,
} from './impact-effects-engine';

import {
  EarlyWaterOrganicDeliveryEngine,
} from './early-water-organic-delivery-engine';

import {
  FormationCollisionMoonOriginEngine,
} from './formation-collision-moon-origin-engine';

import {
  HistoricalImpactRealizationEngine,
} from './historical-impact-realization-engine';

/**
 * Point-23.1 coordinator for phase-23 minor-body dynamics.
 *
 * V1 initializes the dynamics boundary from the complete phase-22 Ground Truth
 * population. It intentionally consumes no discovery/catalogue state.
 * Point 23.2 exposes a normalized orbital-elements catalog without changing
 * the point-23.1 boundary or any phase-22 orbit. Point 23.3 adds a pure
 * geometry matrix against materialized planets/relevant moons. Point 23.4 now
 * adds low-order resonance candidates and simplified local chaotic zones. Point
 * 23.5 classifies giant-planet perturbation/capture/ejection potentials. Point
 * 23.6 resolves close-encounter temporal opportunities and materializes one
 * unambiguous post-encounter orbital transition per minor body. Point 23.7 now
 * projects geometry-only planet/moon impact risk from those outgoing orbits;
 * point 23.8 converts that orbital risk into an explicit finite-horizon temporal
 * probability. Point 23.9 classifies the conditional impact energy and broad
 * consequence potential. Point 23.10 now projects target-specific atmosphere,
 * hydrosphere, geology, ejecta and solid-surface response without mutating the
 * target or materializing a historical event. Point 23.11 projects retained
 * water-equivalent and organic-carrier payloads from the frozen impact chain;
 * it remains statistical/conditional and does not rewrite target inventories.
 * Point 23.12 independently reconnects frozen point-17.5 formation collisions to
 * mature point-19 planets and point-21 moons, classifying only possible
 * moon-forming origins and preserving the exact collision lineage. Point 23.13
 * finally realizes a retrospective minor-body impact history using competing
 * risks, and joins those events with the already-realized formation collisions
 * in one physically traceable impact-history catalog.
 *
 * Point 23.1 introduces zero procedural seeds/hashes/PRNG draws. Point 23.6
 * adds one domain-separated SHA-256 temporal sample per approach candidate, but
 * still derives zero hierarchical seeds and consumes zero PRNG draws. Point
 * 23.7 is pure post-transition geometry and adds no seeds/hashes/PRNG draws.
 * Points 23.8-23.12 are pure analytical projections: zero seeds, hashes and PRNG draws.
 * Point 23.13 introduces no seed level and consumes zero PRNG draws; it uses one
 * domain-separated SHA-256 realization digest per temporally possible minor body,
 * one event-id digest per realized impact, and the existing BodySeed -> HistorySeed
 * hierarchy for the impacted planet's history.
 */
export class MinorBodyDynamicsEngine {

  private constructor() {}

  /** Point-23.13 physically traceable realized impact-history projection. */
  static impactHistory(
    planetarySystem:
      PlanetarySystem,

    earlyDeliveryCatalog:
      MinorBodyEarlyDeliveryCatalog,

    formationCollisionMoonOriginCatalog:
      FormationCollisionMoonOriginCatalog,
  ): PlanetaryImpactHistoryCatalog {
    return HistoricalImpactRealizationEngine
      .generate(
        planetarySystem,
        earlyDeliveryCatalog,
        formationCollisionMoonOriginCatalog,
      );
  }

  /** Point-23.12 giant formation-collision / possible moon-origin projection. */
  static formationCollisionMoonOrigins(
    planetarySystem:
      PlanetarySystem,

    earlyDynamicsOutcome:
      EarlyPlanetaryDynamicsOutcome,

    planets:
      readonly Planet[],

    moonSystems:
      readonly MoonSystem[],
  ): FormationCollisionMoonOriginCatalog {
    return FormationCollisionMoonOriginEngine
      .generate(
        planetarySystem,
        earlyDynamicsOutcome,
        planets,
        moonSystems,
      );
  }

  /** Point-23.11 conditional/statistical early water and organic-carrier delivery projection. */
  static earlyWaterOrganicDelivery(
    impactEffectsCatalog:
      MinorBodyImpactEffectsCatalog,
  ): MinorBodyEarlyDeliveryCatalog {
    return EarlyWaterOrganicDeliveryEngine
      .generate(
        impactEffectsCatalog,
      );
  }

  /** Point-23.10 conditional planet/moon target-effects projection. */
  static impactEffects(
    impactEnergyCatalog:
      MinorBodyImpactEnergyCatalog,

    atmospheres:
      readonly Atmosphere[],
  ): MinorBodyImpactEffectsCatalog {
    return ImpactEffectsEngine
      .generate(
        impactEnergyCatalog,
        atmospheres,
      );
  }

  /** Point-23.9 conditional impact-energy/consequence classification. */
  static impactEnergies(
    temporalImpactProbabilityCatalog:
      MinorBodyTemporalImpactProbabilityCatalog,
  ): MinorBodyImpactEnergyCatalog {
    return ImpactEnergyClassificationEngine
      .generate(
        temporalImpactProbabilityCatalog,
      );
  }

  /** Point-23.8 finite-horizon temporal impact-probability projection. */
  static temporalImpactProbabilities(
    impactRiskCatalog:
      MinorBodyImpactRiskCatalog,

    timeWindowYears:
      number,
  ): MinorBodyTemporalImpactProbabilityCatalog {
    return TemporalImpactProbabilityEngine
      .generate(
        impactRiskCatalog,
        timeWindowYears,
      );
  }

  /** Point-23.7 post-encounter geometry-only impact-risk projection. */
  static impactRisks(
    closeEncounterCatalog:
      MinorBodyCloseEncounterCatalog,
  ): MinorBodyImpactRiskCatalog {
    return ImpactRiskEngine
      .generate(
        closeEncounterCatalog,
      );
  }

  /** Point-23.6 close-encounter resolution and post-encounter orbit transitions. */
  static closeEncounters(
    giantInfluenceCatalog:
      MinorBodyGiantInfluenceCatalog,
  ): MinorBodyCloseEncounterCatalog {
    return MinorBodyCloseEncounterEngine
      .generate(
        giantInfluenceCatalog,
      );
  }

  /** Point-23.5 giant-planet perturbation/capture/ejection potential projection. */
  static giantInfluences(
    resonanceCatalog:
      MinorBodyResonanceCatalog,
  ): MinorBodyGiantInfluenceCatalog {
    return MinorBodyGiantInfluenceEngine
      .generate(
        resonanceCatalog,
      );
  }

  /** Point-23.4 low-order resonance / simplified local-instability projection. */
  static resonances(
    orbitalCatalog:
      MinorBodyOrbitalElementsCatalog,

    proximityCatalog:
      MinorBodyOrbitProximityCatalog,
  ): MinorBodyResonanceCatalog {
    return MinorBodyResonanceEngine
      .generate(
        orbitalCatalog,
        proximityCatalog,
      );
  }

  /**
   * Point-23.3 geometry-only crossing/approach projection. Callers pass the
   * already-materialized point-19 Planets and point-21 MoonSystems so this
   * stage never re-generates target bodies or replaces their identities.
   */
  static proximities(
    orbitalCatalog:
      MinorBodyOrbitalElementsCatalog,

    planets:
      readonly Planet[],

    moonSystems:
      readonly MoonSystem[],
  ): MinorBodyOrbitProximityCatalog {
    return MinorBodyOrbitProximityEngine
      .generate(
        orbitalCatalog,
        planets,
        moonSystems,
      );
  }

  /**
   * Point-23.2 common orbital projection. Kept on the phase coordinator so
   * later dynamics stages can evolve from one stable public entry point.
   */
  static orbitalElements(
    dynamicsState:
      MinorBodyDynamicsState,
  ): MinorBodyOrbitalElementsCatalog {
    return MinorBodyOrbitalElementsEngine
      .generate(
        dynamicsState,
      );
  }

  static initialize(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    asteroidBeltSystem:
      AsteroidBeltSystem,

    cometSystem:
      CometSystem,

    transNeptunianObjectSystem:
      TransNeptunianObjectSystem,

    interstellarObjectSystem:
      InterstellarObjectSystem,

    capturedExtrasolarObjectSystem:
      CapturedExtrasolarObjectSystem,
  ): MinorBodyDynamicsState {
    if (
      generationKey
        .generatorVersion !==
      GeneratorVersion.V1
    ) {
      throw new RangeError(
        `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
      );
    }

    if (
      !generationKey.equals(
        planetarySystem
          .generationKey,
      )
    ) {
      throw new RangeError(
        'MinorBodyDynamicsEngine requires the host PlanetarySystem to share the supplied UniverseGenerationKey.',
      );
    }

    return new MinorBodyDynamicsState(
      planetarySystem,
      asteroidBeltSystem,
      cometSystem,
      transNeptunianObjectSystem,
      interstellarObjectSystem,
      capturedExtrasolarObjectSystem,
    );
  }
}
