/** 38.bis-a3 — read-only scientific reconciliation of historical VIDA.8 origin refs.
 * No persisted VIDA.9 record is changed, no unknown system is unlocked and
 * a digest mismatch alone never grants a link to a founding world.
 */
import {sha256} from '@noble/hashes/sha2.js';
import {bytesToHex,utf8ToBytes} from '@noble/hashes/utils.js';
import {VIDA6_REVISION} from '../../../domain/life/vida6-ecosystems-species';
import {VIDA7_REVISION} from '../../../domain/life/vida7-intelligence-civilizations';
import {VIDA8_NAMESPACE,type Vida8Colony,type Vida8OriginRef} from '../../../domain/life/vida8-technological-colonization';
import type {Vida9BiologyRecord} from '../../../domain/life/vida9-biology-exploration';
import type {Vida8CivilizationSource} from '../../../simulation/life/vida8-technological-colonization';
import type {ArchiveColonyOriginIssue38Bis,ArchiveColonyDigestDrift38Bis} from './genesis-universal-archive-38-bis.model';
import {diagnoseColonyOrigin38Bis} from './genesis-universal-archive-38-bis-origin-diagnostics';

export type ArchiveOriginReconciliation38Bis = Readonly<{
  status:'EXACT'|'HISTORICALLY_RECONCILED'|'UNRESOLVED';
  drift:ArchiveColonyDigestDrift38Bis;
  issue?:ArchiveColonyOriginIssue38Bis;
}>;

export function colonyDigestDrift38Bis(origin:Vida8OriginRef,source:Vida9BiologyRecord|null):ArchiveColonyDigestDrift38Bis {
  if(!source?.ecosystem||!source.intelligence)return 'NOT_COMPARABLE';
  const e=source.ecosystem.digest!==origin.sourceEcosystemDigest;
  const c=source.intelligence.digest!==origin.civilizationDigest;
  return e&&c?'BOTH':e?'VIDA6_ONLY':c?'VIDA7_ONLY':'NONE';
}

const hash=(value:string)=>bytesToHex(sha256(utf8ToBytes(value)));
const identity=(v:Vida8OriginRef['sourceIdentity'])=>
  [v.universeSeed,v.generatorVersionCode,v.kind,v.galaxyIndex,v.sectorKey,
    v.galacticObjectIndex,v.bodyIndex,v.moonIndex??'-'].join('|');

/** Replay must come from the PRODUCING VIDA.8 source resolver (not an arbitrary
 * client-supplied snapshot). It is used only when the persisted natal record
 * is independently valid and belongs to the same confirmed system.
 */
export function reconcileColonyOrigin38Bis(origin:Vida8OriginRef,
  target:Vida9BiologyRecord,source:Vida9BiologyRecord|null,
  confirmed:ReadonlySet<string>,colony:Vida8Colony,
  replay:Vida8CivilizationSource|null,options:Readonly<{sourceReadFailed?:boolean}>={}
):ArchiveOriginReconciliation38Bis {
  const issue=diagnoseColonyOrigin38Bis(origin,target,source,confirmed,options);
  const drift=colonyDigestDrift38Bis(origin,source);
  if(issue==='VERIFIED')return Object.freeze({status:'EXACT',drift:'NONE'});
  if(issue!=='SOURCE_DIGEST_MISMATCH')return Object.freeze({status:'UNRESOLVED',drift,issue});
  // Never bypass a mismatch of the persisted source identity, civilization,
  // confirmed-system boundary, native species or technological eligibility.
  const native=source?.intelligence?.civilization;
  if(!source||source.nativeCivilizationPresent!==true||
      source.intelligence.civilizationPresent!==true||
      source.intelligence.ecosystemDigest!==source.ecosystem.digest||!native||
      native.founderSpeciesId!==origin.founderSpeciesId||
      native.tier!==origin.tier||native.lineage!==origin.lineage||
      !source.ecosystem.species.some(s=>s.id===origin.founderSpeciesId)||
      !(origin.tier==='ADVANCED' ?
        native.technology?.includes('INDUSTRIAL_PRODUCTION')&&native.technology?.includes('SCIENTIFIC_INSTRUMENTS'):
        native.technology?.includes('ORBITAL_CAPABILITY')))
    return Object.freeze({status:'UNRESOLVED',drift,issue:'HISTORICAL_FOUNDER_MISMATCH'});
  if(!replay)return Object.freeze({status:'UNRESOLVED',drift,issue:'HISTORICAL_SOURCE_UNAVAILABLE'});
  const e=replay.ecosystem,c=replay.civilization,civ=c?.civilization;
  if(!e||!c||e.revision!==VIDA6_REVISION||c.revision!==VIDA7_REVISION||
      e.bodyStorageKey!==origin.sourceBodyStorageKey||c.bodyStorageKey!==e.bodyStorageKey||
      identity(e.identity)!==identity(origin.sourceIdentity)||
      identity(c.identity)!==identity(origin.sourceIdentity)||
      c.ecosystemDigest!==e.digest||!c.civilizationPresent||!c.intelligencePresent||
      !civ||civ.founderSpeciesId!==origin.founderSpeciesId||
      civ.tier!==origin.tier||civ.lineage!==origin.lineage||
      !e.species.some(s=>s.id===origin.founderSpeciesId)||
      !(origin.tier==='ADVANCED' ?
        civ.technology?.includes('INDUSTRIAL_PRODUCTION')&&civ.technology?.includes('SCIENTIFIC_INSTRUMENTS'):
        civ.technology?.includes('ORBITAL_CAPABILITY')))
    return Object.freeze({status:'UNRESOLVED',drift,issue:'HISTORICAL_FOUNDER_MISMATCH'});
  // Both stored origin digests must be reproduced exactly by the historical
  // producer. A plausible species name or a matching tier is NOT enough.
  const currentFounder=source.ecosystem.species.find(sp=>sp.id===origin.founderSpeciesId);
  const historicalFounder=e.species.find(sp=>sp.id===origin.founderSpeciesId);
  if(!currentFounder||!historicalFounder||currentFounder.group!==historicalFounder.group||
      source.intelligence.intelligentSpecies?.speciesId!==origin.founderSpeciesId||
      c.intelligentSpecies?.speciesId!==origin.founderSpeciesId)
    return Object.freeze({status:'UNRESOLVED',drift,issue:'HISTORICAL_FOUNDER_MISMATCH'});
  if(e.digest!==origin.sourceEcosystemDigest||c.digest!==origin.civilizationDigest)
    return Object.freeze({status:'UNRESOLVED',drift,issue:'HISTORICAL_DIGEST_UNREPRODUCIBLE'});
  // Independent deterministic identifiers tie this colony AND its settlement
  // to the historical source civilization and the destination body.
  const key=[VIDA8_NAMESPACE,target.identity.universeSeed,e.bodyStorageKey,
    c.digest,target.bodyStorageKey].join('|');
  if(colony.provenance!=='TECHNOLOGICAL_COLONIZATION'||
      colony.id!=='vida8-colony-'+hash(key).slice(0,24)||
      colony.settlement?.id!=='vida8-settlement-'+hash(key+'|settlement').slice(0,20))
    return Object.freeze({status:'UNRESOLVED',drift,issue:'HISTORICAL_COLONY_SIGNATURE_MISMATCH'});
  return Object.freeze({status:'HISTORICALLY_RECONCILED',drift});
}
