import { describe, expect, it } from 'vitest';
import { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import { MoonAtmosphereAutomaticV2Source32F1c as Source } from './moon-atmosphere-automatic-v2-32-f-1c';
import { MoonAtmosphereEngine } from './moon-atmosphere-engine';
import type { MoonTidalState } from '../../domain/planetary/moon-tidal-state';

const cold = new MoonPhysicalProperties(11, 1, 0.00016, 0.078, 1.85, 0.026);
const warm = new MoonPhysicalProperties(11, 2, 0.001, 0.18, 1.32, 0.043);
const tidal = (moon: MoonPhysicalProperties) => ({
  hostPlanetOrdinal: moon.hostPlanetOrdinal,
  moonOrdinal: moon.moonOrdinal,
  tidalHeatingIndex01: 0.45,
} as MoonTidalState);

describe('32.F.1c — restricciones atmosféricas físicas V2, sin fuentes inventadas', () => {
  it('convierte radio/gravedad de dos lunas V2 en factores hidrostáticos correctos y diferentes', () => {
    const a = Source.fromMaterialized(cold, 235.7);
    const b = Source.fromMaterialized(warm, 301.7);
    const r = cold.radiusEarth * 6_371_000;
    const g = cold.surfaceGravityEarth * 9.80665;
    expect(a.escapeVelocityMetersPerSecond).toBeCloseTo(Math.sqrt(2 * g * r), 9);
    expect(a.kilogramsOfGasPerPascal).toBeCloseTo(4 * Math.PI * r ** 2 / g, 9);
    expect(a.escapeVelocityMetersPerSecond).not.toBe(b.escapeVelocityMetersPerSecond);
    expect(a.kilogramsOfGasPerPascal).not.toBe(b.kilogramsOfGasPerPascal);
    expect(b.waterVaporSaturationPascalIfEquilibrated)
      .toBeGreaterThan(a.waterVaporSaturationPascalIfEquilibrated ?? 0);
    expect(a.pressureStatus).toBe('UNRESOLVED_WITHOUT_INDEPENDENT_GAS_MASS');
    expect(Object.isFrozen(a)).toBe(true);
  });
  it('no falsea la curva de saturación fuera de su dominio sin clamp', () => {
    expect(Source.fromMaterialized(warm, 120).waterVaporSaturationPascalIfEquilibrated).toBeNull();
    expect(Source.fromMaterialized(warm, 700).waterVaporSaturationPascalIfEquilibrated).toBeNull();
  });
  it('no promueve gravedad, temperatura, inventario relativo o irradiación a una atmósfera real', () => {
    const a = MoonAtmosphereEngine.assess(cold, tidal(cold), 235.7, 0.873, 0.652);
    const b = MoonAtmosphereEngine.assess(warm, tidal(warm), 301.7, 1, 1.873);
    expect(a.automaticConstraints32F1c?.escapeVelocityMetersPerSecond).toBeGreaterThan(0);
    expect(b.automaticConstraints32F1c?.escapeVelocityMetersPerSecond).toBeGreaterThan(0);
    expect(a.physicalBalance32F1).toBeNull();
    expect(b.physicalBalance32F1).toBeNull();
    expect(a.pressureBasis).not.toBe('PHYSICAL_BALANCE');
    expect(b.pressureBasis).not.toBe('PHYSICAL_BALANCE');
    expect(a.automaticConstraints32F1c).toEqual(
      MoonAtmosphereEngine.assess(cold, tidal(cold), 235.7, 0.873, 0.652).automaticConstraints32F1c,
    );
  });
  it('rechaza radio, gravedad y temperaturas no físicas antes de publicar resultados', () => {
    expect(() => Source.fromMaterialized({ radiusEarth: 0, surfaceGravityEarth: 1 }, 300)).toThrow();
    expect(() => Source.fromMaterialized({ radiusEarth: 1, surfaceGravityEarth: Number.NaN }, 300)).toThrow();
    expect(() => Source.fromMaterialized(warm, Number.POSITIVE_INFINITY)).toThrow();
  });
});
