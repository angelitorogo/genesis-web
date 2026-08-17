import {
  GalacticHabitabilityBand,
  GalacticHabitabilityModelStatus,
} from '../../domain/habitability/galactic-habitability-profile';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxySectorCoordinates,
} from '../../domain/sector/galaxy-sector-coordinates';

import {
  type GalaxySectorGrid,
} from '../../domain/sector/galaxy-sector-grid';

import {
  type Galaxy,
} from '../../domain/universe/galaxy';

import {
  type GalaxyVisualStructure,
} from '../../domain/universe/galaxy-visual-structure';

import {
  GalacticHabitabilityProfileGenerator,
} from '../../simulation/habitability/galactic-habitability-profile-generator';

import {
  PlanetFormationProfileGenerator,
} from '../../simulation/planetary/planet-formation-profile-generator';

import {
  GalaxySectorStellarDensityGenerator,
} from '../../simulation/sector/galaxy-sector-stellar-density-generator';

import {
  GalaxySectorStellarPopulationPropertiesGenerator,
} from '../../simulation/sector/galaxy-sector-stellar-population-properties-generator';

import {
  StellarPopulationProfileGenerator,
} from '../../simulation/stellar/stellar-population-profile-generator';

export interface GalacticMapRegionRadii {
  readonly centralOuterRadiusNormalized:
    number;

  readonly innerOuterRadiusNormalized:
    number;

  readonly middleOuterRadiusNormalized:
    number;

  readonly nominalOuterRadiusNormalized:
    number;
}

export type GalacticMapHabitableBand =
  typeof GalacticHabitabilityBand.FAVORED |
  typeof GalacticHabitabilityBand.HIGH_POTENTIAL;

export class GalacticMapHabitabilityRing {

  constructor(
    readonly innerRadiusNormalized:
      number,

    readonly outerRadiusNormalized:
      number,

    readonly band:
      GalacticMapHabitableBand,
  ) {
    assertNormalizedRadius(
      innerRadiusNormalized,
      'innerRadiusNormalized',
    );

    assertNormalizedRadius(
      outerRadiusNormalized,
      'outerRadiusNormalized',
    );

    if (
      outerRadiusNormalized <=
        innerRadiusNormalized
    ) {
      throw new RangeError(
        'Habitability ring outer radius must be greater than its inner radius.',
      );
    }

    if (
      band !==
        GalacticHabitabilityBand
          .FAVORED &&
      band !==
        GalacticHabitabilityBand
          .HIGH_POTENTIAL
    ) {
      throw new RangeError(
        `Unsupported map habitability band: ${String(band)}.`,
      );
    }
  }
}

/**
 * Read-only point-10.5 environmental map projection.
 *
 * Region boundaries come directly from the already-known GalaxyVisualStructure.
 * The Galactic Habitable Zone is a cartographic projection of the existing
 * SPECULATIVE_SIMPLIFIED V1 habitability model. It exposes only radial bands,
 * never raw sector Ground Truth, stars, systems, planets or life.
 */
export class GalacticMapEnvironmentalLayers {

  readonly regionRadii:
    GalacticMapRegionRadii;

  readonly habitabilityRings:
    readonly GalacticMapHabitabilityRing[];

