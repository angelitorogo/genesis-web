import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ExplorationResultKind,
  type ExplorationLocatedResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  GalacticObjectLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxySectorCoordinates,
} from '../../domain/sector/galaxy-sector-coordinates';

import {
  GalaxySectorGrid,
} from '../../domain/sector/galaxy-sector-grid';

import {
  GalaxySectorKeyCodec,
} from '../../domain/sector/galaxy-sector-key-codec';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GalacticMapDiscoveryMarker,
  GalacticMapDiscoveryMarkerKind,
  GalacticMapDiscoveryMarkers,
} from './galactic-map-discovery-markers';

describe(
  'GalacticMapDiscoveryMarkers',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const grid =
      new GalaxySectorGrid(
        generationKey,
        0n,
        1000,
        2,
      );

    function systemMarker(
      x:
        number,

      y:
        number,

      index:
        bigint,
    ): GalacticMapDiscoveryMarker {

      const coordinates =
        new GalaxySectorCoordinates(
          x,
          y,
        );

      return new GalacticMapDiscoveryMarker(
        new SystemLocator(
          0n,
          GalaxySectorKeyCodec
            .encode(
              coordinates,
            ),
          index,
        ),
        ExplorationResultKind.SYSTEM,
        DiscoveryState.DETECTED,
        coordinates,
        0.25,
        0.75,
      );
    }

    function objectMarker(
      x:
        number,

      y:
        number,

      index:
        bigint,

      resultKind:
        ExplorationLocatedResultKind =
        ExplorationResultKind.NEBULA,
    ): GalacticMapDiscoveryMarker {

      const coordinates =
        new GalaxySectorCoordinates(
          x,
          y,
        );

      return new GalacticMapDiscoveryMarker(
        new GalacticObjectLocator(
          0n,
          GalaxySectorKeyCodec
            .encode(
              coordinates,
            ),
          index,
        ),
        resultKind,
        DiscoveryState.CONFIRMED,
        coordinates,
        0.80,
        0.10,
      );
    }

    it(
      'should expose persistent locator kinds plus the four frozen 9.4 thematic result families',
      () => {
        const markers =
          new GalacticMapDiscoveryMarkers(
            generationKey,
            0n,
            grid,
            [
              systemMarker(
                0,
                0,
                2n,
              ),
              objectMarker(
                1,
                -1,
                4n,
                ExplorationResultKind.NEBULA,
              ),
              objectMarker(
                -1,
                1,
                5n,
                ExplorationResultKind.STAR_CLUSTER,
              ),
              objectMarker(
                1,
                1,
                6n,
                ExplorationResultKind.EXTREME_OBJECT,
              ),
            ],
          );

        expect(
          markers.markerCount,
        ).toBe(
          4,
        );

        expect(
          markers.systemMarkerCount,
        ).toBe(
          1,
        );

        expect(
          markers.galacticObjectMarkerCount,
        ).toBe(
          3,
        );

        expect(
          markers.nebulaMarkerCount,
        ).toBe(
          1,
        );

        expect(
          markers.starClusterMarkerCount,
        ).toBe(
          1,
        );

        expect(
          markers.extremeObjectMarkerCount,
        ).toBe(
          1,
        );

        expect(
          new Set(
            markers.markers.map(
              (
                marker,
              ) =>
                marker.kind,
            ),
          ),
        ).toEqual(
          new Set([
            GalacticMapDiscoveryMarkerKind.SYSTEM,
            GalacticMapDiscoveryMarkerKind.GALACTIC_OBJECT,
          ]),
        );
      },
    );

    it(
      'should keep marker ordering independent of repository/query order',
      () => {
        const first =
          systemMarker(
            0,
            0,
            9n,
          );

        const second =
          objectMarker(
            -1,
            1,
            2n,
            ExplorationResultKind.STAR_CLUSTER,
          );

        const forward =
          new GalacticMapDiscoveryMarkers(
            generationKey,
            0n,
            grid,
            [
              first,
              second,
            ],
          );

        const reverse =
          new GalacticMapDiscoveryMarkers(
            generationKey,
            0n,
            grid,
            [
              second,
              first,
            ],
          );

        expect(
          reverse.markers,
        ).toEqual(
          forward.markers,
        );
      },
    );

    it(
      'should preserve known DiscoveryState, frozen result family and normalized intra-sector placement',
      () => {
        const marker =
          objectMarker(
            0,
            0,
            1n,
            ExplorationResultKind.EXTREME_OBJECT,
          );

        expect(
          marker.state,
        ).toBe(
          DiscoveryState.CONFIRMED,
        );

        expect(
          marker.resultKind,
        ).toBe(
          ExplorationResultKind.EXTREME_OBJECT,
        );

        expect(
          marker.normalizedX,
        ).toBe(
          0.80,
        );

        expect(
          marker.normalizedY,
        ).toBe(
          0.10,
        );
      },
    );

    it(
      'should reject locator/result-family mismatches and transient marker taxonomy',
      () => {
        const coordinates =
          new GalaxySectorCoordinates(
            0,
            0,
          );

        expect(
          () =>
            new GalacticMapDiscoveryMarker(
              new SystemLocator(
                0n,
                0n,
                0n,
              ),
              ExplorationResultKind.NEBULA,
              DiscoveryState.DETECTED,
              coordinates,
              0.5,
              0.5,
            ),
        ).toThrow(
          TypeError,
        );

        expect(
          () =>
            new GalacticMapDiscoveryMarker(
              new GalacticObjectLocator(
                0n,
                0n,
                0n,
              ),
              ExplorationResultKind.SYSTEM,
              DiscoveryState.DETECTED,
              coordinates,
              0.5,
              0.5,
            ),
        ).toThrow(
          TypeError,
        );

        expect(
          () =>
            new GalacticMapDiscoveryMarker(
              new GalacticObjectLocator(
                0n,
                0n,
                0n,
              ),
              ExplorationResultKind.TRANSIENT_EVENT as
                ExplorationLocatedResultKind,
              DiscoveryState.DETECTED,
              coordinates,
              0.5,
              0.5,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject duplicate persistent identities or marker coordinates outside the active grid',
      () => {
        const marker =
          systemMarker(
            0,
            0,
            3n,
          );

        expect(
          () =>
            new GalacticMapDiscoveryMarkers(
              generationKey,
              0n,
              grid,
              [
                marker,
                marker,
              ],
            ),
        ).toThrow(
          RangeError,
        );

        const foreignCoordinates =
          new GalaxySectorCoordinates(
            3,
            0,
          );

        const foreignMarker =
          new GalacticMapDiscoveryMarker(
            new SystemLocator(
              0n,
              GalaxySectorKeyCodec
                .encode(
                  foreignCoordinates,
                ),
              1n,
            ),
            ExplorationResultKind.SYSTEM,
            DiscoveryState.DETECTED,
            foreignCoordinates,
            0.5,
            0.5,
          );

        expect(
          () =>
            new GalacticMapDiscoveryMarkers(
              generationKey,
              0n,
              grid,
              [
                foreignMarker,
              ],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject UNKNOWN state, invalid normalized positions or mismatched locator-sector identity',
      () => {
        const coordinates =
          new GalaxySectorCoordinates(
            0,
            0,
          );

        const locator =
          new SystemLocator(
            0n,
            GalaxySectorKeyCodec
              .encode(
                coordinates,
              ),
            0n,
          );

        expect(
          () =>
            new GalacticMapDiscoveryMarker(
              locator,
              ExplorationResultKind.SYSTEM,
              DiscoveryState.UNKNOWN,
              coordinates,
              0.5,
              0.5,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalacticMapDiscoveryMarker(
              locator,
              ExplorationResultKind.SYSTEM,
              DiscoveryState.DETECTED,
              coordinates,
              1,
              0.5,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalacticMapDiscoveryMarker(
              locator,
              ExplorationResultKind.SYSTEM,
              DiscoveryState.DETECTED,
              new GalaxySectorCoordinates(
                1,
                0,
              ),
              0.5,
              0.5,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
