import type {
  SystemSceneProjectionSpace,
  SystemSceneScaleSnapshot,
} from './system-scene-scale-projection';

/** Presentation-only V5.3 radial anchor. AU, orbital elements and periods never change. */
export interface SystemSceneFirstOrbitAnchorV53 {
  readonly version: 5.3;
  readonly projectionSpace: SystemSceneProjectionSpace;
  readonly nearestPeriapsisAu: number;
  readonly originalPeriapsisScene: number;
  readonly anchoredPeriapsisScene: number;
  readonly outerRadiusScene: number;
  readonly targetPhotosphereRadiusScene: number;
  readonly minimumBodyToHaloGapScene: number;
  readonly firstPlanetRadiusScene: number;
  readonly applied: boolean;
}

export interface SystemSceneFirstOrbitAnchorInputV53 {
  readonly architecture: 'SINGLE' | 'BINARY' | 'TRIPLE';
  readonly projectionSpace: SystemSceneProjectionSpace;
  readonly nearestPeriapsisAu: number | null;
  readonly originalPeriapsisScene: number | null;
  readonly localOuterRadiusScene: number;
  readonly basePrimaryRadiusScene: number;
  readonly baseSecondaryRadiusScene: number;
  /** Conservative body allowance: the largest rendered planet radius. */
  readonly firstPlanetRadiusScene: number;
}

/** A fixed, minimum visible gap outside the optical host envelope AND planet body. */
export const SYSTEM_SCENE_FIRST_ORBIT_BODY_CLEARANCE_V53 = 0.14;

/**
 * Choose a single anchor for the shared radial projection. All planets, their
 * motion, orbital guides, HZ and belts consume the same adjusted scale. The
 * exterior branch is affine/strictly increasing and preserves the outer fit.
 * No planet is moved independently of other astronomical overlays.
 */
export function buildSystemSceneFirstOrbitAnchorV53(
  input: SystemSceneFirstOrbitAnchorInputV53,
): SystemSceneFirstOrbitAnchorV53 | null {
  const au = input.nearestPeriapsisAu;
  const original = input.originalPeriapsisScene;
  const outer = input.localOuterRadiusScene;
  if (
    au === null || original === null ||
    !Number.isFinite(au) || au <= 0 ||
    !Number.isFinite(original) || original <= 0 ||
    !Number.isFinite(outer) || outer <= original + 0.20
  ) {
    return null;
  }

  const multiple = input.architecture !== 'SINGLE';
  const baseStar = Math.max(
    input.basePrimaryRadiusScene,
    multiple ? input.baseSecondaryRadiusScene : 0,
  );
  // Moderate readability target; the HZ/close-pair constraints may still
  // require a smaller photosphere rather than fabricating physical clearance.
  const targetPhotosphereRadiusScene = Math.min(
    Math.max(0, baseStar),
    multiple ? 0.17 : 0.20,
  );
  const firstPlanetRadiusScene = Math.max(
    0,
    Number.isFinite(input.firstPlanetRadiusScene)
      ? input.firstPlanetRadiusScene
      : 0,
  );
  const hostCenterFraction = multiple ? 0.46 : 0;
  const minimumTargetScene = Math.max(
    multiple ? 1.08 : 0.95,
    targetPhotosphereRadiusScene / 0.22,
    (
      targetPhotosphereRadiusScene * 1.24 +
      SYSTEM_SCENE_FIRST_ORBIT_BODY_CLEARANCE_V53 +
      firstPlanetRadiusScene
    ) / (1 - hostCenterFraction),
  );
  // If the outer fit is exceptionally compact, do not invert the exterior
  // projection or allow this visual rule to crash old persisted systems.
  const anchored = Math.min(
    Math.max(original, minimumTargetScene),
    outer - 0.20,
  );
  return Object.freeze({
    version: 5.3 as const,
    projectionSpace: input.projectionSpace,
    nearestPeriapsisAu: au,
    originalPeriapsisScene: original,
    anchoredPeriapsisScene: anchored,
    outerRadiusScene: outer,
    targetPhotosphereRadiusScene,
    minimumBodyToHaloGapScene: SYSTEM_SCENE_FIRST_ORBIT_BODY_CLEARANCE_V53,
    firstPlanetRadiusScene,
    applied: anchored > original + 1e-9,
  });
}

/** Piecewise affine, continuous, strictly monotone, and f(0)=0, f(outer)=outer. */
export function systemSceneApplyFirstOrbitAnchorV53(
  unanchoredRadiusScene: number,
  scale: SystemSceneScaleSnapshot,
  projectionSpace: SystemSceneProjectionSpace,
): number {
  const anchor = scale.firstOrbitAnchor;
  if (
    anchor === undefined || anchor === null || !anchor.applied ||
    projectionSpace !== anchor.projectionSpace ||
    !Number.isFinite(unanchoredRadiusScene) ||
    unanchoredRadiusScene <= 0
  ) {
    return unanchoredRadiusScene;
  }
  const original = anchor.originalPeriapsisScene;
  const target = anchor.anchoredPeriapsisScene;
  const outer = anchor.outerRadiusScene;
  if (unanchoredRadiusScene <= original) {
    return unanchoredRadiusScene * target / original;
  }
  if (unanchoredRadiusScene >= outer) {
    return unanchoredRadiusScene;
  }
  return target + (unanchoredRadiusScene - original) *
    (outer - target) / (outer - original);
}
