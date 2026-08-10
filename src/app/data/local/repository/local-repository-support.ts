import {
  GeneratorVersion,
} from '../../../domain/generation/generator-version';

import {
  BodyLocator,
  CivilizationLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  type ProceduralLocator,
  SectorLocator,
  SystemLocator,
} from '../../../domain/generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';

import {
  UniverseNotFoundError,
} from '../../../domain/repository/genesis-repositories';

import {
  UniverseSeed,
} from '../../../domain/universe/universe-seed';

import {
  type UniverseEntity,
} from '../entity/universe.entity';

import {
  type GenesisIndexedDb,
} from '../indexed-db/genesis-indexed-db';

const SIGNED_LONG_MAX =
  (1n << 63n) - 1n;

const TARGET_SEED_PATTERN =
  /^[0-9A-F]{32}$/;

export class CorruptLocalDataError
  extends Error {

  constructor(
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      'CorruptLocalDataError';
  }
}

export function generationKeyStorageParts(
  generationKey:
    UniverseGenerationKey,
): {
  readonly universeSeed:
    string;

  readonly generatorVersionCode:
    number;
} {
  return {
    universeSeed:
      generationKey
        .universeSeed
        .serialize(),

    generatorVersionCode:
      generationKey
        .generatorVersion
        .code,
  };
}

export async function ensureUniverseExists(
  database:
    GenesisIndexedDb,

  generationKey:
    UniverseGenerationKey,
): Promise<void> {

  await database
    .openDatabase();

  const {
    universeSeed,
    generatorVersionCode,
  } =
    generationKeyStorageParts(
      generationKey,
    );

  const entity =
    await database
      .universes
      .get([
        universeSeed,
        generatorVersionCode,
      ]);

  if (
    entity ===
    undefined
  ) {
    throw new UniverseNotFoundError(
      generationKey,
    );
  }
}

export function assertNonNegativeLong(
  value:
    bigint,

  name:
    string,
): void {

  if (
    value < 0n ||
    value > SIGNED_LONG_MAX
  ) {
    throw new RangeError(
      `${name} must belong to the non-negative signed Long range.`,
    );
  }
}

export function parseNonNegativeLongDecimal(
  value:
    string,

  name:
    string,
): bigint {

  if (
    !/^(0|[1-9][0-9]*)$/
      .test(
        value,
      )
  ) {
    throw new CorruptLocalDataError(
      `${name} is not a canonical non-negative decimal Long.`,
    );
  }

  const parsed =
    BigInt(
        value,
    );

  if (
    parsed < 0n ||
    parsed > SIGNED_LONG_MAX
  ) {
    throw new CorruptLocalDataError(
      `${name} is outside the non-negative signed Long range.`,
    );
  }

  return parsed;
}

export function universeEntityToGenerationKey(
  entity:
    UniverseEntity,
): UniverseGenerationKey {

  let universeSeed:
    UniverseSeed;

  try {
    universeSeed =
      UniverseSeed.parse(
        entity.universeSeed,
      );
  } catch {
    throw new CorruptLocalDataError(
      `Invalid persisted universeSeed: '${entity.universeSeed}'.`,
    );
  }

  let generatorVersion:
    typeof GeneratorVersion.V1;

  switch (
    entity.generatorVersionCode
  ) {
    case 1:
      generatorVersion =
        GeneratorVersion.V1;

      break;

    default:
      throw new CorruptLocalDataError(
        `Unknown persisted generatorVersionCode: ${entity.generatorVersionCode}.`,
      );
  }

  return new UniverseGenerationKey(
    universeSeed,
    generatorVersion,
  );
}

export function normalizeTargetSeed(
  value:
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
    throw new CorruptLocalDataError(
      `Invalid procedural targetSeed: '${value}'.`,
    );
  }

  return normalized;
}

export function proceduralLocatorsEqual(
  left:
    ProceduralLocator,

  right:
    ProceduralLocator,
): boolean {

  if (
    left instanceof GalaxyLocator &&
    right instanceof GalaxyLocator
  ) {
    return (
      left.galaxyIndex ===
      right.galaxyIndex
    );
  }

  if (
    left instanceof SectorLocator &&
    right instanceof SectorLocator
  ) {
    return (
      left.galaxyIndex ===
        right.galaxyIndex &&
      left.sectorKey ===
        right.sectorKey
    );
  }

  if (
    left instanceof GalacticObjectLocator &&
    right instanceof GalacticObjectLocator
  ) {
    return (
      left.galaxyIndex ===
        right.galaxyIndex &&
      left.sectorKey ===
        right.sectorKey &&
      left.galacticObjectIndex ===
        right.galacticObjectIndex
    );
  }

  if (
    left instanceof SystemLocator &&
    right instanceof SystemLocator
  ) {
    return (
      left.galaxyIndex ===
        right.galaxyIndex &&
      left.sectorKey ===
        right.sectorKey &&
      left.galacticObjectIndex ===
        right.galacticObjectIndex
    );
  }

  if (
    left instanceof BodyLocator &&
    right instanceof BodyLocator
  ) {
    return (
      left.galaxyIndex ===
        right.galaxyIndex &&
      left.sectorKey ===
        right.sectorKey &&
      left.galacticObjectIndex ===
        right.galacticObjectIndex &&
      left.bodyIndex ===
        right.bodyIndex
    );
  }

  if (
    left instanceof CivilizationLocator &&
    right instanceof CivilizationLocator
  ) {
    return (
      left.galaxyIndex ===
        right.galaxyIndex &&
      left.sectorKey ===
        right.sectorKey &&
      left.galacticObjectIndex ===
        right.galacticObjectIndex &&
      left.bodyIndex ===
        right.bodyIndex &&
      left.civilizationIndex ===
        right.civilizationIndex
    );
  }

  return false;
}