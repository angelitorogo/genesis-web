import { SystemOrbitalMotionEngine } from '../../simulation/orbital/system-orbital-motion-engine';
import { v2CometPresentationDay } from './system-scene-v2-minor-cadence';
import {
  type SystemSceneBodySnapshot,
  type SystemSceneMinorBodySnapshot,
  type SystemSceneMotionContributionSnapshot,
  type SystemSceneSnapshot,
} from './system-scene-snapshot';

export interface V2CometStellarIrradiance {
  readonly starId: string;
  readonly physicalDistanceAu: number;
  readonly luminositySolar: number;
  readonly fluxEarth: number;
}

const SOLAR_TEMPERATURE_K = 5772;
const SOLAR_RADIUS_AU = 0.00465047;

/** Stefan–Boltzmann in solar units; uses the PHYSICAL radius and T_eff. */
export function v2StellarLuminosityFromPhotosphere(
  radiusSolar: number, temperatureKelvin: number,
): number {
  if (![radiusSolar, temperatureKelvin].every(value => Number.isFinite(value) && value > 0)) {
    throw new RangeError('V2 comet irradiation requires positive physical radius and temperature.');
  }
  return radiusSolar ** 2 * (temperatureKelvin / SOLAR_TEMPERATURE_K) ** 4;
}

/**
 * Re-evaluate existing AU orbital motions with the EXACT visual phase used by
 * Three.js, discarding all projection-only screen magnifications. Barycentric
 * signed motion scales are physical; `linearScenePerAu` is not. This keeps
 * star–comet distances real in SINGLE/BINARY/TRIPLE, even while the renderer
 * deliberately spaces the stars farther apart for legibility.
 */
function physicalPositionAu(
  contributions: readonly SystemSceneMotionContributionSnapshot[],
  motions: SystemSceneSnapshot['motions'], day: number,
): readonly [number, number, number] {
  let x = 0, y = 0, z = 0;
  for (const part of contributions) {
    const motion = motions.find(candidate => candidate.id === part.motionId);
    if (!motion) throw new RangeError(`Unknown comet irradiation motion: ${part.motionId}`);
    const presentationDay = day * (part.presentationTimeScale ?? 1);
    const orbitalDay = part.presentationCometPhaseWarp === undefined
      ? presentationDay
      : v2CometPresentationDay(presentationDay, motion.periodDays,
        motion.eccentricity, motion.epochMeanAnomalyDegrees,
        part.presentationCometPhaseWarp);
    const at = SystemOrbitalMotionEngine.positionAtSimulationDay(motion, orbitalDay);
    x += at.xAu * part.scale;
    y += at.yAu * part.scale;
    z += at.zAu * part.scale;
  }
  return [x, y, z];
}

function stellarLuminosity(star: SystemSceneBodySnapshot): number {
  const r = star.sourceRadiusSolar;
  const t = star.sourceEffectiveTemperatureKelvin;
  if (r !== undefined && t !== undefined) {
    return v2StellarLuminosityFromPhotosphere(r, t);
  }
  // Older renderer fixtures contain only physically generated luminosity.
  // NEVER use the artificially enlarged on-screen star radius.
  return star.sourceLuminositySolar ?? 0;
}

/** Read-only per-frame irradiation sources. The caller also uses fluxEarth
 * to orient each tail away from the combined stellar light, instead of using
 * projected scene-space distances that have no physical meaning.
 */
export function v2CometStellarIrradianceAtDay(
  snapshot: Pick<SystemSceneSnapshot, 'stars' | 'motions'>,
  comet: Pick<SystemSceneMinorBodySnapshot, 'motionContributions'>,
  simulationDay: number,
): readonly V2CometStellarIrradiance[] {
  if (!Number.isFinite(simulationDay)) throw new RangeError('Comet irradiation day must be finite.');
  const position = physicalPositionAu(comet.motionContributions, snapshot.motions, simulationDay);
  return Object.freeze(snapshot.stars.map(star => {
    const source = physicalPositionAu(star.motionContributions, snapshot.motions, simulationDay);
    const radius = star.sourceRadiusSolar ?? 0;
    const distance = Math.hypot(position[0] - source[0], position[1] - source[1],
      position[2] - source[2]);
    const luminosity = stellarLuminosity(star);
    // A numerical collision must not give infinitely bright comet tails.
    const boundedDistance = Math.max(distance, radius * SOLAR_RADIUS_AU, 1e-9);
    const fluxEarth = luminosity / boundedDistance ** 2;
    return Object.freeze({
      starId: star.id,
      physicalDistanceAu: distance,
      luminositySolar: luminosity,
      fluxEarth: Number.isFinite(fluxEarth) ? fluxEarth : Number.MAX_VALUE,
    });
  }));
}
