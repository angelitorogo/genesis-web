import {
  GalaxyLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type GalaxySeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  Galaxy,
} from '../../domain/universe/galaxy';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  Sfc64Random,
} from '../random/sfc64-random';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  GalaxyDesignationGenerator,
} from './galaxy-designation-generator';

import {
  GalaxyMorphologyGenerator,
  V1GalaxyDraws,
} from './galaxy-morphology-generator';

/**
 * Stateless procedural generator for any galaxy addressed by index.
 *
 * Galaxies are generated lazily and independently. No global galaxy list,
 * mutable cache or persisted Ground Truth is required.
 *
 * V1 preserves the exact Android physical-generation contract:
 *
 * - exact GalaxySeed derivation;
 * - exact SFC64 stream;
 * - exactly sixteen ordered random draws;
 * - pure morphology/physical interpretation delegated to GalaxyMorphologyGenerator;
 * - independent procedural designation.
 */
export class GalaxyGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    galaxyIndex:
      bigint,
  ): Galaxy {

    if (
      galaxyIndex <
      0n
    ) {
      throw new RangeError(
        'galaxyIndex must be non-negative.',
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
  ): Galaxy {

    const galaxySeed =
      ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          new GalaxyLocator(
            galaxyIndex,
          ),
        ) as GalaxySeed;

    const random =
      new Sfc64Random(
        universeSeedFromNormalized128(
          galaxySeed.normalizedValue,
        ),
      );

    /*
     * IMPORTANT:
     *
     * The order of these sixteen draws is part of the frozen
     * GeneratorVersion.V1 deterministic contract.
     */
    const draws =
      new V1GalaxyDraws(
        random.nextDouble(), // type
        random.nextDouble(), // age
        random.nextDouble(), // diameter
        random.nextDouble(), // mass
        random.nextDouble(), // stars
        random.nextDouble(), // metallicity
        random.nextDouble(), // starFormation
        random.nextDouble(), // centralConcentration
        random.nextDouble(), // flattening
        random.nextDouble(), // asymmetry
        random.nextDouble(), // barStrength
        random.nextDouble(), // spiralArms
        random.nextDouble(), // nucleusPresence
        random.nextDouble(), // blackHolePresence
        random.nextDouble(), // blackHoleMass
        random.nextDouble(), // nucleusState
      );

    const morphology =
      GalaxyMorphologyGenerator
        .generateV1(
          draws,
        );

    const designation =
      GalaxyDesignationGenerator
        .generate(
          generationKey,
          galaxyIndex,
        );

    return new Galaxy(
      generationKey,
      galaxyIndex,
      galaxySeed,
      designation,
      morphology.type,
      morphology.physicalProperties,
      morphology.nucleus,
    );
  }
}

function universeSeedFromNormalized128(
  normalized:
    string,
): UniverseSeed {

  if (
    !/^[0-9A-F]{32}$/.test(
      normalized,
    )
  ) {
    throw new RangeError(
      `Expected normalized 128-bit hexadecimal seed: ${normalized}.`,
    );
  }

  const canonical =
    normalized
      .match(
        /.{4}/g,
      )
      ?.join(
        '-',
      );

  if (
    canonical ===
    undefined
  ) {
    throw new RangeError(
      `Cannot format normalized 128-bit seed: ${normalized}.`,
    );
  }

  return UniverseSeed.parse(
    canonical,
  );
}
