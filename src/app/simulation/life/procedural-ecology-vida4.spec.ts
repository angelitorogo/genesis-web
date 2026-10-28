import { describe, expect, it } from 'vitest';
import { ProceduralEcologyVIDA4 as Ecology, VIDA4_GROUPS } from './procedural-ecology-vida4';
import { ProceduralMicrobialLifeVIDA3 as Microbes } from './procedural-microbial-life-vida3';
import type { Vida3MicrobialSnapshot } from '../../domain/life/procedural-microbial-vida3';
import { VIDA3_MODEL_REVISION } from '../../domain/life/procedural-microbial-vida3';
import { VIDA4_MODEL_REVISION, VIDA4A_ADVANCED_THRESHOLDS,
  VIDA4A_FUTURE_INTELLIGENCE_RATE_TARGET, VIDA4A_FUTURE_CIVILIZATION_RATE_TARGET
} from '../../domain/life/procedural-ecology-vida4';
const id = {universeSeed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',generatorVersionCode:3,
 kind:'PLANET' as const,galaxyIndex:'0',sectorKey:'12',galacticObjectIndex:'0',bodyIndex:'0',moonIndex:null};
const source = (bodyIndex:number, habitat: Vida3MicrobialSnapshot['habitat'], present=true): Vida3MicrobialSnapshot => ({
 revision:VIDA3_MODEL_REVISION,identity:{...id,kind:habitat==='SURFACE_PROTECTED_SEEP'?'MOON':'PLANET',
   moonIndex:habitat==='SURFACE_PROTECTED_SEEP'?'0':null,bodyIndex:String(bodyIndex)},
 bodyStorageKey:`body:${bodyIndex}`,plausibility:'PLAUSIBLE',selectedRoute:habitat==='SUBSURFACE'?'SUBSURFACE':'SURFACE',
 habitat,lifePresent:present,biology:present?'MICROBIAL':'NONE',biosphereId:present?'vida3:original':null,digest:'d'.repeat(64),
});
describe('VIDA.4 ecology',()=>{
 it('does not modify microbial source, is deterministic and preserves the original biosphere',()=>{
   const m=source(4,'SURFACE_OPEN'),before=JSON.stringify(m);
   const a=Ecology.evaluate(m);
   expect(Ecology.evaluate(m)).toEqual(a);
   expect(JSON.stringify(m)).toBe(before);
   expect(a.biosphereId).toBe(m.biosphereId);
   expect(a.microbialDigest).toBe(m.digest);
   expect(a.nativeCivilizationPresent).toBe(false);
   expect(a.atmosphericFeedbackPending).toBe(a.groups.includes('PLANTS_TREES'));
 });
 it('has no life if its parent microbe is not present',()=>{
   const a=Ecology.evaluate(source(5,'SURFACE_OPEN',false));
   expect(a.groups).toEqual([]);expect(a.complexLifePresent).toBe(false);
 });
 it('all generated groups form the exact prefix and never skip predecessors',()=>{
   for(let i=0;i<1024;i++){
     const a=Ecology.evaluate(source(i,'SURFACE_OPEN'));
     expect(a.groups).toEqual(VIDA4_GROUPS.slice(0,a.groups.length));
     expect(a.maximumGroup).toBe(a.groups.at(-1)??null);
   }
 });
 it('30% is an independent stable roll with no quotas',()=>{
   const xs=Array.from({length:4096},(_,i)=>Ecology.evaluate(source(i,'SURFACE_OPEN')));
   const count=xs.filter(x=>x.complexRollSelected).length;
   expect(count).toBeGreaterThan(1100);expect(count).toBeLessThan(1350);
   expect(xs.every(x=>x.groups.length>=1)).toBe(true);
 });
 it('subsurface never generates plants, insects, reptiles or higher groups',()=>{
   const xs=Array.from({length:256},(_,i)=>Ecology.evaluate(source(i,'SUBSURFACE')));
   expect(xs.some(x=>x.complexLifePresent)).toBe(true);
   expect(xs.every(x=>x.groups.length<=2 && !x.nativeCivilizationEcosystemReady)).toBe(true);
 });
 it('protected lunar seep remains microbial-only even on successful complexity draw',()=>{
   const xs=Array.from({length:256},(_,i)=>Ecology.evaluate(source(i,'SURFACE_PROTECTED_SEEP')));
   expect(xs.some(x=>x.complexRollSelected)).toBe(true);
   expect(xs.every(x=>x.groups.length===1 && !x.complexLifePresent)).toBe(true);
 });
 it('native civilization requires all eight groups and never generated in VIDA.4',()=>{
   const xs=Array.from({length:4096},(_,i)=>Ecology.evaluate(source(i,'SURFACE_OPEN')));
   const full=xs.find(x=>x.nativeCivilizationEcosystemReady);
   expect(full).toBeDefined();
   expect(full!.groups).toEqual(VIDA4_GROUPS);
   expect(()=>Ecology.assertNativeCivilizationPrerequisites(full!)).not.toThrow();
   const partial=xs.find(x=>x.groups.length<8)!;
   expect(()=>Ecology.assertNativeCivilizationPrerequisites(partial)).toThrow('complete open-surface ecosystem');
   expect(xs.every(x=>x.nativeCivilizationPresent===false)).toBe(true);
 });
 it('revision protection rejects parent snapshots from old versions',()=>{
   const old={...source(1,'SURFACE_OPEN'),revision:'VIDA.3/microbial/v2-subsurface'};
   expect(()=>Ecology.evaluate(old as Vida3MicrobialSnapshot)).toThrow('VIDA.3b');
 });
 it('the two determinations use disjoint hash namespaces',()=>{
   const a=Microbes.bodyStorageKey(id);
   expect(a).not.toContain('VIDA.4');
 });
 it('VIDA.4a records an immutable new revision, without generating future civilizations',()=>{
   const a=Ecology.evaluate(source(42,'SURFACE_OPEN'));
   expect(a.revision).toBe('VIDA.4/ecology/v2-advanced-calibration');
   expect(VIDA4_MODEL_REVISION).toBe(a.revision);
   expect(a.nativeCivilizationPresent).toBe(false);
   expect(VIDA4A_FUTURE_INTELLIGENCE_RATE_TARGET).toBe(0.20);
   expect(VIDA4A_FUTURE_CIVILIZATION_RATE_TARGET).toBe(0.60);
 });
 it('VIDA.4a advanced thresholds are ordered and preserve low-level V1 boundaries',()=>{
   expect(VIDA4A_ADVANCED_THRESHOLDS).toHaveLength(6);
   expect(VIDA4A_ADVANCED_THRESHOLDS[0]).toBe(0.08);
   expect(VIDA4A_ADVANCED_THRESHOLDS[1]).toBe(0.22);
   expect(VIDA4A_ADVANCED_THRESHOLDS.at(-1)).toBe(0.67);
   for(let i=1;i<VIDA4A_ADVANCED_THRESHOLDS.length;i++){
     expect(VIDA4A_ADVANCED_THRESHOLDS[i]).toBeGreaterThan(VIDA4A_ADVANCED_THRESHOLDS[i-1]);
   }
 });
 it('VIDA.4a increases advanced completeness without changing eligibility or habitat limits',()=>{
   const xs=Array.from({length:4096},(_,i)=>Ecology.evaluate(source(i,'SURFACE_OPEN')));
   const complex=xs.filter(x=>x.complexLifePresent);
   const full=complex.filter(x=>x.nativeCivilizationEcosystemReady);
   expect(complex.length).toBeGreaterThan(1100);
   expect(complex.length).toBeLessThan(1350);
   expect(full.length/complex.length).toBeGreaterThan(0.28);
   expect(full.length/complex.length).toBeLessThan(0.38);
   expect(full.every(x=>x.groups.length===8 && x.habitat==='SURFACE_OPEN')).toBe(true);
   const subsurface=Array.from({length:1024},(_,i)=>Ecology.evaluate(source(i,'SUBSURFACE')));
   expect(subsurface.every(x=>x.groups.length<=2 && !x.nativeCivilizationEcosystemReady)).toBe(true);
 });

});
