import { AgnNucleusVisualFamily } from '../laboratory/galactic-objects/agn-nucleus-render-model';
import { QuasarNucleusVisualFamily } from '../laboratory/galactic-objects/quasar-nucleus-render-model';
import { etiquetaMagnitudAcrecion, regimenVisualGalactico } from './galaxy-accretion-disk-display';

describe('galaxy-accretion-disk-display — etiquetas científicas españolas', () => {
  it('traduce todas las familias AGN y de cuásar sin exponer claves técnicas', () => {
    const familias = [
      ...Object.values(AgnNucleusVisualFamily),
      ...Object.values(QuasarNucleusVisualFamily),
    ];
    expect(familias).toHaveLength(16);
    const etiquetas = familias.map(regimenVisualGalactico);
    expect(new Set(etiquetas).size).toBe(16);
    for (const etiqueta of etiquetas) {
      expect(etiqueta).toMatch(/^[A-ZÁÉÍÓÚÜÑ]/);
      expect(etiqueta).not.toMatch(/_/);
      expect(etiqueta).not.toMatch(/LOW LUMINOSITY|FACE ON|EDGE ON|WARPED|CLUMPY|JETS|THIN DISK/);
    }
    expect(regimenVisualGalactico(AgnNucleusVisualFamily.LOW_LUMINOSITY_AGN))
      .toBe('Núcleo galáctico activo de baja luminosidad');
  });

  it('retira aclaraciones internas de las magnitudes sin cambiar el dato físico', () => {
    const etiquetas: ReadonlyArray<readonly [string, string]> = [
      ['Régimen de referencia', 'Régimen de referencia'],
      ['Radio interior (modelo no rotante)', 'Radio interior'],
      ['Radio exterior ilustrativo', 'Radio exterior'],
      ['Luminosidad bolométrica (modelo)', 'Luminosidad bolométrica'],
      ['Acreción (modelo estacionario)', 'Tasa de acreción'],
      ['Temperatura efectiva máxima (modelo)', 'Temperatura efectiva máxima'],
    ];
    for (const [original, visible] of etiquetas) {
      expect(etiquetaMagnitudAcrecion(original)).toBe(visible);
    }
    expect(etiquetaMagnitudAcrecion('Magnitud científica nueva'))
      .toBe('Magnitud científica nueva');
  });
});
