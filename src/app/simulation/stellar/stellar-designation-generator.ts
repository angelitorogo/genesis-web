import {
  type SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  StellarDesignation,
} from '../../domain/stellar/stellar-designation';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

const V1_ONSETS =
  Object.freeze([
    'A',
    'B',
    'C',
    'D',
    'F',
    'G',
    'H',
    'J',
    'K',
    'L',
    'M',
    'N',
    'P',
    'R',
    'S',
    'T',
    'V',
    'W',
    'X',
    'Y',
    'Z',
    'Th',
    'Sh',
    'Ch',
    'Ph',
    'Kr',
    'Vr',
    'Qu',
    'St',
    'Tr',
    'Dr',
    'Gl',
  ]);

const V1_VOWELS =
  Object.freeze([
    'a',
    'e',
    'i',
    'o',
    'u',
    'ae',
    'ia',
    'io',
  ]);

const V1_MEDIALS =
  Object.freeze([
    'l',
    'r',
    'n',
    'm',
    's',
    't',
    'v',
    'd',
    'k',
    'th',
    'ph',
    'ri',
    'la',
    'na',
    'ra',
    'vi',
  ]);

const V1_ENDINGS =
  Object.freeze([
    'a',
    'ae',
    'ar',
    'as',
    'en',
    'er',
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
  ]);

/**
 * Point-15.6 procedural designation generator for the V1 system/primary-star
 * target.
 *
 * Designation is derived directly from the already-canonical SystemSeed. It does
 * not instantiate Sfc64Random, consume any physical/age/activity/rotation draw,
 * or introduce a StarSeed/StarLocator level. This keeps every frozen 15.1..15.5
 * output bit-for-bit independent from naming.
 */
export class StellarDesignationGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,
  ): StellarDesignation {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateV1(
        generationKey,
        locator,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static generateV1(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,
  ): StellarDesignation {

    const systemSeed =
      ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          locator,
        ) as SystemSeed;

    const seedHex =
      systemSeed
        .normalizedValue;

    const blockAValue =
      BigInt(
        `0x${seedHex.substring(0, 8)}`,
      );

    const blockBValue =
      BigInt(
        `0x${seedHex.substring(8, 16)}`,
      );

    const blockCValue =
      BigInt(
        `0x${seedHex.substring(16, 24)}`,
      );

    const blockDValue =
      BigInt(
        `0x${seedHex.substring(24, 32)}`,
      );

    const onset =
      V1_ONSETS[
        Number(
          blockAValue %
          BigInt(
            V1_ONSETS.length,
          ),
        )
      ]!;

    const vowel =
      V1_VOWELS[
        Number(
          blockBValue %
          BigInt(
            V1_VOWELS.length,
          ),
        )
      ]!;

    const medial =
      V1_MEDIALS[
        Number(
          blockCValue %
          BigInt(
            V1_MEDIALS.length,
          ),
        )
      ]!;

    const ending =
      V1_ENDINGS[
        Number(
          blockDValue %
          BigInt(
            V1_ENDINGS.length,
          ),
        )
      ]!;

    const name =
      onset +
      vowel +
      medial +
      ending;

    const proceduralCode =
      `GEN-V${generationKey.generatorVersion.code}` +
      `-G${locator.galaxyIndex}` +
      `-S${locator.sectorKey}` +
      `-O${locator.galacticObjectIndex}` +
      `-SYS-${seedHex}`;

    return new StellarDesignation(
      name,
      proceduralCode,
    );
  }
}
