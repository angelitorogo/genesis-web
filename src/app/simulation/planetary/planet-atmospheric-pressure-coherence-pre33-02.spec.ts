import type { Planet } from '../../domain/planetary/planet';
import type { Atmosphere } from '../../domain/planetary/atmosphere';
import {reconcilePlanetAtmosphericPressurePRE3302 as reconcile} from './planet-atmospheric-pressure-coherence-pre33-02';
import {EnvironmentalPhysicalProjectionPRE3301 as projection} from './environmental-physical-projection-pre33-01';

function planet(): Planet {
  return {planetOrdinal:1,locator:{galaxyIndex:0n,sectorKey:2n,galacticObjectIndex:5n,bodyIndex:0n},
    physicalProperties:{massEarth:1,radiusEarth:1,surfaceGravityMetersPerSecondSquared:9.81},
  } as unknown as Planet;
}
function atmosphere(p: Planet, source=100_000, effective=55_000): Atmosphere {
  const retained = {bodyLocator:p.locator,planetOrdinal:1,retainedSurfacePressurePascal:source,
    retainedGasComponents:[{gas:'NITROGEN',moleFraction01:0.55},{gas:'CARBON_DIOXIDE',moleFraction01:0.45}]};
  const phase={sourceSurfacePressurePascal:source,effectiveSurfacePressurePascal:effective,
    converged:true,iterationCount:3,
    speciesEquilibria:[{gas:'CARBON_DIOXIDE',sourcePartialPressurePascal:45_000,
      effectivePartialPressurePascal:0,condensedPartialPressurePascal:45_000}],
    effectiveGasComponents:[{gas:'NITROGEN',moleFraction01:1}]};
  return {hostPlanet:p,retentionState:retained,
    climateState:{planetOrdinal:1,meanSurfaceTemperatureKelvin:270,equilibriumTemperatureKelvin:235},
    climateVariabilityState:{planetOrdinal:1,sourceRetainedSurfacePressurePascal:effective},
    waterInventory:{planetOrdinal:1,bodyLocator:p.locator,sourceRetainedSurfacePressurePascal:effective,
      surfaceLiquidWaterCoverageFraction01:.25,hasPersistentSurfaceLiquidWater:false},
    greenhouseEffect:{condensableEquilibriumState:phase,
      waterVaporEquilibriumState:{sourceSurfacePressurePascal:source,
        effectiveSurfacePressurePascal:effective,converged:true}},
  } as unknown as Atmosphere;
}
type Mut = {retentionState:any;climateState:any;climateVariabilityState:any;waterInventory:any;greenhouseEffect:any};

