import { describe, expect, it } from 'vitest';
import { Vida5cAdvancedBiospheres } from './vida5c-advanced-biospheres';
import { Vida5aEcologyAtmosphere } from './vida5a-ecology-atmosphere';
import { Vida5bEcologicalMaturation } from './vida5b-ecological-maturation';
import { ProceduralEcologyVIDA4 } from './procedural-ecology-vida4';
import type { Vida3MicrobialSnapshot } from '../../domain/life/procedural-microbial-vida3';
import type { PlanetScientificResolvedTarget } from '../planetary/planet-scientific-target-resolver';
import { VIDA4_GROUPS } from '../../domain/life/procedural-ecology-vida4';
const seed='7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
const micro=(index:number, living=false) => ({
  revision:'VIDA.3/microbial/v3-aquifer-lunar-surface',
  identity:{universeSeed:seed,generatorVersionCode:3,kind:'PLANET',
    galaxyIndex:'0',sectorKey:'0',galacticObjectIndex:'0',bodyIndex:String(index),moonIndex:null},
  bodyStorageKey:`0:0:0:${index}:PLANET:-`,plausibility:'PLAUSIBLE',
  selectedRoute:'SURFACE',habitat:'SURFACE_OPEN',lifePresent:living,
  biology:living?'MICROBIAL':'NONE',biosphereId:living?`vida3:${index}`:null,
  digest:String(index).padStart(64,'0'),
} as unknown as Vida3MicrobialSnapshot);
const target=(pressure:number) => ({ detail:{
  surface:{hasDefinedSolidSurfaceBase:true}, atmosphere:{retainedSurfacePressurePascal:pressure,
  retainedGasComposition:[{gas:'NITROGEN',moleFraction01:.8},{gas:'OXYGEN',moleFraction01:.03},
    {gas:'CARBON_DIOXIDE',moleFraction01:.17}], retainedMeanMolarMassGramsPerMole:31.1,
  retainedReferenceDensityKilogramsPerCubicMeter:1.1,longwaveTrappingFraction01:.4,
  isVacuum:false,isDeepEnvelope:false}, climate:{meanSurfaceTemperatureKelvin:294,
    equilibriumTemperatureKelvin:272,greenhouseSurfaceWarmingKelvin:22},
}} as unknown as PlanetScientificResolvedTarget);
const scenario=(index:number, pressure:number, living=false) => {
  const m=micro(index,living);const e=ProceduralEcologyVIDA4.evaluate(m);
  const planet=target(pressure);
  const source=Vida5aEcologyAtmosphere.evaluate(e,planet);
  const previous=Vida5bEcologicalMaturation.evaluate(source);
  return {m,e,source,previous, result:Vida5cAdvancedBiospheres.evaluate(m,e,previous,planet)};
};
describe('VIDA.5c — expansión sin falsear mundos',()=>{
  it('favorece los mundos físicamente aptos, conserva el prefijo y el resultado anterior',()=>{
    let eligible=0,promoted=0;
    for(let i=0;i<128;i++){
      const s=scenario(i,101325);eligible+=Number(s.result.advancedAtmosphereSuitable);
      promoted+=Number(s.result.promotedFromPhysicalEvidence);
      expect(s.result.effectiveGroups).toEqual(VIDA4_GROUPS.slice(0,s.result.effectiveGroups.length));
      expect(s.result.effectiveGroups.length).toBeGreaterThanOrEqual(s.previous.effectiveGroups.length);
      expect(s.result.originalMaturationDigest).toBe(s.previous.digest);
      if(s.result.nativeCivilizationPrerequisitesReady){
        expect(s.result.atmosphericFeedback.oxygenFraction01).toBeGreaterThanOrEqual(.16);
        expect(s.result.atmosphericFeedback.oxygenPartialPressurePascal).toBeGreaterThanOrEqual(16000);
      }
    }
    expect(eligible).toBeGreaterThan(50);expect(promoted).toBeGreaterThan(50);
  });
  it('rechaza atmósferas tenues y no introduce especies inteligentes',()=>{
    const s=scenario(999,1200);
    expect(s.result.advancedAtmosphereSuitable).toBe(false);
    expect(s.result.nativeCivilizationPrerequisitesReady).toBe(false);
    expect('civilizationPresent' in s.result).toBe(false);
  });
  it('la previsión de civilizaciones no depende del orden',()=>{
    const values=Array.from({length:64},(_,i)=>scenario(i,101325).result);
    const a=Vida5cAdvancedBiospheres.forecastCivilizations(values);
    const b=Vida5cAdvancedBiospheres.forecastCivilizations([...values].reverse());
    expect(a).toEqual(b);expect(a.civilizationSelected).toBeGreaterThan(0);
  });
});
