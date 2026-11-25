import {describe,it,expect} from 'vitest';
import {archiveCompactFields38BisB1} from './genesis-universal-archive-list-layout-38-bis-b1';
import type {UniversalArchiveRow38Bis} from './genesis-universal-archive-38-bis.model';
const entry=(category:'colonies'|'colonized-planets'|'colonized-moons',value:string)=>({
  id:'colony',scope:'scope',galaxyIndex:'1',category,subtype:'ALL',title:'Colonia',
  sortTitle:'colonia',subtitle:'',cells:{population:value},actions:[],sortNumbers:{population:65076},
}) as UniversalArchiveRow38Bis;

describe('38.bis-T7c · visualización limpia del Archivo con IndexedDB antiguo',()=>{
  for(const category of ['colonies','colonized-planets','colonized-moons'] as const){
    it(`${category} oculta el sufijo antiguo sin modificar la fila ni el criterio de ordenación`,()=>{
      const row=entry(category,'5.152–125.000 hab. (intervalo estimado)');
      const before=JSON.stringify(row);
      const value=archiveCompactFields38BisB1(row,'Galaxia 1').find(f=>f.key==='population')?.value;
      expect(value).toBe('5.152–125.000');
      expect(JSON.stringify(row)).toBe(before);
      expect(row.sortNumbers?.['population']).toBe(65076);
    });
    it(`${category} conserva el valor T7c nuevo y No evaluable`,()=>{
      for(const value of ['12–150','No evaluable']){
        expect(archiveCompactFields38BisB1(entry(category,value),'Galaxia 1')
          .find(f=>f.key==='population')?.value).toBe(value);
      }
    });
  }
});
