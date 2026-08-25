import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  GalacticObjectLocator,
  type SectorLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GalaxyRegion,
} from '../../domain/sector/galaxy-region';

import {
  GalaxySectorContent,
} from '../../domain/sector/galaxy-sector-content';

import {
  type GalaxySectorCoordinates,
} from '../../domain/sector/galaxy-sector-coordinates';

import {
  type GalaxySectorGrid,
} from '../../domain/sector/galaxy-sector-grid';

import {
  type SectorSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  GALACTIC_NUCLEUS_OBJECT_INDEX,
  isGalacticCenterCoordinates,
} from '../../domain/universe/galactic-center';

import {
  type Galaxy,
} from '../../domain/universe/galaxy';

import {
  GalaxyType,
} from '../../domain/universe/galaxy-type';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  Sfc64Random,
} from '../random/sfc64-random';

import {
  GalaxySectorGridGenerator,
} from './galaxy-sector-grid-generator';

import {
  GalaxySectorStellarDensityGenerator,
} from './galaxy-sector-stellar-density-generator';

import {
  SectorSeedResolver,
} from './sector-seed-resolver';

interface V1Draws {

  readonly occupancy:
    number;

  readonly systemCount:
    number;

  readonly galacticObjectCount:
    number;
}

interface V1SectorContentProfile {

  readonly baseOccupancyProbability:
    number;

  readonly maxSystemSlots:
    number;

  readonly maxGalacticObjectSlots:
    number;
}

/**
 * Generates the procedural content of exactly one requested galactic sector.
 *
 * The generator is fully deterministic and lazy:
 *
 * - no galaxy-wide sector collection is created;
 * - no adjacent sector is generated implicitly;
 * - no sector content is cached;
 * - nothing is persisted;
 * - discovery state is not modified;
 * - only lightweight procedural child locators are produced.
 */
export class GalaxySectorContentGenerator {

  private constructor() {}

