import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import type { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import type { PlanetarySystem } from '../../domain/planetary/planetary-system';
import { TransNeptunianObjectDynamicalRegime as R, type TransNeptunianObjectDynamicalRegime as Regime } from '../../domain/planetary/trans-neptunian-object-dynamical-regime';
import { TransNeptunianObjectIdentity } from '../../domain/planetary/trans-neptunian-object-identity';
import { TransNeptunianObjectProperties } from '../../domain/planetary/trans-neptunian-object-properties';
import { RelevantTransNeptunianObject } from '../../domain/planetary/relevant-trans-neptunian-object';
import { TransNeptunianObjectSystem } from '../../domain/planetary/trans-neptunian-object-system';
const IDD=utf8ToBytes('GENESIS-RELEVANT-TNO-ID-V1'), PD=utf8ToBytes('GENESIS-TNO-PROPERTIES-V1'), RD=utf8ToBytes('GENESIS-TNO-RESERVOIR-V1');
const MAX=8;
export class TransNeptunianObjectGenerator {
  private constructor(){}
  static generate(generationKey:UniverseGenerationKey, ps:PlanetarySystem):TransNeptunianObjectSystem {
    if(generationKey.generatorVersion!==GeneratorVersion.V1) throw new RangeError(`Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`);
    if(!generationKey.equals(ps.generationKey)) throw new RangeError('TNO generator requires the host PlanetarySystem to share the supplied UniverseGenerationKey.');
    const dust=ps.formationBlueprint.residualDustMassEarth; if(dust===0) return new TransNeptunianObjectSystem(ps,0,0,[]);
    const support=reservoir(ps); const presence=sampleSystem(ps,'PRESENCE'); if(presence>=0.15+0.75*support) return new TransNeptunianObjectSystem(ps,dust,support,[]);
    const count=Math.max(1,Math.min(MAX,1+Math.floor((MAX-1)*support)));
    const list:RelevantTransNeptunianObject[]=[]; for(let n=1;n<=count;n++) list.push(make(ps,n));
    return new TransNeptunianObjectSystem(ps,dust,support,list);
  }
}
function reservoir(ps:PlanetarySystem):number { const b=ps.formationBlueprint; const dust=clamp01(Math.log1p(b.residualDustMassEarth)/Math.log(11)); const span=clamp01(Math.log(Math.max(1,b.sourceOuterRadiusAu/b.sourceInnerRadiusAu))/Math.log(1000)); const outer=ps.orbits.length?Math.max(...ps.orbits.map(o=>o.semiMajorAxisAu)):b.sourceInnerRadiusAu; const room=clamp01((b.sourceOuterRadiusAu-outer)/Math.max(b.sourceOuterRadiusAu,1)); return clamp01(.48*dust+.27*span+.15*room+.10*sampleSystem(ps,'RESERVOIR')); }
function make(ps:PlanetarySystem,n:number):RelevantTransNeptunianObject { const id=identity(ps,n); const hasPlanet=ps.orbits.length>0; const regime=regimeFor(id.proceduralId,hasPlanet); const p=properties(ps,id.proceduralId,n,regime); return new RelevantTransNeptunianObject(id,p); }
function regimeFor(id:string,hasPlanet:boolean):Regime { let u=sample(id,'REGIME'); if(!hasPlanet){ if(u<.38)return R.COLD_CLASSICAL;if(u<.68)return R.HOT_CLASSICAL;if(u<.90)return R.SCATTERED;return R.DETACHED;} if(u<.28)return R.COLD_CLASSICAL;if(u<.50)return R.HOT_CLASSICAL;if(u<.70)return R.RESONANT;if(u<.91)return R.SCATTERED;return R.DETACHED; }
function properties(ps:PlanetarySystem,id:string,n:number,r:Regime):TransNeptunianObjectProperties { const b=ps.formationBlueprint; const outer=ps.orbits.length?Math.max(...ps.orbits.map(o=>o.semiMajorAxisAu)):Math.max(b.sourceInnerRadiusAu,0.1); const classicalInner=Math.max(outer*1.12,b.sourceOuterRadiusAu*.55); let a:number,e:number,i:number;
  if(r===R.COLD_CLASSICAL){a=lerp(classicalInner,Math.max(classicalInner*1.15,b.sourceOuterRadiusAu),sample(id,'A'));e=lerp(.01,.12,sample(id,'E'));i=lerp(0,8,sample(id,'I'));}
  else if(r===R.HOT_CLASSICAL){a=lerp(classicalInner,Math.max(classicalInner*1.25,b.sourceOuterRadiusAu*1.08),sample(id,'A'));e=lerp(.08,.32,sample(id,'E'));i=lerp(5,38,sample(id,'I'));}
  else if(r===R.RESONANT){const ratios=[[3,2],[2,1],[5,2]] as const; const q=ratios[Math.min(2,Math.floor(sample(id,'RES')*3))]; a=outer*(q[0]/q[1])**(2/3); a=Math.max(a,outer*1.08);e=lerp(.05,.36,sample(id,'E'));i=lerp(1,32,sample(id,'I'));}
  else if(r===R.SCATTERED){a=logRange(Math.max(classicalInner,b.sourceOuterRadiusAu*.8),Math.max(classicalInner*2,b.sourceOuterRadiusAu*18),sample(id,'A')); const q=lerp(outer*1.02,Math.max(outer*1.18,Math.min(classicalInner,a*.45)),sample(id,'Q')); e=clamp(1-q/a,.18,.94);i=lerp(8,65,sample(id,'I'));}
  else {a=logRange(Math.max(classicalInner*1.4,b.sourceOuterRadiusAu),Math.max(classicalInner*3,b.sourceOuterRadiusAu*30),sample(id,'A')); const q=lerp(Math.max(outer*1.4,classicalInner*.95),Math.min(a*.65,Math.max(classicalInner*1.5,b.sourceOuterRadiusAu*1.4)),sample(id,'Q')); e=clamp(1-q/a,.12,.96);i=lerp(5,55,sample(id,'I'));}
  const mass=hostMass(ps); const period=Math.sqrt(a**3/mass); const ice=clamp(.52+.38*sample(id,'ICE'),.45,.94); const diameter=Math.max(80,lerp(120,2200,sample(id,'D'))*n**-.28); const density=clamp((ice*.93+(1-ice)*2.7)*(1-.18*sample(id,'P')),0.65,2.3); const albedo=clamp(.04+.55*sample(id,'ALB'),.03,.75);
  return new TransNeptunianObjectProperties(n,r,diameter,ice,1-ice,albedo,density,mass,a,e,i,360*sample(id,'N'),360*sample(id,'W'),360*sample(id,'M'),period);
}
function hostMass(ps:PlanetarySystem):number { const c=ps.orbitalPeriodLayout.gravitatingMassSolar; if(c!==null&&Number.isFinite(c)&&c>0)return c; const m=ps.formationBlueprint.centralMassSolar; if(!Number.isFinite(m)||m<=0)throw new RangeError('TNO orbits require positive host mass.'); return m; }
function identity(ps:PlanetarySystem,n:number){const d=sha256.create().update(IDD).update(hexToBytes(ps.seed.normalizedValue)).update(u32(n-1)).digest();return new TransNeptunianObjectIdentity(ps.locator,ps.seed,n,bytesToHex(d.slice(0,16)).toUpperCase());}
function sampleSystem(ps:PlanetarySystem,l:string){const d=sha256.create().update(RD).update(hexToBytes(ps.seed.normalizedValue)).update(utf8ToBytes(l)).digest();return frac(d);} function sample(id:string,l:string){const d=sha256.create().update(PD).update(hexToBytes(id)).update(utf8ToBytes(l)).digest();return frac(d);} function frac(d:Uint8Array){return (d[0]*0x1000000+d[1]*0x10000+d[2]*0x100+d[3])/0x100000000;} function u32(v:number){return new Uint8Array([(v>>>24)&255,(v>>>16)&255,(v>>>8)&255,v&255]);} function clamp01(v:number){return clamp(v,0,1);} function clamp(v:number,a:number,b:number){return Math.min(b,Math.max(a,v));} function lerp(a:number,b:number,u:number){return a+(b-a)*u;} function logRange(a:number,b:number,u:number){return Math.exp(Math.log(a)+(Math.log(b)-Math.log(a))*u);}