  constructor(
    readonly generationKey:
      UniverseGenerationKey,

    readonly galaxyIndex:
      bigint,

    readonly grid:
      GalaxySectorGrid,

    regionRadii:
      GalacticMapRegionRadii,

    readonly habitabilityModelStatus:
      GalacticHabitabilityModelStatus,

    habitabilityRings:
      readonly GalacticMapHabitabilityRing[],

    readonly radialSampleCount:
      number,
  ) {
    if (
      !sameGenerationKey(
        generationKey,
        grid.generationKey,
      )
    ) {
      throw new RangeError(
        'GalacticMapEnvironmentalLayers grid must belong to generationKey.',
      );
    }

    if (
      grid.galaxyIndex !==
      galaxyIndex
    ) {
      throw new RangeError(
        'GalacticMapEnvironmentalLayers grid must belong to galaxyIndex.',
      );
    }

    assertRegionRadii(
      regionRadii,
    );

    if (
      habitabilityModelStatus !==
      GalacticHabitabilityModelStatus
        .SPECULATIVE_SIMPLIFIED
    ) {
      throw new RangeError(
        `Unsupported galactic habitability model status: ${String(habitabilityModelStatus)}.`,
      );
    }

    if (
      !Number.isInteger(
        radialSampleCount,
      ) ||
      radialSampleCount <=
        0
    ) {
      throw new RangeError(
        'radialSampleCount must be a positive integer.',
      );
    }

    const canonicalRings =
      [
        ...habitabilityRings,
      ]
        .sort(
          (
            left,
            right,
          ) =>
            left.innerRadiusNormalized -
              right.innerRadiusNormalized ||
            left.outerRadiusNormalized -
              right.outerRadiusNormalized,
        );

    for (
      let index =
        1;
      index <
        canonicalRings.length;
      index +=
        1
    ) {
      if (
        canonicalRings[
          index
        ].innerRadiusNormalized <
        canonicalRings[
          index -
          1
        ].outerRadiusNormalized
      ) {
        throw new RangeError(
          'Galactic habitability rings cannot overlap.',
        );
      }
    }

    this.regionRadii =
      Object.freeze({
        ...regionRadii,
      });

    this.habitabilityRings =
      Object.freeze(
        canonicalRings,
      );
  }

  get hasHabitableZone():
    boolean {

    return this
      .habitabilityRings
      .length >
      0;
  }
}

/**
 * Builds the point-10.5 region and GHZ projection without enumerating the full
 * 2D sector grid.
 *
 * V1 environmental generators are radially symmetric: their sector-scale
 * inputs depend on the normalized galactocentric radius plus the galaxy-wide
 * physical baseline. Therefore one integer radial spoke from x=0 to the
 * nominal edge is sufficient to identify the same annular band transitions
 * that a full 173x173 Caeloria scan would produce, while avoiding unnecessary
 * sector materialization before 10.8/10.9.
 */
export function buildGalacticMapEnvironmentalLayers(
  galaxy:
    Galaxy,

  grid:
    GalaxySectorGrid,

  visualStructure:
    GalaxyVisualStructure,
): GalacticMapEnvironmentalLayers {

  if (
    !sameGenerationKey(
      galaxy.generationKey,
      grid.generationKey,
    ) ||
    grid.galaxyIndex !==
      galaxy.index
  ) {
    throw new RangeError(
      'Environmental map layers require the active galaxy and its canonical grid.',
    );
  }

  const halfExtent =
    grid.halfExtentInSectors;

  const radialSampleCount =
    halfExtent +
    1;

  const samples:
    RadialHabitabilitySample[] =
    [];

  for (
    let radialIndex =
      0;
    radialIndex <=
      halfExtent;
    radialIndex +=
      1
  ) {
    const coordinates =
      new GalaxySectorCoordinates(
        radialIndex,
        0,
      );

    const stellarDensity =
      GalaxySectorStellarDensityGenerator
        .generate(
          galaxy,
          grid,
          coordinates,
        );

    const sectorStellarPopulation =
      GalaxySectorStellarPopulationPropertiesGenerator
        .generate(
          galaxy,
          stellarDensity,
        );

    const planetFormation =
      PlanetFormationProfileGenerator
        .generate(
          galaxy.generationKey,
          sectorStellarPopulation,
        );

    const stellarPopulation =
      StellarPopulationProfileGenerator
        .generate(
          galaxy.generationKey,
          galaxy.physicalProperties,
          sectorStellarPopulation,
        );

    const habitability =
      GalacticHabitabilityProfileGenerator
        .generate(
          galaxy.generationKey,
          stellarDensity,
          planetFormation,
          stellarPopulation,
        );

    samples.push({
      radialIndex,
      band:
        habitability.band,
      modelStatus:
        habitability.modelStatus,
    });
  }

  const modelStatus =
    samples[
      0
    ].modelStatus;

  if (
    samples.some(
      (
        sample,
      ) =>
        sample.modelStatus !==
        modelStatus,
    )
  ) {
    throw new RangeError(
      'Galactic habitability radial samples must use one model status.',
    );
  }

  return new GalacticMapEnvironmentalLayers(
    galaxy.generationKey,
    galaxy.index,
    grid,
    {
      centralOuterRadiusNormalized:
        visualStructure
          .regions
          .centralOuterRadiusNormalized,

      innerOuterRadiusNormalized:
        visualStructure
          .regions
          .innerOuterRadiusNormalized,

      middleOuterRadiusNormalized:
        visualStructure
          .regions
          .middleOuterRadiusNormalized,

      nominalOuterRadiusNormalized:
        visualStructure
          .regions
          .nominalOuterRadiusNormalized,
    },
    modelStatus,
    habitabilityRingsFromSamples(
      samples,
      halfExtent,
    ),
    radialSampleCount,
  );
}

