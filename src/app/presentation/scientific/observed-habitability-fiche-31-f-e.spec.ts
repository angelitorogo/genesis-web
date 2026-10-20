import { describe, expect, it } from 'vitest';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import type { PlanetScientificResolvedTarget } from '../../simulation/planetary/planet-scientific-target-resolver';
import type { MoonScientificResolvedTarget } from '../../simulation/planetary/moon-scientific-target-resolver';
import { ObservedHabitabilityFiche31Fe } from './observed-habitability-fiche-31-f-e';

const KEY = 'G3/S-17/O8/B0';
const planet = (pressure: number | null, mean = 290, surface = true): PlanetScientificResolvedTarget => ({
  identity: { planetOrdinal: 1 },
  detail: {
    surface: { hasDefinedSolidSurfaceBase: surface },
    atmosphere: { isDeepEnvelope: !surface, retainedSurfacePressurePascal: pressure },
    climate: { meanSurfaceTemperatureKelvin: mean },
  },
} as unknown as PlanetScientificResolvedTarget);

const moon = (water = false): MoonScientificResolvedTarget => ({
  identity: { designation: 'TEST-SECRET-NAME' },
  detail: { environment: {
    estimatedSurfaceTemperatureKelvin: 280,
    waterRegime: 'POTENTIAL_ONLY',
    atmosphereAssessment: {
      pressureBasis: 'CONDITIONAL_SCENARIO', estimatedSurfacePressurePascal: 100000,
    },
    internalWaterAssessment: water ? { iceShellThermalRegime: 'CONDITIONAL_ICE_OCEAN' } : null,
    hasSubsurfaceOcean: water,
  } },
} as unknown as MoonScientificResolvedTarget);

const projectPlanet = (p = planet(100000)) =>
  ObservedHabitabilityFiche31Fe.planet(p, DiscoveryState.CONFIRMED, true, KEY, 'SINGLE');
const projectMoon = (m = moon()) =>
  ObservedHabitabilityFiche31Fe.moon(m, DiscoveryState.CONFIRMED, true, `${KEY}/M0`, 'BINARY');

describe('31.F.e — fichas científicas, observación autorizada sin Ground Truth', () => {
  it.each([
    DiscoveryState.UNKNOWN, DiscoveryState.DETECTED, DiscoveryState.DISCOVERED,
    DiscoveryState.VISITED, DiscoveryState.CATALOGUED,
  ])('no lee un planeta oculto para %s', state => {
    const secret = new Proxy({}, { get: () => { throw new Error('private planet read'); } });
    expect(ObservedHabitabilityFiche31Fe.planet(secret as PlanetScientificResolvedTarget,
      state, true, KEY, 'SINGLE')).toBe(null);
  });
  it('CONFIRMED sin permiso no consulta los datos internos, ni siquiera el cuerpo', () => {
    const secret = new Proxy({}, { get: () => { throw new Error('private moon read'); } });
    expect(ObservedHabitabilityFiche31Fe.moon(secret as MoonScientificResolvedTarget,
      DiscoveryState.CONFIRMED, false, `${KEY}/M0`, 'SINGLE')).toBe(null);
  });
  it('publica solo estados derivados de campos ya consultables, nunca escenarios internos', () => {
    const p = projectPlanet();
    expect(p?.routes).toHaveLength(3);
    expect(p?.routes[0].status).toBe('Evidencia insuficiente');
    expect(p?.routes[0].evidence).toContain('modelos o inferencias');
    expect(p?.routes[1].status).toBe('Evidencia insuficiente');
    const view = JSON.stringify(p);
    expect(view).not.toMatch(/SIMULATED_REALITY|PHYSICAL_POTENTIAL|private|seed|sourceKey|abiogenesis|lifeProbability/);
    expect(view).toContain('no de continuidad histórica ni detección de vida');
  });
  it('reconoce una presión publicada incompatible sin interpretar habitabilidad terrestre', () => {
    const p = projectPlanet(planet(100));
    expect(p?.routes[0].status).toMatch(/incompatible/);
    expect(p?.routes[1].status).toBe('Evidencia insuficiente');
  });
  it('no asigna presión de superficie a gigantes con envoltura profunda', () => {
    const p = projectPlanet(planet(1e8, 1500, false));
    expect(p?.routes[0].evidence).toContain('Sin criterios suficientes autorizados');
  });
  it('no confunde un escenario lunar de presión con una observación directa', () => {
    const m = projectMoon();
    expect(m?.routes[0].evidence).toContain('modelos o inferencias');
    expect(m?.routes[0].status).toBe('Evidencia insuficiente');
    expect(m?.routes[1].status).toBe('Evidencia insuficiente');
    expect(JSON.stringify(m)).not.toContain('TEST-SECRET-NAME');
  });
  it('ni siquiera un índice lunar de océano hipotético se convierte en un océano certificado', () => {
    const m = projectMoon(moon(true));
    expect(m?.routes[1].status).toBe('Evidencia insuficiente');
    expect(m?.routes[1].evidence).toContain('Sin criterios suficientes autorizados');
  });
  it('no promueve las rutas alternativas sin una fuente específica autorizada', () => {
    expect(projectPlanet()?.routes[2].status).toBe('Sin evidencia específica autorizada');
    expect(projectMoon()?.routes[2].status).toBe('Sin evidencia específica autorizada');
  });
  it('los anfitriones compactos sin 31.F.b conectado quedan sin evaluación', () => {
    const result = ObservedHabitabilityFiche31Fe.unresolved('MOON', DiscoveryState.CONFIRMED,
      true, `${KEY}/M0`);
    expect(result?.routes[0].evidence).toContain('Sin criterios suficientes autorizados');
    expect(result?.routes[1].status).toBe('Evidencia insuficiente');
    expect(ObservedHabitabilityFiche31Fe.unresolved('PLANET', DiscoveryState.CATALOGUED,
      true, KEY)).toBe(null);
  });
  it('mantiene proyección determinista e inmutable', () => {
    const a = projectPlanet();
    expect(a).toEqual(projectPlanet());
    expect(Object.isFrozen(a)).toBe(true);
    expect(Object.isFrozen(a?.routes)).toBe(true);
    expect(Object.isFrozen(a?.routes[0])).toBe(true);
  });
});


