import { SystemOrbitalMotionEngine } from '../../simulation/orbital/system-orbital-motion-engine';
import {
  SCIENTIFIC_MOON_INNER_MIN_CYCLE_REAL_SECONDS_V3,
  SCIENTIFIC_MOON_OUTER_MIN_CYCLE_REAL_SECONDS_V3,
  SCIENTIFIC_MOON_SINGLE_MIN_CYCLE_REAL_SECONDS_V3,
  scientificMoonOrbitCycleRealSecondsV3,
  scientificMoonDaysPerRealSecondV3,
  systemSceneMoonPresentationTimeScaleV3,
} from './system-scene-secondary-motion';
import { projectSystemSceneMotionContributions } from './system-scene-motion-projection';
import type { SystemSceneOrbitalMotionSnapshot } from './system-scene-snapshot';
import type { SystemSceneScaleSnapshot } from './system-scene-scale-projection';

describe('GENESIS MOONCAD.3 — velocidad lunar lenta con límite de recorrido', () => {
  it('impone 30 s mínimo interior, 120 s mínimo exterior y 60 s para una luna aislada', () => {
    expect(SCIENTIFIC_MOON_INNER_MIN_CYCLE_REAL_SECONDS_V3).toBe(30);
    expect(SCIENTIFIC_MOON_OUTER_MIN_CYCLE_REAL_SECONDS_V3).toBe(120);
    expect(SCIENTIFIC_MOON_SINGLE_MIN_CYCLE_REAL_SECONDS_V3).toBe(60);
    expect(scientificMoonOrbitCycleRealSecondsV3(1, [1], 0)).toBe(60);
    expect(scientificMoonOrbitCycleRealSecondsV3(1, [1, 1], 0)).toBe(60);
    expect([1, 2, 3].map(a => scientificMoonOrbitCycleRealSecondsV3(a, [1, 2, 3], 0)))
      .toEqual([30, 75, 120]);
    expect([1, 5, 20].map(a => scientificMoonOrbitCycleRealSecondsV3(a, [1, 5, 20], 0)))
      .toEqual([30, 150, 600]);
  });

  it('no limita artificialmente la órbita exterior a 30 segundos', () => {
    expect(scientificMoonOrbitCycleRealSecondsV3(100, [1, 100], 0)).toBe(3000);
    expect(scientificMoonOrbitCycleRealSecondsV3(2, [1, 2], 0)).toBe(120);
  });

  it('respeta el límite de velocidad tangencial también cerca del periapsis', () => {
    const axes = [1, 1.1, 2, 4, 20];
    const maxReferenceSpeed = 2 * Math.PI * axes[0]! / 30;
    for (const axis of axes) {
      for (const eccentricity of [0, 0.1, 0.6, 0.9, 0.99]) {
        const T = scientificMoonOrbitCycleRealSecondsV3(axis, axes, eccentricity);
        const periapsisSpeed = 2 * Math.PI * axis / T *
          Math.sqrt((1 + eccentricity) / (1 - eccentricity));
        expect(periapsisSpeed).toBeLessThanOrEqual(maxReferenceSpeed * (1 + 1e-12));
      }
    }
  });

  it('reduce también la velocidad para lunas excéntricas', () => {
    const group = [1, 5];
    expect(scientificMoonOrbitCycleRealSecondsV3(1, group, 0.6)).toBeCloseTo(60, 12);
    expect(scientificMoonOrbitCycleRealSecondsV3(5, group, 0.6)).toBeCloseTo(300, 12);
    expect(scientificMoonOrbitCycleRealSecondsV3(5, group, 0.6))
      .toBeGreaterThan(scientificMoonOrbitCycleRealSecondsV3(5, group, 0));
  });

  it('es independiente del orden, las unidades y el foco visual', () => {
    const axes = Object.freeze([0.02, 0.05, 0.20]);
    const before = JSON.stringify(axes);
    for (const axis of axes) {
      expect(scientificMoonOrbitCycleRealSecondsV3(axis, axes, 0.2))
        .toBe(scientificMoonOrbitCycleRealSecondsV3(axis, [...axes].reverse(), 0.2));
      expect(scientificMoonOrbitCycleRealSecondsV3(axis, axes, 0.2))
        .toBeCloseTo(scientificMoonOrbitCycleRealSecondsV3(axis * 1000, axes.map(a => a * 1000), 0.2), 12);
    }
    expect(JSON.stringify(axes)).toBe(before);
  });

  it.each([0.01, 1, 70, 2500])('mantiene paridad de días/s entre ficha y escena, playback=%s', playback => {
    const axes = [1, 5, 20];
    for (const [axis, period, eccentricity] of [[1, 1, 0.1], [5, 50, 0.6], [20, 500, 0.2]]) {
      const rate = scientificMoonDaysPerRealSecondV3(period!, axis!, axes, eccentricity!);
      const scale = systemSceneMoonPresentationTimeScaleV3(period!, axis!, axes, playback, eccentricity!);
      const T = scientificMoonOrbitCycleRealSecondsV3(axis!, axes, eccentricity!);
      expect(playback * scale).toBeCloseTo(rate, 12);
      expect(period! / (playback * scale)).toBeCloseTo(T, 10);
    }
  });

  it('proyecta en ambos componentes la misma posición Kepleriana sin modificar los elementos', () => {
    const axes = [0.01, 0.05, 0.2];
    const playback = 75;
    const scale: SystemSceneScaleSnapshot = {
      outerRadiusAu: 1, orbitScaleScenePerAu: 8, targetOuterRadiusScene: 8,
    };
    for (const [index, axis] of axes.entries()) {
      const motion = Object.freeze({
        id: `moon${index}`, semiMajorAxisAu: axis, eccentricity: 0.61,
        periodDays: [2, 30, 1000][index]!, rotationDegrees: 17,
        inclinationDegrees: 24, epochMeanAnomalyDegrees: 38,
      } satisfies SystemSceneOrbitalMotionSnapshot);
      const before = JSON.stringify(motion);
      const rate = scientificMoonDaysPerRealSecondV3(motion.periodDays, axis, axes, motion.eccentricity);
      const sceneTimeScale = systemSceneMoonPresentationTimeScaleV3(
        motion.periodDays, axis, axes, playback, motion.eccentricity,
      );
      for (const seconds of [0, 0.1, 1, 15, 30, 60, 120, 500, 1000]) {
        const expected = SystemOrbitalMotionEngine.positionAtSimulationDay(motion, seconds * rate);
        const projected = projectSystemSceneMotionContributions(
          [{ motionId: motion.id, scale: 1, presentationTimeScale: sceneTimeScale }],
          id => id === motion.id ? motion : undefined,
          seconds * playback,
          scale,
        );
        expect(projected.x).toBeCloseTo(expected.xAu * 8, 10);
        expect(projected.y).toBeCloseTo(expected.yAu * 8, 10);
        expect(projected.z).toBeCloseTo(expected.zAu * 8, 10);
      }
      expect(JSON.stringify(motion)).toBe(before);
    }
  });

  it('mantiene relojes locales por anfitrión y no mezcla lunas de otros planetas', () => {
    expect(scientificMoonOrbitCycleRealSecondsV3(1, [1, 3], 0)).toBe(30);
    expect(scientificMoonOrbitCycleRealSecondsV3(3, [1, 3], 0)).toBe(120);
    expect(scientificMoonOrbitCycleRealSecondsV3(3, [3], 0)).toBe(60);
  });

  it('rechaza valores físicos inválidos sin alterar datos', () => {
    expect(() => scientificMoonOrbitCycleRealSecondsV3(1, [], 0)).toThrow(RangeError);
    expect(() => scientificMoonOrbitCycleRealSecondsV3(2, [1, 3], 0)).toThrow(RangeError);
    expect(() => scientificMoonOrbitCycleRealSecondsV3(0, [0], 0)).toThrow(RangeError);
    expect(() => scientificMoonOrbitCycleRealSecondsV3(1, [1], -0.1)).toThrow(RangeError);
    expect(() => scientificMoonOrbitCycleRealSecondsV3(1, [1], 1)).toThrow(RangeError);
    expect(() => scientificMoonOrbitCycleRealSecondsV3(1, [1], Number.NaN)).toThrow(RangeError);
    expect(() => scientificMoonDaysPerRealSecondV3(0, 1, [1], 0)).toThrow(RangeError);
    expect(() => systemSceneMoonPresentationTimeScaleV3(2, 1, [1], 0, 0)).toThrow(RangeError);
  });
});
