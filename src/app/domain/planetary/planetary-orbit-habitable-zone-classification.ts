import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetaryOrbitHabitableZoneRelation,
} from './planetary-orbit-habitable-zone-relation';

/**
 * Point-18.7 classification of one frozen point-18.3 orbit against the
 * point-18.6 habitable-zone geometry.
 *
 * radiativeRelation is always present because point 18.6 always exposes the
 * conservative radiative reference interval. dynamicallyAvailableRelation is
 * null only when a multiple-star host has no dynamically available part of that
 * interval. For SINGLE systems both relations are intentionally identical.
 */
export class PlanetaryOrbitHabitableZoneClassification {

  constructor(
    readonly planetOrdinal:
      number,

    readonly bodyLocator:
      BodyLocator,

    readonly bodySeed:
      BodySeed,

    readonly sourcePeriastronAu:
      number,

    readonly sourceApoastronAu:
      number,

    readonly radiativeRelation:
      PlanetaryOrbitHabitableZoneRelation,

    readonly dynamicallyAvailableRelation:
      PlanetaryOrbitHabitableZoneRelation | null,
  ) {
    if (
      !Number.isInteger(
        planetOrdinal,
      ) ||
      planetOrdinal <=
        0
    ) {
      throw new RangeError(
        'planetOrdinal must be a positive integer.',
      );
    }

    if (
      bodyLocator.bodyIndex !==
      BigInt(
        planetOrdinal -
          1,
      )
    ) {
      throw new RangeError(
        'Point-18.7 classification must use the BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      bodySeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'PlanetaryOrbitHabitableZoneClassification requires a BodySeed.',
      );
    }

    assertPositiveFinite(
      sourcePeriastronAu,
      'sourcePeriastronAu',
    );

    assertPositiveFinite(
      sourceApoastronAu,
      'sourceApoastronAu',
    );

    if (
      sourceApoastronAu <
      sourcePeriastronAu
    ) {
      throw new RangeError(
        'sourceApoastronAu must be greater than or equal to sourcePeriastronAu.',
      );
    }

    assertRelation(
      radiativeRelation,
      'radiativeRelation',
    );

    if (
      dynamicallyAvailableRelation !==
      null
    ) {
      assertRelation(
        dynamicallyAvailableRelation,
        'dynamicallyAvailableRelation',
      );
    }
  }

  get intersectsRadiativeHabitableZone():
    boolean {

    return relationIntersectsZone(
      this.radiativeRelation,
    );
  }

  get intersectsDynamicallyAvailableHabitableZone():
    boolean {

    return (
      this.dynamicallyAvailableRelation !==
        null &&
      relationIntersectsZone(
        this.dynamicallyAvailableRelation,
      )
    );
  }

  get isWhollyWithinDynamicallyAvailableHabitableZone():
    boolean {

    return this.dynamicallyAvailableRelation ===
      PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE;
  }
}

function relationIntersectsZone(
  relation:
    PlanetaryOrbitHabitableZoneRelation,
): boolean {

  return (
    relation !==
      PlanetaryOrbitHabitableZoneRelation.WHOLLY_INTERIOR_TO_ZONE &&
    relation !==
      PlanetaryOrbitHabitableZoneRelation.WHOLLY_EXTERIOR_TO_ZONE
  );
}

function assertRelation(
  value:
    PlanetaryOrbitHabitableZoneRelation,

  propertyName:
    string,
): void {

  if (
    !Object.values(
      PlanetaryOrbitHabitableZoneRelation,
    ).includes(
      value,
    )
  ) {
    throw new RangeError(
      `${propertyName} must be a known PlanetaryOrbitHabitableZoneRelation.`,
    );
  }
}

function assertPositiveFinite(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and greater than 0: ${value}.`,
    );
  }
}
