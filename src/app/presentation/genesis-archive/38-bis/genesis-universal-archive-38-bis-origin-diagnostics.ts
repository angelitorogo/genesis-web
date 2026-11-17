/** 38.bis · Diagnostic codes for already authorized destination colonies.
 * Pure, deterministic, fail-closed: never loads or reveals a private source. */
import type {Vida8OriginRef} from '../../../domain/life/vida8-technological-colonization';
import type {Vida9BiologyRecord} from '../../../domain/life/vida9-biology-exploration';
import type {ArchiveColonyOriginIssue38Bis} from './genesis-universal-archive-38-bis.model';

export function diagnoseColonyOrigin38Bis(origin:Vida8OriginRef,
  target:Vida9BiologyRecord,source:Vida9BiologyRecord|null,
  confirmed:ReadonlySet<string>,options:Readonly<{
    sourceReadFailed?:boolean;publicNameAvailable?:boolean
  }>={}):ArchiveColonyOriginIssue38Bis | 'VERIFIED' {
  if(!origin?.sourceIdentity || !origin.sourceBodyStorageKey ||
    !origin.civilizationDigest || !origin.sourceEcosystemDigest || !origin.founderSpeciesId)
    return 'ORIGIN_REFERENCE_INCOMPLETE';
  const a=origin.sourceIdentity,d=target.identity;
  const sourceSystem=[a.galaxyIndex,a.sectorKey,a.galacticObjectIndex].join('/');
  const targetSystem=[d.galaxyIndex,d.sectorKey,d.galacticObjectIndex].join('/');
  if(!confirmed.has(sourceSystem)||!confirmed.has(targetSystem)||sourceSystem!==targetSystem ||
    a.kind!=='PLANET'||a.moonIndex!==null||a.universeSeed!==d.universeSeed||
    a.generatorVersionCode!==3||a.generatorVersionCode!==d.generatorVersionCode)
    return 'ORIGIN_OUTSIDE_CONFIRMED_SYSTEM';
  if(options.sourceReadFailed)return 'SOURCE_RECORD_INVALID';
  if(!source)return 'SOURCE_RECORD_UNAVAILABLE';
  if(!source.identity || !source.ecosystem || !source.intelligence ||
    !Array.isArray(source.ecosystem.species))return 'SOURCE_RECORD_INVALID';
  const b=source.identity;
  if(a.universeSeed!==b.universeSeed || a.generatorVersionCode!==b.generatorVersionCode ||
    a.kind!==b.kind || a.galaxyIndex!==b.galaxyIndex || a.sectorKey!==b.sectorKey ||
    a.galacticObjectIndex!==b.galacticObjectIndex || a.bodyIndex!==b.bodyIndex ||
    a.moonIndex!==b.moonIndex || source.bodyStorageKey!==origin.sourceBodyStorageKey ||
    source.bodyStorageKey===target.bodyStorageKey)
    return 'SOURCE_IDENTITY_MISMATCH';
  if(source.ecosystem.digest!==origin.sourceEcosystemDigest ||
    source.intelligence.digest!==origin.civilizationDigest)
    return 'SOURCE_DIGEST_MISMATCH';
  const civ=source.intelligence.civilization;
  if(source.nativeCivilizationPresent!==true ||
    source.intelligence.civilizationPresent!==true || !civ ||
    civ.founderSpeciesId!==origin.founderSpeciesId || civ.tier!==origin.tier ||
    civ.lineage!==origin.lineage ||
    !source.ecosystem.species.some(species=>species.id===origin.founderSpeciesId))
    return 'SOURCE_CIVILIZATION_MISMATCH';
  if(options.publicNameAvailable===false)return 'PUBLIC_DESIGNATION_UNAVAILABLE';
  return 'VERIFIED';
}

