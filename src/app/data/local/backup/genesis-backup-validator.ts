import {
  BackupFormatVersion,
  type DiscoveryBackupEntry,
  type GalaxyBackupEntry,
  type GenesisBackupSnapshot,
  type NavigationBackupEntry,
  type ObservationBackupEntry,
  type ProgressBackupEntry,
  type UniverseBackupSnapshot,
} from '../../../domain/backup/genesis-backup';

import {
  DiscoveryState,
} from '../../../domain/discovery/discovery-state';

import {
  DiscoveryTargetType,
} from '../../../domain/discovery/discovery-target-type';

import {
  type ProceduralLocator,
} from '../../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../../domain/universe/universe-seed';

import {
  type DiscoveryEntity,
} from '../entity/discovery.entity';

import {
  rehydrateDiscoveryLocator,
} from '../entity/discovery-locator-rehydrator';

import {
  GLOBAL_PROGRESS_SCOPE_KEY,
  ProgressScopeCode,
} from '../entity/progress.entity';

import {
  parseNonNegativeLongDecimal,
} from '../repository/local-repository-support';

const TARGET_SEED_PATTERN =
  /^[0-9A-F]{32}$/;

export type BackupTargetSeedResolver =
  (
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,
  ) => string;

export class GenesisBackupValidationError
  extends Error {

  constructor(
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      'GenesisBackupValidationError';
  }
}

export class GenesisBackupValidator {

  constructor(
    private readonly resolveTargetSeed:
      BackupTargetSeedResolver,
  ) {}

  validate(
    input:
      unknown,
  ): GenesisBackupSnapshot {

    const root =
      requireRecord(
        input,
        'backup',
      );

    requireExactKeys(
      root,
      [
        'formatVersion',
        'exportedAtEpochMs',
        'universes',
      ],
      'backup',
    );

    const formatVersion =
      requireInteger(
        root['formatVersion'],
        'backup.formatVersion',
      );

    if (
      formatVersion !==
      BackupFormatVersion.V1.code
    ) {
      throw new GenesisBackupValidationError(
        `Unsupported backup formatVersion: ${formatVersion}.`,
      );
    }

    const exportedAtEpochMs =
      requireNonNegativeSafeInteger(
        root['exportedAtEpochMs'],
        'backup.exportedAtEpochMs',
      );

    const rawUniverses =
      requireArray(
        root['universes'],
        'backup.universes',
      );

    const universeKeys =
      new Set<string>();

    const observationIds =
      new Set<string>();

    const universes =
      rawUniverses.map(
        (
          rawUniverse,
          index,
        ) =>
          this.validateUniverse(
            rawUniverse,
            `backup.universes[${index}]`,
            universeKeys,
            observationIds,
          ),
      );

    return {
      formatVersion:
        BackupFormatVersion.V1.code,

      exportedAtEpochMs,

      universes,
    };
  }

