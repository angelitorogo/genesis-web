import {
  BodyLocator,
  CivilizationLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  MoonLocator,
  type ProceduralLocator,
  SectorLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type GenesisSeed,
} from '../../domain/seed/genesis-seed';

import {
  type UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  SeedDeriver,
} from '../seed/seed-deriver';

export const ProceduralTargetResolver =
  Object.freeze({
    resolveTargetSeed(
      generationKey:
        UniverseGenerationKey,

      locator:
        | ProceduralLocator
        | MoonLocator,
    ): GenesisSeed {

      switch (
        generationKey
          .generatorVersion
          .name
      ) {
        case 'V1':
          return resolveV1(
            generationKey
              .universeSeed,

            locator,
          );
      }
    },
  });

function resolveV1(
  universeSeed:
    UniverseSeed,

  locator:
    | ProceduralLocator
    | MoonLocator,
): GenesisSeed {

  if (
    locator instanceof
    GalaxyLocator
  ) {
    return SeedDeriver
      .galaxy(
        universeSeed,
        locator.galaxyIndex,
      );
  }

  const galaxySeed =
    SeedDeriver
      .galaxy(
        universeSeed,
        locator.galaxyIndex,
      );

  if (
    locator instanceof
    SectorLocator
  ) {
    return SeedDeriver
      .sector(
        galaxySeed,
        locator.sectorKey,
      );
  }

  const sectorSeed =
    SeedDeriver
      .sector(
        galaxySeed,
        locator.sectorKey,
      );

  if (
    locator instanceof
    GalacticObjectLocator
  ) {
    return SeedDeriver
      .galacticObject(
        sectorSeed,
        locator
          .galacticObjectIndex,
      );
  }

  const galacticObjectSeed =
    SeedDeriver
      .galacticObject(
        sectorSeed,
        locator
          .galacticObjectIndex,
      );

  if (
    locator instanceof
    SystemLocator
  ) {
    return SeedDeriver
      .system(
        galacticObjectSeed,
      );
  }

  const systemSeed =
    SeedDeriver
      .system(
        galacticObjectSeed,
      );

  if (
    locator instanceof
    BodyLocator
  ) {
    return SeedDeriver
      .body(
        systemSeed,
        locator.bodyIndex,
      );
  }

  if (
    locator instanceof
    MoonLocator
  ) {
    const bodySeed =
      SeedDeriver
        .body(
          systemSeed,
          locator.bodyIndex,
        );

    return SeedDeriver
      .moon(
        bodySeed,
        locator.moonIndex,
      );
  }

  if (
    locator instanceof
    CivilizationLocator
  ) {
    const bodySeed =
      SeedDeriver
        .body(
          systemSeed,
          locator.bodyIndex,
        );

    const historySeed =
      SeedDeriver
        .history(
          bodySeed,
        );

    const evolutionSeed =
      SeedDeriver
        .evolution(
          historySeed,
        );

    return SeedDeriver
      .civilization(
        evolutionSeed,
        locator
          .civilizationIndex,
      );
  }

  throw new TypeError(
    'Unsupported ProceduralLocator.',
  );
}