import {
  DiscoveryTargetType,
} from '../../../domain/discovery/discovery-target-type';

import {
  ScientificEvidence,
  mergeScientificEvidence,
} from '../../../domain/discovery/scientific-evidence';

import {
  type ProceduralLocator,
} from '../../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';

import {
  type ScientificEvidenceRepository,
} from '../../../domain/repository/scientific-evidence-repository';

import {
  type GenesisIndexedDb,
} from '../indexed-db/genesis-indexed-db';

import {
  type ProceduralTargetSeedResolver,
} from './dexie-discovery.repository';

import {
  CorruptLocalDataError,
  ensureUniverseExists,
  generationKeyStorageParts,
  normalizeTargetSeed,
} from './local-repository-support';

export const SCIENTIFIC_EVIDENCE_OBSERVATION_KIND_V1 =
  'SCIENTIFIC_EVIDENCE_V1';

export const SCIENTIFIC_EVIDENCE_PAYLOAD_VERSION_V1 =
  1;

interface ScientificEvidencePayloadV1 {
  readonly dimensionCode:
    string;

  readonly evidenceCode:
    string;

  readonly sourceKey:
    string;

  readonly independenceKey:
    string;

  readonly quality01:
    number;

  readonly uncertainty01:
    number;
}

/**
 * Point-26.A.2 evidence persistence adapter.
 *
 * It deliberately reuses the existing generic observations store. Therefore:
 * - no new IndexedDB store/schema version is required;
 * - existing backup/import already carries the records;
 * - evidence stays in observed knowledge instead of Ground Truth/discoveries;
 * - the visual completeness percentage is never persisted.
 */
export class DexieScientificEvidenceRepository
  implements ScientificEvidenceRepository {

  constructor(
    private readonly database:
      GenesisIndexedDb,

    private readonly targetSeedResolver:
      ProceduralTargetSeedResolver,
  ) {}

  async getEvidence(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,
  ): Promise<readonly ScientificEvidence[]> {

    await ensureUniverseExists(
      this.database,
      generationKey,
    );

    const identity =
      this.targetIdentity(
        generationKey,
        locator,
      );

    const observations =
      await this.database
        .observations
        .where(
          '[universeSeed+generatorVersionCode+targetTypeCode+targetSeed]',
        )
        .equals([
          identity.universeSeed,
          identity.generatorVersionCode,
          identity.targetTypeCode,
          identity.targetSeed,
        ])
        .toArray();

    const evidence =
      observations
        .filter(
          observation =>
            observation.observationKind ===
            SCIENTIFIC_EVIDENCE_OBSERVATION_KIND_V1,
        )
        .map(
          observation =>
            this.fromObservation(
              observation,
              identity,
            ),
        );

    evidence.sort(
      compareEvidence,
    );

    return Object.freeze(
      evidence,
    );
  }

  async recordEvidence(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,

    evidence:
      ScientificEvidence,
  ): Promise<ScientificEvidence> {

    await ensureUniverseExists(
      this.database,
      generationKey,
    );

    const identity =
      this.targetIdentity(
        generationKey,
        locator,
      );

    const id =
      scientificEvidenceObservationId(
        identity,
        evidence,
      );

    const existing =
      await this.database
        .observations
        .get(
          id,
        );

    let persisted =
      evidence;

    if (
      existing !==
      undefined
    ) {
      if (
        existing.observationKind !==
        SCIENTIFIC_EVIDENCE_OBSERVATION_KIND_V1
      ) {
        throw new CorruptLocalDataError(
          'Scientific evidence observation id collides with another observation kind.',
        );
      }

      const current =
        this.fromObservation(
          existing,
          identity,
        );

      persisted =
        mergeScientificEvidence(
          current,
          evidence,
        );

      if (
        persisted ===
        current
      ) {
        return current;
      }
    }

    await this.database
      .observations
      .put({
        id,
        universeSeed:
          identity.universeSeed,
        generatorVersionCode:
          identity.generatorVersionCode,
        targetTypeCode:
          identity.targetTypeCode,
        targetSeed:
          identity.targetSeed,
        observationKind:
          SCIENTIFIC_EVIDENCE_OBSERVATION_KIND_V1,
        payloadVersion:
          SCIENTIFIC_EVIDENCE_PAYLOAD_VERSION_V1,
        payloadJson:
          JSON.stringify(
            payloadFromEvidence(
              persisted,
            ),
          ),
        observedAtEpochMs:
          persisted.observedAtEpochMs,
      });

    return persisted;
  }

  private targetIdentity(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,
  ): ScientificEvidenceTargetIdentity {

    const {
      universeSeed,
      generatorVersionCode,
    } =
      generationKeyStorageParts(
        generationKey,
      );

    const targetType =
      DiscoveryTargetType
        .fromLocator(
          locator,
        );

    const targetSeed =
      normalizeTargetSeed(
        this.targetSeedResolver
          .resolveTargetSeedNormalized(
            generationKey,
            locator,
          ),
      );

    return Object.freeze({
      universeSeed,
      generatorVersionCode,
      targetTypeCode:
        targetType.code,
      targetSeed,
    });
  }

  private fromObservation(
    observation:
      {
        readonly id:
          string;
        readonly universeSeed:
          string;
        readonly generatorVersionCode:
          number;
        readonly targetTypeCode:
          number;
        readonly targetSeed:
          string;
        readonly observationKind:
          string;
        readonly payloadVersion:
          number;
        readonly payloadJson:
          string;
        readonly observedAtEpochMs:
          number;
      },

    identity:
      ScientificEvidenceTargetIdentity,
  ): ScientificEvidence {

    if (
      observation.universeSeed !==
        identity.universeSeed ||
      observation.generatorVersionCode !==
        identity.generatorVersionCode ||
      observation.targetTypeCode !==
        identity.targetTypeCode ||
      normalizeTargetSeed(
        observation.targetSeed,
      ) !==
        identity.targetSeed
    ) {
      throw new CorruptLocalDataError(
        'Scientific evidence observation target identity is inconsistent.',
      );
    }

    if (
      observation.payloadVersion !==
      SCIENTIFIC_EVIDENCE_PAYLOAD_VERSION_V1
    ) {
      throw new CorruptLocalDataError(
        `Unsupported scientific evidence payload version: ${observation.payloadVersion}.`,
      );
    }

    const payload =
      parseScientificEvidencePayloadV1(
        observation.payloadJson,
      );

    let evidence:
      ScientificEvidence;

    try {
      evidence =
        new ScientificEvidence({
          ...payload,
          observedAtEpochMs:
            observation.observedAtEpochMs,
        });
    } catch (
      error
    ) {
      void error;

      throw new CorruptLocalDataError(
        'Persisted scientific evidence payload is invalid.',
      );
    }

    const expectedId =
      scientificEvidenceObservationId(
        identity,
        evidence,
      );

    if (
      observation.id !==
      expectedId
    ) {
      throw new CorruptLocalDataError(
        'Persisted scientific evidence id does not match its target/evidence identity.',
      );
    }

    return evidence;
  }
}

