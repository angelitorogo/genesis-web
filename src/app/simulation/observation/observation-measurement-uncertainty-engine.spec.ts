import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GalaxyLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  InstrumentObservationSession,
  ObservationInstrument,
  ObservationInstrumentKind,
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  InstrumentCapabilityProfile,
  InstrumentLevelCapability,
  LeveledInstrumentObservationSession,
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  Observatory,
  ObservationSession,
} from '../../domain/observation/observatory';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ObservationEngine,
} from './observation-engine';

import {
  ObservationInstrumentCatalogV1,
} from './observation-instrument-catalog';

import {
  ObservationMeasurementUncertaintyCatalogV1,
} from './observation-measurement-uncertainty-catalog';

import {
  ObservationMeasurementUncertaintyEngine,
} from './observation-measurement-uncertainty-engine';

describe(
  'ObservationMeasurementUncertaintyEngine',
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

    function leveledSession(
      level:
        ObservationInstrumentLevel,

      instrumentType:
        ObservationInstrumentType =
          ObservationInstrumentType
            .OPTICAL,

      generationKey:
        UniverseGenerationKey =
          canonicalGenerationKey,
    ): LeveledInstrumentObservationSession {

      const instrument =
        ObservationInstrumentCatalogV1
          .instrument(
            instrumentType,
          );

      const baseSession =
        new ObservationSession(
          new Observatory(
            generationKey,
          ),
          new GalaxyLocator(
            0n,
          ),
          DiscoveryState.DISCOVERED,
        );

      const instrumentSession =
        new InstrumentObservationSession(
          baseSession,
          new ObservationInstrument(
            instrument.type,
            instrument.kind,
          ),
        );

      const levelCapability =
        capabilityFor(
          level,
        );

      return new LeveledInstrumentObservationSession(
        instrumentSession,
        new InstrumentCapabilityProfile(
          instrumentType,
          levelCapability,
        ),
      );
    }

    function capabilityFor(
      level:
        ObservationInstrumentLevel,
    ): InstrumentLevelCapability {

      if (
        level ===
        ObservationInstrumentLevel
          .LEVEL_1
      ) {
        return new InstrumentLevelCapability(
          level,
          0.20,
          0.25,
          0.15,
        );
      }

      if (
        level ===
        ObservationInstrumentLevel
          .LEVEL_2
      ) {
        return new InstrumentLevelCapability(
          level,
          0.40,
          0.45,
          0.32,
        );
      }

      if (
        level ===
        ObservationInstrumentLevel
          .LEVEL_3
      ) {
        return new InstrumentLevelCapability(
          level,
          0.60,
          0.65,
          0.52,
        );
      }

      if (
        level ===
        ObservationInstrumentLevel
          .LEVEL_4
      ) {
        return new InstrumentLevelCapability(
          level,
          0.80,
          0.82,
          0.74,
        );
      }

      return new InstrumentLevelCapability(
        ObservationInstrumentLevel
          .LEVEL_5,
        1.00,
        1.00,
        1.00,
      );
    }

    it(
      'should preserve the exact frozen V1 quantization curve in canonical level order',
      () => {
        expect(
          ObservationMeasurementUncertaintyCatalogV1
            .profiles
            .map(
              (
                profile,
              ) => [
                profile.level.name,
                profile.quantizationFraction,
              ],
            ),
        ).toEqual([
          [
            'LEVEL_1',
            0.20,
          ],
          [
            'LEVEL_2',
            0.10,
          ],
          [
            'LEVEL_3',
            0.05,
          ],
          [
            'LEVEL_4',
            0.02,
          ],
          [
            'LEVEL_5',
            0.01,
          ],
        ]);

        expect(
          Object.isFrozen(
            ObservationMeasurementUncertaintyCatalogV1
              .profiles,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      'should quantize exact value 73.4 at LEVEL_1 to the frozen interval 60 inclusive through 80 exclusive',
      () => {
        const measurement =
          ObservationMeasurementUncertaintyEngine
            .estimateScalar(
              canonicalGenerationKey,
              leveledSession(
                ObservationInstrumentLevel
                  .LEVEL_1,
              ),
              73.4,
              100.0,
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
      },
    );

    it(
      'should quantize exact value 73.4 at LEVEL_3 to the frozen interval 70 inclusive through 75 exclusive',
      () => {
        const measurement =
          ObservationMeasurementUncertaintyEngine
            .estimateScalar(
              canonicalGenerationKey,
              leveledSession(
                ObservationInstrumentLevel
                  .LEVEL_3,
              ),
              73.4,
              100.0,
            );

        expect(
          measurement.lowerBoundInclusive,
        ).toBe(
          70.0,
        );

        expect(
          measurement.upperBoundExclusive,
        ).toBe(
          75.0,
        );

        expect(
          measurement.midpointEstimate,
        ).toBe(
          72.5,
        );

        expect(
          measurement.uncertaintyHalfWidth,
        ).toBe(
          2.5,
        );
      },
    );

    it(
      'should keep nonzero uncertainty at LEVEL_5 with frozen interval 73 inclusive through 74 exclusive',
      () => {
        const measurement =
          ObservationMeasurementUncertaintyEngine
            .estimateScalar(
              canonicalGenerationKey,
              leveledSession(
                ObservationInstrumentLevel
                  .LEVEL_5,
              ),
              73.4,
              100.0,
            );

        expect(
          measurement.lowerBoundInclusive,
        ).toBe(
          73.0,
        );

        expect(
          measurement.upperBoundExclusive,
        ).toBe(
          74.0,
        );

        expect(
          measurement.estimate.intervalWidth,
        ).toBe(
          1.0,
        );

        expect(
          measurement.uncertaintyHalfWidth,
        ).toBe(
          0.5,
        );
      },
    );

    it(
      'should quantize zero at LEVEL_1 to zero inclusive through twenty exclusive',
      () => {
        const measurement =
          ObservationMeasurementUncertaintyEngine
            .estimateScalar(
              canonicalGenerationKey,
              leveledSession(
                ObservationInstrumentLevel
                  .LEVEL_1,
              ),
              0.0,
              100.0,
            );

        expect(
          [
            measurement.lowerBoundInclusive,
            measurement.upperBoundExclusive,
          ],
        ).toEqual([
          0.0,
          20.0,
        ]);
      },
    );

    it(
      'should use floor semantics for negative values and produce minus eighty inclusive through minus sixty exclusive',
      () => {
        const measurement =
          ObservationMeasurementUncertaintyEngine
            .estimateScalar(
              canonicalGenerationKey,
              leveledSession(
                ObservationInstrumentLevel
                  .LEVEL_1,
              ),
              -73.4,
              100.0,
            );

        expect(
          [
            measurement.lowerBoundInclusive,
            measurement.upperBoundExclusive,
          ],
        ).toEqual([
          -80.0,
          -60.0,
        ]);
      },
    );

    it(
      'should place an exact upper bucket boundary into the next half-open bucket',
      () => {
        const measurement =
          ObservationMeasurementUncertaintyEngine
            .estimateScalar(
              canonicalGenerationKey,
              leveledSession(
                ObservationInstrumentLevel
                  .LEVEL_1,
              ),
              80.0,
              100.0,
            );

        expect(
          [
            measurement.lowerBoundInclusive,
            measurement.upperBoundExclusive,
          ],
        ).toEqual([
          80.0,
          100.0,
        ]);
      },
    );

    it(
      'should keep decimal LEVEL_5 bucket boundaries in their next canonical half-open bucket despite IEEE-754 quotient drift',
      () => {
        for (
          const exactValue
          of [
            0.29,
            0.58,
            0.59,
          ]
        ) {
          const measurement =
            ObservationMeasurementUncertaintyEngine
              .estimateScalar(
                canonicalGenerationKey,
                leveledSession(
                  ObservationInstrumentLevel
                    .LEVEL_5,
                ),
                exactValue,
                1.0,
              );

          expect(
            measurement
              .lowerBoundInclusive,
          ).toBe(
            exactValue,
          );

          expect(
            measurement
              .upperBoundExclusive,
          ).toBeCloseTo(
            exactValue +
              0.01,
            12,
          );

          expect(
            measurement
              .estimate
              .contains(
                exactValue,
              ),
          ).toBe(
            true,
          );
        }
      },
    );

    it(
      'should preserve strict half-open behavior immediately below and across negative decimal boundaries without epsilon promotion',
      () => {
        const boundary =
          0.59;

        const immediatelyBelow =
          boundary -
          Number.EPSILON;

        const belowMeasurement =
          ObservationMeasurementUncertaintyEngine
            .estimateScalar(
              canonicalGenerationKey,
              leveledSession(
                ObservationInstrumentLevel
                  .LEVEL_5,
              ),
              immediatelyBelow,
              1.0,
            );

        expect(
          belowMeasurement
            .lowerBoundInclusive,
        ).toBeCloseTo(
          0.58,
          12,
        );

        expect(
          belowMeasurement
            .upperBoundExclusive,
        ).toBe(
          boundary,
        );

        expect(
          belowMeasurement
            .estimate
            .contains(
              immediatelyBelow,
            ),
        ).toBe(
          true,
        );

        const negativeBoundary =
          ObservationMeasurementUncertaintyEngine
            .estimateScalar(
              canonicalGenerationKey,
              leveledSession(
                ObservationInstrumentLevel
                  .LEVEL_5,
              ),
              -0.59,
              1.0,
            );

        expect(
          negativeBoundary
            .lowerBoundInclusive,
        ).toBe(
          -0.59,
        );

        expect(
          negativeBoundary
            .upperBoundExclusive,
        ).toBeCloseTo(
          -0.58,
          12,
        );

        expect(
          negativeBoundary
            .estimate
            .contains(
              -0.59,
            ),
        ).toBe(
          true,
        );
      },
    );

    it(
      'should preserve widths twenty ten five two one across all five levels at reference scale one hundred',
      () => {
        const widths =
          ObservationInstrumentLevel
            .values
            .map(
              (
                level,
              ) =>
                ObservationMeasurementUncertaintyEngine
                  .estimateScalar(
                    canonicalGenerationKey,
                    leveledSession(
                      level,
                    ),
                    73.4,
                    100.0,
                  )
                  .estimate
                  .intervalWidth,
            );

        expect(
          widths,
        ).toEqual([
          20.0,
          10.0,
          5.0,
          2.0,
          1.0,
        ]);

        for (
          let index =
            1;
          index <
            widths.length;
          index +=
            1
        ) {
          expect(
            widths[
              index
            ],
          ).toBeLessThan(
            widths[
              index -
                1
            ],
          );
        }
      },
    );

    it(
      'should delegate from ObservationEngine and expose no exact value reference scale certainty or Ground Truth fields',
      () => {
        const session =
          leveledSession(
            ObservationInstrumentLevel
              .LEVEL_3,
          );

        const direct =
          ObservationMeasurementUncertaintyEngine
            .estimateScalar(
              canonicalGenerationKey,
              session,
              73.4,
              100.0,
            );

        const wrapped =
          ObservationEngine
            .estimateScalarWithUncertainty(
              session,
              73.4,
              100.0,
            );

        expect(
          wrapped,
        ).toEqual(
          direct,
        );

        const serializedKeys =
          [
            ...Object.keys(
              wrapped,
            ),
            ...Object.keys(
              wrapped.estimate,
            ),
            ...Object.keys(
              wrapped.uncertaintyProfile,
            ),
          ];

        for (
          const forbidden
          of [
            'exactValue',
            'referenceScale',
            'certainty',
            'probability',
            'confidence',
            'evidenceScore',
          ]
        ) {
          expect(
            serializedKeys,
          ).not.toContain(
            forbidden,
          );
        }
      },
    );

    it(
      'should be deterministic seed-independent and use the same normalized level curve across all seven instrument families',
      () => {
        const sameValueKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
            ),
            GeneratorVersion.V1,
          );

        const first =
          ObservationMeasurementUncertaintyEngine
            .estimateScalar(
              sameValueKey,
              leveledSession(
                ObservationInstrumentLevel
                  .LEVEL_4,
                ObservationInstrumentType
                  .OPTICAL,
                canonicalGenerationKey,
              ),
              73.4,
              100.0,
            );

        const repeated =
          ObservationMeasurementUncertaintyEngine
            .estimateScalar(
              sameValueKey,
              leveledSession(
                ObservationInstrumentLevel
                  .LEVEL_4,
                ObservationInstrumentType
                  .OPTICAL,
                canonicalGenerationKey,
              ),
              73.4,
              100.0,
            );

        expect(
          repeated.estimate,
        ).toEqual(
          first.estimate,
        );

        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const other =
          ObservationMeasurementUncertaintyEngine
            .estimateScalar(
              otherGenerationKey,
              leveledSession(
                ObservationInstrumentLevel
                  .LEVEL_4,
                ObservationInstrumentType
                  .OPTICAL,
                otherGenerationKey,
              ),
              73.4,
              100.0,
            );

        expect(
          other.estimate,
        ).toEqual(
          first.estimate,
        );

        const allWidths =
          ObservationInstrumentCatalogV1
            .supportedInstrumentTypes
            .map(
              (
                instrumentType,
              ) =>
                ObservationMeasurementUncertaintyEngine
                  .estimateScalar(
                    canonicalGenerationKey,
                    leveledSession(
                      ObservationInstrumentLevel
                        .LEVEL_4,
                      instrumentType,
                    ),
                    73.4,
                    100.0,
                  )
                  .estimate
                  .intervalWidth,
            );

        expect(
          allWidths,
        ).toEqual(
          Array(
            7,
          ).fill(
            2.0,
          ),
        );
      },
    );

    it(
      'should reject invalid exact values reference scales mismatching generation keys unsupported versions and noncanonical levels',
      () => {
        const session =
          leveledSession(
            ObservationInstrumentLevel
              .LEVEL_1,
          );

        for (
          const invalidValue
          of [
            Number.NaN,
            Number.POSITIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              ObservationMeasurementUncertaintyEngine
                .estimateScalar(
                  canonicalGenerationKey,
                  session,
                  invalidValue,
                  100.0,
                ),
          ).toThrow(
            RangeError,
          );
        }

        for (
          const invalidScale
          of [
            Number.NaN,
            Number.POSITIVE_INFINITY,
            0.0,
            -1.0,
          ]
        ) {
          expect(
            () =>
              ObservationMeasurementUncertaintyEngine
                .estimateScalar(
                  canonicalGenerationKey,
                  session,
                  73.4,
                  invalidScale,
                ),
          ).toThrow(
            RangeError,
          );
        }

        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        expect(
          () =>
            ObservationMeasurementUncertaintyEngine
              .estimateScalar(
                otherGenerationKey,
                session,
                73.4,
                100.0,
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
            ObservationMeasurementUncertaintyEngine
              .estimateScalar(
                unsupportedGenerationKey,
                leveledSession(
                  ObservationInstrumentLevel
                    .LEVEL_1,
                  ObservationInstrumentType
                    .OPTICAL,
                  unsupportedGenerationKey,
                ),
                73.4,
                100.0,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            ObservationMeasurementUncertaintyCatalogV1
              .profile(
                {
                  name:
                    'LEVEL_3',
                  rank:
                    3,
                } as unknown as
                  ObservationInstrumentLevel,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