describe('PRE-33.02 — coherencia atmósfera 20.3/20.4/20.6/20.7', () => {
  it('diferencia física por condensación: presupuesto 45.000 Pa, sin atribuir vida', () => {
    const p=planet();const a=atmosphere(p);
    const result=reconcile(p,a);
    expect(result.status).toBe('CONSISTENT_PHASE_PARTITION');
    expect(result.issues).toEqual([]);
    expect(result.pressureChangePascal).toBe(45000);
    expect(result.condensedEquivalentPressurePascal).toBe(45000);
    expect(result.independentPhysicalAtmosphereCertified).toBe(false);
    expect(result.lifeEvaluated).toBe(false);
    expect(projection.planet(p,a).atmosphere.physicallySupportedSurfacePressurePascal.state)
      .toBe('UNRESOLVED');
  });
  it('la columna se puede mantener si no hay condensación', () => {
    const p=planet();const a=atmosphere(p,100_000,100_000) as unknown as Mut;
    a.greenhouseEffect.condensableEquilibriumState.speciesEquilibria=[];
    expect(reconcile(p,a as Atmosphere).status).toBe('CONSISTENT_NO_CHANGE');
  });
  it('20.7 incoherente con 20.4 se detecta, no se corrige silenciosamente', () => {
    const p=planet();const a=atmosphere(p) as unknown as Mut;
    a.waterInventory.sourceRetainedSurfacePressurePascal=85_000;
    expect(reconcile(p,a as Atmosphere).issues).toContain('WATER_HANDOFF_MISMATCH');
  });
  it('20.6 incoherente con 20.4 se detecta', () => {
    const p=planet();const a=atmosphere(p) as unknown as Mut;
    a.climateVariabilityState.sourceRetainedSurfacePressurePascal=90_000;
    expect(reconcile(p,a as Atmosphere).issues).toContain('CLIMATE_HANDOFF_MISMATCH');
  });
  it('20.4 no puede inventar o aumentar presión gaseosa', () => {
    const p=planet();const a=atmosphere(p,100_000,110_000) as unknown as Mut;
    a.climateVariabilityState.sourceRetainedSurfacePressurePascal=110_000;
    a.waterInventory.sourceRetainedSurfacePressurePascal=110_000;
    expect(reconcile(p,a as Atmosphere).issues).toContain('GAS_PRESSURE_INCREASED_AFTER_CONDENSATION');
  });
  it('desajuste entre gas retenido y fracción condensada es incidencia', () => {
    const p=planet();const a=atmosphere(p) as unknown as Mut;
    a.greenhouseEffect.condensableEquilibriumState.speciesEquilibria[0].condensedPartialPressurePascal=10_000;
    const result=reconcile(p,a as Atmosphere);
    expect(result.status).toBe('INCONSISTENT');
    expect(result.issues).toContain('CONDENSATION_BUDGET_MISMATCH');
  });
  it('no se valida estado de fases no convergido', () => {
    const p=planet();const a=atmosphere(p) as unknown as Mut;
    a.greenhouseEffect.condensableEquilibriumState.converged=false;
    expect(reconcile(p,a as Atmosphere).issues).toContain('NON_CONVERGED_PHASE_MODEL');
  });
  it('composición final no normalizada se detecta', () => {
    const p=planet();const a=atmosphere(p) as unknown as Mut;
    a.greenhouseEffect.condensableEquilibriumState.effectiveGasComponents[0].moleFraction01=.5;
    expect(reconcile(p,a as Atmosphere).issues).toContain('GAS_MOLE_FRACTIONS_MISMATCH');
  });
  it('ausencia de diagnóstico impide justificar diferencias', () => {
    const p=planet();const a=atmosphere(p) as unknown as Mut;
    a.greenhouseEffect.condensableEquilibriumState=null;
    a.greenhouseEffect.waterVaporEquilibriumState=null;
    expect(reconcile(p,a as Atmosphere).status).toBe('INCONSISTENT');
    expect(reconcile(p,a as Atmosphere).issues).toContain('MISSING_CONDENSATION_DIAGNOSTIC');
  });
  it('identidad entre sistemas diferentes nunca se acepta', () => {
    const p=planet();const a=atmosphere(p) as unknown as Mut;
    a.retentionState.bodyLocator={...p.locator,galaxyIndex:5n};
    expect(reconcile(p,a as Atmosphere).issues).toContain('HOST_OR_LOCATOR_MISMATCH');
  });
  it('envoltura profunda no inventa presión de superficie sólida', () => {
    const p=planet();const a=atmosphere(p) as unknown as Mut;
    a.retentionState.retainedSurfacePressurePascal=null;
    a.climateState.meanSurfaceTemperatureKelvin=null;
    a.climateVariabilityState.sourceRetainedSurfacePressurePascal=null;
    a.waterInventory.sourceRetainedSurfacePressurePascal=null;
    a.greenhouseEffect.condensableEquilibriumState=null;
    a.greenhouseEffect.waterVaporEquilibriumState=null;
    expect(reconcile(p,a as Atmosphere).status).toBe('CONSISTENT_DEEP_ENVELOPE');
    a.waterInventory.sourceRetainedSurfacePressurePascal=50_000;
    expect(reconcile(p,a as Atmosphere).issues).toContain('SOLID_SURFACE_PRESSURE_ON_DEEP_ENVELOPE');
  });
  it('fuente de fase 20.4 distinta de la presión 20.3 se rechaza', () => {
    const p=planet();const a=atmosphere(p) as unknown as Mut;
    a.greenhouseEffect.condensableEquilibriumState.sourceSurfacePressurePascal=140_000;
    expect(reconcile(p,a as Atmosphere).issues).toContain('SOURCE_PRESSURE_MISMATCH');
  });
  it('cada especie condensable debe proceder de su fracción retenida', () => {
    const p=planet();const a=atmosphere(p) as unknown as Mut;
    a.greenhouseEffect.condensableEquilibriumState.speciesEquilibria[0].sourcePartialPressurePascal=30_000;
    expect(reconcile(p,a as Atmosphere).issues).toContain('SPECIES_PARTIAL_PRESSURE_MISMATCH');
  });
  it('la reconciliación no modifica los objetos fuente ni reclasifica su evidencia', () => {
    const p=planet();const a=atmosphere(p);
    const before=JSON.stringify({source:a.retentionState.retainedSurfacePressurePascal,
      effective:a.waterInventory.sourceRetainedSurfacePressurePascal,
      phase:a.greenhouseEffect.condensableEquilibriumState});
    reconcile(p,a);reconcile(p,a);
    const after=JSON.stringify({source:a.retentionState.retainedSurfacePressurePascal,
      effective:a.waterInventory.sourceRetainedSurfacePressurePascal,
      phase:a.greenhouseEffect.condensableEquilibriumState});
    expect(after).toBe(before);
  });
  it('vacío: las dos columnas cero permanecen en cero', () => {
    const p=planet();const a=atmosphere(p) as unknown as Mut;
    a.retentionState.retainedSurfacePressurePascal=0;
    a.climateVariabilityState.sourceRetainedSurfacePressurePascal=0;
    a.waterInventory.sourceRetainedSurfacePressurePascal=0;
    a.greenhouseEffect.condensableEquilibriumState=null;
    a.greenhouseEffect.waterVaporEquilibriumState=null;
    expect(reconcile(p,a as Atmosphere).status).toBe('CONSISTENT_VACUUM');
  });
});
