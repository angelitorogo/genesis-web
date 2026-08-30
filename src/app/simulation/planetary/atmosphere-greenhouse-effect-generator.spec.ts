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
  AtmosphereGas,
} from '../../domain/planetary/atmosphere-gas';

import {
  AtmosphereGasComponent,
} from '../../domain/planetary/atmosphere-gas-component';

import {
  AtmosphereGreenhouseRegime,
} from '../../domain/planetary/atmosphere-greenhouse-regime';

import {
  AtmospherePressureRegime,
} from '../../domain/planetary/atmosphere-pressure-regime';

import {
  AtmosphereRetentionRegime,
} from '../../domain/planetary/atmosphere-retention-regime';

import {
  type AtmosphereRetentionState,
} from '../../domain/planetary/atmosphere-retention-state';

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
  AtmosphereGreenhouseEffectGenerator,
} from './atmosphere-greenhouse-effect-generator';

describe(
  'AtmosphereGreenhouseEffectGenerator point 20.4',
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
        2n,
        -5n,
        14n,
      );

    const system = {
      generationKey,
      locator:
        systemLocator,
      planetCount:
        3,
    } as PlanetarySystem;

    it(
      'should derive greenhouse strength from retained greenhouse gases rather than inert bulk gas',
      () => {
        const planet =
          planetFixture(1);

        const inert =
          AtmosphereGreenhouseEffectGenerator
            .generate(
              generationKey,
              planet,
              retentionFixture(
                planet,
                [
                  new AtmosphereGasComponent(
                    AtmosphereGas.NITROGEN,
                    1,
                  ),
                ],
                101_325,
              ),
            );

        const moist =
          AtmosphereGreenhouseEffectGenerator
            .generate(
              generationKey,
              planet,
              retentionFixture(
                planet,
                [
                  new AtmosphereGasComponent(
                    AtmosphereGas.NITROGEN,
                    0.99,
                  ),
                  new AtmosphereGasComponent(
                    AtmosphereGas.WATER_VAPOR,
                    0.01,
                  ),
                ],
                101_325,
              ),
            );

        expect(
          inert.infraredOpticalDepthProxy,
        ).toBe(0);

        expect(
          inert.regime,
        ).toBe(
          AtmosphereGreenhouseRegime.NONE,
        );

        expect(
          moist.infraredOpticalDepthProxy,
        ).toBeGreaterThan(0.5);

        expect(
          moist.temperatureAmplificationFactor!,
        ).toBeGreaterThan(1);
      },
    );

    it(
      'should strengthen the same retained composition at higher surface pressure through pressure broadening',
      () => {
        const planet =
          planetFixture(1);

        const gases = [
          new AtmosphereGasComponent(
            AtmosphereGas.NITROGEN,
            0.99,
          ),
          new AtmosphereGasComponent(
            AtmosphereGas.WATER_VAPOR,
            0.01,
          ),
        ];

        const thin =
          AtmosphereGreenhouseEffectGenerator
            .generate(
              generationKey,
              planet,
              retentionFixture(
                planet,
                gases,
                10_000,
              ),
            );

        const dense =
          AtmosphereGreenhouseEffectGenerator
            .generate(
              generationKey,
              planet,
              retentionFixture(
                planet,
                gases,
                1_000_000,
              ),
            );

        expect(
          dense.pressureBroadeningFactor,
        ).toBeGreaterThan(
          thin.pressureBroadeningFactor,
        );

        expect(
          dense.infraredOpticalDepthProxy,
        ).toBeGreaterThan(
          thin.infraredOpticalDepthProxy,
        );
      },
    );

    it(
      'should preserve vacuum and deep-envelope semantics without inventing a climate surface temperature',
      () => {
        const solid =
          planetFixture(1);

        const vacuum =
          AtmosphereGreenhouseEffectGenerator
            .generate(
              generationKey,
              solid,
              retentionFixture(
                solid,
                [],
                0,
                AtmosphereRetentionRegime.VACUUM,
              ),
            );

        expect(
          vacuum.regime,
        ).toBe(
          AtmosphereGreenhouseRegime.NONE,
        );

        expect(
          vacuum.temperatureAmplificationFactor,
        ).toBe(1);

        const giant =
          planetFixture(
            2,
            0.55,
          );

        const deep =
          AtmosphereGreenhouseEffectGenerator
            .generate(
              generationKey,
              giant,
              retentionFixture(
                giant,
                [
                  new AtmosphereGasComponent(
                    AtmosphereGas.HYDROGEN,
                    0.9,
                  ),
                  new AtmosphereGasComponent(
                    AtmosphereGas.HELIUM,
                    0.1,
                  ),
                ],
                null,
                AtmosphereRetentionRegime.DEEP_ENVELOPE,
              ),
            );

        expect(
          deep.regime,
        ).toBe(
          AtmosphereGreenhouseRegime.DEEP_ENVELOPE,
        );

        expect(
          deep.infraredOpticalDepthProxy,
        ).toBeGreaterThanOrEqual(4);

        expect(
          deep.temperatureAmplificationFactor,
        ).toBeNull();

        expect(
          'surfaceTemperatureKelvin' in
            deep,
        ).toBe(false);
      },
    );

    it(
      'should be exactly deterministic and preserve frozen planetOrdinal order in generateAll',
      () => {
        const planets = [
          planetFixture(1),
          planetFixture(2),
          planetFixture(3),
        ];

        const states =
          planets.map(
            planet =>
              retentionFixture(
                planet,
                [
                  new AtmosphereGasComponent(
                    AtmosphereGas.CARBON_DIOXIDE,
                    0.02,
                  ),
                  new AtmosphereGasComponent(
                    AtmosphereGas.NITROGEN,
                    0.98,
                  ),
                ],
                80_000 +
                  planet.planetOrdinal *
                    10_000,
              ),
          );

        const before =
          AtmosphereGreenhouseEffectGenerator
            .generateAll(
              generationKey,
              system,
              planets,
              states,
            );

        AtmosphereGreenhouseEffectGenerator
          .generate(
            generationKey,
            planets[2],
            states[2],
          );

        const after =
          AtmosphereGreenhouseEffectGenerator
            .generateAll(
              generationKey,
              system,
              planets,
              states,
            );

        expect(
          Object.isFrozen(
            before,
          ),
        ).toBe(true);

        expect(
          before.map(
            effect =>
              effect.planetOrdinal,
          ),
        ).toEqual([
          1,
          2,
          3,
        ]);

        expect(
          after,
        ).toEqual(
          before,
        );
      },
    );

    function planetFixture(
      planetOrdinal:
        number,

      envelopeMassFraction01 =
        0.01,
    ): Planet {

      const bodyLocator =
        new BodyLocator(
          systemLocator.galaxyIndex,
          systemLocator.sectorKey,
          systemLocator.galacticObjectIndex,
          BigInt(
            planetOrdinal -
              1,
          ),
        );

      const bodySeed =
        new BodySeed(
          planetOrdinal
            .toString(16)
            .padStart(
              32,
              '0',
            ),
        );

      return {
        generationKey,
        hostPlanetarySystem:
          system,
        planetOrdinal,
        locator:
          bodyLocator,
        seed:
          bodySeed,
        isTypePhysicallyCoherent:
          true,
        typeClassification: {
          referenceMeanInsolationEarth:
            1,
        },
        referenceBondAlbedo01:
          0.3,
        physicalProperties: {
          envelopeMassFraction01,
        },
      } as Planet;
    }

    function retentionFixture(
      planet:
        Planet,

      gasComponents:
        readonly AtmosphereGasComponent[],

      retainedSurfacePressurePascal:
        number | null,

      retentionRegime:
        AtmosphereRetentionRegime =
          AtmosphereRetentionRegime.WELL_RETAINED,
    ): AtmosphereRetentionState {

      const isVacuum =
        retentionRegime ===
        AtmosphereRetentionRegime.VACUUM;

      const isDeepEnvelope =
        retentionRegime ===
        AtmosphereRetentionRegime.DEEP_ENVELOPE;

      return {
        planetOrdinal:
          planet.planetOrdinal,
        bodyLocator:
          planet.locator,
        bodySeed:
          planet.seed,
        sourceReferenceMeanInsolationEarth:
          1,
        sourceReferenceBondAlbedo01:
          0.3,
        retentionRegime,
        retainedPressureRegime:
          isVacuum
            ? AtmospherePressureRegime.VACUUM
            : isDeepEnvelope
              ? AtmospherePressureRegime.DEEP_ENVELOPE
              : AtmospherePressureRegime.MODERATE,
        retainedSurfacePressurePascal,
        retainedMoleInventoryFraction01:
          isVacuum
            ? 0
            : 0.9,
        retainedGasComponents:
          gasComponents,
      } as AtmosphereRetentionState;
    }
  },
);
