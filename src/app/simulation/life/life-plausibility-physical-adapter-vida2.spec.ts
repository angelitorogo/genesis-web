import { describe, expect, it } from 'vitest';
import { Vida2PhysicalInput } from './life-plausibility-physical-adapter-vida2';
import type { PlanetScientificResolvedTarget } from '../planetary/planet-scientific-target-resolver';
import type { MoonScientificResolvedTarget } from '../planetary/moon-scientific-target-resolver';

describe('VIDA.2 — adaptadores de la física congelada de planeta y luna', () => {
  it('Phiater B-2: superficie oceánica favorable sin química PRE-33 ni presión alterada', () => {
    const target = { detail: {
      atmosphere: { isDeepEnvelope: false, retainedSurfacePressurePascal: 269320.84 },
      general: { condensedIceMassFraction01: .05 },
      surface: { hasPersistentSurfaceLiquidWater: true,
        surfaceLiquidWaterCoverageFraction01: .77, waterLiquidFraction01: .85,
        waterInventoryIndex01: .8, hasDefinedSolidSurfaceBase: true },
      climate: { meanSurfaceTemperatureKelvin: 309.45 },
      orbit: { referenceMeanInsolationEarth: .375 },
      geology: { isGeologicallyActive: true },
    } } as unknown as PlanetScientificResolvedTarget;
    const before = JSON.stringify(target);
    const result = Vida2PhysicalInput.planet(target);
    expect(result.classification).toBe('PLAUSIBLE');
    expect(result.selectedRoute).toBe('SURFACE');
    expect(JSON.stringify(target)).toBe(before);
  });

  it('Aaekar c I: solo océano lunar subsuperficial modelado; sin atmósfera inventada', () => {
    const target = { detail: {
      tides: { tidalHeatingIndex01: .7 },
      environment: { estimatedSurfaceTemperatureKelvin: 268.7,
        referenceMeanInsolationEarth: .4, waterInventoryIndex01: .9,
        subsurfaceOceanPotentialIndex01: .9, geologicalActivityIndex01: .8,
        inferredIceRichnessIndex01: .9, isGeologicallyActive: true,
        hasSurfaceLiquidWater: false, oceanReality32F2c: {
          state: 'PRESENT_IN_SIMULATED_MODEL', iceCoverThicknessKilometers: 12,
          generatedTotalSurfaceHeatFluxWattsPerSquareMeter: .002,
        } },
    } } as unknown as MoonScientificResolvedTarget;
    const result = Vida2PhysicalInput.moon(target);
    expect(result.classification).toBe('PLAUSIBLE');
    expect(result.selectedRoute).toBe('SUBSURFACE');
    expect(result.routes[0].factors.protection).toBe('UNKNOWN');
  });

  it('Aiatae A-12 I: océano no resuelto, temperatura extrema y energía escasa', () => {
    const target = { detail: {
      tides: { tidalHeatingIndex01: 0 },
      environment: { estimatedSurfaceTemperatureKelvin: 22.7,
        referenceMeanInsolationEarth: .0001, waterInventoryIndex01: .3,
        subsurfaceOceanPotentialIndex01: .2, geologicalActivityIndex01: 0,
        inferredIceRichnessIndex01: .2, isGeologicallyActive: false,
        hasSurfaceLiquidWater: false,
        oceanReality32F2c: { state: 'UNRESOLVED_IN_SIMULATED_MODEL',
          iceCoverThicknessKilometers: null,
          generatedTotalSurfaceHeatFluxWattsPerSquareMeter: null },
      },
    } } as unknown as MoonScientificResolvedTarget;
    const result = Vida2PhysicalInput.moon(target);
    expect(result.classification).toBe('NOT_PLAUSIBLE');
    expect(result.routes[1].factors.water).toBe('UNKNOWN');
  });

  it('luna solo por identidad no recibe física inventada (evaluación fuera del adaptador)', () => {
    expect(Vida2PhysicalInput).not.toHaveProperty('identityOnly');
  });
});