  private validateUniverse(
    input:
      unknown,

    path:
      string,

    universeKeys:
      Set<string>,

    observationIds:
      Set<string>,
  ): UniverseBackupSnapshot {

    const value =
      requireRecord(
        input,
        path,
      );

    requireExactKeys(
      value,
      [
        'universeSeed',
        'generatorVersionCode',
        'createdAtEpochMs',
        'updatedAtEpochMs',
        'navigation',
        'galaxies',
        'discoveries',
        'observations',
        'progress',
      ],
      path,
    );

    const universeSeed =
      requireString(
        value['universeSeed'],
        `${path}.universeSeed`,
      );

    let parsedSeed:
      UniverseSeed;

    try {
      parsedSeed =
        UniverseSeed.parse(
          universeSeed,
        );
    } catch {
      throw new GenesisBackupValidationError(
        `${path}.universeSeed is invalid.`,
      );
    }

    if (
      parsedSeed.serialize() !==
      universeSeed
    ) {
      throw new GenesisBackupValidationError(
        `${path}.universeSeed must use canonical GENESIS format.`,
      );
    }

    const generatorVersionCode =
      requireInteger(
        value['generatorVersionCode'],
        `${path}.generatorVersionCode`,
      );

    if (
      generatorVersionCode !==
      GeneratorVersion.V1.code
    ) {
      throw new GenesisBackupValidationError(
        `${path}.generatorVersionCode is unsupported: ${generatorVersionCode}.`,
      );
    }

    const generationKey =
      new UniverseGenerationKey(
        parsedSeed,
        GeneratorVersion.V1,
      );

    const identity =
      `${universeSeed}|${generatorVersionCode}`;

    if (
      universeKeys.has(
        identity,
      )
    ) {
      throw new GenesisBackupValidationError(
        `Duplicate universe identity: ${identity}.`,
      );
    }

    universeKeys.add(
      identity,
    );

    const createdAtEpochMs =
      requireNonNegativeSafeInteger(
        value['createdAtEpochMs'],
        `${path}.createdAtEpochMs`,
      );

    const updatedAtEpochMs =
      requireNonNegativeSafeInteger(
        value['updatedAtEpochMs'],
        `${path}.updatedAtEpochMs`,
      );

    if (
      updatedAtEpochMs <
      createdAtEpochMs
    ) {
      throw new GenesisBackupValidationError(
        `${path}.updatedAtEpochMs cannot precede createdAtEpochMs.`,
      );
    }

    const navigation =
      value['navigation'] ===
      null
        ? null
        : this.validateNavigation(
            value['navigation'],
            `${path}.navigation`,
          );

    const galaxyIndices =
      new Set<string>();

    const galaxies =
      requireArray(
        value['galaxies'],
        `${path}.galaxies`,
      )
        .map(
          (
            item,
            index,
          ) =>
            this.validateGalaxy(
              item,
              `${path}.galaxies[${index}]`,
              galaxyIndices,
            ),
        );

    const discoveryKeys =
      new Set<string>();

    const discoveries =
      requireArray(
        value['discoveries'],
        `${path}.discoveries`,
      )
        .map(
          (
            item,
            index,
          ) =>
            this.validateDiscovery(
              item,
              `${path}.discoveries[${index}]`,
              generationKey,
              discoveryKeys,
            ),
        );

    const observations =
      requireArray(
        value['observations'],
        `${path}.observations`,
      )
        .map(
          (
            item,
            index,
          ) =>
            this.validateObservation(
              item,
              `${path}.observations[${index}]`,
              observationIds,
            ),
        );

    const progressKeys =
      new Set<string>();

    const progress =
      requireArray(
        value['progress'],
        `${path}.progress`,
      )
        .map(
          (
            item,
            index,
          ) =>
            this.validateProgress(
              item,
              `${path}.progress[${index}]`,
              progressKeys,
            ),
        );

    return {
      universeSeed,
      generatorVersionCode,
      createdAtEpochMs,
      updatedAtEpochMs,
      navigation,
      galaxies,
      discoveries,
      observations,
      progress,
    };
  }

  private validateNavigation(
    input:
      unknown,

    path:
      string,
  ): NavigationBackupEntry {

    const value =
      requireRecord(
        input,
        path,
      );

    requireExactKeys(
      value,
      [
        'activeGalaxyIndex',
        'recentGalaxyIndices',
        'updatedAtEpochMs',
      ],
      path,
    );

    const activeGalaxyIndex =
      requireCanonicalNonNegativeLong(
        value['activeGalaxyIndex'],
        `${path}.activeGalaxyIndex`,
      );

    const rawRecent =
      requireArray(
        value['recentGalaxyIndices'],
        `${path}.recentGalaxyIndices`,
      );

    const recentSet =
      new Set<string>();

    const recentGalaxyIndices =
      rawRecent.map(
        (
          item,
          index,
        ) => {
          const galaxyIndex =
            requireCanonicalNonNegativeLong(
              item,
              `${path}.recentGalaxyIndices[${index}]`,
            );

          if (
            recentSet.has(
              galaxyIndex,
            )
          ) {
            throw new GenesisBackupValidationError(
              `${path}.recentGalaxyIndices contains duplicate galaxyIndex ${galaxyIndex}.`,
            );
          }

          recentSet.add(
            galaxyIndex,
          );

          return galaxyIndex;
        },
      );

    return {
      activeGalaxyIndex,
      recentGalaxyIndices,

      updatedAtEpochMs:
        requireNonNegativeSafeInteger(
          value['updatedAtEpochMs'],
          `${path}.updatedAtEpochMs`,
        ),
    };
  }

