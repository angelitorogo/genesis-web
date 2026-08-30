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
  PlanetGeologyRegime,
} from '../../domain/planetary/planet-geology-regime';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  PlanetTectonicRegime,
} from '../../domain/planetary/planet-tectonic-regime';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  PlanetVolcanismRegime,
} from '../../domain/planetary/planet-volcanism-regime';

import {
  type PlanetWaterInventory,
} from '../../domain/planetary/planet-water-inventory';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  PlanetGeologyEngine,
} from './planet-geology-engine';

describe(
  'PlanetGeologyEngine point 20.8',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should produce bounded active Earth-like geology with wet mobile plate tectonics',
      () => {
        const fixture =
          fixtureFor({
            massEarth: 1,
            radiusEarth: 1,
            surfaceGravityEarth: 1,
            metallicCoreMassFraction01: 0.32,
            silicateInteriorMassFraction01: 0.67,
            volatileRichInteriorMassFraction01: 0.01,
            condensedIceMassFraction01: 0,
            waterCoverage01: 0.71,
          });

        const state =
          PlanetGeologyEngine.generate(
            generationKey,
            fixture.planet,
            fixture.water,
          );

        expect(state.geologyRegime)
          .toBe(PlanetGeologyRegime.ACTIVE);
        expect(state.volcanismRegime)
          .toBe(PlanetVolcanismRegime.MODERATE);
        expect(state.tectonicRegime)
          .toBe(PlanetTectonicRegime.PLATE_TECTONICS);
        expect(state.isGeologicallyActive)
          .toBe(true);
        expect(state.supportsMobileLithosphere)
          .toBe(true);

        for (
          const value
          of [
            state.internalHeatRetentionIndex01,
            state.tidalHeatingIndex01,
            state.mantleConvectionIndex01,
            state.geologicalActivityIndex01,
            state.volcanismIndex01,
            state.tectonicMobilityIndex01,
            state.volatileOutgassingPotential01,
            state.surfaceRenewalPotential01,
          ]
        ) {
          expect(value).not.toBeNull();
          expect(value!).toBeGreaterThanOrEqual(0);
          expect(value!).toBeLessThanOrEqual(1);
        }
      },
    );

    it(
      'should let surface water increase lithosphere mobility without changing the frozen interior',
      () => {
        const dry =
          fixtureFor({
            massEarth: 0.815,
            radiusEarth: 0.949,
            surfaceGravityEarth: 0.905,
            metallicCoreMassFraction01: 0.31,
            silicateInteriorMassFraction01: 0.68,
            waterCoverage01: 0,
          });

        const wet =
          fixtureFor({
            massEarth: 0.815,
            radiusEarth: 0.949,
            surfaceGravityEarth: 0.905,
            metallicCoreMassFraction01: 0.31,
            silicateInteriorMassFraction01: 0.68,
            waterCoverage01: 0.70,
          });

        const dryState =
          PlanetGeologyEngine.generate(
            generationKey,
            dry.planet,
            dry.water,
          );

        const wetState =
          PlanetGeologyEngine.generate(
            generationKey,
            wet.planet,
            wet.water,
          );

        expect(dryState.tectonicRegime)
          .toBe(PlanetTectonicRegime.STAGNANT_LID);
        expect(
          wetState.tectonicMobilityIndex01!,
        ).toBeGreaterThan(
          dryState.tectonicMobilityIndex01!,
        );
        expect(
          wetState.internalHeatRetentionIndex01,
        ).toBeCloseTo(
          dryState.internalHeatRetentionIndex01!,
          12,
        );
      },
    );

    it(
      'should elevate strongly tidally heated volcanic worlds without inventing plate tectonics',
      () => {
        const baseline =
          fixtureFor({
            planetType: PlanetType.ROCKY,
            tidalHeatingProxy: 0,
            waterCoverage01: 0,
          });

        const tidal =
          fixtureFor({
            planetType: PlanetType.VOLCANIC,
            tidalHeatingProxy: 100,
            waterCoverage01: 0,
          });

        const baselineState =
          PlanetGeologyEngine.generate(
            generationKey,
            baseline.planet,
            baseline.water,
          );

        const tidalState =
          PlanetGeologyEngine.generate(
            generationKey,
            tidal.planet,
            tidal.water,
          );

        expect(tidalState.geologyRegime)
          .toBe(PlanetGeologyRegime.HIGH_ACTIVITY);
        expect(tidalState.volcanismRegime)
          .toBe(PlanetVolcanismRegime.EXTREME);
        expect(tidalState.tectonicRegime)
          .toBe(PlanetTectonicRegime.EPISODIC_MOBILITY);
        expect(tidalState.geologicalActivityIndex01!)
          .toBeGreaterThan(baselineState.geologicalActivityIndex01!);
        expect(tidalState.volcanismIndex01!)
          .toBeGreaterThan(baselineState.volcanismIndex01!);
      },
    );

    it(
      'should make a small dry Mars-like world comparatively quiet and stagnant',
      () => {
        const fixture =
          fixtureFor({
            massEarth: 0.107,
            radiusEarth: 0.532,
            surfaceGravityEarth: 0.38,
            metallicCoreMassFraction01: 0.25,
            silicateInteriorMassFraction01: 0.70,
            waterCoverage01: 0.01,
          });

        const state =
          PlanetGeologyEngine.generate(
            generationKey,
            fixture.planet,
            fixture.water,
          );

        expect(state.geologyRegime)
          .toBe(PlanetGeologyRegime.LOW_ACTIVITY);
        expect(state.volcanismRegime)
          .toBe(PlanetVolcanismRegime.LOW);
        expect(state.tectonicRegime)
          .toBe(PlanetTectonicRegime.STAGNANT_LID);
      },
    );

    it(
      'should keep giant-planet solid-surface geology undefined',
      () => {
        const fixture =
          fixtureFor({
            planetType: PlanetType.GAS_GIANT,
            massEarth: 100,
            radiusEarth: 9,
            surfaceGravityEarth: 1.2,
            metallicCoreMassFraction01: 0.05,
            silicateInteriorMassFraction01: 0.05,
            volatileRichInteriorMassFraction01: 0.35,
            condensedIceMassFraction01: 0.15,
            waterCoverage01: null,
          });

        const state =
          PlanetGeologyEngine.generate(
            generationKey,
            fixture.planet,
            fixture.water,
          );

        expect(state.geologyRegime)
          .toBe(PlanetGeologyRegime.DEEP_ENVELOPE);
        expect(state.volcanismRegime)
          .toBe(PlanetVolcanismRegime.DEEP_ENVELOPE);
        expect(state.tectonicRegime)
          .toBe(PlanetTectonicRegime.DEEP_ENVELOPE);
        expect(state.geologicalActivityIndex01)
          .toBeNull();
        expect(state.tectonicMobilityIndex01)
          .toBeNull();
      },
    );

    it(
      'should be deterministic, generate frozen ordered collections and reject cross-body water states',
      () => {
        const systemLocator =
          new SystemLocator(
            9n,
            2n,
            7n,
          );

        const system = {
          generationKey,
          locator: systemLocator,
          planetCount: 2,
        } as PlanetarySystem;

        const first =
          fixtureFor({
            system,
            planetOrdinal: 1,
          });

        const second =
          fixtureFor({
            system,
            planetOrdinal: 2,
          });

        const firstState =
          PlanetGeologyEngine.generate(
            generationKey,
            first.planet,
            first.water,
          );

        const regenerated =
          PlanetGeologyEngine.generate(
            generationKey,
            first.planet,
            first.water,
          );

        expect(regenerated).toEqual(firstState);

        const all =
          PlanetGeologyEngine.generateAll(
            generationKey,
            system,
            [first.planet, second.planet],
            [first.water, second.water],
          );

        expect(Object.isFrozen(all)).toBe(true);
        expect(all.map(value => value.planetOrdinal))
          .toEqual([1, 2]);

        expect(
          () => PlanetGeologyEngine.generate(
            generationKey,
            first.planet,
            second.water,
          ),
        ).toThrow(RangeError);
      },
    );

    function fixtureFor(
      options: {
        readonly system?: PlanetarySystem;
        readonly planetOrdinal?: number;
        readonly planetType?: PlanetType;
        readonly massEarth?: number;
        readonly radiusEarth?: number;
        readonly surfaceGravityEarth?: number;
        readonly metallicCoreMassFraction01?: number;
        readonly silicateInteriorMassFraction01?: number;
        readonly volatileRichInteriorMassFraction01?: number;
        readonly condensedIceMassFraction01?: number;
        readonly tidalHeatingProxy?: number;
        readonly waterCoverage01?: number | null;
      } = {},
    ): {
      readonly planet: Planet;
      readonly water: PlanetWaterInventory;
    } {
      const planetOrdinal =
        options.planetOrdinal ??
        1;

      const systemLocator =
        options.system?.locator ??
        new SystemLocator(
          3n,
          -4n,
          5n,
        );

      const system =
        options.system ??
        ({
          generationKey,
          locator: systemLocator,
          planetCount: 1,
        } as PlanetarySystem);

      const locator =
        new BodyLocator(
          systemLocator.galaxyIndex,
          systemLocator.sectorKey,
          systemLocator.galacticObjectIndex,
          BigInt(planetOrdinal - 1),
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
        options.planetType ??
        PlanetType.ROCKY;

      const condensedIceMassFraction01 =
        options.condensedIceMassFraction01 ??
        0.01;

      const volatileRichInteriorMassFraction01 =
        options.volatileRichInteriorMassFraction01 ??
        0.01;

      const iceBearingFractionOfSolids01 =
        Math.min(
          1,
          condensedIceMassFraction01 +
          volatileRichInteriorMassFraction01,
        );

      const planet = {
        generationKey,
        hostPlanetarySystem: system,
        systemLocator,
        planetOrdinal,
        locator,
        seed,
        planetType,
        massEarth: options.massEarth ?? 1,
        radiusEarth: options.radiusEarth ?? 1,
        surfaceGravityEarth:
          options.surfaceGravityEarth ?? 1,
        internalComposition: {
          metallicCoreMassFraction01:
            options.metallicCoreMassFraction01 ?? 0.32,
          silicateInteriorMassFraction01:
            options.silicateInteriorMassFraction01 ?? 0.67,
          volatileRichInteriorMassFraction01,
          condensedIceMassFraction01,
          iceBearingFractionOfSolids01,
        },
        typeClassification: {
          tidalHeatingProxy:
            options.tidalHeatingProxy ?? 0,
        },
        isTypePhysicallyCoherent: true,
      } as unknown as Planet;

      const waterCoverage01 =
        options.waterCoverage01 === undefined
          ? 0.2
          : options.waterCoverage01;

      const water = {
        planetOrdinal,
        bodyLocator: locator,
        bodySeed: seed,
        sourcePlanetType: planetType,
        sourceIceBearingInteriorFraction01:
          iceBearingFractionOfSolids01,
        waterInventoryIndex01:
          waterCoverage01 === null
            ? 0.7
            : Math.max(0.1, waterCoverage01),
        surfaceLiquidWaterCoverageFraction01:
          waterCoverage01,
      } as unknown as PlanetWaterInventory;

      return {
        planet,
        water,
      };
    }
  },
);