describe('31.12 — desglose observacional diferenciado por cuerpo', () => {
  const publishedPlanet = (pressure: number, temperature: number, coverage: number, persistent: boolean) => ({
    identity: { planetOrdinal: 2, designation: 'NO_PUBLICAR_IDENTIDAD' },
    detail: {
      surface: {
        hasDefinedSolidSurfaceBase: true, waterInventoryIndex01: coverage === 0 ? 0 : 0.65,
        surfaceLiquidWaterCoverageFraction01: coverage, hasPersistentSurfaceLiquidWater: persistent,
      },
      atmosphere: {
        isDeepEnvelope: false, retainedSurfacePressurePascal: pressure,
        retainedGasComposition: [{ gas: 'WATER_VAPOR', moleFraction01: 0.01 }],
      },
      climate: {
        meanSurfaceTemperatureKelvin: temperature,
        minimumSurfaceTemperatureKelvin: temperature - 12,
        maximumSurfaceTemperatureKelvin: temperature + 12,
      },
    },
  } as unknown as PlanetScientificResolvedTarget);

  it('planetas contrastantes producen criterios y hechos distintos, conservando UNKNOWN global', () => {
    const temperate = projectPlanet(publishedPlanet(101325, 289, 0.35, true));
    const exposed = projectPlanet(publishedPlanet(100, 210, 0, false));
    expect(temperate?.routes[0].facts).not.toEqual(exposed?.routes[0].facts);
    expect(temperate?.routes[0].criteria.find(c => c.label === 'Presión o confinamiento')?.status)
      .toBe('Compatible');
    expect(exposed?.routes[0].criteria.find(c => c.label === 'Presión o confinamiento')?.status)
      .toBe('Incompatible');
    expect(exposed?.routes[0].criteria.find(c => c.label === 'Reservorio líquido')?.status)
      .toBe('Incompatible');
    expect(temperate?.routes[0].facts.find(f => f.label.includes('Cobertura líquida'))?.value)
      .toBe('35 %');
    expect(exposed?.routes[0].status).toMatch(/incompatible/);
    expect(temperate?.routes[0].status).toBe('Evidencia insuficiente');
    expect(temperate?.routes[0].criteria.find(c => c.label === 'Exposición radiativa')?.status)
      .toBe('Desconocido');
    expect(temperate?.routes[0].facts.every(f => f.origin === 'Modelo físico CT-0')).toBe(true);
  });

  it('lunas con escenarios distintos presentan hipótesis específicas, nunca océano detectado', () => {
    const icy = projectMoon({
      ...moon(true),
      detail: { environment: {
        estimatedSurfaceTemperatureKelvin: 130, waterRegime: 'POTENTIAL_ONLY',
        waterInventoryIndex01: 0.8,
        atmosphereAssessment: { pressureBasis: 'CONDITIONAL_SCENARIO', estimatedSurfacePressurePascal: 300 },
        internalWaterAssessment: { iceShellThermalRegime: 'CONDITIONAL_ICE_OCEAN', oceanConfirmed: false },
      } },
    } as unknown as MoonScientificResolvedTarget);
    const dry = projectMoon({
      ...moon(false),
      detail: { environment: {
        estimatedSurfaceTemperatureKelvin: 350, waterRegime: 'POTENTIAL_ONLY',
        waterInventoryIndex01: 0.02,
        atmosphereAssessment: { pressureBasis: 'UNRESOLVED', estimatedSurfacePressurePascal: null },
        internalWaterAssessment: { iceShellThermalRegime: 'NO_STABLE_SURFACE_ICE', oceanConfirmed: false },
      } },
    } as unknown as MoonScientificResolvedTarget);
    expect(icy?.routes[1].facts).not.toEqual(dry?.routes[1].facts);
    expect(icy?.routes[1].facts[0].value).toContain('Hipótesis');
    expect(icy?.routes[1].criteria.find(c => c.label === 'Temperatura')?.status).toBe('Compatible');
    expect(dry?.routes[1].criteria.find(c => c.label === 'Temperatura')?.status).toBe('Desconocido');
    // Presentational temperature opportunity is independent of an unresolved
    // pressure and cannot promote a water-reservoir or whole-route verdict.
    expect(dry?.routes[0].criteria.find(c => c.label === 'Temperatura')?.status).toBe('Compatible');
    expect(dry?.routes[0].criteria.find(c => c.label === 'Presión o confinamiento')?.status)
      .toBe('Desconocido');
    expect(icy?.routes[1].status).toBe('Evidencia insuficiente');
    expect(JSON.stringify(icy)).not.toMatch(/oceanConfirmed|sourceKey|TEST-SECRET-NAME/);
    expect(icy?.routes[0].facts.some(f => f.origin === 'Inferencia condicional CT-0')).toBe(true);
  });

  it('rechaza el acceso antes de leer propiedades, incluso si los datos son diferentes', () => {
    const secret = new Proxy({}, { get: () => { throw new Error('lectura prohibida'); } });
    expect(ObservedHabitabilityFiche31Fe.planet(secret as PlanetScientificResolvedTarget,
      DiscoveryState.CATALOGUED, true, KEY, 'TRIPLE')).toBeNull();
    expect(ObservedHabitabilityFiche31Fe.moon(secret as MoonScientificResolvedTarget,
      DiscoveryState.CONFIRMED, false, `${KEY}/M0`, 'BINARY')).toBeNull();
  });

  it('no filtra identificadores, seeds, claves de evidencia ni informes privados', () => {
    const projected = projectPlanet(publishedPlanet(101325, 289, 0.35, true));
    expect(JSON.stringify(projected)).not.toMatch(/NO_PUBLICAR_IDENTIDAD|sourceKey|bodyKey|lifeProbability|SIMULATED_REALITY|seed|sourceRetained/);
    expect(projected?.routes[2].criteria).toEqual([]);
    expect(projected?.routes[2].facts).toEqual([]);
    expect(projected).toEqual(projectPlanet(publishedPlanet(101325, 289, 0.35, true)));
    expect(Object.isFrozen(projected?.routes[0].criteria)).toBe(true);
    expect(Object.isFrozen(projected?.routes[0].facts)).toBe(true);
  });
});