interface RadialHabitabilitySample {
  readonly radialIndex:
    number;

  readonly band:
    GalacticHabitabilityBand;

  readonly modelStatus:
    GalacticHabitabilityModelStatus;
}

function habitabilityRingsFromSamples(
  samples:
    readonly RadialHabitabilitySample[],

  halfExtent:
    number,
): readonly GalacticMapHabitabilityRing[] {

  const rings:
    GalacticMapHabitabilityRing[] =
    [];

  let activeBand:
    GalacticMapHabitableBand | null =
    null;

  let activeStart =
    0;

  for (
    let index =
      0;
    index <
      samples.length;
    index +=
      1
  ) {
    const sample =
      samples[
        index
      ];

    const mappedBand =
      mapHabitableBand(
        sample.band,
      );

    if (
      mappedBand ===
      activeBand
    ) {
      continue;
    }

    if (
      activeBand !==
      null
    ) {
      rings.push(
        new GalacticMapHabitabilityRing(
          sampleBoundaryRadius(
            activeStart,
            halfExtent,
          ),
          sampleBoundaryRadius(
            index,
            halfExtent,
          ),
          activeBand,
        ),
      );
    }

    activeBand =
      mappedBand;

    activeStart =
      index;
  }

  if (
    activeBand !==
    null
  ) {
    rings.push(
      new GalacticMapHabitabilityRing(
        sampleBoundaryRadius(
          activeStart,
          halfExtent,
        ),
        1,
        activeBand,
      ),
    );
  }

  return Object.freeze(
    rings,
  );
}

function mapHabitableBand(
  band:
    GalacticHabitabilityBand,
): GalacticMapHabitableBand | null {

  if (
    band ===
    GalacticHabitabilityBand
      .FAVORED
  ) {
    return GalacticHabitabilityBand
      .FAVORED;
  }

  if (
    band ===
    GalacticHabitabilityBand
      .HIGH_POTENTIAL
  ) {
    return GalacticHabitabilityBand
      .HIGH_POTENTIAL;
  }

  return null;
}

function sampleBoundaryRadius(
  sampleIndex:
    number,

  halfExtent:
    number,
): number {

  if (
    halfExtent ===
    0
  ) {
    return sampleIndex ===
      0
      ? 0
      : 1;
  }

  return Math.min(
    1,
    Math.max(
      0,
      (
        sampleIndex -
        0.5
      ) /
        halfExtent,
    ),
  );
}

function assertRegionRadii(
  radii:
    GalacticMapRegionRadii,
): void {

  const values = [
    radii.centralOuterRadiusNormalized,
    radii.innerOuterRadiusNormalized,
    radii.middleOuterRadiusNormalized,
    radii.nominalOuterRadiusNormalized,
  ];

  for (
    let index =
      0;
    index <
      values.length;
    index +=
      1
  ) {
    assertNormalizedRadius(
      values[
        index
      ],
      `regionRadii[${index}]`,
    );

    if (
      index >
        0 &&
      values[
        index
      ] <=
        values[
          index -
          1
        ]
    ) {
      throw new RangeError(
        'Galactic region radii must be strictly increasing.',
      );
    }
  }
}

function assertNormalizedRadius(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0 ||
    value >
      1
  ) {
    throw new RangeError(
      `${propertyName} must be finite and belong to [0, 1].`,
    );
  }
}

function sameGenerationKey(
  left:
    UniverseGenerationKey,

  right:
    UniverseGenerationKey,
): boolean {

  return (
    left
      .generatorVersion
      .code ===
      right
        .generatorVersion
        .code &&
    left
      .universeSeed
      .serialize() ===
      right
        .universeSeed
        .serialize()
  );
}
