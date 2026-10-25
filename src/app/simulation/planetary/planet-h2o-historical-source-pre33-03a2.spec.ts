import { describe,expect,it } from 'vitest';
import type { Planet } from '../../domain/planetary/planet';
import type { Atmosphere } from '../../domain/planetary/atmosphere';
import type { PlanetH2OHostSourcePRE3303A2 } from '../../domain/planetary/planet-h2o-historical-source-pre33-03a2';
import { PlanetH2OFormationEnginePRE3303A } from './planet-h2o-formation-engine-pre33-03a';
import { PlanetH2OHistoricalSourcePRE3303A2 as source } from './planet-h2o-historical-source-pre33-03a2';
import {validatePlanetH2OEvolutionPRE3303A1} from '../../domain/planetary/planet-h2o-evolution-contract-pre33-03a1';
const SEED='7F21A9D418CE4B7092F16A0C6E35D8B5';
function make(temp:number|null=288,p:number|null=90000,volatile=.2){
 const loc={galaxyIndex:0n,sectorKey:12n,galacticObjectIndex:2n,bodyIndex:0n};
 const planet={name:'H2O 03a2',planetOrdinal:1,locator:loc,seed:{kind:'body',normalizedValue:SEED},
  orbit:{semiMajorAxisAu:1, eccentricity:.02},
  physicalProperties:{massEarth:2,radiusEarth:1.2,accretedEnvelopeMassEarth:.1,surfaceGravityMetersPerSecondSquared:12},
  internalComposition:{metallicCoreMassEarth:.4,silicateInteriorMassEarth:.8,
   condensedIceMassEarth:.5,volatileRichInteriorMassEarth:volatile,
   gaseousEnvelopeMassEarth:.1+(0.2-volatile)}} as unknown as Planet;
 // Keep 19.5 mass sum = 2 even for the zero-volatiles fixture.
 (planet.physicalProperties as {accretedEnvelopeMassEarth:number}).accretedEnvelopeMassEarth=.1+(0.2-volatile);
 const gas=p===null?null:{converged:true,sourceSurfacePressurePascal:p,
  effectiveSurfacePressurePascal:p,effectiveGasComponents:[
   {gas:'NITROGEN',moleFraction01:.99},{gas:'WATER_VAPOR',moleFraction01:.01}],speciesEquilibria:[]};
 const atm={hostPlanet:planet,retentionState:{bodyLocator:loc,planetOrdinal:1,retainedSurfacePressurePascal:p},
  climateState:{planetOrdinal:1,meanSurfaceTemperatureKelvin:temp},
  climateVariabilityState:{planetOrdinal:1,sourceRetainedSurfacePressurePascal:p},
  waterInventory:{bodyLocator:loc,planetOrdinal:1,sourceRetainedSurfacePressurePascal:p,
   waterInventoryIndex01:.7,surfaceLiquidWaterCoverageFraction01:temp===null?null:.3,
   surfaceIceCoverageFraction01:temp===null?null:.1},
  greenhouseEffect:{condensableEquilibriumState:gas,waterVaporEquilibriumState:null}} as unknown as Atmosphere;
 return {planet,atm,f:PlanetH2OFormationEnginePRE3303A.project(planet,atm)};
}
const host: PlanetH2OHostSourcePRE3303A2={ageBillionYears:4.5,massSolar:1,
 luminositySolar:1,mainSequenceLifetimeBillionYears:10,
 evolutionState:'MAIN_SEQUENCE',sourceRecordKey:'FROZEN_HOST_15_3/G0/S12/O2/A',orbitalFluxGeometry:'HOST_CIRCUMSTELLAR'};
