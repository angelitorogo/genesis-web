import { describe, it, expect } from 'vitest';
import { Vida7IntelligenceCivilizations } from './vida7-intelligence-civilizations';
import { Vida6EcosystemsSpecies } from './vida6-ecosystems-species';
import { ProceduralEcologyVIDA4 } from './procedural-ecology-vida4';
import { Vida5cAdvancedBiospheres } from './vida5c-advanced-biospheres';
import { VIDA4_GROUPS } from '../../domain/life/procedural-ecology-vida4';
import { VIDA3_MODEL_REVISION, type Vida3MicrobialSnapshot } from '../../domain/life/procedural-microbial-vida3';
import { VIDA5C_REVISION, type Vida5cAdvancedBiosphere } from '../../domain/life/vida5c-advanced-biospheres';
import { VIDA5_ATMOSPHERE_REVISION, type Vida5AtmosphericFeedback } from '../../domain/life/vida5-biogenic-atmosphere';
import { VIDA7_TIER_PROBABILITIES } from '../../domain/life/vida7-intelligence-civilizations';

const seed='7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
function micro(n:number,habitat: Vida3MicrobialSnapshot['habitat']='SURFACE_OPEN',
  kind:'PLANET'|'MOON'='PLANET', lifePresent=true):Vida3MicrobialSnapshot {
  const identity={universeSeed:seed,generatorVersionCode:3,kind,galaxyIndex:'0',
    sectorKey:'1',galacticObjectIndex:'2',bodyIndex:String(n),moonIndex:kind==='MOON'?'0':null};
  return {revision:VIDA3_MODEL_REVISION,identity,bodyStorageKey:`0:1:2:${n}:${kind}:${identity.moonIndex??'-'}`,
    plausibility:habitat?'PLAUSIBLE':'NOT_PLAUSIBLE',
    selectedRoute:habitat==='SUBSURFACE'?'SUBSURFACE':habitat?'SURFACE':null,
    habitat,lifePresent,biology:lifePresent?'MICROBIAL':'NONE',
    biosphereId:lifePresent?'vida3:synthetic':null,digest:String(n+1).padStart(64,'a')};
}
const feedback:Vida5AtmosphericFeedback={
  revision:VIDA5_ATMOSPHERE_REVISION,status:'APPLIED',ecologyDigest:'original',
  sourcePressurePascal:101325,pressurePascal:101325,sourceOxygenFraction01:0.03,
  oxygenFraction01:0.21,oxygenPartialPressurePascal:21278,aerobicAdvanced:true,
  effectiveGroups:VIDA4_GROUPS,stablePhotosyntheticVegetation:true,
  advancedAerobicFaunaSupported:true,nativeCivilizationAtmosphereReady:true,
  gasComposition:[{gas:'NITROGEN',moleFraction01:0.79},{gas:'OXYGEN',moleFraction01:0.21}],
  meanMolarMassGramsPerMole:28.9,referenceDensityKilogramsPerCubicMeter:1.2,
  greenhouseTrappingFraction01:0.35,climateDeltaKelvin:0,meanSurfaceTemperatureKelvin:290,
  pressureBalanceFactor:1,digest:'synthetic-atmosphere',
};
function sources(n:number){
  const m=micro(n),e=ProceduralEcologyVIDA4.evaluate(m);
  const c:Vida5cAdvancedBiosphere={revision:VIDA5C_REVISION,
    identity:{universeSeed:seed,generatorVersionCode:3,galaxyIndex:'0'},
    bodyStorageKey:m.bodyStorageKey,originalMicrobialDigest:m.digest,
    originalEcologyDigest:e.digest,originalMaturationDigest:'synthetic-matured',
    originalMicrobialLifePresent:true,effectiveMicrobialLifePresent:true,
    newlyEstablishedMicrobialLife:false,originalEffectiveGroups:e.groups,
    effectiveGroups:VIDA4_GROUPS,promotedFromPhysicalEvidence:true,
    advancedAtmosphereSuitable:true,atmosphericFeedback:feedback,
    nativeCivilizationPrerequisitesReady:true,
    futureIntelligenceProbability:0.65,futureCivilizationConditionalProbability:0.60,
    digest:`synthetic-c${n}`};
  return {e,c,s:Vida6EcosystemsSpecies.evaluate(m,e,c)};
}

