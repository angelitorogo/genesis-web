import {
  GalacticObjectLocator,
  SystemLocator,
} from '../generation/procedural-locator';

import {
  LocatedObservationObject,
  ObservationTransientCandidate,
  type ObservationTransientCandidateId,
} from '../observation/observation-classification';

import {
  type ExplorationSectorScanResult,
} from './exploration-sector-scan';

export const ExplorationResultKind =
  Object.freeze({
    SYSTEM:
      'SYSTEM',

    NEBULA:
      'NEBULA',

    STAR_CLUSTER:
      'STAR_CLUSTER',

    EXTREME_OBJECT:
      'EXTREME_OBJECT',

    TRANSIENT_EVENT:
      'TRANSIENT_EVENT',
  } as const);

export type ExplorationResultKind =
  typeof ExplorationResultKind[
    keyof typeof ExplorationResultKind
  ];

export type ExplorationLocatedResultKind =
  Exclude<
    ExplorationResultKind,
    typeof ExplorationResultKind.TRANSIENT_EVENT
  >;

export type ExplorationResultSubject =
  LocatedObservationObject |
  ObservationTransientCandidate;

/**
 * Point-9.4 resolved exploration result.
 *
 * This model deliberately separates a coarse gameplay result family from the
 * formal point-8.9 scientific classification. A result can therefore be
 * presented as SYSTEM / NEBULA / STAR_CLUSTER / EXTREME_OBJECT /
 * TRANSIENT_EVENT while the scan remains scientifically Unclassified.
 *
 * Static results are backed by existing Ground Truth locators:
 * - SYSTEM -> SystemLocator
 * - NEBULA / STAR_CLUSTER / EXTREME_OBJECT -> GalacticObjectLocator
 *
 * Event results reuse the existing point-8.9 transient subject contract and
 * never invent a TransientLocator.
 */
export class ExplorationSectorResult {

  constructor(
    readonly scanResult:
      ExplorationSectorScanResult,

    readonly resultKind:
      ExplorationResultKind,

    readonly subject:
      ExplorationResultSubject,
  ) {
    if (
      !Object.values(
        ExplorationResultKind,
      ).includes(
        resultKind,
      )
    ) {
      throw new RangeError(
        `Unknown ExplorationResultKind: ${String(resultKind)}.`,
      );
    }

    if (
      !sameGenerationKey(
        scanResult
          .selection
          .generationKey,
        subject
          .generationKey,
      )
    ) {
      throw new RangeError(
        'Result subject must belong to the scan UniverseGenerationKey.',
      );
    }

    if (
      resultKind ===
        ExplorationResultKind
          .TRANSIENT_EVENT
    ) {
      if (
        !(subject instanceof
          ObservationTransientCandidate)
      ) {
        throw new TypeError(
          'TRANSIENT_EVENT must use an ObservationTransientCandidate.',
        );
      }

      return;
    }

    if (
      !(subject instanceof
        LocatedObservationObject)
    ) {
      throw new TypeError(
        'Static point-9.4 results must use a LocatedObservationObject.',
      );
    }

    const locator =
      subject
        .targetLocator;

    if (
      resultKind ===
        ExplorationResultKind
          .SYSTEM
    ) {
      if (
        !(locator instanceof
          SystemLocator)
      ) {
        throw new TypeError(
          'SYSTEM result must be backed by a SystemLocator.',
        );
      }
    } else if (
      !(locator instanceof
        GalacticObjectLocator)
    ) {
      throw new TypeError(
        'Galactic point-9.4 result must be backed by a GalacticObjectLocator.',
      );
    }

    if (
      locator
        .galaxyIndex !==
        scanResult
          .selection
          .galaxyIndex ||
      locator
        .sectorKey !==
        scanResult
          .selection
          .sectorLocator
          .sectorKey
    ) {
      throw new RangeError(
        'Located result must belong to the scanned sector.',
      );
    }
  }

  get isLocated():
    boolean {

    return this
      .subject instanceof
      LocatedObservationObject;
  }

  get isTransient():
    boolean {

    return this
      .subject instanceof
      ObservationTransientCandidate;
  }

  get targetLocator():
    SystemLocator |
    GalacticObjectLocator |
    null {

    if (
      !(this.subject instanceof
        LocatedObservationObject)
    ) {
      return null;
    }

    const locator =
      this
        .subject
        .targetLocator;

    if (
      locator instanceof
        SystemLocator ||
      locator instanceof
        GalacticObjectLocator
    ) {
      return locator;
    }

    throw new TypeError(
      'Point-9.4 located subject has an unsupported locator.',
    );
  }

  get transientCandidateId():
    ObservationTransientCandidateId |
    null {

    return this
      .subject instanceof
        ObservationTransientCandidate
      ? this
          .subject
          .candidateId
      : null;
  }
}

function sameGenerationKey(
  left:
    ExplorationSectorScanResult[
      'selection'
    ][
      'generationKey'
    ],

  right:
    ExplorationResultSubject[
      'generationKey'
    ],
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
