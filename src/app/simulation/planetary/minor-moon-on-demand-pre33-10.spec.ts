import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GalaxyGenerator } from '../universe/galaxy-generator';
import { GalaxySectorContentGenerator } from '../sector/galaxy-sector-content-generator';
import { GalaxySectorCoordinates } from '../../domain/sector/galaxy-sector-coordinates';
import { StellarMultihostFormation } from '../stellar/stellar-multihost-formation';
import { MinorMoonOnDemandPRE3310 } from './minor-moon-on-demand-pre33-10';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { KnownDiscovery } from '../../domain/discovery/known-discovery';
import { buildGalaxyPlanetMoonCatalogSnapshot } from '../../presentation/runtime/galaxy-planet-moon-catalog-snapshot.runtime';

const seed='7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
const key=new UniverseGenerationKey(UniverseSeed.parse(seed),GeneratorVersion.V3);
const galaxy=GalaxyGenerator.generate(key,0n);
const sector=GalaxySectorContentGenerator.generate(galaxy,new GalaxySectorCoordinates(23,24));
const locator=sector.systemLocators.find(x=>x.galacticObjectIndex===0n);
if(!locator)throw Error('PRE-33.10 fixture lost canonical host locator');
const single=StellarMultihostFormation.generateSingleOrNull(key,locator);
if(!single)throw Error('PRE-33.10 fixture lost V3 SINGLE host');
const withMinor=single.moonSystems.find(s=>s.unmaterializedMinorMoonCount>0);
if(!withMinor)throw Error('PRE-33.10 fixture must have identity-only moons');
const minorIndex=BigInt(withMinor.relevantMoonCount);

describe('PRE-33.10 — caracterización lunar bajo demanda V3',()=>{
  beforeEach(()=>MinorMoonOnDemandPRE3310.release());
  it('identidad conservada, misma época y semilla producen exactamente el mismo escenario sin generar vida',()=>{
    const a=MinorMoonOnDemandPRE3310.materialize(withMinor,minorIndex);
    const b=MinorMoonOnDemandPRE3310.materialize(withMinor,minorIndex);
    expect(a).not.toBeNull(); expect(a).toBe(b);
    expect(a?.identitySeed).toBe(withMinor.moonIdentities[Number(minorIndex)]?.seed.normalizedValue);
    expect(a?.life).toBe('NOT_EVALUATED');expect(a?.physicalModelResolved).toBe(false);
    MinorMoonOnDemandPRE3310.release();
    expect(MinorMoonOnDemandPRE3310.materialize(withMinor,minorIndex)).toEqual(a);
  });
  it('no materializa lunas relevantes, índices inválidos ni épocas inválidas',()=>{
    expect(MinorMoonOnDemandPRE3310.materialize(withMinor,-1n)).toBeNull();
    expect(MinorMoonOnDemandPRE3310.materialize(withMinor,BigInt(withMinor.moonCount))).toBeNull();
    expect(MinorMoonOnDemandPRE3310.materialize(withMinor,0n)).toBeNull();
    expect(MinorMoonOnDemandPRE3310.materialize(withMinor,minorIndex,-1)).toBeNull();
  });
  it('PRE-33.10a: la masa máxima visible es el prior por luna, nunca la masa total del anfitrión',()=>{
    const r=MinorMoonOnDemandPRE3310.materialize(withMinor,minorIndex);
    expect(r?.status).toBe('CONDITIONAL_BOUNDS');
    if(r?.status==='CONDITIONAL_BOUNDS'){
      const priorMaximum=withMinor.hostPlanet.massEarth*1e-5/withMinor.unmaterializedMinorMoonCount;
      expect(r.massUpperBoundEarth).toBe(r.massPriorCeilingEarth);
      expect(r.massPriorCeilingEarth).toBeGreaterThan(0);
      expect(r.massPriorCeilingEarth!).toBeLessThanOrEqual(priorMaximum);
      expect(r.massPriorCeilingEarth!).toBeLessThan(withMinor.hostPlanet.massEarth);
      expect(r.scenarioMassEarth!).toBeLessThanOrEqual(r.massPriorCeilingEarth!);
    }
  });
  it('PRE-33.10a: separa referencia Roche/Hill física condicional de techos de muestreo',()=>{
    const r=MinorMoonOnDemandPRE3310.materialize(withMinor,minorIndex);
    expect(r?.status).toBe('CONDITIONAL_BOUNDS');
    if(r?.status==='CONDITIONAL_BOUNDS'){
      const hostDensity=5.514*withMinor.hostPlanet.massEarth/(withMinor.hostPlanet.radiusEarth**3);
      expect(r.rocheFluidReferenceInnerPlanetRadii).toBeCloseTo(
        2.44*Math.cbrt(hostDensity/r.scenarioDensityGramsPerCm3!),10);
      expect(r.hillProgradeReferenceOuterPlanetRadii).toBeCloseTo(
        .49*withMinor.hillSphereRadiusPlanetRadii,10);
      expect(r.samplingOuterPlanetRadii).toBeCloseTo(
        Math.min(1000,.49*withMinor.hillSphereRadiusPlanetRadii),10);
      expect(r.samplingInnerPlanetRadii!).toBeGreaterThanOrEqual(r.rocheFluidReferenceInnerPlanetRadii!);
      expect(r.scenarioSemiMajorAxisPlanetRadii!).toBeGreaterThan(r.samplingInnerPlanetRadii!);
      expect(r.scenarioSemiMajorAxisPlanetRadii!).toBeLessThan(r.samplingOuterPlanetRadii!);
      expect(r.samplingCeilingIsNumerical).toBe(r.hillProgradeReferenceOuterPlanetRadii!>1000);
      expect(r.physicalModelResolved).toBe(false);
    }
  });
  it('el cache V3 nunca crece sin límite y libera su memoria',()=>{
    for(let year=0;year<140;year++) MinorMoonOnDemandPRE3310.materialize(withMinor,minorIndex,year);
    expect(MinorMoonOnDemandPRE3310.cachedCount).toBeLessThanOrEqual(96);
    MinorMoonOnDemandPRE3310.release();expect(MinorMoonOnDemandPRE3310.cachedCount).toBe(0);
  });
  it('CONFIRMED V3 enumera todas las identidades, pero no materializa sus propiedades en el catálogo',()=>{
    const confirmed=buildGalaxyPlanetMoonCatalogSnapshot(key,0n,[new KnownDiscovery(key,locator,DiscoveryState.CONFIRMED)]);
    const all=single.moonSystems.reduce((n,m)=>n+m.moonCount,0);
    const minor=single.moonSystems.reduce((n,m)=>n+m.unmaterializedMinorMoonCount,0);
    expect(confirmed.moons).toHaveLength(all);
    expect(confirmed.identityCoveragePRE3310).toBe(1);
    expect(confirmed.moons.filter(m=>m.materializationPRE3310==='IDENTITY_ONLY')).toHaveLength(minor);
    expect(confirmed.moons.filter(m=>m.materializationPRE3310==='IDENTITY_ONLY').every(m=>
      m.massEarth===null&&m.waterRegime===null&&m.atmosphere===null)).toBe(true);
    expect(MinorMoonOnDemandPRE3310.cachedCount).toBe(0);
    expect(buildGalaxyPlanetMoonCatalogSnapshot(key,0n,[new KnownDiscovery(key,locator,DiscoveryState.CATALOGUED)]).moons).toHaveLength(0);
  });
});

