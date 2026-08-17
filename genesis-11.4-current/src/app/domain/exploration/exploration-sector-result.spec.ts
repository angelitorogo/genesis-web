import {
  ExplorationDetectionKind,
  ExplorationSectorScanResult,
  ExplorationSectorSelection,
} from './exploration-sector-scan';

import {
  ExplorationResultKind,
  ExplorationSectorResult,
} from './exploration-sector-result';

import {
  GalacticObjectLocator,
  SectorLocator,
  SystemLocator,
} from '../generation/procedural-locator';

import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  LocatedObservationObject,
  ObservationClassification,
  ObservationTransientCandidate,
  ObservationTransientCandidateId,
} from '../observation/observation-classification';

import {
  UniverseSeed,
} from '../universe/universe-seed';

describe(
  'ExplorationSectorResult domain',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    function scanResult():
      ExplorationSectorScanResult {

      return new ExplorationSectorScanResult(
        new ExplorationSectorSelection(
          generationKey,
          0n,
          0,
          0,
          -86,
          86,
          new SectorLocator(
            0n,
            0n,
          ),
        ),
        ExplorationDetectionKind
          .SIGNAL,
        ObservationClassification
          .Unclassified,
      );
    }

    it(
      'should expose exactly the five point-9.4 result kinds in canonical order',
      () => {
        expect(
          Object.values(
            ExplorationResultKind,
          ),
        ).toEqual([
          ExplorationResultKind.SYSTEM,
          ExplorationResultKind.NEBULA,
          ExplorationResultKind.STAR_CLUSTER,
          ExplorationResultKind.EXTREME_OBJECT,
          ExplorationResultKind.TRANSIENT_EVENT,
        ]);
      },
    );

    it(
      'should model SYSTEM only with a SystemLocator in the scanned sector',
      () => {
        const result =
          new ExplorationSectorResult(
            scanResult(),
            ExplorationResultKind
              .SYSTEM,
            new LocatedObservationObject(
              generationKey,
              new SystemLocator(
                0n,
                0n,
                3n,
              ),
            ),
          );

        expect(
          result.isLocated,
        ).toBe(
          true,
        );

        expect(
          result.targetLocator,
        ).toEqual(
          new SystemLocator(
            0n,
            0n,
            3n,
          ),
        );

        expect(
          result.transientCandidateId,
        ).toBeNull();
      },
    );

    it(
      'should model all three galactic-object families with GalacticObjectLocator',
      () => {
        for (
          const kind
          of [
            ExplorationResultKind.NEBULA,
            ExplorationResultKind.STAR_CLUSTER,
            ExplorationResultKind.EXTREME_OBJECT,
          ] as const
        ) {
          const result =
            new ExplorationSectorResult(
              scanResult(),
              kind,
              new LocatedObservationObject(
                generationKey,
                new GalacticObjectLocator(
                  0n,
                  0n,
                  1n,
                ),
              ),
            );

          expect(
            result.isLocated,
          ).toBe(
            true,
          );
        }
      },
    );

    it(
      'should model TRANSIENT_EVENT only through the existing point-8.9 transient subject',
      () => {
        const result =
          new ExplorationSectorResult(
            scanResult(),
            ExplorationResultKind
              .TRANSIENT_EVENT,
            new ObservationTransientCandidate(
              generationKey,
              new ObservationTransientCandidateId(
                42n,
              ),
            ),
          );

        expect(
          result.isTransient,
        ).toBe(
          true,
        );

        expect(
          result.targetLocator,
        ).toBeNull();

        expect(
          result.transientCandidateId
            ?.index,
        ).toBe(
          42n,
        );
      },
    );

    it(
      'should reject result subjects from a different UniverseGenerationKey and expose no point-9.5 progression fields',
      () => {
        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        expect(
          () =>
            new ExplorationSectorResult(
              scanResult(),
              ExplorationResultKind
                .TRANSIENT_EVENT,
              new ObservationTransientCandidate(
                otherGenerationKey,
                new ObservationTransientCandidateId(
                  1n,
                ),
              ),
            ),
        ).toThrow(
          RangeError,
        );

        const result =
          new ExplorationSectorResult(
            scanResult(),
            ExplorationResultKind
              .SYSTEM,
            new LocatedObservationObject(
              generationKey,
              new SystemLocator(
                0n,
                0n,
                0n,
              ),
            ),
          );

        expect(
          Object.keys(
            result,
          ),
        ).toEqual([
          'scanResult',
          'resultKind',
          'subject',
        ]);

        for (
          const forbidden
          of [
            'reward',
            'discoveryPoints',
            'progress',
            'discoveryState',
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
      'should reject subject-kind mismatches wrong sectors and invented result kinds',
      () => {
        expect(
          () =>
            new ExplorationSectorResult(
              scanResult(),
              ExplorationResultKind
                .SYSTEM,
              new LocatedObservationObject(
                generationKey,
                new GalacticObjectLocator(
                  0n,
                  0n,
                  0n,
                ),
              ),
            ),
        ).toThrow(
          TypeError,
        );

        expect(
          () =>
            new ExplorationSectorResult(
              scanResult(),
              ExplorationResultKind
                .NEBULA,
              new LocatedObservationObject(
                generationKey,
                new SystemLocator(
                  0n,
                  0n,
                  0n,
                ),
              ),
            ),
        ).toThrow(
          TypeError,
        );

        expect(
          () =>
            new ExplorationSectorResult(
              scanResult(),
              ExplorationResultKind
                .TRANSIENT_EVENT,
              new LocatedObservationObject(
                generationKey,
                new SystemLocator(
                  0n,
                  0n,
                  0n,
                ),
              ),
            ),
        ).toThrow(
          TypeError,
        );

        expect(
          () =>
            new ExplorationSectorResult(
              scanResult(),
              ExplorationResultKind
                .EXTREME_OBJECT,
              new LocatedObservationObject(
                generationKey,
                new GalacticObjectLocator(
                  0n,
                  1n,
                  0n,
                ),
              ),
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExplorationSectorResult(
              scanResult(),
              'UNKNOWN' as
                ExplorationResultKind,
              new ObservationTransientCandidate(
                generationKey,
                new ObservationTransientCandidateId(
                  1n,
                ),
              ),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
