import {
  ExplorationResultKind,
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
  LocatedObservationObject,
  ObservationClassification,
  ObservationTransientCandidate,
} from '../../domain/observation/observation-classification';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GalaxySectorContentGenerator,
} from '../sector/galaxy-sector-content-generator';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  ExplorationSectorResultEngine,
} from './exploration-sector-result-engine';

import {
  ExplorationSectorScanEngine,
} from './exploration-sector-scan-engine';

describe(
  'ExplorationSectorResultEngine',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    function resolve(
      x:
        number,

      y:
        number,
    ) {
      const selection =
        ExplorationSectorScanEngine
          .prepareSector(
            generationKey,
            0n,
            x,
            y,
          );

      return ExplorationSectorResultEngine
        .resolve(
          ExplorationSectorScanEngine
            .scan(
              selection,
            ),
        );
    }

    it(
      'should resolve one deterministic point-9.4 result while preserving the point-8.9 Unclassified state',
      () => {
        const first =
          resolve(
            0,
            0,
          );

        const second =
          resolve(
            0,
            0,
          );

        expect(
          second,
        ).toEqual(
          first,
        );

        expect(
          Object.values(
            ExplorationResultKind,
          ),
        ).toContain(
          first.resultKind,
        );

        expect(
          first
            .scanResult
            .preliminaryClassification,
        ).toBe(
          ObservationClassification
            .Unclassified,
        );
      },
    );

    it(
      'should keep located and transient subjects compatible with every returned result kind',
      () => {
        for (
          let x =
            -8;
          x <=
            8;
          x +=
            1
        ) {
          for (
            let y =
              -8;
            y <=
              8;
            y +=
              1
          ) {
            const result =
              resolve(
                x,
                y,
              );

            if (
              result.resultKind ===
              ExplorationResultKind
                .TRANSIENT_EVENT
            ) {
              expect(
                result.subject,
              ).toBeInstanceOf(
                ObservationTransientCandidate,
              );

              continue;
            }

            expect(
              result.subject,
            ).toBeInstanceOf(
              LocatedObservationObject,
            );

            if (
              result.resultKind ===
              ExplorationResultKind
                .SYSTEM
            ) {
              expect(
                result.targetLocator,
              ).toBeInstanceOf(
                SystemLocator,
              );
            } else {
              expect(
                result.targetLocator,
              ).toBeInstanceOf(
                GalacticObjectLocator,
              );
            }
          }
        }
      },
    );

    it(
      'should reach all five frozen result families across the deterministic Caeloria central sample',
      () => {
        const found =
          new Set<ExplorationResultKind>();

        for (
          let x =
            -12;
          x <=
            12;
          x +=
            1
        ) {
          for (
            let y =
              -12;
            y <=
              12;
            y +=
              1
          ) {
            found.add(
              resolve(
                x,
                y,
              )
              .resultKind,
            );
          }
        }

        expect(
          found,
        ).toEqual(
          new Set(
            Object.values(
              ExplorationResultKind,
            ),
          ),
        );
      }, 30_000,
    );

    it(
      'should remain independent of interleaved result-resolution order',
      () => {
        const expected =
          resolve(
            2,
            -3,
          );

        for (
          const [
            x,
            y,
          ]
          of [
            [-8, -8],
            [-4, 1],
            [0, 0],
            [0, 2],
            [4, -2],
            [8, 8],
          ] as const
        ) {
          resolve(
            x,
            y,
          );
        }

        expect(
          resolve(
            2,
            -3,
          ),
        ).toEqual(
          expected,
        );
      },
    );

    it(
      'should resolve empty static sectors as a deterministic transient event rather than inventing a static locator',
      () => {
        const result =
          resolve(
            86,
            86,
          );

        expect(
          result.resultKind,
        ).toBe(
          ExplorationResultKind
            .TRANSIENT_EVENT,
        );

        expect(
          result.isTransient,
        ).toBe(
          true,
        );

        expect(
          result.targetLocator,
        ).toBeNull();
      },
    );

    it(
      'should expose the exact frozen 9.4 galactic-object family classifier for point-10.5 layers',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            generationKey,
            0n,
          );

        const kinds =
          new Set<string>();

        for (
          let x =
            -12;
          x <=
            12;
          x +=
            1
        ) {
          for (
            let y =
              -12;
            y <=
              12;
            y +=
              1
          ) {
            const selection =
              ExplorationSectorScanEngine
                .prepareSector(
                  generationKey,
                  0n,
                  x,
                  y,
                );

            const content =
              GalaxySectorContentGenerator
                .generate(
                  galaxy,
                  selection.coordinates,
                );

            for (
              const locator
              of content.galacticObjectLocators
            ) {
              const first =
                ExplorationSectorResultEngine
                  .resolveGalacticObjectKind(
                    generationKey,
                    locator,
                  );

              const second =
                ExplorationSectorResultEngine
                  .resolveGalacticObjectKind(
                    generationKey,
                    locator,
                  );

              expect(
                second,
              ).toBe(
                first,
              );

              expect(
                [
                  ExplorationResultKind.NEBULA,
                  ExplorationResultKind.STAR_CLUSTER,
                  ExplorationResultKind.EXTREME_OBJECT,
                ],
              ).toContain(
                first,
              );

              kinds.add(
                first,
              );
            }
          }
        }

        expect(
          kinds,
        ).toEqual(
          new Set([
            ExplorationResultKind.NEBULA,
            ExplorationResultKind.STAR_CLUSTER,
            ExplorationResultKind.EXTREME_OBJECT,
          ]),
        );
      },
      30_000,
    );

    it(
      'should reject unsupported generator versions before resolving point-9.4 content or point-10.5 object family',
      () => {
        const unsupported =
          {
            universeSeed:
              generationKey
                .universeSeed,

            generatorVersion: {
              code:
                999,
            },
          } as unknown as
            UniverseGenerationKey;

        const canonical =
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

        const forged =
          {
            ...canonical,
            selection: {
              ...canonical
                .selection,
              generationKey:
                unsupported,
            },
          } as unknown as
            typeof canonical;

        expect(
          () =>
            ExplorationSectorResultEngine
              .resolve(
                forged,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            ExplorationSectorResultEngine
              .resolveGalacticObjectKind(
                unsupported,
                new GalacticObjectLocator(
                  0n,
                  0n,
                  0n,
                ),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject forged point-9.3 scan results',
      () => {
        const canonical =
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

        const forged =
          {
            ...canonical,
            detectionKind:
              canonical.isSignal
                ? 'ANOMALY'
                : 'SIGNAL',
          } as unknown as
            typeof canonical;

        expect(
          () =>
            ExplorationSectorResultEngine
              .resolve(
                forged,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
