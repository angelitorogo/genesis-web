/** VIDA.5c — favor life on robust already-plausible V3 planetary surfaces.
 * Two independent deterministic selection rolls, never a quota/census ranking.
 * The previous VIDA.3b and VIDA.5b decisions remain inspectable and untouched.
 */
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import { VIDA4_GROUPS, type Vida4EcologySnapshot } from '../../domain/life/procedural-ecology-vida4';
import type { Vida3MicrobialSnapshot } from '../../domain/life/procedural-microbial-vida3';
import type { Vida5bMaturedBiosphere } from '../../domain/life/vida5b-ecological-maturation';
import type { PlanetScientificResolvedTarget } from '../planetary/planet-scientific-target-resolver';
import { Vida5aEcologyAtmosphere } from './vida5a-ecology-atmosphere';
import { VIDA5C_REVISION, VIDA5C_ROLL_NAMESPACE,
  VIDA5C_FAVORED_MICROBIAL_PROBABILITY, VIDA5C_FAVORED_FULL_ECOSYSTEM_PROBABILITY,
  VIDA7_FUTURE_INTELLIGENCE_RATE_V5C, VIDA7_FUTURE_CIVILIZATION_RATE_V5C,
  VIDA7_FUTURE_TECHNOLOGY_DISTRIBUTION_V5C,
  type Vida5cAdvancedBiosphere } from '../../domain/life/vida5c-advanced-biospheres';
const hash=(s:string)=>bytesToHex(sha256(utf8ToBytes(s)));
export class Vida5cAdvancedBiospheres {
  private constructor() {}
  private static roll(seed:string,key:string,phase:string):number {
    const h=sha256(utf8ToBytes([VIDA5C_ROLL_NAMESPACE,seed,key,phase].join('|')));
    return (h[0]*0x1000000+h[1]*0x10000+h[2]*0x100+h[3])/0x100000000;
  }
  /** A read-only preview for VIDA.7, not an actual generated civilization.
   * Selection is independent per eligible body. Only the distribution of
   * technological tiers is stratified across the resulting preview pool.
   * Nothing here enforces a minimum civilization count per galaxy.
   */
  static forecastCivilizations(snapshots:readonly Vida5cAdvancedBiosphere[]): {
    readonly candidates: readonly { readonly bodyStorageKey:string;
      readonly tier:'PRIMITIVE'|'ADVANCED'|'ULTRA_ADVANCED' }[];
    readonly intelligenceSelected:number;
    readonly civilizationSelected:number;
  } {
    const ids=new Set<string>();
    const selected:string[]=[];
    let intelligent=0;
    let seed:string|null=null;
    let galaxyIndex:string|null=null;
    for(const snap of snapshots){
      if(snap.revision!==VIDA5C_REVISION)throw Error('Only VIDA.5c snapshots may be forecast');
      if(seed!==null&&seed!==snap.identity.universeSeed)
        throw Error('Cannot merge universes in a civilization forecast');
      seed=snap.identity.universeSeed;
      if(galaxyIndex!==null&&galaxyIndex!==snap.identity.galaxyIndex)
        throw Error('Cannot merge galaxies in a technological-tier forecast');
      galaxyIndex=snap.identity.galaxyIndex;
      if(ids.has(snap.bodyStorageKey))throw Error('Duplicate bodies in civilization forecast');
      ids.add(snap.bodyStorageKey);
      if(!snap.nativeCivilizationPrerequisitesReady)continue;
      if(this.roll(seed,snap.bodyStorageKey,'INTELLIGENCE')>=VIDA7_FUTURE_INTELLIGENCE_RATE_V5C)continue;
      intelligent++;
      if(this.roll(seed,snap.bodyStorageKey,'CIVILIZATION')<VIDA7_FUTURE_CIVILIZATION_RATE_V5C)
        selected.push(snap.bodyStorageKey);
    }
    const distribution=VIDA7_FUTURE_TECHNOLOGY_DISTRIBUTION_V5C;
    const tiers=['PRIMITIVE','ADVANCED','ULTRA_ADVANCED'] as const;
    const rates=[distribution.PRIMITIVE,distribution.ADVANCED,distribution.ULTRA_ADVANCED];
    const base=rates.map(rate=>Math.floor(rate*selected.length));
    const remainders=rates.map((rate,index)=>rate*selected.length-base[index]);
    let extra=selected.length-base.reduce((total,n)=>total+n,0);
    const priority=[0,1,2].sort((a,b)=>remainders[b]-remainders[a]||a-b);
    for(const index of priority){if(extra<=0)break;base[index]++;extra--;}
    // Stable hash ranking breaks ties without privileging body indices/sectors.
    const ranked=selected.sort((a,b)=>{
      const left=hash([VIDA5C_ROLL_NAMESPACE,seed,a,'TECH_RANK'].join('|'));
      const right=hash([VIDA5C_ROLL_NAMESPACE,seed,b,'TECH_RANK'].join('|'));
      return left.localeCompare(right)||a.localeCompare(b);
    });
    const candidates=ranked.map((bodyStorageKey,index)=>Object.freeze({bodyStorageKey,
      tier:tiers[index<base[0]?0:index<base[0]+base[1]?1:2]}));
    return Object.freeze({candidates:Object.freeze(candidates),
      intelligenceSelected:intelligent,civilizationSelected:selected.length});
  }

