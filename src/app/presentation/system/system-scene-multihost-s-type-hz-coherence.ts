import {
  circumstellarCriticalFraction,
} from '../../simulation/stellar/stellar-multiple-orbital-spacing';

import {
  CIRCUMBINARY_V1_OUTER_STABILITY_BUFFER,
} from '../../simulation/planetary/circumbinary-planet-compatibility-generator';

import {
  type SystemSceneHabitableZoneSnapshot,
} from './system-scene-snapshot';

const OVERLAP_TOLERANCE =
  1e-12;

export interface SystemSceneMultihostSTypeStabilityInput {
  readonly hostId:
    'A' | 'B' | 'C';

  readonly massA:
    number;

  readonly massB:
    number;

  readonly massC:
    number | null;

  readonly innerBinaryAxisAu:
    number;

  readonly innerBinaryEccentricity:
    number;

  readonly outerBinaryAxisAu:
    number | null;

  readonly outerBinaryEccentricity:
    number | null;
}

export interface SystemSceneMultihostSTypeZoneClip {
  readonly dynamicallyHabitableInnerEdgeAu:
    number | null;

  readonly dynamicallyHabitableOuterEdgeAu:
    number | null;

  readonly dynamicalOverlapFraction01:
    number;
}

/**
 * 29.1E-f.2 — physical S-type outer cutoff for the current hierarchical host.
 *
 * The fit and safety margin are the same frozen V2.1 contract used to form the
 * multihost stability windows. A/B are limited by their inner companion and,
 * in a triple, by the outer C hierarchy. C is limited by the A+B barycentre.
 * No luminosity enters this calculation.
 */
export function systemSceneMultihostSTypeStableOuterAu(
  input:
    SystemSceneMultihostSTypeStabilityInput,
): number {

  const innerABForA =
    input.innerBinaryAxisAu *
    circumstellarCriticalFraction(
      input.massB /
        (input.massA + input.massB),
      input.innerBinaryEccentricity,
    ) *
    CIRCUMBINARY_V1_OUTER_STABILITY_BUFFER;

  const innerABForB =
    input.innerBinaryAxisAu *
    circumstellarCriticalFraction(
      input.massA /
        (input.massA + input.massB),
      input.innerBinaryEccentricity,
    ) *
    CIRCUMBINARY_V1_OUTER_STABILITY_BUFFER;

  if (
    input.massC === null ||
    input.outerBinaryAxisAu === null ||
    input.outerBinaryEccentricity === null
  ) {
    return input.hostId === 'A'
      ? innerABForA
      : innerABForB;
  }

  const massAB =
    input.massA +
    input.massB;

  const outerAB =
    input.outerBinaryAxisAu *
    circumstellarCriticalFraction(
      input.massC /
        (massAB + input.massC),
      input.outerBinaryEccentricity,
    ) *
    CIRCUMBINARY_V1_OUTER_STABILITY_BUFFER;

  if (
    input.hostId ===
    'C'
  ) {
    return input.outerBinaryAxisAu *
      circumstellarCriticalFraction(
        massAB /
          (massAB + input.massC),
        input.outerBinaryEccentricity,
      ) *
      CIRCUMBINARY_V1_OUTER_STABILITY_BUFFER;
  }

  return Math.min(
    input.hostId === 'A'
      ? innerABForA
      : innerABForB,
    outerAB,
  );
}

/**
 * Intersects a SINGLE-source circumstellar HZ with the actual S-type stable
 * window of the bound multihost system. The radiative reference is deliberately
 * untouched: only the claim that some part is dynamically usable is clipped.
 *
 * A source that was already radiative-only remains radiative-only; this helper
 * never upgrades a null dynamical interval into a stable one.
 */
export function systemSceneClipMultihostSTypeHabitableZone(
  zone:
    SystemSceneHabitableZoneSnapshot,

  stableOuterAu:
    number,
): SystemSceneMultihostSTypeZoneClip {

  if (
    zone.topology !==
      'CIRCUMSTELLAR' ||
    zone.dynamicallyHabitableInnerEdgeAu ===
      null ||
    zone.dynamicallyHabitableOuterEdgeAu ===
      null
  ) {
    return Object.freeze({
      dynamicallyHabitableInnerEdgeAu:
        null,
      dynamicallyHabitableOuterEdgeAu:
        null,
      dynamicalOverlapFraction01:
        0,
    });
  }

  const inner =
    Math.max(
      zone.radiativeInnerEdgeAu,
      zone.dynamicallyHabitableInnerEdgeAu,
    );

  const outer =
    Math.min(
      zone.radiativeOuterEdgeAu,
      zone.dynamicallyHabitableOuterEdgeAu,
      stableOuterAu,
    );

  const tolerance =
    OVERLAP_TOLERANCE *
    Math.max(
      1,
      inner,
      outer,
    );

  if (
    !Number.isFinite(
      stableOuterAu,
    ) ||
    stableOuterAu <=
      0 ||
    !Number.isFinite(
      inner,
    ) ||
    !Number.isFinite(
      outer,
    ) ||
    outer -
      inner <=
      tolerance
  ) {
    return Object.freeze({
      dynamicallyHabitableInnerEdgeAu:
        null,
      dynamicallyHabitableOuterEdgeAu:
        null,
      dynamicalOverlapFraction01:
        0,
    });
  }

  const radiativeWidth =
    zone.radiativeOuterEdgeAu -
    zone.radiativeInnerEdgeAu;

  return Object.freeze({
    dynamicallyHabitableInnerEdgeAu:
      inner,
    dynamicallyHabitableOuterEdgeAu:
      outer,
    dynamicalOverlapFraction01:
      radiativeWidth >
        0
        ? Math.max(
            0,
            Math.min(
              1,
              (outer - inner) /
                radiativeWidth,
            ),
          )
        : 0,
  });
}
