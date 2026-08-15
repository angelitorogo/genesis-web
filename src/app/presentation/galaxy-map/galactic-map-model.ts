import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxyType,
} from '../../domain/universe/galaxy-type';

import {
  type GalaxyVisualStructure,
} from '../../domain/universe/galaxy-visual-structure';

import {
  type ExternalGalaxyPreliminaryInformation,
} from '../../domain/observation/galaxy/external-galaxy-preliminary-information';

import {
  type GalacticMapDiscoveryMarkers,
} from './galactic-map-discovery-markers';

import {
  type GalacticMapEnvironmentalLayers,
} from './galactic-map-environmental-layers';

import {
  type GalacticMapExplorationCoverage,
} from './galactic-map-exploration-coverage';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

/**
 * Point-10.5 read-only projection for the currently focused galactic map.
 *
 * The public page always receives the safe point-7.6 preliminary observation.
 * Exact renderer-independent visual geometry and the canonical GalaxyType are
 * available only once the active galaxy has reached DISCOVERED or later.
 *
 * Point 10.3 contributes binary sector coverage; point 10.4 persistent object
 * markers; point 10.5 adds thematic marker families plus region/GHZ metadata.
 * All of them are derived read-only projections. No map-specific persistence,
 * marker navigation, relative-position model, LOD or visible-sector
 * materialization is introduced here.
 */
export class GalacticMapModel {

  readonly knowledgeState:
    DiscoveryStateValue;

  readonly galaxyType:
    GalaxyType | null;

  constructor(
    readonly generationKey:
      UniverseGenerationKey,

    readonly galaxyIndex:
      bigint,

    readonly preliminaryInformation:
      ExternalGalaxyPreliminaryInformation,

    readonly visualStructure:
      GalaxyVisualStructure | null,

    galaxyType:
      GalaxyType | null =
        null,

    readonly explorationCoverage:
      GalacticMapExplorationCoverage | null =
        null,

    readonly discoveryMarkers:
      GalacticMapDiscoveryMarkers | null =
        null,

    readonly environmentalLayers:
      GalacticMapEnvironmentalLayers | null =
        null,
  ) {
    assertNonNegativeSignedLong(
      galaxyIndex,
      'galaxyIndex',
    );

    if (
      preliminaryInformation
        .galaxyIndex !==
      galaxyIndex
    ) {
      throw new RangeError(
        'preliminaryInformation must belong to galaxyIndex.',
      );
    }

    const canonicalKnowledgeState =
      DiscoveryState
        .fromCode(
          preliminaryInformation
            .knowledgeState
            .code,
        );

    if (
      !DiscoveryState.isKnown(
        canonicalKnowledgeState,
      )
    ) {
      throw new RangeError(
        'GalacticMapModel requires a known active galaxy.',
      );
    }

    if (
      canonicalKnowledgeState.code <
        DiscoveryState
          .DISCOVERED
          .code &&
      visualStructure !==
        null
    ) {
      throw new RangeError(
        'Detailed GalaxyVisualStructure cannot be exposed before DISCOVERED.',
      );
    }

    if (
      canonicalKnowledgeState.code <
        DiscoveryState
          .DISCOVERED
          .code &&
      galaxyType !==
        null
    ) {
      throw new RangeError(
        'Exact GalaxyType cannot be exposed before DISCOVERED.',
      );
    }

    if (
      canonicalKnowledgeState.code >=
        DiscoveryState
          .DISCOVERED
          .code &&
      visualStructure ===
        null
    ) {
      throw new RangeError(
        'DISCOVERED or later galaxies require their detailed visual structure.',
      );
    }

    assertSnapshotIdentity(
      generationKey,
      galaxyIndex,
      explorationCoverage,
      'explorationCoverage',
    );

    assertSnapshotIdentity(
      generationKey,
      galaxyIndex,
      discoveryMarkers,
      'discoveryMarkers',
    );

    assertSnapshotIdentity(
      generationKey,
      galaxyIndex,
      environmentalLayers,
      'environmentalLayers',
    );

    if (
      canonicalKnowledgeState.code <
        DiscoveryState
          .DISCOVERED
          .code &&
      (
        explorationCoverage !==
          null ||
        discoveryMarkers !==
          null ||
        environmentalLayers !==
          null
      )
    ) {
      throw new RangeError(
        'Detailed cartographic layers cannot be exposed before the detailed galactic map is available.',
      );
    }

    if (
      discoveryMarkers !==
        null &&
      explorationCoverage ===
        null
    ) {
      throw new RangeError(
        'Persistent discovery markers require the point-10.3 exploration coverage grid.',
      );
    }

    if (
      environmentalLayers !==
        null &&
      explorationCoverage ===
        null
    ) {
      throw new RangeError(
        'Point-10.5 environmental layers require the active exploration coverage grid.',
      );
    }

    if (
      discoveryMarkers !==
        null &&
      explorationCoverage !==
        null
    ) {
      assertSameGrid(
        discoveryMarkers.grid,
        explorationCoverage.grid,
        'discoveryMarkers',
      );
    }

    if (
      environmentalLayers !==
        null &&
      explorationCoverage !==
        null
    ) {
      assertSameGrid(
        environmentalLayers.grid,
        explorationCoverage.grid,
        'environmentalLayers',
      );
    }

    this.knowledgeState =
      canonicalKnowledgeState;

    this.galaxyType =
      galaxyType ===
        null
        ? null
        : GalaxyType
            .fromCode(
              galaxyType.code,
            );
  }

  get designationCode():
    string {

    return this
      .preliminaryInformation
      .designationCode;
  }

  get hasDetailedScene():
    boolean {

    return this
      .visualStructure !==
      null;
  }
}

interface GalacticMapGridSnapshot {
  readonly generationKey:
    UniverseGenerationKey;

  readonly galaxyIndex:
    bigint;

  readonly grid:
    {
      readonly minCoordinate:
        number;

      readonly maxCoordinate:
        number;
    };
}

function assertSnapshotIdentity(
  generationKey:
    UniverseGenerationKey,

  galaxyIndex:
    bigint,

  snapshot:
    GalacticMapGridSnapshot | null,

  propertyName:
    string,
): void {

  if (
    snapshot ===
    null
  ) {
    return;
  }

  if (
    !sameGenerationKey(
      generationKey,
      snapshot.generationKey,
    ) ||
    snapshot.galaxyIndex !==
      galaxyIndex
  ) {
    throw new RangeError(
      `${propertyName} must belong to the active generationKey and galaxyIndex.`,
    );
  }
}

function assertSameGrid(
  candidate:
    GalacticMapGridSnapshot['grid'],

  coverage:
    GalacticMapGridSnapshot['grid'],

  propertyName:
    string,
): void {

  if (
    candidate.minCoordinate !==
      coverage.minCoordinate ||
    candidate.maxCoordinate !==
      coverage.maxCoordinate
  ) {
    throw new RangeError(
      `${propertyName} and explorationCoverage must use the same active galaxy grid.`,
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

function assertNonNegativeSignedLong(
  value:
    bigint,

  propertyName:
    string,
): void {

  if (
    typeof value !==
      'bigint' ||
    value <
      0n ||
    value >
      SIGNED_LONG_MAX
  ) {
    throw new RangeError(
      `${propertyName} must be a non-negative signed Long: ${String(value)}.`,
    );
  }
}
