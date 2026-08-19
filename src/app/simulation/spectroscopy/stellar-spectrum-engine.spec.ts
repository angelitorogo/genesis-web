import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GalaxyLocator,
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
  StellarSpectrumEngine,
} from './stellar-spectrum-engine';

describe(
  'StellarSpectrumEngine point 13.2',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    function session(
      level:
        ObservationInstrumentLevel =
        ObservationInstrumentLevel
          .LEVEL_3,

      instrumentType:
        ObservationInstrumentType =
        ObservationInstrumentType
          .SPECTROSCOPY,

      key:
        UniverseGenerationKey =
        generationKey,

      useSystemLocator =
        true,
    ): LeveledInstrumentObservationSession {

      const observatory =
        new Observatory(
          key,
        );

      const locator =
        useSystemLocator
          ? new SystemLocator(
              0n,
              0n,
              0n,
            )
          : new GalaxyLocator(
              0n,
            );

      const baseSession =
        new ObservationSession(
          observatory,
          locator,
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

    function spectrum(
      temperatureKelvin:
        number,

      level:
        ObservationInstrumentLevel =
        ObservationInstrumentLevel
          .LEVEL_3,
    ) {

      return StellarSpectrumEngine
        .synthesize(
          generationKey,
          session(
            level,
          ),
          new StellarSpectrumProfile(
            temperatureKelvin,
          ),
        );
    }

    function fluxAt(
      synthesized:
        ReturnType<
          typeof spectrum
        >,

      wavelengthNanometers:
        number,
    ): number {

      const sample =
        synthesized
          .samples
          .find(
            candidate =>
              candidate
                .wavelengthNanometers ===
              wavelengthNanometers,
          );

      if (
        sample ===
        undefined
      ) {
        throw new Error(
          `Missing point-13.2 sample at ${wavelengthNanometers} nm.`,
        );
      }

      return sample
        .normalizedFlux;
    }

    function localAbsorptionDepth(
      synthesized:
        ReturnType<
          typeof spectrum
        >,

      center:
        number,

      offset:
        number,
    ): number {

      const left =
        fluxAt(
          synthesized,
          center -
            offset,
        );

      const middle =
        fluxAt(
          synthesized,
          center,
        );

      const right =
        fluxAt(
          synthesized,
          center +
            offset,
        );

      return (
        (
          left +
          right
        ) /
        2 -
        middle
      );
    }

    it(
      'should synthesize the frozen V1 visible-window sampling contract through point 13.1',
      () => {
        const result =
          spectrum(
            5_778,
          );

        expect(
          result.sampleCount,
        ).toBe(
          741,
        );

        expect(
          result
            .minimumWavelengthNanometers,
        ).toBe(
          380,
        );

        expect(
          result
            .maximumWavelengthNanometers,
        ).toBe(
          750,
        );

        expect(
          result
            .samples[
              0
            ]
            .wavelengthNanometers,
        ).toBe(
          380,
        );

        expect(
          result
            .samples[
              result
                .samples
                .length -
              1
            ]
            .wavelengthNanometers,
        ).toBe(
          750,
        );
      },
    );

    it(
      'should reproduce exactly the same stellar spectrum for the same physical input',
      () => {
        const first =
          spectrum(
            5_778,
          );

        const second =
          spectrum(
            5_778,
          );

        expect(
          first.samples,
        ).toEqual(
          second.samples,
        );
      },
    );

    it(
      'should make a hot photospheric continuum bluer across the visible V1 window',
      () => {
        const hot =
          spectrum(
            30_000,
          );

        expect(
          fluxAt(
            hot,
            430,
          ),
        ).toBeGreaterThan(
          fluxAt(
            hot,
            700,
          ),
        );
      },
    );

    it(
      'should make a cool photospheric continuum redder across the visible V1 window',
      () => {
        const cool =
          spectrum(
            3_500,
          );

        expect(
          fluxAt(
            cool,
            700,
          ),
        ).toBeGreaterThan(
          fluxAt(
            cool,
            430,
          ),
        );
      },
    );

    it(
      'should shift the strongest visible-window continuum sample toward shorter wavelengths as temperature rises',
      () => {
        const cool =
          spectrum(
            3_500,
          );

        const hot =
          spectrum(
            12_000,
          );

        const coolPeak =
          cool
            .samples
            .reduce(
              (
                best,
                candidate,
              ) =>
                candidate
                  .normalizedFlux >
                best
                  .normalizedFlux
                  ? candidate
                  : best,
            );

        const hotPeak =
          hot
            .samples
            .reduce(
              (
                best,
                candidate,
              ) =>
                candidate
                  .normalizedFlux >
                best
                  .normalizedFlux
                  ? candidate
                  : best,
            );

        expect(
          hotPeak
            .wavelengthNanometers,
        ).toBeLessThan(
          coolPeak
            .wavelengthNanometers,
        );
      },
    );

    it(
      'should make the simplified H-alpha absorption strongest near the V1 Balmer-response regime',
      () => {
        const cool =
          spectrum(
            3_500,
          );

        const intermediate =
          spectrum(
            9_500,
          );

        const hot =
          spectrum(
            30_000,
          );

        const coolDepth =
          localAbsorptionDepth(
            cool,
            656.5,
            5,
          );

        const intermediateDepth =
          localAbsorptionDepth(
            intermediate,
            656.5,
            5,
          );

        const hotDepth =
          localAbsorptionDepth(
            hot,
            656.5,
            5,
          );

        expect(
          intermediateDepth,
        ).toBeGreaterThan(
          coolDepth,
        );

        expect(
          intermediateDepth,
        ).toBeGreaterThan(
          hotDepth,
        );
      },
    );

    it(
      'should make the simplified Na-D absorption stronger for a cool profile than for a hot one',
      () => {
        const coolDepth =
          localAbsorptionDepth(
            spectrum(
              3_500,
            ),
            589.5,
            4,
          );

        const hotDepth =
          localAbsorptionDepth(
            spectrum(
              15_000,
            ),
            589.5,
            4,
          );

        expect(
          coolDepth,
        ).toBeGreaterThan(
          hotDepth,
        );
      },
    );

    it(
      'should keep every synthesized stellar sample finite, normalized and strictly wavelength-ordered',
      () => {
        const result =
          spectrum(
            5_778,
          );

        for (
          let index =
            0;
          index <
            result
              .samples
              .length;
          index +=
            1
        ) {
          const sample =
            result
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
              result
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
      'should remain level-independent until point 13.7 applies instrument-dependent uncertainty',
      () => {
        const level1 =
          spectrum(
            5_778,
            ObservationInstrumentLevel
              .LEVEL_1,
          );

        const level5 =
          spectrum(
            5_778,
            ObservationInstrumentLevel
              .LEVEL_5,
          );

        expect(
          level1
            .samples,
        ).toEqual(
          level5
            .samples,
        );
      },
    );

    it(
      'should reject a non-SystemLocator target instead of pretending a galaxy is a star',
      () => {
        expect(
          () =>
            StellarSpectrumEngine
              .synthesize(
                generationKey,
                session(
                  ObservationInstrumentLevel
                    .LEVEL_3,
                  ObservationInstrumentType
                    .SPECTROSCOPY,
                  generationKey,
                  false,
                ),
                new StellarSpectrumProfile(
                  5_778,
                ),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should preserve point-13.1 spectroscopy-only instrument enforcement',
      () => {
        expect(
          () =>
            StellarSpectrumEngine
              .synthesize(
                generationKey,
                session(
                  ObservationInstrumentLevel
                    .LEVEL_3,
                  ObservationInstrumentType
                    .OPTICAL,
                ),
                new StellarSpectrumProfile(
                  5_778,
                ),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a generation key that differs from the observation session',
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
            StellarSpectrumEngine
              .synthesize(
                otherKey,
                session(),
                new StellarSpectrumProfile(
                  5_778,
                ),
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
            StellarSpectrumEngine
              .synthesize(
                unsupported,
                session(
                  ObservationInstrumentLevel
                    .LEVEL_3,
                  ObservationInstrumentType
                    .SPECTROSCOPY,
                  unsupported,
                ),
                new StellarSpectrumProfile(
                  5_778,
                ),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should not expose the exact effective temperature or internal line catalogue through the synthesized result',
      () => {
        const result =
          spectrum(
            5_778,
          );

        expect(
          Object.prototype
            .hasOwnProperty
            .call(
              result,
              'effectiveTemperatureKelvin',
            ),
        ).toBe(false);

        expect(
          Object.prototype
            .hasOwnProperty
            .call(
              result,
              'lines',
            ),
        ).toBe(false);

        expect(
          result
            .samples
            .every(
              sample =>
                Object.keys(
                  sample,
                )
                  .sort()
                  .join(
                    ',',
                  ) ===
                'normalizedFlux,wavelengthNanometers',
            ),
        ).toBe(true);
      },
    );
  },
);