  static generate(
    galaxy:
      Galaxy,

    coordinates:
      GalaxySectorCoordinates,
  ): GalaxySectorContent {

    const grid =
      GalaxySectorGridGenerator
        .generate(
          galaxy,
        );

    const locator =
      grid.locatorFor(
        coordinates,
      );

    const sectorSeed =
      SectorSeedResolver
        .resolve(
          galaxy.generationKey,
          locator,
        );

    if (
      galaxy
        .generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateV1(
        galaxy,
        grid,
        coordinates,
        locator,
        sectorSeed,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${galaxy.generationKey.generatorVersion.code}.`,
    );
  }

  private static generateV1(
    galaxy:
      Galaxy,

    grid:
      GalaxySectorGrid,

    coordinates:
      GalaxySectorCoordinates,

    locator:
      SectorLocator,

    sectorSeed:
      SectorSeed,
  ): GalaxySectorContent {

    const random =
      new Sfc64Random(
        UniverseSeed.parse(
          formatNormalizedSeed(
            sectorSeed
              .normalizedValue,
          ),
        ),
      );

    /*
     * Frozen V1 draw order.
     *
     * 5.4 must not consume or reorder any additional random values.
     */
    const draws:
      V1Draws = {

        occupancy:
          random.nextDouble(),

        systemCount:
          random.nextDouble(),

        galacticObjectCount:
          random.nextDouble(),
      };

    const profile =
      this.getV1Profile(
        galaxy.type,
      );

    /*
     * Stellar-density calculation now has a single canonical source.
     * It consumes no PRNG values and does not depend on SectorSeed.
     */
    const stellarDensity =
      GalaxySectorStellarDensityGenerator
        .generate(
          galaxy,
          grid,
          coordinates,
        );

    const densityFactor =
      stellarDensity
        .relativeDensity;

    const insideNominalGalaxy =
      stellarDensity.region !==
      GalaxyRegion.OUTSIDE_NOMINAL;

    const occupancyProbability =
      clamp01(
        profile
          .baseOccupancyProbability *
          densityFactor,
      );

    const isOccupied =
      insideNominalGalaxy &&
      draws.occupancy <
        occupancyProbability;

    let systemLocators:
      readonly SystemLocator[] =
        [];

    let galacticObjectLocators:
      readonly GalacticObjectLocator[] =
        [];

    if (
      isOccupied
    ) {
      const systemCapacity =
        Math.max(
          1,

          Math.floor(
            profile
              .maxSystemSlots *
              densityFactor,
          ),
        );

      const systemCount =
        1 +
        Math.floor(
          draws.systemCount *
            systemCapacity,
        );

      const galacticObjectCapacity =
        Math.max(
          0,

          Math.floor(
            profile
              .maxGalacticObjectSlots *
              densityFactor,
          ),
        );

      const galacticObjectCount =
        Math.floor(
          draws
            .galacticObjectCount *
            (
              galacticObjectCapacity +
              1
            ),
        );

      systemLocators =
        Array.from(
          {
            length:
              systemCount,
          },

          (
            _,
            index,
          ) =>
            new SystemLocator(
              locator.galaxyIndex,
              locator.sectorKey,
              BigInt(
                index,
              ),
            ),
        );

      galacticObjectLocators =
        Array.from(
          {
            length:
              galacticObjectCount,
          },

          (
            _,
            index,
          ) =>
            new GalacticObjectLocator(
              locator.galaxyIndex,
              locator.sectorKey,
              BigInt(
                index,
              ),
            ),
        );
    }

    /*
     * Galactic-centre contract: (0, 0) always exposes the persistent nucleus
     * identity at GalacticObject index 0, regardless of ordinary occupancy.
     * Existing non-central procedural identities are untouched.
     */
    if (
      isGalacticCenterCoordinates(
        coordinates,
      ) &&
      !galacticObjectLocators
        .some(
          (child) =>
            child.galacticObjectIndex ===
            GALACTIC_NUCLEUS_OBJECT_INDEX,
        )
    ) {
      galacticObjectLocators =
        Object.freeze([
          new GalacticObjectLocator(
            locator.galaxyIndex,
            locator.sectorKey,
            GALACTIC_NUCLEUS_OBJECT_INDEX,
          ),
          ...galacticObjectLocators,
        ]);
    }

    return new GalaxySectorContent(
      galaxy.generationKey,
      locator,
      coordinates,
      sectorSeed,
      stellarDensity,
      systemLocators,
      galacticObjectLocators,
    );
  }

  private static getV1Profile(
    galaxyType:
      GalaxyType,
  ): V1SectorContentProfile {

    if (
      galaxyType ===
      GalaxyType.BARRED_SPIRAL
    ) {
      return {
        baseOccupancyProbability:
          0.92,

        maxSystemSlots:
          28,

        maxGalacticObjectSlots:
          5,
      };
    }

    if (
      galaxyType ===
      GalaxyType.SPIRAL
    ) {
      return {
        baseOccupancyProbability:
          0.90,

        maxSystemSlots:
          26,

        maxGalacticObjectSlots:
          5,
      };
    }

    if (
      galaxyType ===
      GalaxyType.ELLIPTICAL
    ) {
      return {
        baseOccupancyProbability:
          0.95,

        maxSystemSlots:
          32,

        maxGalacticObjectSlots:
          4,
      };
    }

    if (
      galaxyType ===
      GalaxyType.IRREGULAR
    ) {
      return {
        baseOccupancyProbability:
          0.70,

        maxSystemSlots:
          16,

        maxGalacticObjectSlots:
          6,
      };
    }

    if (
      galaxyType ===
      GalaxyType.DWARF
    ) {
      return {
        baseOccupancyProbability:
          0.60,

        maxSystemSlots:
          10,

        maxGalacticObjectSlots:
          4,
      };
    }

    throw new RangeError(
      `Unsupported GalaxyType: ${galaxyType.code}.`,
    );
  }
}

function formatNormalizedSeed(
  normalizedValue:
    string,
): string {

  if (
    !/^[0-9A-F]{32}$/u
      .test(
        normalizedValue,
      )
  ) {
    throw new RangeError(
      `Expected a normalized 128-bit hexadecimal seed: ${normalizedValue}.`,
    );
  }

  return normalizedValue
    .match(
      /.{4}/gu,
    )!
    .join(
      '-',
    );
}

function clamp01(
  value:
    number,
): number {

  return Math.min(
    1,

    Math.max(
      0,
      value,
    ),
  );
}