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

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

/**
 * Point-10.1 read-only projection for the currently focused galactic map.
 *
 * The public page always receives the safe point-7.6 preliminary observation.
 * Exact renderer-independent visual geometry and the canonical GalaxyType are
 * available only once the active galaxy has reached DISCOVERED or a later
 * knowledge state.
 *
 * The model contains no sector content, markers, selectable targets, LOD data,
 * camera controls, physical star entities or persistence mutations.
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
        'DISCOVERED or later galaxies require their visual structure in point 10.1.',
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