  private validateGalaxy(
    input:
      unknown,

    path:
      string,

    galaxyIndices:
      Set<string>,
  ): GalaxyBackupEntry {

    const value =
      requireRecord(
        input,
        path,
      );

    requireExactKeys(
      value,
      [
        'galaxyIndex',
        'discoveryStateCode',
        'firstKnownAtEpochMs',
        'updatedAtEpochMs',
      ],
      path,
    );

    const galaxyIndex =
      requireCanonicalNonNegativeLong(
        value['galaxyIndex'],
        `${path}.galaxyIndex`,
      );

    if (
      galaxyIndices.has(
        galaxyIndex,
      )
    ) {
      throw new GenesisBackupValidationError(
        `${path}.galaxyIndex is duplicated: ${galaxyIndex}.`,
      );
    }

    galaxyIndices.add(
      galaxyIndex,
    );

    const discoveryStateCode =
      requireKnownDiscoveryStateCode(
        value['discoveryStateCode'],
        `${path}.discoveryStateCode`,
      );

    const firstKnownAtEpochMs =
      requireNonNegativeSafeInteger(
        value['firstKnownAtEpochMs'],
        `${path}.firstKnownAtEpochMs`,
      );

    const updatedAtEpochMs =
      requireNonNegativeSafeInteger(
        value['updatedAtEpochMs'],
        `${path}.updatedAtEpochMs`,
      );

    if (
      updatedAtEpochMs <
      firstKnownAtEpochMs
    ) {
      throw new GenesisBackupValidationError(
        `${path}.updatedAtEpochMs cannot precede firstKnownAtEpochMs.`,
      );
    }

    return {
      galaxyIndex,
      discoveryStateCode,
      firstKnownAtEpochMs,
      updatedAtEpochMs,
    };
  }

