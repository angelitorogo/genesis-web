import {describe,expect,it} from 'vitest';
import type {Vida8OriginRef} from '../../../domain/life/vida8-technological-colonization';
import type {Vida9BiologyRecord} from '../../../domain/life/vida9-biology-exploration';
import type {UniversalArchiveRow38Bis,UniversalArchiveSection38Bis} from './genesis-universal-archive-38-bis.model';
import {diagnoseColonyOrigin38Bis} from './genesis-universal-archive-38-bis-origin-diagnostics';
import {summarizeArchiveColonies38Bis,combineArchiveColonies38Bis,
  diagnoseArchiveCivilizationCoverage38Bis} from './genesis-universal-archive-38-bis-colonization-stats';

const identity={universeSeed:'seed',generatorVersionCode:3,kind:'PLANET' as const,
  galaxyIndex:'0',sectorKey:'12',galacticObjectIndex:'8',bodyIndex:'1',moonIndex:null};
const origin:Vida8OriginRef={civilizationDigest:'civilization-digest',sourceEcosystemDigest:'eco-digest',
  sourceBodyStorageKey:'0:12:8:1:PLANET:-',sourceIdentity:identity,
  founderSpeciesId:'founder',lineage:'HUMANOID',tier:'ADVANCED'};
const target={identity:{...identity,kind:'MOON',bodyIndex:'2',moonIndex:'3'},
  bodyStorageKey:'0:12:8:2:MOON:3'} as Vida9BiologyRecord;
const source={identity,bodyStorageKey:origin.sourceBodyStorageKey,
  nativeCivilizationPresent:true,ecosystem:{digest:'eco-digest',species:[{id:'founder'}]},
  intelligence:{digest:'civilization-digest',civilizationPresent:true,
    civilization:{founderSpeciesId:'founder',tier:'ADVANCED',lineage:'HUMANOID'}}} as unknown as Vida9BiologyRecord;
const confirmed=new Set(['0/12/8']);

function colony(id:string,issue?:UniversalArchiveRow38Bis['colonyOriginIssue']):UniversalArchiveRow38Bis {
  return {id,scope:'u',category:'colonies',galaxyIndex:'0',subtype:'MOON',
    sortTitle:id,title:id,subtitle:'VIDA.8',cells:{origin:'No verificable'},
    colonyOriginTier:'ADVANCED',colonyOriginIssue:issue,actions:[]};
}
function section(category:UniversalArchiveSection38Bis['category'],galaxyIndex:string,
  counts?:UniversalArchiveSection38Bis['civilizationTierCounts']):UniversalArchiveSection38Bis {
  return {scope:'u',category,galaxyIndex,sourceRevision:'v',indexedAtEpochMs:0,
    count:0,knowledgeComplete:false,...(counts?{civilizationTierCounts:counts}:{})};
}

