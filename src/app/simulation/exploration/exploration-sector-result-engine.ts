import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
  hexToBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

import {
  ExplorationResultKind,
  ExplorationSectorResult,
  type ExplorationLocatedResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  type ExplorationSectorScanResult,
} from '../../domain/exploration/exploration-sector-scan';

import {
  type GalacticObjectLocator,
  type SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GALACTIC_NUCLEUS_OBJECT_INDEX,
  isGalacticCenterCoordinates,
  isGalacticNucleusLocator,
} from '../../domain/universe/galactic-center';

import {
  GalacticNucleusState,
} from '../../domain/universe/galactic-nucleus-state';

import {
  LocatedObservationObject,
  ObservationClassification,
  ObservationTransientCandidate,
  ObservationTransientCandidateId,
} from '../../domain/observation/observation-classification';

import {
  GalacticCenterNucleusResolver,
} from '../nuclear/galactic-center-nucleus-resolver';

import {
  GalaxySectorContentGenerator,
} from '../sector/galaxy-sector-content-generator';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  ExplorationSectorScanEngine,
} from './exploration-sector-scan-engine';

const V1_RESULT_DOMAIN =
  utf8ToBytes(
    'GENESIS-EXPLORATION-SECTOR-RESULT-V1',
  );

const V1_OBJECT_KIND_LABEL =
  utf8ToBytes(
    'galactic-object-kind',
  );

const V1_RESULT_SELECTION_LABEL =
  utf8ToBytes(
    'result-kind-selection',
  );

const V1_CANDIDATE_SELECTION_LABEL =
  utf8ToBytes(
    'candidate-selection',
  );

const V1_EVENT_ID_LABEL =
  utf8ToBytes(
    'transient-event-id',
  );

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

export type ExplorationGalacticObjectResultKind =
  Exclude<
    ExplorationLocatedResultKind,
    typeof ExplorationResultKind.SYSTEM
  >;

interface LocatedCandidate {
  readonly kind:
    ExplorationLocatedResultKind;

  readonly locator:
    SystemLocator |
    GalacticObjectLocator;
}

interface ResultBucket {
  readonly kind:
    ExplorationResultKind;

  readonly weight:
    number;

  readonly candidates:
    readonly LocatedCandidate[];
}

/**
 * Pure deterministic point-9.4 result resolver.
 *
 * Web V1 becomes the source-of-truth contract from this point onward.
 *
 * The resolver intentionally distinguishes:
 * - Ground Truth addressing: existing SystemLocator / GalacticObjectLocator;
 * - coarse exploration result family: the five ExplorationResultKind values;
 * - formal science: the point-8.9 ObservationClassification remains
 *   Unclassified.
 *
 * V1 rules:
 * - sector content is generated lazily through the already-frozen
 *   GalaxySectorContentGenerator;
 * - every generic GalacticObjectLocator receives a stable coarse exploration
 *   family from an isolated SHA-256 branch of its own target seed:
 *     40% NEBULA, 40% STAR_CLUSTER, 20% EXTREME_OBJECT;
 * - result-family selection is weighted by family, not by raw object count:
 *     SYSTEM 5, NEBULA 2, STAR_CLUSTER 2, EXTREME_OBJECT 1,
 *     TRANSIENT_EVENT 1;
 * - empty static sectors still resolve to TRANSIENT_EVENT, preserving the
 *   already-observed 9.3 signal/anomaly cue without inventing a static object;
 * - one transient event candidate is deterministic per scanned sector.
 *
 * Point 10.5 reuses resolveGalacticObjectKind() as the single canonical source
 * for the already-frozen coarse galactic-object family. This does not promote
 * the result to a formal scientific classification.
 *
 * This engine performs no repository access, DiscoveryState mutation,
 * Discovery Point read/write, reward calculation, clock/UUID use or transient
 * persistence. Point 9.5 owns progression/reward effects.
 */
export class ExplorationSectorResultEngine {

  private constructor() {}