  private validateDiscovery(
    input:
      unknown,

    path:
      string,

    generationKey:
      UniverseGenerationKey,

    discoveryKeys:
      Set<string>,
  ): DiscoveryBackupEntry {

    const value =
      requireRecord(
        input,
        path,
      );

    requireExactKeys(
      value,
      [
        'targetTypeCode',
        'targetSeed',
        'galaxyIndex',
        'sectorKey',
        'galacticObjectIndex',
        'bodyIndex',
        'civilizationIndex',
        'discoveryStateCode',
        'firstKnownAtEpochMs',
        'updatedAtEpochMs',
      ],
      path,
    );

    const targetTypeCode =
      requireTargetTypeCode(
        value['targetTypeCode'],
        `${path}.targetTypeCode`,
      );

    const targetSeed =
      requireCanonicalTargetSeed(
        value['targetSeed'],
        `${path}.targetSeed`,
      );

    const key =
      `${targetTypeCode}|${targetSeed}`;

    if (
      discoveryKeys.has(
        key,
      )
    ) {
      throw new GenesisBackupValidationError(
        `${path} duplicates procedural target ${key}.`,
      );
    }

    discoveryKeys.add(
      key,
    );

    const discoveryStateCode =
      requireKnownDiscoveryStateCode(
        value['discoveryStateCode'],
        `${path}.discoveryStateCode`,
      );

    const galaxyIndex =
      requireString(
        value['galaxyIndex'],
        `${path}.galaxyIndex`,
      );

    const sectorKey =
      requireNullableString(
        value['sectorKey'],
        `${path}.sectorKey`,
      );

    const galacticObjectIndex =
      requireNullableString(
        value['galacticObjectIndex'],
        `${path}.galacticObjectIndex`,
      );

    const bodyIndex =
      requireNullableString(
        value['bodyIndex'],
        `${path}.bodyIndex`,
      );

    const civilizationIndex =
      requireNullableString(
        value['civilizationIndex'],
        `${path}.civilizationIndex`,
      );

    const firstKnownAtEpochMs =
      requireNonNegativeSafeInteger(
        value['firstKnownAtEpochMs'],
        `${path}.firstKnownAtEpochMs`,
      );

    const updatedAtEpochMs =
      requireNonNegativeSafeInteger(
        value['updatedAtEpochMs'],
        `${path}.updatedAtEpochMs`,
      );

    if (
      updatedAtEpochMs <
      firstKnownAtEpochMs
    ) {
      throw new GenesisBackupValidationError(
        `${path}.updatedAtEpochMs cannot precede firstKnownAtEpochMs.`,
      );
    }

    const temporaryEntity:
      DiscoveryEntity =
      {
        universeSeed:
          generationKey
            .universeSeed
            .serialize(),

        generatorVersionCode:
          generationKey
            .generatorVersion
            .code,

        targetTypeCode,

        targetSeed,

        galaxyIndex,
        sectorKey,
        galacticObjectIndex,
        bodyIndex,
        civilizationIndex,

        discoveryStateCode,

        firstKnownAtEpochMs,
        updatedAtEpochMs,
      };

    let locator:
      ProceduralLocator;

    try {
      locator =
        rehydrateDiscoveryLocator(
          temporaryEntity,
        );
    } catch {
      throw new GenesisBackupValidationError(
        `${path} contains invalid procedural lineage.`,
      );
    }

    const regeneratedTargetSeed =
      normalizeResolverTargetSeed(
        this.resolveTargetSeed(
          generationKey,
          locator,
        ),
        path,
      );

    if (
      regeneratedTargetSeed !==
      targetSeed
    ) {
      throw new GenesisBackupValidationError(
        `${path}.targetSeed does not match regenerated procedural identity.`,
      );
    }

    return {
      targetTypeCode,
      targetSeed,
      galaxyIndex,
      sectorKey,
      galacticObjectIndex,
      bodyIndex,
      civilizationIndex,
      discoveryStateCode,
      firstKnownAtEpochMs,
      updatedAtEpochMs,
    };
  }

  private validateObservation(
    input:
      unknown,

    path:
      string,

    observationIds:
      Set<string>,
  ): ObservationBackupEntry {

    const value =
      requireRecord(
        input,
        path,
      );

    requireExactKeys(
      value,
      [
        'id',
        'targetTypeCode',
        'targetSeed',
        'observationKind',
        'payloadVersion',
        'payloadJson',
        'observedAtEpochMs',
      ],
      path,
    );

    const id =
      requireNonBlankString(
        value['id'],
        `${path}.id`,
      );

    if (
      observationIds.has(
        id,
      )
    ) {
      throw new GenesisBackupValidationError(
        `Duplicate observation id: '${id}'.`,
      );
    }

    observationIds.add(
      id,
    );

    const payloadJson =
      requireString(
        value['payloadJson'],
        `${path}.payloadJson`,
      );

    try {
      JSON.parse(
        payloadJson,
      );
    } catch {
      throw new GenesisBackupValidationError(
        `${path}.payloadJson is not valid JSON.`,
      );
    }

    return {
      id,

      targetTypeCode:
        requireTargetTypeCode(
          value['targetTypeCode'],
          `${path}.targetTypeCode`,
        ),

      targetSeed:
        requireCanonicalTargetSeed(
          value['targetSeed'],
          `${path}.targetSeed`,
        ),

      observationKind:
        requireNonBlankString(
          value['observationKind'],
          `${path}.observationKind`,
        ),

      payloadVersion:
        requirePositiveSafeInteger(
          value['payloadVersion'],
          `${path}.payloadVersion`,
        ),

      payloadJson,

      observedAtEpochMs:
        requireNonNegativeSafeInteger(
          value['observedAtEpochMs'],
          `${path}.observedAtEpochMs`,
        ),
    };
  }

