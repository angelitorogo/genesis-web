/** 38.bis · Pure read-model statistics from authorized, already indexed colonies. */
import type {
  UniversalArchiveRow38Bis,UniversalArchiveColonizationStatistics38Bis,
  UniversalArchiveSection38Bis,UniversalArchiveVerifiedFounder38Bis,
  ArchiveColonyOriginIssue38Bis,UniversalArchiveCivilizationTierCounts38Bis,
} from './genesis-universal-archive-38-bis.model';

export function summarizeArchiveColonies38Bis(rows:readonly UniversalArchiveRow38Bis[]):UniversalArchiveColonizationStatistics38Bis {
  let advanced=0,veryAdvanced=0,unattributed=0,historicallyReconciled=0;
  let vida6Only=0,vida7Only=0,both=0;
  const founders=new Map<string,{founder:UniversalArchiveVerifiedFounder38Bis;colonyCount:number}>();
  const reasons=new Map<ArchiveColonyOriginIssue38Bis,number>();
  for(const row of rows){
    if(row.category!=='colonies')throw Error('38.bis: estadísticas solo sobre colonias individuales');
    if(row.colonyOriginTier==='ADVANCED')advanced++;
    else if(row.colonyOriginTier==='VERY_ADVANCED')veryAdvanced++;
    else throw Error('38.bis: nivel colonial desconocido');
    if(row.colonyDigestDrift==='VIDA6_ONLY')vida6Only++;
    else if(row.colonyDigestDrift==='VIDA7_ONLY')vida7Only++;
    else if(row.colonyDigestDrift==='BOTH')both++;
    if(row.historicalOriginReconciled){
      if(!row.colonyFounder)throw Error('38.bis: reconciliación histórica sin fundadora');
      historicallyReconciled++;
    }
    const founder=row.colonyFounder;
    if(!founder){
      unattributed++;
      const reason=row.colonyOriginIssue??'NOT_DIAGNOSED';
      reasons.set(reason,(reasons.get(reason)??0)+1);
      continue;
    }
    // Galaxy and immutable source identity are part of the key. One founding
    // civilization colonizing several worlds must count only once.
    const key=founder.galaxyIndex+'|'+founder.id;
    const old=founders.get(key);
    if(old){
      if(old.founder.tier!==founder.tier || old.founder.name!==founder.name ||
        old.founder.route.join('/')!==founder.route.join('/'))
        throw Error('38.bis: conflicto de identidad colonizadora');
      old.colonyCount++;
    } else founders.set(key,{founder,colonyCount:1});
  }
  let largest:UniversalArchiveColonizationStatistics38Bis['largestColonizer']=null;
  for(const entry of founders.values()){
    if(!largest || entry.colonyCount>largest.colonyCount ||
        (entry.colonyCount===largest.colonyCount &&
          (entry.founder.galaxyIndex+'|'+entry.founder.id)<(largest.founder.galaxyIndex+'|'+largest.founder.id)))
      largest={founder:entry.founder,colonyCount:entry.colonyCount};
  }
  return Object.freeze({colonies:rows.length,advancedColonies:advanced,
    veryAdvancedColonies:veryAdvanced,verifiedColonizers:founders.size,
    unattributedColonies:unattributed,
    historicallyReconciledColonies:historicallyReconciled,
    digestDriftCounts:Object.freeze({vida6Only,vida7Only,both}),
    originDiagnostics:[...reasons.entries()].sort(([a],[b])=>a.localeCompare(b))
      .map(([reason,count])=>Object.freeze({reason,count})),
    largestColonizer:largest});
}

/** VIDA.8 only colonizes inside the source system, hence a founder belongs to
 * exactly one galactic fragment. Summaries can be merged without scanning all
 * indexed rows or double-counting a cross-galaxy founder. */
