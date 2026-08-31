import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import type { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { InterstellarObjectCompositionRegime as C, type InterstellarObjectCompositionRegime as Composition } from '../../domain/planetary/interstellar-object-composition-regime';
import { InterstellarObjectIdentity } from '../../domain/planetary/interstellar-object-identity';
import { InterstellarObjectProperties } from '../../domain/planetary/interstellar-object-properties';
import { InterstellarObjectSystem } from '../../domain/planetary/interstellar-object-system';
import { InterstellarObjectTrajectory } from '../../domain/planetary/interstellar-object-trajectory';
import type { PlanetarySystem } from '../../domain/planetary/planetary-system';
import { RelevantInterstellarObject } from '../../domain/planetary/relevant-interstellar-object';
const ID_DOMAIN=utf8ToBytes('GENESIS-RELEVANT-INTERSTELLAR-ID-V1');
const PROPERTY_DOMAIN=utf8ToBytes('GENESIS-INTERSTELLAR-PROPERTIES-V1');
const ENCOUNTER_DOMAIN=utf8ToBytes('GENESIS-INTERSTELLAR-ENCOUNTER-V1');
const AU_PER_YEAR_TO_KM_PER_SECOND=4.740470463533349;
const MU_SOLAR_AU3_PER_YEAR2=4*Math.PI*Math.PI;
export class InterstellarObjectGenerator {
  private constructor(){}
  static generate(generationKey:UniverseGenerationKey, planetarySystem:PlanetarySystem):InterstellarObjectSystem {
    if(generationKey.generatorVersion!==GeneratorVersion.V1) throw new RangeError(`Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`);
    if(!generationKey.equals(planetarySystem.generationKey)) throw new RangeError('InterstellarObjectGenerator requires the encounter PlanetarySystem to share the supplied UniverseGenerationKey.');
    const support=encounterSupportV1(planetarySystem);
    const probability=.003+.012*support;
    if(sampleSystem(planetarySystem,'PRESENCE')>=probability) return new InterstellarObjectSystem(planetarySystem,support,probability,[]);
    return new InterstellarObjectSystem(planetarySystem,support,probability,[materializeV1(planetarySystem,1)]);
  }
}
function encounterSupportV1(ps:PlanetarySystem):number { const mass=hostMassV1(ps); const massSupport=clamp01(Math.log1p(mass)/Math.log(4)); const b=ps.formationBlueprint; const ratio=Math.max(1,b.sourceOuterRadiusAu/Math.max(b.sourceInnerRadiusAu,1e-6)); const spanSupport=clamp01(Math.log10(ratio)/3); return clamp01(.45*massSupport+.25*spanSupport+.30*sampleSystem(ps,'SUPPORT')); }
function materializeV1(ps:PlanetarySystem,n:number):RelevantInterstellarObject { const id=identityV1(ps,n); const composition=compositionV1(id.proceduralId); const props=propertiesV1(id.proceduralId,n,composition); const trajectory=trajectoryV1(ps,id.proceduralId); return new RelevantInterstellarObject(id,props,trajectory); }
function identityV1(ps:PlanetarySystem,n:number):InterstellarObjectIdentity { const d=sha256.create().update(ID_DOMAIN).update(hexToBytes(ps.seed.normalizedValue)).update(u32(n-1)).digest(); return new InterstellarObjectIdentity(ps.locator,ps.seed,n,bytesToHex(d.slice(0,16)).toUpperCase()); }
function compositionV1(id:string):Composition { const u=sampleObject(id,'COMPOSITION'); return u<.36?C.ROCK_DOMINATED:u<.72?C.MIXED:C.VOLATILE_RICH; }
function propertiesV1(id:string,n:number,c:Composition):InterstellarObjectProperties { const diameter=logRange(.08,12,sampleObject(id,'DIAMETER')); const volatile=c===C.ROCK_DOMINATED?lerp(.01,.20,sampleObject(id,'VOLATILE')):c===C.MIXED?lerp(.20,.58,sampleObject(id,'VOLATILE')):lerp(.58,.92,sampleObject(id,'VOLATILE')); const porosity=lerp(.05,.68,sampleObject(id,'POROSITY')); const baseDensity=(1-volatile)*3.15+volatile*.88; const density=clamp(baseDensity*(1-.52*porosity),.38,3.4); const albedo=clamp(.02+.25*sampleObject(id,'ALBEDO'),.02,.30); const elongation=1+7*sampleObject(id,'ELONGATION')**2; return new InterstellarObjectProperties(n,c,diameter,1-volatile,volatile,porosity,density,albedo,elongation); }
function trajectoryV1(ps:PlanetarySystem,id:string):InterstellarObjectTrajectory { const mass=hostMassV1(ps); const vInf=logRange(5,80,sampleObject(id,'VINF')); const b=ps.formationBlueprint; const maxQ=Math.max(.3,Math.min(30,b.sourceOuterRadiusAu*.8)); const q=logRange(.05,maxQ,sampleObject(id,'PERIAPSIS')); const vAuYr=vInf/AU_PER_YEAR_TO_KM_PER_SECOND; const absA=MU_SOLAR_AU3_PER_YEAR2*mass/(vAuYr*vAuYr); const e=1+q/absA; const inclination=Math.acos(1-2*sampleObject(id,'INCLINATION'))*180/Math.PI; return new InterstellarObjectTrajectory(mass,vInf,q,e,-absA,inclination,360*sampleObject(id,'NODE'),360*sampleObject(id,'ARGUMENT')); }
function hostMassV1(ps:PlanetarySystem):number { const m=ps.orbitalPeriodLayout.gravitatingMassSolar??ps.formationBlueprint.centralMassSolar; if(!Number.isFinite(m)||m<=0) throw new RangeError('Interstellar flybys require a positive gravitating host mass.'); return m; }
function sampleSystem(ps:PlanetarySystem,label:string):number { const d=sha256.create().update(ENCOUNTER_DOMAIN).update(hexToBytes(ps.seed.normalizedValue)).update(utf8ToBytes(label)).digest(); return fraction(d); }
function sampleObject(id:string,label:string):number { const d=sha256.create().update(PROPERTY_DOMAIN).update(hexToBytes(id)).update(utf8ToBytes(label)).digest(); return fraction(d); }
function fraction(d:Uint8Array):number{return (d[0]*0x1000000+d[1]*0x10000+d[2]*0x100+d[3])/0x100000000;} function u32(v:number){return new Uint8Array([(v>>>24)&255,(v>>>16)&255,(v>>>8)&255,v&255]);} function clamp01(v:number){return clamp(v,0,1);} function clamp(v:number,a:number,b:number){return Math.min(b,Math.max(a,v));} function lerp(a:number,b:number,u:number){return a+(b-a)*u;} function logRange(a:number,b:number,u:number){return Math.exp(Math.log(a)+(Math.log(b)-Math.log(a))*u);}
