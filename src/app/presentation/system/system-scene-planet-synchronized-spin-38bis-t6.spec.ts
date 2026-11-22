import { describe, expect, it } from 'vitest';
import {
  SYSTEM_SCENE_SYNCHRONIZED_PLANET_DISPLAY_CYCLE_SECONDS_38BIS_T6,
  systemSceneBodyDisplaySpinRadians,
  systemSceneBodySpinRadians,
  type SystemSceneBodySpinSnapshot,
} from './system-scene-body-render-state';
import {
  scientificBodyPreviewPlanetSpinRadians38bisT5,
} from '../scientific-body-preview/scientific-body-preview-planet-spin-38bis-t5';
import { systemSceneMoonDisplaySpinRadiansV2 } from './system-scene-moon-spin-presentation';

const TAU = Math.PI * 2;
const synchronizedChakos: SystemSceneBodySpinSnapshot = Object.freeze({
  source: 'PLANET_19_3', rotationPeriodHours: 318.913,
  axialTiltDegrees: 1.59, isRetrograde: false,
  isSynchronized: true, epochPhaseDegrees: 18,
});
const timing = Object.freeze({epochSimulationDay: 73.25, playbackDaysPerRealSecond: 5});
const advance = (a: number, b: number) => (b - a + TAU) % TAU;

describe('38.bis-T6 · rotación sincronizada legible en SystemScene', () => {
  it('Chakos B-2: limita la fase visible a 240 s por vuelta con el reloj acelerado', () => {
    const atEpoch = systemSceneBodyDisplaySpinRadians(synchronizedChakos, 73.25, timing);
    const at1s = systemSceneBodyDisplaySpinRadians(synchronizedChakos, 78.25, timing);
    const at60s = systemSceneBodyDisplaySpinRadians(synchronizedChakos, 373.25, timing);
    expect(SYSTEM_SCENE_SYNCHRONIZED_PLANET_DISPLAY_CYCLE_SECONDS_38BIS_T6).toBe(240);
    expect(atEpoch).toBeCloseTo(systemSceneBodySpinRadians(synchronizedChakos, 73.25), 12);
    expect(advance(atEpoch, at1s)).toBeCloseTo(TAU / 240, 11);
    expect(advance(atEpoch, at60s)).toBeCloseTo(TAU / 4, 11);
  });

  it('SystemScene y ficha comparten la cadencia en un planeta sincronizado', () => {
    for (const elapsedSeconds of [0, 1, 8, 30, 61]) {
      const day = timing.epochSimulationDay + elapsedSeconds * timing.playbackDaysPerRealSecond;
      expect(systemSceneBodyDisplaySpinRadians(synchronizedChakos, day, timing)).toBeCloseTo(
        scientificBodyPreviewPlanetSpinRadians38bisT5(synchronizedChakos, day, timing), 10,
      );
    }
  });

  it('es determinista entre fotogramas y mantiene la misma cadencia con otros relojes rápidos', () => {
    for (const rate of [1, 5, 100]) {
      const t = {epochSimulationDay: 73.25, playbackDaysPerRealSecond: rate};
      const a = systemSceneBodyDisplaySpinRadians(synchronizedChakos, 73.25, t);
      const b = systemSceneBodyDisplaySpinRadians(synchronizedChakos, 73.25 + 30 * rate, t);
      expect(advance(a, b)).toBeCloseTo(TAU / 8, 10);
      expect(b).toBe(systemSceneBodyDisplaySpinRadians(synchronizedChakos, 73.25 + 30 * rate, t));
    }
  });

  it('no acelera un giro físicamente lento si el tiempo simulado no está acelerado', () => {
    const t = {epochSimulationDay: 73.25, playbackDaysPerRealSecond: 0.00001};
    const a = systemSceneBodyDisplaySpinRadians(synchronizedChakos, 73.25, t);
    const b = systemSceneBodyDisplaySpinRadians(synchronizedChakos, 73.25 + t.playbackDaysPerRealSecond, t);
    const physicalAdvance = TAU * t.playbackDaysPerRealSecond * 24 / 318.913;
    expect(advance(a, b)).toBeLessThanOrEqual(physicalAdvance + 1e-11);
    expect(advance(a, b)).toBeGreaterThan(0);
  });

  it('conserva ciclos de planetas libres, cuerpos sin rotación y lunas', () => {
    const free = {...synchronizedChakos, isSynchronized: false};
    const invalid = {...synchronizedChakos, source: 'UNAVAILABLE' as const, rotationPeriodHours: null};
    const day = timing.epochSimulationDay + 12.3;
    expect(advance(
      systemSceneBodyDisplaySpinRadians(free, timing.epochSimulationDay, timing),
      systemSceneBodyDisplaySpinRadians(free, day, timing),
    )).toBeGreaterThan(0);
    expect(systemSceneBodyDisplaySpinRadians(invalid, day, timing)).toBeCloseTo(
      systemSceneBodySpinRadians(invalid, day), 12,
    );
    const moon = {source: 'MOON_21_4', rotationPeriodHours: 318.913,
      epochPhaseDegrees: 18, isSynchronized: true};
    const moonAtEpoch = systemSceneMoonDisplaySpinRadiansV2(moon, 73.25, timing);
    const moonAfter = systemSceneMoonDisplaySpinRadiansV2(moon, 78.25, timing);
    expect(advance(moonAtEpoch, moonAfter)).toBeCloseTo(TAU / 240, 11);
    expect(synchronizedChakos.isSynchronized).toBe(true);
    expect(synchronizedChakos.rotationPeriodHours).toBe(318.913);
  });

  it('rechaza un reloj inválido y mantiene la validación de spin', () => {
    expect(() => systemSceneBodyDisplaySpinRadians(synchronizedChakos, Number.NaN, timing)).toThrow(RangeError);
    expect(() => systemSceneBodyDisplaySpinRadians(synchronizedChakos, 75, {...timing, playbackDaysPerRealSecond: 0})).toThrow(RangeError);
  });
});
