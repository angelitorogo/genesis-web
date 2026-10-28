import { describe,it,expect } from 'vitest';
import { Vida8TechnologicalColonization } from './vida8-technological-colonization';
import { Vida6EcosystemsSpecies } from './vida6-ecosystems-species';
import { Vida7IntelligenceCivilizations } from './vida7-intelligence-civilizations';
import { ProceduralEcologyVIDA4 } from './procedural-ecology-vida4';
import { VIDA3_MODEL_REVISION,type Vida3MicrobialSnapshot } from '../../domain/life/procedural-microbial-vida3';
import { VIDA4_GROUPS } from '../../domain/life/procedural-ecology-vida4';
import { VIDA5C_REVISION,type Vida5cAdvancedBiosphere } from '../../domain/life/vida5c-advanced-biospheres';
import { VIDA5_ATMOSPHERE_REVISION, type Vida5AtmosphericFeedback } from '../../domain/life/vida5-biogenic-atmosphere';
import type { Vida2WorldAssessment } from './life-plausibility-engine-vida2';
import type { Vida8CivilizationSource } from './vida8-technological-colonization';

const seed='7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
const feedback:Vida5AtmosphericFeedback={revision:VIDA5_ATMOSPHERE_REVISION,status:'APPLIED',
  ecologyDigest:'test',sourcePressurePascal:101325,pressurePascal:101325,sourceOxygenFraction01:0.03,
  oxygenFraction01:.21,oxygenPartialPressurePascal:21000,aerobicAdvanced:true,
  effectiveGroups:VIDA4_GROUPS,stablePhotosyntheticVegetation:true,
  advancedAerobicFaunaSupported:true,nativeCivilizationAtmosphereReady:true,
  gasComposition:[{gas:'NITROGEN',moleFraction01:.79},{gas:'OXYGEN',moleFraction01:.21}],
  meanMolarMassGramsPerMole:28.9,referenceDensityKilogramsPerCubicMeter:1.2,
  greenhouseTrappingFraction01:.35,climateDeltaKelvin:0,meanSurfaceTemperatureKelvin:290,
  pressureBalanceFactor:1,digest:'test-atmosphere'};
const physical:Vida2WorldAssessment={contract:'VIDA.2/plausibility/v2',classification:'NOT_PLAUSIBLE',
  selectedRoute:null,lifeGenerated:false,routes:[]};
