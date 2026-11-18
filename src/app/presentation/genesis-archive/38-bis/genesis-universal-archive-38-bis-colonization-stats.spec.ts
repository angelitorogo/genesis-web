import {createArchiveTestStore38Bis} from './genesis-universal-archive-test-db-38bis';
import {describe,it,expect} from 'vitest';
import type {Vida8OriginRef} from '../../../domain/life/vida8-technological-colonization';
import type {Vida9BiologyRecord} from '../../../domain/life/vida9-biology-exploration';
import type {
  UniversalArchiveRow38Bis,UniversalArchiveSection38Bis,
  UniversalArchiveVerifiedFounder38Bis,
} from './genesis-universal-archive-38-bis.model';
import {verifiedColonySource38Bis} from './genesis-universal-archive-38-bis.index';
import {summarizeArchiveColonies38Bis,combineArchiveColonies38Bis} from './genesis-universal-archive-38-bis-colonization-stats';
import {GenesisUniversalArchiveStore38Bis} from './genesis-universal-archive-38-bis.store';

const scope='certified-universe';
const a:UniversalArchiveVerifiedFounder38Bis={id:'1:2:3:5:PLANET:-',galaxyIndex:'1',
  name:'Especie Alfa · Mundo A',tier:'ADVANCED',route:['/system','1','2','3','planet','5']};
const b:UniversalArchiveVerifiedFounder38Bis={id:'1:2:4:7:PLANET:-',galaxyIndex:'1',
  name:'Especie Beta · Mundo B',tier:'VERY_ADVANCED',route:['/system','1','2','4','planet','7']};
const c:UniversalArchiveVerifiedFounder38Bis={id:'2:3:4:1:PLANET:-',galaxyIndex:'2',
  name:'Especie Gamma · Mundo C',tier:'ADVANCED',route:['/system','2','3','4','planet','1']};
function colony(id:string,galaxyIndex:string,tier:'ADVANCED'|'VERY_ADVANCED',
  founder?:UniversalArchiveVerifiedFounder38Bis):UniversalArchiveRow38Bis {
  return {id,scope,category:'colonies',galaxyIndex,subtype:'MOON',sortTitle:id,
    title:'Colonia '+id,subtitle:'VIDA.8',cells:{tier},
    colonyOriginTier:tier,...(founder?{colonyFounder:founder}:{}),
    actions:[{label:'Abrir ficha del cuerpo',route:['/system',galaxyIndex,'2','3','planet','2','moon','1']},
      ...(founder?[{label:'Ver mundo natal',route:founder.route}]:[])]};
}
function section(galaxyIndex:string,rows:readonly UniversalArchiveRow38Bis[]):UniversalArchiveSection38Bis {
  return {scope,category:'colonies',galaxyIndex,sourceRevision:'founder-stats-v1',
    indexedAtEpochMs:0,count:rows.length,knowledgeComplete:false,
    colonizationStatistics:summarizeArchiveColonies38Bis(rows)};
}

const sourceIdentity={universeSeed:'seed',generatorVersionCode:3,kind:'PLANET' as const,
  galaxyIndex:'1',sectorKey:'2',galacticObjectIndex:'3',bodyIndex:'5',moonIndex:null};
const targetIdentity={...sourceIdentity,kind:'MOON' as const,bodyIndex:'8',moonIndex:'1'};
const origin:Vida8OriginRef={civilizationDigest:'vida7-digest',sourceEcosystemDigest:'eco-digest',
  sourceBodyStorageKey:'1:2:3:5:PLANET:-',sourceIdentity,founderSpeciesId:'species-a',
  lineage:'HUMANOID',tier:'ADVANCED'};
const source={identity:sourceIdentity,bodyStorageKey:origin.sourceBodyStorageKey,
  nativeCivilizationPresent:true,ecosystem:{digest:origin.sourceEcosystemDigest,
    species:[{id:origin.founderSpeciesId}]},
  intelligence:{digest:origin.civilizationDigest,civilizationPresent:true,
    civilization:{founderSpeciesId:origin.founderSpeciesId,tier:origin.tier,lineage:origin.lineage}},
} as unknown as Vida9BiologyRecord;
const target={identity:targetIdentity,bodyStorageKey:'1:2:3:8:MOON:1'} as Vida9BiologyRecord;
const confirmed=new Set(['1/2/3']);

