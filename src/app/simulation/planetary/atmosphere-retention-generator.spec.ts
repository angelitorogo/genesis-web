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
  ATMOSPHERE_V1_DEEP_ENVELOPE_REFERENCE_PRESSURE_PASCAL,
  ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
  AtmosphereBulkProperties,
  idealGasDensityKilogramsPerCubicMeter,
} from '../../domain/planetary/atmosphere-bulk-properties';

import {
  AtmosphereGas,
  atmosphereGasMolarMassGramsPerMole,
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
  type Planet,
} from '../../domain/planetary/planet';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  AtmosphereRetentionGenerator,
} from './atmosphere-retention-generator';

describe(
  'AtmosphereRetentionGenerator point 20.3',
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
        3n,
        -7n,
        21n,
      );

    const system = {
      generationKey,
      locator:
        systemLocator,
      planetCount:
        3,
    } as PlanetarySystem;

    it(
      'should preferentially lose light gases while conserving and renormalizing the surviving source inventory',
      () => {
        const planet =
          planetFixture(
            1,
            {
              massEarth:
                1,
              radiusEarth:
                1,
              referenceMeanInsolationEarth:
                1,
              referenceBondAlbedo01:
                0.3,
            },
          );

        const bulk =
          bulkFixture(
            planet,
            [
              new AtmosphereGasComponent(
                AtmosphereGas.HYDROGEN,
                0.5,
              ),
              new AtmosphereGasComponent(
                AtmosphereGas.CARBON_DIOXIDE,
                0.5,
              ),
            ],
            100_000,
          );

        const state =
          AtmosphereRetentionGenerator
            .generate(
              generationKey,
              planet,
              bulk,
            );

        const hydrogen =
          state.gasRetentions.find(
            retention =>
              retention.gas ===
              AtmosphereGas.HYDROGEN,
          )!;

        const carbonDioxide =
          state.gasRetentions.find(
            retention =>
              retention.gas ===
              AtmosphereGas.CARBON_DIOXIDE,
          )!;

        expect(
          hydrogen.retentionFraction01 <
            carbonDioxide.retentionFraction01,
        ).toBe(true);

        expect(
          hydrogen.retainedMoleFraction01 <
            0.5,
        ).toBe(true);

        expect(
          state.retainedSurfacePressurePascal! <
            bulk.surfacePressurePascal!,
        ).toBe(true);

        expect(
          state.retainedMoleInventoryFraction01 +
            state.lostMoleInventoryFraction01,
        ).toBeCloseTo(
          1,
          12,
        );

        expect(
          state.retainedGasComponents.reduce(
            (
              total,
              component,
            ) =>
              total +
              component.moleFraction01,
            0,
          ),
        ).toBeCloseTo(
          1,
          12,
        );
      },
    );

    it(
      'should retain less of the same gas inventory under much stronger irradiation',
      () => {
        const coolPlanet =
          planetFixture(
            1,
            {
              referenceMeanInsolationEarth:
                0.2,
            },
          );

        const hotPlanet =
          planetFixture(
            2,
            {
              referenceMeanInsolationEarth:
                1_000,
            },
          );

        const nitrogen = [
          new AtmosphereGasComponent(
            AtmosphereGas.NITROGEN,
            1,
          ),
        ];

        const cool =
          AtmosphereRetentionGenerator
            .generate(
              generationKey,
              coolPlanet,
              bulkFixture(
                coolPlanet,
                nitrogen,
                100_000,
              ),
            );

        const hot =
          AtmosphereRetentionGenerator
            .generate(
              generationKey,
              hotPlanet,
              bulkFixture(
                hotPlanet,
                nitrogen,
                100_000,
              ),
            );

        expect(
          hot.retainedMoleInventoryFraction01 <
            cool.retainedMoleInventoryFraction01,
        ).toBe(true);

        expect(
          hot.escapeHeatingFactor,
        ).toBeGreaterThan(
          cool.escapeHeatingFactor,
        );
      },
    );

    it(
      'should retain more gas in a deeper planetary escape well',
      () => {
        const shallow =
          planetFixture(
            1,
            {
              massEarth:
                0.2,
              radiusEarth:
                0.7,
            },
          );

        const deep =
          planetFixture(
            2,
            {
              massEarth:
                5,
              radiusEarth:
                1.6,
              planetType:
                PlanetType.SUPER_EARTH,
            },
          );

        const gas = [
          new AtmosphereGasComponent(
            AtmosphereGas.NITROGEN,
            1,
          ),
        ];

        const shallowState =
          AtmosphereRetentionGenerator
            .generate(
              generationKey,
              shallow,
              bulkFixture(
                shallow,
                gas,
                100_000,
              ),
            );

        const deepState =
          AtmosphereRetentionGenerator
            .generate(
              generationKey,
              deep,
              bulkFixture(
                deep,
                gas,
                100_000,
              ),
            );

        expect(
          deepState.escapeVelocityKilometersPerSecond,
        ).toBeGreaterThan(
          shallowState.escapeVelocityKilometersPerSecond,
        );

        expect(
          deepState.retainedMoleInventoryFraction01,
        ).toBeGreaterThan(
          shallowState.retainedMoleInventoryFraction01,
        );
      },
    );

    it(
      'should preserve deep-envelope pressure semantics while allowing preferential light-gas loss diagnostics',
      () => {
        const planet =
          planetFixture(
            1,
            {
              massEarth:
                100,
              radiusEarth:
                10,
              planetType:
                PlanetType.GAS_GIANT,
              envelopeMassFraction01:
                0.7,
              referenceMeanInsolationEarth:
                3,
            },
          );

        const bulk =
          bulkFixture(
            planet,
            [
              new AtmosphereGasComponent(
                AtmosphereGas.HYDROGEN,
                0.8,
              ),
              new AtmosphereGasComponent(
                AtmosphereGas.HELIUM,
                0.2,
              ),
            ],
            null,
          );

        const state =
          AtmosphereRetentionGenerator
            .generate(
              generationKey,
              planet,
              bulk,
            );

        expect(
          state.retentionRegime,
        ).toBe(
          AtmosphereRetentionRegime.DEEP_ENVELOPE,
        );

        expect(
          state.retainedSurfacePressurePascal,
        ).toBeNull();

        expect(
          state.retainedPressureRegime,
        ).toBe(
          AtmospherePressureRegime.DEEP_ENVELOPE,
        );

        expect(
          state.retainedMoleInventoryFraction01,
        ).toBeGreaterThan(0.97);
      },
    );

    it(
      'should keep a point-20.2 vacuum empty and deterministic',
      () => {
        const planet =
          planetFixture(1);

        const bulk =
          bulkFixture(
            planet,
            [],
            0,
          );

        const before =
          AtmosphereRetentionGenerator
            .generate(
              generationKey,
              planet,
              bulk,
            );

        const after =
          AtmosphereRetentionGenerator
            .generate(
              generationKey,
              planet,
              bulk,
            );

        expect(
          before,
        ).toEqual(
          after,
        );

        expect(
          before.retentionRegime,
        ).toBe(
          AtmosphereRetentionRegime.VACUUM,
        );

        expect(
          before.retainedGasComponents,
        ).toEqual([]);
      },
    );

    it(
      'should generate a frozen ordered collection and reject cross-body bulk states',
      () => {
        const planets = [
          planetFixture(1),
          planetFixture(2),
          planetFixture(3),
        ];

        const gas = [
          new AtmosphereGasComponent(
            AtmosphereGas.NITROGEN,
            1,
          ),
        ];

        const bulks =
          planets.map(
            planet =>
              bulkFixture(
                planet,
                gas,
                100_000,
              ),
          );

        const states =
          AtmosphereRetentionGenerator
            .generateAll(
              generationKey,
              system,
              planets,
              bulks,
            );

        expect(
          Object.isFrozen(
            states,
          ),
        ).toBe(true);

        expect(
          states.map(
            state =>
              state.planetOrdinal,
          ),
        ).toEqual([
          1,
          2,
          3,
        ]);

        expect(
          () =>
            AtmosphereRetentionGenerator
              .generate(
                generationKey,
                planets[0],
                bulks[1],
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    interface PlanetFixtureOverrides {
      readonly massEarth?:
        number;
      readonly radiusEarth?:
        number;
      readonly planetType?:
        PlanetType;
      readonly envelopeMassFraction01?:
        number;
      readonly referenceMeanInsolationEarth?:
        number;
      readonly referenceBondAlbedo01?:
        number;
    }

    function planetFixture(
      planetOrdinal:
        number,

      overrides:
        PlanetFixtureOverrides = {},
    ): Planet {

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

      return {
        generationKey,
        hostPlanetarySystem:
          system,
        systemLocator,
        planetOrdinal,
        locator,
        seed,
        planetType:
          overrides.planetType ??
          PlanetType.ROCKY,
        massEarth:
          overrides.massEarth ??
          1,
        radiusEarth:
          overrides.radiusEarth ??
          1,
        surfaceGravityEarth:
          1,
        physicalProperties: {
          envelopeMassFraction01:
            overrides.envelopeMassFraction01 ??
            0,
        },
        typeClassification: {
          referenceMeanInsolationEarth:
            overrides.referenceMeanInsolationEarth ??
            1,
        },
        referenceBondAlbedo01:
          overrides.referenceBondAlbedo01 ??
          0.3,
        isTypePhysicallyCoherent:
          true,
      } as unknown as Planet;
    }

    function bulkFixture(
      planet:
        Planet,

      gasComponents:
        readonly AtmosphereGasComponent[],

      surfacePressurePascal:
        number | null,
    ): AtmosphereBulkProperties {

      const deep =
        planet.planetType ===
          PlanetType.MINI_NEPTUNE ||
        planet.planetType ===
          PlanetType.GAS_GIANT ||
        planet.planetType ===
          PlanetType.ICE_GIANT;

      const vacuum =
        !deep &&
        surfacePressurePascal ===
        0;

      const meanMolarMass =
        gasComponents.length ===
          0
          ? null
          : gasComponents.reduce(
              (
                total,
                component,
              ) =>
                total +
                component.moleFraction01 *
                  atmosphereGasMolarMassGramsPerMole(
                    component.gas,
                  ),
              0,
            );

      const densityReferencePressurePascal =
        deep
          ? ATMOSPHERE_V1_DEEP_ENVELOPE_REFERENCE_PRESSURE_PASCAL
          : surfacePressurePascal!;

      const referenceDensity =
        meanMolarMass ===
          null
          ? 0
          : idealGasDensityKilogramsPerCubicMeter(
              densityReferencePressurePascal,
              ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
              meanMolarMass,
            );

      const pressureRegime =
        deep
          ? AtmospherePressureRegime.DEEP_ENVELOPE
          : vacuum
            ? AtmospherePressureRegime.VACUUM
            : AtmospherePressureRegime.MODERATE;

      return new AtmosphereBulkProperties(
        planet.planetOrdinal,
        planet.locator,
        planet.seed,
        planet.planetType,
        planet.massEarth,
        planet.radiusEarth,
        planet.surfaceGravityEarth,
        planet.physicalProperties
          .envelopeMassFraction01,
        0.1,
        planet.typeClassification
          .referenceMeanInsolationEarth,
        planet.referenceBondAlbedo01,
        pressureRegime,
        deep
          ? null
          : surfacePressurePascal,
        densityReferencePressurePascal,
        ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
        referenceDensity,
        meanMolarMass,
        gasComponents,
      );
    }
  },
);
