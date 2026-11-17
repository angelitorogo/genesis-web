import {describe,expect,it} from 'vitest';
import type {Vida6EcologicalRelation} from '../../domain/life/vida6-ecosystems-species';
import {describeVida38EcologicalRelationB5} from './vida38-relaciones-legibles-38-bis-b5';
const names:Readonly<Record<string,string>>={a:'Ismera on7',b:'Ormera ia4',c:'Kasyl a4'};
const nameOf=(id:string)=>names[id]??'Nombre no disponible';
const relation=(kind:Vida6EcologicalRelation['kind'],sourceSpeciesId='a',targetSpeciesId='b',intensity01=.403):Vida6EcologicalRelation=>
  ({kind,sourceSpeciesId,targetSpeciesId,intensity01});

describe('38.bis-b5 — relaciones ecológicas legibles y orientadas',()=>{
  it('CONSUMES: la fuente consume al destino, no al contrario',()=>{
    const edge=relation('CONSUMES');
    expect(describeVida38EcologicalRelationB5(edge,'a',nameOf)?.text).toBe('Consume a Ormera ia4');
    expect(describeVida38EcologicalRelationB5(edge,'b',nameOf)?.text).toBe('Es consumida por Ismera on7');
    expect(describeVida38EcologicalRelationB5(edge,'a',nameOf)?.relativeIntensity).toBe('0,403');
  });
  it('COMPETES y MUTUALISM son recíprocas, sin afirmar depredación',()=>{
    expect(describeVida38EcologicalRelationB5(relation('COMPETES'),'a',nameOf)?.text)
      .toContain('Compite por recursos');
    expect(describeVida38EcologicalRelationB5(relation('MUTUALISM'),'b',nameOf)?.text)
      .toContain('beneficio mutuo');
  });
  it('DECOMPOSES explica el reciclaje de restos sin presentar consumo directo',()=>{
    expect(describeVida38EcologicalRelationB5(relation('DECOMPOSES'),'a',nameOf)?.text)
      .toBe('Descompone restos orgánicos asociados a Ormera ia4');
    expect(describeVida38EcologicalRelationB5(relation('DECOMPOSES'),'b',nameOf)?.text)
      .toContain('Sus restos pueden ser descompuestos');
  });
  it('no incluye relaciones ajenas a la especie consultada',()=>{
    expect(describeVida38EcologicalRelationB5(relation('CONSUMES'),'c',nameOf)).toBeNull();
  });
});
