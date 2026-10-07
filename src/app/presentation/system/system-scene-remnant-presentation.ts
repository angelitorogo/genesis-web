export type SystemSceneStellarPresentationKind =
  'PHOTOSPHERE' |
  'BROWN_DWARF' |
  'STELLAR_BLACK_HOLE';

export interface SystemSceneStellarPresentation {
  readonly kind: SystemSceneStellarPresentationKind;
  readonly radiusScene: number;
  readonly sourceEmissionAllowed: boolean;
}



export interface SystemSceneBlackHoleMarkerPresentation {
  readonly haloDiameterScene: number;
  readonly haloOpacity: number;
  readonly ringDiameterScene: number;
  readonly ringOpacity: number;
}

export interface SystemSceneHabitableFramingInput {
  readonly stellarEvolutionRegime: string;
  readonly radiativeInnerEdgeAu: number;
  readonly radiativeOuterEdgeAu: number;
}

export interface SystemSceneHabitableFramingEdges {
  readonly innerAu: number | null;
  readonly outerAu: number | null;
}

const COMPACT_BLACK_HOLE_RADIUS_SCENE = 0.11;

/**
 * 29.1E-d presentation boundary. A compact stellar remnant is not rendered
 * with the progenitor photosphere. Scene radius is an intentionally
 * non-comparative marker; physical BH radius remains scientific data.
 */
export function systemSceneStellarPresentation(
  evolutionStateName: string,
  ordinaryRadiusScene: number,
): SystemSceneStellarPresentation {
  if (!Number.isFinite(ordinaryRadiusScene) || ordinaryRadiusScene <= 0) {
    throw new RangeError('ordinaryRadiusScene must be finite and greater than 0.');
  }

  if (evolutionStateName === 'STELLAR_BLACK_HOLE') {
    return Object.freeze({
      kind: 'STELLAR_BLACK_HOLE',
      radiusScene: COMPACT_BLACK_HOLE_RADIUS_SCENE,
      sourceEmissionAllowed: false,
    });
  }

  if (evolutionStateName === 'BROWN_DWARF') {
    return Object.freeze({
      kind: 'BROWN_DWARF',
      radiusScene: Math.max(0.07, Math.min(0.11, ordinaryRadiusScene)),
      sourceEmissionAllowed: true,
    });
  }

  return Object.freeze({
    kind: 'PHOTOSPHERE',
    radiusScene: ordinaryRadiusScene,
    sourceEmissionAllowed: true,
  });
}

/**
 * REFERENCE_ONLY HZ geometry stays renderable/scientifically inspectable, but
 * it must not choose the initial system projection scale. Otherwise a compact
 * remnant can make a few-AU system open as a microscopic dot because its old
 * progenitor luminosity implies a hundreds-of-AU reference HZ.
 */
export function systemSceneHabitableFramingEdges(
  input: SystemSceneHabitableFramingInput,
): SystemSceneHabitableFramingEdges {
  if (input.stellarEvolutionRegime === 'REFERENCE_ONLY') {
    return Object.freeze({ innerAu: null, outerAu: null });
  }

  return Object.freeze({
    innerAu: input.radiativeInnerEdgeAu,
    outerAu: input.radiativeOuterEdgeAu,
  });
}

/**
 * Permanent visual cue for a quiescent stellar-mass black hole. The marker is
 * presentation-only: it emits no light, adds no accretion disk and does not
 * alter the physical Schwarzschild scale. A minimum on-screen scene diameter
 * keeps the compact remnant identifiable against the black background.
 */
export function systemSceneBlackHoleMarkerPresentation(
  remnantRadiusScene: number,
): SystemSceneBlackHoleMarkerPresentation {
  if (!Number.isFinite(remnantRadiusScene) || remnantRadiusScene <= 0) {
    throw new RangeError('remnantRadiusScene must be finite and greater than 0.');
  }

  return Object.freeze({
    haloDiameterScene: Math.max(0.72, remnantRadiusScene * 7.2),
    haloOpacity: 0.22,
    ringDiameterScene: Math.max(0.54, remnantRadiusScene * 5.3),
    ringOpacity: 0.62,
  });
}

