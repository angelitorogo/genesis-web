import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  BodyLocator,
  GalaxyLocator,
  SystemLocator,
  type ProceduralLocator,
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
  AtmosphericSpectralAbsorber,
  AtmosphericSpectralComponent,
  AtmosphericSpectrumProfile,
} from '../../domain/spectroscopy/atmospheric-spectrum-profile';

import {
  InstrumentalSpectrumModelStatus,
} from '../../domain/spectroscopy/instrumental-spectrum';

import {
  SpectroscopicCandidateStatus,
  SpectroscopicSourceClassification,
} from '../../domain/spectroscopy/spectroscopic-interpretation';

import {
  IdealizedSpectrumDefinition,
  SpectralContinuumAnchor,
  SpectralFeatureKind,
  SpectralLine,
  SpectrumSample,
  SynthesizedSpectrum,
} from '../../domain/spectroscopy/spectrum';

import {
  StellarSpectrumProfile,
} from '../../domain/spectroscopy/stellar-spectrum-profile';

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
  AtmosphericSpectrumEngine,
} from './atmospheric-spectrum-engine';

import {
  InstrumentalSpectrumEngine,
} from './instrumental-spectrum-engine';

import {
  SpectroscopicInterpretationEngine,
} from './spectroscopic-interpretation-engine';

import {
  SpectroscopyEngine,
} from './spectroscopy-engine';

import {
  StellarSpectrumEngine,
} from './stellar-spectrum-engine';

