import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  GalacticObjectLocator,
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
  InstrumentObservationSession,
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  LeveledInstrumentObservationSession,
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  ObservationSession,
  Observatory,
} from '../../domain/observation/observatory';

import {
  ProtoplanetaryDiskAnalysis,
} from '../../domain/planetary/protoplanetary-disk-analysis';

import {
  ProtoplanetaryDiskStage,
} from '../../domain/planetary/protoplanetary-disk-stage';

import {
  StellarSystemScientificActionType,
} from '../../domain/planetary/stellar-system-scientific-action';

import {
  StellarYouthStage,
} from '../../domain/stellar/stellar-youth-stage';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ObservationInstrumentCapabilityCatalogV1,
} from '../observation/observation-instrument-capability-catalog';

import {
  ObservationInstrumentCatalogV1,
} from '../observation/observation-instrument-catalog';

import {
  ProtoplanetaryDiskAnalysisEngine,
} from './protoplanetary-disk-analysis-engine';

import {
  StellarSystemScientificActionEngine,
} from './stellar-system-scientific-action-engine';

describe(
  'StellarSystemScientificActionEngine',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const systemLocator =
      new SystemLocator(
        0n,
        0n,
        3n,
      );

    const analysis =
      new ProtoplanetaryDiskAnalysis(
        StellarYouthStage.PRE_MAIN_SEQUENCE,
        ProtoplanetaryDiskStage.EVOLVING_PRIMORDIAL_DISK,
        2.1,
        0.04,
        0.08,
        25,
        105,
        0.985,
        0.015,
        1,
        5,
        3.1,
        5,
        6.2,
        4,
        2,
        1,
      );

    function session(
      locator:
        ProceduralLocator,

      state:
        DiscoveryStateValue,

      instrumentType:
        ObservationInstrumentType,

      level:
        ObservationInstrumentLevel,
    ): LeveledInstrumentObservationSession {

      const baseSession =
        new ObservationSession(
          new Observatory(
            generationKey,
          ),
          locator,
          state,
        );

      return new LeveledInstrumentObservationSession(
        new InstrumentObservationSession(
          baseSession,
          ObservationInstrumentCatalogV1
            .instrument(
              instrumentType,
            ),
        ),
        ObservationInstrumentCapabilityCatalogV1
          .profile(
            instrumentType,
            level,
          ),
      );
    }

    afterEach(
      () => {
        vi.restoreAllMocks();
      },
    );

    it(
      'should allow CATALOGUED systems with a disk through infrared level 2',
      () => {
        vi.spyOn(
          ProtoplanetaryDiskAnalysisEngine,
          'analyzeOrNull',
        ).mockReturnValue(
          analysis,
        );

        const availability =
          StellarSystemScientificActionEngine
            .availability(
              generationKey,
              session(
                systemLocator,
                DiscoveryState.CATALOGUED,
                ObservationInstrumentType.INFRARED,
                ObservationInstrumentLevel.LEVEL_2,
              ),
              StellarSystemScientificActionType.ANALYZE_DISK,
            );

        expect(
          availability.isAvailable,
        ).toBe(true);
      },
    );

    it(
      'should block level 1 and non-infrared/radio instruments',
      () => {
        vi.spyOn(
          ProtoplanetaryDiskAnalysisEngine,
          'analyzeOrNull',
        ).mockReturnValue(
          analysis,
        );

        const lowLevel =
          StellarSystemScientificActionEngine
            .availability(
              generationKey,
              session(
                systemLocator,
                DiscoveryState.CATALOGUED,
                ObservationInstrumentType.INFRARED,
                ObservationInstrumentLevel.LEVEL_1,
              ),
              StellarSystemScientificActionType.ANALYZE_DISK,
            );

        const optical =
          StellarSystemScientificActionEngine
            .availability(
              generationKey,
              session(
                systemLocator,
                DiscoveryState.CATALOGUED,
                ObservationInstrumentType.OPTICAL,
                ObservationInstrumentLevel.LEVEL_2,
              ),
              StellarSystemScientificActionType.ANALYZE_DISK,
            );

        expect(
          lowLevel.meetsMinimumInstrumentLevel,
        ).toBe(false);

        expect(
          optical.isInstrumentAllowed,
        ).toBe(false);
      },
    );

    it(
      'should not resolve point-17 formation Ground Truth before CATALOGUED',
      () => {
        const spy =
          vi.spyOn(
            ProtoplanetaryDiskAnalysisEngine,
            'analyzeOrNull',
          );

        const availability =
          StellarSystemScientificActionEngine
            .availability(
              generationKey,
              session(
                systemLocator,
                DiscoveryState.DISCOVERED,
                ObservationInstrumentType.INFRARED,
                ObservationInstrumentLevel.LEVEL_2,
              ),
              StellarSystemScientificActionType.ANALYZE_DISK,
            );

        expect(
          availability.hasAnalyzableDisk,
        ).toBe(false);

        expect(
          spy,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'should reject a non-system locator and a mature system without an extant disk',
      () => {
        const spy =
          vi.spyOn(
            ProtoplanetaryDiskAnalysisEngine,
            'analyzeOrNull',
          ).mockReturnValue(
            null,
          );

        const wrongTarget =
          StellarSystemScientificActionEngine
            .availability(
              generationKey,
              session(
                new GalacticObjectLocator(
                  0n,
                  0n,
                  3n,
                ),
                DiscoveryState.CATALOGUED,
                ObservationInstrumentType.RADIO,
                ObservationInstrumentLevel.LEVEL_2,
              ),
              StellarSystemScientificActionType.ANALYZE_DISK,
            );

        const noDisk =
          StellarSystemScientificActionEngine
            .availability(
              generationKey,
              session(
                systemLocator,
                DiscoveryState.CATALOGUED,
                ObservationInstrumentType.RADIO,
                ObservationInstrumentLevel.LEVEL_2,
              ),
              StellarSystemScientificActionType.ANALYZE_DISK,
            );

        expect(
          wrongTarget.isSystemTarget,
        ).toBe(false);

        expect(
          noDisk.hasAnalyzableDisk,
        ).toBe(false);

        expect(
          spy,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'should confirm the system for the canonical 48 PD while returning the same deterministic analysis',
      () => {
        vi.spyOn(
          ProtoplanetaryDiskAnalysisEngine,
          'analyzeOrNull',
        ).mockReturnValue(
          analysis,
        );

        const result =
          StellarSystemScientificActionEngine
            .evaluate(
              generationKey,
              session(
                systemLocator,
                DiscoveryState.CATALOGUED,
                ObservationInstrumentType.RADIO,
                ObservationInstrumentLevel.LEVEL_2,
              ),
              StellarSystemScientificActionType.ANALYZE_DISK,
            );

        expect(
          result.newDiscoveryState,
        ).toBe(
          DiscoveryState.CONFIRMED,
        );

        expect(
          result.awardedDiscoveryPoints,
        ).toBe(48);

        expect(
          result.analysis,
        ).toBe(
          analysis,
        );
      },
    );
  },
);