import { ArchiveDiscoveryLocatorKind, type ArchiveDiscoveryDetailModel } from '../../presentation/genesis-archive/archive-discovery-detail.facade';
import { MoonScientificCardAssembler } from '../../presentation/moon-detail/moon-scientific-card';

describe('PRE-33.10 — ficha V3 por identidad, sin fuga de evidencia',()=>{
  const model={universeSeed:seed,generatorVersionCode:3,
    locatorKind:ArchiveDiscoveryLocatorKind.SYSTEM,discoveryState:DiscoveryState.CONFIRMED,
    galaxyIndex:0n,sectorKey:0n,galacticObjectIndex:0n,
    stellarSystemCard:{title:'Sistema científico V3'}} as unknown as ArchiveDiscoveryDetailModel;
  const resolver={resolveDetailed:()=>null,
    resolveMinor:()=>({designation:'Luna de prueba V3',host:'Planeta',
      characterization:MinorMoonOnDemandPRE3310.materialize(withMinor,minorIndex)!})};
  it('CONFIRMED permite una ficha de identidad sin inventar secciones ambientales',()=>{
    const result=MoonScientificCardAssembler.build(model,0n,minorIndex,resolver);
    expect(result.kind).toBe('IDENTITY_ONLY');
    if(result.kind==='IDENTITY_ONLY'){
      expect(result.characterization.life).toBe('NOT_EVALUATED');
      expect(result.characterization.physicalModelResolved).toBe(false);
    }
  });
  it('CATALOGUED no hace visible un objetivo lunar privado',()=>{
    const result=MoonScientificCardAssembler.build({ ...model, discoveryState:DiscoveryState.CATALOGUED },0n,minorIndex,resolver);
    expect(result.kind).toBe('LOCKED');
  });
  it('CONFIRMED sigue devolviendo NOT_FOUND si no existe identidad menor en el resolver',()=>{
    const result=MoonScientificCardAssembler.build(model,0n,minorIndex,{
      resolveDetailed:()=>null, resolveMinor:()=>null,
    });
    expect(result.kind).toBe('NOT_FOUND');
  });
  it('V2 no se reinterpreta como luna menor V3',()=>{
    const result=MoonScientificCardAssembler.build({...model,generatorVersionCode:2},0n,minorIndex,resolver);
    expect(result.kind).toBe('NOT_FOUND');
  });
});
