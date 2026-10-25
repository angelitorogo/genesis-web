import {describe,it,expect} from 'vitest';
import type {Planet} from '../../domain/planetary/planet';
import type {Atmosphere} from '../../domain/planetary/atmosphere';
import {PlanetH2OFormationEnginePRE3303A} from './planet-h2o-formation-engine-pre33-03a';
import {PlanetH2OEvolutionEnginePRE3303A1} from './planet-h2o-evolution-engine-pre33-03a1';
import type {H2ODatedHistoryPRE3303A1} from '../../domain/planetary/planet-h2o-evolution-contract-pre33-03a1';
import {PlanetH2OCT0InventoryEnginePRE3303A3 as Ledger} from './planet-h2o-ct0-inventory-pre33-03a3';
import {validatePlanetH2OCT0InventoryPRE3303A3 as validate} from '../../domain/planetary/planet-h2o-ct0-inventory-pre33-03a3';

function fixture(deep=false, dryOnly=false) {
  const locator={galaxyIndex:0n,sectorKey:12n,galacticObjectIndex:2n,bodyIndex:0n};
  const masses={metallicCoreMassEarth:0.25,silicateInteriorMassEarth:0.35,
    condensedIceMassEarth:dryOnly?0:0.25,volatileRichInteriorMassEarth:dryOnly?0:0.1,
    gaseousEnvelopeMassEarth:deep?1.05:0.05};
  const sum=Object.values(masses).reduce((a,b)=>a+b,0);
  const planet={planetOrdinal:1,locator,seed:{kind:'body',normalizedValue:'7F21A9D418CE4B7092F16A0C6E35D8B5'},
    physicalProperties:{massEarth:sum,radiusEarth:deep?3:2.2,accretedEnvelopeMassEarth:masses.gaseousEnvelopeMassEarth,
      surfaceGravityMetersPerSecondSquared:deep?3:6},internalComposition:masses} as unknown as Planet;
  const p=deep?null:90000;
  const atm={hostPlanet:planet,retentionState:{bodyLocator:locator,planetOrdinal:1,retainedSurfacePressurePascal:p},
    climateState:{planetOrdinal:1,meanSurfaceTemperatureKelvin:deep?null:290},
    climateVariabilityState:{planetOrdinal:1,sourceRetainedSurfacePressurePascal:p},
    waterInventory:{bodyLocator:locator,planetOrdinal:1,sourceRetainedSurfacePressurePascal:p,
      waterInventoryIndex01:0.8,surfaceLiquidWaterCoverageFraction01:deep?null:0.5,
      surfaceIceCoverageFraction01:deep?null:0.1},
    greenhouseEffect:{condensableEquilibriumState:deep?null:{converged:true,
      sourceSurfacePressurePascal:p,effectiveSurfacePressurePascal:p,
      effectiveGasComponents:[{gas:'NITROGEN',moleFraction01:0.99},
        {gas:'WATER_VAPOR',moleFraction01:0.01}],speciesEquilibria:[]},
      waterVaporEquilibriumState:null}} as unknown as Atmosphere;
  return {planet,atm};
}

