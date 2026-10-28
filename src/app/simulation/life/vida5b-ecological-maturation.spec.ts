import { describe, expect, it } from 'vitest';
import { Vida5aEcologyAtmosphere } from './vida5a-ecology-atmosphere';
import { Vida5bEcologicalMaturation } from './vida5b-ecological-maturation';
import { VIDA4_GROUPS, VIDA4_MODEL_REVISION, type Vida4EcologySnapshot } from '../../domain/life/procedural-ecology-vida4';
import { VIDA7_FUTURE_INTELLIGENCE_RATE, VIDA7_FUTURE_CIVILIZATION_RATE,
  VIDA7_FUTURE_CIVILIZATION_LEVEL_RATES } from '../../domain/life/vida5b-ecological-maturation';
import type { PlanetScientificResolvedTarget } from '../planetary/planet-scientific-target-resolver';

const eco = (id:number, level=1, habitat:Vida4EcologySnapshot['habitat']='SURFACE_OPEN') => ({
  revision:VIDA4_MODEL_REVISION, identity:{kind:'PLANET',generatorVersionCode:3,
    universeSeed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'},
  bodyStorageKey:`planet-${id}`, lifePresent:level>0, habitat,
  digest:String(id).padStart(64,'0'), groups:VIDA4_GROUPS.slice(0,level),
  nativeCivilizationEcosystemReady:level===8,
} as unknown as Vida4EcologySnapshot);
const planet = (pressure=101325) => ({detail:{
  surface:{hasDefinedSolidSurfaceBase:true},
  atmosphere:{retainedSurfacePressurePascal:pressure,
    retainedGasComposition:[{gas:'NITROGEN',moleFraction01:.8},
      {gas:'OXYGEN',moleFraction01:.03},{gas:'CARBON_DIOXIDE',moleFraction01:.17}],
    retainedMeanMolarMassGramsPerMole:29,retainedReferenceDensityKilogramsPerCubicMeter:1.1,
    longwaveTrappingFraction01:.4,isVacuum:false,isDeepEnvelope:false},
  climate:{meanSurfaceTemperatureKelvin:294,greenhouseSurfaceWarmingKelvin:22},
}} as unknown as PlanetScientificResolvedTarget);

const atmosphereNumbers = (a:ReturnType<typeof Vida5aEcologyAtmosphere.evaluate>['atmosphericFeedback']) => ({
  pressure:a.pressurePascal,gas:a.gasComposition,oxygen:a.oxygenFraction01,
  partial:a.oxygenPartialPressurePascal,density:a.referenceDensityKilogramsPerCubicMeter,
  mass:a.meanMolarMassGramsPerMole,climate:a.meanSurfaceTemperatureKelvin,
  climateDelta:a.climateDeltaKelvin,trapping:a.greenhouseTrappingFraction01,
});

describe('VIDA.5b — maduración sin falsificar la física',()=>{
  it('preserva los microbios y las atmósferas VIDA.5a sin retocar O₂ ni clima',()=>{
    let matured=0,full=0,notMatured=0;
    for(let i=0;i<280;i++){
      const a=Vida5aEcologyAtmosphere.evaluate(eco(i),planet());
      const original=JSON.stringify(a);
      const b=Vida5bEcologicalMaturation.evaluate(a);
      expect(JSON.stringify(a)).toBe(original);
      expect(atmosphereNumbers(b.atmosphericFeedback)).toEqual(atmosphereNumbers(a.atmosphericFeedback));
      expect(b.sourceCouplingDigest).toBe(a.digest);
      expect(b.originalEffectiveGroups).toEqual(a.effectiveGroups);
      expect(b.effectiveGroups).toEqual(VIDA4_GROUPS.slice(0,b.effectiveGroups.length));
      expect(Vida5bEcologicalMaturation.evaluate(a).digest).toBe(b.digest);
      if(b.maturationApplied){
        matured++;expect(a.effectiveGroups.length).toBeGreaterThanOrEqual(5);
        expect(a.effectiveGroups.length).toBeLessThan(8);
        expect(b.effectiveGroups).toEqual(VIDA4_GROUPS);
      } else {notMatured++;expect(b.effectiveGroups).toEqual(a.effectiveGroups);}
      if(b.nativeCivilizationPrerequisitesReady){full++;
        expect(()=>Vida5bEcologicalMaturation.assertNativeCivilizationReady(b)).not.toThrow();}
    }
    expect(matured).toBeGreaterThan(0);
    expect(full).toBeGreaterThan(matured);
    expect(notMatured).toBeGreaterThan(0);
  });
  it('no promueve subsuelo, atmósfera tenue ni fauna sin pO₂ suficiente',()=>{
    for(const [id,habitat,p] of [[2,'SUBSURFACE',101325],[3,'SURFACE_OPEN',1000]] as const){
      const a=Vida5aEcologyAtmosphere.evaluate(eco(id,2,habitat),planet(p));
      const b=Vida5bEcologicalMaturation.evaluate(a);
      expect(b.maturationApplied).toBe(false);
      expect(b.nativeCivilizationPrerequisitesReady).toBe(false);
      expect(()=>Vida5bEcologicalMaturation.assertNativeCivilizationReady(b)).toThrow();
    }
  });
  it('fija porcentajes futuros sin crear civilizaciones',()=>{
    expect(VIDA7_FUTURE_INTELLIGENCE_RATE).toBe(.30);
    expect(VIDA7_FUTURE_CIVILIZATION_RATE).toBe(.65);
    expect(VIDA7_FUTURE_CIVILIZATION_LEVEL_RATES).toEqual({PRIMITIVE:.65,ADVANCED:.30,ULTRA_ADVANCED:.05});
    const b=Vida5bEcologicalMaturation.evaluate(Vida5aEcologyAtmosphere.evaluate(eco(5),planet()));
    expect(b).not.toHaveProperty('civilizationPresent');
    expect(b).not.toHaveProperty('intelligencePresent');
  });
});
