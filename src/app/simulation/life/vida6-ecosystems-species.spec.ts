import { describe, expect, it } from 'vitest';
import { Vida6EcosystemsSpecies } from './vida6-ecosystems-species';
import { ProceduralEcologyVIDA4 } from './procedural-ecology-vida4';
import { VIDA4_GROUPS } from '../../domain/life/procedural-ecology-vida4';
import { VIDA5C_REVISION, type Vida5cAdvancedBiosphere } from '../../domain/life/vida5c-advanced-biospheres';
import { VIDA5_ATMOSPHERE_REVISION, type Vida5AtmosphericFeedback } from '../../domain/life/vida5-biogenic-atmosphere';
import { VIDA3_MODEL_REVISION, type Vida3MicrobialSnapshot } from '../../domain/life/procedural-microbial-vida3';

const seed = '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
function micro(index: number, habitat: Vida3MicrobialSnapshot['habitat'] = 'SURFACE_OPEN',
  lifePresent = true, kind: 'PLANET'|'MOON'='PLANET'): Vida3MicrobialSnapshot {
  const id = {universeSeed:seed,generatorVersionCode:3,kind,galaxyIndex:'0',sectorKey:'1',
    galacticObjectIndex:'2',bodyIndex:String(index),moonIndex:kind==='MOON'?'0':null};
  return {revision:VIDA3_MODEL_REVISION,identity:id,
    bodyStorageKey:`0:1:2:${index}:${kind}:${id.moonIndex??'-'}`,
    plausibility:habitat?'PLAUSIBLE':'NOT_PLAUSIBLE',
    selectedRoute:habitat==='SUBSURFACE'?'SUBSURFACE':habitat?'SURFACE':null,
    habitat,lifePresent,biology:lifePresent?'MICROBIAL':'NONE',
    biosphereId:lifePresent?'vida3:test':null,digest:String(index).padStart(64,'0')};
}
const feedback: Vida5AtmosphericFeedback = {
  revision:VIDA5_ATMOSPHERE_REVISION,status:'APPLIED',ecologyDigest:'source',
  sourcePressurePascal:101325,pressurePascal:101325,
  sourceOxygenFraction01:0.03,oxygenFraction01:0.21,oxygenPartialPressurePascal:21278,
  aerobicAdvanced:true,effectiveGroups:VIDA4_GROUPS,stablePhotosyntheticVegetation:true,
  advancedAerobicFaunaSupported:true,nativeCivilizationAtmosphereReady:true,
  gasComposition:[{gas:'NITROGEN',moleFraction01:0.79},{gas:'OXYGEN',moleFraction01:0.21}],
  meanMolarMassGramsPerMole:28.9,referenceDensityKilogramsPerCubicMeter:1.2,
  greenhouseTrappingFraction01:0.35,climateDeltaKelvin:0,meanSurfaceTemperatureKelvin:290,
  pressureBalanceFactor:1,digest:'atmosphere',
};
function calibrated(m:Vida3MicrobialSnapshot,e:ReturnType<typeof ProceduralEcologyVIDA4.evaluate>,
  full=true): Vida5cAdvancedBiosphere {
  return {revision:VIDA5C_REVISION,identity:{universeSeed:seed,generatorVersionCode:3,galaxyIndex:'0'},
    bodyStorageKey:m.bodyStorageKey,originalMicrobialDigest:m.digest,originalEcologyDigest:e.digest,
    originalMaturationDigest:'maturation',originalMicrobialLifePresent:m.lifePresent,
    effectiveMicrobialLifePresent:m.lifePresent,newlyEstablishedMicrobialLife:false,
    originalEffectiveGroups:e.groups,effectiveGroups:full?VIDA4_GROUPS:e.groups,
    promotedFromPhysicalEvidence:full,advancedAtmosphereSuitable:full,
    atmosphericFeedback:feedback,nativeCivilizationPrerequisitesReady:full,
    futureIntelligenceProbability:0.65,futureCivilizationConditionalProbability:0.60,
    digest:'calibration-'+m.digest};
}