function modeled(s:ReturnType<typeof fixture>, add=0) {
  const f=PlanetH2OFormationEnginePRE3303A.project(s.planet,s.atm);
  const h:H2ODatedHistoryPRE3303A1={bodyKey:f.bodyKey,ageYearsCT0:1000,
    provenance:'DATED_PHYSICAL_H2O_MODEL',sourceRecordKey:'synthetic-model-only',
    segments:[{startYear:0,endYear:1000,sourceRecordKey:'synthetic-segment',
      surfaceTemperatureKelvin:s.atm.climateState.meanSurfaceTemperatureKelvin,
      surfacePressurePascal:s.atm.waterInventory.sourceRetainedSurfacePressurePascal,
      transfers:add?[{process:'EXTERNAL_DELIVERY',from:'EXTERNAL',to:'ICE_UNLOCATED',
        massKilograms:add,sourceRecordKey:'synthetic-delivery'}]:[],xuvEscape:null}]};
  return {f,e:PlanetH2OEvolutionEnginePRE3303A1.project(s.planet,s.atm,f,h)};
}
const close=(a:number,b:number)=>Math.abs(a-b)<=1e-9*Math.max(1,a,b);
describe('PRE-33.03a.3 — ledger conservativo H2O CT-0, verdad simulada interna',()=>{
  it('V3 actual sin cronología independiente NO certifica kg H2O CT0',()=>{
    const s=fixture(),r=Ledger.project(s.planet,s.atm);
    expect(r.status).toBe('UNRESOLVED_NO_DATED_HISTORY');
    expect(r.waterKilograms.formationReference).toBeGreaterThan(0);
    expect(r.waterKilograms.retainedCT0).toBeNull();
    expect(r.waterKilograms.pools.SURFACE_LIQUID).toBeNull();
    expect(r.physicalCT0InventoryCertified).toBe(false);
    expect(r.blockers).toContain('FORMATION_SPECIES_IS_BACKPROJECTED_MATURE_19_5');
    expect(validate(r)).toEqual([]);
  });
  it('historia fechada sintética cierra cuantitativamente, sin certificar química de formación',()=>{
    const s=fixture(),{f,e}=modeled(s),r=Ledger.project(s.planet,s.atm,f,e);
    expect(r.status).toBe('MODELED_CT0_BALANCE_CONDITIONAL');
    expect(close(r.waterKilograms.retainedCT0!,r.waterKilograms.formationReference)).toBe(true);
    expect(r.waterKilograms.escaped).toBe(0);
    expect(r.conservation.modeledSourceClosure).toBe(true);
    expect(r.physicalCT0InventoryCertified).toBe(false);
    expect(r.oceanExistenceCertified).toBe(false);
    expect(validate(r)).toEqual([]);
  });
  it('entrega externa fechada conserva masa, pero exige actualizar el bulk',()=>{
    const s=fixture(),{f,e}=modeled(s,1e18),r=Ledger.project(s.planet,s.atm,f,e);
    expect(close(r.waterKilograms.retainedCT0!,r.waterKilograms.formationReference+1e18)).toBe(true);
    expect(r.blockers).toContain('REVISED_BULK_AFTER_H2O_LOSS_OR_DELIVERY_REQUIRED');
    expect(r.conservation.bulkMassReconciled).toBe(false);
  });
  it('envoltura profunda nunca autoriza mares superficiales',()=>{
    const s=fixture(true),{f,e}=modeled(s),r=Ledger.project(s.planet,s.atm,f,e);
    expect(r.waterKilograms.liquidTotal).toBe(0);
    expect(r.waterKilograms.deepUnresolved).toBeGreaterThan(0);
    expect(r.oceanExistenceCertified).toBe(false);
  });
  it('contrato de otro planeta o de otra versión es rechazado',()=>{
    const s=fixture(),{f,e}=modeled(s);
    expect(()=>Ledger.project(s.planet,s.atm,{...f,bodyKey:'FOREIGN'})).toThrow();
    expect(()=>Ledger.project(s.planet,s.atm,f,{...e,bodyKey:'FOREIGN'})).toThrow();
  });
  it('validador detecta creación de agua y certificación indebida',()=>{
    const s=fixture(),{f,e}=modeled(s),r=Ledger.project(s.planet,s.atm,f,e);
    expect(validate({...r,physicalCT0InventoryCertified:true} as never)).toContain('UNSUPPORTED_GROUND_TRUTH_CERTIFICATION');
    expect(validate({...r,waterKilograms:{...r.waterKilograms,retainedCT0:r.waterKilograms.retainedCT0!+1e25}} as never))
      .toContain('CT0_SPECIES_MASS_BALANCE_FAILED');
  });
  it('índices 20.7 y cobertura no generan masa de agua; simulación reproducible',()=>{
    const s=fixture(),before=JSON.stringify(s.planet.internalComposition),a=Ledger.project(s.planet,s.atm);
    (s.atm.waterInventory as any).waterInventoryIndex01=.01;
    (s.atm.waterInventory as any).surfaceLiquidWaterCoverageFraction01=.98;
    const b=Ledger.project(s.planet,s.atm);
    expect(a).toEqual(b);expect(JSON.stringify(s.planet.internalComposition)).toBe(before);
  });
  it('no acepta una atmósfera ajena',()=>{
    const s=fixture(); const other={...s.planet} as Planet;
    expect(()=>Ledger.project(other,s.atm)).toThrow(/FOREIGN_ATMOSPHERE/);
  });
});
