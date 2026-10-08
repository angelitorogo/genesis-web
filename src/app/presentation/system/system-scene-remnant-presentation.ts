export type SystemSceneStellarPresentationKind =
  'PHOTOSPHERE' |
  'NEUTRON_STAR' |
  'STELLAR_BLACK_HOLE';

export interface SystemSceneStellarPresentation {
  readonly kind: SystemSceneStellarPresentationKind;
  readonly radiusScene: number;
  readonly sourceEmissionAllowed: boolean;
  /** Renderer-only illumination proxy; BH uses accretion-disk light without reviving a photosphere. */
  readonly rendererLuminositySolar: number | null;
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

const COMPACT_NEUTRON_STAR_RADIUS_SCENE = 0.0325;
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

  if (evolutionStateName === 'NEUTRON_STAR') {
    return Object.freeze({
      kind: 'NEUTRON_STAR',
      radiusScene: COMPACT_NEUTRON_STAR_RADIUS_SCENE,
      sourceEmissionAllowed: false,
      rendererLuminositySolar: null,
    });
  }

  if (evolutionStateName === 'STELLAR_BLACK_HOLE') {
    return Object.freeze({
      kind: 'STELLAR_BLACK_HOLE',
      radiusScene: COMPACT_BLACK_HOLE_RADIUS_SCENE,
      sourceEmissionAllowed: false,
      rendererLuminositySolar: 0.65,
    });
  }

  return Object.freeze({
    kind: 'PHOTOSPHERE',
    radiusScene: ordinaryRadiusScene,
    sourceEmissionAllowed: true,
    rendererLuminositySolar: null,
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
