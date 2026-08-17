import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../../domain/discovery/discovery-state';

import {
  GeneratorVersion,
} from '../../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';

import {
  GalacticNucleusState,
} from '../../../domain/universe/galactic-nucleus-state';

import {
  GalaxyType,
} from '../../../domain/universe/galaxy-type';
import {
  GalaxyGenerator,
} from '../../universe/galaxy-generator';



import {
  ExternalGalaxyMorphologyHint,
  ExternalGalaxyNuclearActivityHint,
  ExternalGalaxyPreliminaryInformation,
  ExternalGalaxyScaleHint,
  ExternalGalaxyStellarPopulationHint,
} from '../../../domain/observation/galaxy/external-galaxy-preliminary-information';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

/**
 * Pure deterministic observation-layer projector for preliminary information
 * about an already detected external galaxy.
 *
 * Observation consumes the deterministic Ground Truth produced by
 * GalaxyGenerator and exposes only the limited knowledge allowed by point 7.6.
 *
 * It performs:
 *
 * - 0 direct PRNG draws;
 * - 0 direct seed derivations;
 * - 0 direct SHA-256 operations;
 * - 0 search attempts;
 * - 0 pity updates;
 * - 0 DiscoveryState mutations;
 * - 0 persistence;
 * - 0 navigation unlocks.
 *
 * Transitively GalaxyGenerator preserves its frozen V1 sixteen-draw contract.
 */
export class ExternalGalaxyPreliminaryInformationGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    galaxyIndex:
      bigint,

    knowledgeState:
      DiscoveryStateValue,
  ): ExternalGalaxyPreliminaryInformation {

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

    const canonicalKnowledgeState =
      DiscoveryState
        .fromCode(
          knowledgeState.code,
        );

    if (
      canonicalKnowledgeState.code <
      DiscoveryState.DETECTED.code
    ) {
      throw new RangeError(
        'knowledgeState must be >= DETECTED.',
      );
    }

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateV1(
        generationKey,
        galaxyIndex,
        canonicalKnowledgeState,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static generateV1(
    generationKey:
      UniverseGenerationKey,

    galaxyIndex:
      bigint,

    knowledgeState:
      DiscoveryStateValue,
  ): ExternalGalaxyPreliminaryInformation {

    const galaxy =
      GalaxyGenerator
        .generate(
          generationKey,
          galaxyIndex,
        );

    return new ExternalGalaxyPreliminaryInformation(
      galaxyIndex,
      galaxy
        .designation
        .proceduralCode,
      knowledgeState,
      morphologyHintV1(
        galaxy.type,
      ),
      scaleHintV1(
        galaxy
          .physicalProperties
          .diameterLightYears,
      ),
      stellarPopulationHintV1(
        galaxy
          .physicalProperties
          .stellarPopulation,
      ),
      nuclearActivityHintV1(
        galaxy
          .nucleus
          ?.state ??
          null,
      ),
    );
  }
}

function morphologyHintV1(
  type:
    GalaxyType,
): ExternalGalaxyMorphologyHint {

  if (
    type ===
      GalaxyType.BARRED_SPIRAL ||
    type ===
      GalaxyType.SPIRAL
  ) {
    return ExternalGalaxyMorphologyHint
      .DISK_LIKE;
  }

  if (
    type ===
    GalaxyType.ELLIPTICAL
  ) {
    return ExternalGalaxyMorphologyHint
      .SPHEROIDAL;
  }

  if (
    type ===
    GalaxyType.IRREGULAR
  ) {
    return ExternalGalaxyMorphologyHint
      .IRREGULAR;
  }

  if (
    type ===
    GalaxyType.DWARF
  ) {
    return ExternalGalaxyMorphologyHint
      .DWARF_LIKE;
  }

  throw new RangeError(
    'Unsupported GalaxyType.',
  );
}

function scaleHintV1(
  diameterLightYears:
    number,
): ExternalGalaxyScaleHint {

  if (
    diameterLightYears <
    30_000.0
  ) {
    return ExternalGalaxyScaleHint
      .COMPACT;
  }

  if (
    diameterLightYears <
    100_000.0
  ) {
    return ExternalGalaxyScaleHint
      .MEDIUM;
  }

  if (
    diameterLightYears <
    180_000.0
  ) {
    return ExternalGalaxyScaleHint
      .LARGE;
  }

  return ExternalGalaxyScaleHint
    .EXTENDED;
}

function stellarPopulationHintV1(
  stellarPopulation:
    bigint,
): ExternalGalaxyStellarPopulationHint {

  if (
    stellarPopulation <
    1_000_000_000n
  ) {
    return ExternalGalaxyStellarPopulationHint
      .LOW;
  }

  if (
    stellarPopulation <
    50_000_000_000n
  ) {
    return ExternalGalaxyStellarPopulationHint
      .MODERATE;
  }

  if (
    stellarPopulation <
    300_000_000_000n
  ) {
    return ExternalGalaxyStellarPopulationHint
      .HIGH;
  }

  return ExternalGalaxyStellarPopulationHint
    .VERY_HIGH;
}

function nuclearActivityHintV1(
  nucleusState:
    GalacticNucleusState | null,
): ExternalGalaxyNuclearActivityHint {

  if (
    nucleusState ===
      null ||
    nucleusState ===
      GalacticNucleusState.QUIESCENT
  ) {
    return ExternalGalaxyNuclearActivityHint
      .NO_CLEAR_ACTIVITY;
  }

  if (
    nucleusState ===
    GalacticNucleusState.AGN
  ) {
    return ExternalGalaxyNuclearActivityHint
      .ACTIVE_NUCLEUS_CANDIDATE;
  }

  if (
    nucleusState ===
    GalacticNucleusState.QUASAR
  ) {
    return ExternalGalaxyNuclearActivityHint
      .EXTREME_NUCLEUS_CANDIDATE;
  }

  throw new RangeError(
    'Unsupported GalacticNucleusState.',
  );
}
