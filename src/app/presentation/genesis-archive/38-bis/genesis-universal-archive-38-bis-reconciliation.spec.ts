import 'fake-indexeddb/auto';
import {describe,expect,it} from 'vitest';
import {sha256} from '@noble/hashes/sha2.js';
import {bytesToHex,utf8ToBytes} from '@noble/hashes/utils.js';
import {VIDA6_REVISION} from '../../../domain/life/vida6-ecosystems-species';
import {VIDA7_REVISION} from '../../../domain/life/vida7-intelligence-civilizations';
import {VIDA8_NAMESPACE,type Vida8Colony,type Vida8OriginRef} from '../../../domain/life/vida8-technological-colonization';
import type {Vida8CivilizationSource} from '../../../simulation/life/vida8-technological-colonization';
import type {Vida9BiologyRecord} from '../../../domain/life/vida9-biology-exploration';
import type {UniversalArchiveRow38Bis,UniversalArchiveSection38Bis} from './genesis-universal-archive-38-bis.model';
import {reconcileColonyOrigin38Bis,colonyDigestDrift38Bis} from './genesis-universal-archive-38-bis-origin-reconciliation';
import {summarizeArchiveColonies38Bis,combineArchiveColonies38Bis} from './genesis-universal-archive-38-bis-colonization-stats';
import {GenesisUniversalArchiveStore38Bis} from './genesis-universal-archive-38-bis.store';

const originalIdentity={universeSeed:'semilla-v3',generatorVersionCode:3,kind:'PLANET' as const,
  galaxyIndex:'2',sectorKey:'-18',galacticObjectIndex:'3',bodyIndex:'5',moonIndex:null};
const targetIdentity={...originalIdentity,kind:'MOON' as const,bodyIndex:'8',moonIndex:'1'};
const originalBody='2:-18:3:5:PLANET:-';
const targetBody='2:-18:3:8:MOON:1';
const origin:Vida8OriginRef={sourceIdentity:originalIdentity,sourceBodyStorageKey:originalBody,
  sourceEcosystemDigest:'E-VIDA6-HISTORICO',civilizationDigest:'C-VIDA7-HISTORICO',
  founderSpeciesId:'vida6-founder',lineage:'HUMANOID',tier:'ADVANCED'};
const source={identity:originalIdentity,bodyStorageKey:originalBody,nativeCivilizationPresent:true,
  ecosystem:{digest:'E-VIDA6-PERSISTIDO',species:[{id:origin.founderSpeciesId,group:'HUMANOIDS'}]},
  intelligence:{digest:'C-VIDA7-PERSISTIDO',ecosystemDigest:'E-VIDA6-PERSISTIDO',intelligencePresent:true,civilizationPresent:true,
    intelligentSpecies:{speciesId:origin.founderSpeciesId},
    civilization:{founderSpeciesId:origin.founderSpeciesId,lineage:'HUMANOID',tier:'ADVANCED',
      technology:['INDUSTRIAL_PRODUCTION','SCIENTIFIC_INSTRUMENTS']}},
} as unknown as Vida9BiologyRecord;
const replay={ecosystem:{revision:VIDA6_REVISION,identity:originalIdentity,
  bodyStorageKey:originalBody,digest:origin.sourceEcosystemDigest,
  species:[{id:origin.founderSpeciesId,group:'HUMANOIDS'}]},
  civilization:{revision:VIDA7_REVISION,identity:originalIdentity,bodyStorageKey:originalBody,
    ecosystemDigest:origin.sourceEcosystemDigest,digest:origin.civilizationDigest,
    civilizationPresent:true,intelligencePresent:true,intelligentSpecies:{speciesId:origin.founderSpeciesId},
    civilization:{founderSpeciesId:origin.founderSpeciesId,lineage:origin.lineage,tier:origin.tier,
      technology:['INDUSTRIAL_PRODUCTION','SCIENTIFIC_INSTRUMENTS']}}} as unknown as Vida8CivilizationSource;
