import {
  MinorBodyApproachTargetKind,
  type MinorBodyApproachTargetKindValue,
} from './minor-body-approach-target-kind';

import {
  type MinorBodyOrbitalElementsCatalogEntry,
} from './minor-body-orbital-elements-catalog';

import {
  MinorBodyOrbitProximityRegime,
  type MinorBodyOrbitProximityRegimeValue,
} from './minor-body-orbit-proximity-regime';

import {
  type Planet,
} from './planet';

import {
  type RelevantMoon,
} from './relevant-moon';

const CONSISTENCY_TOLERANCE =
  1e-12;

/**
 * Point-23.3 immutable geometry-only relationship between one existing minor
 * body and one materialized planet/relevant-moon target.
 *
 * `radialRangesOverlap` is intentionally weaker than `approachPossible`.
 * Radial crossing merely says both paths visit at least one common stellar
 * distance. The approach flag additionally requires the shared-focus orbital
 * paths to enter the target-specific corridor at mutual-node geometry.
 *
 * For planets the corridor is one conservative Hill radius at planetary
 * periapsis. For moons the corridor is the relevant moon's planetocentric
 * apoapsis around the host planet; this means "the minor body can enter the
 * moon's orbital region", not that it encounters the moon at the same time.
 */
export class MinorBodyOrbitProximityAssessment {

  constructor(
    readonly minorBody:
      MinorBodyOrbitalElementsCatalogEntry,

    readonly targetKind:
      MinorBodyApproachTargetKindValue,

    readonly targetPlanet:
      Planet,

    readonly targetMoon:
      RelevantMoon | null,

    readonly radialRangesOverlap:
      boolean,

    readonly radialGapAu:
      number,

    readonly mutualInclinationDegrees:
      number,

    readonly minimumNodalSeparationAu:
      number | null,

    readonly targetCorridorRadiusAu:
      number,

    readonly corridorClearanceAu:
      number | null,

    readonly approachPossible:
      boolean,

    readonly regime:
      MinorBodyOrbitProximityRegimeValue,
  ) {
    if (
      !MinorBodyApproachTargetKind
        .values
        .includes(
          targetKind,
        )
    ) {
      throw new RangeError(
        'targetKind must be a known MinorBodyApproachTargetKind.',
      );
    }

    if (
      targetKind ===
        MinorBodyApproachTargetKind.PLANET &&
      targetMoon !==
        null
    ) {
      throw new RangeError(
        'PLANET proximity assessments must not carry a targetMoon.',
      );
    }

    if (
      targetKind ===
        MinorBodyApproachTargetKind.MOON
    ) {
      if (
        targetMoon ===
        null
      ) {
        throw new RangeError(
          'MOON proximity assessments require a relevant targetMoon.',
        );
      }

      if (
        targetMoon.hostPlanetOrdinal !==
          targetPlanet.planetOrdinal ||
        targetMoon.hostPlanetLocator !==
          targetPlanet.locator
      ) {
        throw new RangeError(
          'MOON proximity assessments must preserve the exact relevant moon -> host Planet identity.',
        );
      }
    }

    assertNonNegativeFinite(
      radialGapAu,
      'radialGapAu',
    );

    if (
      radialRangesOverlap !==
      approximatelyZero(
        radialGapAu,
      )
    ) {
      throw new RangeError(
        'radialRangesOverlap must exactly reflect radialGapAu = 0.',
      );
    }

    if (
      !Number.isFinite(
        mutualInclinationDegrees,
      ) ||
      mutualInclinationDegrees <
        0 ||
      mutualInclinationDegrees >
        180
    ) {
      throw new RangeError(
        'mutualInclinationDegrees must be finite in [0, 180].',
      );
    }

    if (
      minimumNodalSeparationAu !==
      null
    ) {
      assertNonNegativeFinite(
        minimumNodalSeparationAu,
        'minimumNodalSeparationAu',
      );
    }

    assertPositiveFinite(
      targetCorridorRadiusAu,
      'targetCorridorRadiusAu',
    );

    if (
      corridorClearanceAu !==
      null
    ) {
      assertNonNegativeFinite(
        corridorClearanceAu,
        'corridorClearanceAu',
      );
    }

    const expectedClearance =
      minimumNodalSeparationAu ===
        null
        ? null
        : Math.max(
            0,
            minimumNodalSeparationAu -
              targetCorridorRadiusAu,
          );

    if (
      expectedClearance ===
        null
        ? corridorClearanceAu !==
            null
        : corridorClearanceAu ===
            null ||
          !approximatelyEqual(
            corridorClearanceAu,
            expectedClearance,
          )
    ) {
      throw new RangeError(
        'corridorClearanceAu must be null when no mutual-node passage exists, otherwise max(0, minimumNodalSeparationAu - targetCorridorRadiusAu).',
      );
    }

    const expectedApproach =
      expectedClearance !==
        null &&
      approximatelyZero(
        expectedClearance,
      );

    if (
      approachPossible !==
      expectedApproach
    ) {
      throw new RangeError(
        'approachPossible must exactly reflect entry into the target approach corridor.',
      );
    }

    const expectedRegime =
      approachPossible
        ? MinorBodyOrbitProximityRegime
            .APPROACH_CORRIDOR
        : radialRangesOverlap
          ? MinorBodyOrbitProximityRegime
              .RADIAL_CROSSING
          : MinorBodyOrbitProximityRegime
              .DISJOINT;

    if (
      regime !==
      expectedRegime
    ) {
      throw new RangeError(
        'Minor-body proximity regime must match the frozen point-23.3 geometry flags.',
      );
    }
  }

  get minorBodyKind() {
    return this
      .minorBody
      .orbitalElements
      .kind;
  }

  get minorBodyProceduralId():
    string {
    return this
      .minorBody
      .orbitalElements
      .proceduralId;
  }

  get minorBodyDesignation():
    string {
    return this
      .minorBody
      .orbitalElements
      .localDesignation;
  }

  get targetPlanetOrdinal():
    number {
    return this
      .targetPlanet
      .planetOrdinal;
  }

  get targetMoonOrdinal():
    number | null {
    return this
      .targetMoon
      ?.moonOrdinal ??
      null;
  }

  get targetName():
    string {
    return this.targetMoon
      ?.name ??
      this.targetPlanet.name;
  }

  get isPlanetTarget():
    boolean {
    return this.targetKind ===
      MinorBodyApproachTargetKind.PLANET;
  }

  get isMoonTarget():
    boolean {
    return this.targetKind ===
      MinorBodyApproachTargetKind.MOON;
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
      `${propertyName} must be finite and >= 0.`,
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
      `${propertyName} must be finite and > 0.`,
    );
  }
}

function approximatelyZero(
  value:
    number,
): boolean {
  return Math.abs(
    value,
  ) <=
    CONSISTENCY_TOLERANCE;
}

function approximatelyEqual(
  left:
    number,

  right:
    number,
): boolean {
  return Math.abs(
    left -
      right,
  ) <=
    CONSISTENCY_TOLERANCE *
      Math.max(
        1,
        Math.abs(left),
        Math.abs(right),
      );
}
