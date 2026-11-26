import { SystemOrbitalMotionEngine } from '../../simulation/orbital/system-orbital-motion-engine';
import {
  SCIENTIFIC_MOON_MIN_CYCLE_REAL_SECONDS_V2,
  SCIENTIFIC_MOON_MAX_CYCLE_REAL_SECONDS_V2,
  scientificMoonOrbitCycleRealSecondsV2,
  scientificMoonDaysPerRealSecondV2,
  systemSceneMoonPresentationTimeScaleV2,
} from './system-scene-secondary-motion';
import { projectSystemSceneMotionContributions } from './system-scene-motion-projection';
import type { SystemSceneOrbitalMotionSnapshot } from './system-scene-snapshot';
import type { SystemSceneScaleSnapshot } from './system-scene-scale-projection';

describe('GENESIS MOONCAD.2 — ciclo visual lunar 12–30 s', () => {
  const axes = Object.freeze([0.01, 0.03, 0.09]);
  const original = JSON.stringify(axes);

  it('establece 12 s para la luna interior, 21 s intermedia y 30 s exterior', () => {
    expect(SCIENTIFIC_MOON_MIN_CYCLE_REAL_SECONDS_V2).toBe(12);
    expect(SCIENTIFIC_MOON_MAX_CYCLE_REAL_SECONDS_V2).toBe(30);
    expect(axes.map(axis => scientificMoonOrbitCycleRealSecondsV2(axis, axes)))
      .toEqual([12, 21, 30]);
  });

  it('interpola linealmente por rango orbital, no por cociente de períodos', () => {
    const many = [1, 2, 3, 4, 5];
    expect(many.map(axis => scientificMoonOrbitCycleRealSecondsV2(axis, many)))
      .toEqual([12, 16.5, 21, 25.5, 30]);
    expect(scientificMoonOrbitCycleRealSecondsV2(100, [1, 100, 1000000])).toBe(21);
  });

  it('usa 21 segundos para una única luna y evita oscilaciones en ejes coincidentes', () => {
    expect(scientificMoonOrbitCycleRealSecondsV2(0.02, [0.02])).toBe(21);
    expect(scientificMoonOrbitCycleRealSecondsV2(0.02, [0.02, 0.02])).toBe(21);
    expect(scientificMoonOrbitCycleRealSecondsV2(0.02, [0.02, 0.02, 0.07])).toBe(12);
    expect(scientificMoonOrbitCycleRealSecondsV2(0.07, [0.02, 0.02, 0.07])).toBe(30);
  });

  it('no depende del orden de datos, foco, escala gráfica ni del reloj de la escena', () => {
    const permuted = [axes[2]!, axes[0]!, axes[1]!];
    for (const axis of axes) {
      expect(scientificMoonOrbitCycleRealSecondsV2(axis, axes))
        .toBe(scientificMoonOrbitCycleRealSecondsV2(axis, permuted));
      expect(scientificMoonOrbitCycleRealSecondsV2(axis * 1000, axes.map(a => a * 1000)))
        .toBe(scientificMoonOrbitCycleRealSecondsV2(axis, axes));
    }
    expect(JSON.stringify(axes)).toBe(original);
  });

  it.each([0.01, 1, 100, 10000])('mantiene duración idéntica con playback=%s', playback => {
    for (const [axis, period, target] of [[0.01, 1, 12], [0.03, 9, 21], [0.09, 180, 30]]) {
      const visualScale = systemSceneMoonPresentationTimeScaleV2(period!, axis!, axes, playback);
      const previewRate = scientificMoonDaysPerRealSecondV2(period!, axis!, axes);
      expect(previewRate).toBeCloseTo(period! / target!, 12);
      expect(playback * visualScale).toBeCloseTo(previewRate, 12);
      expect(period! / (playback * visualScale)).toBeCloseTo(target!, 12);
    }
  });

  it('mantiene paridad Kepleriana de ficha y escena para cada luna en tiempo real', () => {
    const motions = [
      { id: 'inner', semiMajorAxisAu: 0.01, periodDays: 1, eccentricity: 0.21 },
      { id: 'middle', semiMajorAxisAu: 0.03, periodDays: 9, eccentricity: 0.11 },
      { id: 'outer', semiMajorAxisAu: 0.09, periodDays: 180, eccentricity: 0.44 },
    ].map(input => Object.freeze({
      ...input, rotationDegrees: 31, inclinationDegrees: 17, epochMeanAnomalyDegrees: 53,
    } satisfies SystemSceneOrbitalMotionSnapshot));
    const scale: SystemSceneScaleSnapshot = Object.freeze({
      outerRadiusAu: 1, orbitScaleScenePerAu: 8, targetOuterRadiusScene: 8,
    });
    const snapshot = JSON.stringify(motions);
    const playback = 333;
    for (const motion of motions) {
      const previewRate = scientificMoonDaysPerRealSecondV2(
        motion.periodDays, motion.semiMajorAxisAu, axes,
      );
      const sceneRate = systemSceneMoonPresentationTimeScaleV2(
        motion.periodDays, motion.semiMajorAxisAu, axes, playback,
      );
      for (const realSeconds of [0, 0.1, 1, 2, 11.99, 12, 21, 30, 60]) {
        const expected = SystemOrbitalMotionEngine.positionAtSimulationDay(
          motion, realSeconds * previewRate,
        );
        const actual = projectSystemSceneMotionContributions(
          [{ motionId: motion.id, scale: 1, presentationTimeScale: sceneRate }],
          id => id === motion.id ? motion : undefined,
          realSeconds * playback, scale,
        );
        expect(actual.x).toBeCloseTo(expected.xAu * scale.orbitScaleScenePerAu, 10);
        expect(actual.y).toBeCloseTo(expected.yAu * scale.orbitScaleScenePerAu, 10);
        expect(actual.z).toBeCloseTo(expected.zAu * scale.orbitScaleScenePerAu, 10);
      }
    }
    expect(JSON.stringify(motions)).toBe(snapshot);
  });

  it('conserva relojes separados por planeta anfitrión', () => {
    const a = [0.01, 0.02, 0.03];
    const b = [0.1, 0.3];
    expect(scientificMoonOrbitCycleRealSecondsV2(0.02, a)).toBe(21);
    expect(scientificMoonOrbitCycleRealSecondsV2(0.1, b)).toBe(12);
    expect(scientificMoonOrbitCycleRealSecondsV2(0.3, b)).toBe(30);
  });

  it('rechaza valores inválidos y lunas que no pertenecen al grupo', () => {
    expect(() => scientificMoonOrbitCycleRealSecondsV2(1, [])).toThrow(RangeError);
    expect(() => scientificMoonOrbitCycleRealSecondsV2(0, [0])).toThrow(RangeError);
    expect(() => scientificMoonOrbitCycleRealSecondsV2(1, [1, Infinity])).toThrow(RangeError);
    expect(() => scientificMoonOrbitCycleRealSecondsV2(2, [1, 3])).toThrow(RangeError);
    expect(() => scientificMoonDaysPerRealSecondV2(0, 1, [1])).toThrow(RangeError);
    expect(() => systemSceneMoonPresentationTimeScaleV2(1, 1, [1], 0)).toThrow(RangeError);
  });
});
