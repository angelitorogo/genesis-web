import {
  archiveIndexPlan38BisT2,
  archiveIndexTaskKey38BisT2,
} from './genesis-universal-archive-index-plan-38bis-t2';

describe('38.bis-T2 — planificación reanudable del Archivo confirmado', () => {
  const categories = ['systems', 'asteroids', 'comets', 'tno', 'captured'] as const;
  const galaxies = [{index:'0'}, {index:'1'}, {index:'2'}] as const;

  it('procesa primero los fragmentos ausentes y después comprueba los guardados', () => {
    const saved=new Set(categories.flatMap(category=>galaxies.map(g=>
      archiveIndexTaskKey38BisT2(category,g.index))));
    saved.delete('asteroids|2');
    saved.delete('comets|1');
    saved.delete('captured|0');
    const jobs=archiveIndexPlan38BisT2(categories,galaxies,saved);
    expect(jobs.slice(0,3)).toEqual([
      {category:'asteroids',galaxyIndex:'2'},
      {category:'comets',galaxyIndex:'1'},
      {category:'captured',galaxyIndex:'0'},
    ]);
    expect(jobs).toHaveLength(categories.length*galaxies.length);
    expect(new Set(jobs.map(j=>archiveIndexTaskKey38BisT2(j.category,j.galaxyIndex))).size)
      .toBe(jobs.length);
  });

  it('no repite lo comprobado en la apertura actual y conserva las tareas pendientes', () => {
    const saved=new Set(['systems|0','systems|1','asteroids|0']);
    const checked=new Set(['systems|0','asteroids|0']);
    const jobs=archiveIndexPlan38BisT2(categories,galaxies,saved,checked);
    expect(jobs.some(t=>t.category==='systems'&&t.galaxyIndex==='0')).toBe(false);
    expect(jobs.some(t=>t.category==='asteroids'&&t.galaxyIndex==='0')).toBe(false);
    expect(jobs.some(t=>t.category==='systems'&&t.galaxyIndex==='1')).toBe(true);
    expect(jobs.some(t=>t.category==='asteroids'&&t.galaxyIndex==='2')).toBe(true);
    expect(jobs).toHaveLength(categories.length*galaxies.length-checked.size);
  });

  it('no hace pasar secciones almacenadas por verificadas', () => {
    const jobs=archiveIndexPlan38BisT2(['systems'],galaxies,new Set(['systems|0']));
    expect(jobs).toEqual([
      {category:'systems',galaxyIndex:'1'},
      {category:'systems',galaxyIndex:'2'},
      {category:'systems',galaxyIndex:'0'},
    ]);
  });
});