  private validateProgress(
    input:
      unknown,

    path:
      string,

    progressKeys:
      Set<string>,
  ): ProgressBackupEntry {

    const value =
      requireRecord(
        input,
        path,
      );

    requireExactKeys(
      value,
      [
        'scopeCode',
        'scopeKey',
        'galaxyIndex',
        'discoveryPoints',
        'updatedAtEpochMs',
      ],
      path,
    );

    const scopeCode =
      requireInteger(
        value['scopeCode'],
        `${path}.scopeCode`,
      );

    const scopeKey =
      requireString(
        value['scopeKey'],
        `${path}.scopeKey`,
      );

    const discoveryPoints =
      requireCanonicalNonNegativeLong(
        value['discoveryPoints'],
        `${path}.discoveryPoints`,
      );

    let galaxyIndex:
      string | null;

    switch (
      scopeCode
    ) {
      case ProgressScopeCode.GLOBAL:
        if (
          scopeKey !==
          GLOBAL_PROGRESS_SCOPE_KEY
        ) {
          throw new GenesisBackupValidationError(
            `${path}.scopeKey must be GLOBAL for global progress.`,
          );
        }

        if (
          value['galaxyIndex'] !==
          null
        ) {
          throw new GenesisBackupValidationError(
            `${path}.galaxyIndex must be null for global progress.`,
          );
        }

        galaxyIndex =
          null;

        break;

      case ProgressScopeCode.GALAXY:
        galaxyIndex =
          requireCanonicalNonNegativeLong(
            value['galaxyIndex'],
            `${path}.galaxyIndex`,
          );

        if (
          scopeKey !==
          galaxyIndex
        ) {
          throw new GenesisBackupValidationError(
            `${path}.scopeKey must equal galaxyIndex for galaxy progress.`,
          );
        }

        break;

      default:
        throw new GenesisBackupValidationError(
          `${path}.scopeCode is invalid: ${scopeCode}.`,
        );
    }

    const key =
      `${scopeCode}|${scopeKey}`;

    if (
      progressKeys.has(
        key,
      )
    ) {
      throw new GenesisBackupValidationError(
        `${path} duplicates progress scope ${key}.`,
      );
    }

    progressKeys.add(
      key,
    );

    return {
      scopeCode,
      scopeKey,
      galaxyIndex,
      discoveryPoints,

      updatedAtEpochMs:
        requireNonNegativeSafeInteger(
          value['updatedAtEpochMs'],
          `${path}.updatedAtEpochMs`,
        ),
    };
  }
}

function requireRecord(
  value:
    unknown,

  path:
    string,
): Record<string, unknown> {

  if (
    typeof value !==
      'object' ||
    value ===
      null ||
    Array.isArray(
      value,
    )
  ) {
    throw new GenesisBackupValidationError(
      `${path} must be an object.`,
    );
  }

  return value as
    Record<string, unknown>;
}

function requireArray(
  value:
    unknown,

  path:
    string,
): readonly unknown[] {

  if (
    !Array.isArray(
      value,
    )
  ) {
    throw new GenesisBackupValidationError(
      `${path} must be an array.`,
    );
  }

  return value;
}

function requireExactKeys(
  value:
    Record<string, unknown>,

  expectedKeys:
    readonly string[],

  path:
    string,
): void {

  const actual =
    Object.keys(
      value,
    )
      .sort();

  const expected =
    [
      ...expectedKeys,
    ]
      .sort();

  if (
    actual.length !==
      expected.length ||
    actual.some(
      (
        key,
        index,
      ) =>
        key !==
        expected[index],
    )
  ) {
    throw new GenesisBackupValidationError(
      `${path} contains missing or unexpected fields.`,
    );
  }
}