describe('38.bis · diagnóstico sin filtración de orígenes coloniales y cobertura',()=>{
  it('certifica origen correcto y mantiene intacto el predicado científico',()=>{
    expect(diagnoseColonyOrigin38Bis(origin,target,source,confirmed)).toBe('VERIFIED');
  });
  it('distingue referencia incompleta de sistema no confirmado',()=>{
    expect(diagnoseColonyOrigin38Bis({...origin,founderSpeciesId:''},target,null,confirmed))
      .toBe('ORIGIN_REFERENCE_INCOMPLETE');
    expect(diagnoseColonyOrigin38Bis(origin,target,source,new Set()))
      .toBe('ORIGIN_OUTSIDE_CONFIRMED_SYSTEM');
  });
  it('clasifica ausencia de registro y error de validación sin leer un nombre privado',()=>{
    expect(diagnoseColonyOrigin38Bis(origin,target,null,confirmed))
      .toBe('SOURCE_RECORD_UNAVAILABLE');
    expect(diagnoseColonyOrigin38Bis(origin,target,null,confirmed,{sourceReadFailed:true}))
      .toBe('SOURCE_RECORD_INVALID');
    expect(diagnoseColonyOrigin38Bis(origin,target,
      {identity:source.identity,bodyStorageKey:source.bodyStorageKey} as Vida9BiologyRecord,confirmed))
      .toBe('SOURCE_RECORD_INVALID');
  });
  it('distingue identidad, digest y civilización fundadora incoherentes',()=>{
    expect(diagnoseColonyOrigin38Bis(origin,target,{...source,bodyStorageKey:'otra'} as Vida9BiologyRecord,confirmed))
      .toBe('SOURCE_IDENTITY_MISMATCH');
    expect(diagnoseColonyOrigin38Bis(origin,target,{...source,ecosystem:{...source.ecosystem,digest:'alterado'}} as Vida9BiologyRecord,confirmed))
      .toBe('SOURCE_DIGEST_MISMATCH');
    expect(diagnoseColonyOrigin38Bis({...origin,tier:'VERY_ADVANCED'},target,source,confirmed))
      .toBe('SOURCE_CIVILIZATION_MISMATCH');
  });
  it('clasifica un problema de designación sin conceder un enlace al origen',()=>{
    expect(diagnoseColonyOrigin38Bis(origin,target,source,confirmed,{publicNameAvailable:false}))
      .toBe('PUBLIC_DESIGNATION_UNAVAILABLE');
  });
  it('cuenta cada colonia una sola vez por motivo y conserva las galaxias separadas',()=>{
    const a=[colony('a','SOURCE_RECORD_UNAVAILABLE'),colony('b','SOURCE_RECORD_UNAVAILABLE'),
      colony('c','PUBLIC_DESIGNATION_UNAVAILABLE')];
    const stat=summarizeArchiveColonies38Bis(a);
    expect(stat.unattributedColonies).toBe(3);
    expect(stat.originDiagnostics).toEqual([
      {reason:'PUBLIC_DESIGNATION_UNAVAILABLE',count:1},
      {reason:'SOURCE_RECORD_UNAVAILABLE',count:2},
    ]);
    const merged=combineArchiveColonies38Bis([
      {...section('colonies','0'),count:3,colonizationStatistics:stat},
      {...section('colonies','1'),count:1,
        colonizationStatistics:summarizeArchiveColonies38Bis([colony('d','SOURCE_DIGEST_MISMATCH')])},
    ]);
    expect(merged?.unattributedColonies).toBe(4);
    expect(merged?.originDiagnostics?.reduce((n,v)=>n+v.count,0)).toBe(4);
  });
  it('identifica una caché antigua sin fingir que se han diagnosticado sus colonias',()=>{
    const value=summarizeArchiveColonies38Bis([colony('sin-causa')]);
    const combined=combineArchiveColonies38Bis([{
      ...section('colonies','0'),count:1,
      colonizationStatistics:{...value,originDiagnostics:undefined},
    }]);
    expect(combined?.originDiagnostics).toEqual([{reason:'NOT_DIAGNOSED',count:1}]);
  });
  it('diferencia galaxias pendientes de indexación de galaxias pendientes de verificación',()=>{
    const status=diagnoseArchiveCivilizationCoverage38Bis(['0','1','2'],[
      section('civilizations','0',{primitive:6,advanced:3,veryAdvanced:1}),
      section('civilizations','1',{primitive:2,advanced:1,veryAdvanced:0}),
    ],new Set(['civilizations|0']));
    expect(status).toMatchObject({indexed:1,pendingIndexing:1,
      pendingVerification:1,missingTierCounts:0,
      counts:{primitive:6,advanced:3,veryAdvanced:1}});
  });
  it('señala índices verificados pero sin desglose por nivel en vez de mostrar cero real',()=>{
    const status=diagnoseArchiveCivilizationCoverage38Bis(['0'],[
      section('civilizations','0'),
    ],new Set(['civilizations|0']));
    expect(status).toMatchObject({indexed:0,pendingIndexing:0,
      pendingVerification:0,missingTierCounts:1});
  });
});
