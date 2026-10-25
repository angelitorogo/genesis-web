import { describe, expect, it } from 'vitest';
import type { Planet } from '../../domain/planetary/planet';
import type { Atmosphere } from '../../domain/planetary/atmosphere';
import { PlanetWaterReservoirProjectionPRE3303 as project } from './planet-water-reservoir-projection-pre33-03';
import { validatePlanetWaterReservoirPRE3303 as validate } from '../../domain/planetary/planet-water-reservoir-contract-pre33-03';

function sources(deep = false): { planet: Planet; atmosphere: Atmosphere } {
  const locator = { galaxyIndex: 0n, sectorKey: 2n, galacticObjectIndex: 5n, bodyIndex: 0n };
  const planet = {
    planetOrdinal: 1, locator,
    physicalProperties: { massEarth: 2.0, radiusEarth: 1.2,
      surfaceGravityMetersPerSecondSquared: 13.62, accretedEnvelopeMassEarth: 0.1 },
    internalComposition: { metallicCoreMassEarth: 0.4, silicateInteriorMassEarth: 0.8,
      condensedIceMassEarth: 0.5, volatileRichInteriorMassEarth: 0.2, gaseousEnvelopeMassEarth: 0.1 },
  } as unknown as Planet;
  const retained = {planetOrdinal: 1, bodyLocator: locator,
    retainedSurfacePressurePascal: deep ? null : 100000,
    retainedGasComponents: [{gas:'NITROGEN',moleFraction01:0.8},
      {gas:'WATER_VAPOR',moleFraction01:0.2}]};
  const phase = {sourceSurfacePressurePascal:100000,effectiveSurfacePressurePascal:90000,
    converged:true, speciesEquilibria:[{gas:'WATER_VAPOR',sourcePartialPressurePascal:20000,
      effectivePartialPressurePascal:10000,condensedPartialPressurePascal:10000}],
    effectiveGasComponents:[{gas:'NITROGEN',moleFraction01:80000/90000},
      {gas:'WATER_VAPOR',moleFraction01:10000/90000}]};
  const atmosphere = {hostPlanet:planet,retentionState:retained,
    climateState:{planetOrdinal:1,meanSurfaceTemperatureKelvin:deep ? null : 290},
    climateVariabilityState:{planetOrdinal:1,sourceRetainedSurfacePressurePascal:deep ? null : 90000},
    waterInventory:{planetOrdinal:1,bodyLocator:locator,
      sourceRetainedSurfacePressurePascal:deep ? null : 90000,
      waterInventoryIndex01:0.7,surfaceLiquidWaterCoverageFraction01:deep ? null : 0.35,
      surfaceIceCoverageFraction01:deep ? null : 0.15},
    greenhouseEffect:{condensableEquilibriumState:deep ? null : phase,
      waterVaporEquilibriumState:deep ? null : {sourceSurfacePressurePascal:100000,
        effectiveSurfacePressurePascal:90000,converged:true}}
  } as unknown as Atmosphere;
  return {planet,atmosphere};
}

