import {
  GalacticObject,
} from '../../domain/galactic-object/galactic-object';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type GalacticObjectLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxySectorObjectLocationResolver,
} from '../sector/galaxy-sector-object-location-resolver';

/**
 * Materializes the point-12.1 common GalacticObject model from procedural
 * identity only.
 *
 * This generator intentionally does not decide the physical subtype of the
 * object. The existing point-9.4 NEBULA / STAR_CLUSTER / EXTREME_OBJECT
 * values remain coarse exploration-result families and are not promoted to
 * Ground Truth by point 12.1.
 *
 * No state is persisted and no random draw, discovery reward or observation
 * side effect is produced.
 */
export class GalacticObjectGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): GalacticObject {

    if (
      generationKey
        .generatorVersion !==
      GeneratorVersion.V1
    ) {
      throw new RangeError(
        `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
      );
    }

    return new GalacticObject(
      generationKey,
      locator,
      GalaxySectorObjectLocationResolver
        .resolve(
          generationKey,
          locator,
        ),
    );
  }
}
