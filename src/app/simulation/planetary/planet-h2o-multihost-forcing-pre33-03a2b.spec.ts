import {describe,it,expect} from 'vitest';
import type {Planet} from '../../domain/planetary/planet';
import type {Atmosphere} from '../../domain/planetary/atmosphere';
import type {MultipleStellarGeometryPRE3303A2B} from '../../domain/planetary/planet-h2o-multihost-forcing-pre33-03a2b';
import type {PlanetH2OStellarInputPRE3303A2A} from '../../domain/planetary/planet-h2o-stellar-evolution-pre33-03a2a';
import {PlanetH2OFormationEnginePRE3303A} from './planet-h2o-formation-engine-pre33-03a';
import {PlanetH2OMultihostForcingPRE3303A2B as engine,phaseAverageXuvPRE3303A2B} from './planet-h2o-multihost-forcing-pre33-03a2b';
import {validatePlanetH2OEvolutionPRE3303A1} from '../../domain/planetary/planet-h2o-evolution-contract-pre33-03a1';
const make=(temperature:number|null=285)=>{
  const locator={galaxyIndex:0n,sectorKey:12n,galacticObjectIndex:2n,bodyIndex:0n};
  const planet={name:'PRE-33.03a.2a test',planetOrdinal:1,locator,
    seed:{kind:'body',normalizedValue:'7F21A9D418CE4B7092F16A0C6E35D8B5'},
    orbit:{semiMajorAxisAu:1,eccentricity:.04},
    physicalProperties:{massEarth:2,radiusEarth:1.2,accretedEnvelopeMassEarth:.2,surfaceGravityMetersPerSecondSquared:13.625},
    internalComposition:{metallicCoreMassEarth:.4,silicateInteriorMassEarth:.8,
      condensedIceMassEarth:.4,volatileRichInteriorMassEarth:.2,gaseousEnvelopeMassEarth:.2}} as unknown as Planet;
  const p=temperature===null?null:80000;
  const atmosphere={hostPlanet:planet,retentionState:{bodyLocator:locator,planetOrdinal:1,retainedSurfacePressurePascal:p},
    climateState:{planetOrdinal:1,meanSurfaceTemperatureKelvin:temperature},
    climateVariabilityState:{planetOrdinal:1,sourceRetainedSurfacePressurePascal:p},
    waterInventory:{bodyLocator:locator,planetOrdinal:1,sourceRetainedSurfacePressurePascal:p,
      waterInventoryIndex01:.5,surfaceLiquidWaterCoverageFraction01:temperature===null?null:.1,
      surfaceIceCoverageFraction01:temperature===null?null:.2},
    greenhouseEffect:{condensableEquilibriumState:p===null?null:{converged:true,sourceSurfacePressurePascal:p,
      effectiveSurfacePressurePascal:p,effectiveGasComponents:[{gas:'NITROGEN',moleFraction01:.98},
        {gas:'WATER_VAPOR',moleFraction01:.02}],speciesEquilibria:[]},waterVaporEquilibriumState:null}} as unknown as Atmosphere;
  return {planet,atmosphere,formation:PlanetH2OFormationEnginePRE3303A.project(planet,atmosphere)};
};
const MS:PlanetH2OStellarInputPRE3303A2A={
  ageBillionYears:4,massSolar:1,initialMassSolar:1,luminositySolar:1,
  mainSequenceLifetimeBillionYears:10,postMainSequenceDurationBillionYears:1,
  evolutionState:'MAIN_SEQUENCE',stellarState:'MAIN_SEQUENCE',
  sourceRecordKey:'FROZEN_HOST_15_3/G0/S12/O2/A',orbitalFluxGeometry:'HOST_CIRCUMSTELLAR',
  luminosityBasis:'FROZEN_15_1_REFERENCE_NOT_HISTORICAL_TRACK',
};

const ref=(name:'A'|'B'|'C')=>({...MS,sourceRecordKey:`FROZEN_HOST_15_3/G0/S12/O2/${name}`});
const binary=(planetHost:'A'|'B'|'AB'='A'):MultipleStellarGeometryPRE3303A2B=>({
 systemSourceKey:'G0/S12/O2',multiplicity:'BINARY',planetHost,
 orbitalModel:'FROZEN_16_KEPLERIAN_REFERENCE_NO_PHASE',
 hosts:[{label:'A',source:ref('A')},{label:'B',source:{...ref('B'),massSolar:.8,initialMassSolar:.8,luminositySolar:.45}}],
 innerOrbit:{semiMajorAxisAu:100,eccentricity:.12},outerOrbit:null,
 planetOrbit:{semiMajorAxisAu:1,eccentricity:.04}
});
const triple=():MultipleStellarGeometryPRE3303A2B=>({...binary(),multiplicity:'TRIPLE',
 hosts:[...binary().hosts,{label:'C',source:{...ref('C'),massSolar:.5,initialMassSolar:.5,luminositySolar:.2}}],
 outerOrbit:{semiMajorAxisAu:1000,eccentricity:.18}});