describe('VIDA.7 inteligencia y civilizaciones',()=>{
  it('conserva el determinismo y el vínculo con una especie existente VIDA.6',()=>{
    const {s,c}=sources(1);const a=Vida7IntelligenceCivilizations.evaluate(s,c);
    Vida7IntelligenceCivilizations.evaluate(...[sources(99).s,sources(99).c] as const);
    expect(Vida7IntelligenceCivilizations.evaluate(s,c)).toEqual(a);
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
    expect(a.ecosystemDigest).toBe(s.digest);
    expect(a.calibrationDigest).toBe(c.digest);
    expect(a.digest).toMatch(/^[0-9a-f]{64}$/);
    if(a.intelligentSpecies){
      expect(s.species.some(sp=>sp.id===a.intelligentSpecies!.speciesId)).toBe(true);
      expect(['HUMANOID','REPTILIAN','INSECTOID']).toContain(a.intelligentSpecies.lineage);
    }
  });
  it('rechaza luna, subsuelo y vida no apta sin promoverla a inteligencia',()=>{
    for(const [kind,habitat] of [['MOON','SUBSURFACE'],['PLANET','SUBSURFACE'],
      ['MOON','SURFACE_PROTECTED_SEEP']] as const){
      const m=micro(5,habitat,kind),e=ProceduralEcologyVIDA4.evaluate(m);
      const eco=Vida6EcosystemsSpecies.evaluate(m,e);
      const result=Vida7IntelligenceCivilizations.evaluate(eco);
      expect(result.intelligencePresent).toBe(false);
      expect(result.civilizationPresent).toBe(false);
      expect(result.civilization).toBe(null);
      expect(result.intelligentSpecies).toBe(null);
      expect(result.eligibility).not.toBe('ELIGIBLE');
    }
    const {s}=sources(6);
    const noCalibration=Vida7IntelligenceCivilizations.evaluate({...s,calibrationDigest:null});
    expect(noCalibration.eligibility).toBe('NO_CALIBRATION');
    expect(noCalibration.intelligencePresent).toBe(false);
  });
  it('inteligencia no implica civilizacion: tiradas condicionadas VIDA.5c',()=>{
    let intelligentOnly=0, civilized=0, noIntelligence=0;
    const calibrations:Vida5cAdvancedBiosphere[]=[];
    const outputs:ReturnType<typeof Vida7IntelligenceCivilizations.evaluate>[]=[];
    for(let i=0;i<220;i++){
      const {s,c}=sources(i+100);calibrations.push(c);
      const value=Vida7IntelligenceCivilizations.evaluate(s,c);outputs.push(value);
      if(value.intelligencePresent && !value.civilizationPresent) intelligentOnly++;
      if(value.civilizationPresent) civilized++;
      if(!value.intelligencePresent) noIntelligence++;
      expect(!value.civilizationPresent || value.intelligencePresent).toBe(true);
    }
    expect(intelligentOnly).toBeGreaterThan(0);
    expect(civilized).toBeGreaterThan(0);
    expect(noIntelligence).toBeGreaterThan(0);
    const predicted=Vida5cAdvancedBiospheres.forecastCivilizations(calibrations);
    expect(outputs.filter(x=>x.intelligencePresent).length).toBe(predicted.intelligenceSelected);
    expect(outputs.filter(x=>x.civilizationPresent).map(x=>x.bodyStorageKey).sort())
      .toEqual(predicted.candidates.map(x=>x.bodyStorageKey).sort());
  });
  it('genera tres linajes y asienta cada cultura SOLO en habitats existentes',()=>{
    const seen=new Set<string>();const tiers=new Set<string>();
    for(let i=0;i<240;i++){
      const {s,c}=sources(i+600);const value=Vida7IntelligenceCivilizations.evaluate(s,c);
      if(value.intelligentSpecies)seen.add(value.intelligentSpecies.lineage);
      const civ=value.civilization;
      if(!civ)continue;
      tiers.add(civ.tier);
      expect(civ.founderSpeciesId).toBe(value.intelligentSpecies!.speciesId);
      expect(civ.lineage).toBe(value.intelligentSpecies!.lineage);
      expect(civ.settlementPatterns.length).toBeGreaterThan(0);
      expect(civ.settlementPatterns.every(x=>s.habitatsOccupied.includes(x.habitat))).toBe(true);
      expect(civ.settlementPatterns.every(x=>x.habitat.startsWith('SURFACE_'))).toBe(true);
      expect(new Set(civ.settlementPatterns.map(x=>x.id)).size).toBe(civ.settlementPatterns.length);
      expect(civ.technology.includes('ORBITAL_CAPABILITY')).toBe(civ.tier==='VERY_ADVANCED');
      expect(civ.technology.includes('ELECTRIFICATION')).toBe(civ.tier!=='PRIMITIVE');
      expect(civ.culture.communication).toBe(value.intelligentSpecies!.communication);
      expect(civ.technology.length).toBeGreaterThan(0);
    }
    expect(seen).toEqual(new Set(['HUMANOID','REPTILIAN','INSECTOID']));
    expect(tiers).toEqual(new Set(['PRIMITIVE','ADVANCED','VERY_ADVANCED']));
  });
  it('reparte niveles 65/30/5 por probabilidades estables sin cuota artificial',()=>{
    // Reutilizar estructura fisica para medir el roll tecnologico, no inventar nuevas galaxias.
    const {s,c}=sources(50);
    const counts={PRIMITIVE:0,ADVANCED:0,VERY_ADVANCED:0};
    let candidates=0;
    for(let i=0;i<3000;i++){
      const key=`test-planet-${i}`;
      const sim={...s,bodyStorageKey:key,digest:`eco-${i}`,identity:{...s.identity,bodyIndex:String(i)}};
      const cal={...c,bodyStorageKey:key,digest:c.digest};
      const input={...sim,calibrationDigest:cal.digest};
      const result=Vida7IntelligenceCivilizations.evaluate(input,cal);
      if(result.civilization){counts[result.civilization.tier]++;candidates++;}
    }
    expect(candidates).toBeGreaterThan(900);
    expect(Math.abs(counts.PRIMITIVE/candidates-VIDA7_TIER_PROBABILITIES.PRIMITIVE)).toBeLessThan(0.05);
    expect(Math.abs(counts.ADVANCED/candidates-VIDA7_TIER_PROBABILITIES.ADVANCED)).toBeLessThan(0.05);
    expect(Math.abs(counts.VERY_ADVANCED/candidates-VIDA7_TIER_PROBABILITIES.VERY_ADVANCED)).toBeLessThan(0.025);
  });
  it('conserva la ruta atmosférica heredada VIDA.5b con requisitos ya acreditados',()=>{
    const {e,c}=sources(42);
    const m=micro(42);
    const inherited={...c,advancedAtmosphereSuitable:false};
    const eco=Vida6EcosystemsSpecies.evaluate(m,e,inherited);
    expect(eco.regime).toBe('SURFACE_LIMITED');
    const snapshot=Vida7IntelligenceCivilizations.evaluate(eco,inherited);
    expect(snapshot.eligibility).toBe('ELIGIBLE');
    const unsafe={...inherited,atmosphericFeedback:{...feedback,oxygenFraction01:0.04,
      oxygenPartialPressurePascal:4000}};
    const ecoUnsafe=Vida6EcosystemsSpecies.evaluate(m,e,unsafe);
    expect(Vida7IntelligenceCivilizations.evaluate(ecoUnsafe,unsafe).eligibility)
      .toBe('UNSUITABLE_ATMOSPHERE');
  });
  it('rechaza mezcla de biosferas y calibraciones sin alterar ninguna entrada',()=>{
    const {s,c}=sources(21);
    expect(()=>Vida7IntelligenceCivilizations.evaluate(s,{...c,digest:'changed'})).toThrow();
    expect(()=>Vida7IntelligenceCivilizations.evaluate(s,{...c,bodyStorageKey:'changed'})).toThrow();
    expect(()=>Vida7IntelligenceCivilizations.evaluate(s,{...c,originalMicrobialDigest:'changed'})).toThrow();
    expect(()=>Vida7IntelligenceCivilizations.evaluate(s,{...c,effectiveGroups:[]})).toThrow();
    expect(()=>Vida7IntelligenceCivilizations.evaluate({...s,species:[...s.species,s.species[0]]},c)).toThrow();
    expect(()=>Vida7IntelligenceCivilizations.evaluate(s)).toThrow();
  });
});
