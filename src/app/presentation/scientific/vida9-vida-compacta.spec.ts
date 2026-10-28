import { etiquetaVidaEs, etiquetaNichoVidaEs } from '../scientific/vida9-etiquetas-es';
import { Vida9FullSystemBiologyPanel } from '../scientific/vida9-full-system-biology-panel';
import type { Vida9BiologyRecord } from '../../domain/life/vida9-biology-exploration';

describe('VIDA.9c, ficha resumida de vida en español',()=>{
  it('traduce los grupos, niveles y nichos sin modificar los códigos',()=>{
    expect(etiquetaVidaEs('MICROORGANISMS')).toBe('Microorganismos');
    expect(etiquetaVidaEs('REPTILES')).toBe('Reptiles');
    expect(etiquetaVidaEs('VERY_ADVANCED')).toBe('Muy avanzada');
    expect(etiquetaNichoVidaEs('SURFACE_SOIL/PHOTOSYNTHETIC'))
      .toBe('Suelo superficial / Fotosintético');
  });
  it('resuelve nombre y ruta únicamente entre especies existentes del cuerpo',()=>{
    const componente=new Vida9FullSystemBiologyPanel();
    componente.rutaBaseEspecies=['/system','0','1','2','planet','5','species'];
    componente.record={ecosystem:{species:[{id:'vida6:aaa',proceduralName:'Lomira or1'}]}} as unknown as Vida9BiologyRecord;
    expect(componente.nombreEspecie('vida6:aaa')).toBe('Lomira or1');
    expect(componente.nombreEspecie('vida6:inexistente')).toBeNull();
    expect(componente.rutaEspecie('vida6:aaa')).toEqual(['/system','0','1','2','planet','5','species','vida6:aaa']);
  });
});