const run=(g:MultipleStellarGeometryPRE3303A2B,t:number|null=285)=>{
 const x=make(t);
 // Preserve the original fixture's planet orbit equality by mutating test-only fake data.
 (x.planet as unknown as {orbit:{semiMajorAxisAu:number;eccentricity:number};orbitTopology:string}).orbit={...g.planetOrbit};
 (x.planet as unknown as {orbitTopology:string}).orbitTopology=g.planetHost==='AB'?'CIRCUMBINARY':'CIRCUMSTELLAR';
 return engine.project(x.planet,x.atmosphere,x.formation,g);
};

describe('PRE-33.03a.2b - multihost irradiation only in internal physical scenario',()=>{
 it('S-type A suma irradiación de compañera, nunca solo anfitriona',()=>{
   const g=binary('A'); const f=phaseAverageXuvPRE3303A2B(g,[1,1]);
   const f0=phaseAverageXuvPRE3303A2B(g,[1,0]);
   expect(f).toBeGreaterThan(f0);
   expect(f0).toBeGreaterThan(0);
 });
 it('S-type B emplea centro B, no reutiliza distancia de A',()=>{
   const a=phaseAverageXuvPRE3303A2B(binary('A'),[1,.2]);
   const b=phaseAverageXuvPRE3303A2B(binary('B'),[1,.2]);
   expect(a).not.toBe(b);
 });
 it('P-type promedia alrededor del baricentro de AB, no punto luminoso único',()=>{
   const g={...binary('AB'),planetOrbit:{semiMajorAxisAu:250,eccentricity:.03}};
   expect(phaseAverageXuvPRE3303A2B(g,[1,1])).toBeGreaterThan(0);
 });
 it('TRIPLE C influye en la irradiación de un planeta S-type A',()=>{
   const g=triple(); const f=phaseAverageXuvPRE3303A2B(g,[1,.4,.3]);
   const noC=phaseAverageXuvPRE3303A2B(g,[1,.4,0]);expect(f).toBeGreaterThan(noC);
 });
 it('TRIPLE sobre órbita C incluye A y B',()=>{
   const g={...triple(),planetHost:'C' as const};
   const f=phaseAverageXuvPRE3303A2B(g,[1,1,1]);
   const c=phaseAverageXuvPRE3303A2B(g,[0,0,1]);expect(f).toBeGreaterThan(c);
 });
 it('sin cronología compartida conserva solo irradiación CT0 geométrica condicional',()=>{
   const g={...binary(),hosts:[binary().hosts[0],{...binary().hosts[1],source:{...ref('B'),ageBillionYears:8}}]};
   const a=run(g);expect(a.history).toBeNull();expect(a.ct0PhaseAverageXuvWattsPerSquareMeter!).toBeGreaterThan(0);
   expect(a.ct0FluxProvenance).toBe('INDIVIDUAL_FROZEN_STELLAR_AGES_XUV_HYPOTHESES');
 });
 it('no finge historia común si las edades congeladas difieren 7 Gyr',()=>{
   const g={...binary(),hosts:[binary().hosts[0],{...binary().hosts[1],source:{...ref('B'),ageBillionYears:8}}]};
   const a=run(g);expect(a.status).toBe('UNRESOLVED_COMPONENT_AGE_ALIGNMENT');expect(a.history).toBeNull();
 });
 it('genera historia S-type condicional, conserva balance sin certificar océano',()=>{
   const a=run(binary());expect(a.status).toBe('MODELED_DATED_CONDITIONAL_MULTIPLE_S');
   expect(a.evolution?.massBalance.conditionalConservationVerified).toBe(true);
   expect(validatePlanetH2OEvolutionPRE3303A1(a.evolution!)).toEqual([]);
   expect(a.ct0Certified).toBe(false);expect(a.observedEvidenceGranted).toBe(false);
 });
 it('genera historia P-type condicional para planeta circumbinario estable',()=>{
   const g={...binary('AB'),planetOrbit:{semiMajorAxisAu:250,eccentricity:.03}};
   const a=run(g);expect(a.status).toBe('MODELED_DATED_CONDITIONAL_MULTIPLE_P');
   expect(a.history?.segments.length).toBeGreaterThan(0);
 });
 it('rechaza geometría S con cruce orbital, sin singularizar fuentes',()=>{
   const g={...binary(),planetOrbit:{semiMajorAxisAu:97,eccentricity:.2}};
   expect(run(g).status).toBe('UNRESOLVED_ORBITAL_SEPARATION');
 });
 it('rechaza P interior a la estrella A/B, sin dividir entre cero',()=>{
   const g={...binary('AB'),planetOrbit:{semiMajorAxisAu:1,eccentricity:.03}};
   expect(run(g).status).toBe('UNRESOLVED_ORBITAL_SEPARATION');
 });
 it('no extrapola radiación NS/BH ni brown dwarf sin espectro/cooling',()=>{
   for(const state of ['NEUTRON_STAR','STELLAR_BLACK_HOLE','BROWN_DWARF'] as const){
     const hs=binary().hosts;
     const g={...binary(),hosts:[hs[0],{...hs[1],source:{...ref('B'),stellarState:state,evolutionState:'OTHER' as const}}]};
     expect(run(g).status).toBe('UNRESOLVED_COMPONENT_STELLAR_RADIATION');
   }
 });
 it('sin clima de superficie no inventa agua líquida en envoltura profunda',()=>{
   const a=run(binary(),null);expect(a.status).toBe('UNRESOLVED_SURFACE_DOMAIN');expect(a.evolution).toBeNull();
 });
 it('rechaza vincular un P-type a una identidad orbital S-type',()=>{
   const g=binary('AB'),x=make();
   (x.planet as unknown as {orbitTopology:string}).orbitTopology='CIRCUMSTELLAR';
   expect(()=>engine.project(x.planet,x.atmosphere,x.formation,g)).toThrow(/FOREIGN_OR_INVALID_MULTIPLE_GEOMETRY/);
 });
 it('identidad galaxia cruzada es error y no mezcla fuentes',()=>{
   const g={...binary(),hosts:[binary().hosts[0],{label:'B' as const,source:{...ref('B'),sourceRecordKey:'FROZEN_HOST_15_3/G1/S12/O2/B'}}]};
   expect(()=>run(g)).toThrow(/FOREIGN_OR_INVALID_MULTIPLE_GEOMETRY/);
 });
 it('el orden A/B/C está validado y no mezcla componentes',()=>{
   const g={...binary(),hosts:[binary().hosts[1],binary().hosts[0]]};
   expect(()=>run(g)).toThrow(/FOREIGN_OR_INVALID_MULTIPLE_GEOMETRY/);
 });
 it('rechaza modelado P-type de C sin órbita exterior',()=>{
   const g={...binary(),planetHost:'C' as const};
   expect(()=>run(g)).toThrow(/FOREIGN_OR_INVALID_MULTIPLE_GEOMETRY/);
 });
 it('dos ejecuciones usan el mismo cuadrador y JSON idéntico',()=>{
   const a=run(triple()),b=run(triple());expect(JSON.stringify(a)).toBe(JSON.stringify(b));
 });
 it('rechaza excentricidad exterior inválida como geometría mal formada',()=>{
   const g={...triple(),outerOrbit:{semiMajorAxisAu:1000,eccentricity:1.4}};
   expect(()=>run(g)).toThrow(/FOREIGN_OR_INVALID_MULTIPLE_GEOMETRY/);
 });
 it('un componente sin edad no recibe irradiación actual asumida',()=>{
   const h=binary().hosts;const g={...binary(),hosts:[h[0],{...h[1],source:{...h[1].source,ageBillionYears:NaN}}]};
   const a=run(g);expect(a.ct0PhaseAverageXuvWattsPerSquareMeter).toBeNull();
   expect(a.status).toBe('UNRESOLVED_COMPONENT_EVOLUTION_BOUNDARIES');
 });
 it('los intervalos conservan CT0 y no inventan EXTERNAL_DELIVERY',()=>{
   const a=run(triple());expect(a.history?.segments.at(-1)?.endYear).toBe(4e9);
   expect(a.history?.segments.some(s=>s.transfers.some(t=>t.process==='EXTERNAL_DELIVERY'))).toBe(false);
 });
});
