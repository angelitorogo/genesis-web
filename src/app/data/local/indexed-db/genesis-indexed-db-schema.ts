export const GENESIS_INDEXED_DB_SCHEMA_VERSION_V1 =
  1;

export const GENESIS_INDEXED_DB_SCHEMA_VERSION_V2 =
  2;

export const GENESIS_INDEXED_DB_SCHEMA_VERSION_V3 =
  3;

export const GENESIS_INDEXED_DB_SCHEMA_VERSION_V4 =
  4;

export const GENESIS_INDEXED_DB_SCHEMA_VERSION =
  GENESIS_INDEXED_DB_SCHEMA_VERSION_V4;

export const GENESIS_STORAGE_FORMAT_VERSION =
  1;

export const GENESIS_INDEXED_DB_V1_STORES =
  Object.freeze({
    metadata:
      'key',

    universes:
      [
        '[universeSeed+generatorVersionCode]',
        'createdAtEpochMs',
        'updatedAtEpochMs',
      ].join(', '),

    galaxies:
      [
        '[universeSeed+generatorVersionCode+galaxyIndex]',
        '[universeSeed+generatorVersionCode]',
        'galaxyIndex',
        'discoveryStateCode',
        'updatedAtEpochMs',
      ].join(', '),

    discoveries:
      [
        '[universeSeed+generatorVersionCode+targetTypeCode+targetSeed]',
        '[universeSeed+generatorVersionCode]',
        '[universeSeed+generatorVersionCode+galaxyIndex]',
        '[universeSeed+generatorVersionCode+galaxyIndex+sectorKey]',
        'targetTypeCode',
        'discoveryStateCode',
        'updatedAtEpochMs',
      ].join(', '),

    observations:
      [
        'id',
        '[universeSeed+generatorVersionCode]',
        '[universeSeed+generatorVersionCode+targetTypeCode+targetSeed]',
        'observationKind',
        'observedAtEpochMs',
      ].join(', '),

    progress:
      [
        '[universeSeed+generatorVersionCode+scopeCode+scopeKey]',
        '[universeSeed+generatorVersionCode]',
        'scopeCode',
        'galaxyIndex',
        'updatedAtEpochMs',
      ].join(', '),
  });

export const GENESIS_INDEXED_DB_V2_STORES =
  Object.freeze({
    ...GENESIS_INDEXED_DB_V1_STORES,

    navigation:
      [
        '[universeSeed+generatorVersionCode]',
        'activeGalaxyIndex',
        'updatedAtEpochMs',
      ].join(', '),
  });

export const GENESIS_INDEXED_DB_V3_STORES =
  Object.freeze({
    ...GENESIS_INDEXED_DB_V2_STORES,

    discoveries:
      [
        '[universeSeed+generatorVersionCode+targetTypeCode+targetSeed]',
        '[universeSeed+generatorVersionCode]',
        '[universeSeed+generatorVersionCode+galaxyIndex]',
        '[universeSeed+generatorVersionCode+galaxyIndex+sectorKey]',
        '[universeSeed+generatorVersionCode+galaxyIndex+sectorX+sectorY]',
        'targetTypeCode',
        'discoveryStateCode',
        'updatedAtEpochMs',
      ].join(', '),
  });

/**
 * Current schema V4.
 *
 * The new store is a derived, rebuildable read-model cache. It never becomes
 * Ground Truth and remains outside backup format V1.
 */
export const GENESIS_INDEXED_DB_STORES =
  Object.freeze({
    ...GENESIS_INDEXED_DB_V3_STORES,

    galaxyKnowledgeSnapshots:
      [
        '[universeSeed+generatorVersionCode+galaxyIndex+scientificModelVersion]',
        '[universeSeed+generatorVersionCode]',
        '[universeSeed+generatorVersionCode+galaxyIndex]',
        'scientificModelVersion',
        'updatedAtEpochMs',
      ].join(', '),
  });
