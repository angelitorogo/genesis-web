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
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  type AtmosphereRetentionState,
} from '../../domain/planetary/atmosphere-retention-state';

import {
  PlanetGeologyRegime,
} from '../../domain/planetary/planet-geology-regime';

import {
  type PlanetGeologyState,
} from '../../domain/planetary/planet-geology-state';

import {
  PlanetMagneticFieldRegime,
} from '../../domain/planetary/planet-magnetic-field-regime';

import {
  PlanetMagnetosphereRegime,
} from '../../domain/planetary/planet-magnetosphere-regime';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  PlanetMagnetosphereEngine,
} from './planet-magnetosphere-engine';

describe(
  'PlanetMagnetosphereEngine point 20.9',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should generate an Earth-like sustained strong global magnetosphere',
      () => {
        const fixture =
          fixtureFor({
            planetType:
              PlanetType.ROCKY,
            massEarth:
              1,
            radiusEarth:
              1,
            rotationPeriodHours:
              24,
            metallicCoreMassFraction01:
              0.32,
            gaseousEnvelopeMassFraction01:
              0.001,
            iceBearingInteriorFraction01:
              0.02,
            referenceMeanInsolationEarth:
              1,
            retainedSurfacePressurePascal:
              101_325,
            geologyRegime:
              PlanetGeologyRegime.ACTIVE,
            internalHeatRetentionIndex01:
              0.68,
            geologicalActivityIndex01:
              0.55,
            tidalHeatingIndex01:
              0,
          });

        const state =
          PlanetMagnetosphereEngine
            .generate(
              generationKey,
              fixture.planet,
              fixture.retention,
              fixture.geology,
            );

        expect(
          state.hasSustainedDynamo,
        ).toBe(true);

        expect(
          state.magneticFieldRegime,
        ).toBe(
          PlanetMagneticFieldRegime.STRONG,
        );

        expect(
          state.magnetosphereRegime,
        ).toBe(
          PlanetMagnetosphereRegime.GLOBAL,
        );

        expect(
          state.magnetosphericProtectionIndex01,
        ).toBeGreaterThan(0.45);
      },
    );

    it(
      'should produce an induced Venus-like magnetosphere when slow rotation suppresses the intrinsic dynamo',
      () => {
        const fixture =
          fixtureFor({
            planetType:
              PlanetType.DESERT,
            massEarth:
              0.815,
            radiusEarth:
              0.95,
            rotationPeriodHours:
              5_832,
            metallicCoreMassFraction01:
              0.32,
            gaseousEnvelopeMassFraction01:
              0.001,
            iceBearingInteriorFraction01:
              0.01,
            referenceMeanInsolationEarth:
              1.9,
            retainedSurfacePressurePascal:
              9_000_000,
            geologyRegime:
              PlanetGeologyRegime.ACTIVE,
            internalHeatRetentionIndex01:
              0.65,
            geologicalActivityIndex01:
              0.50,
            tidalHeatingIndex01:
              0,
          });

        const state =
          PlanetMagnetosphereEngine
            .generate(
              generationKey,
              fixture.planet,
              fixture.retention,
              fixture.geology,
            );

        expect(
          state.hasSustainedDynamo,
        ).toBe(false);

        expect(
          state.magneticFieldRegime,
        ).toBe(
          PlanetMagneticFieldRegime.WEAK,
        );

        expect(
          state.magnetosphereRegime,
        ).toBe(
          PlanetMagnetosphereRegime.INDUCED,
        );

        expect(
          state.magnetosphericProtectionIndex01,
        ).toBeLessThanOrEqual(0.22);
      },
    );

    it(
      'should model a rapidly rotating gas giant with a very strong extended intrinsic magnetosphere despite deep-envelope geology',
      () => {
        const fixture =
          fixtureFor({
            planetType:
              PlanetType.GAS_GIANT,
            massEarth:
              318,
            radiusEarth:
              11.2,
            rotationPeriodHours:
              9.9,
            metallicCoreMassFraction01:
              0.02,
            gaseousEnvelopeMassFraction01:
              0.90,
            iceBearingInteriorFraction01:
              0.05,
            referenceMeanInsolationEarth:
              0.037,
            retainedSurfacePressurePascal:
              null,
            geologyRegime:
              PlanetGeologyRegime.DEEP_ENVELOPE,
            internalHeatRetentionIndex01:
              null,
            geologicalActivityIndex01:
              null,
            tidalHeatingIndex01:
              null,
          });

        const state =
          PlanetMagnetosphereEngine
            .generate(
              generationKey,
              fixture.planet,
              fixture.retention,
              fixture.geology,
            );

        expect(
          state.hasSustainedDynamo,
        ).toBe(true);

        expect(
          state.magneticFieldRegime,
        ).toBe(
          PlanetMagneticFieldRegime.VERY_STRONG,
        );

        expect(
          state.magnetosphereRegime,
        ).toBe(
          PlanetMagnetosphereRegime.EXTENDED,
        );

        expect(
          state.sourceInternalHeatRetentionIndex01,
        ).toBeNull();
      },
    );

    it(
      'should compress an otherwise Earth-like intrinsic magnetosphere under a very high stellar-wind proxy',
      () => {
        const fixture =
          fixtureFor({
            referenceMeanInsolationEarth:
              20,
          });

        const state =
          PlanetMagnetosphereEngine
            .generate(
              generationKey,
              fixture.planet,
              fixture.retention,
              fixture.geology,
            );

        expect(
          state.hasSustainedDynamo,
        ).toBe(true);

        expect(
          state.magnetosphereRegime,
        ).toBe(
          PlanetMagnetosphereRegime.COMPRESSED,
        );
      },
    );

    it(
      'should be deterministic, preserve order in generateAll and reject cross-body source states',
      () => {
        const first =
          fixtureFor({
            planetOrdinal:
              1,
          });

        const second =
          fixtureFor({
            planetOrdinal:
              2,
            bodySeedHex:
              'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
          });

        const system =
          first.system;

        const planetOne = {
          ...first.planet,
          hostPlanetarySystem:
            system,
        } as unknown as Planet;

        const planetTwo = {
          ...second.planet,
          hostPlanetarySystem:
            system,
        } as unknown as Planet;

        const generated =
          PlanetMagnetosphereEngine
            .generateAll(
              generationKey,
              system,
              [
                planetOne,
                planetTwo,
              ],
              [
                first.retention,
                second.retention,
              ],
              [
                first.geology,
                second.geology,
              ],
            );

        expect(
          generated.map(
            value =>
              value.planetOrdinal,
          ),
        ).toEqual([
          1,
          2,
        ]);

        const repeated =
          PlanetMagnetosphereEngine
            .generate(
              generationKey,
              planetOne,
              first.retention,
              first.geology,
            );

        expect(
          repeated,
        ).toEqual(
          generated[0],
        );

        expect(
          () =>
            PlanetMagnetosphereEngine
              .generate(
                generationKey,
                planetOne,
                second.retention,
                first.geology,
              ),
        ).toThrow(RangeError);
      },
    );

    function fixtureFor(
      overrides: {
        readonly planetOrdinal?: number;
        readonly bodySeedHex?: string;
        readonly planetType?: PlanetType;
        readonly massEarth?: number;
        readonly radiusEarth?: number;
        readonly rotationPeriodHours?: number;
        readonly metallicCoreMassFraction01?: number;
        readonly gaseousEnvelopeMassFraction01?: number;
        readonly iceBearingInteriorFraction01?: number;
        readonly referenceMeanInsolationEarth?: number;
        readonly retainedSurfacePressurePascal?: number | null;
        readonly geologyRegime?: PlanetGeologyRegime;
        readonly internalHeatRetentionIndex01?: number | null;
        readonly geologicalActivityIndex01?: number | null;
        readonly tidalHeatingIndex01?: number | null;
      } = {},
    ): {
      readonly system: PlanetarySystem;
      readonly planet: Planet;
      readonly retention: AtmosphereRetentionState;
      readonly geology: PlanetGeologyState;
    } {
      const planetOrdinal =
        overrides.planetOrdinal ??
        1;

      const systemLocator =
        new SystemLocator(
          3n,
          -11n,
          6n,
        );

      const locator =
        new BodyLocator(
          3n,
          -11n,
          6n,
          BigInt(
            planetOrdinal -
              1,
          ),
        );

      const seed =
        new BodySeed(
          overrides.bodySeedHex ??
          'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        );

      const system = {
        generationKey,
        locator:
          systemLocator,
        planetCount:
          2,
      } as unknown as PlanetarySystem;

      const planetType =
        overrides.planetType ??
        PlanetType.ROCKY;

      const massEarth =
        overrides.massEarth ??
        1;

      const radiusEarth =
        overrides.radiusEarth ??
        1;

      const rotationPeriodHours =
        overrides.rotationPeriodHours ??
        24;

      const metallicCoreMassFraction01 =
        overrides.metallicCoreMassFraction01 ??
        0.32;

      const gaseousEnvelopeMassFraction01 =
        overrides.gaseousEnvelopeMassFraction01 ??
        0.001;

      const iceBearingInteriorFraction01 =
        overrides.iceBearingInteriorFraction01 ??
        0.02;

      const referenceMeanInsolationEarth =
        overrides.referenceMeanInsolationEarth ??
        1;

      const retainedSurfacePressurePascal =
        overrides.retainedSurfacePressurePascal ===
        undefined
          ? 101_325
          : overrides.retainedSurfacePressurePascal;

      const geologyRegime =
        overrides.geologyRegime ??
        PlanetGeologyRegime.ACTIVE;

      const internalHeatRetentionIndex01 =
        overrides.internalHeatRetentionIndex01 ===
        undefined
          ? 0.68
          : overrides.internalHeatRetentionIndex01;

      const geologicalActivityIndex01 =
        overrides.geologicalActivityIndex01 ===
        undefined
          ? 0.55
          : overrides.geologicalActivityIndex01;

      const tidalHeatingIndex01 =
        overrides.tidalHeatingIndex01 ===
        undefined
          ? 0
          : overrides.tidalHeatingIndex01;

      const planet = {
        generationKey,
        hostPlanetarySystem:
          system,
        planetOrdinal,
        locator,
        seed,
        planetType,
        massEarth,
        radiusEarth,
        rotationPeriodHours,
        isTidallySynchronized:
          false,
        isTypePhysicallyCoherent:
          true,
        internalComposition: {
          metallicCoreMassFraction01,
          gaseousEnvelopeMassFraction01,
          iceBearingFractionOfSolids01:
            iceBearingInteriorFraction01,
        },
        typeClassification: {
          referenceMeanInsolationEarth,
        },
      } as unknown as Planet;

      const retention = {
        planetOrdinal,
        bodyLocator:
          locator,
        bodySeed:
          seed,
        sourceReferenceMeanInsolationEarth:
          referenceMeanInsolationEarth,
        retainedSurfacePressurePascal,
      } as unknown as AtmosphereRetentionState;

      const geology = {
        planetOrdinal,
        bodyLocator:
          locator,
        bodySeed:
          seed,
        sourcePlanetType:
          planetType,
        sourceMassEarth:
          massEarth,
        sourceRadiusEarth:
          radiusEarth,
        sourceMetallicCoreMassFraction01:
          metallicCoreMassFraction01,
        geologyRegime,
        internalHeatRetentionIndex01,
        geologicalActivityIndex01,
        tidalHeatingIndex01,
      } as unknown as PlanetGeologyState;

      return {
        system,
        planet,
        retention,
        geology,
      };
    }
  },
);