describe(
  'InstrumentalSpectrumEngine point 13.7',
  () => {
    const LEVELS =
      [
        ObservationInstrumentLevel.LEVEL_1,
        ObservationInstrumentLevel.LEVEL_2,
        ObservationInstrumentLevel.LEVEL_3,
        ObservationInstrumentLevel.LEVEL_4,
        ObservationInstrumentLevel.LEVEL_5,
      ] as const;

    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    function session(
      targetLocator:
        ProceduralLocator,

      level:
        ObservationInstrumentLevel,

      instrumentType:
        ObservationInstrumentType =
        ObservationInstrumentType
          .SPECTROSCOPY,

      key:
        UniverseGenerationKey =
        generationKey,
    ): LeveledInstrumentObservationSession {

      const observatory =
        new Observatory(
          key,
        );

      const baseSession =
        new ObservationSession(
          observatory,
          targetLocator,
          DiscoveryState
            .DISCOVERED,
        );

      const instrument =
        ObservationInstrumentCatalogV1
          .instrument(
            instrumentType,
          );

      return new LeveledInstrumentObservationSession(
        new InstrumentObservationSession(
          baseSession,
          instrument,
        ),
        ObservationInstrumentCapabilityCatalogV1
          .profile(
            instrumentType,
            level,
          ),
      );
    }

    function narrowIdealizedSpectrum(
      level:
        ObservationInstrumentLevel,
    ): SynthesizedSpectrum {

      return SpectroscopyEngine
        .synthesize(
          generationKey,
          session(
            new SystemLocator(
              0n,
              0n,
              0n,
            ),
            level,
          ),
          new IdealizedSpectrumDefinition(
            400,
            700,
            601,
            [
              new SpectralContinuumAnchor(
                400,
                0.5,
              ),
              new SpectralContinuumAnchor(
                700,
                0.5,
              ),
            ],
            [
              new SpectralLine(
                'UNKNOWN_NARROW_532',
                SpectralFeatureKind
                  .EMISSION,
                532,
                0.5,
                0.18,
              ),
            ],
          ),
        );
    }

    function stellarIdealizedSpectrum(
      level:
        ObservationInstrumentLevel,
    ): SynthesizedSpectrum {

      return StellarSpectrumEngine
        .synthesize(
          generationKey,
          session(
            new SystemLocator(
              0n,
              0n,
              0n,
            ),
            level,
          ),
          new StellarSpectrumProfile(
            5_800,
          ),
        );
    }

    function atmosphericIdealizedSpectrum(
      level:
        ObservationInstrumentLevel,

      oxygenMixingRatio =
        0.21,

      methaneMixingRatio =
        0.01,
    ): SynthesizedSpectrum {

      return AtmosphericSpectrumEngine
        .synthesize(
          generationKey,
          session(
            new BodyLocator(
              0n,
              0n,
              0n,
              0n,
            ),
            level,
          ),
          new AtmosphericSpectrumProfile(
            [
              new AtmosphericSpectralComponent(
                AtmosphericSpectralAbsorber
                  .MOLECULAR_OXYGEN,
                oxygenMixingRatio,
              ),
              new AtmosphericSpectralComponent(
                AtmosphericSpectralAbsorber
                  .METHANE,
                methaneMixingRatio,
              ),
            ],
            1,
          ),
        );
    }

    function observe(
      spectrum:
        SynthesizedSpectrum,
    ) {

      return InstrumentalSpectrumEngine
        .observe(
          generationKey,
          spectrum,
        );
    }

    function nearestFlux(
      spectrum:
        {
          readonly samples:
            readonly {
              readonly wavelengthNanometers:
                number;

              readonly normalizedFlux:
                number;
            }[];
        },

      wavelengthNanometers:
        number,
    ): number {

      let nearest =
        spectrum
          .samples[
            0
          ];

      let nearestDistance =
        Math.abs(
          nearest
            .wavelengthNanometers -
          wavelengthNanometers,
        );

      for (
        const sample
        of spectrum
          .samples
      ) {
        const distance =
          Math.abs(
            sample
              .wavelengthNanometers -
            wavelengthNanometers,
          );

        if (
          distance <
          nearestDistance
        ) {
          nearest =
            sample;

          nearestDistance =
            distance;
        }
      }

      return nearest
        .normalizedFlux;
    }

    it(
      'should preserve the source wavelength window, sample count and observation session',
      () => {
        const source =
          stellarIdealizedSpectrum(
            ObservationInstrumentLevel
              .LEVEL_3,
          );

        const result =
          observe(
            source,
          );

        expect(
          result
            .minimumWavelengthNanometers,
        ).toBe(
          source
            .minimumWavelengthNanometers,
        );

        expect(
          result
            .maximumWavelengthNanometers,
        ).toBe(
          source
            .maximumWavelengthNanometers,
        );

        expect(
          result.sampleCount,
        ).toBe(
          source.sampleCount,
        );

        expect(
          result.observationSession,
        ).toBe(
          source.observationSession,
        );

        expect(
          result.modelStatus,
        ).toBe(
          InstrumentalSpectrumModelStatus
            .INSTRUMENTALLY_DEGRADED_V1,
        );
      },
    );

    it(
      'should support all five frozen spectroscopy levels',
      () => {
        for (
          const level
          of LEVELS
        ) {
          expect(
            () =>
              observe(
                stellarIdealizedSpectrum(
                  level,
                ),
              ),
          ).not.toThrow();
        }
      },
    );

    it(
      'should project LEVEL_5 normalized flux exactly on decimal uncertainty-bucket boundaries',
      () => {
        const source =
          new SynthesizedSpectrum(
            session(
              new SystemLocator(
                0n,
                0n,
                0n,
              ),
              ObservationInstrumentLevel
                .LEVEL_5,
            ),
            400,
            401,
            [
              new SpectrumSample(
                400,
                0.59,
              ),
              new SpectrumSample(
                401,
                0.59,
              ),
            ],
          );

        const result =
          observe(
            source,
          );

        expect(
          result.sampleCount,
        ).toBe(
          2,
        );

        for (
          const sample
          of result.samples
        ) {
          expect(
            sample
              .lowerBoundInclusive,
          ).toBe(
            0.59,
          );

          expect(
            sample
              .upperBoundExclusive,
          ).toBeCloseTo(
            0.60,
            12,
          );

          expect(
            sample
              .normalizedFlux,
          ).toBeCloseTo(
            0.595,
            12,
          );
        }
      },
    );

    it(
      'should reuse the exact point-8.6 quantization curve for normalized flux',
      () => {
        const expected = [
          [
            ObservationInstrumentLevel
              .LEVEL_1,
            0.20,
          ],
          [
            ObservationInstrumentLevel
              .LEVEL_2,
            0.10,
          ],
          [
            ObservationInstrumentLevel
              .LEVEL_3,
            0.05,
          ],
          [
            ObservationInstrumentLevel
              .LEVEL_4,
            0.02,
          ],
          [
            ObservationInstrumentLevel
              .LEVEL_5,
            0.01,
          ],
        ] as const;

        for (
          const [
            level,
            expectedFraction,
          ]
          of expected
        ) {
          const result =
            observe(
              stellarIdealizedSpectrum(
                level,
              ),
            );

          expect(
            result
              .quantizationFraction,
          ).toBeCloseTo(
            expectedFraction,
            12,
          );

          expect(
            result
              .samples[
                Math.floor(
                  result.sampleCount /
                  2,
                )
              ]
              .intervalWidth,
          ).toBeCloseTo(
            expectedFraction,
            12,
          );
        }
      },
    );

    it(
      'should keep non-zero measurement uncertainty even at LEVEL_5',
      () => {
        const result =
          observe(
            stellarIdealizedSpectrum(
              ObservationInstrumentLevel
                .LEVEL_5,
            ),
          );

        expect(
          result
            .quantizationFraction,
        ).toBeCloseTo(
          0.01,
          12,
        );

        expect(
          result
            .samples[
              100
            ]
            .uncertaintyHalfWidth,
        ).toBeGreaterThan(
          0,
        );
      },
    );

    it(
      'should monotonically narrow uncertainty from LEVEL_1 to LEVEL_5',
      () => {
        const widths =
          LEVELS
            .map(
              level =>
                observe(
                  stellarIdealizedSpectrum(
                    level,
                  ),
                )
                  .samples[
                    100
                  ]
                  .intervalWidth,
            );

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
      'should monotonically improve effective spectral resolution from LEVEL_1 to LEVEL_5',
      () => {
        const resolutions =
          LEVELS
            .map(
              level =>
                observe(
                  stellarIdealizedSpectrum(
                    level,
                  ),
                )
                  .effectiveResolutionElementNanometers,
            );

        for (
          let index =
            1;
          index <
            resolutions.length;
          index +=
            1
        ) {
          expect(
            resolutions[
              index
            ],
          ).toBeLessThan(
            resolutions[
              index -
              1
            ],
          );
        }
      },
    );

    it(
      'should monotonically improve the dimensionless contrast-detection floor with instrument level',
      () => {
        const thresholds =
          LEVELS
            .map(
              level =>
                observe(
                  stellarIdealizedSpectrum(
                    level,
                  ),
                )
                  .minimumDetectableNormalizedContrast,
            );

        for (
          let index =
            1;
          index <
            thresholds.length;
          index +=
            1
        ) {
          expect(
            thresholds[
              index
            ],
          ).toBeLessThan(
            thresholds[
              index -
              1
            ],
          );
        }

        expect(
          thresholds[
            thresholds.length -
            1
          ],
        ).toBeCloseTo(
          0.01,
          12,
        );
      },
    );

    it(
      'should preserve the idealized flux inside the LEVEL_5 point-8.6 interval because LEVEL_5 adds no resolution smoothing',
      () => {
        const source =
          narrowIdealizedSpectrum(
            ObservationInstrumentLevel
              .LEVEL_5,
          );

        const result =
          observe(
            source,
          );

        for (
          const index
          of [
            0,
            100,
            264,
            600,
          ]
        ) {
          const exactFlux =
            source
              .samples[
                index
              ]
              .normalizedFlux;

          const observed =
            result
              .samples[
                index
              ];

          expect(
            exactFlux,
          ).toBeGreaterThanOrEqual(
            observed
              .lowerBoundInclusive,
          );

          expect(
            exactFlux,
          ).toBeLessThan(
            observed
              .upperBoundExclusive,
          );
        }
      },
    );

    it(
      'should resolve a narrow line much more strongly at LEVEL_5 than at LEVEL_1',
      () => {
        const level1 =
          observe(
            narrowIdealizedSpectrum(
              ObservationInstrumentLevel
                .LEVEL_1,
            ),
          );

        const level5 =
          observe(
            narrowIdealizedSpectrum(
              ObservationInstrumentLevel
                .LEVEL_5,
            ),
          );

        const level1Contrast =
          nearestFlux(
            level1,
            532,
          ) -
          nearestFlux(
            level1,
            528,
          );

        const level5Contrast =
          nearestFlux(
            level5,
            532,
          ) -
          nearestFlux(
            level5,
            528,
          );

        expect(
          level5Contrast,
        ).toBeGreaterThan(
          level1Contrast,
        );
      },
    );

    it(
      'should keep a broad atmospheric band observable at LEVEL_1 while reporting wider intervals than LEVEL_5',
      () => {
        function waterSpectrum(
          level:
            ObservationInstrumentLevel,
        ): SynthesizedSpectrum {

          return AtmosphericSpectrumEngine
            .synthesize(
              generationKey,
              session(
                new BodyLocator(
                  0n,
                  0n,
                  0n,
                  0n,
                ),
                level,
              ),
              new AtmosphericSpectrumProfile(
                [
                  new AtmosphericSpectralComponent(
                    AtmosphericSpectralAbsorber
                      .WATER_VAPOR,
                    0.02,
                  ),
                ],
                1,
              ),
            );
        }

        const level1 =
          observe(
            waterSpectrum(
              ObservationInstrumentLevel
                .LEVEL_1,
            ),
          );

        const level5 =
          observe(
            waterSpectrum(
              ObservationInstrumentLevel
                .LEVEL_5,
            ),
          );

        expect(
          nearestFlux(
            level1,
            1_400,
          ),
        ).toBeLessThan(
          nearestFlux(
            level1,
            1_250,
          ),
        );

        expect(
          level1
            .samples[
              100
            ]
            .intervalWidth,
        ).toBeGreaterThan(
          level5
            .samples[
              100
            ]
            .intervalWidth,
        );
      },
    );

    it(
      'should be exactly deterministic for the same idealized frame and instrument level',
      () => {
        const source =
          narrowIdealizedSpectrum(
            ObservationInstrumentLevel
              .LEVEL_3,
          );

        expect(
          observe(
            source,
          ),
        ).toEqual(
          observe(
            source,
          ),
        );
      },
    );

    it(
      'should leave the idealized source spectrum completely unchanged',
      () => {
        const source =
          narrowIdealizedSpectrum(
            ObservationInstrumentLevel
              .LEVEL_1,
          );

        const before =
          source
            .samples
            .map(
              sample => ({
                wavelengthNanometers:
                  sample
                    .wavelengthNanometers,
                normalizedFlux:
                  sample
                    .normalizedFlux,
              }),
            );

        observe(
          source,
        );

        expect(
          source
            .samples
            .map(
              sample => ({
                wavelengthNanometers:
                  sample
                    .wavelengthNanometers,
                normalizedFlux:
                  sample
                    .normalizedFlux,
              }),
            ),
        ).toEqual(
          before,
        );
      },
    );

    it(
      'should expose only observed intervals and never retain the idealized source or exact pre-quantized flux',
      () => {
        const result =
          observe(
            narrowIdealizedSpectrum(
              ObservationInstrumentLevel
                .LEVEL_3,
            ),
          );

        for (
          const forbiddenProperty
          of [
            'idealizedSpectrum',
            'sourceSpectrum',
            'exactFlux',
            'exactValue',
            'groundTruth',
            'noise',
            'snr',
            'certainty',
            'discoveryState',
          ]
        ) {
          expect(
            Object.prototype
              .hasOwnProperty
              .call(
                result,
                forbiddenProperty,
              ),
          ).toBe(false);
        }

        expect(
          Object.prototype
            .hasOwnProperty
            .call(
              result.samples[
                0
              ],
              'exactFlux',
            ),
        ).toBe(false);

        expect(
          Object.prototype
            .hasOwnProperty
            .call(
              result.samples[
                0
              ],
              'exactValue',
            ),
        ).toBe(false);
      },
    );

    it(
      'should keep every observed sample finite, ordered and equipped with a positive uncertainty interval',
      () => {
        const result =
          observe(
            stellarIdealizedSpectrum(
              ObservationInstrumentLevel
                .LEVEL_2,
            ),
          );

        for (
          let index =
            0;
          index <
            result.samples.length;
          index +=
            1
        ) {
          const sample =
            result.samples[
              index
            ];

          expect(
            Number.isFinite(
              sample
                .normalizedFlux,
            ),
          ).toBe(true);

          expect(
            sample
              .normalizedFlux,
          ).toBeGreaterThanOrEqual(
            0,
          );

          expect(
            sample
              .normalizedFlux,
          ).toBeLessThanOrEqual(
            1,
          );

          expect(
            sample.intervalWidth,
          ).toBeGreaterThan(
            0,
          );

          if (
            index >
            0
          ) {
            expect(
              sample
                .wavelengthNanometers,
            ).toBeGreaterThan(
              result.samples[
                index -
                1
              ]
                .wavelengthNanometers,
            );
          }
        }
      },
    );

    it(
      'should let point 13.6 interpret an instrumental spectrum without exposing Ground Truth',
      () => {
        const observed =
          observe(
            stellarIdealizedSpectrum(
              ObservationInstrumentLevel
                .LEVEL_5,
            ),
          );

        expect(
          SpectroscopicInterpretationEngine
            .interpret(
              generationKey,
              observed,
            )
            .sourceClassification,
        ).toBe(
          SpectroscopicSourceClassification
            .STELLAR_PHOTOSPHERIC,
        );
      },
    );

    it(
      'should make a narrow isolated optical anomaly detectable at LEVEL_5 but not at LEVEL_1',
      () => {
        const level1 =
          SpectroscopicInterpretationEngine
            .interpret(
              generationKey,
              observe(
                narrowIdealizedSpectrum(
                  ObservationInstrumentLevel
                    .LEVEL_1,
                ),
              ),
            );

        const level5 =
          SpectroscopicInterpretationEngine
            .interpret(
              generationKey,
              observe(
                narrowIdealizedSpectrum(
                  ObservationInstrumentLevel
                    .LEVEL_5,
                ),
              ),
            );

        expect(
          level1
            .technosignatureStatus,
        ).toBe(
          SpectroscopicCandidateStatus
            .NONE,
        );

        expect(
          level5
            .technosignatureStatus,
        ).toBe(
          SpectroscopicCandidateStatus
            .CANDIDATE,
        );
      },
    );

    it(
      'should allow a weak O2+CH4 candidate at LEVEL_5 while LEVEL_1 detectability remains insufficient',
      () => {
        const level1 =
          SpectroscopicInterpretationEngine
            .interpret(
              generationKey,
              observe(
                atmosphericIdealizedSpectrum(
                  ObservationInstrumentLevel
                    .LEVEL_1,
                  0.0025,
                  0.0025,
                ),
              ),
            );

        const level5 =
          SpectroscopicInterpretationEngine
            .interpret(
              generationKey,
              observe(
                atmosphericIdealizedSpectrum(
                  ObservationInstrumentLevel
                    .LEVEL_5,
                  0.0025,
                  0.0025,
                ),
              ),
            );

        expect(
          level1
            .biosignatureStatus,
        ).toBe(
          SpectroscopicCandidateStatus
            .NONE,
        );

        expect(
          level5
            .biosignatureStatus,
        ).toBe(
          SpectroscopicCandidateStatus
            .CANDIDATE,
        );
      },
    );

    it(
      'should reject a generation key that differs from the idealized spectrum session',
      () => {
        const otherKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '1111-2222-3333-4444-5555-6666-7777-8888',
            ),
            GeneratorVersion.V1,
          );

        expect(
          () =>
            InstrumentalSpectrumEngine
              .observe(
                otherKey,
                stellarIdealizedSpectrum(
                  ObservationInstrumentLevel
                    .LEVEL_3,
                ),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject an embedded observation session that is not spectroscopy',
      () => {
        const opticalSession =
          session(
            new GalaxyLocator(
              0n,
            ),
            ObservationInstrumentLevel
              .LEVEL_3,
            ObservationInstrumentType
              .OPTICAL,
          );

        const source =
          stellarIdealizedSpectrum(
            ObservationInstrumentLevel
              .LEVEL_3,
          );

        const invalid =
          new SynthesizedSpectrum(
            opticalSession,
            source
              .minimumWavelengthNanometers,
            source
              .maximumWavelengthNanometers,
            source.samples,
          );

        expect(
          () =>
            InstrumentalSpectrumEngine
              .observe(
                generationKey,
                invalid,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject unsupported generator versions explicitly',
      () => {
        const unsupported =
          new UniverseGenerationKey(
            generationKey
              .universeSeed,
            {
              code:
                999,
            } as unknown as GeneratorVersion,
          );

        const unsupportedSession =
          session(
            new SystemLocator(
              0n,
              0n,
              0n,
            ),
            ObservationInstrumentLevel
              .LEVEL_3,
            ObservationInstrumentType
              .SPECTROSCOPY,
            unsupported,
          );

        const validSource =
          stellarIdealizedSpectrum(
            ObservationInstrumentLevel
              .LEVEL_3,
          );

        const source =
          new SynthesizedSpectrum(
            unsupportedSession,
            validSource
              .minimumWavelengthNanometers,
            validSource
              .maximumWavelengthNanometers,
            validSource.samples,
          );

        expect(
          () =>
            InstrumentalSpectrumEngine
              .observe(
                unsupported,
                source,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