const target={identity:targetIdentity,bodyStorageKey:targetBody} as Vida9BiologyRecord;
const confirmed=new Set(['2/-18/3']);
const hash=(value:string)=>bytesToHex(sha256(utf8ToBytes(value)));
const key=[VIDA8_NAMESPACE,originalIdentity.universeSeed,originalBody,origin.civilizationDigest,targetBody].join('|');
const colony:Vida8Colony={id:'vida8-colony-'+hash(key).slice(0,24),origin,
  settlement:{id:'vida8-settlement-'+hash(key+'|settlement').slice(0,20),
    habitatTechnology:'SEALED_SURFACE',function:'RESEARCH',populationBand:'OUTPOST',
    colonialPopulationRange:[12,150],supportSystems:[]},
  introducedOrganisms:[],terraform:null,provenance:'TECHNOLOGICAL_COLONIZATION'};
const project=(id:string,reconciled:boolean):UniversalArchiveRow38Bis=>({
  id,scope:'reconciled-scope',category:'colonies',galaxyIndex:'2',subtype:'MOON',sortTitle:id,
  title:id,subtitle:'VIDA.8',cells:{origin:reconciled?'Histórico confirmado':'No verificable'},
  colonyOriginTier:'ADVANCED',colonyDigestDrift:'BOTH',
  ...(reconciled?{historicalOriginReconciled:true,colonyFounder:{id:originalBody,galaxyIndex:'2',
    name:'Mundo natal validado',tier:'ADVANCED' as const,
    route:['/system','2','-18','3','planet','5']}}:
    {colonyOriginIssue:'HISTORICAL_DIGEST_UNREPRODUCIBLE' as const}),
  actions:reconciled?[{label:'Ver mundo natal',route:['/system','2','-18','3','planet','5']}]:[],
});
const section=(rows:UniversalArchiveRow38Bis[]):UniversalArchiveSection38Bis=>({
  scope:'reconciled-scope',category:'colonies',galaxyIndex:'2',sourceRevision:'a3-v1',
  indexedAtEpochMs:0,count:rows.length,knowledgeComplete:false,
  colonizationStatistics:summarizeArchiveColonies38Bis(rows),
});

