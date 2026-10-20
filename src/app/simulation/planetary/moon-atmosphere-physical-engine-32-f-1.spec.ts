import { describe, expect, it } from 'vitest';
import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import type { MoonAtmospherePhysicalForcing32F1 } from '../../domain/planetary/moon-atmosphere-physical-32-f-1';
import { MoonAtmospherePhysicalEngine32F1 as Physics } from './moon-atmosphere-physical-engine-32-f-1';
import { MoonAtmosphereEngine } from './moon-atmosphere-engine';
import type { MoonTidalState } from '../../domain/planetary/moon-tidal-state';

const moon = new MoonPhysicalProperties(1, 1, 0.0225, 0.404, 1.88, 0.138);
const tidal = { hostPlanetOrdinal: 1, moonOrdinal: 1, tidalHeatingIndex01: 0.1 } as MoonTidalState;
const annual = 365.25 * 86400;
const gases = (initialGasMassKilograms: number) => ({
  gas: AtmosphereGas.NITROGEN, initialGasMassKilograms,
  replenishmentKilogramsPerSecond: 0,
  thermalEscapeKilogramsPerSecond: 0,
  particleEscapeKilogramsPerSecond: 0,
  photolysisRatePerSecond: 0,
  photolysisEscapingFraction01: 1,
});
const forcing = (gas: ReturnType<typeof gases>, others: Partial<MoonAtmospherePhysicalForcing32F1> = {}) => ({
  sourceKind: 'INDEPENDENT_MASS_AND_FLUXES' as const,
  sourceId: 'QUANTIFIED_TEST_SOURCE', durationSeconds: annual,
  collisionCrossSectionSquareMeters: 1e-19,
  gasForcings: [gas], ...others,
});
const run = (f: MoonAtmospherePhysicalForcing32F1, temp = 140) => Physics.evaluate(moon, temp, f);

function conserved(b: ReturnType<typeof run>) {
  const incoming = b.initialGasMassKilograms + b.replenishedMassKilograms;
  const outgoing = b.remainingGasMassKilograms + b.thermalEscapedMassKilograms +
    b.particleEscapedMassKilograms + b.photolysisEscapedMassKilograms +
    b.photochemicalProductMassKilograms + b.condensedMassKilograms;
  // Mass budgets near 1e18 kg accumulate floating-point rounding across
  // integration steps. Assert conservation relatively, not to 0.005 kg.
  const scale = Math.max(1, Math.abs(incoming), Math.abs(outgoing));
  expect(Math.abs(outgoing - incoming) / scale).toBeLessThanOrEqual(1e-12);
}

describe('32.F.1 — balance físico cuantitativo y semántica lunar', () => {
  it('convierte masa en presión hidrostática independiente del índice heredado y conserva masa', () => {
    const b = run(forcing(gases(1e18)));
    const r = 0.404 * 6_371_000;
    expect(b.surfacePressurePascal).toBeCloseTo(1e18 * (0.138 * 9.80665) / (4 * Math.PI * r ** 2), 5);
    expect(b.regime).toBe('STABLE_OVER_EVALUATED_INTERVAL');
    expect(Object.isFrozen(b)).toBe(true);
    expect(Object.isFrozen(b.gasResults)).toBe(true);
    conserved(b);
  });
  it('distingue atmósfera transitoria cuando la pérdida supera la reposición', () => {
    const b = run(forcing({ ...gases(1e18), thermalEscapeKilogramsPerSecond: 1e10,
      particleEscapeKilogramsPerSecond: 1e9, replenishmentKilogramsPerSecond: 1e8 }));
    expect(b.regime).toBe('TRANSIENT');
    expect(b.thermalEscapedMassKilograms).toBeGreaterThan(0);
    expect(b.particleEscapedMassKilograms).toBeGreaterThan(0);
    expect(b.replenishedMassKilograms).toBeGreaterThan(0);
    conserved(b);
  });
  it('puede producir exosfera sin denominarla atmósfera estable', () => {
    const b = run(forcing(gases(1000)));
    expect(b.regime).toBe('EXOSPHERE');
    expect(b.surfaceKnudsenNumber).toBeGreaterThanOrEqual(1);
    conserved(b);
  });
  it('solo llama ausencia a masa inicial y fuente cuantitativamente nulas', () => {
    const b = run(forcing(gases(0)));
    expect(b.regime).toBe('ABSENT_IN_EVALUATED_MODEL');
    expect(b.surfacePressurePascal).toBe(0);
    conserved(b);
  });
  it('mantiene fotoproductos no identificados como presión no resuelta', () => {
    const b = run(forcing({ ...gases(1e18), photolysisRatePerSecond: 1e-8,
      photolysisEscapingFraction01: 0.25 }));
    expect(b.regime).toBe('UNRESOLVED_PHOTOCHEMISTRY');
    expect(b.photochemicalProductMassKilograms).toBeGreaterThan(0);
    expect(b.photolysisEscapedMassKilograms).toBeGreaterThan(0);
    expect(b.surfacePressurePascal).toBeNull();
    conserved(b);
  });
  it('separa pérdida fotoquímica real de simple fotodisociación', () => {
    const b = run(forcing({ ...gases(1e18), photolysisRatePerSecond: 1e-8,
      photolysisEscapingFraction01: 1 }));
    expect(b.photochemicalProductMassKilograms).toBe(0);
    expect(b.photolysisEscapedMassKilograms).toBeGreaterThan(0);
    expect(b.surfacePressurePascal).not.toBeNull();
    conserved(b);
  });
  it('condensa vapor a partir de presión de saturación a la temperatura indicada', () => {
    const b = run(forcing({ ...gases(1e18), gas: AtmosphereGas.WATER_VAPOR }), 180);
    expect(b.condensedMassKilograms).toBeGreaterThan(0);
    expect(b.remainingGasMassKilograms).toBeLessThan(1e18);
    conserved(b);
  });
  it('no inventa flujos, masa o presión física cuando no se proporciona el forzamiento', () => {
    const old = MoonAtmosphereEngine.assess(moon, tidal, 94, 0.8, 0.01);
    expect(old.physicalBalance32F1).toBeNull();
    expect(old.pressureBasis).toBe('CONDITIONAL_SCENARIO');
    const withSource = MoonAtmosphereEngine.assess(moon, tidal, 140, 0.8, 0.01, forcing(gases(1e18)));
    expect(withSource.pressureBasis).toBe('PHYSICAL_BALANCE');
    expect(withSource.physicalBalance32F1?.regime).toBe('STABLE_OVER_EVALUATED_INTERVAL');
    expect(withSource.estimatedSurfacePressurePascal).toBe(withSource.physicalBalance32F1?.surfacePressurePascal);
  });
  it('rechaza datos inválidos, especies duplicadas y unidades negativas', () => {
    expect(() => run(forcing(gases(-1)))).toThrow();
    expect(() => run(forcing(gases(1000), { durationSeconds: 0 }))).toThrow();
    expect(() => run(forcing(gases(1000), { gasForcings: [gases(1), gases(2)] }))).toThrow();
    expect(() => run(forcing({ ...gases(1), photolysisEscapingFraction01: 2 }))).toThrow();
  });
  it('es determinista por estado físico sin excepciones por seed', () => {
    const f = forcing({ ...gases(1e18), particleEscapeKilogramsPerSecond: 1e8 });
    expect(run(f)).toEqual(run(f));
  });
});
