/**
 * Point-17.5 record of one simplified perfect-merger collision.
 *
 * V1 conserves all participating solid mass. impactSeverity01 is a normalized
 * descriptor for later evolution; it is not a calibrated impact-energy unit.
 */
export class EarlyProtoplanetCollision {

  readonly participantSourceFormationOrdinals:
    readonly number[];

  constructor(
    readonly eventOrdinal:
      number,

    participantSourceFormationOrdinals:
      readonly number[],

    readonly orbitalRadiusAu:
      number,

    readonly combinedSolidMassEarth:
      number,

    readonly impactSeverity01:
      number,
  ) {
    if (
      !Number.isInteger(
        eventOrdinal,
      ) ||
      eventOrdinal <
        1
    ) {
      throw new RangeError(
        'eventOrdinal must be a positive integer.',
      );
    }

    if (
      participantSourceFormationOrdinals.length <
      2
    ) {
      throw new RangeError(
        'A collision event requires at least two source formation ordinals.',
      );
    }

    let previous =
      0;

    for (
      const ordinal
      of participantSourceFormationOrdinals
    ) {
      if (
        !Number.isInteger(
          ordinal,
        ) ||
        ordinal <=
          previous
      ) {
        throw new RangeError(
          'Collision participant ordinals must be unique positive integers in ascending order.',
        );
      }

      previous =
        ordinal;
    }

    assertPositiveFinite(
      orbitalRadiusAu,
      'orbitalRadiusAu',
    );

    assertPositiveFinite(
      combinedSolidMassEarth,
      'combinedSolidMassEarth',
    );

    if (
      !Number.isFinite(
        impactSeverity01,
      ) ||
      impactSeverity01 <
        0 ||
      impactSeverity01 >
        1
    ) {
      throw new RangeError(
        'impactSeverity01 must be finite and in range [0, 1].',
      );
    }

    this.participantSourceFormationOrdinals =
      Object.freeze([
        ...participantSourceFormationOrdinals,
      ]);
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
