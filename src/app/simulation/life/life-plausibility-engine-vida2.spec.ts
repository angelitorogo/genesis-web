import { describe, expect, it } from 'vitest';
import {
  LifePlausibilityEngineVIDA2, type Vida2PhysicalRoute,
} from './life-plausibility-engine-vida2';

const environment = (route: 'SURFACE' | 'SUBSURFACE', extra: Partial<Vida2PhysicalRoute> = {}): Vida2PhysicalRoute => ({
  route, water: 'UNKNOWN', temperatureKelvin: null, interiorLiquidModeled: false,
  interiorPotential: false, pressurePascal: null, hasIceOrRockCover: null,
  coverPotential: false, stellarInsolationEarth: null,
  internalHeatFluxWattsPerSquareMeter: null, internalEnergyPotential: null,
  solidSurface: true, provenance: 'test: read-only', ...extra,
});

describe('VIDA.2 — plausibilidad determinista con 4 factores', () => {
  it('clasifica Phiater-like con océanos superficiales, 309 K y 2,69 bar como plausible', () => {
    const result = LifePlausibilityEngineVIDA2.evaluate(
      environment('SURFACE', { water: 'PRESENT', temperatureKelvin: 309.45,
        pressurePascal: 269_320.84, stellarInsolationEarth: 0.375 }),
      environment('SUBSURFACE'),
    );
    expect(result.classification).toBe('PLAUSIBLE');
    expect(result.selectedRoute).toBe('SURFACE');
    expect(result.routes[0].score).toBe(100);
    expect(result.lifeGenerated).toBe(false);
  });

  it('no aplica 268 K superficiales como temperatura interior lunar', () => {
    const result = LifePlausibilityEngineVIDA2.evaluate(
      environment('SURFACE', { water: 'UNKNOWN', temperatureKelvin: 268.7,
        pressurePascal: null, stellarInsolationEarth: .4 }),
      environment('SUBSURFACE', { water: 'PRESENT', interiorLiquidModeled: true,
        hasIceOrRockCover: true, internalHeatFluxWattsPerSquareMeter: .002 }),
    );
    expect(result.routes[0].classification).toBe('INDETERMINATE');
    expect(result.routes[1].classification).toBe('PLAUSIBLE');
    expect(result.selectedRoute).toBe('SUBSURFACE');
  });

  it('clasifica luna fría con océano no resuelto y ausencia modelada de calor como no plausible, sin negar agua universal', () => {
    const result = LifePlausibilityEngineVIDA2.evaluate(
      environment('SURFACE', { water: 'UNKNOWN', temperatureKelvin: 22.7,
        stellarInsolationEarth: .00001 }),
      environment('SUBSURFACE', { water: 'UNKNOWN', internalEnergyPotential: false }),
    );
    expect(result.classification).toBe('NOT_PLAUSIBLE');
    expect(result.routes[0].factors.temperature).toBe('UNFAVORABLE');
    expect(result.routes[1].factors.water).toBe('UNKNOWN');
  });

  it('conserva indeterminado cuando faltan datos: no crea presión, agua ni ausencia', () => {
    const result = LifePlausibilityEngineVIDA2.evaluate(
      environment('SURFACE'), environment('SUBSURFACE'),
    );
    expect(result.classification).toBe('INDETERMINATE');
    expect(result.routes.every(r => r.score === null)).toBe(true);
    expect(result.routes.every(r => r.factors.water === 'UNKNOWN')).toBe(true);
  });

  it('mantiene indeterminado el subsuelo cuando los cuatro factores son solo condicionales', () => {
    const result = LifePlausibilityEngineVIDA2.evaluate(
      environment('SURFACE', { temperatureKelvin: 50, water: 'UNKNOWN' }),
      environment('SUBSURFACE', { water: 'POTENTIAL', interiorPotential: true,
        coverPotential: true, internalEnergyPotential: true }),
    );
    expect(result.classification).toBe('INDETERMINATE');
    expect(result.selectedRoute).toBe('SUBSURFACE');
    expect(result.routes[1].factors.water).toBe('MARGINAL');
    expect(result.routes[1].score).toBeNull();
    expect(result.routes[1].explanation).toContain('solo condicionales');
  });

  it('admite un nicho interior potencial respaldado por calor cuantificado y sin contradicción', () => {
    const result = LifePlausibilityEngineVIDA2.route(environment('SUBSURFACE', {
      water:'POTENTIAL', interiorPotential:true, coverPotential:true,
      internalEnergyPotential:true, internalHeatFluxWattsPerSquareMeter:0.002,
    }));
    expect(result.classification).toBe('PLAUSIBLE');
    expect(result.score).toBe(72);
  });

  it('no acredita una hipótesis interior cuando el modelo térmico contradice el indicador negativo', () => {
    const result = LifePlausibilityEngineVIDA2.route(environment('SUBSURFACE', {
      water:'POTENTIAL', interiorPotential:true, coverPotential:true,
      internalEnergyPotential:false, internalHeatFluxWattsPerSquareMeter:0.002,
    }));
    expect(result.classification).toBe('INDETERMINATE');
    expect(result.score).toBeNull();
  });

  it('conserva el océano CT-0 presente aunque el calor sea solo condicional', () => {
    const result = LifePlausibilityEngineVIDA2.route(environment('SUBSURFACE', {
      water:'PRESENT', interiorLiquidModeled:true, hasIceOrRockCover:true,
      internalEnergyPotential:true,
    }));
    expect(result.classification).toBe('PLAUSIBLE');
  });

  it('rechaza físicamente una ruta superficial gaseosa aunque se le pase temperatura templada', () => {
    const result = LifePlausibilityEngineVIDA2.route(environment('SURFACE', {
      water: 'ABSENT', temperatureKelvin: 290, pressurePascal: 100_000,
      stellarInsolationEarth: 1, solidSurface: false,
    }));
    expect(result.classification).toBe('NOT_PLAUSIBLE');
  });

  it('es pura, reproducible y permite estadísticas por clase, sin selección aleatoria', () => {
    const s = environment('SURFACE', { water: 'PRESENT', temperatureKelvin: 290,
      pressurePascal: 100_000, stellarInsolationEarth: 1 });
    const u = environment('SUBSURFACE');
    const before = JSON.stringify([s, u]);
    const first = LifePlausibilityEngineVIDA2.evaluate(s, u);
    expect(LifePlausibilityEngineVIDA2.evaluate(s, u)).toEqual(first);
    expect(JSON.stringify([s, u])).toBe(before);
    expect(LifePlausibilityEngineVIDA2.audit([
      { kind: 'PLANET', assessment: first },
      { kind: 'MOON', assessment: LifePlausibilityEngineVIDA2.evaluate(environment('SURFACE'), u) },
    ])).toEqual([
      expect.objectContaining({kind:'PLANET', plausible:1, total:1}),
      expect.objectContaining({kind:'MOON', indeterminate:1, total:1}),
    ]);
  });
});
