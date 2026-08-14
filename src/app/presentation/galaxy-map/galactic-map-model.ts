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
  type GalacticMapExplorationCoverage,
} from './galactic-map-exploration-coverage';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

/**
 * Point-10.4 read-only projection for the currently focused galactic map.
 *
 * The public page always receives the safe point-7.6 preliminary observation.
 * Exact renderer-independent visual geometry and the canonical GalaxyType are
 * available only once the active galaxy has reached DISCOVERED or a later
 * knowledge state.
 *
 * Point 10.3 contributes binary explored/unexplored sector coverage. Point
 * 10.4 additionally exposes persistent object markers reconstructed from the
 * KnownDiscovery snapshot. Marker placement is still read-only and contains no
 * layer toggles, marker navigation, LOD, visible-sector materialization or
 * persistence mutation.
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

    if (
      explorationCoverage !==
        null &&
      (
        !sameGenerationKey(
          generationKey,
          explorationCoverage
            .generationKey,
        ) ||
        explorationCoverage
          .galaxyIndex !==
          galaxyIndex
      )
    ) {
      throw new RangeError(
        'explorationCoverage must belong to the active generationKey and galaxyIndex.',
      );
    }

    if (
      canonicalKnowledgeState.code <
        DiscoveryState
          .DISCOVERED
          .code &&
      explorationCoverage !==
        null
    ) {
      throw new RangeError(
        'Exploration coverage cannot be exposed before the detailed galactic map is available.',
      );
    }

    if (
      discoveryMarkers !==
        null &&
      (
        !sameGenerationKey(
          generationKey,
          discoveryMarkers
            .generationKey,
        ) ||
        discoveryMarkers
          .galaxyIndex !==
          galaxyIndex
      )
    ) {
      throw new RangeError(
        'discoveryMarkers must belong to the active generationKey and galaxyIndex.',
      );
    }

    if (
      canonicalKnowledgeState.code <
        DiscoveryState
          .DISCOVERED
          .code &&
      discoveryMarkers !==
        null
    ) {
      throw new RangeError(
        'Persistent discovery markers cannot be exposed before the detailed galactic map is available.',
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
      discoveryMarkers !==
        null &&
      explorationCoverage !==
        null &&
      (
        discoveryMarkers
          .grid
          .minCoordinate !==
          explorationCoverage
            .grid
            .minCoordinate ||
        discoveryMarkers
          .grid
          .maxCoordinate !==
          explorationCoverage
            .grid
            .maxCoordinate
      )
    ) {
      throw new RangeError(
        'discoveryMarkers and explorationCoverage must use the same active galaxy grid.',
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
