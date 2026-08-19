import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  AtmosphericSpectralAbsorber,
  AtmosphericSpectralComponent,
  AtmosphericSpectrumProfile,
} from '../../domain/spectroscopy/atmospheric-spectrum-profile';

import {
  BodyLocator,
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

describe(
  'AtmosphericSpectrumEngine point 13.3',
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

      useBodyLocator =
        true,
    ): LeveledInstrumentObservationSession {

      const observatory =
        new Observatory(
          key,
        );

      const locator =
        useBodyLocator
          ? new BodyLocator(
              0n,
              0n,
              0n,
              0n,
            )
          : new SystemLocator(
              0n,
              0n,
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

    function profile(
      components:
        readonly AtmosphericSpectralComponent[],

      relativeColumnScale =
        1,
    ): AtmosphericSpectrumProfile {

      return new AtmosphericSpectrumProfile(
        components,
        relativeColumnScale,
      );
    }

    function component(
      absorber:
        AtmosphericSpectralAbsorber,

      volumeMixingRatio:
        number,
    ): AtmosphericSpectralComponent {

      return new AtmosphericSpectralComponent(
        absorber,
        volumeMixingRatio,
      );
    }

    function spectrum(
      atmosphericProfile:
        AtmosphericSpectrumProfile,

      level:
        ObservationInstrumentLevel =
        ObservationInstrumentLevel
          .LEVEL_3,
    ) {

      return AtmosphericSpectrumEngine
        .synthesize(
          generationKey,
          session(
            level,
          ),
          atmosphericProfile,
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
          `Missing point-13.3 sample at ${wavelengthNanometers} nm.`,
        );
      }

      return sample
        .normalizedFlux;
    }

    it(
      'should synthesize the frozen V1 visible-to-near-infrared atmospheric sampling contract',
      () => {
        const result =
          spectrum(
            profile(
              [],
              0,
            ),
          );

        expect(
          result.sampleCount,
        ).toBe(
          421,
        );

        expect(
          result
            .minimumWavelengthNanometers,
        ).toBe(
          400,
        );

        expect(
          result
            .maximumWavelengthNanometers,
        ).toBe(
          2_500,
        );

        expect(
          result
            .samples[
              0
            ]
            .wavelengthNanometers,
        ).toBe(
          400,
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
          2_500,
        );
      },
    );

    it(
      'should keep an empty atmospheric absorber profile flat',
      () => {
        const result =
          spectrum(
            profile(
              [],
              1,
            ),
          );

        expect(
          result
            .samples
            .every(
              sample =>
                sample
                  .normalizedFlux ===
                1,
            ),
        ).toBe(true);
      },
    );

    it(
      'should keep a zero relative column flat even when absorbers are present',
      () => {
        const result =
          spectrum(
            profile(
              [
                component(
                  AtmosphericSpectralAbsorber
                    .WATER_VAPOR,
                  0.1,
                ),
              ],
              0,
            ),
          );

        expect(
          result
            .samples
            .every(
              sample =>
                sample
                  .normalizedFlux ===
                1,
            ),
        ).toBe(true);
      },
    );

    it(
      'should reproduce exactly the same atmospheric spectrum for the same profile',
      () => {
        const atmosphericProfile =
          profile([
            component(
              AtmosphericSpectralAbsorber
                .WATER_VAPOR,
              0.02,
            ),
            component(
              AtmosphericSpectralAbsorber
                .CARBON_DIOXIDE,
              0.01,
            ),
          ]);

        expect(
          spectrum(
            atmosphericProfile,
          )
            .samples,
        ).toEqual(
          spectrum(
            atmosphericProfile,
          )
            .samples,
        );
      },
    );

    it(
      'should be independent of atmospheric component input ordering',
      () => {
        const water =
          component(
            AtmosphericSpectralAbsorber
              .WATER_VAPOR,
            0.02,
          );

        const carbonDioxide =
          component(
            AtmosphericSpectralAbsorber
              .CARBON_DIOXIDE,
            0.01,
          );

        const first =
          spectrum(
            profile([
              water,
              carbonDioxide,
            ]),
          );

        const second =
          spectrum(
            profile([
              carbonDioxide,
              water,
            ]),
          );

        expect(
          first.samples,
        ).toEqual(
          second.samples,
        );
      },
    );

    it(
      'should produce a simplified water-vapor absorption trough near 1400 nm',
      () => {
        const result =
          spectrum(
            profile([
              component(
                AtmosphericSpectralAbsorber
                  .WATER_VAPOR,
                0.05,
              ),
            ]),
          );

        expect(
          fluxAt(
            result,
            1_400,
          ),
        ).toBeLessThan(
          fluxAt(
            result,
            1_250,
          ),
        );
      },
    );

    it(
      'should produce a simplified carbon-dioxide absorption trough near 2000 nm',
      () => {
        const result =
          spectrum(
            profile([
              component(
                AtmosphericSpectralAbsorber
                  .CARBON_DIOXIDE,
                0.05,
              ),
            ]),
          );

        expect(
          fluxAt(
            result,
            2_000,
          ),
        ).toBeLessThan(
          fluxAt(
            result,
            1_850,
          ),
        );
      },
    );

    it(
      'should produce a simplified methane absorption trough near 2300 nm',
      () => {
        const result =
          spectrum(
            profile([
              component(
                AtmosphericSpectralAbsorber
                  .METHANE,
                0.05,
              ),
            ]),
          );

        expect(
          fluxAt(
            result,
            2_300,
          ),
        ).toBeLessThan(
          fluxAt(
            result,
            2_100,
          ),
        );
      },
    );

    it(
      'should produce a simplified molecular-oxygen A-band trough near 760 nm',
      () => {
        const result =
          spectrum(
            profile([
              component(
                AtmosphericSpectralAbsorber
                  .MOLECULAR_OXYGEN,
                0.2,
              ),
            ]),
          );

        expect(
          fluxAt(
            result,
            760,
          ),
        ).toBeLessThan(
          fluxAt(
            result,
            800,
          ),
        );
      },
    );

    it(
      'should produce a broad simplified ozone absorption depression in the visible range',
      () => {
        const result =
          spectrum(
            profile([
              component(
                AtmosphericSpectralAbsorber
                  .OZONE,
                0.01,
              ),
            ]),
          );

        expect(
          fluxAt(
            result,
            600,
          ),
        ).toBeLessThan(
          fluxAt(
            result,
            850,
          ),
        );
      },
    );

    it(
      'should make a larger represented abundance deepen the same molecular band monotonically',
      () => {
        const low =
          spectrum(
            profile([
              component(
                AtmosphericSpectralAbsorber
                  .CARBON_DIOXIDE,
                0.001,
              ),
            ]),
          );

        const high =
          spectrum(
            profile([
              component(
                AtmosphericSpectralAbsorber
                  .CARBON_DIOXIDE,
                0.1,
              ),
            ]),
          );

        expect(
          fluxAt(
            high,
            2_000,
          ),
        ).toBeLessThan(
          fluxAt(
            low,
            2_000,
          ),
        );
      },
    );

    it(
      'should make a larger relative absorbing column deepen the same molecular band monotonically',
      () => {
        const thin =
          spectrum(
            profile(
              [
                component(
                  AtmosphericSpectralAbsorber
                    .WATER_VAPOR,
                  0.05,
                ),
              ],
              0.2,
            ),
          );

        const thick =
          spectrum(
            profile(
              [
                component(
                  AtmosphericSpectralAbsorber
                    .WATER_VAPOR,
                  0.05,
                ),
              ],
              1,
            ),
          );

        expect(
          fluxAt(
            thick,
            1_400,
          ),
        ).toBeLessThan(
          fluxAt(
            thin,
            1_400,
          ),
        );
      },
    );

    it(
      'should superpose different molecular absorbers without exposing their internal line catalogue',
      () => {
        const waterOnly =
          spectrum(
            profile([
              component(
                AtmosphericSpectralAbsorber
                  .WATER_VAPOR,
                0.05,
              ),
            ]),
          );

        const mixed =
          spectrum(
            profile([
              component(
                AtmosphericSpectralAbsorber
                  .WATER_VAPOR,
                0.05,
              ),
              component(
                AtmosphericSpectralAbsorber
                  .METHANE,
                0.05,
              ),
            ]),
          );

        expect(
          fluxAt(
            mixed,
            2_300,
          ),
        ).toBeLessThan(
          fluxAt(
            waterOnly,
            2_300,
          ),
        );

        expect(
          Object.prototype
            .hasOwnProperty
            .call(
              mixed,
              'lines',
            ),
        ).toBe(false);
      },
    );

    it(
      'should keep every synthesized atmospheric sample finite, normalized and strictly wavelength-ordered',
      () => {
        const result =
          spectrum(
            profile([
              component(
                AtmosphericSpectralAbsorber
                  .WATER_VAPOR,
                0.1,
              ),
              component(
                AtmosphericSpectralAbsorber
                  .CARBON_DIOXIDE,
                0.1,
              ),
              component(
                AtmosphericSpectralAbsorber
                  .METHANE,
                0.1,
              ),
              component(
                AtmosphericSpectralAbsorber
                  .MOLECULAR_OXYGEN,
                0.2,
              ),
            ]),
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
        const atmosphericProfile =
          profile([
            component(
              AtmosphericSpectralAbsorber
                .WATER_VAPOR,
              0.05,
            ),
          ]);

        const level1 =
          spectrum(
            atmosphericProfile,
            ObservationInstrumentLevel
              .LEVEL_1,
          );

        const level5 =
          spectrum(
            atmosphericProfile,
            ObservationInstrumentLevel
              .LEVEL_5,
          );

        expect(
          level1.samples,
        ).toEqual(
          level5.samples,
        );
      },
    );

    it(
      'should reject a non-BodyLocator target instead of pretending a system is a planet or moon',
      () => {
        expect(
          () =>
            AtmosphericSpectrumEngine
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
                profile(
                  [],
                  0,
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
            AtmosphericSpectrumEngine
              .synthesize(
                generationKey,
                session(
                  ObservationInstrumentLevel
                    .LEVEL_3,
                  ObservationInstrumentType
                    .OPTICAL,
                ),
                profile(
                  [],
                  0,
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
            AtmosphericSpectrumEngine
              .synthesize(
                otherKey,
                session(),
                profile(
                  [],
                  0,
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
            AtmosphericSpectrumEngine
              .synthesize(
                unsupported,
                session(
                  ObservationInstrumentLevel
                    .LEVEL_3,
                  ObservationInstrumentType
                    .SPECTROSCOPY,
                  unsupported,
                ),
                profile(
                  [],
                  0,
                ),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should not expose atmospheric composition or relative column through the synthesized result',
      () => {
        const result =
          spectrum(
            profile(
              [
                component(
                  AtmosphericSpectralAbsorber
                    .METHANE,
                  0.05,
                ),
              ],
              0.75,
            ),
          );

        expect(
          Object.prototype
            .hasOwnProperty
            .call(
              result,
              'components',
            ),
        ).toBe(false);

        expect(
          Object.prototype
            .hasOwnProperty
            .call(
              result,
              'relativeColumnScale',
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