function sourcePlanet(n:number):Vida8CivilizationSource {
  const identity={universeSeed:seed,generatorVersionCode:3,kind:'PLANET' as const,
    galaxyIndex:'0',sectorKey:'0',galacticObjectIndex:'0',bodyIndex:String(n),moonIndex:null};
  const micro:Vida3MicrobialSnapshot={revision:VIDA3_MODEL_REVISION,identity,
    bodyStorageKey:`src:${n}`,plausibility:'PLAUSIBLE',selectedRoute:'SURFACE',habitat:'SURFACE_OPEN',
    lifePresent:true,biology:'MICROBIAL',biosphereId:`origin:${n}`,digest:'a'.repeat(63)+(n%10)};
  const ecology=ProceduralEcologyVIDA4.evaluate(micro);
  const cal:Vida5cAdvancedBiosphere={revision:VIDA5C_REVISION,
    identity:{universeSeed:seed,generatorVersionCode:3,galaxyIndex:'0'},bodyStorageKey:micro.bodyStorageKey,
    originalMicrobialDigest:micro.digest,originalEcologyDigest:ecology.digest,
    originalMaturationDigest:'matured',originalMicrobialLifePresent:true,effectiveMicrobialLifePresent:true,
    newlyEstablishedMicrobialLife:false,originalEffectiveGroups:ecology.groups,effectiveGroups:VIDA4_GROUPS,
    promotedFromPhysicalEvidence:true,advancedAtmosphereSuitable:true,atmosphericFeedback:feedback,
    nativeCivilizationPrerequisitesReady:true,futureIntelligenceProbability:.65,
    futureCivilizationConditionalProbability:.60,digest:`cal:${n}`};
  const ecosystem=Vida6EcosystemsSpecies.evaluate(micro,ecology,cal);
  const civilization=Vida7IntelligenceCivilizations.evaluate(ecosystem,cal);
  return {ecosystem,civilization};
}
function target(n:number,kind:'PLANET'|'MOON'='MOON',nativeLife=false){
  const identity={universeSeed:seed,generatorVersionCode:3,kind,
    galaxyIndex:'0',sectorKey:'0',galacticObjectIndex:'0',bodyIndex:String(n),moonIndex:kind==='MOON'?'0':null};
  const micro:Vida3MicrobialSnapshot={revision:VIDA3_MODEL_REVISION,identity,bodyStorageKey:`target:${kind}:${n}`,
    plausibility:nativeLife?'PLAUSIBLE':'NOT_PLAUSIBLE',selectedRoute:nativeLife?'SUBSURFACE':null,
    habitat:nativeLife?'SUBSURFACE':null,lifePresent:nativeLife,biology:nativeLife?'MICROBIAL':'NONE',
    biosphereId:nativeLife?'subsurface':null,digest:'b'.repeat(63)+(n%10)};
  const ecology=ProceduralEcologyVIDA4.evaluate(micro);
  const ecosystem=Vida6EcosystemsSpecies.evaluate(micro,ecology);
  const nativeCivilization=Vida7IntelligenceCivilizations.evaluate(ecosystem);
  return {ecosystem,nativeCivilization,physical,solidSurface:true};
}
let allSources:Vida8CivilizationSource[]|null=null;
function origins():Vida8CivilizationSource[]{
  if(allSources)return allSources;
  const found:Vida8CivilizationSource[]=[];
  for(let i=0;i<1300;i++){
    const s=sourcePlanet(i);
    if(s.civilization.civilization?.tier==='ADVANCED' || s.civilization.civilization?.tier==='VERY_ADVANCED'){
      if(!found.some(x=>x.civilization.civilization!.tier===s.civilization.civilization!.tier))found.push(s);
    }
    if(found.length===2)break;
  }
  if(found.length!==2)throw Error('VIDA.8 test fixture missing advanced / very advanced sources');
  allSources=found;
  return found;
}

