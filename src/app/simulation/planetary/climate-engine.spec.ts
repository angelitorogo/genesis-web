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
  BodySeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  greenhouseTemperatureAmplificationFactor,
  type AtmosphereGreenhouseEffect,
} from '../../domain/planetary/atmosphere-greenhouse-effect';

import {
  AtmosphereGreenhouseRegime,
} from '../../domain/planetary/atmosphere-greenhouse-regime';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ClimateEngine,
} from './climate-engine';

describe(
  'ClimateEngine point 20.5',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should produce an Earth-like equilibrium and greenhouse-amplified mean surface temperature from frozen inputs',
      () => {
        const fixture =
          systemFixture(1);

        const greenhouse =
          greenhouseFixture(
            fixture.planets[0],
            AtmosphereGreenhouseRegime.MODERATE,
            0.81,
          );

        const climate =
          ClimateEngine
            .generate(
              generationKey,
              fixture.planets[0],
              greenhouse,
            );

        expect(
          climate.equilibriumTemperatureKelvin,
        ).toBeCloseTo(
          254.6,
          1,
        );

        expect(
          climate.meanSurfaceTemperatureKelvin,
        ).toBeCloseTo(
          287,
          0,
        );

        expect(
          climate.greenhouseSurfaceWarmingKelvin,
        ).toBeGreaterThan(30);

        expect(
          climate.hasDefinedSolidSurfaceTemperature,
        ).toBe(true);
      },
    );

    it(
      'should make an airless solid world surface baseline equal to its equilibrium temperature',
      () => {
        const fixture =
          systemFixture(1);

        const greenhouse =
          greenhouseFixture(
            fixture.planets[0],
            AtmosphereGreenhouseRegime.NONE,
            0,
          );

        const climate =
          ClimateEngine
            .generate(
              generationKey,
              fixture.planets[0],
              greenhouse,
            );

        expect(
          climate.meanSurfaceTemperatureKelvin,
        ).toBeCloseTo(
          climate.equilibriumTemperatureKelvin,
          12,
        );

        expect(
          climate.greenhouseSurfaceWarmingKelvin,
        ).toBe(0);
      },
    );

    it(
      'should preserve equilibrium temperature but avoid inventing a solid-surface temperature for a deep envelope',
      () => {
        const fixture =
          systemFixture(1);

        const greenhouse =
          greenhouseFixture(
            fixture.planets[0],
            AtmosphereGreenhouseRegime.DEEP_ENVELOPE,
            6,
          );

        const climate =
          ClimateEngine
            .generate(
              generationKey,
              fixture.planets[0],
              greenhouse,
            );

        expect(
          climate.equilibriumTemperatureKelvin,
        ).toBeGreaterThan(0);

        expect(
          climate.meanSurfaceTemperatureKelvin,
        ).toBeNull();

        expect(
          climate.greenhouseSurfaceWarmingKelvin,
        ).toBeNull();
      },
    );

    it(
      'should be deterministic, freeze generateAll output and reject identity/source mismatches',
      () => {
        const fixture =
          systemFixture(2);

        const greenhouseEffects =
          fixture.planets.map(
            planet =>
              greenhouseFixture(
                planet,
                AtmosphereGreenhouseRegime.WEAK,
                0.2,
              ),
          );

        const first =
          ClimateEngine
            .generateAll(
              generationKey,
              fixture.system,
              fixture.planets,
              greenhouseEffects,
            );

        const second =
          ClimateEngine
            .generateAll(
              generationKey,
              fixture.system,
              fixture.planets,
              greenhouseEffects,
            );

        expect(
          first,
        ).toEqual(
          second,
        );

        expect(
          Object.isFrozen(
            first,
          ),
        ).toBe(true);

        expect(
          () =>
            ClimateEngine
              .generate(
                generationKey,
                fixture.planets[0],
                {
                  ...greenhouseEffects[0],
                  sourceReferenceBondAlbedo01:
                    0.5,
                } as AtmosphereGreenhouseEffect,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            ClimateEngine
              .generateAll(
                generationKey,
                fixture.system,
                [
                  fixture.planets[1],
                  fixture.planets[0],
                ],
                greenhouseEffects,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    function systemFixture(
      planetCount:
        number,
    ): {
      readonly system:
        PlanetarySystem;
      readonly planets:
        readonly Planet[];
    } {
      const systemLocator =
        new SystemLocator(
          2n,
          -5n,
          15n,
        );

      const system = {
        generationKey,
        locator:
          systemLocator,
        planetCount,
      } as PlanetarySystem;

      const planets =
        Object.freeze(
          Array.from(
            {
              length:
                planetCount,
            },
            (
              _,
              index,
            ) => {
              const planetOrdinal =
                index +
                1;

              const locator =
                new BodyLocator(
                  systemLocator.galaxyIndex,
                  systemLocator.sectorKey,
                  systemLocator.galacticObjectIndex,
                  BigInt(index),
                );

              const seed =
                new BodySeed(
                  planetOrdinal
                    .toString(16)
                    .toUpperCase()
                    .repeat(32)
                    .slice(0, 32),
                );

              return {
                generationKey,
                hostPlanetarySystem:
                  system,
                planetOrdinal,
                locator,
                seed,
                isTypePhysicallyCoherent:
                  true,
                typeClassification: {
                  referenceMeanInsolationEarth:
                    1,
                },
                referenceBondAlbedo01:
                  0.30,
              } as unknown as Planet;
            },
          ),
        );

      return {
        system,
        planets,
      };
    }

    function greenhouseFixture(
      planet:
        Planet,

      regime:
        AtmosphereGreenhouseRegime,

      opticalDepthProxy:
        number,
    ): AtmosphereGreenhouseEffect {

      const temperatureAmplificationFactor =
        regime ===
          AtmosphereGreenhouseRegime.DEEP_ENVELOPE
          ? null
          : greenhouseTemperatureAmplificationFactor(
              opticalDepthProxy,
            );

      return {
        planetOrdinal:
          planet.planetOrdinal,
        bodyLocator:
          planet.locator,
        bodySeed:
          planet.seed,
        sourceReferenceMeanInsolationEarth:
          planet.typeClassification.referenceMeanInsolationEarth,
        sourceReferenceBondAlbedo01:
          planet.referenceBondAlbedo01,
        regime,
        infraredOpticalDepthProxy:
          opticalDepthProxy,
        temperatureAmplificationFactor,
      } as AtmosphereGreenhouseEffect;
    }
  },
);
