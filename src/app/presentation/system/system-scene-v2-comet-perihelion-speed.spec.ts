import { SystemOrbitalMotionEngine } from '../../simulation/orbital/system-orbital-motion-engine';
import { projectSystemSceneMotionContributions } from './system-scene-motion-projection';
import { buildLinearFitSystemScale } from './system-scene-scale-projection';
import { V2_COMET_PHASE_WARP, v2CometPresentationDay } from './system-scene-v2-minor-cadence';

/** Measure actual scene-space travel, not just the true-anomaly derivative:
 * v_linear = r * d(theta)/dt, which caused the previous reversed behaviour. */
const visualPeriod = 420;
const orbitalPeriodDays = 3652.5;
const playbackDaysPerSecond = 24;
const visualScale = orbitalPeriodDays / (visualPeriod * playbackDaysPerSecond);
const deltaSeconds = 0.05;
const sceneScale = buildLinearFitSystemScale(20, 10);

function sample(eccentricity: number, epoch: number, realSeconds: number) {
  const motion = {
    id: 'comet', semiMajorAxisAu: 4, eccentricity,
    periodDays: orbitalPeriodDays, rotationDegrees: 21, inclinationDegrees: 17,
    longitudeAscendingNodeDegrees: 35, argumentOfPeriapsisDegrees: 42,
    epochMeanAnomalyDegrees: epoch,
  };
  const contribution = {
    motionId: motion.id, scale: 1, linearScenePerAu: 3,
    presentationTimeScale: visualScale, presentationCometPhaseWarp: V2_COMET_PHASE_WARP,
  };
  const simulationDay = realSeconds * playbackDaysPerSecond;
  const projected = projectSystemSceneMotionContributions(
    [contribution], () => motion, simulationDay, sceneScale);
  const physicalDay = v2CometPresentationDay(simulationDay * visualScale,
    orbitalPeriodDays, eccentricity, epoch);
  const au = SystemOrbitalMotionEngine.positionAtSimulationDay(motion, physicalDay);
  return { projected, radiusAu: Math.hypot(au.xAu, au.yAu, au.zAu) };
}

function distance(first: ReturnType<typeof sample>, second: ReturnType<typeof sample>) {
  return Math.hypot(first.projected.x - second.projected.x,
    first.projected.y - second.projected.y,
    first.projected.z - second.projected.z);
}

function speed(eccentricity: number, centerSeconds: number) {
  return distance(sample(eccentricity, 0, centerSeconds - deltaSeconds),
    sample(eccentricity, 0, centerSeconds + deltaSeconds)) / (2 * deltaSeconds);
}

describe('15.3 — V2 comets visibly accelerate near their host star', () => {
  it.each([0.2, 0.6, 0.8, 0.96, 0.995])(
    'eccentricity %s: actual rendered distance per second is greater at periapsis than apoapsis',
    eccentricity => {
      const peri = sample(eccentricity, 0, 0);
      const apo = sample(eccentricity, 0, visualPeriod / 2);
      expect(peri.radiusAu).toBeCloseTo(4 * (1 - eccentricity), 7);
      expect(apo.radiusAu).toBeCloseTo(4 * (1 + eccentricity), 7);
      const periSpeed = speed(eccentricity, 0);
      const apoSpeed = speed(eccentricity, visualPeriod / 2);
      expect(periSpeed).toBeGreaterThan(apoSpeed * 1.5);
      expect(periSpeed / apoSpeed).toBeGreaterThan(2.5);
      expect(periSpeed / apoSpeed).toBeLessThan(3.5);
    },
  );

  it.each([0, 17, 75, 137, 180, 270, 359.999])(
    'preserves epoch %s, loop continuity and an unchanged 420-second visual revolution', epoch => {
      const initial = sample(0.96, epoch, 0);
      const finished = sample(0.96, epoch, visualPeriod);
      expect(distance(initial, finished)).toBeLessThan(1e-7);
      expect(initial.radiusAu).toBeCloseTo(finished.radiusAu, 8);
      const before = sample(0.96, epoch, visualPeriod - 0.001);
      const after = sample(0.96, epoch, visualPeriod + 0.001);
      expect(distance(before, after)).toBeLessThan(0.005);
    },
  );

  it('does not invent periapsis acceleration for a perfectly circular orbit', () => {
    const first = speed(0, 0);
    const second = speed(0, visualPeriod / 2);
    expect(first).toBeCloseTo(second, 7);
  });

  it('still returns unmodified physical time when the V2 phase warp is disabled', () => {
    expect(v2CometPresentationDay(900, orbitalPeriodDays, 0.96, 137, 0)).toBe(900);
  });
});