interface ScientificEvidenceTargetIdentity {
  readonly universeSeed:
    string;

  readonly generatorVersionCode:
    number;

  readonly targetTypeCode:
    number;

  readonly targetSeed:
    string;
}

function payloadFromEvidence(
  evidence:
    ScientificEvidence,
): ScientificEvidencePayloadV1 {

  return {
    dimensionCode:
      evidence.dimensionCode,
    evidenceCode:
      evidence.evidenceCode,
    sourceKey:
      evidence.sourceKey,
    independenceKey:
      evidence.independenceKey,
    quality01:
      evidence.quality01,
    uncertainty01:
      evidence.uncertainty01,
  };
}

function parseScientificEvidencePayloadV1(
  payloadJson:
    string,
): ScientificEvidencePayloadV1 {

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        payloadJson,
      );
  } catch (
    error
  ) {
    void error;

    throw new CorruptLocalDataError(
      'Persisted scientific evidence payloadJson is not valid JSON.',
    );
  }

  if (
    typeof parsed !==
      'object' ||
    parsed ===
      null ||
    Array.isArray(
      parsed,
    )
  ) {
    throw new CorruptLocalDataError(
      'Persisted scientific evidence payload must be an object.',
    );
  }

  const record =
    parsed as
      Record<string, unknown>;

  const expectedKeys =
    [
      'dimensionCode',
      'evidenceCode',
      'sourceKey',
      'independenceKey',
      'quality01',
      'uncertainty01',
    ] as const;

  const actualKeys =
    Object.keys(
      record,
    ).sort();

  if (
    actualKeys.join('|') !==
    [...expectedKeys]
      .sort()
      .join('|')
  ) {
    throw new CorruptLocalDataError(
      'Persisted scientific evidence payload contains an unexpected shape.',
    );
  }

  return {
    dimensionCode:
      record['dimensionCode'] as string,
    evidenceCode:
      record['evidenceCode'] as string,
    sourceKey:
      record['sourceKey'] as string,
    independenceKey:
      record['independenceKey'] as string,
    quality01:
      record['quality01'] as number,
    uncertainty01:
      record['uncertainty01'] as number,
  };
}

function scientificEvidenceObservationId(
  identity:
    ScientificEvidenceTargetIdentity,

  evidence:
    ScientificEvidence,
): string {

  return [
    'scientific-evidence-v1',
    identity.universeSeed,
    identity.generatorVersionCode
      .toString(
        10,
      ),
    identity.targetTypeCode
      .toString(
        10,
      ),
    identity.targetSeed,
    encodeURIComponent(
      evidence.dimensionCode,
    ),
    encodeURIComponent(
      evidence.evidenceCode,
    ),
    encodeURIComponent(
      evidence.sourceKey,
    ),
  ].join(':');
}

function compareEvidence(
  left:
    ScientificEvidence,

  right:
    ScientificEvidence,
): number {

  return (
    left.dimensionCode
      .localeCompare(
        right.dimensionCode,
      ) ||
    left.evidenceCode
      .localeCompare(
        right.evidenceCode,
      ) ||
    left.sourceKey
      .localeCompare(
        right.sourceKey,
      )
  );
}
