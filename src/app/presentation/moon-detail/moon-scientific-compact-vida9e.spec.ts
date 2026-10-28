import { compactMoonSectionsVIDA9e } from './moon-scientific-compact-vida9e';
import type { MoonScientificSectionsModel, MoonScientificSectionId } from './moon-scientific-sections';

describe('VIDA.9e — ficha lunar compacta, solo presentación', () => {
  const create = (): MoonScientificSectionsModel => {
    const datasets: Record<string, readonly [string,string][]> = {
      general: [['Masa','0,003 M⊕'],['Radio','0,183 R⊕'],['Síntesis 32.F.6 — reservorio H₂O','Diagnóstico interno']],
      orbit: [['Semieje mayor','20,16 radios planetarios'],['Excentricidad','0,058']],
      tides: [['Periodo de rotación','132,46 h'],['Acoplamiento de marea','Sincronizado']],
      environment: [['Temperatura superficial estimada','268,7 K'],['Agua','Hielo y océano subsuperficial'],
        ['Océano CT-0 del universo simulado (32.F.2c)','Océano presente en el modelo CT-0'],
        ['Geometría oceánica generada (32.F.2c)','Cubierta de hielo 2,069 km; líquido 64,06 km'],
        ['Geología','Activa por mareas'],['Retención de calor interno','0,114 / 1'],
        ['PRE-33.04 — certificación lunar','Hipótesis']],
      atmosphere: [['Atmósfera','No resuelta'],['Presión superficial atmosférica (escenario)','No determinada'],
        ['PRE-33.06 — cierre transversal CT-0','Diagnóstico']],
      radiation: [['Exposición radiativa real — superficie / océano','Desconocida / Desconocida'],
        ['Atenuación fotónica de referencia, γ 1 MeV (32.F.3)','No es dosis']],
      geochemistry: [['Contacto agua-roca del modelo','No demostrado'],
        ['Potencia térmica interior del modelo 32.F.4','No resuelta']],
      history: [['Edad común CT-0 de la cronología','No determinada']],
      habitability: [['Clasificación','Candidatura subsuperficial'],['Ruta superficial','No candidata'],
        ['Ruta subsuperficial','Candidata condicional']],
      comparison: [['Radio relativo','0,183 × el radio terrestre']],
    };
    return {sections:Object.entries(datasets).map(([id,values]) => ({
      id:id as MoonScientificSectionId, eyebrow:'SECCIÓN ANTERIOR',title:id,summary:'Texto largo anterior',
      fields:values.map(([label,value]) => ({label,value,note:'Explicación heredada extensa'})),
    }))} as unknown as MoonScientificSectionsModel;
  };

  it('mantiene la información CT-0, reduce diagnósticos y numera Vida antes de Comparación', () => {
    const original = create();
    const originalJson = JSON.stringify(original);
    const sections = compactMoonSectionsVIDA9e(original);
    expect(sections.map(section => section.title)).toEqual([
      'General','Órbita','Mareas y rotación','Entorno y agua','Atmósfera',
      'Radiación','Geología y energía','Habitabilidad','Comparación con la Tierra',
    ]);
    expect(sections.find(section => section.id === 'comparison')?.eyebrow).toBe('SECCIÓN 10');
    expect(sections.some(section => section.id === 'history')).toBe(false);
    expect(sections.find(section => section.id === 'environment')?.fields.find(item => item.label === 'Océano subsuperficial')?.value)
      .toBe('Océano subsuperficial presente');
    expect(sections.find(section => section.id === 'geochemistry')?.fields.find(item => item.label === 'Geología')?.value)
      .toBe('Activa por mareas');
    expect(sections.flatMap(section => section.fields).some(item => /PRE-33|Síntesis 32\.F/.test(item.label))).toBe(false);
    expect(JSON.stringify(original)).toBe(originalJson);
  });

  it('un valor no resuelto sigue sin resolverse, nunca es inventado', () => {
    const sections = compactMoonSectionsVIDA9e(create());
    expect(sections.find(section => section.id === 'atmosphere')?.fields.find(item => item.label === 'Presión superficial (escenario)')?.value)
      .toBe('No determinada');
    expect(sections.find(section => section.id === 'radiation')?.fields.find(item => item.label === 'Exposición radiativa')?.value)
      .toBe('Desconocida / Desconocida');
  });
  it('tolera la ausencia de datos PRE-33 opcionales sin rellenarlos ni presentar 0', () => {
    const source = {sections:[{id:'general',eyebrow:'SECCIÓN 01',title:'General',summary:'',fields:[{label:'Masa',value:'0,003 M⊕',note:null}]}]} as unknown as MoonScientificSectionsModel;
    const sections=compactMoonSectionsVIDA9e(source);
    expect(sections.length).toBe(1);
    expect(sections[0].fields).toEqual([{label:'Masa',value:'0,003 M⊕',note:null}]);
  });
});