describe('PRE-33.03 — material vs H2O / aguas / envelope profundo sin inventar vida', () => {
  it('reconoce masas físicas de materiales, NO de océanos', () => {
    const {planet,atmosphere}=sources();const c=project.planet(planet,atmosphere);
    expect(c.constituents.condensedIceBearingMaterialKilograms.value).toBeCloseTo(.5*5.9722e24,-16);
    expect(c.constituents.volatileRichInteriorMaterialKilograms.state).toBe('MODELLED_CT0');
    expect(c.water.totalH2OMassKilograms.state).toBe('UNRESOLVED');
    expect(c.water.surfaceLiquidMassKilograms.state).toBe('UNRESOLVED');
    expect(c.water.subsurfaceLiquidMassKilograms.state).toBe('UNRESOLVED');
    expect(c.water.interiorBoundWaterMassKilograms.state).toBe('UNRESOLVED');
    expect(c.physicalWaterMassConserved).toBe(false);
  });
  it('no convierte índice 0.7 en agua kg', () => {
    const {planet,atmosphere}=sources();const c=project.planet(planet,atmosphere);
    expect(c.water.inheritedWaterInventoryIndex01.value).toBe(.7);
    expect(c.water.inheritedWaterInventoryIndex01.state).toBe('CONDITIONAL_SCENARIO');
    expect(c.water.totalH2OMassKilograms.value).toBeNull();
  });
  it('cobertura líquida 20.7 es solo estimación, no océano certificado', () => {
    const {planet,atmosphere}=sources();const c=project.planet(planet,atmosphere);
    expect(c.water.estimatedSurfaceLiquidCoverage01.value).toBe(.35);
    expect(c.water.estimatedSurfaceLiquidCoverage01.state).toBe('CONDITIONAL_SCENARIO');
    expect(c.habitableEnvironmentCertified).toBe(false);
    expect(c.lifeEvaluated).toBe(false);
  });
  it('equilibrio 20.4 H2O: parcial y columna hidrostática correctamente ponderadas', () => {
    const {planet,atmosphere}=sources();const c=project.planet(planet,atmosphere);
    expect(c.atmosphere.effectiveWaterVaporPartialPressurePascal.value).toBeCloseTo(10000,5);
    const x=1/9;const mw=18.01528;const mean=x*mw+(1-x)*28.0134;
    const expected=90000/13.62*x*mw/mean;
    expect(c.atmosphere.approximateWaterVaporColumnKilogramsPerSquareMeter.value).toBeCloseTo(expected,5);
    expect(c.atmosphere.approximateGlobalWaterVaporMassKilograms.value).toBeGreaterThan(0);
    expect(c.atmosphere.approximateGlobalWaterVaporMassKilograms.state).toBe('CONDITIONAL_SCENARIO');
    expect(c.atmosphere.independentMassFluxAtmosphereCertified).toBe(false);
  });
  it('presión equivalente de condensación no es masa de océano', () => {
    const {planet,atmosphere}=sources();const c=project.planet(planet,atmosphere);
    expect(c.atmosphere.condensedH2OEquivalentPressurePascal.value).toBe(10000);
    expect(c.atmosphere.condensedH2OEquivalentPressurePascal.state).toBe('CONDITIONAL_SCENARIO');
    expect(c.water.surfaceLiquidMassKilograms.state).toBe('UNRESOLVED');
  });
  it('envoltura profunda: masa de gas física, sin superficie ni océano imaginario', () => {
    const {planet,atmosphere}=sources(true);const c=project.planet(planet,atmosphere);
    expect(c.surfaceDomain).toBe('DEEP_ENVELOPE_NO_SOLID_SURFACE');
    expect(c.deepEnvelope.physicalTotalEnvelopeMassKilograms.value).toBeCloseTo(.1*5.9722e24,-16);
    expect(c.deepEnvelope.pressureTemperatureProfile.state).toBe('UNRESOLVED');
    expect(c.deepEnvelope.waterPhaseBoundaryDepthMeters.state).toBe('UNRESOLVED');
    expect(c.water.deepEnvelopeLiquidLayerMassKilograms.state).toBe('UNRESOLVED');
    expect(c.water.estimatedSurfaceLiquidCoverage01.state).toBe('NOT_APPLICABLE');
    expect(c.atmosphere.approximateWaterVaporColumnKilogramsPerSquareMeter.state).toBe('NOT_APPLICABLE');
  });
  it('para sólido no inventa interfaz de envoltura profunda', () => {
    const {planet,atmosphere}=sources();const c=project.planet(planet,atmosphere);
    expect(c.deepEnvelope.pressureTemperatureProfile.state).toBe('NOT_APPLICABLE');
    expect(c.deepEnvelope.waterPhaseBoundaryDepthMeters.state).toBe('NOT_APPLICABLE');
  });
  it('rechaza suma de materiales no conservada', () => {
    const {planet,atmosphere}=sources();(planet.internalComposition as any).condensedIceMassEarth=.9;
    expect(()=>project.planet(planet,atmosphere)).toThrow(/budget is inconsistent/);
  });
  it('rechaza masa de envoltura no coherente con el núcleo + gas 19.2', () => {
    const {planet,atmosphere}=sources();(planet.physicalProperties as any).accretedEnvelopeMassEarth=.3;
    expect(()=>project.planet(planet,atmosphere)).toThrow(/budget is inconsistent/);
  });
  it('rechaza presión efectiva incoherente con la transferencia 20.7', () => {
    const {planet,atmosphere}=sources();(atmosphere.waterInventory as any).sourceRetainedSurfacePressurePascal=10000;
    expect(()=>project.planet(planet,atmosphere)).toThrow(/requires PRE-33.02 coherent/);
  });
  it('rechaza localizador de otro cuerpo', () => {
    const {planet,atmosphere}=sources();(atmosphere.retentionState as any).bodyLocator={...planet.locator,galaxyIndex:2n};
    expect(()=>project.planet(planet,atmosphere)).toThrow(/requires PRE-33.02 coherent/);
  });
  it('rechaza especies duplicadas en la columna 20.4', () => {
    const {planet,atmosphere}=sources();
    (atmosphere.greenhouseEffect.condensableEquilibriumState as any).effectiveGasComponents
      .push({gas:'WATER_VAPOR',moleFraction01:0.01});
    expect(()=>project.planet(planet,atmosphere)).toThrow();
  });
  it('rechaza desajuste explícito en presión parcial H2O 20.4', () => {
    const {planet,atmosphere}=sources();
    (atmosphere.greenhouseEffect.waterVaporEquilibriumState as any).effectiveWaterVaporPartialPressurePascal=500;
    expect(()=>project.planet(planet,atmosphere)).toThrow(/H2O partial-pressure mismatch/);
  });
  it('sin fase 20.4 y vacío no fabrica volumen de agua', () => {
    const {planet,atmosphere}=sources();
    (atmosphere.retentionState as any).retainedSurfacePressurePascal=0;
    (atmosphere.climateVariabilityState as any).sourceRetainedSurfacePressurePascal=0;
    (atmosphere.waterInventory as any).sourceRetainedSurfacePressurePascal=0;
    (atmosphere.greenhouseEffect as any).condensableEquilibriumState=null;
    (atmosphere.greenhouseEffect as any).waterVaporEquilibriumState=null;
    const c=project.planet(planet,atmosphere);
    expect(c.atmosphere.approximateWaterVaporColumnKilogramsPerSquareMeter.state).toBe('UNRESOLVED');
    expect(c.water.totalH2OMassKilograms.state).toBe('UNRESOLVED');
  });
  it('testa validador y campos internos inmutables', () => {
    const {planet,atmosphere}=sources();const c=project.planet(planet,atmosphere);
    expect(validate(c)).toEqual([]);
    expect(Object.isFrozen(c)).toBe(true);
    expect(Object.isFrozen(c.water)).toBe(true);
    expect(Object.isFrozen(c.atmosphere)).toBe(true);
  });
  it('prohíbe promocionar masa oceánica desde una suposición', () => {
    const {planet,atmosphere}=sources();const c=project.planet(planet,atmosphere);
    const bad={...c,water:{...c.water,surfaceLiquidMassKilograms:{state:'MODELLED_CT0',value:1e20,
      source:'BULK_19_21',basis:'BULK_PHYSICAL',note:'wrong'}}} as any;
    expect(validate(bad)).toContain('UNSUPPORTED_H2O_MASS_PROMOTION');
  });
  it('es puro/determinista y no altera las fuentes', () => {
    const {planet,atmosphere}=sources();const before=JSON.stringify({
      mass:planet.internalComposition,climate:atmosphere.climateState,
      water:atmosphere.waterInventory,phase:atmosphere.greenhouseEffect.condensableEquilibriumState}, (_, value) => typeof value === 'bigint' ? value.toString() : value);
    expect(project.planet(planet,atmosphere)).toEqual(project.planet(planet,atmosphere));
    const after=JSON.stringify({mass:planet.internalComposition,climate:atmosphere.climateState,
      water:atmosphere.waterInventory,phase:atmosphere.greenhouseEffect.condensableEquilibriumState}, (_, value) => typeof value === 'bigint' ? value.toString() : value);
    expect(after).toBe(before);
  });
});
