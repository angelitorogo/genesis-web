import { SystemOrbitalMotionEngine } from '../../simulation/orbital/system-orbital-motion-engine';
import {
  SCIENTIFIC_MOON_OUTERMOST_CYCLE_REAL_SECONDS_V1,
  scientificMoonGroupDaysPerRealSecondV1,
  systemSceneMoonGroupPresentationTimeScaleV1,
} from './system-scene-secondary-motion';
import { projectSystemSceneMotionContributions } from './system-scene-motion-projection';
import type { SystemSceneOrbitalMotionSnapshot } from './system-scene-snapshot';
import type { SystemSceneScaleSnapshot } from './system-scene-scale-projection';

describe('GENESIS MOONCAD.1 — paridad de cadencia lunar ficha/SystemScene', () => {
  const periods = Object.freeze([2, 8, 24]);
  const motion = Object.freeze({
    id: 'moon-test', semiMajorAxisAu: 0.01, eccentricity: 0.18,
    periodDays: 8, rotationDegrees: 24, inclinationDegrees: 17,
    epochMeanAnomalyDegrees: 33,
  } satisfies SystemSceneOrbitalMotionSnapshot);
  const scale: SystemSceneScaleSnapshot = Object.freeze({
    outerRadiusAu: 10, orbitScaleScenePerAu: 2, targetOuterRadiusScene: 20,
  });

  it('usa 90 segundos en la luna de período mayor como la ficha', () => {
    expect(SCIENTIFIC_MOON_OUTERMOST_CYCLE_REAL_SECONDS_V1).toBe(90);
    const daysPerSecond = scientificMoonGroupDaysPerRealSecondV1(periods);
    expect(daysPerSecond).toBeCloseTo(24 / 90, 12);
    expect(24 / daysPerSecond).toBeCloseTo(90, 12);
    expect(8 / daysPerSecond).toBeCloseTo(30, 12);
    expect(2 / daysPerSecond).toBeCloseTo(7.5, 12);
  });

  it.each([0.1, 1, 10, 1000])('no depende del reloj acelerado de SystemScene: %s días/s', playback => {
    const visualScale = systemSceneMoonGroupPresentationTimeScaleV1(periods, playback);
    expect(playback * visualScale).toBeCloseTo(scientificMoonGroupDaysPerRealSecondV1(periods), 12);
    for (const period of periods) {
      expect(period / (playback * visualScale)).toBeCloseTo(
        period / scientificMoonGroupDaysPerRealSecondV1(periods), 12,
      );
    }
  });

  it('mantiene idéntica velocidad por grupo aunque cambie el foco de luna', () => {
    expect(systemSceneMoonGroupPresentationTimeScaleV1([24, 2, 8], 12)).toBeCloseTo(
      systemSceneMoonGroupPresentationTimeScaleV1([8, 24, 2], 12), 14,
    );
    expect(systemSceneMoonGroupPresentationTimeScaleV1([8, 24, 2], 12)).toBeCloseTo(
      systemSceneMoonGroupPresentationTimeScaleV1([24, 2, 8], 12), 14,
    );
  });

  it('proyecta el mismo punto Kepleriano que la ficha en cualquier instante real', () => {
    const playback = 60;
    const visualTimeScale = systemSceneMoonGroupPresentationTimeScaleV1(periods, playback);
    const before = JSON.stringify(motion);
    for (const realSeconds of [0, 0.2, 1, 3, 30, 45, 90]) {
      const previewDay = realSeconds * scientificMoonGroupDaysPerRealSecondV1(periods);
      const sceneDay = realSeconds * playback;
      const expected = SystemOrbitalMotionEngine.positionAtSimulationDay(motion, previewDay);
      const scene = projectSystemSceneMotionContributions(
        [{ motionId: motion.id, scale: 1, presentationTimeScale: visualTimeScale }],
        id => id === motion.id ? motion : undefined,
        sceneDay, scale,
      );
      expect(scene.x).toBeCloseTo(expected.xAu * scale.orbitScaleScenePerAu, 11);
      expect(scene.y).toBeCloseTo(expected.yAu * scale.orbitScaleScenePerAu, 11);
      expect(scene.z).toBeCloseTo(expected.zAu * scale.orbitScaleScenePerAu, 11);
    }
    expect(JSON.stringify(motion)).toBe(before);
  });

  it('no altera la cadencia de un planeta ni su reloj estelar', () => {
    const playback = 100;
    const localMoonTimeScale = systemSceneMoonGroupPresentationTimeScaleV1(periods, playback);
    const planet = { ...motion, id: 'planet-test', periodDays: 1200 };
    const moon = { ...motion, id: 'moon-test' };
    const atSecond = 15;
    const projected = projectSystemSceneMotionContributions(
      [
        { motionId: planet.id, scale: 1, presentationTimeScale: 0.4 },
        { motionId: moon.id, scale: 1, presentationTimeScale: localMoonTimeScale },
      ],
      id => id === planet.id ? planet : id === moon.id ? moon : undefined,
      atSecond * playback, scale,
    );
    const planetPosition = SystemOrbitalMotionEngine.positionAtSimulationDay(planet, atSecond * playback * 0.4);
    const moonPosition = SystemOrbitalMotionEngine.positionAtSimulationDay(moon,
      atSecond * scientificMoonGroupDaysPerRealSecondV1(periods));
    expect(projected.x).toBeCloseTo((planetPosition.xAu + moonPosition.xAu) * scale.orbitScaleScenePerAu, 11);
    expect(projected.y).toBeCloseTo((planetPosition.yAu + moonPosition.yAu) * scale.orbitScaleScenePerAu, 11);
    expect(projected.z).toBeCloseTo((planetPosition.zAu + moonPosition.zAu) * scale.orbitScaleScenePerAu, 11);
  });

  it('admite una sola luna y grupos distintos sin cadencias cruzadas', () => {
    expect(systemSceneMoonGroupPresentationTimeScaleV1([5], 1)).toBeCloseTo(5 / 90, 12);
    expect(systemSceneMoonGroupPresentationTimeScaleV1([10, 30], 3)).toBeCloseTo(30 / 270, 12);
    expect(systemSceneMoonGroupPresentationTimeScaleV1([10, 5], 3)).toBeCloseTo(10 / 270, 12);
    expect(periods).toEqual([2, 8, 24]);
  });

  it('rechaza entradas inválidas sin introducir períodos sintéticos', () => {
    expect(() => scientificMoonGroupDaysPerRealSecondV1([])).toThrow(RangeError);
    expect(() => scientificMoonGroupDaysPerRealSecondV1([0])).toThrow(RangeError);
    expect(() => scientificMoonGroupDaysPerRealSecondV1([Number.NaN])).toThrow(RangeError);
    expect(() => systemSceneMoonGroupPresentationTimeScaleV1([3], 0)).toThrow(RangeError);
    expect(() => systemSceneMoonGroupPresentationTimeScaleV1([3], Infinity)).toThrow(RangeError);
  });
});
