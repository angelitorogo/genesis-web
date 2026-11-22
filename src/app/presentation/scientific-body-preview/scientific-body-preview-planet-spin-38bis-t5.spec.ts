import { describe, expect, it } from 'vitest';
import {
  scientificBodyPreviewPlanetSpinRadians38bisT5,
  SCIENTIFIC_PLANET_SYNCHRONIZED_PREVIEW_CYCLE_SECONDS_38BIS_T5,
} from './scientific-body-preview-planet-spin-38bis-t5';
import {
  systemSceneBodyDisplaySpinRadians,
  systemSceneBodySpinRadians,
  type SystemSceneBodySpinSnapshot,
} from '../system/system-scene-body-render-state';
import { systemSceneMoonDisplaySpinRadiansV2 } from '../system/system-scene-moon-spin-presentation';

const TWO_PI = Math.PI * 2;
const spin: SystemSceneBodySpinSnapshot = Object.freeze({
  source: 'PLANET_19_3',
  rotationPeriodHours: 318.913, // Chakos B-2: 13.288 días
  axialTiltDegrees: 1.59,
  epochPhaseDegrees: 18,
  isRetrograde: false,
  isSynchronized: true,
});
const timing = Object.freeze({ epochSimulationDay: 73.25, playbackDaysPerRealSecond: 5.0 });

function forwardAngle(from: number, to: number): number {
  return (to - from + TWO_PI) % TWO_PI;
}

describe('38.bis-T5 · rotación legible de fichas planetarias', () => {
  it('limita un planeta sincronizado como Chakos B-2 a 240 s por vuelta visual', () => {
    const epoch = scientificBodyPreviewPlanetSpinRadians38bisT5(spin, 73.25, timing);
    const after1s = scientificBodyPreviewPlanetSpinRadians38bisT5(spin, 78.25, timing);
    const after60s = scientificBodyPreviewPlanetSpinRadians38bisT5(spin, 373.25, timing);
    expect(SCIENTIFIC_PLANET_SYNCHRONIZED_PREVIEW_CYCLE_SECONDS_38BIS_T5).toBe(240);
    expect(epoch).toBeCloseTo(systemSceneBodySpinRadians(spin, 73.25), 12);
    expect(forwardAngle(epoch, after1s)).toBeCloseTo(TWO_PI / 240, 10);
    expect(forwardAngle(epoch, after60s)).toBeCloseTo(TWO_PI / 4, 10);
  });

  it('conserva el ritmo visual al cambiar la aceleración del reloj de la escena', () => {
    const instant1 = scientificBodyPreviewPlanetSpinRadians38bisT5(spin, 73.25 + 0.5, {
      epochSimulationDay: 73.25, playbackDaysPerRealSecond: 0.5,
    });
    const instant2 = scientificBodyPreviewPlanetSpinRadians38bisT5(spin, 73.25 + 100, {
      epochSimulationDay: 73.25, playbackDaysPerRealSecond: 100,
    });
    expect(instant1).toBeCloseTo(instant2, 12);
  });

  it('mantiene la rotación física y coordina la cadencia lenta con SystemScene', () => {
    const acceleratedDay = timing.epochSimulationDay + 5;
    const sceneDisplay = systemSceneBodyDisplaySpinRadians(spin, acceleratedDay, timing);
    const ficheDisplay = scientificBodyPreviewPlanetSpinRadians38bisT5(spin, acceleratedDay, timing);
    expect(sceneDisplay).toBeCloseTo(ficheDisplay, 10);
    expect(sceneDisplay).not.toBeCloseTo(systemSceneBodySpinRadians(spin, acceleratedDay), 3);
    expect(spin.rotationPeriodHours).toBe(318.913);
    expect(spin.isSynchronized).toBe(true);
  });

  it('respeta planetas no sincronizados y los planetas de rotación desconocida', () => {
    const freeSpin = { ...spin, isSynchronized: false };
    const noPeriod = { ...spin, source: 'UNAVAILABLE' as const, rotationPeriodHours: null };
    for (const current of [freeSpin, noPeriod]) {
      const day = timing.epochSimulationDay + 12.3;
      expect(scientificBodyPreviewPlanetSpinRadians38bisT5(current, day, timing))
        .toBeCloseTo(systemSceneBodyDisplaySpinRadians(current, day, timing), 12);
    }
  });

  it('funciona también para planetas compactos sincronizados sin tocar las lunas', () => {
    const compact = { ...spin, source: 'COMPACT_31_4F' as const };
    const first = scientificBodyPreviewPlanetSpinRadians38bisT5(compact, timing.epochSimulationDay, timing);
    const second = scientificBodyPreviewPlanetSpinRadians38bisT5(compact, timing.epochSimulationDay + 5, timing);
    expect(forwardAngle(first, second)).toBeCloseTo(TWO_PI / 240, 10);
    const moon = {
      source: 'MOON_21_4', rotationPeriodHours: 318.913, epochPhaseDegrees: 18, isSynchronized: true,
    };
    expect(systemSceneMoonDisplaySpinRadiansV2(moon, timing.epochSimulationDay + 5, timing))
      .toBeCloseTo(((18 * Math.PI / 180) + TWO_PI / 240) % TWO_PI, 10);
  });

  it('rechaza tiempos inválidos antes de publicarlos', () => {
    expect(() => scientificBodyPreviewPlanetSpinRadians38bisT5(spin, Number.NaN, timing))
      .toThrow(RangeError);
    expect(() => scientificBodyPreviewPlanetSpinRadians38bisT5(spin, 74, {
      epochSimulationDay: 73.25, playbackDaysPerRealSecond: 0,
    })).toThrow(RangeError);
  });
});
