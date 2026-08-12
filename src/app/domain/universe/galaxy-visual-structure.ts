export const GalaxyWindingDirection =
  Object.freeze({
    CLOCKWISE:
      'CLOCKWISE',

    COUNTERCLOCKWISE:
      'COUNTERCLOCKWISE',
  } as const);

export type GalaxyWindingDirection =
  typeof GalaxyWindingDirection[
    keyof typeof GalaxyWindingDirection
  ];

const TWO_PI =
  2 * Math.PI;

/**
 * Normalized visual boundaries used to map the physical galaxy regions into
 * renderer-independent visual space.
 *
 * These values are Ground Truth procedural geometry. They are not Three.js
 * objects, pixels or physical distances in light years.
 */
export class GalaxyVisualRegionLayout {

  constructor(
    readonly centralOuterRadiusNormalized:
      number,

    readonly innerOuterRadiusNormalized:
      number,

    readonly middleOuterRadiusNormalized:
      number,

    readonly nominalOuterRadiusNormalized:
      number,

    readonly haloOuterRadiusNormalized:
      number,
  ) {
    const radii = [
      centralOuterRadiusNormalized,
      innerOuterRadiusNormalized,
      middleOuterRadiusNormalized,
      nominalOuterRadiusNormalized,
      haloOuterRadiusNormalized,
    ];

    if (
      radii.some(
        (
          value,
        ) =>
          !Number.isFinite(
            value,
          ),
      )
    ) {
      throw new RangeError(
        'Region layout radii must be finite.',
      );
    }

    if (
      !(
        centralOuterRadiusNormalized >
          0.0 &&
        centralOuterRadiusNormalized <
          innerOuterRadiusNormalized &&
        innerOuterRadiusNormalized <
          middleOuterRadiusNormalized &&
        middleOuterRadiusNormalized <
          nominalOuterRadiusNormalized &&
        nominalOuterRadiusNormalized <
          haloOuterRadiusNormalized
      )
    ) {
      throw new RangeError(
        'Region layout radii must be strictly ordered: 0.0 < central < inner < middle < nominal < halo.',
      );
    }

    if (
      nominalOuterRadiusNormalized !==
      1.0
    ) {
      throw new RangeError(
        'nominalOuterRadiusNormalized must be exactly 1.0.',
      );
    }
  }
}

/**
 * Renderer-independent procedural geometry of one visual spiral arm.
 */
export class GalaxyVisualArm {

  constructor(
    readonly index:
      number,

    readonly phaseRadians:
      number,

    readonly pitchAngleDegrees:
      number,

    readonly radialStartNormalized:
      number,

    readonly radialEndNormalized:
      number,

    readonly widthNormalized:
      number,

    readonly coherence:
      number,
  ) {
    if (
      !Number.isInteger(
        index,
      ) ||
      index <
        0
    ) {
      throw new RangeError(
        `index must be a non-negative integer: ${index}.`,
      );
    }

    if (
      !Number.isFinite(
        phaseRadians,
      ) ||
      phaseRadians <
        0.0 ||
      phaseRadians >=
        TWO_PI
    ) {
      throw new RangeError(
        `phaseRadians must be finite and in [0, 2π): ${phaseRadians}.`,
      );
    }

    if (
      !Number.isFinite(
        pitchAngleDegrees,
      ) ||
      pitchAngleDegrees <=
        0.0 ||
      pitchAngleDegrees >
        60.0
    ) {
      throw new RangeError(
        `pitchAngleDegrees must be finite and in (0.0, 60.0]: ${pitchAngleDegrees}.`,
      );
    }

    if (
      !Number.isFinite(
        radialStartNormalized,
      ) ||
      radialStartNormalized <
        0.0 ||
      radialStartNormalized >=
        1.0
    ) {
      throw new RangeError(
        `radialStartNormalized must be finite and in [0.0, 1.0): ${radialStartNormalized}.`,
      );
    }

    if (
      !Number.isFinite(
        radialEndNormalized,
      ) ||
      radialEndNormalized <=
        radialStartNormalized ||
      radialEndNormalized >
        1.0
    ) {
      throw new RangeError(
        `radialEndNormalized must be finite and in (radialStart, 1.0]: ${radialEndNormalized}.`,
      );
    }

    if (
      !Number.isFinite(
        widthNormalized,
      ) ||
      widthNormalized <=
        0.0 ||
      widthNormalized >=
        0.25
    ) {
      throw new RangeError(
        `widthNormalized must be finite and in (0.0, 0.25): ${widthNormalized}.`,
      );
    }

    assertUnitInterval(
      coherence,
      'coherence',
    );
  }
}

