import {
  type GalacticMapModel,
} from './galactic-map-model';

/**
 * Structured-clone-safe projection of the information required by the
 * renderer-only particle generator.
 *
 * Point 10.9 deliberately avoids sending the complete GalacticMapModel to the
 * worker. Only the deterministic visual sampling identity plus the already
 * known detailed visual structure are transferred. No repositories, persisted
 * discovery state, PD or hidden physical sector contents are included.
 */
export interface GalacticMapParticleRenderInput {
  readonly universeSeedNormalizedValue:
    string;

  readonly generatorVersionCode:
    number;

  readonly galaxyIndex:
    string;

  readonly galaxyType:
    GalacticMapModel['galaxyType'];

  readonly morphologyHint:
    GalacticMapModel['preliminaryInformation']['morphologyHint'];

  readonly visualStructure:
    GalacticMapModel['visualStructure'];
}

export function createGalacticMapParticleRenderInput(
  model:
    GalacticMapModel,
): GalacticMapParticleRenderInput {

  return Object.freeze({
    universeSeedNormalizedValue:
      String(
        model
          .generationKey
          .universeSeed
          .normalizedValue,
      ),

    generatorVersionCode:
      model
        .generationKey
        .generatorVersion
        .code,

    galaxyIndex:
      model
        .galaxyIndex
        .toString(),

    galaxyType:
      model.galaxyType,

    morphologyHint:
      model
        .preliminaryInformation
        .morphologyHint,

    visualStructure:
      model.visualStructure,
  });
}
