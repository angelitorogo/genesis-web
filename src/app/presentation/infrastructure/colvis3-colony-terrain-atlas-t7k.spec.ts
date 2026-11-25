import {describe,it,expect} from 'vitest';
import {colvis3ColonyTerrainAtlasT7k,colvis3ColonyTerrainFootprintAngleT7k} from './colvis3-colony-terrain-atlas-t7k';

describe('GENESIS 38.bis-T7k · atlas colonial a escala local y sin discontinuidades',()=>{
  it('proyecta la textura en las dimensiones del asentamiento, no en radianes fijos',()=>{
    expect(colvis3ColonyTerrainFootprintAngleT7k(.0002,1)).toBeCloseTo(.0002);
    expect(colvis3ColonyTerrainFootprintAngleT7k(.0003,2)).toBeCloseTo(.00015);
    expect(colvis3ColonyTerrainFootprintAngleT7k(0,1)).toBeNull();
    expect(colvis3ColonyTerrainFootprintAngleT7k(1,0)).toBeNull();
    expect(colvis3ColonyTerrainFootprintAngleT7k(1,Number.NaN)).toBeNull();
    expect(colvis3ColonyTerrainFootprintAngleT7k(100,1)).toBe(.08);
  });
  it('genera atlas determinista de bordes periódicos y sin transparencia',()=>{
    const a=colvis3ColonyTerrainAtlasT7k(18374,true,128);
    const b=colvis3ColonyTerrainAtlasT7k(18374,true,128);
    expect(a).toEqual(b);
    expect(a).not.toEqual(colvis3ColonyTerrainAtlasT7k(18375,true,128));
    expect(a.length).toBe(128*128*4);
    const unique=new Set<number>();
    let horizontalSeam=0,verticalSeam=0;
    for(let y=0;y<128;y++){
      const x1=(y*128)*4,x2=(y*128+127)*4;
      horizontalSeam+=Math.abs(a[x1]!-a[x2]!);
      for(let x=0;x<128;x++){
        const i=(y*128+x)*4;unique.add(a[i]!);
        expect(a[i+3]).toBe(255);
      }
    }
    for(let x=0;x<128;x++) verticalSeam+=Math.abs(a[x*4]!-a[((127*128+x)*4)]!);
    expect(horizontalSeam/128).toBeLessThan(16);
    expect(verticalSeam/128).toBeLessThan(16);
    expect(unique.size).toBeGreaterThan(55);
  });
  it('mantiene la diversidad de terrenos para lunas y planetas',()=>{
    const moon=colvis3ColonyTerrainAtlasT7k(42,true,96);
    const planet=colvis3ColonyTerrainAtlasT7k(42,false,96);
    expect(moon).not.toEqual(planet);
    expect(moon.length).toBe(96*96*4);
  });
});
