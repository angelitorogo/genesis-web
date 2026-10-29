import { confirmedCivilizationKnowledgeRevision, confirmedPhysicalPlanetCount,
  restoreCivilizationKnowledgeIndex } from './galaxy-civilization-known-index';

describe('Conocimiento galáctico persistido de civilizaciones', () => {
  const confirmed = new Set(['0/1/2', '0/7/8']);
  const entry = Object.freeze({
    id:'0:1:2:3:PLANET:-',systemKey:'0/1/2',planetName:'Glavara B-4',
    systemName:'Glavara',speciesName:'Arvor al5',speciesId:'species1',
    lineage:'Reptiliana',tier:'VERY_ADVANCED',
    locator:{galaxyIndex:'0',sectorKey:'1',galacticObjectIndex:'2',bodyIndex:'3'},
  });
  const sample = JSON.stringify({entries:[entry],primitive:0,advanced:0,veryAdvanced:1,
    complete:true,planetsWithBiologicalRecord:2,knownPhysicalPlanets:2});

  it('invalida el conocimiento al confirmar un nuevo sistema, sin necesitar nuevos cuerpos', () => {
    expect(confirmedCivilizationKnowledgeRevision(new Set(['0/1/2','0/7/8'])))
      .toEqual(confirmedCivilizationKnowledgeRevision(new Set(['0/7/8','0/1/2'])));
    expect(confirmedCivilizationKnowledgeRevision(confirmed))
      .not.toEqual(confirmedCivilizationKnowledgeRevision(new Set(['0/1/2'])));
  });
  it('restaura identidades y niveles desde el índice galáctico sin leer VIDA.9', () => {
    const restored=restoreCivilizationKnowledgeIndex(sample,confirmed,0n);
    expect(restored.complete).toBe(true);
    expect(restored.veryAdvanced).toBe(1);
    expect(restored.entries[0].planetName).toBe('Glavara B-4');
  });
  it('no admite civilizaciones procedentes de sistemas no confirmados ni de otras galaxias', () => {
    expect(()=>restoreCivilizationKnowledgeIndex(sample,new Set(['0/7/8']),0n)).toThrow();
    expect(()=>restoreCivilizationKnowledgeIndex(sample,confirmed,1n)).toThrow();
  });
  it('no acepta recuentos alterados ni snapshots incompletos', () => {
    const raw=JSON.parse(sample);
    expect(()=>restoreCivilizationKnowledgeIndex(JSON.stringify({...raw,advanced:3}),confirmed,0n)).toThrow();
    expect(()=>restoreCivilizationKnowledgeIndex(JSON.stringify({...raw,complete:false}),confirmed,0n)).toThrow();
    expect(()=>restoreCivilizationKnowledgeIndex(JSON.stringify({...raw,entries:[entry,entry]}),confirmed,0n)).toThrow();
  });
  it('cuenta planetas físicos confirmados sin confundir cero planetas con cero sistemas', () => {
    const loc={galaxyIndex:{__genesisBigInt:'0'},sectorKey:{__genesisBigInt:'1'},
      galacticObjectIndex:{__genesisBigInt:'2'}};
    const snap=JSON.stringify({planets:[{stateName:'CONFIRMED',locator:loc},
      {stateName:'CONFIRMED',locator:loc},
      {stateName:'DISCOVERED',locator:loc}]});
    expect(confirmedPhysicalPlanetCount(snap,confirmed)).toBe(2);
    expect(confirmedPhysicalPlanetCount(snap,new Set(['0/7/8']))).toBeNull();
    expect(confirmedPhysicalPlanetCount(undefined,confirmed)).toBeNull();
  });
  it('excluye planetas de anfitriones compactos sin física biológica V3', () => {
    const loc={galaxyIndex:{__genesisBigInt:'0'},sectorKey:{__genesisBigInt:'1'},
      galacticObjectIndex:{__genesisBigInt:'2'}};
    const snap=JSON.stringify({planets:[
      {stateName:'CONFIRMED',locator:loc,orbitClass:'COMPACT_HOST'},
      {stateName:'CONFIRMED',locator:loc,orbitClass:'SINGLE_HOST'},
    ]});
    expect(confirmedPhysicalPlanetCount(snap,confirmed)).toBe(1);
  });

});