function evaluate(t:number|null=288,p:number|null=90000,h=host){
 const v=make(t,p);return source.generate(v.planet,v.atm,v.f,h);
}
const near=(x:number,y:number)=>Math.abs(x-y)<=1e-9*Math.max(1,x,y);
describe('PRE-33.03a.2 — fuentes historicas fisicas modeladas, no observadas',()=>{
 it('genera forzamientos fechados desde edad de 15.3 hasta CT0',()=>{
  const r=evaluate();expect(r.status).toBe('MODELED_DATED_CONDITIONAL_HISTORY');
  expect(r.history!.segments[0].startYear).toBe(0);
  expect(r.history!.segments.at(-1)!.endYear).toBe(4500000000);
  expect(r.history!.segments.every(s=>s.xuvEscape!==null)).toBe(true);
 });
 it('conserva masa con pérdidas y desgasificación parametrizadas',()=>{
  const r=evaluate(),e=r.evolution!;expect(e.state).toBe('CONDITIONAL_EVOLUTION_COMPLETED');
  expect(e.massBalance.conditionalConservationVerified).toBe(true);
  expect(near(e.massBalance.inputH2OKilograms, e.massBalance.retainedCT0Kilograms!+
    e.massBalance.escapedH2OKilograms!)).toBe(true);
  expect(validatePlanetH2OEvolutionPRE3303A1(e)).toEqual([]);
 });
 it('etiqueta toda evolución como hipótesis y no certifica agua ni vida',()=>{
  const r=evaluate();expect(r.ct0Certified).toBe(false);
  expect(r.evolution!.ct0PhysicalInventoryCertified).toBe(false);
  expect(r.playerKnowledgeUpdated).toBe(false);expect(r.lifeEvaluated).toBe(false);
  expect(r.physics.historicalClimate).toBe('NOT_RECONSTRUCTED');
  expect(r.physics.externalImpacts).toBe('NO_INDEPENDENT_DATED_DELIVERY_SOURCE');
 });
 it('no inventa impactos como entregas externas',()=>{
  const r=evaluate();expect(r.history!.segments.flatMap(s=>s.transfers).some(t=>t.process==='EXTERNAL_DELIVERY')).toBe(false);
  expect(r.evolution!.massBalance.externalDeliveryKilograms).toBe(0);
 });
 it('no asume temperatura pasada a partir de temperatura actual',()=>{
  const r=evaluate();expect(r.history!.segments.slice(0,-1).every(s=>s.surfaceTemperatureKelvin===null && s.surfacePressurePascal===null)).toBe(true);
 });
 it('con la misma entrada reproduce exactamente la cronología y los balances',()=>{
  expect(evaluate()).toEqual(evaluate());
 });
 it('distingue atmósfera fría y evita crear líquido superficial',()=>{
  const r=evaluate(180,80000);expect(r.status).toBe('MODELED_DATED_CONDITIONAL_HISTORY');
  expect(r.evolution!.reservoirs.SURFACE_LIQUID).toBe(0);
 });
 it('sin superficie sólida no traslada agua de envoltura profunda a océanos',()=>{
  const r=evaluate(null,null);expect(r.status).toBe('UNRESOLVED_SURFACE_REFERENCE');
  expect(r.history).toBeNull();expect(r.evolution).toBeNull();
 });
 it('rechaza planeta y atmósfera de cuerpos distintos',()=>{
  const a=make(),b=make();expect(()=>source.generate(a.planet,b.atm,a.f,host)).toThrow(/FOREIGN/);
 });
 it('no fabrica historia radiativa circumbinaria sin geometría',()=>{
  const r=evaluate(288,90000,{...host,orbitalFluxGeometry:'UNRESOLVED_MULTIPLE_FLUX'});
  expect(r.status).toBe('UNRESOLVED_STELLAR_FLUX_GEOMETRY');
 });
 it('no extrapola secuencia principal al remanente o gigante',()=>{
  expect(evaluate(288,90000,{...host,evolutionState:'OTHER'}).status).toBe('UNRESOLVED_STELLAR_AGE_OR_EVOLUTION');
  expect(evaluate(288,90000,{...host,mainSequenceLifetimeBillionYears:2}).history).toBeNull();
 });
 it('rechaza anfitriones de otro sistema físico aunque tengan la misma edad',()=>{
  const v=make();
  expect(()=>source.generate(v.planet,v.atm,v.f,{...host,sourceRecordKey:'FROZEN_HOST_15_3/G9/S12/O2/A'})).toThrow(/FOREIGN_STELLAR_LINEAGE/);
 });
 it('rechaza fuente estelar sin procedencia y valores NaN',()=>{
  expect(evaluate(288,90000,{...host,sourceRecordKey:'UNTRACED'}).history).toBeNull();
  const a=make();expect(()=>source.generate(a.planet,a.atm,a.f,{...host,massSolar:NaN})).toThrow(/INVALID_HOST/);
 });
 it('diferentes edades estelares generan trayectorias diferentes sin variar semilla',()=>{
  const a=evaluate(),b=evaluate(288,90000,{...host,ageBillionYears:2});
  expect(a.history!.segments.at(-1)!.endYear).not.toBe(b.history!.segments.at(-1)!.endYear);
 });
});
