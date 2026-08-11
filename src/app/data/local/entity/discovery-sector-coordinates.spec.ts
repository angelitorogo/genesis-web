import {
  GalaxySectorCoordinates,
} from '../../../domain/sector/galaxy-sector-coordinates';

import {
  GalaxySectorKeyCodec,
} from '../../../domain/sector/galaxy-sector-key-codec';

import {
  assertPersistedDiscoverySectorCoordinates,
  attachDiscoverySectorCoordinates,
  CorruptDiscoverySectorCoordinatesError,
  deriveDiscoverySectorCoordinates,
} from './discovery-sector-coordinates';

describe(
  'discovery sector coordinates',
  () => {
    it(
      'should map a missing sectorKey to null coordinates',
      () => {
        expect(
          deriveDiscoverySectorCoordinates(
            null,
          ),
        ).toEqual({
          sectorX:
            null,

          sectorY:
            null,
        });
      },
    );

    it(
      'should decode canonical signed sector coordinates',
      () => {
        const coordinates =
          new GalaxySectorCoordinates(
            -12,
            34,
          );

        const sectorKey =
          GalaxySectorKeyCodec
            .encode(
              coordinates,
            )
            .toString(
              10,
            );

        expect(
          deriveDiscoverySectorCoordinates(
            sectorKey,
          ),
        ).toEqual({
          sectorX:
            -12,

          sectorY:
            34,
        });
      },
    );

    it(
      'should attach coordinates without changing the original lineage',
      () => {
        const sectorKey =
          GalaxySectorKeyCodec
            .encode(
              new GalaxySectorCoordinates(
                7,
                -9,
              ),
            )
            .toString(
              10,
            );

        expect(
          attachDiscoverySectorCoordinates({
            sectorKey,

            galaxyIndex:
              '3',
          }),
        ).toEqual({
          sectorKey,

          galaxyIndex:
            '3',

          sectorX:
            7,

          sectorY:
            -9,
        });
      },
    );

    it(
      'should accept coherent persisted coordinates',
      () => {
        const sectorKey =
          GalaxySectorKeyCodec
            .encode(
              new GalaxySectorCoordinates(
                -1,
                2,
              ),
            )
            .toString(
              10,
            );

        expect(
          () =>
            assertPersistedDiscoverySectorCoordinates({
              sectorKey,

              sectorX:
                -1,

              sectorY:
                2,
            }),
        ).not.toThrow();
      },
    );

    it(
      'should accept null coordinates only when sectorKey is null',
      () => {
        expect(
          () =>
            assertPersistedDiscoverySectorCoordinates({
              sectorKey:
                null,

              sectorX:
                null,

              sectorY:
                null,
            }),
        ).not.toThrow();
      },
    );

    it(
      'should reject missing persisted coordinates',
      () => {
        expect(
          () =>
            assertPersistedDiscoverySectorCoordinates({
              sectorKey:
                '0',
            }),
        ).toThrow(
          CorruptDiscoverySectorCoordinatesError,
        );
      },
    );

    it(
      'should reject coordinates that disagree with sectorKey',
      () => {
        expect(
          () =>
            assertPersistedDiscoverySectorCoordinates({
              sectorKey:
                '0',

              sectorX:
                1,

              sectorY:
                0,
            }),
        ).toThrow(
          CorruptDiscoverySectorCoordinatesError,
        );
      },
    );

    it(
      'should reject non-canonical persisted sectorKey values',
      () => {
        expect(
          () =>
            deriveDiscoverySectorCoordinates(
              '0001',
            ),
        ).toThrow(
          CorruptDiscoverySectorCoordinatesError,
        );
      },
    );

    it(
      'should reject persisted sectorKey values outside signed Long range',
      () => {
        expect(
          () =>
            deriveDiscoverySectorCoordinates(
              '9223372036854775808',
            ),
        ).toThrow(
          CorruptDiscoverySectorCoordinatesError,
        );
      },
    );
  },
);