import { describe, expect, it } from 'vitest';
import type { Planet } from '../../domain/planetary/planet';
import type { Atmosphere } from '../../domain/planetary/atmosphere';
import type { H2ODatedHistoryPRE3303A1 } from '../../domain/planetary/planet-h2o-evolution-contract-pre33-03a1';
import { validatePlanetH2OEvolutionPRE3303A1 } from '../../domain/planetary/planet-h2o-evolution-contract-pre33-03a1';
import { PlanetH2OFormationEnginePRE3303A } from './planet-h2o-formation-engine-pre33-03a';
import { PlanetH2OEvolutionEnginePRE3303A1 } from './planet-h2o-evolution-engine-pre33-03a1';

const SEED='7F21A9D418CE4B7092F16A0C6E35D8B5';
function physical(deep=false){
  const loc={galaxyIndex:0n,sectorKey:12n,galacticObjectIndex:2n,bodyIndex:0n};
  const masses={metallicCoreMassEarth:.4,silicateInteriorMassEarth:.8,
    condensedIceMassEarth:.5,volatileRichInteriorMassEarth:.2,gaseousEnvelopeMassEarth:.1};
  const planet={name:'Fixture',planetOrdinal:1,locator:loc,seed:{kind:'body',normalizedValue:SEED},
    physicalProperties:{massEarth:2,radiusEarth:1.2,accretedEnvelopeMassEarth:.1,
      surfaceGravityMetersPerSecondSquared:12},internalComposition:masses} as unknown as Planet;
  const p=deep?null:90000;
  const gas=deep?null:{converged:true,sourceSurfacePressurePascal:p,
    effectiveSurfacePressurePascal:p,effectiveGasComponents:[
      {gas:'NITROGEN',moleFraction01:.99},{gas:'WATER_VAPOR',moleFraction01:.01}],speciesEquilibria:[]};
  const atm={hostPlanet:planet,
    retentionState:{bodyLocator:loc,planetOrdinal:1,retainedSurfacePressurePascal:p},
    climateState:{planetOrdinal:1,meanSurfaceTemperatureKelvin:deep?null:288},
    climateVariabilityState:{planetOrdinal:1,sourceRetainedSurfacePressurePascal:p},
    waterInventory:{bodyLocator:loc,planetOrdinal:1,sourceRetainedSurfacePressurePascal:p,
      waterInventoryIndex01:.7,surfaceLiquidWaterCoverageFraction01:deep?null:.3,
      surfaceIceCoverageFraction01:deep?null:.1},
    greenhouseEffect:{condensableEquilibriumState:gas,waterVaporEquilibriumState:null}
  } as unknown as Atmosphere;
  return {planet,atm};
}
function source(deep=false){
  const v=physical(deep);const f=PlanetH2OFormationEnginePRE3303A.project(v.planet,v.atm);
  return {...v,f};
}
function history(s:ReturnType<typeof source>):H2ODatedHistoryPRE3303A1{
  return {bodyKey:s.f.bodyKey,ageYearsCT0:1000,provenance:'DATED_PHYSICAL_H2O_MODEL',
    sourceRecordKey:'DATED-EVOLUTION-PROVENANCE',
    phase32Chronology:{bodyKey:s.f.bodyKey,ageYearsCT0:1000},
    segments:[{startYear:0,endYear:1000,sourceRecordKey:'DATED-HISTORY-SEGMENT',
      surfaceTemperatureKelvin:s.atm.climateState.meanSurfaceTemperatureKelvin,
      surfacePressurePascal:s.atm.waterInventory.sourceRetainedSurfacePressurePascal,transfers:[],xuvEscape:null}]};
}
function run(s:ReturnType<typeof source>,h?:H2ODatedHistoryPRE3303A1){
  return PlanetH2OEvolutionEnginePRE3303A1.project(s.planet,s.atm,s.f,h);
}
function mutate(h:H2ODatedHistoryPRE3303A1,part:Record<string,unknown>):H2ODatedHistoryPRE3303A1 {
  return {...h,segments:[{...h.segments[0],...part}]};
}
function close(a:number,b:number){return Math.abs(a-b)<1e-9*Math.max(1,a,b);}

