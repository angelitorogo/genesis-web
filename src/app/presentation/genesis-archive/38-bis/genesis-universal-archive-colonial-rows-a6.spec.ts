import {describe,expect,it} from 'vitest';
import type {Vida9BiologyRecord} from '../../../domain/life/vida9-biology-exploration';
import type {Vida8Colony} from '../../../domain/life/vida8-technological-colonization';
import {projectColonyRow} from './genesis-universal-archive-38-bis.index';
import type {UniversalArchiveVerifiedFounder38Bis} from './genesis-universal-archive-38-bis.model';

const founder:UniversalArchiveVerifiedFounder38Bis={
  id:'origen-natal',galaxyIndex:'1',tier:'ADVANCED',name:'Ismera on7 · Xephus A-3',
  speciesName:'Ismera on7',planetName:'Xephus A-3',
  route:['/system','1','20','3','planet','2'],
};
const target={bodyStorageKey:'1:20:3:10:MOON:0',identity:{kind:'MOON',
  galaxyIndex:'1',sectorKey:'20',galacticObjectIndex:'3',bodyIndex:'10',moonIndex:'0'}} as unknown as Vida9BiologyRecord;
function colony(id:string):Vida8Colony {
  return {id,origin:{tier:'ADVANCED'},settlement:{id:'codigo-interno-que-no-se-muestra',
    habitatTechnology:'SUBSURFACE_VAULT',function:'RESEARCH'}} as unknown as Vida8Colony;
}

describe('38.bis-a6 · filas coloniales indexadas con procedencia pública',()=>{
  const c1=colony('1');
  const c2=colony('2');
  it('la colonia individual muestra especie, planeta natal y enlace, nunca el ID técnico del asentamiento',()=>{
    const row=projectColonyRow('s','colonies','1',target,'Aaras A-11 I','Aaras',[c1],c1,founder);
    expect(row.title).toBe('Aaras A-11 I · Colonia 1');
    expect(row.title).not.toContain('codigo-interno');
    expect(row.cells['species']).toBe('Ismera on7');
    expect(row.cells['originPlanet']).toBe('Xephus A-3');
    expect(row.actions.some(action=>action.label==='Ver mundo natal')).toBe(true);
    expect(row.subtitle).toBe('Colonia tecnológica');
  });
  it('la luna colonizada agrupada conserva la misma procedencia verificable',()=>{
    const row=projectColonyRow('s','colonized-moons','1',target,'Aaras A-11 I','Aaras',[c1],undefined,founder);
    expect(row.cells['species']).toBe('Ismera on7');
    expect(row.cells['originPlanet']).toBe('Xephus A-3');
    expect(row.actions.some(action=>action.label==='Ver mundo natal')).toBe(true);
    expect(row.subtitle).toBe('1 colonia verificada');
  });
  it('conserva el nombre público del planeta anfitrión de una luna colonizada',()=>{
    const row=projectColonyRow('s','colonized-moons','1',target,
      'Aaras A-11 I','Aaras',[c1],undefined,founder,undefined,false,undefined,'Aaras A-11');
    expect(row.cells['planet']).toBe('Aaras A-11');
  });
  it('las filas de planetas colonizados tienen la misma representación de la fundadora',()=>{
    const planet={...target,identity:{...target.identity,kind:'PLANET',moonIndex:null}} as unknown as Vida9BiologyRecord;
    const row=projectColonyRow('s','colonized-planets','1',planet,'Aaras A-11','Aaras',[c1],undefined,founder);
    expect(row.cells['originPlanet']).toBe('Xephus A-3');
    expect(row.actions.some(action=>action.label==='Ver mundo natal')).toBe(true);
  });
  it('no atribuye arbitrariamente una procedencia a varias colonias sin verificación completa',()=>{
    const row=projectColonyRow('s','colonized-moons','1',target,'Aaras A-11 I','Aaras',[c1,c2]);
    expect(row.cells['species']).toBeUndefined();
    expect(row.cells['originPlanet']).toBeUndefined();
    expect(row.actions.some(action=>action.label==='Ver mundo natal')).toBe(false);
    expect(row.subtitle).toBe('2 colonias verificadas');
  });
});
