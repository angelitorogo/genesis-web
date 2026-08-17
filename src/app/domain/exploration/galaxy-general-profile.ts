import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../discovery/discovery-state';

import {
  type ExternalGalaxyPreliminaryInformation,
} from '../observation/galaxy/external-galaxy-preliminary-information';

import {
  GalaxyType,
} from '../universe/galaxy-type';

import {
  GalaxyKnowledgeState,
  type GalaxyKnowledgeStateValue,
} from './galaxy-knowledge-state';

/**
 * Point-11.3 knowledge-safe general profile for one known galaxy.
 *
 * This is a read-only projection. It deliberately composes the already-frozen
 * point-7.6 preliminary observation with the point-11.2 identity gate:
 *
 * - DETECTED: preliminary information only; no proper name or exact GalaxyType.
 * - DISCOVERED or later: proper name and exact GalaxyType may be exposed.
 *
 * Exact physical Ground Truth (age, diameter, mass, exact stellar population,
 * metallicity, SFR, SMBH mass, etc.) is intentionally outside this model.
 */
export class GalaxyGeneralProfile {

  readonly knowledgeState:
    DiscoveryStateValue;

  readonly galaxyKnowledgeState:
    GalaxyKnowledgeStateValue;

  readonly galaxyType:
    GalaxyType | null;

  constructor(
    readonly preliminaryInformation:
      ExternalGalaxyPreliminaryInformation,

    readonly knownName:
      string | null,

    galaxyType:
      GalaxyType | null,
  ) {
    const canonicalKnowledgeState =
      DiscoveryState
        .fromCode(
          preliminaryInformation
            .knowledgeState
            .code,
        );

    const galaxyKnowledgeState =
      GalaxyKnowledgeState
        .fromDiscoveryState(
          canonicalKnowledgeState,
        );

    if (
      galaxyKnowledgeState ===
      GalaxyKnowledgeState.UNKNOWN
    ) {
      throw new RangeError(
        'GalaxyGeneralProfile requires a known galaxy.',
      );
    }

    if (
      knownName !==
        null &&
      knownName
        .trim()
        .length ===
        0
    ) {
      throw new RangeError(
        'knownName must be null or non-blank.',
      );
    }

    if (
      galaxyKnowledgeState ===
      GalaxyKnowledgeState.DETECTED
    ) {
      if (
        knownName !==
        null
      ) {
        throw new RangeError(
          'A DETECTED galaxy cannot expose its proper name.',
        );
      }

      if (
        galaxyType !==
        null
      ) {
        throw new RangeError(
          'A DETECTED galaxy cannot expose its exact GalaxyType.',
        );
      }
    } else {
      if (
        knownName ===
          null
      ) {
        throw new RangeError(
          'A DISCOVERED or VISITED galaxy requires its known proper name.',
        );
      }

      if (
        galaxyType ===
          null
      ) {
        throw new RangeError(
          'A DISCOVERED or VISITED galaxy requires its exact GalaxyType.',
        );
      }
    }

    this.knowledgeState =
      canonicalKnowledgeState;

    this.galaxyKnowledgeState =
      galaxyKnowledgeState;

    this.galaxyType =
      galaxyType ===
        null
        ? null
        : GalaxyType
            .fromCode(
              galaxyType.code,
            );
  }

  get galaxyIndex():
    bigint {

    return this
      .preliminaryInformation
      .galaxyIndex;
  }

  get designationCode():
    string {

    return this
      .preliminaryInformation
      .designationCode;
  }

  get hasKnownIdentity():
    boolean {

    return this
      .knownName !==
      null;
  }
}