  static evaluate(micro:Vida3MicrobialSnapshot, ecology:Vida4EcologySnapshot,
    previous:Vida5bMaturedBiosphere, physical:PlanetScientificResolvedTarget): Vida5cAdvancedBiosphere {
    if (micro.revision!=='VIDA.3/microbial/v3-aquifer-lunar-surface' ||
        ecology.revision!=='VIDA.4/ecology/v2-advanced-calibration' ||
        previous.revision!=='VIDA.5b/ecological-maturation/v1' ||
        micro.identity.kind!=='PLANET' || micro.identity.generatorVersionCode!==3 ||
        micro.bodyStorageKey!==ecology.bodyStorageKey || micro.digest!==ecology.microbialDigest)
      throw Error('VIDA.5c requires coherent V3 / VIDA.3b / VIDA.4a / VIDA.5b inputs');
    const surface= micro.plausibility==='PLAUSIBLE' && micro.habitat==='SURFACE_OPEN';
    const air=surface ? Vida5aEcologyAtmosphere.assessAdvancedPhysicalEligibility(ecology,physical) : null;
    const selectedLife=air!==null && this.roll(micro.identity.universeSeed,micro.bodyStorageKey,'LIFE')<
      VIDA5C_FAVORED_MICROBIAL_PROBABILITY;
    const selectedComplete=selectedLife && this.roll(micro.identity.universeSeed,micro.bodyStorageKey,'COMPLETE')<
      VIDA5C_FAVORED_FULL_ECOSYSTEM_PROBABILITY;
    const promote=selectedComplete && previous.effectiveGroups.length<VIDA4_GROUPS.length;
    const groups=Object.freeze(promote ? [...VIDA4_GROUPS]
      : selectedLife && previous.effectiveGroups.length===0
        ? [...VIDA4_GROUPS.slice(0,1)] : [...previous.effectiveGroups]);
    const ready=groups.length===VIDA4_GROUPS.length &&
      (previous.nativeCivilizationPrerequisitesReady || (selectedComplete && air!==null));
    const feedback=(promote && air!==null) ? air : previous.atmosphericFeedback;
    if (groups.length>0 && groups.some((g: Vida4EcologySnapshot['groups'][number], i: number)=>g!==VIDA4_GROUPS[i]))
      throw Error('VIDA.5c requires cumulative ecological levels');
    if (ready && (feedback.status!=='APPLIED' || (feedback.oxygenFraction01??0)<.16 ||
         (feedback.oxygenPartialPressurePascal??0)<16000))
      throw Error('VIDA.5c native civilization rejected: insufficient aerobic atmosphere');
    const biological=micro.lifePresent || selectedLife;
    return Object.freeze({revision:VIDA5C_REVISION,
      identity:Object.freeze({universeSeed:micro.identity.universeSeed,
        generatorVersionCode:micro.identity.generatorVersionCode,galaxyIndex:micro.identity.galaxyIndex}),
      bodyStorageKey:micro.bodyStorageKey,
      originalMicrobialDigest:micro.digest,originalEcologyDigest:ecology.digest,
      originalMaturationDigest:previous.digest,
      originalMicrobialLifePresent:micro.lifePresent,
      effectiveMicrobialLifePresent:biological,
      newlyEstablishedMicrobialLife:!micro.lifePresent && selectedLife,
      originalEffectiveGroups:Object.freeze([...previous.effectiveGroups]),
      effectiveGroups:groups,promotedFromPhysicalEvidence:promote,
      advancedAtmosphereSuitable:air!==null,atmosphericFeedback:feedback,
      nativeCivilizationPrerequisitesReady:ready,
      futureIntelligenceProbability:VIDA7_FUTURE_INTELLIGENCE_RATE_V5C,
      futureCivilizationConditionalProbability:VIDA7_FUTURE_CIVILIZATION_RATE_V5C,
      digest:hash([VIDA5C_REVISION,micro.digest,ecology.digest,previous.digest,
        selectedLife?'1':'0',selectedComplete?'1':'0',ready?'1':'0',feedback.digest,...groups].join('|'))});
  }
}
