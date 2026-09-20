import { MinorBodyKind } from '../../domain/planetary/minor-body-kind';
import { SystemOrbitalMotionEngine } from '../../simulation/orbital/system-orbital-motion-engine';
import {
  V2_COMET_PHASE_WARP,
  v2CometPresentationDay,
  v2MinorBodyOrbitSeconds,
  v2MinorBodyTimeScale,
} from './system-scene-v2-minor-cadence';
import { projectSystemSceneMotionContributions } from './system-scene-motion-projection';
import { buildLinearFitSystemScale } from './system-scene-scale-projection';
import {
  buildSystemSceneCometPresentationV1,
  systemSceneCometActivityAtSimulationDayV1,
} from './system-scene-comet-presentation';

const ranges = [
  [MinorBodyKind.ASTEROID, 240, 420],
  [MinorBodyKind.COMET, 300, 540],
  [MinorBodyKind.TRANS_NEPTUNIAN_OBJECT, 480, 720],
  [MinorBodyKind.CAPTURED_EXTRASOLAR_OBJECT, 300, 600],
] as const;

describe('15.3 — V2 minor-body presentation cadence without physical time mutation', () => {
  it.each(ranges)('%s completes visual revolutions within %s–%s seconds', (kind, minimum, maximum) => {
    for (let count = 1; count <= 12; count++) {
      for (let rank = 1; rank <= count; rank++) {
        const id = `${kind.name}-FROZEN-${rank}`;
        const seconds = v2MinorBodyOrbitSeconds(kind, rank, count, id);
        const period = 365.25 * (rank + 1) * 300;
        const playback = 23;
        const scale = v2MinorBodyTimeScale(period, playback, kind, rank, count, id);
        expect(seconds).toBeGreaterThanOrEqual(minimum - 1e-9);
        expect(seconds).toBeLessThanOrEqual(maximum + 1e-9);
        expect(period / (playback * scale)).toBeCloseTo(seconds, 9);
        expect(v2MinorBodyOrbitSeconds(kind, rank, count, id)).toBe(seconds);
      }
    }
    const midpoint = v2MinorBodyOrbitSeconds(kind, 1, 1, 'FROZEN-ONLY');
    expect(midpoint).toBeGreaterThan(minimum);
    expect(midpoint).toBeLessThan(maximum);
  });

  it('rejects invented unbound interstellar revolutions and invalid numerical inputs', () => {
    expect(() => v2MinorBodyOrbitSeconds(MinorBodyKind.INTERSTELLAR_OBJECT, 1, 1, 'visitor'))
      .toThrow(RangeError);
    expect(() => v2MinorBodyOrbitSeconds(MinorBodyKind.ASTEROID, 0, 2, 'A')).toThrow(RangeError);
    expect(() => v2MinorBodyTimeScale(0, 1, MinorBodyKind.ASTEROID, 1, 1, 'A'))
      .toThrow(RangeError);
  });

  it('gives comets a continuous faster-periapsis linear-speed clock on the original physical ellipse', () => {
    const orbital = Object.freeze({ id: 'physical-comet', semiMajorAxisAu: 4, eccentricity: 0.96,
      periodDays: 3652.5, rotationDegrees: 37, inclinationDegrees: 11,
      epochMeanAnomalyDegrees: 0 });
    const playback = 25;
    const targetSeconds = 420;
    const timeScale = orbital.periodDays / (playback * targetSeconds);
    const contribution = Object.freeze({ motionId: orbital.id, scale: 1,
      presentationTimeScale: timeScale, presentationCometPhaseWarp: V2_COMET_PHASE_WARP });
    const resolver = () => orbital;
    const scale = buildLinearFitSystemScale(12, 12);
    const initial = projectSystemSceneMotionContributions([contribution], resolver, 0, scale);
    // Compare directly in physical AU to avoid depending on non-linear scene layouts.
    expect(v2CometPresentationDay(0, orbital.periodDays, orbital.eccentricity, 0)).toBeCloseTo(0, 7);
    for (const realSeconds of [0, 60, 120, 180, 300, targetSeconds]) {
      const day = realSeconds * playback * timeScale;
      const warped = v2CometPresentationDay(day, orbital.periodDays, orbital.eccentricity, 0);
      const position = SystemOrbitalMotionEngine.positionAtSimulationDay(orbital, warped);
      const radius = Math.hypot(position.xAu, position.yAu, position.zAu);
      expect(radius).toBeGreaterThanOrEqual(orbital.semiMajorAxisAu * (1 - orbital.eccentricity) - 1e-8);
      expect(radius).toBeLessThanOrEqual(orbital.semiMajorAxisAu * (1 + orbital.eccentricity) + 1e-8);
      expect(Number.isFinite(position.xAu)).toBe(true);
    }
    const final = projectSystemSceneMotionContributions([contribution], resolver,
      targetSeconds * playback, scale);
    expect(final.x).toBeCloseTo(initial.x, 8);
    expect(final.y).toBeCloseTo(initial.y, 8);
    expect(final.z).toBeCloseTo(initial.z, 8);
    // A phase change must actually advance the comet; the separate regression
    // tests compare distances travelled near periapsis and apoapsis directly.
    const delta = 0.001 * orbital.periodDays;
    const zero = v2CometPresentationDay(0, orbital.periodDays, orbital.eccentricity, 0);
    const next = v2CometPresentationDay(delta, orbital.periodDays, orbital.eccentricity, 0);
    expect(next).not.toBe(zero);
  });

  it('keeps comet activity locked to its visually warped position and unchanged physical peri/apo', () => {
    const comet = buildSystemSceneCometPresentationV1({
      proceduralId: '1234567890ABCDEF1234567890ABCDEF', diameterKilometers: 12,
      iceFraction01: 0.7, dustFraction01: 0.3, porosityIndex01: 0.45,
      bulkDensityGramsPerCubicCentimeter: 0.5, geometricAlbedo01: 0.04,
      volatileRichnessIndex01: 0.8, periodRegime: 'LONG_PERIOD',
      referenceLuminositySolar: 1, semiMajorAxisAu: 4, eccentricity: 0.8,
      periapsisAu: 0.8, apoapsisAu: 7.2, orbitalPeriodYears: 100,
      epochMeanAnomalyDegrees: 0, presentationTimeScale: 36525 / (20 * 480),
      presentationCometPhaseWarp: V2_COMET_PHASE_WARP,
    });
    const motion = { id: 'comet', semiMajorAxisAu: 4, eccentricity: 0.8,
      periodDays: 36525, rotationDegrees: 0, inclinationDegrees: 0,
      epochMeanAnomalyDegrees: 0 };
    for (const seconds of [0, 30, 60, 120, 240, 360, 480]) {
      const simulationDay = seconds * 20;
      const presentationDay = v2CometPresentationDay(
        simulationDay * comet.presentationTimeScale, motion.periodDays, motion.eccentricity, 0);
      const pos = SystemOrbitalMotionEngine.positionAtSimulationDay(motion, presentationDay);
      const distance = Math.hypot(pos.xAu, pos.yAu, pos.zAu);
      const activity = systemSceneCometActivityAtSimulationDayV1(comet, simulationDay);
      expect(activity.sourceDistanceAu).toBeCloseTo(distance, 6);
    }
    expect(systemSceneCometActivityAtSimulationDayV1(comet, 0).sourceDistanceAu).toBeCloseTo(0.8, 8);
    expect(systemSceneCometActivityAtSimulationDayV1(comet, 240 * 20).sourceDistanceAu)
      .toBeCloseTo(7.2, 8);
  });
});