  static resolve(
    scanResult:
      ExplorationSectorScanResult,
  ): ExplorationSectorResult {

    const generationKey =
      scanResult
        .selection
        .generationKey;

    if (
      generationKey
        .generatorVersion !==
      GeneratorVersion.V1
    ) {
      throw new RangeError(
        `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
      );
    }

    const canonicalScan =
      ExplorationSectorScanEngine
        .scan(
          scanResult
            .selection,
        );

    if (
      canonicalScan
        .detectionKind !==
        scanResult
          .detectionKind ||
      scanResult
        .preliminaryClassification !==
        ObservationClassification
          .Unclassified
    ) {
      throw new RangeError(
        'scanResult must match the canonical point-9.3 scan result.',
      );
    }

    const galaxy =
      GalaxyGenerator
        .generate(
          generationKey,
          canonicalScan
            .selection
            .galaxyIndex,
        );

    const content =
      GalaxySectorContentGenerator
        .generate(
          galaxy,
          canonicalScan
            .selection
            .coordinates,
        );

    if (
      isGalacticCenterCoordinates(
        canonicalScan
          .selection
          .coordinates,
      )
    ) {
      const nucleusLocator =
        content
          .galacticObjectLocators
          .find(
            (locator) =>
              locator.galacticObjectIndex ===
              GALACTIC_NUCLEUS_OBJECT_INDEX,
          );

      if (
        nucleusLocator ===
        undefined
      ) {
        throw new RangeError(
          'Galactic centre sector must expose the reserved nucleus locator.',
        );
      }

      const nucleusState =
        GalacticCenterNucleusResolver
          .resolveState(
            galaxy,
          );

      return new ExplorationSectorResult(
        canonicalScan,
        nucleusState ===
          GalacticNucleusState.QUIESCENT
          ? ExplorationResultKind.STAR_CLUSTER
          : ExplorationResultKind.EXTREME_OBJECT,
        new LocatedObservationObject(
          generationKey,
          nucleusLocator,
        ),
      );
    }

    const candidates:
      LocatedCandidate[] =
      [];

    for (
      const locator
      of content.systemLocators
    ) {
      candidates.push({
        kind:
          ExplorationResultKind
            .SYSTEM,

        locator,
      });
    }

    for (
      const locator
      of content.galacticObjectLocators
    ) {
      candidates.push({
        kind:
          this.resolveGalacticObjectKind(
            generationKey,
            locator,
          ),

        locator,
      });
    }

    const sectorSeed =
      ProceduralTargetResolver
        .resolveTargetSeed(
          generationKey,
          canonicalScan
            .selection
            .sectorLocator,
        );

    const buckets =
      resultBucketsV1(
        candidates,
      );

    const selectedBucket =
      weightedBucketV1(
        buckets,
        digestV1(
          sectorSeed
            .normalizedValue,
          V1_RESULT_SELECTION_LABEL,
        ),
      );

    if (
      selectedBucket
        .kind ===
      ExplorationResultKind
        .TRANSIENT_EVENT
    ) {
      return new ExplorationSectorResult(
        canonicalScan,
        selectedBucket.kind,
        new ObservationTransientCandidate(
          generationKey,
          new ObservationTransientCandidateId(
            eventCandidateIdV1(
              digestV1(
                sectorSeed
                  .normalizedValue,
                V1_EVENT_ID_LABEL,
              ),
            ),
          ),
        ),
      );
    }

    const candidate =
      selectLocatedCandidateV1(
        selectedBucket,
        digestV1(
          sectorSeed
            .normalizedValue,
          V1_CANDIDATE_SELECTION_LABEL,
        ),
      );

    return new ExplorationSectorResult(
      canonicalScan,
      selectedBucket.kind,
      new LocatedObservationObject(
        generationKey,
        candidate.locator,
      ),
    );
  }

  static resolveGalacticObjectKind(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): ExplorationGalacticObjectResultKind {

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
      isGalacticNucleusLocator(
        locator,
      )
    ) {
      const galaxy =
        GalaxyGenerator.generate(
          generationKey,
          locator.galaxyIndex,
        );

      const nucleusState =
        GalacticCenterNucleusResolver
          .resolveState(
            galaxy,
          );

      return nucleusState ===
        GalacticNucleusState.QUIESCENT
        ? ExplorationResultKind.STAR_CLUSTER
        : ExplorationResultKind.EXTREME_OBJECT;
    }

    return coarseGalacticObjectKindV1(
      generationKey,
      locator,
    );
  }
}

function coarseGalacticObjectKindV1(
  generationKey:
    UniverseGenerationKey,

  locator:
    GalacticObjectLocator,
): ExplorationGalacticObjectResultKind {

  const targetSeed =
    ProceduralTargetResolver
      .resolveTargetSeed(
        generationKey,
        locator,
      );

  const digest =
    digestV1(
      targetSeed
        .normalizedValue,
      V1_OBJECT_KIND_LABEL,
    );

  const bucket =
    digest[0] %
    10;

  if (
    bucket <
    4
  ) {
    return ExplorationResultKind
      .NEBULA;
  }

  if (
    bucket <
    8
  ) {
    return ExplorationResultKind
      .STAR_CLUSTER;
  }

  return ExplorationResultKind
    .EXTREME_OBJECT;
}

function resultBucketsV1(
  candidates:
    readonly LocatedCandidate[],
): readonly ResultBucket[] {

  const kinds = [
    {
      kind:
        ExplorationResultKind
          .SYSTEM,
      weight:
        5,
    },
    {
      kind:
        ExplorationResultKind
          .NEBULA,
      weight:
        2,
    },
    {
      kind:
        ExplorationResultKind
          .STAR_CLUSTER,
      weight:
        2,
    },
    {
      kind:
        ExplorationResultKind
          .EXTREME_OBJECT,
      weight:
        1,
    },
  ] as const;

  const buckets:
    ResultBucket[] =
    [];

  for (
    const item
    of kinds
  ) {
    const matching =
      candidates
        .filter(
          (
            candidate,
          ) =>
            candidate.kind ===
              item.kind,
        );

    if (
      matching.length >
      0
    ) {
      buckets.push({
        kind:
          item.kind,

        weight:
          item.weight,

        candidates:
          Object.freeze(
            matching,
          ),
      });
    }
  }

  buckets.push({
    kind:
      ExplorationResultKind
        .TRANSIENT_EVENT,

    weight:
      1,

    candidates:
      Object.freeze([]),
  });

  return Object.freeze(
    buckets,
  );
}

function weightedBucketV1(
  buckets:
    readonly ResultBucket[],

  digest:
    Uint8Array,
): ResultBucket {

  const totalWeight =
    buckets
      .reduce(
        (
          total,
          bucket,
        ) =>
          total +
          bucket.weight,
        0,
      );

  let cursor =
    uint32Be(
      digest,
    ) %
    totalWeight;

  for (
    const bucket
    of buckets
  ) {
    if (
      cursor <
      bucket.weight
    ) {
      return bucket;
    }

    cursor -=
      bucket.weight;
  }

  throw new Error(
    'V1 result bucket selection failed.',
  );
}

function selectLocatedCandidateV1(
  bucket:
    ResultBucket,

  digest:
    Uint8Array,
): LocatedCandidate {

  if (
    bucket
      .candidates
      .length ===
    0
  ) {
    throw new RangeError(
      'Located result bucket must contain at least one candidate.',
    );
  }

  return bucket
    .candidates[
      uint32Be(
        digest,
      ) %
      bucket
        .candidates
        .length
    ];
}

function eventCandidateIdV1(
  digest:
    Uint8Array,
): bigint {

  let value =
    0n;

  for (
    let index =
      0;
    index <
      8;
    index +=
      1
  ) {
    value =
      (
        value <<
        8n
      ) |
      BigInt(
        digest[index],
      );
  }

  return value &
    SIGNED_LONG_MAX;
}

function digestV1(
  seedHex:
    string,

  label:
    Uint8Array,
): Uint8Array {

  return sha256
    .create()
    .update(
      V1_RESULT_DOMAIN,
    )
    .update(
      hexToBytes(
        seedHex,
      ),
    )
    .update(
      label,
    )
    .digest();
}

function uint32Be(
  digest:
    Uint8Array,
): number {

  return (
    digest[0] *
      0x01000000 +
    digest[1] *
      0x00010000 +
    digest[2] *
      0x00000100 +
    digest[3]
  );
}