function requireString(
  value:
    unknown,

  path:
    string,
): string {

  if (
    typeof value !==
    'string'
  ) {
    throw new GenesisBackupValidationError(
      `${path} must be a string.`,
    );
  }

  return value;
}

function requireNonBlankString(
  value:
    unknown,

  path:
    string,
): string {

  const result =
    requireString(
      value,
      path,
    );

  if (
    result.trim()
      .length ===
    0
  ) {
    throw new GenesisBackupValidationError(
      `${path} cannot be blank.`,
    );
  }

  return result;
}

function requireNullableString(
  value:
    unknown,

  path:
    string,
): string | null {

  if (
    value ===
    null
  ) {
    return null;
  }

  return requireString(
    value,
    path,
  );
}

function requireInteger(
  value:
    unknown,

  path:
    string,
): number {

  if (
    typeof value !==
      'number' ||
    !Number.isSafeInteger(
      value,
    )
  ) {
    throw new GenesisBackupValidationError(
      `${path} must be a safe integer.`,
    );
  }

  return value;
}

function requireNonNegativeSafeInteger(
  value:
    unknown,

  path:
    string,
): number {

  const result =
    requireInteger(
      value,
      path,
    );

  if (
    result < 0
  ) {
    throw new GenesisBackupValidationError(
      `${path} must be non-negative.`,
    );
  }

  return result;
}

function requirePositiveSafeInteger(
  value:
    unknown,

  path:
    string,
): number {

  const result =
    requireInteger(
      value,
      path,
    );

  if (
    result <= 0
  ) {
    throw new GenesisBackupValidationError(
      `${path} must be positive.`,
    );
  }

  return result;
}

function requireCanonicalNonNegativeLong(
  value:
    unknown,

  path:
    string,
): string {

  const result =
    requireString(
      value,
      path,
    );

  try {
    parseNonNegativeLongDecimal(
      result,
      path,
    );
  } catch {
    throw new GenesisBackupValidationError(
      `${path} must be a canonical non-negative signed Long.`,
    );
  }

  return result;
}

function requireKnownDiscoveryStateCode(
  value:
    unknown,

  path:
    string,
): 1 | 2 | 3 | 4 | 5 {

  const code =
    requireInteger(
      value,
      path,
    );

  const state =
    DiscoveryState
      .fromCodeOrNull(
        code,
      );

  if (
    state ===
      null ||
    !DiscoveryState.isKnown(
      state,
    )
  ) {
    throw new GenesisBackupValidationError(
      `${path} must contain a known DiscoveryState code.`,
    );
  }

  return state.code;
}

function requireTargetTypeCode(
  value:
    unknown,

  path:
    string,
): 1 | 2 | 3 | 4 | 5 | 6 {

  const code =
    requireInteger(
      value,
      path,
    );

  const targetType =
    DiscoveryTargetType
      .fromCodeOrNull(
        code,
      );

  if (
    targetType ===
    null
  ) {
    throw new GenesisBackupValidationError(
      `${path} contains an unknown DiscoveryTargetType code.`,
    );
  }

  return targetType.code;
}

function requireCanonicalTargetSeed(
  value:
    unknown,

  path:
    string,
): string {

  const result =
    requireString(
      value,
      path,
    );

  if (
    !TARGET_SEED_PATTERN
      .test(
        result,
      )
  ) {
    throw new GenesisBackupValidationError(
      `${path} must contain exactly 32 uppercase hexadecimal characters.`,
    );
  }

  return result;
}

function normalizeResolverTargetSeed(
  value:
    string,

  path:
    string,
): string {

  const normalized =
    value
      .replaceAll(
        '-',
        '',
      )
      .toUpperCase();

  if (
    !TARGET_SEED_PATTERN
      .test(
        normalized,
      )
  ) {
    throw new GenesisBackupValidationError(
      `${path} resolver produced an invalid targetSeed.`,
    );
  }

  return normalized;
}