import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  AtmosphereGas,
} from '../../domain/planetary/atmosphere-gas';

import {
  AtmosphereGreenhouseRegime,
} from '../../domain/planetary/atmosphere-greenhouse-regime';

import {
  GalaxySectorCoordinates,
} from '../../domain/sector/galaxy-sector-coordinates';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GalaxySectorContentGenerator,
} from '../sector/galaxy-sector-content-generator';

import {
  StellarDesignationGenerator,
} from '../stellar/stellar-designation-generator';

import {
  StellarMultihostFormation,
} from '../stellar/stellar-multihost-formation';

import {
  multihostPhysicalSourceKey,
} from '../stellar/stellar-multihost-physical-source-key';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  PlanetWaterEngine,
} from './planet-water-engine';

const GENERATION_KEY =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
    ),
    GeneratorVersion.V2,
  );

/**
 * Positive greenhouse regression. Kiraum B-2 is intentionally used only as a
 * deterministic integration fixture: production code contains no name/locator
 * exception for this world.
 */
describe(
  'Kiraum B-2 greenhouse/hydrology regression',
  () => {
    it(
      'keeps its real CO2 column strongly greenhouse while recomputing climate and water from the revised radiative state',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            GENERATION_KEY,
            0n,
          );

        const content =
          GalaxySectorContentGenerator.generate(
            galaxy,
            new GalaxySectorCoordinates(
              22,
              12,
            ),
          );

        const physicalKey =
          multihostPhysicalSourceKey(
            GENERATION_KEY,
          );

        const locator =
          content.systemLocators.find(
            candidate =>
              StellarDesignationGenerator.generate(
                physicalKey,
                candidate,
              ).name ===
              'Kiraum',
          );

        expect(
          locator,
        ).toBeDefined();

        const generated =
          StellarMultihostFormation.generateOrNull(
            GENERATION_KEY,
            locator!,
          );

        expect(
          generated?.multiplicity.name,
        ).toBe(
          'BINARY',
        );

        const entry =
          generated!.publicPlanets.find(
            planet =>
              planet.host ===
                'B' &&
              planet.sourcePlanetOrdinal ===
                2,
          );

        expect(
          entry,
        ).toBeDefined();

        const atmosphere =
          entry!.atmosphere;

        const pressurePascal =
          atmosphere.retainedSurfacePressurePascal!;

        const co2 =
          atmosphere.retainedGasComposition.find(
            component =>
              component.gas ===
              AtmosphereGas.CARBON_DIOXIDE,
          )!;

        const co2PartialPressureBar =
          pressurePascal *
          co2.moleFraction01 /
          100_000;

        expect(
          pressurePascal /
            100_000,
        ).toBeGreaterThan(0.8);

        expect(
          pressurePascal /
            100_000,
        ).toBeLessThan(1);

        expect(
          co2PartialPressureBar,
        ).toBeGreaterThan(0.30);

        expect(
          atmosphere.greenhouseRegime,
        ).toBe(
          AtmosphereGreenhouseRegime.STRONG,
        );

        expect(
          atmosphere.greenhouseSurfaceWarmingKelvin!,
        ).toBeGreaterThan(50);

        expect(
          atmosphere.greenhouseSurfaceWarmingKelvin!,
        ).toBeLessThan(100);

        expect(
          atmosphere.longwaveTrappingFraction01,
        ).toBeGreaterThan(0.60);

        expect(
          atmosphere.longwaveTrappingFraction01,
        ).toBeLessThan(0.85);

        expect(
          atmosphere.meanSurfaceTemperatureKelvin!,
        ).toBeLessThan(340);

        expect(
          atmosphere.minimumSurfaceTemperatureKelvin!,
        ).toBeLessThan(
          atmosphere.meanSurfaceTemperatureKelvin!,
        );

        expect(
          atmosphere.maximumSurfaceTemperatureKelvin!,
        ).toBeGreaterThan(
          atmosphere.meanSurfaceTemperatureKelvin!,
        );

        expect(
          atmosphere.climateVariabilityState
            .sourceMeanSurfaceTemperatureKelvin,
        ).toBe(
          atmosphere.meanSurfaceTemperatureKelvin!,
        );

        /*
         * The V2 multihost aggregate owns the public identity, but each S-type
         * physical host/planet is deliberately materialized from the frozen
         * V1-compatible physical source key. PlanetWaterEngine is one of those
         * frozen phase-20 engines, so a direct regression call must use the
         * exact generation key carried by the generated Planet, not the V2
         * parent key. This mirrors the real AtmosphereGenerator handoff.
         */
        expect(
          entry!.planet.generationKey.generatorVersion,
        ).toBe(
          GeneratorVersion.V1,
        );

        const recalculatedWater =
          PlanetWaterEngine.generate(
            entry!.planet.generationKey,
            entry!.planet,
            atmosphere.retentionState,
            atmosphere.climateState,
            atmosphere.climateVariabilityState,
            atmosphere.greenhouseEffect,
          );

        expect(
          atmosphere.waterInventory,
        ).toEqual(
          recalculatedWater,
        );

        expect(
          atmosphere.surfaceLiquidWaterCoverageFraction01!,
        ).toBeGreaterThan(0);
      },
    );
  },
);
