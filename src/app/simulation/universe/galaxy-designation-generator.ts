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
  GalaxyDesignation,
} from '../../domain/universe/galaxy-designation';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

const SIGNED_LONG_MAX =
  (1n << 63n) -
  1n;

const V1_PREFIXES =
  Object.freeze([
    'Ae',
    'Al',
    'An',
    'Ar',
    'Bel',
    'Cael',
    'Cor',
    'Cy',
    'Da',
    'Del',
    'Eli',
    'Ery',
    'Fa',
    'Gal',
    'Hel',
    'Ily',
    'Ka',
    'Kel',
    'Lyr',
    'Mer',
    'Nae',
    'Ori',
    'Pha',
    'Qua',
    'Rhe',
    'Syl',
    'Tae',
    'Thal',
    'Va',
    'Vel',
    'Xan',
    'Zer',
  ]);

const V1_MIDDLES =
  Object.freeze([
    'la',
    're',
    'ni',
    'va',
    'so',
    'the',
    'ri',
    'mon',
    'ca',
    'len',
    'dra',
    'phi',
    'ser',
    'tal',
    'mir',
    'zen',
    'or',
    'vel',
    'qui',
    'nar',
    'eth',
    'ion',
    'ura',
    'xis',
  ]);

const V1_SUFFIXES =
  Object.freeze([
    'a',
    'ae',
    'ar',
    'as',
    'ea',
    'en',
    'ia',
    'ion',
    'is',
    'or',
    'os',
    'um',
    'us',
    'ara',
    'eria',
    'oria',
    'elis',
    'aris',
    'eron',
    'yria',
    'une',
    'eth',
    'ix',
    'on',
  ]);

/**
 * Procedural generator for galaxy designations.
 *
 * Exact TypeScript port of the Android V1 designation contract.
 *
 * Stateless and deterministic.
 *
 * It does not consume the PRNG stream used by physical galaxy
 * generation.
 */
export class GalaxyDesignationGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    galaxyIndex:
      bigint,
  ): GalaxyDesignation {

    if (
      galaxyIndex <
        0n ||
      galaxyIndex >
        SIGNED_LONG_MAX
    ) {
      throw new RangeError(
        `Galaxy index must be a non-negative signed Long: ${galaxyIndex}.`,
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
  ): GalaxyDesignation {

    const galaxySeed =
      ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          new GalaxyLocator(
            galaxyIndex,
          ),
        ) as GalaxySeed;

    const seedHex =
      galaxySeed.normalizedValue;

    const blockA =
      seedHex.substring(
        0,
        8,
      );

    const blockB =
      seedHex.substring(
        8,
        16,
      );

    const blockC =
      seedHex.substring(
        16,
        24,
      );

    const blockAValue =
      BigInt(
        `0x${blockA}`,
      );

    const blockBValue =
      BigInt(
        `0x${blockB}`,
      );

    const blockCValue =
      BigInt(
        `0x${blockC}`,
      );

    const prefixIndex =
      Number(
        blockAValue %
          BigInt(
            V1_PREFIXES.length,
          ),
      );

    const middleIndex =
      Number(
        blockBValue %
          BigInt(
            V1_MIDDLES.length,
          ),
      );

    const suffixIndex =
      Number(
        blockCValue %
          BigInt(
            V1_SUFFIXES.length,
          ),
      );

    const name =
      V1_PREFIXES[
        prefixIndex
      ]! +
      V1_MIDDLES[
        middleIndex
      ]! +
      V1_SUFFIXES[
        suffixIndex
      ]!;

    const proceduralCode =
      `GEN-V${generationKey.generatorVersion.code}` +
      `-G${galaxyIndex}` +
      `-${seedHex}`;

    return new GalaxyDesignation(
      name,
      proceduralCode,
    );
  }
}