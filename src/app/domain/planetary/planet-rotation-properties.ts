import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-19.3 rotational state for one mature physical Planet.
 *
 * rotationPeriodHours is the sidereal spin period magnitude. axialTiltDegrees
 * is the obliquity relative to the orbital normal; values above 90 degrees are
 * therefore retrograde rotation. dayLengthHours is the apparent solar-day
 * magnitude. It is null only for exact prograde synchronous rotation because
 * the substellar longitude is then fixed and no finite solar day exists.
 *
 * Point 19.3 deliberately does not classify a planet type or model atmospheric,
 * tidal-heating or satellite effects. Those remain later-roadmap concerns.
 */
export class PlanetRotationProperties {

  constructor(
    readonly planetOrdinal:
      number,

    readonly bodyLocator:
      BodyLocator,

    readonly bodySeed:
      BodySeed,

    readonly sourceOrbitalPeriodHours:
      number,

    readonly rotationPeriodHours:
      number,

    readonly dayLengthHours:
      number | null,

    readonly axialTiltDegrees:
      number,
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
        'Point-19.3 rotation properties must use the BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      bodySeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'PlanetRotationProperties requires a BodySeed.',
      );
    }

    assertPositiveFinite(
      sourceOrbitalPeriodHours,
      'sourceOrbitalPeriodHours',
    );

    assertPositiveFinite(
      rotationPeriodHours,
      'rotationPeriodHours',
    );

    if (
      !Number.isFinite(
        axialTiltDegrees,
      ) ||
      axialTiltDegrees <
        0 ||
      axialTiltDegrees >
        180
    ) {
      throw new RangeError(
        `axialTiltDegrees must be finite and in [0, 180]: ${axialTiltDegrees}.`,
      );
    }

    const expectedDayLengthHours =
      apparentSolarDayHours(
        rotationPeriodHours,
        sourceOrbitalPeriodHours,
        axialTiltDegrees >
          90,
      );

    if (
      expectedDayLengthHours ===
      null
    ) {
      if (
        dayLengthHours !==
        null
      ) {
        throw new RangeError(
          'Exact prograde synchronous rotation has no finite solar day and requires dayLengthHours = null.',
        );
      }
    } else {
      if (
        dayLengthHours ===
          null ||
        !approximatelyEqual(
          dayLengthHours,
          expectedDayLengthHours,
        )
      ) {
        throw new RangeError(
          'dayLengthHours must match the point-19.3 sidereal/orbital beat period.',
        );
      }
    }
  }

  get isRetrograde():
    boolean {

    return (
      this
        .axialTiltDegrees >
      90
    );
  }

  get isTidallySynchronized():
    boolean {

    return (
      !this.isRetrograde &&
      approximatelyEqual(
        this.rotationPeriodHours,
        this.sourceOrbitalPeriodHours,
      )
    );
  }

  get hasFiniteDayLength():
    boolean {

    return (
      this.dayLengthHours !==
      null
    );
  }
}

export function apparentSolarDayHours(
  rotationPeriodHours:
    number,

  orbitalPeriodHours:
    number,

  isRetrograde:
    boolean,
): number | null {

  assertPositiveFinite(
    rotationPeriodHours,
    'rotationPeriodHours',
  );

  assertPositiveFinite(
    orbitalPeriodHours,
    'orbitalPeriodHours',
  );

  const rotationFrequency =
    1 /
    rotationPeriodHours;

  const orbitalFrequency =
    1 /
    orbitalPeriodHours;

  if (
    isRetrograde
  ) {
    return 1 /
      (
        rotationFrequency +
        orbitalFrequency
      );
  }

  const beatFrequency =
    Math.abs(
      rotationFrequency -
      orbitalFrequency,
    );

  const frequencyScale =
    Math.max(
      rotationFrequency,
      orbitalFrequency,
    );

  if (
    beatFrequency <=
    CONSISTENCY_TOLERANCE *
      frequencyScale
  ) {
    return null;
  }

  return 1 /
    beatFrequency;
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

function approximatelyEqual(
  left:
    number,

  right:
    number,
): boolean {

  const scale =
    Math.max(
      1,
      Math.abs(
        left,
      ),
      Math.abs(
        right,
      ),
    );

  return (
    Math.abs(
      left -
      right,
    ) <=
    CONSISTENCY_TOLERANCE *
      scale
  );
}
