import {describe, expect, it} from 'vitest';
import type {Planet} from '../../domain/planetary/planet';
import type {Atmosphere} from '../../domain/planetary/atmosphere';
import {validatePlanetDeepOceanEnvelopePRE3303B} from '../../domain/planetary/planet-deep-ocean-envelope-pre33-03b';
import {PlanetH2OFormationEnginePRE3303A} from './planet-h2o-formation-engine-pre33-03a';
import {PlanetDeepOceanEnvelopeEnginePRE3303B as Engine} from './planet-deep-ocean-envelope-pre33-03b';

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
const check=(a:number,b:number)=>Math.abs(a-b)<=1e-8*Math.max(1,a,b);
describe('PRE-33.03b — océanos profundos / envolturas',()=>{
  it('separa material H2O hipotético, seco/mineral y envoltura gaseosa; conserva masa 19.5',()=>{
    const {planet,atm}=fixture();const a=Engine.project(planet,atm);
    expect(validatePlanetDeepOceanEnvelopePRE3303B(a)).toEqual([]);
    expect(check(a.masses.planetTotalKilograms,a.masses.dryOrMineralBoundSolidKilograms+
      a.masses.modeledH2OShellAvailableKilograms+a.masses.gasEnvelopeKilograms)).toBe(true);
    expect(a.envelope.hHeMassKilograms).toBeNull();expect(a.oceanExistenceCertified).toBe(false);
  });
  it('distingue capa equivalente bajo gas profundo de superficie sólida',()=>{
    const {planet,atm}=fixture(true);const x=Engine.project(planet,atm);
    expect(x.classification).toBe('DEEP_GAS_ENVELOPE_NO_SOLID_SURFACE');
    expect(x.envelope.hasExposedSolidSurface).toBe(false);
    expect(x.envelope.topOfSolidReferencePressurePascal).toBeNull();
    expect(x.candidateWaterShell.geometryBracket.every(g=>g.fitsFrozenPlanetRadius===null)).toBe(true);
    expect(x.envelope.waterVaporInGasEnvelopeKilograms).toBeNull();
  });
  it('con fuentes suficientemente ricas el espesor y la presión son positivos',()=>{
    const s=fixture(true);const c=Engine.project(s.planet,s.atm);
    expect(c.candidateWaterShell.status).toBe('CONDITIONAL_GEOMETRY');
    expect(c.candidateWaterShell.geometryBracket[0].waterLayerThicknessMeters).toBeGreaterThan(0);
    expect(c.candidateWaterShell.geometryBracket[0].baseOverburdenPascal).toBeGreaterThan(0);
    expect(c.candidateWaterShell.phaseBoundaryDepthMeters).toBeNull();
  });
  it('una geometría incompatible con el radio congelado no inventa un océano',()=>{
    const s=fixture();
    const planet={...s.planet,physicalProperties:{...s.planet.physicalProperties,radiusEarth:0.35}} as Planet;
    const atmosphere={...s.atm,hostPlanet:planet} as Atmosphere;
    const r=Engine.project(planet,atmosphere);
    expect(r.candidateWaterShell.status).toBe('RADIAL_REFERENCE_INCOMPATIBLE');
    expect(r.candidateWaterShell.geometryBracket).toEqual([]);
    expect(r.oceanExistenceCertified).toBe(false);
  });
  it('sin perfil térmico no asigna grosor de océano líquido ni hielo de alta presión confirmado',()=>{
    const {planet,atm}=fixture(true);const r=Engine.project(planet,atm);
    expect(r.candidateWaterShell.thermalScenario).toBeNull();
    expect(r.candidateWaterShell.confirmedLiquidThicknessMeters).toBeNull();
    expect(r.currentH2OTotalCertified).toBe(false);
  });
  it('un perfil P–T independiente permite solo una fase condicional con cierre de espesor',()=>{
    const {planet,atm}=fixture(true);const r=Engine.project(planet,atm,undefined,undefined,
      {sourceRecordKey:'INDEPENDENT_P_T',topTemperatureKelvin:290,baseTemperatureKelvin:290});
    const x=r.candidateWaterShell.thermalScenario!;
    expect(x).not.toBeNull();
    expect(check(x.modeledLiquidThicknessMeters+x.modeledHighPressureSolidThicknessMeters+
      x.unresolvedThicknessMeters,r.candidateWaterShell.geometryBracket[0].waterLayerThicknessMeters)).toBe(true);
    expect(r.oceanExistenceCertified).toBe(false);
  });
  it('rechaza perfiles térmicos sin procedencia y contratos de otros planetas',()=>{
    const s=fixture(true),f=PlanetH2OFormationEnginePRE3303A.project(s.planet,s.atm);
    expect(()=>Engine.project(s.planet,s.atm,undefined,undefined,
      {sourceRecordKey:'',topTemperatureKelvin:300,baseTemperatureKelvin:290})).toThrow();
    expect(()=>Engine.project(s.planet,s.atm,{...f,bodyKey:'FOREIGN'})).toThrow();
  });
  it('sin agua en portadores no crea un océano ni lo inventa desde el índice 20.7',()=>{
    const s=fixture(true,true);const r=Engine.project(s.planet,s.atm);
    expect(r.candidateWaterShell.status).toBe('NO_MODELED_SHELL_SOURCE');
    expect(r.masses.modeledH2OShellAvailableKilograms).toBe(0);
  });
  it('determinismo y no mutación de las fuentes físicas',()=>{
    const {planet,atm}=fixture(true);const before=JSON.stringify(planet.internalComposition);
    const a=Engine.project(planet,atm),b=Engine.project(planet,atm);
    expect(a).toEqual(b);expect(JSON.stringify(planet.internalComposition)).toBe(before);
  });
  it('evolución hídrica sin presupuesto planetario actualizado permanece no resuelta',()=>{
    const {planet,atm}=fixture(true);const f=PlanetH2OFormationEnginePRE3303A.project(planet,atm);
    const r=Engine.project(planet,atm,f,{bodyKey:f.bodyKey,state:'CONDITIONAL_EVOLUTION_COMPLETED',
      ct0PhysicalInventoryCertified:false,
      reservoirs:{ICE_UNLOCATED:1,INTERIOR_UNSPECIFIED:0,SURFACE_ICE:0,SURFACE_LIQUID:0,
        SUBSURFACE_LIQUID:0,DEEP_ENVELOPE_UNRESOLVED:0},
      massBalance:{externalDeliveryKilograms:10,escapedH2OKilograms:0}} as never);
    expect(r.candidateWaterShell.status).toBe('UPDATED_BULK_REQUIRED');
  });
});
