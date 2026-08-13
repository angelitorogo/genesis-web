import {
  SectorLocator,
} from '../generation/procedural-locator';

import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  UniverseGenerationKey,
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

import {
  UniverseSeed,
} from '../universe/universe-seed';

import {
  ExplorationDetectionKind,
  ExplorationSectorScanResult,
  ExplorationSectorSelection,
} from './exploration-sector-scan';

describe(
  'ExplorationSectorScan domain',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    function selection(
      x =
        0,

      y =
        0,
    ): ExplorationSectorSelection {

      return new ExplorationSectorSelection(
        generationKey,
        0n,
        x,
        y,
        -86,
        86,
        new SectorLocator(
          0n,
          GalaxySectorKeyCodec
            .encode(
              new GalaxySectorCoordinates(
                x,
                y,
              ),
            ),
        ),
      );
    }

    it(
      'should preserve canonical selected-sector addressing and bounds',
      () => {
        const selected =
          selection();

        expect(
          selected.galaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          selected.sectorX,
        ).toBe(
          0,
        );

        expect(
          selected.sectorY,
        ).toBe(
          0,
        );

        expect(
          selected.sectorLocator,
        ).toEqual(
          new SectorLocator(
            0n,
            0n,
          ),
        );

        expect(
          selected.minCoordinate,
        ).toBe(
          -86,
        );

        expect(
          selected.maxCoordinate,
        ).toBe(
          86,
        );
      },
    );

    it(
      'should reject coordinates outside the exposed grid bounds or a mismatching locator',
      () => {
        expect(
          () =>
            selection(
              87,
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExplorationSectorSelection(
              generationKey,
              0n,
              0,
              0,
              -86,
              86,
              new SectorLocator(
                0n,
                1n,
              ),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should support exactly SIGNAL and ANOMALY with canonical Unclassified preliminary classification',
      () => {
        const selected =
          selection();

        const signal =
          new ExplorationSectorScanResult(
            selected,
            ExplorationDetectionKind
              .SIGNAL,
            ObservationClassification
              .Unclassified,
          );

        const anomaly =
          new ExplorationSectorScanResult(
            selected,
            ExplorationDetectionKind
              .ANOMALY,
            ObservationClassification
              .Unclassified,
          );

        expect(
          signal.isSignal,
        ).toBe(
          true,
        );

        expect(
          signal.isAnomaly,
        ).toBe(
          false,
        );

        expect(
          anomaly.isAnomaly,
        ).toBe(
          true,
        );

        expect(
          signal
            .isPreliminarilyUnclassified,
        ).toBe(
          true,
        );
      },
    );

    it(
      'should reject invented detection kinds and invented point-9.3 classifications',
      () => {
        const selected =
          selection();

        expect(
          () =>
            new ExplorationSectorScanResult(
              selected,
              'RESULT' as
                ExplorationDetectionKind,
              ObservationClassification
                .Unclassified,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExplorationSectorScanResult(
              selected,
              ExplorationDetectionKind
                .SIGNAL,
              {} as
                ObservationClassification,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
