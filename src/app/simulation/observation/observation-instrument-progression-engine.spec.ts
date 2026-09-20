import {
  KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  BodyLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  type ProceduralLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  ObservationProgressMilestone,
} from '../../domain/observation/observation-instrument-progression';

import {
  Observatory,
} from '../../domain/observation/observatory';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ObservationEngine,
} from './observation-engine';

import {
  ObservationInstrumentProgressionCatalogV1,
} from './observation-instrument-progression-catalog';

import {
  ObservationInstrumentProgressionEngine,
} from './observation-instrument-progression-engine';

describe(
  'ObservationInstrumentProgressionEngine',
  () => {
    const canonicalSeed =
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      );

    const canonicalGenerationKey =
      new UniverseGenerationKey(
        canonicalSeed,
        GeneratorVersion.V1,
      );

    const canonicalObservatory =
      new Observatory(
        canonicalGenerationKey,
      );

    function known(
      locator:
        ProceduralLocator,

      state:
        ConstructorParameters<
          typeof KnownDiscovery
        >[2] =
          DiscoveryState.DETECTED,

      generationKey =
        canonicalGenerationKey,
    ): KnownDiscovery {

      return new KnownDiscovery(
        generationKey,
        locator,
        state,
      );
    }

    function milestoneDiscoveries(
      includeExternalGalaxy:
        boolean,
    ): readonly KnownDiscovery[] {

      const discoveries:
        KnownDiscovery[] =
        [
          known(
            new SystemLocator(
              0n,
              10n,
              1n,
            ),
            DiscoveryState.DISCOVERED,
          ),

          known(
            new BodyLocator(
              0n,
              10n,
              1n,
              1n,
            ),
            DiscoveryState.DISCOVERED,
          ),

          known(
            new GalacticObjectLocator(
              0n,
              10n,
              2n,
            ),
            DiscoveryState.CATALOGUED,
          ),

          known(
            new SystemLocator(
              0n,
              11n,
              3n,
            ),
            DiscoveryState.CONFIRMED,
          ),
        ];

      if (
        includeExternalGalaxy
      ) {
        discoveries.push(
          known(
            new GalaxyLocator(
              1n,
            ),
            DiscoveryState.DETECTED,
          ),
        );
      }

      return discoveries;
    }

    function unlockedCount(
      globalDiscoveryPoints:
        bigint,

      knownDiscoveries:
        readonly KnownDiscovery[],
    ): number {

      return ObservationInstrumentProgressionEngine
        .evaluate(
          canonicalGenerationKey,
          globalDiscoveryPoints,
          knownDiscoveries,
        )
        .statuses
        .filter(
          (
            status,
          ) =>
            status.isUnlocked,
        )
        .length;
    }

    it(
      'should preserve the complete frozen V1 family and level unlock tables and max-plus-union combination rule',
      () => {
        expect(
          ObservationInstrumentProgressionCatalogV1
            .familyUnlockRules
            .map(
              (
                rule,
              ) => [
                rule.instrumentType,
                rule.requirement
                  .minimumGlobalDiscoveryPoints,
                rule.requirement
                  .requiredMilestones,
              ],
            ),
        ).toEqual([
          [
            ObservationInstrumentType.OPTICAL,
            0n,
            [],
          ],
          [
            ObservationInstrumentType.INFRARED,
            500n,
            [
              ObservationProgressMilestone
                .FIRST_SYSTEM_DISCOVERED,
            ],
          ],
          [
            ObservationInstrumentType.RADIO,
            1_000n,
            [
              ObservationProgressMilestone
                .FIRST_SYSTEM_DISCOVERED,
            ],
          ],
          [
            ObservationInstrumentType.SPECTROSCOPY,
            2_500n,
            [
              ObservationProgressMilestone
                .FIRST_SYSTEM_DISCOVERED,
            ],
          ],
          [
            ObservationInstrumentType.X_RAY,
            5_000n,
            [
              ObservationProgressMilestone
                .FIRST_SYSTEM_DISCOVERED,
              ObservationProgressMilestone
                .FIRST_BODY_DISCOVERED,
              ObservationProgressMilestone
                .FIRST_GALACTIC_OBJECT_CATALOGUED,
            ],
          ],
          [
            ObservationInstrumentType.GAMMA_RAY,
            7_500n,
            [
              ObservationProgressMilestone
                .FIRST_SYSTEM_DISCOVERED,
              ObservationProgressMilestone
                .FIRST_BODY_DISCOVERED,
              ObservationProgressMilestone
                .FIRST_GALACTIC_OBJECT_CATALOGUED,
              ObservationProgressMilestone
                .FIRST_TARGET_CONFIRMED,
            ],
          ],
          [
            ObservationInstrumentType.GRAVITATIONAL_WAVE,
            10_000n,
            [
              ObservationProgressMilestone
                .FIRST_SYSTEM_DISCOVERED,
              ObservationProgressMilestone
                .FIRST_BODY_DISCOVERED,
              ObservationProgressMilestone
                .FIRST_GALACTIC_OBJECT_CATALOGUED,
              ObservationProgressMilestone
                .FIRST_TARGET_CONFIRMED,
              ObservationProgressMilestone
                .FIRST_EXTERNAL_GALAXY_DETECTED,
            ],
          ],
        ]);

        expect(
          ObservationInstrumentProgressionCatalogV1
            .levelUnlockRules
            .map(
              (
                rule,
              ) => [
                rule.level.name,
                rule.requirement
                  .minimumGlobalDiscoveryPoints,
                rule.requirement
                  .requiredMilestones,
              ],
            ),
        ).toEqual([
          [
            'LEVEL_1',
            0n,
            [],
          ],
          [
            'LEVEL_2',
            1_000n,
            [
              ObservationProgressMilestone
                .FIRST_SYSTEM_DISCOVERED,
            ],
          ],
          [
            'LEVEL_3',
            2_500n,
            [
              ObservationProgressMilestone
                .FIRST_SYSTEM_DISCOVERED,
            ],
          ],
          [
            'LEVEL_4',
            5_000n,
            [
              ObservationProgressMilestone
                .FIRST_SYSTEM_DISCOVERED,
              ObservationProgressMilestone
                .FIRST_SYSTEM_CATALOGUED,
            ],
          ],
          [
            'LEVEL_5',
            10_000n,
            [
              ObservationProgressMilestone
                .FIRST_SYSTEM_DISCOVERED,
              ObservationProgressMilestone
                .FIRST_SYSTEM_CATALOGUED,
              ObservationProgressMilestone
                .FIRST_BODY_DISCOVERED,
              ObservationProgressMilestone
                .FIRST_GALACTIC_OBJECT_CATALOGUED,
              ObservationProgressMilestone
                .FIRST_TARGET_CONFIRMED,
            ],
          ],
        ]);

        const spectroscopyL3 =
          ObservationInstrumentProgressionCatalogV1
            .combinedRequirement(
              ObservationInstrumentType
                .SPECTROSCOPY,
              ObservationInstrumentLevel
                .LEVEL_3,
            );

        expect(
          spectroscopyL3
            .minimumGlobalDiscoveryPoints,
        ).toBe(
          2_500n,
        );

        expect(
          spectroscopyL3
            .requiredMilestones,
        ).toEqual([
          ObservationProgressMilestone
            .FIRST_SYSTEM_DISCOVERED,
        ]);
      },
    );

    it(
      'should preserve the bootstrap vector with exactly OPTICAL LEVEL_1 unlocked',
      () => {
        const overview =
          ObservationInstrumentProgressionEngine
            .evaluate(
              canonicalGenerationKey,
              0n,
              [
                known(
                  new GalaxyLocator(
                    0n,
                  ),
                  DiscoveryState.DISCOVERED,
                ),
              ],
            );

        expect(
          overview.achievedMilestones,
        ).toEqual(
          [],
        );

        expect(
          overview.statuses.length,
        ).toBe(
          35,
        );

        expect(
          overview.statuses
            .filter(
              (
                status,
              ) =>
                status.isUnlocked,
            )
            .length,
        ).toBe(
          1,
        );

        expect(
          overview.unlockedInstrumentTypes,
        ).toEqual([
          ObservationInstrumentType
            .OPTICAL,
        ]);

        expect(
          overview.highestUnlockedLevel(
            ObservationInstrumentType
              .OPTICAL,
          ),
        ).toBe(
          ObservationInstrumentLevel
            .LEVEL_1,
        );
      },
    );

    it(
      'should unlock exactly six combinations at 1000 PD plus first system discovered',
      () => {
        const discoveries =
          [
            known(
              new SystemLocator(
                0n,
                10n,
                1n,
              ),
              DiscoveryState.DISCOVERED,
            ),
          ];

        expect(
          unlockedCount(
            1_000n,
            discoveries,
          ),
        ).toBe(
          6,
        );

        const overview =
          ObservationInstrumentProgressionEngine
            .evaluate(
              canonicalGenerationKey,
              1_000n,
              discoveries,
            );

        expect(
          overview.unlockedInstrumentTypes,
        ).toEqual([
          ObservationInstrumentType
            .OPTICAL,
          ObservationInstrumentType
            .INFRARED,
          ObservationInstrumentType
            .RADIO,
        ]);

        for (
          const instrumentType
          of overview
            .unlockedInstrumentTypes
        ) {
          expect(
            overview.highestUnlockedLevel(
              instrumentType,
            ),
          ).toBe(
            ObservationInstrumentLevel
              .LEVEL_2,
          );
        }
      },
    );

    it(
      'should unlock exactly twelve combinations at 2500 PD after the first system is discovered, without requiring a body',
      () => {
        expect(
          unlockedCount(
            2_500n,
            [
              known(
                new SystemLocator(
                  0n,
                  10n,
                  1n,
                ),
                DiscoveryState.DISCOVERED,
              ),
            ],
          ),
        ).toBe(
          12,
        );
      },
    );

    it(
      'should unlock the L4 families required to confirm the first catalogued system without body or galactic-object milestones',
      () => {
        const overview =
          ObservationInstrumentProgressionEngine
            .evaluate(
              canonicalGenerationKey,
              5_000n,
              [
                known(
                  new SystemLocator(
                    0n,
                    10n,
                    1n,
                  ),
                  DiscoveryState.CATALOGUED,
                ),
              ],
            );

        expect(
          overview.achievedMilestones,
        ).toEqual([
          ObservationProgressMilestone
            .FIRST_SYSTEM_DISCOVERED,
          ObservationProgressMilestone
            .FIRST_SYSTEM_CATALOGUED,
        ]);

        expect(
          overview.statuses
            .filter(
              status =>
                status.isUnlocked,
            )
            .length,
        ).toBe(
          16,
        );

        for (
          const instrumentType
          of [
            ObservationInstrumentType.OPTICAL,
            ObservationInstrumentType.INFRARED,
            ObservationInstrumentType.RADIO,
            ObservationInstrumentType.SPECTROSCOPY,
          ]
        ) {
          expect(
            overview.isUnlocked(
              instrumentType,
              ObservationInstrumentLevel.LEVEL_4,
            ),
          ).toBe(
            true,
          );
        }

        const xRayL1 =
          overview.status(
            ObservationInstrumentType.X_RAY,
            ObservationInstrumentLevel.LEVEL_1,
          );

        expect(
          xRayL1.isUnlocked,
        ).toBe(
          false,
        );

        expect(
          xRayL1.missingMilestones,
        ).toEqual([
          ObservationProgressMilestone
            .FIRST_BODY_DISCOVERED,
          ObservationProgressMilestone
            .FIRST_GALACTIC_OBJECT_CATALOGUED,
        ]);
      },
    );

    it(
      'should preserve the twenty-combination frontier at 5000 PD once system, body and galactic-object milestones are present',
      () => {
        expect(
          unlockedCount(
            5_000n,
            [
              known(
                new SystemLocator(
                  0n,
                  10n,
                  1n,
                ),
                DiscoveryState.CATALOGUED,
              ),
              known(
                new BodyLocator(
                  0n,
                  10n,
                  1n,
                  1n,
                ),
                DiscoveryState.DISCOVERED,
              ),
              known(
                new GalacticObjectLocator(
                  0n,
                  10n,
                  2n,
                ),
                DiscoveryState.CATALOGUED,
              ),
            ],
          ),
        ).toBe(
          20,
        );
      },
    );

    it(
      'should unlock exactly twenty-four combinations at 7500 PD plus first target confirmed',
      () => {
        expect(
          unlockedCount(
            7_500n,
            milestoneDiscoveries(
              false,
            ),
          ),
        ).toBe(
          24,
        );
      },
    );

    it(
      'should keep gravitational waves locked at 10000 PD without an external galaxy and expose exactly thirty combinations',
      () => {
        const overview =
          ObservationInstrumentProgressionEngine
            .evaluate(
              canonicalGenerationKey,
              10_000n,
              milestoneDiscoveries(
                false,
              ),
            );

        expect(
          overview.statuses
            .filter(
              (
                status,
              ) =>
                status.isUnlocked,
            )
            .length,
        ).toBe(
          30,
        );

        expect(
          overview.unlockedInstrumentTypes,
        ).not.toContain(
          ObservationInstrumentType
            .GRAVITATIONAL_WAVE,
        );

        expect(
          overview.highestUnlockedLevel(
            ObservationInstrumentType
              .GAMMA_RAY,
          ),
        ).toBe(
          ObservationInstrumentLevel
            .LEVEL_5,
        );
      },
    );

    it(
      'should unlock all thirty-five combinations at the full frontier including an external galaxy',
      () => {
        const overview =
          ObservationInstrumentProgressionEngine
            .evaluate(
              canonicalGenerationKey,
              10_000n,
              milestoneDiscoveries(
                true,
              ),
            );

        expect(
          overview.achievedMilestones,
        ).toEqual([
          ObservationProgressMilestone
            .FIRST_SYSTEM_DISCOVERED,
          ObservationProgressMilestone
            .FIRST_SYSTEM_CATALOGUED,
          ObservationProgressMilestone
            .FIRST_BODY_DISCOVERED,
          ObservationProgressMilestone
            .FIRST_GALACTIC_OBJECT_CATALOGUED,
          ObservationProgressMilestone
            .FIRST_TARGET_CONFIRMED,
          ObservationProgressMilestone
            .FIRST_EXTERNAL_GALAXY_DETECTED,
        ]);

        expect(
          overview.statuses
            .filter(
              (
                status,
              ) =>
                status.isUnlocked,
            )
            .length,
        ).toBe(
          35,
        );

        expect(
          overview.unlockedInstrumentTypes.length,
        ).toBe(
          7,
        );

        expect(
          overview.highestUnlockedLevel(
            ObservationInstrumentType
              .GRAVITATIONAL_WAVE,
          ),
        ).toBe(
          ObservationInstrumentLevel
            .LEVEL_5,
        );
      },
    );

    it(
      'should derive milestones only from observed knowledge and distinguish native galaxy zero from external galaxies',
      () => {
        const nativeOnly =
          ObservationInstrumentProgressionEngine
            .evaluate(
              canonicalGenerationKey,
              10_000n,
              [
                known(
                  new GalaxyLocator(
                    0n,
                  ),
                  DiscoveryState.CONFIRMED,
                ),
              ],
            );

        expect(
          nativeOnly
            .achievedMilestones,
        ).toContain(
          ObservationProgressMilestone
            .FIRST_TARGET_CONFIRMED,
        );

        expect(
          nativeOnly
            .achievedMilestones,
        ).not.toContain(
          ObservationProgressMilestone
            .FIRST_EXTERNAL_GALAXY_DETECTED,
        );

        const external =
          ObservationInstrumentProgressionEngine
            .evaluate(
              canonicalGenerationKey,
              10_000n,
              [
                known(
                  new GalaxyLocator(
                    9_223_372_036_854_775_807n,
                  ),
                  DiscoveryState.DETECTED,
                ),
              ],
            );

        expect(
          external
            .achievedMilestones,
        ).toContain(
          ObservationProgressMilestone
            .FIRST_EXTERNAL_GALAXY_DETECTED,
        );
      },
    );

    it(
      'should gate gameplay preparation while keeping the 8.3 technical preparation API ungated',
      () => {
        const bootstrapDiscoveries =
          [
            known(
              new GalaxyLocator(
                0n,
              ),
              DiscoveryState.DISCOVERED,
            ),
          ];

        const technical =
          ObservationEngine
            .prepareInstrumentObservationAtLevel(
              canonicalObservatory,
              new GalaxyLocator(
                0n,
              ),
              bootstrapDiscoveries,
              ObservationInstrumentType
                .GRAVITATIONAL_WAVE,
              ObservationInstrumentLevel
                .LEVEL_5,
            );

        expect(
          technical.instrumentType,
        ).toBe(
          ObservationInstrumentType
            .GRAVITATIONAL_WAVE,
        );

        expect(
          () =>
            ObservationEngine
              .prepareUnlockedInstrumentObservationAtLevel(
                canonicalObservatory,
                new GalaxyLocator(
                  0n,
                ),
                bootstrapDiscoveries,
                0n,
                ObservationInstrumentType
                  .GRAVITATIONAL_WAVE,
                ObservationInstrumentLevel
                  .LEVEL_5,
              ),
        ).toThrow(
          RangeError,
        );

        const fullDiscoveries =
          [
            ...milestoneDiscoveries(
              true,
            ),
            known(
              new GalaxyLocator(
                0n,
              ),
              DiscoveryState.DISCOVERED,
            ),
          ];

        const unlocked =
          ObservationEngine
            .prepareUnlockedInstrumentObservationAtLevel(
              canonicalObservatory,
              new GalaxyLocator(
                0n,
              ),
              fullDiscoveries,
              10_000n,
              ObservationInstrumentType
                .GRAVITATIONAL_WAVE,
              ObservationInstrumentLevel
                .LEVEL_5,
            );

        expect(
          unlocked.instrumentType,
        ).toBe(
          ObservationInstrumentType
            .GRAVITATIONAL_WAVE,
        );

        expect(
          unlocked.level,
        ).toBe(
          ObservationInstrumentLevel
            .LEVEL_5,
        );
      },
    );

    it(
      'should evaluate V2 instrument unlocks with the frozen V1 rules without mixing universe identities',
      () => {
        const v2Key =
          new UniverseGenerationKey(
            canonicalSeed.copy(),
            GeneratorVersion.V2,
          );

        const v1Known =
          milestoneDiscoveries(true);

        const v2Known =
          v1Known.map(
            discovery =>
              new KnownDiscovery(
                v2Key,
                discovery.locator,
                discovery.state,
              ),
          );

        const v1Overview =
          ObservationInstrumentProgressionEngine.evaluate(
            canonicalGenerationKey,
            10_000n,
            v1Known,
          );

        const v2Overview =
          ObservationInstrumentProgressionEngine.evaluate(
            v2Key,
            10_000n,
            v2Known,
          );

        expect(v2Overview.achievedMilestones).toEqual(
          v1Overview.achievedMilestones,
        );
        expect(v2Overview.statuses).toEqual(
          v1Overview.statuses,
        );

        expect(() =>
          ObservationInstrumentProgressionEngine.evaluate(
            v2Key,
            10_000n,
            v1Known,
          ),
        ).toThrow(/cannot mix discoveries/);

        const otherV2 =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V2,
          );

        expect(() =>
          ObservationInstrumentProgressionEngine.evaluate(
            v2Key,
            10_000n,
            [new KnownDiscovery(
              otherV2,
              new GalaxyLocator(1n),
              DiscoveryState.DETECTED,
            )],
          ),
        ).toThrow(/cannot mix discoveries/);
      },
    );

    it(
      'should remain deterministic query-order independent seed-independent and safe at signed Long maximum while rejecting invalid inputs',
      () => {
        const discoveries =
          milestoneDiscoveries(
            true,
          );

        const first =
          ObservationInstrumentProgressionEngine
            .evaluate(
              canonicalGenerationKey,
              10_000n,
              discoveries,
            );

        const reverse =
          ObservationInstrumentProgressionEngine
            .evaluate(
              canonicalGenerationKey,
              10_000n,
              [
                ...discoveries,
              ].reverse(),
            );

        expect(
          reverse,
        ).toEqual(
          first,
        );

        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const other =
          ObservationInstrumentProgressionEngine
            .evaluate(
              otherGenerationKey,
              10_000n,
              discoveries.map(
                (
                  discovery,
                ) =>
                  new KnownDiscovery(
                    otherGenerationKey,
                    discovery.locator,
                    discovery.state,
                  ),
              ),
            );

        expect(
          other
            .achievedMilestones,
        ).toEqual(
          first
            .achievedMilestones,
        );

        expect(
          other.statuses
            .map(
              (
                status,
              ) =>
                status.isUnlocked,
            ),
        ).toEqual(
          first.statuses
            .map(
              (
                status,
              ) =>
                status.isUnlocked,
            ),
        );

        expect(
          ObservationInstrumentProgressionEngine
            .evaluate(
              canonicalGenerationKey,
              9_223_372_036_854_775_807n,
              discoveries,
            )
            .statuses
            .filter(
              (
                status,
              ) =>
                status.isUnlocked,
            )
            .length,
        ).toBe(
          35,
        );

        expect(
          () =>
            ObservationInstrumentProgressionEngine
              .evaluate(
                canonicalGenerationKey,
                -1n,
                [],
              ),
        ).toThrow(
          RangeError,
        );

        const corrupt =
          {
            generationKey:
              canonicalGenerationKey,

            locator:
              new GalaxyLocator(
                0n,
              ),

            state:
              DiscoveryState.UNKNOWN,
          } as unknown as
            KnownDiscovery;

        expect(
          () =>
            ObservationInstrumentProgressionEngine
              .evaluate(
                canonicalGenerationKey,
                0n,
                [
                  corrupt,
                ],
              ),
        ).toThrow(
          RangeError,
        );

        const unsupportedGenerationKey =
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
            ObservationInstrumentProgressionEngine
              .evaluate(
                unsupportedGenerationKey,
                0n,
                [],
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
