import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../discovery/discovery-state';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

/**
 * Broad preliminary morphology hint for an already detected external galaxy.
 *
 * BARRED_SPIRAL and SPIRAL deliberately collapse to DISK_LIKE so preliminary
 * observation does not leak exact Ground Truth morphology.
 */
export enum ExternalGalaxyMorphologyHint {
  DISK_LIKE =
    'DISK_LIKE',

  SPHEROIDAL =
    'SPHEROIDAL',

  IRREGULAR =
    'IRREGULAR',

  DWARF_LIKE =
    'DWARF_LIKE',
}

/**
 * Preliminary physical-scale hint.
 *
 * Exact diameter is intentionally not exposed.
 */
export enum ExternalGalaxyScaleHint {
  COMPACT =
    'COMPACT',

  MEDIUM =
    'MEDIUM',

  LARGE =
    'LARGE',

  EXTENDED =
    'EXTENDED',
}

/**
 * Preliminary stellar-population hint.
 *
 * Exact stellar population is intentionally not exposed.
 */
export enum ExternalGalaxyStellarPopulationHint {
  LOW =
    'LOW',

  MODERATE =
    'MODERATE',

  HIGH =
    'HIGH',

  VERY_HIGH =
    'VERY_HIGH',
}

/**
 * Preliminary nuclear-activity hint.
 *
 * AGN and QUASAR Ground Truth are exposed only as candidates.
 */
export enum ExternalGalaxyNuclearActivityHint {
  NO_CLEAR_ACTIVITY =
    'NO_CLEAR_ACTIVITY',

  ACTIVE_NUCLEUS_CANDIDATE =
    'ACTIVE_NUCLEUS_CANDIDATE',

  EXTREME_NUCLEUS_CANDIDATE =
    'EXTREME_NUCLEUS_CANDIDATE',
}

/**
 * Preliminary observational projection for a galaxy already known from
 * DiscoveryState.DETECTED onwards.
 *
 * This model deliberately exposes only:
 *
 * - procedural designation code;
 * - morphology hint;
 * - scale hint;
 * - stellar population hint;
 * - nuclear activity hint.
 *
 * It does NOT expose Galaxy, GalaxySeed, proper name, exact age, exact
 * diameter, exact mass, exact stellar population, metallicity, star formation
 * rate, SMBH mass, distance, redshift or intergalactic coordinates.
 *
 * It also does not imply navigation unlock or active-galaxy selection.
 */
export class ExternalGalaxyPreliminaryInformation {

  constructor(
    readonly galaxyIndex:
      bigint,

    readonly designationCode:
      string,

    readonly knowledgeState:
      DiscoveryStateValue,

    readonly morphologyHint:
      ExternalGalaxyMorphologyHint,

    readonly scaleHint:
      ExternalGalaxyScaleHint,

    readonly stellarPopulationHint:
      ExternalGalaxyStellarPopulationHint,

    readonly nuclearActivityHint:
      ExternalGalaxyNuclearActivityHint,
  ) {
    if (
      galaxyIndex <
        0n ||
      galaxyIndex >
        SIGNED_LONG_MAX
    ) {
      throw new RangeError(
        `galaxyIndex must be a non-negative signed Long: ${galaxyIndex}.`,
      );
    }

    if (
      designationCode
        .trim()
        .length ===
      0
    ) {
      throw new RangeError(
        'designationCode must not be blank.',
      );
    }

    const canonicalKnowledgeState =
      DiscoveryState
        .fromCode(
          knowledgeState.code,
        );

    if (
      canonicalKnowledgeState.code <
      DiscoveryState.DETECTED.code
    ) {
      throw new RangeError(
        'knowledgeState must be >= DETECTED.',
      );
    }

    if (
      !Object.values(
        ExternalGalaxyMorphologyHint,
      ).includes(
        morphologyHint,
      )
    ) {
      throw new RangeError(
        `Unknown ExternalGalaxyMorphologyHint: ${String(morphologyHint)}.`,
      );
    }

    if (
      !Object.values(
        ExternalGalaxyScaleHint,
      ).includes(
        scaleHint,
      )
    ) {
      throw new RangeError(
        `Unknown ExternalGalaxyScaleHint: ${String(scaleHint)}.`,
      );
    }

    if (
      !Object.values(
        ExternalGalaxyStellarPopulationHint,
      ).includes(
        stellarPopulationHint,
      )
    ) {
      throw new RangeError(
        `Unknown ExternalGalaxyStellarPopulationHint: ${String(stellarPopulationHint)}.`,
      );
    }

    if (
      !Object.values(
        ExternalGalaxyNuclearActivityHint,
      ).includes(
        nuclearActivityHint,
      )
    ) {
      throw new RangeError(
        `Unknown ExternalGalaxyNuclearActivityHint: ${String(nuclearActivityHint)}.`,
      );
    }
  }
}
