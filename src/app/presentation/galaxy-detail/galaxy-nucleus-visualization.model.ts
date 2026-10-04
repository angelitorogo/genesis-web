import {
  GalacticNucleusState,
} from '../../domain/universe/galactic-nucleus-state';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxyGenerator,
} from '../../simulation/universe/galaxy-generator';

import {
  createAgnNucleusRenderModel,
  type AgnNucleusRenderModel,
} from '../laboratory/galactic-objects/agn-nucleus-render-model';

import {
  createGalacticNucleusBlackHoleCoreModel,
} from '../laboratory/galactic-objects/galactic-nucleus-black-hole-core-model';

import {
  type BlackHoleLaboratoryRenderModel,
} from '../laboratory/galactic-objects/black-hole-laboratory-render-model';

import {
  createQuasarNucleusRenderModel,
  type QuasarNucleusRenderModel,
} from '../laboratory/galactic-objects/quasar-nucleus-render-model';

import {
  createQuiescentNucleusRenderModel,
  type QuiescentNucleusRenderModel,
} from '../laboratory/galactic-objects/quiescent-nucleus-render-model';

interface GalaxyNucleusVisualizationBase {
  readonly stateLabel:
    string;

  readonly familyLabel:
    string;

  readonly blackHoleCoreModel:
    BlackHoleLaboratoryRenderModel | null;

  readonly caption:
    string;
}

export type GalaxyNucleusVisualization =
  | Readonly<
      GalaxyNucleusVisualizationBase & {
        readonly kind:
          'QUIESCENT';

        readonly quiescentModel:
          QuiescentNucleusRenderModel;
      }
    >
  | Readonly<
      GalaxyNucleusVisualizationBase & {
        readonly kind:
          'AGN';

        readonly agnModel:
          AgnNucleusRenderModel;
      }
    >
  | Readonly<
      GalaxyNucleusVisualizationBase & {
        readonly kind:
          'QUASAR';

        readonly quasarModel:
          QuasarNucleusRenderModel;
      }
    >;

/**
 * 28.2G.1 — canonical galactic-nucleus visualization for the real game.
 *
 * This is deliberately a projection of the already-generated Galaxy. It never
 * generates a second nucleus or a renderer-only compact object. The same
 * approved 28.2F render models used by the laboratory are reused here so the
 * scientific card cannot drift to a fourth visual representation.
 */
export function createGalaxyNucleusVisualization(
  generationKey:
    UniverseGenerationKey,

  galaxyIndex:
    bigint,
): GalaxyNucleusVisualization | null {

  const galaxy =
    GalaxyGenerator
      .generate(
        generationKey,
        galaxyIndex,
      );

  const nucleus =
    galaxy.nucleus;

  if (
    nucleus ===
      null
  ) {
    return null;
  }

  if (
    nucleus.state ===
      GalacticNucleusState.QUIESCENT
  ) {
    const quiescentModel =
      createQuiescentNucleusRenderModel(
        galaxy,
      );

    const blackHoleCoreModel =
      createGalacticNucleusBlackHoleCoreModel(
        galaxy,
        quiescentModel.familyIndex,
      );

    return Object.freeze({
      kind:
        'QUIESCENT',
      stateLabel:
        'Núcleo quiescente',
      familyLabel:
        visualFamilyLabel(
          quiescentModel.family,
        ),
      quiescentModel,
      blackHoleCoreModel,
      caption:
        blackHoleCoreModel ===
          null
          ? 'Representación procedural determinista del núcleo quiescente real. El Ground Truth actual no modela un SMBH asociado a este núcleo; no se inventa uno para la ficha.'
          : 'Representación procedural determinista del núcleo quiescente real y de su SMBH canónico. Reutiliza exactamente la familia visual aprobada en 28.2F.',
    });
  }

  if (
    nucleus.state ===
      GalacticNucleusState.AGN
  ) {
    const agnModel =
      createAgnNucleusRenderModel(
        galaxy,
      );

    const blackHoleCoreModel =
      requireBlackHoleCore(
        createGalacticNucleusBlackHoleCoreModel(
          galaxy,
          agnModel.familyIndex,
        ),
        'AGN',
      );

    return Object.freeze({
      kind:
        'AGN',
      stateLabel:
        'Núcleo galáctico activo',
      familyLabel:
        visualFamilyLabel(
          agnModel.family,
        ),
      agnModel,
      blackHoleCoreModel,
      caption:
        'Representación procedural determinista del AGN real. El SMBH central es el núcleo canónico 28.2F.3; la actividad nuclear no crea un segundo agujero negro.',
    });
  }

  if (
    nucleus.state ===
      GalacticNucleusState.QUASAR
  ) {
    const quasarModel =
      createQuasarNucleusRenderModel(
        galaxy,
      );

    const blackHoleCoreModel =
      requireBlackHoleCore(
        createGalacticNucleusBlackHoleCoreModel(
          galaxy,
          quasarModel.familyIndex,
        ),
        'QUASAR',
      );

    return Object.freeze({
      kind:
        'QUASAR',
      stateLabel:
        'Quásar',
      familyLabel:
        visualFamilyLabel(
          quasarModel.family,
        ),
      quasarModel,
      blackHoleCoreModel,
      caption:
        'Representación procedural determinista del cuásar real. Reutiliza el SMBH canónico 28.2F.3 y añade únicamente las capas de actividad quásar aprobadas.',
    });
  }

  throw new RangeError(
    `Unsupported GalacticNucleusState: ${String(nucleus.state?.name)}.`,
  );
}

function requireBlackHoleCore(
  model:
    BlackHoleLaboratoryRenderModel | null,

  state:
    'AGN' | 'QUASAR',
): BlackHoleLaboratoryRenderModel {
  if (
    model ===
      null
  ) {
    throw new RangeError(
      `${state} nucleus visualization requires its generated SMBH core.`,
    );
  }

  return model;
}

function visualFamilyLabel(
  family:
    string,
): string {
  const human =
    family
      .toLowerCase()
      .replaceAll(
        '_',
        ' ',
      );

  return human
    .charAt(
      0,
    )
    .toUpperCase() +
    human.slice(
      1,
    );
}