describe('PRE-33.03a.1 — conservación H2O en cronología física condicional',()=>{
  it('sin historia fechada NO resuelve H2O CT-0 ni océanos',()=>{
    const x=run(source());
    expect(x.state).toBe('UNRESOLVED_NO_DATED_H2O_FORCING');
    expect(x.massBalance.retainedCT0Kilograms).toBeNull();
    expect(x.massBalance.escapedH2OKilograms).toBeNull();
    expect(x.reservoirs.SURFACE_LIQUID).toBeNull();
    expect(x.ct0PhysicalInventoryCertified).toBe(false);
  });
  it('la historia completa sin flujos conserva H2O, pero NO certifica CT-0',()=>{
    const s=source(),r=run(s,history(s));
    expect(r.state).toBe('CONDITIONAL_EVOLUTION_COMPLETED');
    expect(close(r.massBalance.retainedCT0Kilograms!,s.f.formation.modeledFormationH2OKilograms)).toBe(true);
    expect(r.reservoirs.SURFACE_LIQUID).toBe(0);
    expect(r.ct0PhysicalInventoryCertified).toBe(false);
    expect(r.lifeEvaluated).toBe(false);
  });
  it('un intercambio interior → vapor → líquido conserva masa en CT-0',()=>{
    const s=source(),h=history(s);const m=s.f.formation.volatileCarrierH2OKilograms/100;
    const a=mutate(h,{transfers:[
      {process:'OUTGASS',from:'INTERIOR_UNSPECIFIED',to:'ATMOSPHERIC_VAPOR',massKilograms:m,sourceRecordKey:'OUTGASS-1'},
      {process:'CONDENSE_LIQUID',from:'ATMOSPHERIC_VAPOR',to:'SURFACE_LIQUID',massKilograms:m/2,sourceRecordKey:'CONDENSE-1'},
    ]});
    const r=run(s,a);
    expect(close(r.reservoirs.SURFACE_LIQUID!,m/2)).toBe(true);
    expect(close(r.reservoirs.ATMOSPHERIC_VAPOR!,m/2)).toBe(true);
    expect(r.massBalance.relativeResidual01).toBeLessThan(1e-9);
  });
  it('el escape XUV está limitado por energía y por vapor realmente disponible',()=>{
    const s=source(),h=history(s),m=s.f.formation.volatileCarrierH2OKilograms/100;
    const r=run(s,mutate(h,{transfers:[
      {process:'OUTGASS',from:'INTERIOR_UNSPECIFIED',to:'ATMOSPHERIC_VAPOR',massKilograms:m,sourceRecordKey:'O1'}],
      xuvEscape:{incidentXuvWattsPerSquareMeter:1e12,heatingEfficiency01:.15,
        absorptionRadiusMeters:6_371_000*1.2,rocheFactor01:1,
        escapingH2OMassFraction01:.01,sourceRecordKey:'INDEPENDENT-DATED-XUV'}}));
    expect(r.massBalance.escapedH2OKilograms).toBe(m);
    expect(r.reservoirs.ATMOSPHERIC_VAPOR).toBe(0);
    expect(r.xuv.supplyLimitedEscapedH2OKilograms).toBeGreaterThan(0);
    expect(r.massBalance.relativeResidual01).toBeLessThan(1e-9);
  });
  it('una entrega externa documentada aumenta la entrada, NO crea masa',()=>{
    const s=source(),h=history(s),r=run(s,mutate(h,{transfers:[
      {process:'EXTERNAL_DELIVERY',from:'EXTERNAL',to:'ICE_UNLOCATED',massKilograms:5e16,sourceRecordKey:'IMPACT-REALIZED-1'}]}));
    expect(r.massBalance.externalDeliveryKilograms).toBe(5e16);
    expect(close(r.massBalance.retainedCT0Kilograms!,r.massBalance.inputH2OKilograms+5e16)).toBe(true);
  });
  it('la energía XUV cero produce pérdida exactamente cero',()=>{
    const s=source(),h=history(s),r=run(s,mutate(h,{xuvEscape:{
      incidentXuvWattsPerSquareMeter:0,heatingEfficiency01:1,
      absorptionRadiusMeters:6_371_000*1.2,rocheFactor01:1,
      escapingH2OMassFraction01:1,sourceRecordKey:'XUV-ZERO'}}));
    expect(r.massBalance.escapedH2OKilograms).toBe(0);
  });
  it('simulación determinista sin mutar planeta, formación ni historia',()=>{
    const s=source(),h=history(s),j=JSON.stringify(h);
    expect(run(s,h)).toEqual(run(s,h));expect(JSON.stringify(h)).toBe(j);
  });
  it('rechaza identidades de galaxias o cuerpos cruzados',()=>{
    const s=source(),h=history(s);
    expect(()=>run(s,{...h,bodyKey:'G1/S12/O2/B0'})).toThrow(/FOREIGN_OR_UNGROUNDED/);
  });
  it('Fase 32 debe coincidir con la edad y el bodyKey, sin inventar cronología',()=>{
    const s=source(),h=history(s);
    expect(()=>run(s,{...h,phase32Chronology:{bodyKey:h.bodyKey,ageYearsCT0:2000}})).toThrow(/PHASE32/);
  });
  it('rechaza huecos cronológicos y cobertura hasta CT0 incompleta',()=>{
    const s=source(),h=history(s);
    expect(()=>run(s,mutate(h,{startYear:10}))).toThrow(/GAP_OVERLAP/);
    expect(()=>run(s,mutate(h,{endYear:999}))).toThrow(/INCOMPLETE_DATED/);
  });
  it('rechaza fuentes/eventos repetidos',()=>{
    const s=source(),h=history(s);
    expect(()=>run(s,mutate(h,{transfers:[
      {process:'EXTERNAL_DELIVERY',from:'EXTERNAL',to:'ICE_UNLOCATED',massKilograms:10,sourceRecordKey:'DUP'},
      {process:'EXTERNAL_DELIVERY',from:'EXTERNAL',to:'ICE_UNLOCATED',massKilograms:10,sourceRecordKey:'DUP'}]}))).toThrow(/DUPLICATE/);
  });
  it('rechaza pérdidas negativas, NaN y física imposible',()=>{
    const s=source(),h=history(s);
    for(const m of [-1,NaN,Infinity])expect(()=>run(s,mutate(h,{transfers:[
      {process:'EXTERNAL_DELIVERY',from:'EXTERNAL',to:'ICE_UNLOCATED',massKilograms:m,sourceRecordKey:'DEL'}]}))).toThrow();
  });
  it('no permite trasladar más H2O de la disponible',()=>{
    const s=source(),h=history(s);
    expect(()=>run(s,mutate(h,{transfers:[
      {process:'OUTGASS',from:'INTERIOR_UNSPECIFIED',to:'ATMOSPHERIC_VAPOR',
        massKilograms:s.f.formation.modeledFormationH2OKilograms*2,sourceRecordKey:'BAD-OUT'}]}))).toThrow(/EXCEEDS_AVAILABLE/);
  });
  it('no crea agua líquida cuando la temperatura o presión lo impide',()=>{
    const s=source(),h=history(s),mass=s.f.formation.volatileCarrierH2OKilograms/100;
    const transfers=[{process:'OUTGASS',from:'INTERIOR_UNSPECIFIED',to:'ATMOSPHERIC_VAPOR',massKilograms:mass,sourceRecordKey:'O'},
      {process:'CONDENSE_LIQUID',from:'ATMOSPHERIC_VAPOR',to:'SURFACE_LIQUID',massKilograms:mass,sourceRecordKey:'L'}];
    expect(()=>run(s,mutate(h,{surfaceTemperatureKelvin:180,transfers}))).toThrow();
    expect(()=>run(s,mutate(h,{surfacePressurePascal:300,transfers}))).toThrow();
  });
  it('alta presión sin EOS deja fase líquida sin resolver, no la declara',()=>{
    const s=source(),h=history(s),m=s.f.formation.volatileCarrierH2OKilograms/100;
    expect(()=>run(s,mutate(h,{surfacePressurePascal:20e6,transfers:[
      {process:'OUTGASS',from:'INTERIOR_UNSPECIFIED',to:'ATMOSPHERIC_VAPOR',massKilograms:m,sourceRecordKey:'O'},
      {process:'CONDENSE_LIQUID',from:'ATMOSPHERIC_VAPOR',to:'SURFACE_LIQUID',massKilograms:m,sourceRecordKey:'L'}]}))).toThrow();
  });
  it('no conserva océano al enfriarse sin resolver una congelación fechada',()=>{
    const s=source(),h=history(s),m=s.f.formation.volatileCarrierH2OKilograms/100;
    const a=mutate(h,{endYear:300,transfers:[
      {process:'OUTGASS',from:'INTERIOR_UNSPECIFIED',to:'ATMOSPHERIC_VAPOR',massKilograms:m,sourceRecordKey:'O'},
      {process:'CONDENSE_LIQUID',from:'ATMOSPHERIC_VAPOR',to:'SURFACE_LIQUID',massKilograms:m,sourceRecordKey:'C'}]});
    const next={startYear:300,endYear:600,sourceRecordKey:'LATE-COLD',surfaceTemperatureKelvin:175,
      surfacePressurePascal:80000,transfers:[],xuvEscape:null};
    const final={...next,startYear:600,endYear:1000,sourceRecordKey:'CT0-WARM',surfaceTemperatureKelvin:288,surfacePressurePascal:90000};
    expect(()=>run(s,{...a,segments:[a.segments[0],next,final]})).toThrow(/UNRESOLVED_SURFACE_LIQUID/);
  });
  it('el extremo CT-0 debe coincidir con temperatura y presión congeladas de 20.x',()=>{
    const s=source(),h=history(s);
    expect(()=>run(s,mutate(h,{surfaceTemperatureKelvin:330}))).toThrow(/CT0_ENDPOINT/);
    expect(()=>run(s,mutate(h,{surfacePressurePascal:70000}))).toThrow(/CT0_ENDPOINT/);
  });
  it('sin superficie expuesta no asigna mares a envolturas profundas',()=>{
    const s=source(true),h=history(s),r=run(s,h);
    expect(r.reservoirs.DEEP_ENVELOPE_UNRESOLVED).toBeGreaterThan(0);
    expect(r.reservoirs.SURFACE_LIQUID).toBe(0);
    expect(r.surfaceLiquidPhaseSupported).toBeNull();
  });
  it('validador detecta certificación indebida o pérdidas de masa',()=>{
    const s=source(),r=run(s,history(s));
    expect(validatePlanetH2OEvolutionPRE3303A1(r)).toEqual([]);
    expect(validatePlanetH2OEvolutionPRE3303A1({...r,ct0PhysicalInventoryCertified:true} as any))
      .toContain('PROVENANCE_OR_GROUND_TRUTH_LEAK');
    expect(validatePlanetH2OEvolutionPRE3303A1({...r,reservoirs:{...r.reservoirs,SURFACE_LIQUID:1e23}} as any))
      .toContain('WATER_MASS_NOT_CONSERVED');
  });
  it('32.3 conectado solo valida identidad, sin convertir sus fracciones en kg',()=>{
    const s=source();
    const h32={contractVersion:'32.3-CT0',bodyKey:s.f.bodyKey,
      chronology:{bodyKey:s.f.bodyKey},historicalCompleteness:'NOT_ESTABLISHED'} as any;
    const r=PlanetH2OEvolutionEnginePRE3303A1.project(s.planet,s.atm,s.f,undefined,h32);
    expect(r.state).toBe('UNRESOLVED_NO_DATED_H2O_FORCING');
    expect(()=>PlanetH2OEvolutionEnginePRE3303A1.project(s.planet,s.atm,s.f,undefined,
      {...h32,bodyKey:'G9/S12/O2/B0'})).toThrow(/PHASE32_VOLATILE/);
  });
  it('31.F.i.3 verifica identidad y edad pero no se toma como flujo XUV',()=>{
    const s=source(),h=history(s);
    const linked={...h,materializedPhase32:{contractVersion:'31.F.i.3-v1' as const,
      ageYearsCT0:1000,planet:{bodyKey:s.f.bodyKey,waterHistory:'UNKNOWN' as const}}};
    expect(run(s,linked).state).toBe('CONDITIONAL_EVOLUTION_COMPLETED');
    expect(()=>run(s,{...h,materializedPhase32:{...linked.materializedPhase32,
      ageYearsCT0:999}})).toThrow(/PHASE32_MATERIALIZED/);
  });
  it('requiere composición específica de H2O en el escape: no infiere 20.3',()=>{
    const s=source(),h=history(s),r=run(s,mutate(h,{xuvEscape:{
      incidentXuvWattsPerSquareMeter:100,heatingEfficiency01:.1,
      absorptionRadiusMeters:6_371_000*1.2,rocheFactor01:1,
      escapingH2OMassFraction01:0,sourceRecordKey:'XUV-H2O-ZERO'}}));
    expect(r.massBalance.escapedH2OKilograms).toBe(0);
  });
  it('prohíbe convertir valores desconocidos en CT0',()=>{
    const s=source(),r=run(s);
    expect(validatePlanetH2OEvolutionPRE3303A1({...r,
      reservoirs:{...r.reservoirs,SURFACE_LIQUID:100}} as any)).toContain('UNSUPPORTED_CT0_PROMOTION');
  });
});
