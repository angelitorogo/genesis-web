import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  GalacticObjectLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxySectorCoordinates,
} from '../../domain/sector/galaxy-sector-coordinates';

import {
  GalaxySectorKeyCodec,
} from '../../domain/sector/galaxy-sector-key-codec';

import {
  type GalaxySectorGrid,
} from '../../domain/sector/galaxy-sector-grid';

export const GalacticMapDiscoveryMarkerKind =
  Object.freeze({
    SYSTEM:
      'SYSTEM',

    GALACTIC_OBJECT:
      'GALACTIC_OBJECT',
  } as const);

export type GalacticMapDiscoveryMarkerKind =
  typeof GalacticMapDiscoveryMarkerKind[
    keyof typeof GalacticMapDiscoveryMarkerKind
  ];

export type GalacticMapDiscoveryMarkerLocator =
  SystemLocator |
  GalacticObjectLocator;

/**
 * One persistent point-10.4 map marker.
 *
 * The persisted identity/state comes from KnownDiscovery. The normalized
 * intra-sector coordinates remain regenerated Ground Truth and are never
 * persisted redundantly. A marker is therefore a read-only cartographic
 * projection, not a new discovery entity and not a GPU render sample.
 */
export class GalacticMapDiscoveryMarker {

  readonly kind:
    GalacticMapDiscoveryMarkerKind;

  readonly state:
    DiscoveryStateValue;

  readonly sectorCoordinates:
    GalaxySectorCoordinates;

  constructor(
    readonly locator:
      GalacticMapDiscoveryMarkerLocator,

    state:
      DiscoveryStateValue,

    sectorCoordinates:
      GalaxySectorCoordinates,

    readonly normalizedX:
      number,

    readonly normalizedY:
      number,
  ) {
    if (
      !(locator instanceof
        SystemLocator) &&
      !(locator instanceof
        GalacticObjectLocator)
    ) {
      throw new TypeError(
        'Point-10.4 discovery markers support only SystemLocator and GalacticObjectLocator.',
      );
    }

    const canonicalState =
      DiscoveryState
        .fromCode(
          state.code,
        );

    if (
      !DiscoveryState.isKnown(
        canonicalState,
      )
    ) {
      throw new RangeError(
        'A persistent map marker requires DiscoveryState >= DETECTED.',
      );
    }

    const canonicalSectorCoordinates =
      new GalaxySectorCoordinates(
        sectorCoordinates.x,
        sectorCoordinates.y,
      );

    if (
      locator.sectorKey !==
      GalaxySectorKeyCodec
        .encode(
          canonicalSectorCoordinates,
        )
    ) {
      throw new RangeError(
        'Marker sectorCoordinates must match locator.sectorKey.',
      );
    }

    assertNormalizedCoordinate(
      normalizedX,
      'normalizedX',
    );

    assertNormalizedCoordinate(
      normalizedY,
      'normalizedY',
    );

    this.kind =
      locator instanceof
        SystemLocator
        ? GalacticMapDiscoveryMarkerKind
            .SYSTEM
        : GalacticMapDiscoveryMarkerKind
            .GALACTIC_OBJECT;

    this.state =
      canonicalState;

    this.sectorCoordinates =
      canonicalSectorCoordinates;
  }
}

/**
 * Canonical, order-independent point-10.4 marker snapshot for one galaxy.
 */
export class GalacticMapDiscoveryMarkers {

  readonly markers:
    readonly GalacticMapDiscoveryMarker[];

  constructor(
    readonly generationKey:
      UniverseGenerationKey,

    readonly galaxyIndex:
      bigint,

    readonly grid:
      GalaxySectorGrid,

    markers:
      readonly GalacticMapDiscoveryMarker[],
  ) {
    if (
      !sameGenerationKey(
        generationKey,
        grid.generationKey,
      )
    ) {
      throw new RangeError(
        'GalacticMapDiscoveryMarkers grid must belong to generationKey.',
      );
    }

    if (
      grid.galaxyIndex !==
      galaxyIndex
    ) {
      throw new RangeError(
        'GalacticMapDiscoveryMarkers grid must belong to galaxyIndex.',
      );
    }

    const identities =
      new Set<string>();

    const canonicalMarkers:
      GalacticMapDiscoveryMarker[] =
      [];

    for (
      const marker
      of markers
    ) {
      if (
        marker
          .locator
          .galaxyIndex !==
        galaxyIndex
      ) {
        throw new RangeError(
          'Every discovery marker must belong to galaxyIndex.',
        );
      }

      if (
        !grid.contains(
          marker
            .sectorCoordinates,
        )
      ) {
        throw new RangeError(
          'Discovery marker sector coordinates are outside the active galaxy grid.',
        );
      }

      const canonicalGridCoordinates =
        grid.coordinatesFor(
          marker
            .locator
            .sectorKey,
        );

      if (
        canonicalGridCoordinates.x !==
          marker.sectorCoordinates.x ||
        canonicalGridCoordinates.y !==
          marker.sectorCoordinates.y
      ) {
        throw new RangeError(
          'Discovery marker locator does not resolve to marker sectorCoordinates in the active grid.',
        );
      }

      const identity =
        markerIdentity(
          marker,
        );

      if (
        identities.has(
          identity,
        )
      ) {
        throw new RangeError(
          `Duplicate discovery marker: ${identity}.`,
        );
      }

      identities.add(
        identity,
      );

      canonicalMarkers.push(
        marker,
      );
    }

    canonicalMarkers.sort(
      compareMarkers,
    );

    this.markers =
      Object.freeze(
        canonicalMarkers,
      );
  }

  get markerCount():
    number {

    return this
      .markers
      .length;
  }

  get systemMarkerCount():
    number {

    return this
      .markers
      .filter(
        (
          marker,
        ) =>
          marker.kind ===
          GalacticMapDiscoveryMarkerKind
            .SYSTEM,
      )
      .length;
  }

  get galacticObjectMarkerCount():
    number {

    return this
      .markers
      .filter(
        (
          marker,
        ) =>
          marker.kind ===
          GalacticMapDiscoveryMarkerKind
            .GALACTIC_OBJECT,
      )
      .length;
  }
}

function compareMarkers(
  left:
    GalacticMapDiscoveryMarker,

  right:
    GalacticMapDiscoveryMarker,
): number {

  if (
    left.locator.sectorKey !==
    right.locator.sectorKey
  ) {
    return left.locator.sectorKey <
      right.locator.sectorKey
      ? -1
      : 1;
  }

  if (
    left.kind !==
    right.kind
  ) {
    return left.kind ===
      GalacticMapDiscoveryMarkerKind.SYSTEM
      ? -1
      : 1;
  }

  const leftIndex =
    left
      .locator
      .galacticObjectIndex;

  const rightIndex =
    right
      .locator
      .galacticObjectIndex;

  if (
    leftIndex ===
    rightIndex
  ) {
    return 0;
  }

  return leftIndex <
    rightIndex
    ? -1
    : 1;
}

function markerIdentity(
  marker:
    GalacticMapDiscoveryMarker,
): string {

  return [
    marker.kind,
    marker.locator.galaxyIndex,
    marker.locator.sectorKey,
    marker.locator.galacticObjectIndex,
  ].join(
    ':',
  );
}

function assertNormalizedCoordinate(
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
    value >=
      1
  ) {
    throw new RangeError(
      `${propertyName} must be finite and belong to [0, 1).`,
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
