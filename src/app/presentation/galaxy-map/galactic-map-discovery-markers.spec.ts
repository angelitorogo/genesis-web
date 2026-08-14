import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

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
        DiscoveryState.CONFIRMED,
        coordinates,
        0.80,
        0.10,
      );
    }

    it(
      'should expose canonical persistent marker kinds and counts without inventing scientific families',
      () => {
        const markers =
          new GalacticMapDiscoveryMarkers(
            generationKey,
            0n,
            grid,
            [
              objectMarker(
                1,
                -1,
                4n,
              ),
              systemMarker(
                0,
                0,
                2n,
              ),
            ],
          );

        expect(
          markers.markerCount,
        ).toBe(
          2,
        );

        expect(
          markers.systemMarkerCount,
        ).toBe(
          1,
        );

        expect(
          markers.galacticObjectMarkerCount,
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
      'should preserve known DiscoveryState and normalized intra-sector placement',
      () => {
        const marker =
          objectMarker(
            0,
            0,
            1n,
          );

        expect(
          marker.state,
        ).toBe(
          DiscoveryState.CONFIRMED,
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
