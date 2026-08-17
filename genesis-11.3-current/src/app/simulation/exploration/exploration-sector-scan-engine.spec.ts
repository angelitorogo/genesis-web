import {
  ExplorationDetectionKind,
  ExplorationSectorSelection,
} from '../../domain/exploration/exploration-sector-scan';

import {
  SectorLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ObservationClassification,
} from '../../domain/observation/observation-classification';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ExplorationSectorScanEngine,
} from './exploration-sector-scan-engine';

describe(
  'ExplorationSectorScanEngine',
  () => {
    const canonicalSeed =
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      );

    const generationKey =
      new UniverseGenerationKey(
        canonicalSeed,
        GeneratorVersion.V1,
      );

    it(
      'should prepare the frozen Caeloria central sector through the canonical galaxy grid',
      () => {
        const selection =
          ExplorationSectorScanEngine
            .prepareSector(
              generationKey,
              0n,
              0,
              0,
            );

        expect(
          selection.minCoordinate,
        ).toBe(
          -86,
        );

        expect(
          selection.maxCoordinate,
        ).toBe(
          86,
        );

        expect(
          selection.sectorLocator,
        ).toEqual(
          new SectorLocator(
            0n,
            0n,
          ),
        );
      },
    );

    it(
      'should reproduce the frozen V1 central-sector scan cue as SIGNAL and remain scientifically Unclassified',
      () => {
        const result =
          ExplorationSectorScanEngine
            .scan(
              ExplorationSectorScanEngine
                .prepareSector(
                  generationKey,
                  0n,
                  0,
                  0,
                ),
            );

        expect(
          result.detectionKind,
        ).toBe(
          ExplorationDetectionKind
            .SIGNAL,
        );

        expect(
          result
            .preliminaryClassification,
        ).toBe(
          ObservationClassification
            .Unclassified,
        );
      },
    );

    it(
      'should reproduce the frozen V1 0,2 sector scan cue as ANOMALY',
      () => {
        const result =
          ExplorationSectorScanEngine
            .scan(
              ExplorationSectorScanEngine
                .prepareSector(
                  generationKey,
                  0n,
                  0,
                  2,
                ),
            );

        expect(
          result.detectionKind,
        ).toBe(
          ExplorationDetectionKind
            .ANOMALY,
        );
      },
    );

    it(
      'should be deterministic and independent of interleaved sector scan order',
      () => {
        const target =
          ExplorationSectorScanEngine
            .prepareSector(
              generationKey,
              0n,
              0,
              2,
            );

        const expected =
          ExplorationSectorScanEngine
            .scan(
              target,
            );

        for (
          const [
            x,
            y,
          ]
          of [
            [
              -3,
              -3,
            ],
            [
              -1,
              0,
            ],
            [
              0,
              0,
            ],
            [
              1,
              1,
            ],
            [
              3,
              0,
            ],
          ] as const
        ) {
          ExplorationSectorScanEngine
            .scan(
              ExplorationSectorScanEngine
                .prepareSector(
                  generationKey,
                  0n,
                  x,
                  y,
                ),
            );
        }

        expect(
          ExplorationSectorScanEngine
            .scan(
              target,
            ),
        ).toEqual(
          expected,
        );
      },
    );

    it(
      'should reject sector coordinates outside the canonical active-galaxy grid',
      () => {
        expect(
          () =>
            ExplorationSectorScanEngine
              .prepareSector(
                generationKey,
                0n,
                87,
                0,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject forged selections whose declared grid is not the canonical galaxy grid',
      () => {
        const forged =
          new ExplorationSectorSelection(
            generationKey,
            0n,
            0,
            0,
            -100,
            100,
            new SectorLocator(
              0n,
              0n,
            ),
          );

        expect(
          ExplorationSectorScanEngine
            .scan(
              forged,
            )
            .selection
            .minCoordinate,
        ).toBe(
          -86,
        );

        expect(
          ExplorationSectorScanEngine
            .scan(
              forged,
            )
            .selection
            .maxCoordinate,
        ).toBe(
          86,
        );
      },
    );

    it(
      'should expose no point-9.4 result taxonomy and no point-9.5 reward/progression data',
      () => {
        const result =
          ExplorationSectorScanEngine
            .scan(
              ExplorationSectorScanEngine
                .prepareSector(
                  generationKey,
                  0n,
                  0,
                  0,
                ),
            );

        expect(
          Object.keys(
            result,
          ),
        ).toEqual([
          'selection',
          'detectionKind',
          'preliminaryClassification',
        ]);

        for (
          const forbidden
          of [
            'systems',
            'nebulae',
            'clusters',
            'extremeObjects',
            'events',
            'reward',
            'discoveryPoints',
            'progress',
          ]
        ) {
          expect(
            Object.keys(
              result,
            ),
          ).not.toContain(
            forbidden,
          );
        }
      },
    );

    it(
      'should reject unsupported generator versions before preparing a sector',
      () => {
        const unsupported =
          {
            universeSeed:
              canonicalSeed,

            generatorVersion: {
              code:
                999,
            },
          } as unknown as
            UniverseGenerationKey;

        expect(
          () =>
            ExplorationSectorScanEngine
              .prepareSector(
                unsupported,
                0n,
                0,
                0,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
