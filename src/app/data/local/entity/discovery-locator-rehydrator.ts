import {
  DiscoveryTargetType,
} from '../../../domain/discovery/discovery-target-type';

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
  type DiscoveryEntity,
} from './discovery.entity';

const LONG_MIN =
  -(1n << 63n);

const LONG_MAX =
  (1n << 63n) - 1n;

export class CorruptDiscoveryLineageError
  extends Error {

  constructor(
    message: string,
  ) {
    super(
      message,
    );

    this.name =
      'CorruptDiscoveryLineageError';
  }
}

export function rehydrateDiscoveryLocator(
  entity:
    DiscoveryEntity,
): ProceduralLocator {

  const targetType =
    DiscoveryTargetType
      .fromCodeOrNull(
        entity.targetTypeCode,
      );

  if (
    targetType ===
    null
  ) {
    throw new CorruptDiscoveryLineageError(
      `Unknown targetTypeCode: ${entity.targetTypeCode}`,
    );
  }

  const galaxyIndex =
    parseNonNegativeLong(
      entity.galaxyIndex,
      'galaxyIndex',
    );

  switch (
    targetType.name
  ) {
    case 'GALAXY':
      requireNull(
        entity.sectorKey,
        'sectorKey',
      );

      requireNull(
        entity.galacticObjectIndex,
        'galacticObjectIndex',
      );

      requireNull(
        entity.bodyIndex,
        'bodyIndex',
      );

      requireNull(
        entity.civilizationIndex,
        'civilizationIndex',
      );

      return new GalaxyLocator(
        galaxyIndex,
      );

    case 'SECTOR': {
      const sectorKey =
        parseSignedLong(
          requireValue(
            entity.sectorKey,
            'sectorKey',
          ),
          'sectorKey',
        );

      requireNull(
        entity.galacticObjectIndex,
        'galacticObjectIndex',
      );

      requireNull(
        entity.bodyIndex,
        'bodyIndex',
      );

      requireNull(
        entity.civilizationIndex,
        'civilizationIndex',
      );

      return new SectorLocator(
        galaxyIndex,
        sectorKey,
      );
    }

    case 'GALACTIC_OBJECT': {
      const sectorKey =
        parseSignedLong(
          requireValue(
            entity.sectorKey,
            'sectorKey',
          ),
          'sectorKey',
        );

      const objectIndex =
        parseNonNegativeLong(
          requireValue(
            entity.galacticObjectIndex,
            'galacticObjectIndex',
          ),
          'galacticObjectIndex',
        );

      requireNull(
        entity.bodyIndex,
        'bodyIndex',
      );

      requireNull(
        entity.civilizationIndex,
        'civilizationIndex',
      );

      return new GalacticObjectLocator(
        galaxyIndex,
        sectorKey,
        objectIndex,
      );
    }

    case 'SYSTEM': {
      const sectorKey =
        parseSignedLong(
          requireValue(
            entity.sectorKey,
            'sectorKey',
          ),
          'sectorKey',
        );

      const objectIndex =
        parseNonNegativeLong(
          requireValue(
            entity.galacticObjectIndex,
            'galacticObjectIndex',
          ),
          'galacticObjectIndex',
        );

      requireNull(
        entity.bodyIndex,
        'bodyIndex',
      );

      requireNull(
        entity.civilizationIndex,
        'civilizationIndex',
      );

      return new SystemLocator(
        galaxyIndex,
        sectorKey,
        objectIndex,
      );
    }

    case 'BODY': {
      const sectorKey =
        parseSignedLong(
          requireValue(
            entity.sectorKey,
            'sectorKey',
          ),
          'sectorKey',
        );

      const objectIndex =
        parseNonNegativeLong(
          requireValue(
            entity.galacticObjectIndex,
            'galacticObjectIndex',
          ),
          'galacticObjectIndex',
        );

      const bodyIndex =
        parseNonNegativeLong(
          requireValue(
            entity.bodyIndex,
            'bodyIndex',
          ),
          'bodyIndex',
        );

      requireNull(
        entity.civilizationIndex,
        'civilizationIndex',
      );

      return new BodyLocator(
        galaxyIndex,
        sectorKey,
        objectIndex,
        bodyIndex,
      );
    }

    case 'CIVILIZATION': {
      const sectorKey =
        parseSignedLong(
          requireValue(
            entity.sectorKey,
            'sectorKey',
          ),
          'sectorKey',
        );

      const objectIndex =
        parseNonNegativeLong(
          requireValue(
            entity.galacticObjectIndex,
            'galacticObjectIndex',
          ),
          'galacticObjectIndex',
        );

      const bodyIndex =
        parseNonNegativeLong(
          requireValue(
            entity.bodyIndex,
            'bodyIndex',
          ),
          'bodyIndex',
        );

      const civilizationIndex =
        parseNonNegativeLong(
          requireValue(
            entity.civilizationIndex,
            'civilizationIndex',
          ),
          'civilizationIndex',
        );

      return new CivilizationLocator(
        galaxyIndex,
        sectorKey,
        objectIndex,
        bodyIndex,
        civilizationIndex,
      );
    }
  }
}

function requireValue(
  value:
    string | null,

  name:
    string,
): string {

  if (
    value ===
    null
  ) {
    throw new CorruptDiscoveryLineageError(
      `${name} is required for this target type.`,
    );
  }

  return value;
}

function requireNull(
  value:
    string | null,

  name:
    string,
): void {

  if (
    value !==
    null
  ) {
    throw new CorruptDiscoveryLineageError(
      `${name} must be null for this target type.`,
    );
  }
}

function parseNonNegativeLong(
  value:
    string,

  name:
    string,
): bigint {

  const parsed =
    parseSignedLong(
      value,
      name,
    );

  if (
    parsed < 0n
  ) {
    throw new CorruptDiscoveryLineageError(
      `${name} must be non-negative.`,
    );
  }

  return parsed;
}

function parseSignedLong(
  value:
    string,

  name:
    string,
): bigint {

  let parsed:
    bigint;

  try {
    parsed =
      BigInt(
        value,
      );
  } catch {
    throw new CorruptDiscoveryLineageError(
      `${name} is not a valid decimal Long.`,
    );
  }

  if (
    parsed < LONG_MIN ||
    parsed > LONG_MAX
  ) {
    throw new CorruptDiscoveryLineageError(
      `${name} is outside the signed Long range.`,
    );
  }

  if (
    parsed.toString(
      10,
    ) !==
    value
  ) {
    throw new CorruptDiscoveryLineageError(
      `${name} is not in canonical decimal form.`,
    );
  }

  return parsed;
}