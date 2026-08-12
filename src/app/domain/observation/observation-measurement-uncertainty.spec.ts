import {
  DiscoveryState,
} from '../discovery/discovery-state';

import {
  GalaxyLocator,
} from '../generation/procedural-locator';

import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  UniverseSeed,
} from '../universe/universe-seed';

import {
  InstrumentObservationSession,
  ObservationInstrument,
  ObservationInstrumentKind,
  ObservationInstrumentType,
} from './observation-instrument';

import {
  InstrumentCapabilityProfile,
  InstrumentLevelCapability,
  LeveledInstrumentObservationSession,
  ObservationInstrumentLevel,
} from './observation-instrument-capability';

import {
  MeasurementUncertaintyProfile,
  UncertainScalarEstimate,
  UncertainScalarMeasurement,
} from './observation-measurement-uncertainty';

import {
  ObservationSession,
  Observatory,
} from './observatory';

describe(
  'ObservationMeasurementUncertainty',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    function leveledSession(
      level:
        ObservationInstrumentLevel =
          ObservationInstrumentLevel
            .LEVEL_1,
    ): LeveledInstrumentObservationSession {

      const observatory =
        new Observatory(
          generationKey,
        );

      const baseSession =
        new ObservationSession(
          observatory,
          new GalaxyLocator(
            0n,
          ),
          DiscoveryState.DISCOVERED,
        );

      const instrumentSession =
        new InstrumentObservationSession(
          baseSession,
          new ObservationInstrument(
            ObservationInstrumentType
              .OPTICAL,
            ObservationInstrumentKind
              .ELECTROMAGNETIC_BAND,
          ),
        );

      const levelCapability =
        new InstrumentLevelCapability(
          level,
          level ===
            ObservationInstrumentLevel
              .LEVEL_1
            ? 0.20
            : 1.00,
          level ===
            ObservationInstrumentLevel
              .LEVEL_1
            ? 0.25
            : 1.00,
          level ===
            ObservationInstrumentLevel
              .LEVEL_1
            ? 0.15
            : 1.00,
        );

      return new LeveledInstrumentObservationSession(
        instrumentSession,
        new InstrumentCapabilityProfile(
          ObservationInstrumentType
            .OPTICAL,
          levelCapability,
        ),
      );
    }

    it(
      'should validate canonical levels and finite quantization fractions in range zero exclusive through one',
      () => {
        const profile =
          new MeasurementUncertaintyProfile(
            ObservationInstrumentLevel
              .LEVEL_3,
            0.05,
          );

        expect(
          profile.level,
        ).toBe(
          ObservationInstrumentLevel
            .LEVEL_3,
        );

        expect(
          profile.quantizationFraction,
        ).toBe(
          0.05,
        );

        for (
          const invalid
          of [
            Number.NaN,
            Number.POSITIVE_INFINITY,
            0.0,
            -0.01,
            1.01,
          ]
        ) {
          expect(
            () =>
              new MeasurementUncertaintyProfile(
                ObservationInstrumentLevel
                  .LEVEL_1,
                invalid,
              ),
          ).toThrow(
            RangeError,
          );
        }

        expect(
          () =>
            new MeasurementUncertaintyProfile(
              {
                name:
                  'LEVEL_1',
                rank:
                  1,
              } as unknown as
                ObservationInstrumentLevel,
              0.20,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should model a half-open interval and derive width midpoint half-width and containment',
      () => {
        const estimate =
          new UncertainScalarEstimate(
            60.0,
            80.0,
          );

        expect(
          Object.keys(
            estimate,
          ),
        ).toEqual([
          'lowerBoundInclusive',
          'upperBoundExclusive',
        ]);

        expect(
          estimate.intervalWidth,
        ).toBe(
          20.0,
        );

        expect(
          estimate.midpointEstimate,
        ).toBe(
          70.0,
        );

        expect(
          estimate.uncertaintyHalfWidth,
        ).toBe(
          10.0,
        );

        expect(
          estimate.contains(
            60.0,
          ),
        ).toBe(
          true,
        );

        expect(
          estimate.contains(
            79.999,
          ),
        ).toBe(
          true,
        );

        expect(
          estimate.contains(
            80.0,
          ),
        ).toBe(
          false,
        );

        expect(
          estimate.contains(
            Number.NaN,
          ),
        ).toBe(
          false,
        );
      },
    );

    it(
      'should compose the leveled session with observable uncertainty while leaking no exact value reference scale or certainty',
      () => {
        const session =
          leveledSession();

        const measurement =
          new UncertainScalarMeasurement(
            session,
            new UncertainScalarEstimate(
              60.0,
              80.0,
            ),
            new MeasurementUncertaintyProfile(
              ObservationInstrumentLevel
                .LEVEL_1,
              0.20,
            ),
          );

        expect(
          Object.keys(
            measurement,
          ),
        ).toEqual([
          'observationSession',
          'estimate',
          'uncertaintyProfile',
        ]);

        expect(
          measurement.level,
        ).toBe(
          ObservationInstrumentLevel
            .LEVEL_1,
        );

        expect(
          measurement.instrumentType,
        ).toBe(
          ObservationInstrumentType
            .OPTICAL,
        );

        expect(
          measurement.targetLocator,
        ).toEqual(
          new GalaxyLocator(
            0n,
          ),
        );

        expect(
          measurement.lowerBoundInclusive,
        ).toBe(
          60.0,
        );

        expect(
          measurement.upperBoundExclusive,
        ).toBe(
          80.0,
        );

        expect(
          measurement.midpointEstimate,
        ).toBe(
          70.0,
        );

        expect(
          measurement.uncertaintyHalfWidth,
        ).toBe(
          10.0,
        );

        const keys =
          Object.keys(
            measurement,
          );

        expect(
          keys,
        ).not.toContain(
          'exactValue',
        );

        expect(
          keys,
        ).not.toContain(
          'referenceScale',
        );

        expect(
          keys,
        ).not.toContain(
          'certainty',
        );
      },
    );

    it(
      'should reject invalid intervals and mismatching session versus uncertainty-profile levels',
      () => {
        for (
          const [
            lower,
            upper,
          ]
          of [
            [
              Number.NaN,
              1.0,
            ],
            [
              0.0,
              Number.POSITIVE_INFINITY,
            ],
            [
              10.0,
              10.0,
            ],
            [
              11.0,
              10.0,
            ],
          ] as const
        ) {
          expect(
            () =>
              new UncertainScalarEstimate(
                lower,
                upper,
              ),
          ).toThrow(
            RangeError,
          );
        }

        expect(
          () =>
            new UncertainScalarMeasurement(
              leveledSession(
                ObservationInstrumentLevel
                  .LEVEL_1,
              ),
              new UncertainScalarEstimate(
                60.0,
                80.0,
              ),
              new MeasurementUncertaintyProfile(
                ObservationInstrumentLevel
                  .LEVEL_2,
                0.10,
              ),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
