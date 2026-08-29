import {
  type SystemLocator,
} from '../generation/procedural-locator';

import {
  PlanetaryOrbitHabitableZoneClassification,
} from './planetary-orbit-habitable-zone-classification';

import {
  PlanetaryOrbitHabitableZoneRelation,
} from './planetary-orbit-habitable-zone-relation';

import {
  PlanetarySystemOrbitTopology,
} from './planetary-system-orbit-topology';

/**
 * Point-18.7 ordered orbit-to-habitable-zone classification set.
 *
 * It is deliberately descriptive rather than corrective: no orbit is moved or
 * removed here, and no point-18.5 stability result is overwritten. A system may
 * therefore contain an orbit geometrically intersecting the HZ while its
 * separate basic stability assessment is MARGINAL/UNSTABLE.
 */
export class PlanetarySystemHabitableZoneClassification {

  readonly orbitClassifications:
    readonly PlanetaryOrbitHabitableZoneClassification[];

  constructor(
    readonly systemLocator:
      SystemLocator,

    readonly orbitTopology:
      PlanetarySystemOrbitTopology,

    readonly planetCount:
      number,

    readonly hasDynamicallyAvailableHabitableZone:
      boolean,

    orbitClassifications:
      readonly PlanetaryOrbitHabitableZoneClassification[],
  ) {
    if (
      !Object.values(
        PlanetarySystemOrbitTopology,
      ).includes(
        orbitTopology,
      )
    ) {
      throw new RangeError(
        'orbitTopology must be a known PlanetarySystemOrbitTopology.',
      );
    }

    if (
      !Number.isInteger(
        planetCount,
      ) ||
      planetCount <
        0
    ) {
      throw new RangeError(
        'planetCount must be a non-negative integer.',
      );
    }

    if (
      orbitClassifications.length !==
      planetCount
    ) {
      throw new RangeError(
        'Point-18.7 requires exactly one habitable-zone classification per mature planet orbit.',
      );
    }

    for (
      let index = 0;
      index <
        orbitClassifications.length;
      index += 1
    ) {
      const classification =
        orbitClassifications[index];

      if (
        classification.planetOrdinal !==
        index +
          1
      ) {
        throw new RangeError(
          'Point-18.7 orbit classifications must be contiguous and ordered by planetOrdinal.',
        );
      }

      if (
        !sameSystemLocator(
          systemLocator,
          classification.bodyLocator,
        )
      ) {
        throw new RangeError(
          'Every point-18.7 classification must belong to the classification SystemLocator.',
        );
      }

      if (
        hasDynamicallyAvailableHabitableZone !==
        (
          classification.dynamicallyAvailableRelation !==
          null
        )
      ) {
        throw new RangeError(
          'Point-18.7 dynamic relations must exist if and only if the point-18.6 dynamically available HZ exists.',
        );
      }
    }

    this.orbitClassifications =
      Object.freeze([
        ...orbitClassifications,
      ]);
  }

  get dynamicallyIntersectingOrbitCount():
    number {

    return this
      .orbitClassifications
      .filter(
        classification =>
          classification
            .intersectsDynamicallyAvailableHabitableZone,
      )
      .length;
  }

  get whollyWithinDynamicallyAvailableOrbitCount():
    number {

    return this
      .orbitClassifications
      .filter(
        classification =>
          classification
            .dynamicallyAvailableRelation ===
          PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
      )
      .length;
  }

  get hasOrbitIntersectingDynamicallyAvailableHabitableZone():
    boolean {

    return this
      .dynamicallyIntersectingOrbitCount >
      0;
  }
}

function sameSystemLocator(
  systemLocator:
    SystemLocator,

  bodyLocator:
    PlanetaryOrbitHabitableZoneClassification['bodyLocator'],
): boolean {

  return (
    systemLocator.galaxyIndex ===
      bodyLocator.galaxyIndex &&
    systemLocator.sectorKey ===
      bodyLocator.sectorKey &&
    systemLocator.galacticObjectIndex ===
      bodyLocator.galacticObjectIndex
  );
}
