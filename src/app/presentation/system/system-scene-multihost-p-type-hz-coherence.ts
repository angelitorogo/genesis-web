import {
  type CircumbinaryHabitabilityAssessment,
} from '../../domain/habitability/circumbinary-habitability-assessment';

const OVERLAP_TOLERANCE =
  1e-12;

export interface SystemSceneMultihostPTypeZoneClip {
  readonly dynamicallyHabitableInnerEdgeAu:
    number | null;

  readonly dynamicallyHabitableOuterEdgeAu:
    number | null;

  readonly dynamicalOverlapFraction01:
    number;
}

/**
 * 29.1E-f.3 — intersects the already-computed point-16.6 P-type HZ with the
 * effective circumbinary formation/survival window that the canonical
 * multihost aggregate actually exposes.
 *
 * This deliberately does NOT introduce another Holman-Wiegert fit. The
 * radiative reference and the phase-16 dynamical verdict remain authoritative;
 * this last intersection only prevents a scene/fiche from claiming an HZ in
 * radii where the generated P population itself is not admitted. Jiovara is
 * the canonical regression: its ~531–937 AU A+B radiative reference cannot be
 * presented as dynamically usable inside its ~10.26–15.69 AU P window.
 */
export function systemSceneClipMultihostPTypeHabitableZone(
  assessment:
    CircumbinaryHabitabilityAssessment,

  stableInnerAu:
    number | null,

  stableOuterAu:
    number | null,
): SystemSceneMultihostPTypeZoneClip {

  if (
    !assessment.isRadiativeReferenceApplicable ||
    !assessment.hasStableHabitableZone ||
    assessment.stableHabitableInnerEdgeAu === null ||
    assessment.stableHabitableOuterEdgeAu === null ||
    stableInnerAu === null ||
    !Number.isFinite(stableInnerAu) ||
    stableInnerAu <= 0 ||
    (stableOuterAu !== null &&
      (!Number.isFinite(stableOuterAu) || stableOuterAu <= stableInnerAu))
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
      assessment.radiativeHabitableInnerEdgeAu,
      assessment.stableHabitableInnerEdgeAu,
      stableInnerAu,
    );

  const outer =
    Math.min(
      assessment.radiativeHabitableOuterEdgeAu,
      assessment.stableHabitableOuterEdgeAu,
      stableOuterAu ?? Number.POSITIVE_INFINITY,
    );

  const tolerance =
    OVERLAP_TOLERANCE *
    Math.max(
      1,
      inner,
      Number.isFinite(outer)
        ? outer
        : 1,
    );

  if (
    !Number.isFinite(inner) ||
    !Number.isFinite(outer) ||
    outer - inner <= tolerance
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
    assessment.radiativeHabitableOuterEdgeAu -
    assessment.radiativeHabitableInnerEdgeAu;

  return Object.freeze({
    dynamicallyHabitableInnerEdgeAu:
      inner,
    dynamicallyHabitableOuterEdgeAu:
      outer,
    dynamicalOverlapFraction01:
      radiativeWidth > 0
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
