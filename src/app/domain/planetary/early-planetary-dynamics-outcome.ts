import {
  type EarlyProtoplanetBody,
} from './early-protoplanet-body';

import {
  type EarlyProtoplanetCollision,
} from './early-protoplanet-collision';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-17.5 post-migration / post-early-collision snapshot.
 *
 * V1 is deliberately conservative: no solid mass is ejected and no disk gas
 * is added to bodies. Every point-17.4 formation ordinal must therefore occur
 * in exactly one surviving body's lineage and total survivor mass must equal
 * the source candidate solid mass.
 */
export class EarlyPlanetaryDynamicsOutcome {

  readonly bodies:
    readonly EarlyProtoplanetBody[];

  readonly collisions:
    readonly EarlyProtoplanetCollision[];

  constructor(
    readonly sourceInnerRadiusAu:
      number,

    readonly sourceOuterRadiusAu:
      number,

    readonly sourceCandidateCount:
      number,

    readonly sourceCandidateSolidMassEarth:
      number,

    readonly survivingSolidMassEarth:
      number,

    bodies:
      readonly EarlyProtoplanetBody[],

    collisions:
      readonly EarlyProtoplanetCollision[],
  ) {
    assertPositiveFinite(
      sourceInnerRadiusAu,
      'sourceInnerRadiusAu',
    );

    assertPositiveFinite(
      sourceOuterRadiusAu,
      'sourceOuterRadiusAu',
    );

    if (
      sourceInnerRadiusAu >=
      sourceOuterRadiusAu
    ) {
      throw new RangeError(
        'sourceInnerRadiusAu must be below sourceOuterRadiusAu.',
      );
    }

    if (
      !Number.isInteger(
        sourceCandidateCount,
      ) ||
      sourceCandidateCount <
        0
    ) {
      throw new RangeError(
        'sourceCandidateCount must be a non-negative integer.',
      );
    }

    assertNonNegativeFinite(
      sourceCandidateSolidMassEarth,
      'sourceCandidateSolidMassEarth',
    );

    assertNonNegativeFinite(
      survivingSolidMassEarth,
      'survivingSolidMassEarth',
    );

    if (
      !approximatelyEqual(
        sourceCandidateSolidMassEarth,
        survivingSolidMassEarth,
      )
    ) {
      throw new RangeError(
        'Point-17.5 V1 must conserve all point-17.4 candidate solid mass.',
      );
    }

    validateBodies(
      bodies,
      sourceInnerRadiusAu,
      sourceOuterRadiusAu,
      sourceCandidateCount,
      survivingSolidMassEarth,
    );

    validateCollisions(
      collisions,
      sourceCandidateCount,
      bodies.length,
    );

    this.bodies =
      Object.freeze([
        ...bodies,
      ]);

    this.collisions =
      Object.freeze([
        ...collisions,
      ]);
  }

  get survivorCount():
    number {

    return this.bodies.length;
  }

  get collisionCount():
    number {

    return this.collisions.length;
  }

  get migratedBodyCount():
    number {

    return this.bodies
      .filter(
        body =>
          body.hasMigrated,
      )
      .length;
  }

  get hasMigration():
    boolean {

    return (
      this.migratedBodyCount >
      0
    );
  }

  get hasCollisions():
    boolean {

    return (
      this.collisionCount >
      0
    );
  }
}

function validateBodies(
  bodies:
    readonly EarlyProtoplanetBody[],

  sourceInnerRadiusAu:
    number,

  sourceOuterRadiusAu:
    number,

  sourceCandidateCount:
    number,

  expectedMassEarth:
    number,
): void {

  if (
    sourceCandidateCount ===
      0 &&
    bodies.length !==
      0
  ) {
    throw new RangeError(
      'An empty source population cannot produce surviving bodies.',
    );
  }

  if (
    sourceCandidateCount >
      0 &&
    bodies.length ===
      0
  ) {
    throw new RangeError(
      'Point-17.5 V1 cannot eject every source candidate.',
    );
  }

  let previousRadiusAu =
    -Infinity;

  let accumulatedMassEarth =
    0;

  const ordinals =
    new Set<number>();

  for (
    const body
    of bodies
  ) {
    if (
      body.orbitalRadiusAu <
        sourceInnerRadiusAu -
          CONSISTENCY_TOLERANCE ||
      body.orbitalRadiusAu >
        sourceOuterRadiusAu +
          CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        'Every point-17.5 survivor must remain inside the source disk envelope.',
      );
    }

    if (
      body.orbitalRadiusAu <
      previousRadiusAu -
        CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        'Point-17.5 survivors must be sorted by final orbital radius.',
      );
    }

    previousRadiusAu =
      body.orbitalRadiusAu;

    accumulatedMassEarth +=
      body.solidMassEarth;

    for (
      const ordinal
      of body.sourceFormationOrdinals
    ) {
      if (
        ordinals.has(
          ordinal,
        )
      ) {
        throw new RangeError(
          'Every point-17.4 formation ordinal must belong to exactly one point-17.5 survivor.',
        );
      }

      ordinals.add(
        ordinal,
      );
    }
  }

  if (
    ordinals.size !==
    sourceCandidateCount
  ) {
    throw new RangeError(
      'Survivor source lineages must cover every point-17.4 candidate exactly once.',
    );
  }

  if (
    !approximatelyEqual(
      accumulatedMassEarth,
      expectedMassEarth,
    )
  ) {
    throw new RangeError(
      'survivingSolidMassEarth must equal the sum of survivor solid masses.',
    );
  }
}

function validateCollisions(
  collisions:
    readonly EarlyProtoplanetCollision[],

  sourceCandidateCount:
    number,

  survivorCount:
    number,
): void {

  if (
    collisions.length !==
    sourceCandidateCount -
      survivorCount
  ) {
    throw new RangeError(
      'Each point-17.5 perfect merger must reduce the survivor count by exactly one.',
    );
  }

  for (
    let index = 0;
    index <
      collisions.length;
    index += 1
  ) {
    if (
      collisions[
        index
      ].eventOrdinal !==
      index +
        1
    ) {
      throw new RangeError(
        'Collision event ordinals must be contiguous and start at 1.',
      );
    }
  }
}

function approximatelyEqual(
  first:
    number,

  second:
    number,
): boolean {

  return (
    Math.abs(
      first -
      second,
    ) <=
    CONSISTENCY_TOLERANCE *
      Math.max(
        1,
        Math.abs(
          first,
        ),
        Math.abs(
          second,
        ),
      )
  );
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

function assertNonNegativeFinite(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and non-negative: ${value}.`,
    );
  }
}
