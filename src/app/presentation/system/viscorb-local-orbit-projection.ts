/**
 * GENESIS VISCORB.1 — Visual-only local moon orbit framing shared by fiche
 * previews and SystemScene. Values passed in are ratios of native radii;
 * this contract never mutates orbital elements or scientific storage.
 */
export interface ViscorbOrbitRadiusRatiosV1 {
  readonly periapsisPlanetRadii: number;
  readonly apoapsisPlanetRadii: number;
  readonly radiusEarth: number;
}

export interface ViscorbLocalOrbitLayoutV1 {
  readonly scenePerPlanetRadius: number;
  readonly planetRadius: number;
  readonly maximumMoonRadiusEarth: number;
  readonly maximumDisplayedMoonRadius: number;
  readonly outermostRadiusScene: number;
}

const LOCAL_OUTERMOST_ORBIT_RADIUS_V1 = 4.35;

/**
 * VISCORB.1b: another precisely 15% reduction relative to VISCORB.1a.
 * The positive factor is applied to each 1a limit as well as the preferred
 * relative radius. Because clamp and max commute with positive scaling,
 * every displayed moon radius (including the readability floor) is 0.85x
 * its VISCORB.1a value, while orbital positions are unchanged.
 * Both the planetary fiche and the local SystemScene view use this helper.
 */
const LOCAL_MOON_RADIUS_FACTOR_VISCORB1B = 0.1785; // 0.21 * 0.85
const LOCAL_MOON_RADIUS_MIN_VISCORB1B = 0.0442;    // 0.052 * 0.85
const LOCAL_MOON_RADIUS_MAX_VISCORB1B = 0.12325;   // 0.145 * 0.85
const LOCAL_MOON_READABILITY_FLOOR_VISCORB1B = 0.0187; // 0.022 * 0.85

export function viscorbLocalOrbitLayoutV1(
  moons: readonly ViscorbOrbitRadiusRatiosV1[],
  ringExtentPlanetRadii = 1,
): ViscorbLocalOrbitLayoutV1 | null {
  if (moons.length === 0) return null;
  if (!Number.isFinite(ringExtentPlanetRadii) || ringExtentPlanetRadii < 0) return null;
  if (moons.some(moon =>
    !Number.isFinite(moon.periapsisPlanetRadii) || moon.periapsisPlanetRadii <= 0 ||
    !Number.isFinite(moon.apoapsisPlanetRadii) || moon.apoapsisPlanetRadii < moon.periapsisPlanetRadii ||
    !Number.isFinite(moon.radiusEarth) || moon.radiusEarth <= 0
  )) return null;

  const maxApoapsis = Math.max(...moons.map(moon => moon.apoapsisPlanetRadii));
  const scenePerPlanetRadius = LOCAL_OUTERMOST_ORBIT_RADIUS_V1 / maxApoapsis;
  const minimumPeriapsis = Math.min(...moons.map(moon => moon.periapsisPlanetRadii * scenePerPlanetRadius));
  const maxReadablePlanetRadius = minimumPeriapsis / Math.max(ringExtentPlanetRadii + 0.75, 1.75);
  const planetRadius = clamp(maxReadablePlanetRadius, 0.18, 0.78);
  return Object.freeze({
    scenePerPlanetRadius,
    planetRadius,
    maximumMoonRadiusEarth: Math.max(...moons.map(moon => moon.radiusEarth), 1e-6),
    maximumDisplayedMoonRadius: clamp(
      planetRadius * LOCAL_MOON_RADIUS_FACTOR_VISCORB1B,
      LOCAL_MOON_RADIUS_MIN_VISCORB1B,
      LOCAL_MOON_RADIUS_MAX_VISCORB1B,
    ),
    outermostRadiusScene: LOCAL_OUTERMOST_ORBIT_RADIUS_V1,
  });
}

export function viscorbPresentedMoonRadiusV1(
  layout: ViscorbLocalOrbitLayoutV1,
  radiusEarth: number,
): number {
  return Math.max(
    LOCAL_MOON_READABILITY_FLOOR_VISCORB1B,
    layout.maximumDisplayedMoonRadius * radiusEarth / layout.maximumMoonRadiusEarth,
  );
}

/** Uniform transform for all moon-relative positions and lines of one host. */
export function viscorbMoonOrbitPresentationScaleV1(
  layout: ViscorbLocalOrbitLayoutV1,
): number {
  return layout.scenePerPlanetRadius / layout.planetRadius;
}

/** Deterministic, bounded transition that changes only presentation. */
export function viscorbBlendOrbitTransformV1(
  originalScale: number,
  targetScale: number,
  blend01: number,
): number {
  const blend = clamp(Number.isFinite(blend01) ? blend01 : 0, 0, 1);
  return originalScale + (targetScale - originalScale) * (blend * blend * (3 - 2 * blend));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
