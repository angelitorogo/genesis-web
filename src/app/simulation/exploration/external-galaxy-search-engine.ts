import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
  bytesToHex,
  hexToBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

import {
  type ExternalGalaxySearchPityProfile,
} from '../../domain/exploration/external-galaxy-search-pity-profile';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  Sfc64Random,
} from '../random/sfc64-random';

import {
  ExternalGalaxySearchPityEngine,
} from './external-galaxy-search-pity-engine';

const SEARCH_DOMAIN =
  utf8ToBytes(
    'GENESIS-EXTERNAL-GALAXY-SEARCH-V1',
  );

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

export interface ExternalGalaxySearchAttempt {
  readonly searchCycleIndex:
    bigint;

  readonly consecutiveFailedSearchesBefore:
    bigint;

  readonly consecutiveFailedSearchesAfter:
    bigint;

  readonly probabilityProfile:
    ExternalGalaxySearchPityProfile;

  /**
   * Deterministic [0, 1) draw used only to decide the search.
   *
   * Presentation must not treat this value as observed scientific knowledge.
   */
  readonly detectionRoll:
    number;

  readonly detected:
    boolean;

  readonly detectedGalaxyIndex:
    bigint | null;
}

/**
 * Pure deterministic execution step for one external-galaxy search.
 *
 * Points 7.4 and 7.5 remain the source of probability and pity balance.
 * This engine adds the missing deterministic attempt itself without persistence.
 *
 * V1 entropy is isolated behind its own domain string and therefore does not
 * consume or alter any frozen Universe -> Galaxy -> Sector hierarchical branch.
 *
 * Search state is fully described by:
 *
 * - UniverseGenerationKey;
 * - global Discovery Points;
 * - number of already-known external galaxies (searchCycleIndex);
 * - consecutive failed searches;
 * - known galaxy indices excluded from candidate selection.
 */
export class ExternalGalaxySearchEngine {

  private constructor() {}

  static resolveNextSearch(
    generationKey:
      UniverseGenerationKey,

    globalDiscoveryPoints:
      bigint,

    consecutiveFailedSearches:
      bigint,

    searchCycleIndex:
      bigint,

    excludedGalaxyIndices:
      readonly bigint[],
  ): ExternalGalaxySearchAttempt {

    assertNonNegativeSignedLong(
      searchCycleIndex,
      'searchCycleIndex',
    );

    assertNonNegativeSignedLong(
      consecutiveFailedSearches,
      'consecutiveFailedSearches',
    );

    for (
      const galaxyIndex
      of excludedGalaxyIndices
    ) {
      assertNonNegativeSignedLong(
        galaxyIndex,
        'excludedGalaxyIndex',
      );
    }

    if (
      generationKey
        .generatorVersion !==
      GeneratorVersion.V1
    ) {
      throw new RangeError(
        `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
      );
    }

    const probabilityProfile =
      ExternalGalaxySearchPityEngine
        .evaluateNextSearchProbability(
          generationKey,
          globalDiscoveryPoints,
          consecutiveFailedSearches,
        );

    const random =
      new Sfc64Random(
        deriveAttemptSeedV1(
          generationKey,
          searchCycleIndex,
          consecutiveFailedSearches,
        ),
      );

    /*
     * Frozen V1 order for one attempt:
     *
     * 1. detection roll;
     * 2. candidate galaxy index.
     */
    const detectionRoll =
      random.nextDouble();

    const rawCandidate =
      random.nextUint64() &
      SIGNED_LONG_MAX;

    const candidateGalaxyIndex =
      resolveCandidateGalaxyIndex(
        rawCandidate,
        excludedGalaxyIndices,
      );

    const detected =
      detectionRoll <
      probabilityProfile
        .effectiveProbabilityPerNextSearch;

    return Object.freeze({
      searchCycleIndex,

      consecutiveFailedSearchesBefore:
        consecutiveFailedSearches,

      consecutiveFailedSearchesAfter:
        detected
          ? 0n
          : consecutiveFailedSearches +
            1n,

      probabilityProfile,

      detectionRoll,

      detected,

      detectedGalaxyIndex:
        detected
          ? candidateGalaxyIndex
          : null,
    });
  }
}

function deriveAttemptSeedV1(
  generationKey:
    UniverseGenerationKey,

  searchCycleIndex:
    bigint,

  consecutiveFailedSearches:
    bigint,
): UniverseSeed {

  const digest =
    sha256
      .create()
      .update(
        SEARCH_DOMAIN,
      )
      .update(
        hexToBytes(
          generationKey
            .universeSeed
            .normalizedValue,
        ),
      )
      .update(
        signedLongToBigEndianBytes(
          searchCycleIndex,
        ),
      )
      .update(
        signedLongToBigEndianBytes(
          consecutiveFailedSearches,
        ),
      )
      .digest();

  const normalized =
    bytesToHex(
      digest.slice(
        0,
        16,
      ),
    )
      .toUpperCase();

  return UniverseSeed.parse(
    normalized
      .match(
        /.{4}/g,
      )
      ?.join(
        '-',
      ) ??
      '',
  );
}

function resolveCandidateGalaxyIndex(
  rawCandidate:
    bigint,

  excludedGalaxyIndices:
    readonly bigint[],
): bigint {

  const excluded =
    new Set(
      excludedGalaxyIndices
        .map(
          (
            galaxyIndex,
          ) =>
            galaxyIndex
              .toString(
                10,
              ),
        ),
    );

  let candidate =
    rawCandidate ===
      0n
      ? 1n
      : rawCandidate;

  const maximumProbes =
    excluded.size +
    2;

  for (
    let probe =
      0;
    probe <
      maximumProbes;
    probe +=
      1
  ) {
    if (
      !excluded.has(
        candidate
          .toString(
            10,
          ),
      )
    ) {
      return candidate;
    }

    candidate =
      candidate ===
        SIGNED_LONG_MAX
        ? 1n
        : candidate +
          1n;
  }

  throw new RangeError(
    'No external galaxy candidate could be selected from the available signed-Long index space.',
  );
}

function signedLongToBigEndianBytes(
  value:
    bigint,
): Uint8Array {

  assertNonNegativeSignedLong(
    value,
    'value',
  );

  let remaining =
    value;

  const bytes =
    new Uint8Array(
      8,
    );

  for (
    let index =
      7;
    index >=
      0;
    index -=
      1
  ) {
    bytes[
      index
    ] =
      Number(
        remaining &
        0xFFn,
      );

    remaining >>=
      8n;
  }

  return bytes;
}

function assertNonNegativeSignedLong(
  value:
    bigint,

  propertyName:
    string,
): void {

  if (
    value <
      0n ||
    value >
      SIGNED_LONG_MAX
  ) {
    throw new RangeError(
      `${propertyName} must be a non-negative signed Long: ${value}.`,
    );
  }
}
