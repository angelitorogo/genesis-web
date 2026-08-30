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
  type PlanetClimateState,
} from '../../domain/planetary/planet-climate-state';

import {
  PlanetClimateStabilityRegime,
} from '../../domain/planetary/planet-climate-stability-regime';

import {
  type PlanetClimateVariabilityState,
} from '../../domain/planetary/planet-climate-variability-state';

import {
  PlanetSurfaceWaterRegime,
} from '../../domain/planetary/planet-surface-water-regime';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  PlanetWaterPhaseRegime,
} from '../../domain/planetary/planet-water-phase-regime';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  PlanetWaterEngine,
  WATER_V1_TRIPLE_POINT_PRESSURE_PASCAL,
  waterBoilingTemperatureKelvinForPressurePascal,
} from './planet-water-engine';

describe(
  'PlanetWaterEngine point 20.7',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should freeze pressure-dependent ordinary liquid-water boundaries',
      () => {
        expect(
          waterBoilingTemperatureKelvinForPressurePascal(
            WATER_V1_TRIPLE_POINT_PRESSURE_PASCAL -
              0.001,
          ),
        ).toBeNull();

        expect(
          waterBoilingTemperatureKelvinForPressurePascal(
            101_325,
          )!,
        ).toBeCloseTo(
          373.15,
          1,
        );

        expect(
          waterBoilingTemperatureKelvinForPressurePascal(
            1_000_000,
          )!,
        ).toBeGreaterThan(450);
      },
    );

    it(
      'should realize a temperate water-rich world as persistent ocean-scale liquid water',
      () => {
        const fixture =
          waterFixture({
            planetType:
              PlanetType.OCEAN,
            iceBearingInteriorFraction01:
              0.55,
            retainedSurfacePressurePascal:
              101_325,
            retainedWaterVaporMoleFraction01:
              0.015,
            meanSurfaceTemperatureKelvin:
              288,
            minimumSurfaceTemperatureKelvin:
              260,
            maximumSurfaceTemperatureKelvin:
              310,
            stabilityIndex01:
              0.84,
          });

        const inventory =
          PlanetWaterEngine
            .generate(
              generationKey,
              fixture.planet,
              fixture.retention,
              fixture.climate,
              fixture.variability,
            );

        expect(
          inventory.waterInventoryIndex01,
        ).toBeGreaterThan(0.8);

        expect(
          inventory.phaseRegime,
        ).toBe(
          PlanetWaterPhaseRegime.ICE_AND_LIQUID,
        );

        expect(
          inventory.surfaceWaterRegime,
        ).toBe(
          PlanetSurfaceWaterRegime.OCEANS,
        );

        expect(
          inventory.surfaceLiquidWaterCoverageFraction01!,
        ).toBeGreaterThan(0.35);

        expect(
          inventory.hasPersistentSurfaceLiquidWater,
        ).toBe(true);
      },
    );

    it(
      'should realize cold water-rich worlds as ice-dominated without liquid surface coverage',
      () => {
        const fixture =
          waterFixture({
            planetType:
              PlanetType.ICE,
            iceBearingInteriorFraction01:
              0.7,
            retainedWaterVaporMoleFraction01:
              0,
            meanSurfaceTemperatureKelvin:
              220,
            minimumSurfaceTemperatureKelvin:
              180,
            maximumSurfaceTemperatureKelvin:
              245,
          });

        const inventory =
          PlanetWaterEngine
            .generate(
              generationKey,
              fixture.planet,
              fixture.retention,
              fixture.climate,
              fixture.variability,
            );

        expect(
          inventory.phaseRegime,
        ).toBe(
          PlanetWaterPhaseRegime.ICE,
        );

        expect(
          inventory.surfaceIceCoverageFraction01!,
        ).toBeGreaterThan(0.7);

        expect(
          inventory.surfaceLiquidWaterCoverageFraction01,
        ).toBe(0);
      },
    );

    it(
      'should realize very hot worlds as vapor-dominated and suppress ordinary surface liquid water',
      () => {
        const fixture =
          waterFixture({
            planetType:
              PlanetType.OCEAN,
            iceBearingInteriorFraction01:
              0.5,
            retainedWaterVaporMoleFraction01:
              0.08,
            meanSurfaceTemperatureKelvin:
              450,
            minimumSurfaceTemperatureKelvin:
              400,
            maximumSurfaceTemperatureKelvin:
              500,
          });

        const inventory =
          PlanetWaterEngine
            .generate(
              generationKey,
              fixture.planet,
              fixture.retention,
              fixture.climate,
              fixture.variability,
            );

        expect(
          inventory.phaseRegime,
        ).toBe(
          PlanetWaterPhaseRegime.VAPOR,
        );

        expect(
          inventory.surfaceWaterRegime,
        ).toBe(
          PlanetSurfaceWaterRegime.NONE,
        );

        expect(
          inventory.hasPersistentSurfaceLiquidWater,
        ).toBe(false);
      },
    );

    it(
      'should forbid ordinary liquid water below the triple-point pressure even when temperatures cross freezing',
      () => {
        const fixture =
          waterFixture({
            planetType:
              PlanetType.ROCKY,
            iceBearingInteriorFraction01:
              0.4,
            retainedSurfacePressurePascal:
              500,
            retainedWaterVaporMoleFraction01:
              0,
            meanSurfaceTemperatureKelvin:
              280,
            minimumSurfaceTemperatureKelvin:
              260,
            maximumSurfaceTemperatureKelvin:
              300,
          });

        const inventory =
          PlanetWaterEngine
            .generate(
              generationKey,
              fixture.planet,
              fixture.retention,
              fixture.climate,
              fixture.variability,
            );

        expect(
          inventory.liquidFraction01,
        ).toBe(0);

        expect(
          inventory.phaseRegime,
        ).toBe(
          PlanetWaterPhaseRegime.ICE_AND_VAPOR,
        );

        expect(
          inventory.surfaceLiquidWaterCoverageFraction01,
        ).toBe(0);
      },
    );

    it(
      'should preserve deep-envelope semantics without inventing a solid-surface hydrosphere',
      () => {
        const fixture =
          waterFixture({
            planetType:
              PlanetType.GAS_GIANT,
            iceBearingInteriorFraction01:
              0.2,
            retainedSurfacePressurePascal:
              null,
            retainedWaterVaporMoleFraction01:
              0.03,
            meanSurfaceTemperatureKelvin:
              null,
            minimumSurfaceTemperatureKelvin:
              null,
            maximumSurfaceTemperatureKelvin:
              null,
            stabilityIndex01:
              null,
          });

        const inventory =
          PlanetWaterEngine
            .generate(
              generationKey,
              fixture.planet,
              fixture.retention,
              fixture.climate,
              fixture.variability,
            );

        expect(
          inventory.phaseRegime,
        ).toBe(
          PlanetWaterPhaseRegime.DEEP_ENVELOPE,
        );

        expect(
          inventory.surfaceWaterRegime,
        ).toBe(
          PlanetSurfaceWaterRegime.DEEP_ENVELOPE,
        );

        expect(
          inventory.surfaceLiquidWaterCoverageFraction01,
        ).toBeNull();
      },
    );

    it(
      'should be deterministic, freeze generateAll and reject cross-body climate handoffs',
      () => {
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
          planetCount:
            2,
        } as PlanetarySystem;

        const firstFixture =
          waterFixture(
            {},
            1,
            system,
          );

        const secondFixture =
          waterFixture(
            {
              planetType:
                PlanetType.ICE,
              meanSurfaceTemperatureKelvin:
                240,
              minimumSurfaceTemperatureKelvin:
                210,
              maximumSurfaceTemperatureKelvin:
                265,
            },
            2,
            system,
          );

        const first =
          PlanetWaterEngine
            .generateAll(
              generationKey,
              system,
              [
                firstFixture.planet,
                secondFixture.planet,
              ],
              [
                firstFixture.retention,
                secondFixture.retention,
              ],
              [
                firstFixture.climate,
                secondFixture.climate,
              ],
              [
                firstFixture.variability,
                secondFixture.variability,
              ],
            );

        const second =
          PlanetWaterEngine
            .generateAll(
              generationKey,
              system,
              [
                firstFixture.planet,
                secondFixture.planet,
              ],
              [
                firstFixture.retention,
                secondFixture.retention,
              ],
              [
                firstFixture.climate,
                secondFixture.climate,
              ],
              [
                firstFixture.variability,
                secondFixture.variability,
              ],
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
            PlanetWaterEngine
              .generate(
                generationKey,
                firstFixture.planet,
                {
                  ...firstFixture.retention,
                  planetOrdinal:
                    2,
                } as AtmosphereRetentionState,
                firstFixture.climate,
                firstFixture.variability,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    function waterFixture(
      overrides: {
        readonly planetType?:
          PlanetType;
        readonly iceBearingInteriorFraction01?:
          number;
        readonly retainedSurfacePressurePascal?:
          number | null;
        readonly retainedWaterVaporMoleFraction01?:
          number;
        readonly meanSurfaceTemperatureKelvin?:
          number | null;
        readonly minimumSurfaceTemperatureKelvin?:
          number | null;
        readonly maximumSurfaceTemperatureKelvin?:
          number | null;
        readonly stabilityIndex01?:
          number | null;
      },

      planetOrdinal:
        number = 1,

      suppliedSystem?:
        PlanetarySystem,
    ): {
      readonly planet:
        Planet;
      readonly retention:
        AtmosphereRetentionState;
      readonly climate:
        PlanetClimateState;
      readonly variability:
        PlanetClimateVariabilityState;
    } {
      const systemLocator =
        suppliedSystem
          ?.locator ??
        new SystemLocator(
          2n,
          -5n,
          15n,
        );

      const system =
        suppliedSystem ??
        ({
          generationKey,
          locator:
            systemLocator,
          planetCount:
            1,
        } as PlanetarySystem);

      const locator =
        new BodyLocator(
          systemLocator.galaxyIndex,
          systemLocator.sectorKey,
          systemLocator.galacticObjectIndex,
          BigInt(
            planetOrdinal -
              1,
          ),
        );

      const seed =
        new BodySeed(
          planetOrdinal
            .toString(16)
            .toUpperCase()
            .repeat(32)
            .slice(0, 32),
        );

      const planetType =
        overrides.planetType ??
        PlanetType.ROCKY;

      const iceBearingInteriorFraction01 =
        overrides.iceBearingInteriorFraction01 ??
        0.3;

      const retainedSurfacePressurePascal =
        overrides.retainedSurfacePressurePascal ===
          undefined
          ? 101_325
          : overrides.retainedSurfacePressurePascal;

      const retainedWaterVaporMoleFraction01 =
        overrides.retainedWaterVaporMoleFraction01 ??
        0.01;

      const meanSurfaceTemperatureKelvin =
        overrides.meanSurfaceTemperatureKelvin ===
          undefined
          ? 288
          : overrides.meanSurfaceTemperatureKelvin;

      const minimumSurfaceTemperatureKelvin =
        overrides.minimumSurfaceTemperatureKelvin ===
          undefined
          ? meanSurfaceTemperatureKelvin ===
              null
            ? null
            : meanSurfaceTemperatureKelvin -
              20
          : overrides.minimumSurfaceTemperatureKelvin;

      const maximumSurfaceTemperatureKelvin =
        overrides.maximumSurfaceTemperatureKelvin ===
          undefined
          ? meanSurfaceTemperatureKelvin ===
              null
            ? null
            : meanSurfaceTemperatureKelvin +
              20
          : overrides.maximumSurfaceTemperatureKelvin;

      const stabilityIndex01 =
        overrides.stabilityIndex01 ===
          undefined
          ? meanSurfaceTemperatureKelvin ===
              null
            ? null
            : 0.84
          : overrides.stabilityIndex01;

      const planet = {
        generationKey,
        hostPlanetarySystem:
          system,
        planetOrdinal,
        locator,
        seed,
        planetType,
        internalComposition: {
          iceBearingFractionOfSolids01:
            iceBearingInteriorFraction01,
        },
        isTypePhysicallyCoherent:
          true,
      } as unknown as Planet;

      const deepEnvelope =
        retainedSurfacePressurePascal ===
        null;

      const retainedGasComponents =
        retainedWaterVaporMoleFraction01 >
          0
          ? [
              new AtmosphereGasComponent(
                AtmosphereGas.WATER_VAPOR,
                retainedWaterVaporMoleFraction01,
              ),
              ...(
                retainedWaterVaporMoleFraction01 <
                1
                  ? [
                      new AtmosphereGasComponent(
                        AtmosphereGas.NITROGEN,
                        1 -
                          retainedWaterVaporMoleFraction01,
                      ),
                    ]
                  : []
              ),
            ]
          : retainedSurfacePressurePascal ===
              0
            ? []
            : [
                new AtmosphereGasComponent(
                  AtmosphereGas.NITROGEN,
                  1,
                ),
              ];

      const retention = {
        planetOrdinal,
        bodyLocator:
          locator,
        bodySeed:
          seed,
        retentionRegime:
          deepEnvelope
            ? AtmosphereRetentionRegime.DEEP_ENVELOPE
            : retainedSurfacePressurePascal ===
                0
              ? AtmosphereRetentionRegime.VACUUM
              : AtmosphereRetentionRegime.WELL_RETAINED,
        retainedPressureRegime:
          deepEnvelope
            ? AtmospherePressureRegime.DEEP_ENVELOPE
            : retainedSurfacePressurePascal ===
                0
              ? AtmospherePressureRegime.VACUUM
              : AtmospherePressureRegime.MODERATE,
        retainedSurfacePressurePascal,
        retainedGasComponents,
      } as unknown as AtmosphereRetentionState;

      const climate = {
        planetOrdinal,
        bodyLocator:
          locator,
        bodySeed:
          seed,
        equilibriumTemperatureKelvin:
          255,
        meanSurfaceTemperatureKelvin,
      } as PlanetClimateState;

      const variability = {
        planetOrdinal,
        bodyLocator:
          locator,
        bodySeed:
          seed,
        sourceEquilibriumTemperatureKelvin:
          climate.equilibriumTemperatureKelvin,
        sourceMeanSurfaceTemperatureKelvin:
          climate.meanSurfaceTemperatureKelvin,
        sourceRetainedSurfacePressurePascal:
          retainedSurfacePressurePascal,
        minimumSurfaceTemperatureKelvin,
        maximumSurfaceTemperatureKelvin,
        stabilityIndex01,
        stabilityRegime:
          deepEnvelope
            ? PlanetClimateStabilityRegime.DEEP_ENVELOPE
            : PlanetClimateStabilityRegime.STABLE,
      } as PlanetClimateVariabilityState;

      return {
        planet,
        retention,
        climate,
        variability,
      };
    }
  },
);
