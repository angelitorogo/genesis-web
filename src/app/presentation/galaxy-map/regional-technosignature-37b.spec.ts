import { describe, expect, it } from 'vitest';
import { GalaxySectorCoordinates } from '../../domain/sector/galaxy-sector-coordinates';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { GalaxySectorGrid } from '../../domain/sector/galaxy-sector-grid';
import { regionalSectorWindow37b, regionalSignalStatus37b } from './regional-technosignature-37b';

const generation = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),GeneratorVersion.V3);
function grid(half:number) {return new GalaxySectorGrid(generation,8n,100,half);}

describe('37.B: escucha anónima 10×10',()=>{
  it('analiza exactamente 100 sectores sin duplicarlos ni salir de la malla',()=>{
    const g=grid(40);
    const cells=regionalSectorWindow37b(g,new GalaxySectorCoordinates(2,-7));
    expect(cells).toHaveLength(100);
    expect(new Set(cells.map(p=>`${p.x},${p.y}`)).size).toBe(100);
    expect(cells.every(p=>g.contains(p))).toBe(true);
    expect(cells.some(p=>p.x===2&&p.y===-7)).toBe(true);
  });
  it('desplaza la ventana 10×10 al extremo del mapa sin cambiar su tamaño',()=>{
    const g=grid(20);
    const cells=regionalSectorWindow37b(g,new GalaxySectorCoordinates(-20,20));
    expect(cells).toHaveLength(100);
    expect(Math.min(...cells.map(p=>p.x))).toBe(-20);
    expect(Math.max(...cells.map(p=>p.y))).toBe(20);
  });
  it('sectores vecinos comparten la misma ventana estable de escucha',()=>{
    const g=grid(40);
    const a=regionalSectorWindow37b(g,new GalaxySectorCoordinates(1,2));
    const b=regionalSectorWindow37b(g,new GalaxySectorCoordinates(8,9));
    const c=regionalSectorWindow37b(g,new GalaxySectorCoordinates(11,2));
    expect(a.map(v=>`${v.x},${v.y}`)).toEqual(b.map(v=>`${v.x},${v.y}`));
    expect(a.map(v=>`${v.x},${v.y}`)).not.toEqual(c.map(v=>`${v.x},${v.y}`));
  });
  it('adapta la ventana en una galaxia que contiene menos de 100 sectores',()=>{
    const cells=regionalSectorWindow37b(grid(1),new GalaxySectorCoordinates(0,0));
    expect(cells).toHaveLength(9);
  });
  it('no convierte fallos físicos en negativos definitivos',()=>{
    expect(regionalSignalStatus37b(false,7)).toBe('INCOMPLETE');
    expect(regionalSignalStatus37b(false,0)).toBe('NO_SIGNAL');
    expect(regionalSignalStatus37b(true,3)).toBe('DETECTED');
  });
  it('rechaza un sector fuera de la galaxia',()=>{
    expect(()=>regionalSectorWindow37b(grid(3),new GalaxySectorCoordinates(5,5))).toThrow();
  });
});
