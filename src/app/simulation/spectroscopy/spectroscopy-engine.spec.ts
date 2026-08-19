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
  IdealizedSpectrumDefinition,
  SpectralContinuumAnchor,
  SpectralFeatureKind,
  SpectralLine,
  SpectroscopyModelStatus,
} from '../../domain/spectroscopy/spectrum';

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
  SpectroscopyEngine,
} from './spectroscopy-engine';

describe(
  'SpectroscopyEngine point 13.1',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    function session(
      instrumentType:
        ObservationInstrumentType =
        ObservationInstrumentType
          .SPECTROSCOPY,

      level:
        ObservationInstrumentLevel =
        ObservationInstrumentLevel
          .LEVEL_3,

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
          new GalaxyLocator(
            0n,
          ),
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

    function flatDefinition(
      lines:
        readonly SpectralLine[] =
        [],
    ): IdealizedSpectrumDefinition {

      return new IdealizedSpectrumDefinition(
        400,
        700,
        301,
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
        lines,
      );
    }

    function fluxAt(
      spectrum:
        ReturnType<
          typeof SpectroscopyEngine.synthesize
        >,

      wavelength:
        number,
    ): number {

      const sample =
        spectrum
          .samples
          .find(
            candidate =>
              candidate
                .wavelengthNanometers ===
              wavelength,
          );

      if (
        sample ===
        undefined
      ) {
        throw new Error(
          `Missing sample at ${wavelength} nm.`,
        );
      }

      return sample
        .normalizedFlux;
    }

    it(
      'should synthesize a deterministic flat normalized continuum with inclusive endpoints',
      () => {
        const first =
          SpectroscopyEngine
            .synthesize(
              generationKey,
              session(),
              flatDefinition(),
            );

        const second =
          SpectroscopyEngine
            .synthesize(
              generationKey,
              session(),
              flatDefinition(),
            );

        expect(
          first.modelStatus,
        ).toBe(
          SpectroscopyModelStatus
            .SIMPLIFIED_IDEALIZED_V1,
        );

        expect(
          first.sampleCount,
        ).toBe(
          301,
        );

        expect(
          first
            .samples[
              0
            ]
            .wavelengthNanometers,
        ).toBe(
          400,
        );

        expect(
          first
            .samples[
              first
                .samples
                .length -
              1
            ]
            .wavelengthNanometers,
        ).toBe(
          700,
        );

        expect(
          first
            .samples
            .map(
              sample =>
                sample
                  .normalizedFlux,
            ),
        ).toEqual(
          second
            .samples
            .map(
              sample =>
                sample
                  .normalizedFlux,
            ),
        );

        expect(
          first
            .samples
            .every(
              sample =>
                sample
                  .normalizedFlux ===
                0.5,
            ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            first.samples,
          ),
        ).toBe(true);
      },
    );

    it(
      'should raise normalized flux at the center of an emission line',
      () => {
        const spectrum =
          SpectroscopyEngine
            .synthesize(
              generationKey,
              session(),
              flatDefinition([
                new SpectralLine(
                  'emission',
                  SpectralFeatureKind
                    .EMISSION,
                  500,
                  0.3,
                  2,
                ),
              ]),
            );

        expect(
          fluxAt(
            spectrum,
            500,
          ),
        ).toBeCloseTo(
          0.8,
          12,
        );

        expect(
          fluxAt(
            spectrum,
            520,
          ),
        ).toBeCloseTo(
          0.5,
          8,
        );
      },
    );

    it(
      'should lower normalized flux at the center of an absorption line',
      () => {
        const spectrum =
          SpectroscopyEngine
            .synthesize(
              generationKey,
              session(),
              flatDefinition([
                new SpectralLine(
                  'absorption',
                  SpectralFeatureKind
                    .ABSORPTION,
                  500,
                  0.2,
                  2,
                ),
              ]),
            );

        expect(
          fluxAt(
            spectrum,
            500,
          ),
        ).toBeCloseTo(
          0.3,
          12,
        );

        expect(
          fluxAt(
            spectrum,
            520,
          ),
        ).toBeCloseTo(
          0.5,
          8,
        );
      },
    );

    it(
      'should linearly interpolate the idealized continuum between canonical anchors',
      () => {
        const definition =
          new IdealizedSpectrumDefinition(
            400,
            700,
            301,
            [
              new SpectralContinuumAnchor(
                400,
                0.2,
              ),
              new SpectralContinuumAnchor(
                550,
                0.5,
              ),
              new SpectralContinuumAnchor(
                700,
                0.8,
              ),
            ],
            [],
          );

        const spectrum =
          SpectroscopyEngine
            .synthesize(
              generationKey,
              session(),
              definition,
            );

        expect(
          fluxAt(
            spectrum,
            475,
          ),
        ).toBeCloseTo(
          0.35,
          12,
        );

        expect(
          fluxAt(
            spectrum,
            625,
          ),
        ).toBeCloseTo(
          0.65,
          12,
        );
      },
    );

    it(
      'should be independent of input anchor and line ordering',
      () => {
        const linesA =
          [
            new SpectralLine(
              'b',
              SpectralFeatureKind
                .EMISSION,
              620,
              0.12,
              3,
            ),
            new SpectralLine(
              'a',
              SpectralFeatureKind
                .ABSORPTION,
              500,
              0.18,
              2,
            ),
          ];

        const linesB =
          [
            linesA[
              1
            ],
            linesA[
              0
            ],
          ];

        const firstDefinition =
          new IdealizedSpectrumDefinition(
            400,
            700,
            301,
            [
              new SpectralContinuumAnchor(
                700,
                0.7,
              ),
              new SpectralContinuumAnchor(
                400,
                0.4,
              ),
              new SpectralContinuumAnchor(
                550,
                0.55,
              ),
            ],
            linesA,
          );

        const secondDefinition =
          new IdealizedSpectrumDefinition(
            400,
            700,
            301,
            [
              new SpectralContinuumAnchor(
                550,
                0.55,
              ),
              new SpectralContinuumAnchor(
                400,
                0.4,
              ),
              new SpectralContinuumAnchor(
                700,
                0.7,
              ),
            ],
            linesB,
          );

        const first =
          SpectroscopyEngine
            .synthesize(
              generationKey,
              session(),
              firstDefinition,
            );

        const second =
          SpectroscopyEngine
            .synthesize(
              generationKey,
              session(),
              secondDefinition,
            );

        expect(
          first.samples,
        ).toEqual(
          second.samples,
        );
      },
    );

    it(
      'should keep every generated sample finite, normalized and strictly ordered',
      () => {
        const spectrum =
          SpectroscopyEngine
            .synthesize(
              generationKey,
              session(),
              flatDefinition([
                new SpectralLine(
                  'strong-emission',
                  SpectralFeatureKind
                    .EMISSION,
                  500,
                  1,
                  10,
                ),
                new SpectralLine(
                  'strong-absorption',
                  SpectralFeatureKind
                    .ABSORPTION,
                  600,
                  1,
                  10,
                ),
              ]),
            );

        for (
          let index =
            0;
          index <
            spectrum
              .samples
              .length;
          index +=
            1
        ) {
          const sample =
            spectrum
              .samples[
                index
              ];

          expect(
            Number.isFinite(
              sample
                .wavelengthNanometers,
            ),
          ).toBe(true);

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

          if (
            index >
            0
          ) {
            expect(
              sample
                .wavelengthNanometers,
            ).toBeGreaterThan(
              spectrum
                .samples[
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
      'should reject any observation session that is not spectroscopy',
      () => {
        expect(
          () =>
            SpectroscopyEngine
              .synthesize(
                generationKey,
                session(
                  ObservationInstrumentType
                    .OPTICAL,
                ),
                flatDefinition(),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a generation key that does not belong to the observation session',
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
            SpectroscopyEngine
              .synthesize(
                otherKey,
                session(),
                flatDefinition(),
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

        expect(
          () =>
            SpectroscopyEngine
              .synthesize(
                unsupported,
                session(
                  ObservationInstrumentType
                    .SPECTROSCOPY,
                  ObservationInstrumentLevel
                    .LEVEL_3,
                  unsupported,
                ),
                flatDefinition(),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should deliberately keep idealized synthesis level-independent until point 13.7',
      () => {
        const definition =
          flatDefinition([
            new SpectralLine(
              'line',
              SpectralFeatureKind
                .ABSORPTION,
              500,
              0.2,
              2,
            ),
          ]);

        const level1 =
          SpectroscopyEngine
            .synthesize(
              generationKey,
              session(
                ObservationInstrumentType
                  .SPECTROSCOPY,
                ObservationInstrumentLevel
                  .LEVEL_1,
              ),
              definition,
            );

        const level5 =
          SpectroscopyEngine
            .synthesize(
              generationKey,
              session(
                ObservationInstrumentType
                  .SPECTROSCOPY,
                ObservationInstrumentLevel
                  .LEVEL_5,
              ),
              definition,
            );

        expect(
          level1
            .samples
            .map(
              sample =>
                sample
                  .normalizedFlux,
            ),
        ).toEqual(
          level5
            .samples
            .map(
              sample =>
                sample
                  .normalizedFlux,
            ),
        );
      },
    );

    it(
      'should not expose source spectral-line identifiers through the synthesized result contract',
      () => {
        const spectrum =
          SpectroscopyEngine
            .synthesize(
              generationKey,
              session(),
              flatDefinition([
                new SpectralLine(
                  'GROUND-TRUTH-LINE-ID',
                  SpectralFeatureKind
                    .EMISSION,
                  500,
                  0.2,
                  2,
                ),
              ]),
            );

        expect(
          Object.prototype
            .hasOwnProperty
            .call(
              spectrum,
              'lines',
            ),
        ).toBe(false);

        expect(
          Object.keys(
            spectrum,
          ),
        ).not.toContain(
          'lines',
        );

        expect(
          spectrum
            .samples
            .every(
              sample =>
                !Object.prototype
                  .hasOwnProperty
                  .call(
                    sample,
                    'id',
                  ),
            ),
        ).toBe(true);
      },
    );
  },
);