export function combineArchiveColonies38Bis(
  sections:readonly UniversalArchiveSection38Bis[],
):UniversalArchiveColonizationStatistics38Bis | null {
  if(sections.length===0)return null;
  const stats=sections.map(s=>s.colonizationStatistics);
  if(stats.some(s=>!s))return null; // A prior index revision must be refreshed.
  let largest:UniversalArchiveColonizationStatistics38Bis['largestColonizer']=null;
  let colonies=0,advancedColonies=0,veryAdvancedColonies=0,verifiedColonizers=0,unattributedColonies=0;
  let historicallyReconciled=0,vida6Only=0,vida7Only=0,both=0;
  const reasons=new Map<ArchiveColonyOriginIssue38Bis,number>();
  for(const value of stats){
    const s=value!;
    colonies+=s.colonies;advancedColonies+=s.advancedColonies;
    veryAdvancedColonies+=s.veryAdvancedColonies;
    verifiedColonizers+=s.verifiedColonizers;
    unattributedColonies+=s.unattributedColonies;
    historicallyReconciled+=s.historicallyReconciledColonies??0;
    vida6Only+=s.digestDriftCounts?.vida6Only??0;
    vida7Only+=s.digestDriftCounts?.vida7Only??0;
    both+=s.digestDriftCounts?.both??0;
    let diagnosed=0;
    for(const item of s.originDiagnostics??[]){
      reasons.set(item.reason,(reasons.get(item.reason)??0)+item.count);
      diagnosed+=item.count;
    }
    // Previously persisted cache records must never claim fully diagnosed data.
    if(diagnosed<s.unattributedColonies)
      reasons.set('NOT_DIAGNOSED',(reasons.get('NOT_DIAGNOSED')??0)+s.unattributedColonies-diagnosed);
    const candidate=s.largestColonizer;
    if(candidate && (!largest || candidate.colonyCount>largest.colonyCount ||
      (candidate.colonyCount===largest.colonyCount &&
        (candidate.founder.galaxyIndex+'|'+candidate.founder.id)<(largest.founder.galaxyIndex+'|'+largest.founder.id))))
      largest=candidate;
  }
  return Object.freeze({colonies,advancedColonies,veryAdvancedColonies,
    verifiedColonizers,unattributedColonies,
    historicallyReconciledColonies:historicallyReconciled,
    digestDriftCounts:Object.freeze({vida6Only,vida7Only,both}),
    originDiagnostics:[...reasons.entries()].sort(([a],[b])=>a.localeCompare(b))
      .map(([reason,count])=>Object.freeze({reason,count})),largestColonizer:largest});
}

/** Verify why the UI shows 0 tier-covered galaxies without confusing a pending
 * asynchronous index with the genuine absence of scientific tier metadata. */
export function diagnoseArchiveCivilizationCoverage38Bis(
  galaxies:readonly string[], sections:readonly UniversalArchiveSection38Bis[],
  verified:ReadonlySet<string>,
):Readonly<{
  indexed:number;pendingIndexing:number;pendingVerification:number;
  missingTierCounts:number;counts:UniversalArchiveCivilizationTierCounts38Bis;
}> {
  const byGalaxy=new Map(sections.filter(s=>s.category==='civilizations')
    .map(s=>[s.galaxyIndex,s] as const));
  let indexed=0,pendingIndexing=0,pendingVerification=0,missingTierCounts=0;
  let primitive=0,advanced=0,veryAdvanced=0;
  for(const galaxy of galaxies){
    const section=byGalaxy.get(galaxy);
    if(!section){pendingIndexing++;continue;}
    if(!verified.has('civilizations|'+galaxy)){pendingVerification++;continue;}
    const counts=section.civilizationTierCounts;
    if(!counts){missingTierCounts++;continue;}
    indexed++;primitive+=counts.primitive;
    advanced+=counts.advanced;veryAdvanced+=counts.veryAdvanced;
  }
  return Object.freeze({indexed,pendingIndexing,pendingVerification,missingTierCounts,
    counts:Object.freeze({primitive,advanced,veryAdvanced})});
}
