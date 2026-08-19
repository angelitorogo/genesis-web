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
  type Galaxy,
} from '../../domain/universe/galaxy';

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
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  ActiveNucleusSpectrumEngine,
} from './active-nucleus-spectrum-engine';

describe(
  'ActiveNucleusSpectrumEngine point 13.5',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const agnGalaxy =
      GalaxyGenerator
        .generate(
          generationKey,
          20n,
        );

    const quasarGalaxy =
      GalaxyGenerator
        .generate(
          generationKey,
          331n,
        );

    const quiescentGalaxy =
      GalaxyGenerator
        .generate(
          generationKey,
          0n,
        );

    function session(
      galaxyIndex:
        bigint,

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

      useGalaxyLocator =
        true,
    ): LeveledInstrumentObservationSession {

      const observatory =
        new Observatory(
          key,
        );

      const locator =
        useGalaxyLocator
          ? new GalaxyLocator(
              galaxyIndex,
            )
          : new SystemLocator(
              galaxyIndex,
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

    function spectrum(
      galaxy:
        Galaxy,

      level:
        ObservationInstrumentLevel =
        ObservationInstrumentLevel
          .LEVEL_3,
    ) {

      return ActiveNucleusSpectrumEngine
        .synthesize(
          generationKey,
          session(
            galaxy.index,
            level,
          ),
          galaxy,
        );
    }

    function nearestFlux(
      synthesized:
        ReturnType<
          typeof spectrum
        >,

      wavelengthNanometers:
        number,
    ): number {

      let nearest =
        synthesized
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
        of synthesized
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
      'should synthesize the frozen V1 optical/UV active-nucleus sampling contract',
      () => {
        const result =
          spectrum(
            agnGalaxy,
          );

        expect(
          result.sampleCount,
        ).toBe(
          1_601,
        );

        expect(
          result
            .minimumWavelengthNanometers,
        ).toBe(
          100,
        );

        expect(
          result
            .maximumWavelengthNanometers,
        ).toBe(
          900,
        );
      },
    );

    it(
      'should synthesize an already-existing AGN without inventing a new compact-object identity',
      () => {
        expect(
          () =>
            spectrum(
              agnGalaxy,
            ),
        ).not.toThrow();
      },
    );

    it(
      'should synthesize an already-existing QUASAR without inventing a new compact-object identity',
      () => {
        expect(
          () =>
            spectrum(
              quasarGalaxy,
            ),
        ).not.toThrow();
      },
    );

    it(
      'should reproduce exactly the same active-nucleus spectrum for the same Ground Truth',
      () => {
        expect(
          spectrum(
            agnGalaxy,
          )
            .samples,
        ).toEqual(
          spectrum(
            agnGalaxy,
          )
            .samples,
        );
      },
    );

    it(
      'should keep the AGN and QUASAR V1 templates spectrally distinct',
      () => {
        expect(
          spectrum(
            agnGalaxy,
          )
            .samples,
        ).not.toEqual(
          spectrum(
            quasarGalaxy,
          )
            .samples,
        );
      },
    );

    it(
      'should keep the active-nucleus continuum blue/UV enhanced relative to the red optical tail',
      () => {
        const result =
          spectrum(
            agnGalaxy,
          );

        expect(
          nearestFlux(
            result,
            220,
          ),
        ).toBeGreaterThan(
          nearestFlux(
            result,
            850,
          ),
        );
      },
    );

    it(
      'should give the QUASAR template a stronger far-UV-to-red contrast than the AGN template',
      () => {
        const agn =
          spectrum(
            agnGalaxy,
          );

        const quasar =
          spectrum(
            quasarGalaxy,
          );

        const agnContrast =
          nearestFlux(
            agn,
            120,
          ) /
          nearestFlux(
            agn,
            850,
          );

        const quasarContrast =
          nearestFlux(
            quasar,
            120,
          ) /
          nearestFlux(
            quasar,
            850,
          );

        expect(
          quasarContrast,
        ).toBeGreaterThan(
          agnContrast,
        );
      },
    );

    it(
      'should contain a simplified broad Ly-alpha emission enhancement',
      () => {
        const result =
          spectrum(
            quasarGalaxy,
          );

        expect(
          nearestFlux(
            result,
            121.6,
          ),
        ).toBeGreaterThan(
          nearestFlux(
            result,
            135,
          ),
        );
      },
    );

    it(
      'should contain a simplified broad C-IV emission enhancement',
      () => {
        const result =
          spectrum(
            quasarGalaxy,
          );

        expect(
          nearestFlux(
            result,
            154.9,
          ),
        ).toBeGreaterThan(
          nearestFlux(
            result,
            175,
          ),
        );
      },
    );

    it(
      'should contain a simplified broad Mg-II emission enhancement',
      () => {
        const result =
          spectrum(
            agnGalaxy,
          );

        expect(
          nearestFlux(
            result,
            279.8,
          ),
        ).toBeGreaterThan(
          nearestFlux(
            result,
            330,
          ),
        );
      },
    );

    it(
      'should contain simplified broad Balmer emission enhancements',
      () => {
        const result =
          spectrum(
            agnGalaxy,
          );

        expect(
          nearestFlux(
            result,
            486.1,
          ),
        ).toBeGreaterThan(
          nearestFlux(
            result,
            450,
          ),
        );

        expect(
          nearestFlux(
            result,
            656.3,
          ),
        ).toBeGreaterThan(
          nearestFlux(
            result,
            610,
          ),
        );
      },
    );

    it(
      'should reject a quiescent nucleus instead of inventing an accretion spectrum where point 13.5 does not apply',
      () => {
        expect(
          () =>
            spectrum(
              quiescentGalaxy,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a non-GalaxyLocator target',
      () => {
        expect(
          () =>
            ActiveNucleusSpectrumEngine
              .synthesize(
                generationKey,
                session(
                  agnGalaxy.index,
                  ObservationInstrumentLevel
                    .LEVEL_3,
                  ObservationInstrumentType
                    .SPECTROSCOPY,
                  generationKey,
                  false,
                ),
                agnGalaxy,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a GalaxyLocator that points to a different galaxy',
      () => {
        expect(
          () =>
            ActiveNucleusSpectrumEngine
              .synthesize(
                generationKey,
                session(
                  agnGalaxy.index +
                  1n,
                ),
                agnGalaxy,
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
            ActiveNucleusSpectrumEngine
              .synthesize(
                generationKey,
                session(
                  agnGalaxy.index,
                  ObservationInstrumentLevel
                    .LEVEL_3,
                  ObservationInstrumentType
                    .OPTICAL,
                ),
                agnGalaxy,
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
            ActiveNucleusSpectrumEngine
              .synthesize(
                otherKey,
                session(
                  agnGalaxy.index,
                ),
                agnGalaxy,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a generation key that differs from the supplied Galaxy Ground Truth',
      () => {
        const otherKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '1111-2222-3333-4444-5555-6666-7777-8888',
            ),
            GeneratorVersion.V1,
          );

        const foreignGalaxy =
          GalaxyGenerator
            .generate(
              otherKey,
              20n,
            );

        expect(
          () =>
            ActiveNucleusSpectrumEngine
              .synthesize(
                generationKey,
                session(
                  foreignGalaxy.index,
                ),
                foreignGalaxy,
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

        const unsupportedGalaxy =
          {
            ...agnGalaxy,
            generationKey:
              unsupported,
          } as Galaxy;

        expect(
          () =>
            ActiveNucleusSpectrumEngine
              .synthesize(
                unsupported,
                session(
                  unsupportedGalaxy
                    .index,
                  ObservationInstrumentLevel
                    .LEVEL_3,
                  ObservationInstrumentType
                    .SPECTROSCOPY,
                  unsupported,
                ),
                unsupportedGalaxy,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should remain level-independent until point 13.7 applies instrument-dependent uncertainty',
      () => {
        const level1 =
          spectrum(
            agnGalaxy,
            ObservationInstrumentLevel
              .LEVEL_1,
          );

        const level5 =
          spectrum(
            agnGalaxy,
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
      'should keep every active-nucleus sample finite, normalized and strictly wavelength-ordered',
      () => {
        const result =
          spectrum(
            quasarGalaxy,
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
      'should not expose nucleus state, SMBH properties or the internal broad-line catalogue through the synthesized result',
      () => {
        const result =
          spectrum(
            quasarGalaxy,
          );

        for (
          const forbiddenProperty
          of [
            'nucleusState',
            'nucleus',
            'supermassiveBlackHole',
            'supermassiveBlackHoleMassSolarMasses',
            'accretionRate',
            'spin',
            'jetPower',
            'lines',
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
