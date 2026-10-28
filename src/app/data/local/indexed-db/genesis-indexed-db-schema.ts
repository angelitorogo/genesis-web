export const GENESIS_INDEXED_DB_SCHEMA_VERSION_V1 =
  1;

export const GENESIS_INDEXED_DB_SCHEMA_VERSION_V2 =
  2;

export const GENESIS_INDEXED_DB_SCHEMA_VERSION_V3 =
  3;

export const GENESIS_INDEXED_DB_SCHEMA_VERSION_V4 =
  4;

export const GENESIS_INDEXED_DB_SCHEMA_VERSION_V5 = 5;

export const GENESIS_INDEXED_DB_SCHEMA_VERSION_V6 = 6;

export const GENESIS_INDEXED_DB_SCHEMA_VERSION_V7 = 7;

export const GENESIS_INDEXED_DB_SCHEMA_VERSION_V8 = 8;
export const GENESIS_INDEXED_DB_SCHEMA_VERSION_V9 = 9;
export const GENESIS_INDEXED_DB_SCHEMA_VERSION_V10 = 10;

export const GENESIS_INDEXED_DB_SCHEMA_VERSION =
  GENESIS_INDEXED_DB_SCHEMA_VERSION_V10;

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
export const GENESIS_INDEXED_DB_V4_STORES =
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

/** 33.F.3a: private Ground Truth in the same transactional universe database. */
export const GENESIS_INDEXED_DB_STORES = Object.freeze({
  ...GENESIS_INDEXED_DB_V4_STORES,
  privateBiospheres: [
    '[universeSeed+generatorVersionCode+bodyStorageKey]',
    '[universeSeed+generatorVersionCode]',
    'bodyStorageKey',
  ].join(', '),
});

/** V6: additive *private* per-system diagnostic. NOT an observed knowledge table. */
export const GENESIS_INDEXED_DB_V6_STORES = Object.freeze({
  ...GENESIS_INDEXED_DB_STORES,
  privateBiosphereAudits: [
    '[universeSeed+generatorVersionCode+systemStorageKey]',
    '[universeSeed+generatorVersionCode]',
    'policyRevision',
  ].join(', '),
});

/** VIDA.0: removes 33.F private stores, preserving all gameplay/knowledge tables. */
export const GENESIS_INDEXED_DB_V7_STORES = Object.freeze({
  ...GENESIS_INDEXED_DB_V4_STORES,
  privateBiospheres: null,
  privateBiosphereAudits: null,
});


/** VIDA.3 — new private, immutable microbial Ground Truth. Not a catalogue. */
export const GENESIS_INDEXED_DB_V8_STORES = Object.freeze({
  ...GENESIS_INDEXED_DB_V7_STORES,
  privateMicrobialBiospheres: '[universeSeed+generatorVersionCode+bodyStorageKey], [universeSeed+generatorVersionCode]',
});

/** VIDA.4: additive, private ecological snapshots. Microbial V8 remains intact. */
export const GENESIS_INDEXED_DB_V9_STORES = Object.freeze({
  ...GENESIS_INDEXED_DB_V8_STORES,
  privateEcologicalBiospheres: '[universeSeed+generatorVersionCode+bodyStorageKey], [universeSeed+generatorVersionCode]',
});

/** VIDA.9: independent immutable CT-0 biological records. Additive upgrade from V9. */
export const GENESIS_INDEXED_DB_V10_STORES = Object.freeze({
  ...GENESIS_INDEXED_DB_V9_STORES,
  privateBiologicalRecordsVIDA9: '[universeSeed+generatorVersionCode+bodyStorageKey], [universeSeed+generatorVersionCode+systemStorageKey]',
});
