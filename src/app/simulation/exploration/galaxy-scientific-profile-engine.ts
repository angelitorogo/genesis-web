import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  type GalaxyScientificNucleus,
  type GalaxyScientificNucleusStateName,
  type GalaxyScientificPhysicalProperties,
  type GalaxyScientificProfile,
  type GalaxyScientificStructure,
} from '../../domain/exploration/galaxy-scientific-profile';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

const SIGNED_LONG_MAX =
  (1n << 63n) -
  1n;

/**
 * Point-26.1 scientific-card projector.
 *
 * The persisted DiscoveryState is authoritative for disclosure. Directly
 * opening /galaxies/:galaxyIndex never upgrades knowledge and never turns the
 * deterministic generator into a hidden-data API.
 *
 * CATALOGUED exposes the already-frozen baseline GalaxyPhysicalProperties.
 * CONFIRMED additionally exposes GalaxyStructure and exact nucleus/SMBH facts.
 * No new seed, PRNG draw, persistence mutation or physical calculation exists
 * in this projector.
 */
export class GalaxyScientificProfileEngine {

  private constructor() {}

  static build(
    generationKey:
      UniverseGenerationKey,

    galaxyIndex:
      bigint,

    knowledgeState:
      DiscoveryStateValue,
  ): GalaxyScientificProfile {

    if (
      galaxyIndex <
        0n ||
      galaxyIndex >
        SIGNED_LONG_MAX
    ) {
      throw new RangeError(
        `galaxyIndex must be a non-negative signed Long: ${galaxyIndex}.`,
      );
    }

    const canonicalState =
      DiscoveryState
        .fromCode(
          knowledgeState.code,
        );

    if (
      !DiscoveryState.isKnown(
        canonicalState,
      )
    ) {
      throw new RangeError(
        'GalaxyScientificProfile requires a known DiscoveryState.',
      );
    }

    if (
      canonicalState.code <
      DiscoveryState
        .CATALOGUED
        .code
    ) {
      return freezeProfile(
        canonicalState,
        null,
        null,
        null,
      );
    }

    const galaxy =
      GalaxyGenerator
        .generate(
          generationKey,
          galaxyIndex,
        );

    const physical =
      Object.freeze<GalaxyScientificPhysicalProperties>({
        ageBillionYears:
          galaxy
            .physicalProperties
            .ageBillionYears,

        diameterLightYears:
          galaxy
            .physicalProperties
            .diameterLightYears,

        totalMassSolarMasses:
          galaxy
            .physicalProperties
            .totalMassSolarMasses,

        stellarPopulation:
          galaxy
            .physicalProperties
            .stellarPopulation,

        metallicitySolarRatio:
          galaxy
            .physicalProperties
            .metallicitySolarRatio,

        starFormationRateSolarMassesPerYear:
          galaxy
            .physicalProperties
            .starFormationRateSolarMassesPerYear,
      });

    if (
      canonicalState.code <
      DiscoveryState
        .CONFIRMED
        .code
    ) {
      return freezeProfile(
        canonicalState,
        physical,
        null,
        null,
      );
    }

    const sourceStructure =
      galaxy
        .physicalProperties
        .structure;

    const structure =
      Object.freeze<GalaxyScientificStructure>({
        centralConcentration:
          sourceStructure
            .centralConcentration,

        flattening:
          sourceStructure
            .flattening,

        asymmetry:
          sourceStructure
            .asymmetry,

        barStrength:
          sourceStructure
            .barStrength,

        spiralArmCount:
          sourceStructure
            .spiralArmCount,
      });

    const nucleus =
      confirmedNucleus(
        galaxy.nucleus,
      );

    return freezeProfile(
      canonicalState,
      physical,
      structure,
      nucleus,
    );
  }
}

function confirmedNucleus(
  nucleus:
    ReturnType<typeof GalaxyGenerator.generate>['nucleus'],
): GalaxyScientificNucleus {

  if (
    nucleus ===
      null
  ) {
    return Object.freeze({
      present:
        false,
      stateName:
        null,
      supermassiveBlackHoleMassSolarMasses:
        null,
    });
  }

  return Object.freeze({
    present:
      true,

    stateName:
      canonicalNucleusStateName(
        nucleus
          .state
          .name,
      ),

    supermassiveBlackHoleMassSolarMasses:
      nucleus
        .supermassiveBlackHole
        ?.massSolarMasses ??
      null,
  });
}

function canonicalNucleusStateName(
  name:
    string,
): GalaxyScientificNucleusStateName {

  if (
    name ===
      'QUIESCENT' ||
    name ===
      'AGN' ||
    name ===
      'QUASAR'
  ) {
    return name;
  }

  throw new RangeError(
    `Unsupported GalacticNucleusState: ${name}.`,
  );
}

function freezeProfile(
  knowledgeState:
    DiscoveryStateValue,

  physicalProperties:
    GalaxyScientificPhysicalProperties | null,

  structure:
    GalaxyScientificStructure | null,

  nucleus:
    GalaxyScientificNucleus | null,
): GalaxyScientificProfile {

  return Object.freeze({
    knowledgeState,
    physicalProperties,
    structure,
    nucleus,
  });
}