describe('VIDA.6 ecosistemas y especies',()=>{
  it('es determinista, serializable y no depende del orden de consultas',()=>{
    const m=micro(1),e=ProceduralEcologyVIDA4.evaluate(m),c=calibrated(m,e);
    const a=Vida6EcosystemsSpecies.evaluate(m,e,c);
    const b=Vida6EcosystemsSpecies.evaluate(m,e,c);
    Vida6EcosystemsSpecies.evaluate(micro(5),ProceduralEcologyVIDA4.evaluate(micro(5)));
    expect(b).toEqual(a);
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
    expect(a.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(a.calibrationDigest).toBe(c.digest);
    expect(a.effectiveGroups).toEqual(VIDA4_GROUPS);
    expect(a.species.length).toBeGreaterThan(25);
    expect(a.regime).toBe('SURFACE_DIVERSE');
    expect(a.intelligentSpeciesGenerated).toBe(false);
    expect(a.civilizationGenerated).toBe(false);
  });
  it('preserva esterilidad sin introducir vida por nuevas tiradas',()=>{
    const m=micro(3,null,false),e=ProceduralEcologyVIDA4.evaluate(m);
    const s=Vida6EcosystemsSpecies.evaluate(m,e);
    expect(s.regime).toBe('STERILE');expect(s.species).toHaveLength(0);
    expect(s.relations).toHaveLength(0);expect(s.biospherePresent).toBe(false);
  });
  it('limita en el subsuelo lunar los taxones, nichos y tamanos poblacionales',()=>{
    for(let i=0;i<64;i++){
      const m=micro(i,'SUBSURFACE',true,'MOON'),e=ProceduralEcologyVIDA4.evaluate(m);
      const s=Vida6EcosystemsSpecies.evaluate(m,e);
      expect(s.regime).toBe('ISOLATED_SUBSURFACE');
      expect(s.species.length).toBeLessThanOrEqual(4);
      expect(s.effectiveGroups.every(g=>['MICROORGANISMS','FUNGI'].includes(g))).toBe(true);
      expect(s.species.every(x=>x.habitat==='AQUIFER'||x.habitat==='SUBSURFACE_CAVERN')).toBe(true);
      expect(s.species.every(x=>x.phenotype.locomotion==='SESSILE')).toBe(true);
      expect(s.species.every(x=>x.nutrition==='CHEMOSYNTHETIC'||x.nutrition==='DECOMPOSER')).toBe(true);
    }
  });
  it('permite solo microbios en filtraciones protegidas',()=>{
    const m=micro(4,'SURFACE_PROTECTED_SEEP'),e=ProceduralEcologyVIDA4.evaluate(m);
    const s=Vida6EcosystemsSpecies.evaluate(m,e);
    expect(s.regime).toBe('PROTECTED_MICROBIAL_SEEP');
    expect(s.species.length).toBeLessThanOrEqual(2);
    expect(s.species.every(x=>x.group==='MICROORGANISMS'&&x.habitat==='PROTECTED_SEEP')).toBe(true);
  });
  it('tiene identidades unicas, rasgos visuales acotados, y cadenas sin presas futuras ni ciclos',()=>{
    const m=micro(6),e=ProceduralEcologyVIDA4.evaluate(m),s=Vida6EcosystemsSpecies.evaluate(m,e,calibrated(m,e));
    const map=new Map(s.species.map(x=>[x.id,x]));
    expect(map.size).toBe(s.species.length);
    for(const species of s.species){
      expect(species.phenotype.bodyLengthMeters).toBeGreaterThan(0);
      expect(species.phenotype.primaryColorHex).toMatch(/^#[0-9A-F]{6}$/);
      expect(species.adaptations.length).toBeGreaterThan(0);
    }
    for(const relation of s.relations){
      expect(map.has(relation.sourceSpeciesId)).toBe(true);
      expect(map.has(relation.targetSpeciesId)).toBe(true);
      expect(relation.sourceSpeciesId).not.toBe(relation.targetSpeciesId);
      expect(relation.intensity01).toBeGreaterThan(0);
      expect(relation.intensity01).toBeLessThanOrEqual(1);
      if(relation.kind==='CONSUMES'){
        const predator=map.get(relation.sourceSpeciesId)!;
        const prey=map.get(relation.targetSpeciesId)!;
        expect(VIDA4_GROUPS.indexOf(predator.group)).toBeGreaterThan(VIDA4_GROUPS.indexOf(prey.group));
      }
    }
  });
  it('rechaza mezcla de seeds, identidades, y calibraciones de otra biosfera',()=>{
    const m=micro(8),e=ProceduralEcologyVIDA4.evaluate(m),c=calibrated(m,e);
    expect(()=>Vida6EcosystemsSpecies.evaluate(m,e,{...c,bodyStorageKey:'otro'})).toThrow();
    expect(()=>Vida6EcosystemsSpecies.evaluate(m,e,{...c,originalEcologyDigest:'otro'})).toThrow();
    expect(()=>Vida6EcosystemsSpecies.evaluate(m,{...e,microbialDigest:'otro'})).toThrow();
    expect(()=>Vida6EcosystemsSpecies.evaluate(micro(9,'SUBSURFACE',true,'MOON'),e)).toThrow();
  });
});