/**
 * Renderer-independent visual geometry of the central bar of a barred spiral.
 */
export class GalaxyVisualBar {

  constructor(
    readonly angleRadians:
      number,

    readonly halfLengthNormalized:
      number,

    readonly widthNormalized:
      number,

    readonly strength:
      number,
  ) {
    if (
      !Number.isFinite(
        angleRadians,
      ) ||
      angleRadians <
        0.0 ||
      angleRadians >=
        TWO_PI
    ) {
      throw new RangeError(
        `angleRadians must be finite and in [0, 2π): ${angleRadians}.`,
      );
    }

    if (
      !Number.isFinite(
        halfLengthNormalized,
      ) ||
      halfLengthNormalized <=
        0.0 ||
      halfLengthNormalized >=
        1.0
    ) {
      throw new RangeError(
        `halfLengthNormalized must be finite and in (0.0, 1.0): ${halfLengthNormalized}.`,
      );
    }

    if (
      !Number.isFinite(
        widthNormalized,
      ) ||
      widthNormalized <=
        0.0 ||
      widthNormalized >=
        halfLengthNormalized
    ) {
      throw new RangeError(
        `widthNormalized must be finite and in (0.0, halfLength): ${widthNormalized}.`,
      );
    }

    assertUnitInterval(
      strength,
      'strength',
    );
  }
}

/**
 * Ground Truth procedural visual geometry for a galaxy.
 *
 * It is derived reproducibly from Galaxy.seed and the galaxy's physical
 * structure. It deliberately contains no Three.js, DOM, Canvas, bitmap,
 * material, mesh or camera representation.
 */
export class GalaxyVisualStructure {

  readonly arms:
    readonly GalaxyVisualArm[];

  constructor(
    readonly orientationRadians:
      number,

    readonly windingDirection:
      GalaxyWindingDirection,

    readonly bulgeRadiusNormalized:
      number,

    readonly bulgeAxisRatio:
      number,

    readonly haloFalloffExponent:
      number,

    readonly regions:
      GalaxyVisualRegionLayout,

    readonly bar:
      GalaxyVisualBar | null,

    arms:
      readonly GalaxyVisualArm[],
  ) {
    if (
      !Number.isFinite(
        orientationRadians,
      ) ||
      orientationRadians <
        0.0 ||
      orientationRadians >=
        TWO_PI
    ) {
      throw new RangeError(
        `orientationRadians must be finite and in [0, 2π): ${orientationRadians}.`,
      );
    }

    if (
      windingDirection !==
        GalaxyWindingDirection.CLOCKWISE &&
      windingDirection !==
        GalaxyWindingDirection.COUNTERCLOCKWISE
    ) {
      throw new RangeError(
        `Unsupported GalaxyWindingDirection: ${String(windingDirection)}.`,
      );
    }

    if (
      !Number.isFinite(
        bulgeRadiusNormalized,
      ) ||
      bulgeRadiusNormalized <=
        0.0 ||
      bulgeRadiusNormalized >=
        1.0
    ) {
      throw new RangeError(
        `bulgeRadiusNormalized must be finite and in (0.0, 1.0): ${bulgeRadiusNormalized}.`,
      );
    }

    if (
      !Number.isFinite(
        bulgeAxisRatio,
      ) ||
      bulgeAxisRatio <=
        0.0 ||
      bulgeAxisRatio >
        1.0
    ) {
      throw new RangeError(
        `bulgeAxisRatio must be finite and in (0.0, 1.0]: ${bulgeAxisRatio}.`,
      );
    }

    if (
      !Number.isFinite(
        haloFalloffExponent,
      ) ||
      haloFalloffExponent <=
        0.0
    ) {
      throw new RangeError(
        `haloFalloffExponent must be finite and greater than 0.0: ${haloFalloffExponent}.`,
      );
    }

    arms.forEach(
      (
        arm,
        expectedIndex,
      ) => {
        if (
          arm.index !==
          expectedIndex
        ) {
          throw new RangeError(
            `Arm indices must be consecutive starting from 0: expected ${expectedIndex}, got ${arm.index}.`,
          );
        }
      },
    );

    this.arms =
      Object.freeze([
        ...arms,
      ]);
  }
}

function assertUnitInterval(
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
      0.0 ||
    value >
      1.0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and in [0.0, 1.0]: ${value}.`,
    );
  }
}
