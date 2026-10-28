import { compactMoonSectionsVIDA9e, moonScientificDisplayTextVIDA9f } from './moon-scientific-compact-vida9e';
import type { MoonScientificSectionsModel, MoonScientificSectionId } from './moon-scientific-sections';

describe('VIDA.9f — presentación científica lunar sin detalles internos', () => {
  it('elimina versiones en los resultados sin alterar significado de océano presente, ausente o no resuelto', () => {
    expect(moonScientificDisplayTextVIDA9f('Océano subsuperficial presente (universo simulado CT-0)')).toBe('Océano subsuperficial presente');
    expect(moonScientificDisplayTextVIDA9f('Hielo y océano subsuperficial (realidad simulada CT-0)')).toBe('Hielo y océano subsuperficial');
    expect(moonScientificDisplayTextVIDA9f('Potencial V1 de habitabilidad (océano H₂O presente CT-0)')).toBe('Potencial de habitabilidad con océano subsuperficial');
    expect(moonScientificDisplayTextVIDA9f('Sin océano subsuperficial H₂O en el modelo CT-0')).toBe('Sin océano subsuperficial de agua');
    expect(moonScientificDisplayTextVIDA9f('Estado oceánico H₂O no resuelto en CT-0')).toBe('Estado del océano no determinado');
  });

  it('convierte índices 0–1 a porcentajes y respeta cantidades físicas y relaciones de tamaño', () => {
    expect(moonScientificDisplayTextVIDA9f('0,774 / 1')).toBe('77,4 %');
    expect(moonScientificDisplayTextVIDA9f('Índice 0,114 / 1')).toBe('Índice 11,4 %');
    expect(moonScientificDisplayTextVIDA9f('1 / 1')).toBe('100 %');
    expect(moonScientificDisplayTextVIDA9f('0 / 1')).toBe('0 %');
    expect(moonScientificDisplayTextVIDA9f('0,183 × el radio terrestre')).toBe('0,183 × el radio terrestre');
    expect(moonScientificDisplayTextVIDA9f('0,05972 GPa')).toBe('0,05972 GPa');
    expect(moonScientificDisplayTextVIDA9f('No determinada')).toBe('No determinada');
  });

  it('proyecta de forma inmutable solo valores visibles y conserva las secciones esenciales', () => {
    const original: MoonScientificSectionsModel = {
      sections: [{ id: 'habitability' as MoonScientificSectionId,
        eyebrow:'SECCIÓN 09', title:'Habitabilidad', summary:'Texto histórico',
        fields:[{label:'Índice global',value:'0,774 / 1',note:null},
          {label:'Ruta subsuperficial',value:'Potencial V1 de habitabilidad (océano H₂O presente CT-0)',note:null}],
      }], comparison: {} as MoonScientificSectionsModel['comparison'], badges: [],
    };
    const snapshot = JSON.stringify(original);
    const result = compactMoonSectionsVIDA9e(original);
    expect(result[0].fields.map(x=>x.value)).toEqual(['Potencial de habitabilidad con océano subsuperficial','77,4 %']);
    expect(JSON.stringify(original)).toBe(snapshot);
  });
});