describe('VIDA.8 colonizacion tecnologica',()=>{
  it('no inventa colonias sin civilizacion de origen elegible',()=>{
    const t=target(900);
    const a=Vida8TechnologicalColonization.evaluate(t,[]);
    expect(a.outcome).toBe('NO_ELIGIBLE_ORIGIN');
    expect(a.nativeLifePresent).toBe(false);
    expect(a.introducedLifePresent).toBe(false);
    expect(a.colonies).toHaveLength(0);
    expect(a.colonialPopulationPresent).toBe(false);
  });
  it('reproduce las mismas colonias independientemente del orden de origen/consulta',()=>{
    const t=target(901),s=origins();
    const a=Vida8TechnologicalColonization.evaluate(t,s);
    const b=Vida8TechnologicalColonization.evaluate(t,[...s].reverse());
    expect(a).toEqual(b);
    expect(Vida8TechnologicalColonization.evaluate(t,[...s,s[0]])).toEqual(a);
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
    expect(a.digest).toMatch(/^[0-9a-f]{64}$/);
  });
  it('permite colonias y biota INTRODUCIDA en lunas esteriles sin vida nativa',()=>{
    const s=origins(),host=target(1900);
    let example:ReturnType<typeof Vida8TechnologicalColonization.evaluate>|null=null;
    for(let n=1900;n<2050;n++){
      const a=Vida8TechnologicalColonization.evaluate(target(n),s);
      if(a.colonies.length){example=a;break;}
    }
    expect(example).not.toBe(null);
    expect(example!.identity.kind).toBe('MOON');
    expect(example!.nativeLifePresent).toBe(false);
    expect(example!.nativeCivilizationPresent).toBe(false);
    expect(example!.colonialPopulationPresent).toBe(true);
    expect(example!.introducedLifePresent).toBe(true);
    for(const colony of example!.colonies){
      expect(['ADVANCED','VERY_ADVANCED']).toContain(colony.origin.tier);
      expect(colony.origin.sourceIdentity.kind).toBe('PLANET');
      expect(colony.settlement.colonialPopulationRange[0]).toBeGreaterThan(0);
      const source=s.find(x=>x.ecosystem.bodyStorageKey===colony.origin.sourceBodyStorageKey)!;
      expect(source.civilization.civilization!.founderSpeciesId).toBe(colony.origin.founderSpeciesId);
      for(const introduced of colony.introducedOrganisms){
        expect(source.ecosystem.species.some(sp=>sp.id===introduced.originSpeciesId)).toBe(true);
        expect(introduced.provenance).toBe('IMPORTED_FROM_ORIGIN');
      }
    }
    expect(host.ecosystem.biospherePresent).toBe(false);
  });
  it('una luna con vida nativa subterranea no confunde colonos con biosfera originaria',()=>{
    const result=Vida8TechnologicalColonization.evaluate(target(2100,'MOON',true),origins());
    expect(result.nativeLifePresent).toBe(true);
    expect(result.nativeIntelligencePresent).toBe(false);
    expect(result.nativeCivilizationPresent).toBe(false);
    expect(result.ecosystemDigest).toBe(target(2100,'MOON',true).ecosystem.digest);
  });
  it('no crea asentamiento sobre gigantes sin superficie solida, ni en mundo de origen',()=>{
    const [source]=origins();const t=target(2200);
    const giant=Vida8TechnologicalColonization.evaluate({...t,solidSurface:false},[source]);
    expect(giant.outcome).toBe('NO_SOLID_SURFACE');
    expect(giant.colonies).toHaveLength(0);
    const own=Vida8TechnologicalColonization.evaluate({ecosystem:source.ecosystem,
      nativeCivilization:source.civilization,physical,solidSurface:true},[source]);
    expect(own.colonies).toHaveLength(0);
  });
  it('terraformacion solo en planetas y muy avanzada, sin alterar fisica ni soltar organismos',()=>{
    const s=origins();let terraform=0;let colonies=0;
    for(let n=2500;n<3000;n++){
      const t=target(n,'PLANET');
      const before=JSON.stringify(t);
      const result=Vida8TechnologicalColonization.evaluate(t,s);
      expect(JSON.stringify(t)).toBe(before);
      for(const colony of result.colonies){
        colonies++;
        expect(colony.introducedOrganisms.every(x=>x.containment.startsWith('CLOSED_') ||
          x.containment==='SEALED_BIOREACTOR')).toBe(true);
        if(colony.terraform){
          terraform++;
          expect(colony.origin.tier).toBe('VERY_ADVANCED');
          expect(colony.terraform.environmentChanged).toBe(false);
          expect(colony.terraform.ecologicalReleaseAuthorized).toBe(false);
        }
      }
    }
    expect(colonies).toBeGreaterThan(0);
    expect(terraform).toBeGreaterThan(0);
    for(let n=3000;n<3400;n++){
      const result=Vida8TechnologicalColonization.evaluate(target(n,'MOON'),s);
      expect(result.colonies.every(c=>c.terraform===null)).toBe(true);
    }
  });
  it('filtra origenes incompatibles y rechaza fuentes nativas contradictorias',()=>{
    const t=target(3500),s=origins()[0];
    const otherSeed={ecosystem:{...s.ecosystem,identity:{...s.ecosystem.identity,universeSeed:'OTHER'}},
      civilization:s.civilization};
    expect(Vida8TechnologicalColonization.evaluate(t,[otherSeed]).colonies).toHaveLength(0);
    expect(()=>Vida8TechnologicalColonization.evaluate({ ...t,
      nativeCivilization:{...t.nativeCivilization,ecosystemDigest:'WRONG'}},[s])).toThrow();
    expect(()=>Vida8TechnologicalColonization.evaluate(t,[s,{...s,
      civilization:{...s.civilization,digest:'CONFLICT'}}])).toThrow();
  });
});
