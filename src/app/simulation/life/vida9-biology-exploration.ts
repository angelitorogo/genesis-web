import { VIDA9_REVISION, VIDA9_REVEAL_POLICY, vida9DigestForRecord,
  type Vida9BiologyRecord } from '../../domain/life/vida9-biology-exploration';
import type { Vida6EcosystemSnapshot } from '../../domain/life/vida6-ecosystems-species';
import type { Vida7IntelligenceCivilizationSnapshot } from '../../domain/life/vida7-intelligence-civilizations';
import type { Vida8ColonizationSnapshot } from '../../domain/life/vida8-technological-colonization';

function sameIdentity(a:Vida6EcosystemSnapshot,b:Vida7IntelligenceCivilizationSnapshot,
  c:Vida8ColonizationSnapshot):boolean {
  const canonical=(i:Vida6EcosystemSnapshot['identity'])=>[i.universeSeed,i.generatorVersionCode,
    i.kind,i.galaxyIndex,i.sectorKey,i.galacticObjectIndex,i.bodyIndex,i.moonIndex].join('|');
  return canonical(a.identity)===canonical(b.identity) && canonical(a.identity)===canonical(c.identity) &&
    a.bodyStorageKey===b.bodyStorageKey && a.bodyStorageKey===c.bodyStorageKey;
}
export class Vida9BiologyExploration {
  private constructor(){}
  static evaluate(ecosystem:Vida6EcosystemSnapshot,
    intelligence:Vida7IntelligenceCivilizationSnapshot,
    colonization:Vida8ColonizationSnapshot):Vida9BiologyRecord {
    if (!sameIdentity(ecosystem,intelligence,colonization) ||
        ecosystem.identity.generatorVersionCode!==3 ||
        intelligence.ecosystemDigest!==ecosystem.digest ||
        colonization.ecosystemDigest!==ecosystem.digest ||
        colonization.nativeCivilizationDigest!==intelligence.digest ||
        ecosystem.biospherePresent!==colonization.nativeLifePresent ||
        intelligence.intelligencePresent!==colonization.nativeIntelligencePresent ||
        intelligence.civilizationPresent!==colonization.nativeCivilizationPresent ||
        colonization.colonialPopulationPresent!==(colonization.colonies.length>0))
      throw Error('VIDA.9: biological chain does not match the same native body');
    const data:Omit<Vida9BiologyRecord,'digest'>={revision:VIDA9_REVISION,
      identity:ecosystem.identity,bodyStorageKey:ecosystem.bodyStorageKey,
      epoch:'CT-0',epochOffsetYears:0,revealPolicy:VIDA9_REVEAL_POLICY,
      ecosystem,intelligence,colonization,
      nativeLifePresent:ecosystem.biospherePresent,
      nativeIntelligencePresent:intelligence.intelligencePresent,
      nativeCivilizationPresent:intelligence.civilizationPresent,
      introducedLifePresent:colonization.introducedLifePresent,
      colonialPopulationPresent:colonization.colonialPopulationPresent,
      historicalOriginEpochYears:null};
    return Object.freeze({...data,digest:vida9DigestForRecord(data)});
  }
  /** This must be checked at the access boundary; generation alone never reveals. */
  static mayReveal(systemDiscoveryStateCode:number,confirmedCode:number):boolean {
    return Number.isInteger(systemDiscoveryStateCode) &&
      systemDiscoveryStateCode>=confirmedCode;
  }
}
