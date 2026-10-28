import { describe, expect, it } from 'vitest';
import { Vida5aEcologyAtmosphere } from './vida5a-ecology-atmosphere';
import { VIDA4_GROUPS, VIDA4_MODEL_REVISION, type Vida4EcologySnapshot } from '../../domain/life/procedural-ecology-vida4';
import type { PlanetScientificResolvedTarget } from '../planetary/planet-scientific-target-resolver';

const makeEcology = (id: number, level: number, habitat: Vida4EcologySnapshot['habitat'] = 'SURFACE_OPEN') => ({
  revision: VIDA4_MODEL_REVISION, identity: {kind: 'PLANET', generatorVersionCode:3,
    universeSeed: '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'},
  bodyStorageKey:`V3-planet-${id}`, lifePresent:level>0, habitat,
  digest:String(id).padStart(64,'0'),groups:VIDA4_GROUPS.slice(0,level),
  maximumGroup:level ? VIDA4_GROUPS[level-1]:null,
  complexRollSelected:level>=2, nativeCivilizationEcosystemReady:level===8,
} as unknown as Vida4EcologySnapshot);
const makeTarget = (p = 101325,t=294) => ({detail:{
  surface:{hasDefinedSolidSurfaceBase:true},
  atmosphere:{retainedSurfacePressurePascal:p,
    retainedGasComposition:[{gas:'NITROGEN',moleFraction01:.80},
      {gas:'OXYGEN',moleFraction01:.03},{gas:'CARBON_DIOXIDE',moleFraction01:.17}],
    isVacuum:false,isDeepEnvelope:false,retainedMeanMolarMassGramsPerMole:29,
    retainedReferenceDensityKilogramsPerCubicMeter:1.1,longwaveTrappingFraction01:.4,
  },climate:{meanSurfaceTemperatureKelvin:t,greenhouseSurfaceWarmingKelvin:22},
}} as unknown as PlanetScientificResolvedTarget);

describe('VIDA.5a — acoplamiento sin falsificar atmósferas', () => {
  it('conserva microbios y ecología histórica inmutables',()=>{
    const eco=makeEcology(1,8); const before=JSON.stringify(eco);
    const a=Vida5aEcologyAtmosphere.evaluate(eco,makeTarget());
    expect(JSON.stringify(eco)).toBe(before);
    expect(a.originalEcologyGroups).toEqual(VIDA4_GROUPS);
    expect(a.originalEcologyDigest).toBe(eco.digest);
    expect(Vida5aEcologyAtmosphere.evaluate(eco,makeTarget()).digest).toBe(a.digest);
  });
  it('no permite árboles ni civilizaciones en mundos sin presupuesto atmosférico',()=>{
    for (const p of [800,2400,1_000_000]) {
      const a=Vida5aEcologyAtmosphere.evaluate(makeEcology(10+p,8),makeTarget(p));
      expect(a.effectiveGroups.length).toBeLessThanOrEqual(2);
      expect(a.nativeCivilizationPrerequisitesReady).toBe(false);
      expect(a.atmosphericFeedback.status).not.toBe('APPLIED');
    }
  });
  it('cambia la probabilidad ecológica condicional sin asignar cuotas',()=>{
    const values = [Vida5aEcologyAtmosphere.evaluate(makeEcology(4,1),makeTarget()),
      Vida5aEcologyAtmosphere.evaluate(makeEcology(5,1),makeTarget(1000))];
    expect(values[0].conditionalComplexProbability).toBe(.80);
    expect(values[1].conditionalComplexProbability).toBe(.20);
  });
  it('sin vida inicial no aparece biosfera ni O2 biológico',()=>{
    const a=Vida5aEcologyAtmosphere.evaluate(makeEcology(9,0,null),makeTarget());
    expect(a.effectiveGroups).toEqual([]);
    expect(a.atmosphericFeedback.status).toBe('NO_PHOTOSYNTHETIC_VEGETATION');
    expect(a.nativeCivilizationPrerequisitesReady).toBe(false);
  });
  it('sin superficie abierta no inventa bosques',()=>{
    const a=Vida5aEcologyAtmosphere.evaluate(makeEcology(3,2,'SUBSURFACE'),makeTarget());
    expect(a.effectiveGroups).toEqual(['MICROORGANISMS','FUNGI']);
    expect(a.nativeCivilizationPrerequisitesReady).toBe(false);
  });
  it('los ecosistemas realmente avanzados satisfacen 16% y 16 kPa',()=>{
    let stable=0,complete=0;
    for(let i=0;i<150;i++) {
      const a=Vida5aEcologyAtmosphere.evaluate(makeEcology(i,1),makeTarget());
      if(a.effectiveGroups.includes('PLANTS_TREES')) {
        stable++;
        expect(a.atmosphericFeedback.status).toBe('APPLIED');
        expect(a.atmosphericFeedback.oxygenFraction01).toBeGreaterThanOrEqual(.12);
      }
      if(a.effectiveGroups.includes('REPTILES')) {
        expect(a.atmosphericFeedback.oxygenFraction01).toBeGreaterThanOrEqual(.16);
        expect(a.atmosphericFeedback.oxygenPartialPressurePascal).toBeGreaterThanOrEqual(16000);
      }
      if(a.nativeCivilizationPrerequisitesReady) {
        complete++;
        expect(a.effectiveGroups).toEqual(VIDA4_GROUPS);
        expect(()=>Vida5aEcologyAtmosphere.assertNativeCivilizationReady(a)).not.toThrow();
      }
    }
    expect(stable).toBeGreaterThan(30);
    expect(complete).toBeGreaterThan(0);
  });
  it('los sumideros químicos están acotados y excluyen atmósferas de azufre extremo',()=>{
    const light=makeTarget();
    (light.detail.atmosphere as {retainedGasComposition:unknown}).retainedGasComposition=[
      {gas:'NITROGEN',moleFraction01:.75},{gas:'OXYGEN',moleFraction01:.03},
      {gas:'CARBON_DIOXIDE',moleFraction01:.17},{gas:'SULFUR_DIOXIDE',moleFraction01:.03},
      {gas:'CARBON_MONOXIDE',moleFraction01:.02}];
    const candidate=Array.from({length:100},(_,i)=>
      Vida5aEcologyAtmosphere.evaluate(makeEcology(i,1),light))
      .find(x=>x.effectiveGroups.includes('PLANTS_TREES'));
    expect(candidate).toBeDefined();
    expect(candidate!.reactiveGasBurialFraction01).toBeGreaterThan(0);
    expect(candidate!.atmosphericFeedback.gasComposition.reduce((n,x)=>n+x.moleFraction01,0))
      .toBeCloseTo(1,10);
    const toxic=makeTarget();
    (toxic.detail.atmosphere as {retainedGasComposition:unknown}).retainedGasComposition=[
      {gas:'NITROGEN',moleFraction01:.28},{gas:'OXYGEN',moleFraction01:.03},
      {gas:'CARBON_DIOXIDE',moleFraction01:.19},{gas:'SULFUR_DIOXIDE',moleFraction01:.5}];
    expect(Vida5aEcologyAtmosphere.evaluate(makeEcology(4,8),toxic)
      .nativeCivilizationPrerequisitesReady).toBe(false);
  });
});
