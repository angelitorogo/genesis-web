import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
  hexToBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

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
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

const V1_MULTIPLICITY_BRANCH =
  utf8ToBytes(
    'GENESIS-STELLAR-SYSTEM-MULTIPLICITY-V1',
  );

const V1_BUCKET_COUNT =
  10_000n;

const V1_TRIPLE_THRESHOLD =
  300n;

const V1_BINARY_THRESHOLD =
  3_000n;

/**
 * Point-16.3 deterministic multiplicity selector.
 *
 * The V1 population contract is intentionally coarse and architecture-only:
 * 70% SINGLE, 27% BINARY and 3% TRIPLE buckets. TRIPLE is therefore rare by
 * construction, while the decision lives on an independent SHA-256 branch of
 * SystemSeed and cannot perturb any phase-15, B or C generation stream.
 *
 * More detailed mass/environment-dependent multiplicity demographics can only
 * be introduced under a future GeneratorVersion; V1 probabilities are frozen
 * once point 16.3 closes.
 */
export class StellarSystemMultiplicitySelector {

  private constructor() {}

  static select(
    generationKey:
      UniverseGenerationKey,

    systemSeed:
      SystemSeed,
  ): StellarSystemMultiplicity {

    if (
      generationKey
        .generatorVersion !==
      GeneratorVersion.V1
    ) {
      throw new RangeError(
        `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
      );
    }

    const digest =
      sha256
        .create()
        .update(
          V1_MULTIPLICITY_BRANCH,
        )
        .update(
          hexToBytes(
            systemSeed
              .normalizedValue,
          ),
        )
        .digest();

    let value =
      0n;

    for (
      let index = 0;
      index < 8;
      index += 1
    ) {
      value =
        (
          value <<
          8n
        ) |
        BigInt(
          digest[index]!,
        );
    }

    const bucket =
      value %
      V1_BUCKET_COUNT;

    if (
      bucket <
      V1_TRIPLE_THRESHOLD
    ) {
      return StellarSystemMultiplicity.TRIPLE;
    }

    if (
      bucket <
      V1_BINARY_THRESHOLD
    ) {
      return StellarSystemMultiplicity.BINARY;
    }

    return StellarSystemMultiplicity.SINGLE;
  }
}
