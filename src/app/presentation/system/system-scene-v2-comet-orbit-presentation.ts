import {
  SystemOrbitalMotionEngine,
  type SystemOrbitalMotionDefinition,
  type SystemOrbitalPositionAu,
} from '../../simulation/orbital/system-orbital-motion-engine';

/** Renderer-only orbital silhouette. Never replace the physical comet elements. */
export const V2_COMET_VISUAL_MIN_ECCENTRICITY = 0.62;
export const V2_COMET_VISUAL_MAX_ECCENTRICITY = 0.74;
export const V2_COMET_STELLAR_CLEARANCE_SCENE = 0.12;
export const V2_COMET_MAX_LOCAL_APOAPSIS_SCENE = 2.38;

export interface V2CometVisualOrbit {
  readonly eccentricity: number;
  readonly semiMajorScene: number;
  readonly semiMinorScene: number;
  readonly focusOffsetScene: number;
  readonly periapsisScene: number;
  readonly apoapsisScene: number;
}

/**
 * A focus-centred *linear* scene ellipse avoids adaptive-log deformation:
 * q = a(1-e), Q = a(1+e). It fits inside the host's allocated visual
 * envelope while keeping its entire path beyond the optical photosphere.
 * The physical eccentricity, physical orbit, period and irradiation stay put.
 */
export function buildV2CometVisualOrbit(input: {
  readonly physicalSemiMajorScene: number;
  readonly physicalEccentricity: number;
  readonly starOpticalRadiusScene: number;
  readonly cometRadiusScene: number;
  readonly maximumApoapsisScene: number;
}): V2CometVisualOrbit {
  const { physicalSemiMajorScene, physicalEccentricity, starOpticalRadiusScene,
    cometRadiusScene, maximumApoapsisScene } = input;
  if (![physicalSemiMajorScene, physicalEccentricity, starOpticalRadiusScene,
      cometRadiusScene, maximumApoapsisScene].every(Number.isFinite) ||
      physicalSemiMajorScene <= 0 || physicalEccentricity < 0 || physicalEccentricity >= 1 ||
      starOpticalRadiusScene < 0 || cometRadiusScene < 0 || maximumApoapsisScene <= 0) {
    throw new RangeError('V2 comet visual orbit requires finite physical elements and positive scene limits.');
  }
  const minimumPeriapsis = Math.max(0.36,
    starOpticalRadiusScene + cometRadiusScene + V2_COMET_STELLAR_CLEARANCE_SCENE);
  const maxAllowedE = (maximumApoapsisScene - minimumPeriapsis) /
    (maximumApoapsisScene + minimumPeriapsis);
  if (maxAllowedE < V2_COMET_VISUAL_MIN_ECCENTRICITY) {
    throw new RangeError('V2 comet stellar clearance cannot fit inside this host visual envelope.');
  }
  const eccentricity = Math.min(V2_COMET_VISUAL_MAX_ECCENTRICITY,
    Math.max(V2_COMET_VISUAL_MIN_ECCENTRICITY, physicalEccentricity), maxAllowedE);
  const largestPeriapsis = maximumApoapsisScene * (1 - eccentricity) / (1 + eccentricity);
  const periapsisScene = Math.min(largestPeriapsis,
    Math.max(minimumPeriapsis, physicalSemiMajorScene * (1 - physicalEccentricity)));
  const semiMajorScene = periapsisScene / (1 - eccentricity);
  return Object.freeze({
    eccentricity, semiMajorScene,
    semiMinorScene: semiMajorScene * Math.sqrt(1 - eccentricity ** 2),
    focusOffsetScene: semiMajorScene * eccentricity,
    periapsisScene,
    apoapsisScene: semiMajorScene * (1 + eccentricity),
  });
}

const TWO_PI = 2 * Math.PI;

/**
 * Use the physical clock's eccentric anomaly E on the visual ellipse. This
 * keeps peri/apo timing and the existing bounded arc-speed warp aligned with
 * physical comet activity instead of independently solving a new visual M.
 * Only the coordinates consumed by Three.js are changed.
 */
export function v2CometVisualPositionAu(
  physicalMotion: SystemOrbitalMotionDefinition,
  physicalOrbitalDay: number,
  presentationEccentricity: number,
): SystemOrbitalPositionAu {
  if (!Number.isFinite(physicalOrbitalDay) ||
      !Number.isFinite(presentationEccentricity) ||
      presentationEccentricity < 0 || presentationEccentricity >= 1) {
    throw new RangeError('Invalid V2 comet visual phase or eccentricity.');
  }
  const mean = (((physicalMotion.epochMeanAnomalyDegrees / 360 +
    physicalOrbitalDay / physicalMotion.periodDays) % 1 + 1) % 1) * TWO_PI;
  // Monotone Kepler equation on [0, 2pi]; bounded for physical e arbitrarily near 1.
  let lower = 0, upper = TWO_PI;
  for (let i = 0; i < 54; i += 1) {
    const middle = (lower + upper) / 2;
    if (middle - physicalMotion.eccentricity * Math.sin(middle) < mean) lower = middle;
    else upper = middle;
  }
  const eccentricAnomaly = (lower + upper) / 2;
  const visualMean = eccentricAnomaly - presentationEccentricity * Math.sin(eccentricAnomaly);
  return SystemOrbitalMotionEngine.positionAtSimulationDay({
    ...physicalMotion,
    eccentricity: presentationEccentricity,
    epochMeanAnomalyDegrees: 0,
  }, visualMean * physicalMotion.periodDays / TWO_PI);
}
