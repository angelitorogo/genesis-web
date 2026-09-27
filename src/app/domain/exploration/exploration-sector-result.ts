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

export type ExplorationLocatedTargetLocator =
  SystemLocator |
  GalacticObjectLocator;

/**
 * One real static Ground Truth object revealed by a sector exploration.
 *
 * The kind is deliberately still the coarse exploration family. Formal
 * scientific classification remains a later discovery/observation concern.
 */
export interface ExplorationLocatedTarget {
  readonly kind:
    ExplorationLocatedResultKind;

  readonly locator:
    ExplorationLocatedTargetLocator;
}

/**
 * Point-9.4 resolved exploration result.
 *
 * Since the multi-target exploration update, one sector scan reveals every
 * static Ground Truth locator that already exists in GalaxySectorContent.
 * `resultKind` + `subject` remain as the deterministic highlighted result so
 * existing observation/UI contracts do not need a parallel result model.
 *
 * `locatedTargets` is the authoritative collection that point 9.5 persists to
 * DETECTED. A transient can therefore be the highlighted signal while the same
 * scan still reveals static objects present in the sector.
 */
export class ExplorationSectorResult {

  readonly locatedTargets:
    readonly ExplorationLocatedTarget[];

  constructor(
    readonly scanResult:
      ExplorationSectorScanResult,

    readonly resultKind:
      ExplorationResultKind,

    readonly subject:
      ExplorationResultSubject,

    locatedTargets?:
      readonly ExplorationLocatedTarget[],
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
    } else {
      if (
        !(subject instanceof
          LocatedObservationObject)
      ) {
        throw new TypeError(
          'Static point-9.4 results must use a LocatedObservationObject.',
        );
      }

      assertKindMatchesLocator(
        resultKind,
        assertSupportedLocatedLocator(
          subject.targetLocator,
        ),
      );

      assertLocatorBelongsToScan(
        assertSupportedLocatedLocator(
          subject.targetLocator,
        ),
        scanResult,
      );
    }

    const canonicalTargets =
      locatedTargets ===
      undefined
        ? defaultLocatedTargets(
            resultKind,
            subject,
          )
        : locatedTargets;

    const unique =
      new Set<string>();

    for (
      const target
      of canonicalTargets
    ) {
      assertKindMatchesLocator(
        target.kind,
        target.locator,
      );

      assertLocatorBelongsToScan(
        target.locator,
        scanResult,
      );

      const identity =
        locatedTargetIdentity(
          target.locator,
        );

      if (
        unique.has(
          identity,
        )
      ) {
        throw new RangeError(
          `ExplorationSectorResult cannot contain duplicate located target ${identity}.`,
        );
      }

      unique.add(
        identity,
      );
    }

    if (
      subject instanceof
        LocatedObservationObject
    ) {
      const primaryLocator =
        assertSupportedLocatedLocator(
          subject.targetLocator,
        );

      const primaryIdentity =
        locatedTargetIdentity(
          primaryLocator,
        );

      const primaryEntry =
        canonicalTargets
          .find(
            target =>
              locatedTargetIdentity(
                target.locator,
              ) ===
              primaryIdentity,
          );

      if (
        primaryEntry ===
        undefined ||
        primaryEntry.kind !==
          resultKind
      ) {
        throw new RangeError(
          'The highlighted static result must be included in locatedTargets with the same result kind.',
        );
      }
    }

    this.locatedTargets =
      Object.freeze(
        canonicalTargets
          .map(
            target =>
              Object.freeze({
                kind:
                  target.kind,

                locator:
                  target.locator,
              }),
          ),
      );
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
    ExplorationLocatedTargetLocator |
    null {

    if (
      !(this.subject instanceof
        LocatedObservationObject)
    ) {
      return null;
    }

    return assertSupportedLocatedLocator(
      this.subject
        .targetLocator,
    );
  }

  get targetLocators():
    readonly ExplorationLocatedTargetLocator[] {

    return Object.freeze(
      this
        .locatedTargets
        .map(
          target =>
            target.locator,
        ),
    );
  }

  get locatedTargetCount():
    number {

    return this
      .locatedTargets
      .length;
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

function defaultLocatedTargets(
  resultKind:
    ExplorationResultKind,

  subject:
    ExplorationResultSubject,
): readonly ExplorationLocatedTarget[] {

  if (
    !(subject instanceof
      LocatedObservationObject)
  ) {
    return Object.freeze([]);
  }

  if (
    resultKind ===
      ExplorationResultKind
        .TRANSIENT_EVENT
  ) {
    throw new TypeError(
      'TRANSIENT_EVENT cannot use a located observation subject.',
    );
  }

  return Object.freeze([
    Object.freeze({
      kind:
        resultKind,

      locator:
        assertSupportedLocatedLocator(
          subject.targetLocator,
        ),
    }),
  ]);
}

function assertSupportedLocatedLocator(
  locator:
    LocatedObservationObject[
      'targetLocator'
    ],
): ExplorationLocatedTargetLocator {

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

function assertKindMatchesLocator(
  kind:
    ExplorationLocatedResultKind,

  locator:
    ExplorationLocatedTargetLocator,
): void {

  if (
    kind ===
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

    return;
  }

  if (
    !(locator instanceof
      GalacticObjectLocator)
  ) {
    throw new TypeError(
      'Galactic point-9.4 result must be backed by a GalacticObjectLocator.',
    );
  }
}

function assertLocatorBelongsToScan(
  locator:
    ExplorationLocatedTargetLocator,

  scanResult:
    ExplorationSectorScanResult,
): void {

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

function locatedTargetIdentity(
  locator:
    ExplorationLocatedTargetLocator,
): string {

  return [
    locator instanceof
      SystemLocator
      ? 'SYSTEM'
      : 'GALACTIC_OBJECT',
    locator.galaxyIndex.toString(),
    locator.sectorKey.toString(),
    locator.galacticObjectIndex.toString(),
  ].join(':');
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