describe('38.bis · estadísticas coloniales y procedencia científica CT-0',()=>{
  it('agrupa varias colonias por una única civilización fundadora',()=>{
    const rows=[colony('1','1','ADVANCED',a),colony('2','1','ADVANCED',a),
      colony('3','1','VERY_ADVANCED',b)];
    const stats=summarizeArchiveColonies38Bis(rows);
    expect(stats).toMatchObject({colonies:3,advancedColonies:2,veryAdvancedColonies:1,
      verifiedColonizers:2,unattributedColonies:0});
    expect(stats.largestColonizer?.founder.id).toBe(a.id);
    expect(stats.largestColonizer?.colonyCount).toBe(2);
  });
  it('una fuente no verificable no aumenta el número de civilizaciones colonizadoras',()=>{
    const stats=summarizeArchiveColonies38Bis([colony('1','1','ADVANCED'),
      colony('2','1','VERY_ADVANCED',b)]);
    expect(stats.verifiedColonizers).toBe(1);
    expect(stats.unattributedColonies).toBe(1);
    expect(stats.advancedColonies).toBe(1);
    expect(stats.veryAdvancedColonies).toBe(1);
  });
  it('rechaza recuentos de colonias derivadas de otra categoría o niveles inexistentes',()=>{
    expect(()=>summarizeArchiveColonies38Bis([{...colony('1','1','ADVANCED'),
      category:'colonized-moons'}])).toThrow();
    expect(()=>summarizeArchiveColonies38Bis([{...colony('1','1','ADVANCED'),
      colonyOriginTier:undefined}])).toThrow();
  });
  it('combina galaxias sin mezclar sus fundadoras ni duplicar la más extensa',()=>{
    const s1=section('1',[colony('a','1','ADVANCED',a),colony('b','1','ADVANCED',a)]);
    const s2=section('2',[colony('c','2','ADVANCED',c)]);
    const stats=combineArchiveColonies38Bis([s1,s2]);
    expect(stats?.verifiedColonizers).toBe(2);
    expect(stats?.colonies).toBe(3);
    expect(stats?.largestColonizer?.founder.id).toBe(a.id);
    expect(combineArchiveColonies38Bis([{...s1,colonizationStatistics:undefined}])).toBeNull();
  });
  it('certifica una fuente solamente si el mundo natal, sistema y digests coinciden',()=>{
    expect(verifiedColonySource38Bis(origin,target,source,confirmed)).toBe(true);
    expect(verifiedColonySource38Bis(origin,target,source,new Set())).toBe(false);
    expect(verifiedColonySource38Bis(origin,target,null,confirmed)).toBe(false);
    expect(verifiedColonySource38Bis({...origin,civilizationDigest:'alterado'},target,source,confirmed)).toBe(false);
    expect(verifiedColonySource38Bis({...origin,founderSpeciesId:'otro'},target,source,confirmed)).toBe(false);
    expect(verifiedColonySource38Bis({...origin,tier:'VERY_ADVANCED'},target,source,confirmed)).toBe(false);
    const foreignTarget={...target,identity:{...targetIdentity,galaxyIndex:'7'}};
    expect(verifiedColonySource38Bis(origin,foreignTarget,source,confirmed)).toBe(false);
  });
  it('los enlaces y estadísticas se conservan en IndexedDB tras cierre y reapertura',async()=>{
    const name='genesis-colony-stats-38bis-'+Date.now()+'-'+Math.random();
    let store=createArchiveTestStore38Bis(name);
    try{
      const rows=[colony('a','1','ADVANCED',a),colony('b','1','VERY_ADVANCED',b)];
      await store.publish(section('1',rows),rows);
      store.close();
      store=createArchiveTestStore38Bis(name);
      const saved=await store.sectionsFor(scope);
      expect(saved[0]?.colonizationStatistics?.verifiedColonizers).toBe(2);
      const page=await store.page({scope,category:'colonies',galaxyIndex:null,
        subtype:null,search:'',descending:false,page:1,pageSize:25});
      expect(page.total).toBe(2);
      expect(page.items[0]?.actions.some(action=>action.label==='Ver mundo natal')).toBe(true);
    } finally {store.close();await store.delete();}
  });
});
