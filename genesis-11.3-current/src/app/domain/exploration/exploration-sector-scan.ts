import {
  SectorLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  ObservationClassification,
} from '../observation/observation-classification';

import {
  GalaxySectorCoordinates,
} from '../sector/galaxy-sector-coordinates';

import {
  GalaxySectorKeyCodec,
} from '../sector/galaxy-sector-key-codec';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

const SIGNED_INT32_MIN =
  -2_147_483_648;

const SIGNED_INT32_MAX =
  2_147_483_647;

export const ExplorationDetectionKind =
  Object.freeze({
    SIGNAL:
      'SIGNAL',

    ANOMALY:
      'ANOMALY',
  } as const);

export type ExplorationDetectionKind =
  typeof ExplorationDetectionKind[
    keyof typeof ExplorationDetectionKind
  ];

/**
 * Point-9.3 selected sector inside the currently focused galaxy grid.
 *
 * It contains only procedural addressing and the visible grid bounds needed
 * by the exploration UI. It is not a discovery and it persists nothing.
 */
export class ExplorationSectorSelection {

  readonly coordinates:
    GalaxySectorCoordinates;

  constructor(
    readonly generationKey:
      UniverseGenerationKey,

    readonly galaxyIndex:
      bigint,

    readonly sectorX:
      number,

    readonly sectorY:
      number,

    readonly minCoordinate:
      number,

    readonly maxCoordinate:
      number,

    readonly sectorLocator:
      SectorLocator,
  ) {
    assertNonNegativeSignedLong(
      galaxyIndex,
      'galaxyIndex',
    );

    assertInt32(
      minCoordinate,
      'minCoordinate',
    );

    assertInt32(
      maxCoordinate,
      'maxCoordinate',
    );

    if (
      minCoordinate >
      maxCoordinate
    ) {
      throw new RangeError(
        'minCoordinate must be <= maxCoordinate.',
      );
    }

    this.coordinates =
      new GalaxySectorCoordinates(
        sectorX,
        sectorY,
      );

    if (
      sectorX <
        minCoordinate ||
      sectorX >
        maxCoordinate ||
      sectorY <
        minCoordinate ||
      sectorY >
        maxCoordinate
    ) {
      throw new RangeError(
        [
          'Selected sector coordinates are outside the active galaxy grid:',
          `x=${sectorX},`,
          `y=${sectorY},`,
          `range=${minCoordinate}..${maxCoordinate}.`,
        ].join(
          ' ',
        ),
      );
    }

    if (
      !(sectorLocator instanceof
        SectorLocator)
    ) {
      throw new TypeError(
        'sectorLocator must be a canonical SectorLocator.',
      );
    }

    if (
      sectorLocator
        .galaxyIndex !==
      galaxyIndex
    ) {
      throw new RangeError(
        'sectorLocator must belong to galaxyIndex.',
      );
    }

    const expectedSectorKey =
      GalaxySectorKeyCodec
        .encode(
          this.coordinates,
        );

    if (
      sectorLocator
        .sectorKey !==
      expectedSectorKey
    ) {
      throw new RangeError(
        'sectorLocator.sectorKey must match the selected coordinates.',
      );
    }
  }
}

/**
 * Point-9.3 coarse scan result.
 *
 * The scan deliberately stops before point 9.4. Therefore it exposes only:
 * - the selected sector;
 * - whether the scan produced a SIGNAL or ANOMALY cue;
 * - the already-established point-8.9 preliminary scientific classification.
 *
 * It contains no system, nebula, cluster, extreme-object or event result and
 * no reward/progression data.
 */
export class ExplorationSectorScanResult {

  constructor(
    readonly selection:
      ExplorationSectorSelection,

    readonly detectionKind:
      ExplorationDetectionKind,

    readonly preliminaryClassification:
      ObservationClassification,
  ) {
    if (
      !Object.values(
        ExplorationDetectionKind,
      ).includes(
        detectionKind,
      )
    ) {
      throw new RangeError(
        `Unknown ExplorationDetectionKind: ${String(detectionKind)}.`,
      );
    }

    if (
      preliminaryClassification !==
      ObservationClassification
        .Unclassified
    ) {
      throw new RangeError(
        'Point 9.3 preliminary classification must remain the canonical Unclassified state.',
      );
    }
  }

  get isSignal():
    boolean {

    return this
      .detectionKind ===
      ExplorationDetectionKind
        .SIGNAL;
  }

  get isAnomaly():
    boolean {

    return this
      .detectionKind ===
      ExplorationDetectionKind
        .ANOMALY;
  }

  get isPreliminarilyUnclassified():
    boolean {

    return this
      .preliminaryClassification ===
      ObservationClassification
        .Unclassified;
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

function assertInt32(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isInteger(
      value,
    ) ||
    value <
      SIGNED_INT32_MIN ||
    value >
      SIGNED_INT32_MAX
  ) {
    throw new RangeError(
      `${propertyName} must belong to the signed Int32 range: ${String(value)}.`,
    );
  }
}
