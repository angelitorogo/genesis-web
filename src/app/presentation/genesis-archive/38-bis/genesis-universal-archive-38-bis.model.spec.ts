import {describe,it,expect} from 'vitest';
import {DiscoveryState} from '../../../domain/discovery/discovery-state';
import {SystemLocator} from '../../../domain/generation/procedural-locator';
import type {Vida9BiologyRecord} from '../../../domain/life/vida9-biology-exploration';
import {VIDA8_REVISION} from '../../../domain/life/vida8-technological-colonization';
import {confirmedSystems38Bis,validatedColonies38Bis,universalArchiveExtremeFamily38Bis} from './genesis-universal-archive-38-bis.index';
import {universalArchiveSearchKey38Bis,universalArchivePage38Bis,
  universalArchiveCategory38Bis,universalArchiveColonizedBodies38Bis,
  universalArchiveCivilizationSubtype38Bis} from './genesis-universal-archive-38-bis.model';

describe('38.bis — contratos de conocimiento global, búsqueda y colonización',()=>{
  it('normaliza designaciones con tildes y evita categorías inventadas',()=>{
    expect(universalArchiveSearchKey38Bis('  ÉLIXÍSIS   A-3  ')).toBe('elixisis a-3');
    expect(universalArchiveCategory38Bis('colonized-moons')).toBe('colonized-moons');
    expect(universalArchiveCategory38Bis('ground-truth' )).toBeNull();
  });
  it('normaliza páginas fuera de rango y niveles culturales',()=>{
    expect(universalArchivePage38Bis(10000,73,25)).toBe(3);
    expect(universalArchivePage38Bis(-20,0,25)).toBe(1);
    expect(universalArchiveCivilizationSubtype38Bis('Muy avanzada')).toBe('VERY_ADVANCED');
    expect(universalArchiveCivilizationSubtype38Bis('Primitiva')).toBe('PRIMITIVE');
  });
  it('los filtros de agujeros negros utilizan códigos aunque el catálogo devuelva etiquetas traducidas',()=>{
    expect(universalArchiveExtremeFamily38Bis('Agujero negro')).toBe('BLACK_HOLE');
    expect(universalArchiveExtremeFamily38Bis('Núcleo galáctico')).toBe('GALACTIC_NUCLEUS');
    expect(universalArchiveExtremeFamily38Bis('')).toBe('UNCLASSIFIED');
  });
  it('cuenta una sola luna con tres colonias, no tres lunas',()=>{
    expect(universalArchiveColonizedBodies38Bis([
      {bodyStorageKey:'0:1:2:3:MOON:0'},
      {bodyStorageKey:'0:1:2:3:MOON:0'},
      {bodyStorageKey:'0:1:2:3:MOON:0'},
      {bodyStorageKey:'0:1:2:3:MOON:1'},
    ])).toBe(2);
  });
  it('solo confía en localizadores de sistemas confirmados, nunca en civilizaciones detectadas',()=>{
    const confirmed=new SystemLocator(1n,2n,3n);
    const discovered=new SystemLocator(1n,2n,4n);
    const known=confirmedSystems38Bis([
      {locator:confirmed,state:DiscoveryState.CONFIRMED},
      {locator:discovered,state:DiscoveryState.DISCOVERED},
    ]);
    expect(known.has('1/2/3')).toBe(true);
    expect(known.has('1/2/4')).toBe(false);
  });
  const record=()=>({
    identity:{kind:'MOON',universeSeed:'S',generatorVersionCode:3,
      galaxyIndex:'1',sectorKey:'2',galacticObjectIndex:'3',bodyIndex:'4',moonIndex:'0'},
    bodyStorageKey:'1:2:3:4:MOON:0',epoch:'CT-0',epochOffsetYears:0,
    revealPolicy:'FULL_SYSTEM_REVEAL_ON_CONFIRMED',
    ecosystem:{digest:'eco'},intelligence:{digest:'int'},colonialPopulationPresent:true,
    colonization:{revision:VIDA8_REVISION,bodyStorageKey:'1:2:3:4:MOON:0',
      identity:{kind:'MOON',universeSeed:'S',generatorVersionCode:3,
        galaxyIndex:'1',sectorKey:'2',galacticObjectIndex:'3',bodyIndex:'4',moonIndex:'0'},
      ecosystemDigest:'eco',nativeCivilizationDigest:'int',colonialPopulationPresent:true,
      outcome:'COLONIZED',colonies:[{id:'colony-1',provenance:'TECHNOLOGICAL_COLONIZATION',
        origin:{sourceBodyStorageKey:'1:2:3:8:PLANET:-',tier:'ADVANCED'},
        settlement:{id:'station-1',habitatTechnology:'SEALED_SURFACE',function:'RESEARCH'}}]},
  }) as unknown as Vida9BiologyRecord;
  it('admite únicamente colonias del registro coherente ya validado por VIDA.9',()=>{
    expect(validatedColonies38Bis(record())?.length).toBe(1);
    const changed=record();
    const mutant={...changed,colonization:{...changed.colonization,
      identity:{...changed.colonization.identity,moonIndex:'1'}}};
    expect(validatedColonies38Bis(mutant)).toBeNull();
  });
  it('rechaza fuentes sin confirmación de época y procedencia ajena',()=>{
    const good=record();
    expect(validatedColonies38Bis({...good,epochOffsetYears:5} as unknown as Vida9BiologyRecord)).toBeNull();
    const altered={...good,colonization:{...good.colonization,
      colonies:good.colonization.colonies.map(colony=>({...colony,
        origin:{...colony.origin,sourceBodyStorageKey:good.bodyStorageKey}}))}};
    expect(validatedColonies38Bis(altered)).toBeNull();
  });
});