describe('31.12 — ajuste semántico lunar sin datos inventados', () => {
  const environmentalMoon = (
    temperature: number,
    iceShellThermalRegime: 'CONDITIONAL_ICE_OCEAN' | 'NO_STABLE_SURFACE_ICE' | null,
  ): MoonScientificResolvedTarget => ({
    identity: { designation: 'LUNA_PRIVADA' },
    detail: { environment: {
      estimatedSurfaceTemperatureKelvin: temperature,
      waterRegime: 'POTENTIAL_ONLY',
      waterInventoryIndex01: 1,
      subsurfaceOceanPotentialIndex01: 1,
      atmosphereAssessment: {
        pressureBasis: 'UNRESOLVED', estimatedSurfacePressurePascal: null,
      },
      internalWaterAssessment: iceShellThermalRegime === null ? null : { iceShellThermalRegime },
    } },
  } as unknown as MoonScientificResolvedTarget);

  it('B B-11 I: 301,7 K admite solo oportunidad térmica condicional, sin presión ni agua afirmadas', () => {
    const result = projectMoon(environmentalMoon(301.7, 'NO_STABLE_SURFACE_ICE'));
    const surface = result!.routes[0];
    const temperature = surface.criteria.find(c => c.label === 'Temperatura');
    expect(temperature).toMatchObject({ status: 'Compatible', origin: 'Inferencia del modelo' });
    expect(temperature?.explanation).toMatch(/no hay presión ni reservorio/i);
    expect(surface.criteria.find(c => c.label === 'Presión o confinamiento'))
      .toMatchObject({ status: 'Desconocido', origin: 'Sin evidencia' });
    expect(surface.criteria.find(c => c.label === 'Reservorio líquido')?.status)
      .toBe('Desconocido');
    expect(surface.status).toBe('Evidencia insuficiente');
    expect(result?.note).toContain('no de continuidad histórica ni detección de vida');
  });

  it('B B-9 III: 235,7 K mantiene superficie no resuelta y subsuelo condicional, sin confirmar océano', () => {
    const result = projectMoon(environmentalMoon(235.7, 'CONDITIONAL_ICE_OCEAN'));
    expect(result?.routes[0].criteria.find(c => c.label === 'Temperatura')?.status)
      .toBe('Desconocido');
    expect(result?.routes[1].criteria.find(c => c.label === 'Temperatura'))
      .toMatchObject({ status: 'Compatible', origin: 'Inferencia del modelo' });
    expect(result?.routes[1].criteria.find(c => c.label === 'Temperatura')?.explanation)
      .toContain('hipótesis conductiva');
    expect(result?.routes[1].criteria.find(c => c.label === 'Reservorio líquido')?.status)
      .toBe('Desconocido');
    expect(result?.routes[1].status).toBe('Evidencia insuficiente');
  });

  it('sin cubierta de hielo global estable no confunde esa restricción con negar TODO reservorio interior', () => {
    const result = projectMoon(environmentalMoon(301.7, 'NO_STABLE_SURFACE_ICE'));
    const subsurface = result!.routes[1];
    for (const name of ['Temperatura', 'Geometría del reservorio']) {
      const criterion = subsurface.criteria.find(c => c.label === name);
      expect(criterion?.status).toBe('Desconocido');
      expect(criterion?.explanation).toContain('no sostiene una corteza global estable de hielo');
      expect(criterion?.explanation).toContain('no descarta otros reservorios');
    }
    expect(subsurface.status).toBe('Evidencia insuficiente');
    expect(JSON.stringify(result)).not.toMatch(/LUNA_PRIVADA|sourceKey|bodyKey|SIMULATED_REALITY/);
  });

  it('criterios desconocidos explican radiación, química, gravedad y estabilidad sin fabricar umbrales', () => {
    const result = projectPlanet(publishedPlanetForExplanations());
    const criteria = result!.routes[0].criteria;
    for (const label of ['Exposición radiativa', 'Viabilidad química', 'Gravedad y retención', 'Estabilidad dinámica']) {
      const criterion = criteria.find(c => c.label === label);
      expect(criterion?.status).toBe('Desconocido');
      expect(criterion?.explanation?.length).toBeGreaterThan(35);
    }
    expect(criteria.find(c => c.label === 'Exposición radiativa')?.explanation)
      .toContain('no son dosis físicas');
  });

  it('permiso denegado impide leer evidencias lunares o ampliar proyección privada', () => {
    const secret = new Proxy({}, { get: () => { throw new Error('acceso denegado'); } });
    expect(ObservedHabitabilityFiche31Fe.moon(secret as MoonScientificResolvedTarget,
      DiscoveryState.CATALOGUED, true, `${KEY}/M1`, 'TRIPLE')).toBeNull();
    expect(ObservedHabitabilityFiche31Fe.moon(secret as MoonScientificResolvedTarget,
      DiscoveryState.CONFIRMED, false, `${KEY}/M1`, 'TRIPLE')).toBeNull();
  });
});

function publishedPlanetForExplanations(): PlanetScientificResolvedTarget {
  return {
    identity: { planetOrdinal: 2 },
    detail: {
      surface: {
        hasDefinedSolidSurfaceBase: true, waterInventoryIndex01: 0.82,
        surfaceLiquidWaterCoverageFraction01: 0.87, hasPersistentSurfaceLiquidWater: true,
      },
      atmosphere: { isDeepEnvelope: false, retainedSurfacePressurePascal: 1269251,
        retainedGasComposition: [] },
      climate: { meanSurfaceTemperatureKelvin: 311.3,
        minimumSurfaceTemperatureKelvin: 281.9, maximumSurfaceTemperatureKelvin: 340.9 },
    },
  } as unknown as PlanetScientificResolvedTarget;
}
