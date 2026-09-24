import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GalaxyGenerator } from '../../simulation/universe/galaxy-generator';
import {
  createAgnNucleusRenderModel,
  type AgnNucleusRenderModel,
} from '../laboratory/galactic-objects/agn-nucleus-render-model';
import {
  createQuasarNucleusRenderModel,
  type QuasarNucleusRenderModel,
} from '../laboratory/galactic-objects/quasar-nucleus-render-model';

export type GalaxyAccretionDiskVisualization =
  | Readonly<{
      kind: 'AGN';
      heading: 'NÚCLEO AGN';
      badge: 'Procedural / determinista / ilustrativo';
      caption: string;
      agnModel: AgnNucleusRenderModel;
    }>
  | Readonly<{
      kind: 'QUASAR';
      heading: 'NÚCLEO QUÁSAR';
      badge: 'Procedural / determinista / ilustrativo';
      caption: string;
      quasarModel: QuasarNucleusRenderModel;
    }>;

export function createGalaxyAccretionDiskVisualization(
  generationKey: UniverseGenerationKey,
  galaxyIndex: bigint,
): GalaxyAccretionDiskVisualization {
  const galaxy = GalaxyGenerator.generate(generationKey, galaxyIndex);

  if (galaxy.nucleus?.state === undefined) {
    throw new RangeError('28.1b requires a physically generated galactic nucleus.');
  }

  if (galaxy.nucleus.state.name === 'AGN') {
    return Object.freeze({
      kind: 'AGN',
      heading: 'NÚCLEO AGN',
      badge: 'Procedural / determinista / ilustrativo',
      caption:
        'Render derivado del modelo físico actual del núcleo activo. Representa geometría, inclinación y brillo del disco; no es una observación directa ni una imagen a escala.',
      agnModel: createAgnNucleusRenderModel(galaxy),
    });
  }

  if (galaxy.nucleus.state.name === 'QUASAR') {
    return Object.freeze({
      kind: 'QUASAR',
      heading: 'NÚCLEO QUÁSAR',
      badge: 'Procedural / determinista / ilustrativo',
      caption:
        'Render derivado del modelo físico actual del cuásar. La visualización resume disco, brillo central y posible componente relativista sin reemplazar evidencia instrumental ni observación astronómica.',
      quasarModel: createQuasarNucleusRenderModel(galaxy),
    });
  }

  throw new RangeError('28.1b solo puede visualizar discos de acreción para núcleos AGN o cuásares activos.');
}
