import {describe,it,expect} from 'vitest';
import {colvis3TerrainDualBasisT7l,colvis3TerrainCoordinatesT7l} from './colvis3-colony-terrain-frame-t7l';

describe('GENESIS 38.bis-T7l · la textura y los edificios comparten escala',()=>{
  for(const scale of [.00001,.001,.08,1,4]){
    it(`escala ${scale}: un footprint siempre mide un footprint`,()=>{
      const E={x:scale*.81,y:scale*.2,z:scale*.3};
      const N={x:scale*.27,y:scale*.5,z:scale*.87};
      const b=colvis3TerrainDualBasisT7l(E,N)!;
      expect(b).not.toBeNull();
      const points=[[0,0],[1,0],[0,1],[.2,-.45],[8,2.2]];
      for(const [a,c] of points){
        const d={x:E.x*a!+N.x*c!,y:E.y*a!+N.y*c!,z:E.z*a!+N.z*c!};
        const p=colvis3TerrainCoordinatesT7l(d,b);
        expect(p.x).toBeCloseTo(a!,8);
        expect(p.z).toBeCloseTo(c!,8);
      }
    });
  }
  it('el cambio de distancia de cámara no modifica las coordenadas locales',()=>{
    const E={x:2,y:1,z:0},N={x:.3,y:-.2,z:1};
    for(const angle of [0,Math.PI/6,Math.PI/3]){
      const rotate=(v:{x:number;y:number;z:number})=>({x:v.x*Math.cos(angle)-v.z*Math.sin(angle),y:v.y,z:v.x*Math.sin(angle)+v.z*Math.cos(angle)});
      const ex=rotate(E),nz=rotate(N),p=rotate({x:E.x*.8+N.x*-.4,y:E.y*.8+N.y*-.4,z:E.z*.8+N.z*-.4});
      const basis=colvis3TerrainDualBasisT7l(ex,nz)!;
      const uv=colvis3TerrainCoordinatesT7l(p,basis);
      expect(uv.x).toBeCloseTo(.8,10);
      expect(uv.z).toBeCloseTo(-.4,10);
    }
  });
});