describe('38.bis-a3 — reconciliación histórica no destructiva de VIDA.8',()=>{
  it('distingue cuál de los dos digests difiere',()=>{
    expect(colonyDigestDrift38Bis(origin,source)).toBe('BOTH');
    expect(colonyDigestDrift38Bis(origin,{...source,ecosystem:{...source.ecosystem,
      digest:origin.sourceEcosystemDigest}})).toBe('VIDA7_ONLY');
    expect(colonyDigestDrift38Bis(origin,{...source,intelligence:{...source.intelligence,
      digest:origin.civilizationDigest}})).toBe('VIDA6_ONLY');
  });
  it('conciliación histórica: dos digests, misma fundadora y dos IDs SHA-256 válidos',()=>{
    const sourceBefore=JSON.stringify(source),targetBefore=JSON.stringify(target);
    expect(reconcileColonyOrigin38Bis(origin,target,source,confirmed,colony,replay))
      .toEqual({status:'HISTORICALLY_RECONCILED',drift:'BOTH'});
    expect(JSON.stringify(source)).toBe(sourceBefore);
    expect(JSON.stringify(target)).toBe(targetBefore);
  });
  it('correspondencia exacta previa no precisa reconstrucción del origen',()=>{
    const exact={...source,ecosystem:{...source.ecosystem,digest:origin.sourceEcosystemDigest},
      intelligence:{...source.intelligence,ecosystemDigest:origin.sourceEcosystemDigest,digest:origin.civilizationDigest}};
    expect(reconcileColonyOrigin38Bis(origin,target,exact,confirmed,colony,null).status).toBe('EXACT');
  });
  it('no concilia un sistema no confirmado ni un registro natal ausente',()=>{
    expect(reconcileColonyOrigin38Bis(origin,target,source,new Set(),colony,replay).status)
      .toBe('UNRESOLVED');
    expect(reconcileColonyOrigin38Bis(origin,target,null,confirmed,colony,replay).status)
      .toBe('UNRESOLVED');
  });
  it('no basta la misma especie y nivel sin el testigo de origen',()=>{
    expect(reconcileColonyOrigin38Bis(origin,target,source,confirmed,colony,null))
      .toMatchObject({status:'UNRESOLVED',issue:'HISTORICAL_SOURCE_UNAVAILABLE'});
  });
  it('un solo digest histórico cambiado impide atribuir la colonia',()=>{
    const altered={...replay,ecosystem:{...replay.ecosystem,digest:'HISTORICO-DISTINTO'},
      civilization:{...replay.civilization,ecosystemDigest:'HISTORICO-DISTINTO'}};
    expect(reconcileColonyOrigin38Bis(origin,target,source,confirmed,colony,altered).issue)
      .toBe('HISTORICAL_DIGEST_UNREPRODUCIBLE');
  });
  it('el replay debe mantener especie fundadora, tecnología y morfología',()=>{
    const changed={...source,intelligence:{...source.intelligence,
      civilization:{...source.intelligence.civilization!,tier:'VERY_ADVANCED' as const}}};
    expect(reconcileColonyOrigin38Bis(origin,target,changed,confirmed,colony,replay).status)
      .toBe('UNRESOLVED');
    const changedTaxon={...replay,ecosystem:{...replay.ecosystem,
      species:[{id:origin.founderSpeciesId,group:'REPTILES'}]}} as unknown as Vida8CivilizationSource;
    expect(reconcileColonyOrigin38Bis(origin,target,source,confirmed,colony,changedTaxon).status)
      .toBe('UNRESOLVED');
  });
  it('el registro actual mantiene su cadena VIDA.6/7; la reconstrucción acredita tecnología',()=>{
    const broken={...source,intelligence:{...source.intelligence,ecosystemDigest:'otra-fuente'}};
    expect(reconcileColonyOrigin38Bis(origin,target,broken,confirmed,colony,replay))
      .toMatchObject({status:'UNRESOLVED',issue:'HISTORICAL_FOUNDER_MISMATCH'});
    const withoutTechnology={...replay,civilization:{...replay.civilization,
      civilization:{...replay.civilization.civilization!,technology:[]}}} as Vida8CivilizationSource;
    expect(reconcileColonyOrigin38Bis(origin,target,source,confirmed,colony,withoutTechnology))
      .toMatchObject({status:'UNRESOLVED',issue:'HISTORICAL_FOUNDER_MISMATCH'});
  });
  it('un ID de colonia o asentamiento cambiado bloquea el enlace al mundo natal',()=>{
    expect(reconcileColonyOrigin38Bis(origin,target,source,confirmed,
      {...colony,id:'vida8-colony-incorrecto'},replay))
      .toMatchObject({status:'UNRESOLVED',issue:'HISTORICAL_COLONY_SIGNATURE_MISMATCH'});
    expect(reconcileColonyOrigin38Bis(origin,target,source,confirmed,
      {...colony,settlement:{...colony.settlement,id:'incorrecto'}},replay).status)
      .toBe('UNRESOLVED');
  });
  it('diferencia colonias históricas conciliadas de pendientes y no duplica fundadoras',()=>{
    const rows=[project('a',true),project('b',true),project('c',false)];
    const stats=summarizeArchiveColonies38Bis(rows);
    expect(stats).toMatchObject({colonies:3,historicallyReconciledColonies:2,
      verifiedColonizers:1,unattributedColonies:1,
      digestDriftCounts:{vida6Only:0,vida7Only:0,both:3}});
    expect(stats.originDiagnostics).toEqual([{reason:'HISTORICAL_DIGEST_UNREPRODUCIBLE',count:1}]);
    expect(combineArchiveColonies38Bis([section(rows)])).toMatchObject(stats);
  });
  it('preserva el diagnóstico y la ruta autorizada después de cierre de IndexedDB',async()=>{
    const name='genesis-38bis-a3-'+Date.now()+'-'+Math.random();
    let store=new GenesisUniversalArchiveStore38Bis(name);
    try{
      const rows=[project('a',true),project('b',false)];
      await store.publish(section(rows),rows);
      store.close();store=new GenesisUniversalArchiveStore38Bis(name);
      const sections=await store.sectionsFor('reconciled-scope');
      expect(sections[0]?.colonizationStatistics?.historicallyReconciledColonies).toBe(1);
      const page=await store.page({scope:'reconciled-scope',category:'colonies',galaxyIndex:null,
        subtype:null,search:'',descending:false,page:1,pageSize:25});
      expect(page.items.find(r=>r.id==='a')?.actions.some(a=>a.label==='Ver mundo natal')).toBe(true);
      expect(page.items.find(r=>r.id==='b')?.actions).toHaveLength(0);
    } finally {store.close();await store.delete();}
  });
});
