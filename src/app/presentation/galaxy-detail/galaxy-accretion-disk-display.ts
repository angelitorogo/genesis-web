/** Etiquetas exclusivamente de presentación para la observación de núcleos galácticos.
 * No cambian familias físicas, identidades, valores científicos ni hechos persistidos.
 */
import { type AgnNucleusVisualFamily } from '../laboratory/galactic-objects/agn-nucleus-render-model';
import { type QuasarNucleusVisualFamily } from '../laboratory/galactic-objects/quasar-nucleus-render-model';

const REGIMENES: Readonly<Record<AgnNucleusVisualFamily | QuasarNucleusVisualFamily, string>> = Object.freeze({
  THIN_LUMINOUS_DISK: 'Disco luminoso fino',
  EDGE_ON_LENSED_DISK: 'Disco de canto con lente gravitacional',
  THICK_HOT_TORUS: 'Toro de acreción caliente',
  PHOTON_RING_DOMINANT: 'Anillo fotónico dominante',
  WARPED_ACCRETION_FLOW: 'Flujo de acreción deformado',
  DOPPLER_BRIGHT_CRESCENT: 'Creciente luminoso por efecto Doppler',
  CLUMPY_FEEDING_DISK: 'Disco de acreción irregular',
  LOW_LUMINOSITY_AGN: 'Núcleo galáctico activo de baja luminosidad',
  RADIANT_FACE_ON_DISK: 'Disco radiante visto de frente',
  EDGE_ON_DUST_TORUS: 'Toro de polvo visto de canto',
  TWIN_RELATIVISTIC_JETS: 'Dos chorros relativistas',
  DOPPLER_ONE_SIDED_JET: 'Chorro asimétrico por efecto Doppler',
  BROAD_POLAR_WIND: 'Viento polar extenso',
  WARPED_PRECESSING_JET: 'Chorro en precesión y deformado',
  KNOTTED_EXTENDED_JET: 'Chorro extenso con concentraciones de emisión',
  HYPERLUMINOUS_CORONA: 'Corona de luminosidad extrema',
});

export function regimenVisualGalactico(familia: AgnNucleusVisualFamily | QuasarNucleusVisualFamily): string {
  return REGIMENES[familia];
}

/** Solo se acortan las etiquetas visibles: las magnitudes físicas no se transforman. */
export function etiquetaMagnitudAcrecion(etiqueta: string): string {
  switch (etiqueta) {
    case 'Radio interior (modelo no rotante)': return 'Radio interior';
    case 'Radio exterior ilustrativo': return 'Radio exterior';
    case 'Luminosidad bolométrica (modelo)': return 'Luminosidad bolométrica';
    case 'Acreción (modelo estacionario)': return 'Tasa de acreción';
    case 'Temperatura efectiva máxima (modelo)': return 'Temperatura efectiva máxima';
    default: return etiqueta;
  }
}
