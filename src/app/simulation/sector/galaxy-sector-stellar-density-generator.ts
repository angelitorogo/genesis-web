import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  GalaxyRegion,
} from '../../domain/sector/galaxy-region';

import {
  type GalaxySectorCoordinates,
} from '../../domain/sector/galaxy-sector-coordinates';

import {
  type GalaxySectorGrid,
} from '../../domain/sector/galaxy-sector-grid';

import {
  GalaxySectorStellarDensity,
} from '../../domain/sector/galaxy-sector-stellar-density';

import {
  type Galaxy,
} from '../../domain/universe/galaxy';

import {
  GalaxyType,
} from '../../domain/universe/galaxy-type';

interface V1StellarDensityProfile {

  readonly radialFalloff:
    number;
}

/**
 * Generates the deterministic structural stellar density of one sector.
 *
 * This generator is a pure Ground Truth calculation:
 *
 * - consumes no random draws;
 * - does not use SectorSeed;
 * - does not persist data;
 * - does not modify discovery state;
 * - does not generate neighboring sectors.
 */
export class GalaxySectorStellarDensityGenerator {

  private constructor() {}

  static generate(
    galaxy:
      Galaxy,

    grid:
      GalaxySectorGrid,

    coordinates:
      GalaxySectorCoordinates,
  ): GalaxySectorStellarDensity {

    if (
      !sameGenerationKey(
        grid.generationKey,
        galaxy.generationKey,
      )
    ) {
      throw new RangeError(
        'Galaxy sector grid must belong to the same UniverseGenerationKey as the galaxy.',
      );
    }

    if (
      grid.galaxyIndex !==
      galaxy.index
    ) {
      throw new RangeError(
        'Galaxy sector grid must belong to the same galaxy index.',
      );
    }

    if (
      !grid.contains(
        coordinates,
      )
    ) {
      throw new RangeError(
        'Sector coordinates are outside this galaxy sector grid.',
      );
    }

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
  ): GalaxySectorStellarDensity {

    const profile =
      this.getV1Profile(
        galaxy.type,
      );

    const radialDistance =
      Math.hypot(
        coordinates.x,
        coordinates.y,
      );

    const normalizedRadius =
      grid
        .halfExtentInSectors ===
        0
        ? 0
        : radialDistance /
          grid
            .halfExtentInSectors;

    const region =
      this.regionForV1(
        normalizedRadius,
      );

    const stellarScale =
      clamp01(
        (
          Math.log10(
            Number(
              galaxy
                .physicalProperties
                .stellarPopulation,
            ),
          ) -
          6
        ) /
          6,
      );

    const radialFactor =
      Math.exp(
        -profile.radialFalloff *
          normalizedRadius,
      );

    const populationFactor =
      0.55 +
      0.45 *
        stellarScale;

    const rawRelativeDensity =
      clamp01(
        radialFactor *
          populationFactor,
      );

    const relativeDensity =
      region ===
      GalaxyRegion.OUTSIDE_NOMINAL
        ? 0
        : rawRelativeDensity;

    return new GalaxySectorStellarDensity(
      region,
      normalizedRadius,
      relativeDensity,
    );
  }

  private static regionForV1(
    normalizedRadius:
      number,
  ): GalaxyRegion {

    if (
      normalizedRadius <
      0.15
    ) {
      return GalaxyRegion.CENTRAL;
    }

    if (
      normalizedRadius <
      0.40
    ) {
      return GalaxyRegion.INNER;
    }

    if (
      normalizedRadius <
      0.70
    ) {
      return GalaxyRegion.MIDDLE;
    }

    if (
      normalizedRadius <=
      1
    ) {
      return GalaxyRegion.OUTER;
    }

    return GalaxyRegion
      .OUTSIDE_NOMINAL;
  }

  private static getV1Profile(
    galaxyType:
      GalaxyType,
  ): V1StellarDensityProfile {

    if (
      galaxyType ===
      GalaxyType.BARRED_SPIRAL
    ) {
      return {
        radialFalloff:
          2.20,
      };
    }

    if (
      galaxyType ===
      GalaxyType.SPIRAL
    ) {
      return {
        radialFalloff:
          2.30,
      };
    }

    if (
      galaxyType ===
      GalaxyType.ELLIPTICAL
    ) {
      return {
        radialFalloff:
          1.80,
      };
    }

    if (
      galaxyType ===
      GalaxyType.IRREGULAR
    ) {
      return {
        radialFalloff:
          1.10,
      };
    }

    if (
      galaxyType ===
      GalaxyType.DWARF
    ) {
      return {
        radialFalloff:
          1.70,
      };
    }

    throw new RangeError(
      `Unsupported GalaxyType: ${galaxyType.code}.`,
    );
  }
}

function sameGenerationKey(
  first:
    Galaxy['generationKey'],

  second:
    Galaxy['generationKey'],
): boolean {

  return (
    first
      .universeSeed
      .normalizedValue ===
      second
        .universeSeed
        .normalizedValue &&
    first
      .generatorVersion ===
      second
        .generatorVersion
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