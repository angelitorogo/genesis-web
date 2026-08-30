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
  PlanetMagneticFieldRegime,
} from '../../domain/planetary/planet-magnetic-field-regime';

import {
  PlanetMagnetosphereRegime,
} from '../../domain/planetary/planet-magnetosphere-regime';

import {
  type PlanetMagnetosphereState,
} from '../../domain/planetary/planet-magnetosphere-state';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  PlanetRadiationProtectionRegime,
} from '../../domain/planetary/planet-radiation-protection-regime';

import {
  PlanetSurfaceRadiationRegime,
} from '../../domain/planetary/planet-surface-radiation-regime';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  PlanetSurfaceRadiationEngine,
} from './planet-surface-radiation-engine';

describe(
  'PlanetSurfaceRadiationEngine point 20.10',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should model an Earth-like atmosphere plus global magnetosphere as strong protection with low surface exposure',
      () => {
        const fixture =
          fixtureFor({
            surfaceGravityEarth:
              1,
            referenceMeanInsolationEarth:
              1,
            retainedSurfacePressurePascal:
              101_325,
            stellarWindPressureProxyEarth:
              1,
            magnetosphericProtectionIndex01:
              0.56,
            magneticFieldRegime:
              PlanetMagneticFieldRegime.STRONG,
            magnetosphereRegime:
              PlanetMagnetosphereRegime.GLOBAL,
          });

        const state =
          PlanetSurfaceRadiationEngine
            .generate(
              generationKey,
              fixture.planet,
              fixture.retention,
              fixture.magnetosphere,
            );

        expect(
          state.atmosphericColumnMassEarth,
        ).toBeCloseTo(1, 12);

        expect(
          state.atmosphericRadiationShieldingIndex01,
        ).toBeCloseTo(0.8, 12);

        expect(
          state.protectionRegime,
        ).toBe(
          PlanetRadiationProtectionRegime.STRONG,
        );

        expect(
          state.radiationRegime,
        ).toBe(
          PlanetSurfaceRadiationRegime.LOW,
        );

        expect(
          state.hasEffectiveSurfaceRadiationProtection,
        ).toBe(true);
      },
    );

    it(
      'should let a Venus-like dense atmosphere provide strong surface shielding despite weak induced magnetic protection',
      () => {
        const fixture =
          fixtureFor({
            planetType:
              PlanetType.DESERT,
            surfaceGravityEarth:
              0.905,
            referenceMeanInsolationEarth:
              1.9,
            retainedSurfacePressurePascal:
              9_000_000,
            stellarWindPressureProxyEarth:
              1.9,
            magnetosphericProtectionIndex01:
              0.18,
            magneticFieldRegime:
              PlanetMagneticFieldRegime.WEAK,
            magnetosphereRegime:
              PlanetMagnetosphereRegime.INDUCED,
          });

        const state =
          PlanetSurfaceRadiationEngine
            .generate(
              generationKey,
              fixture.planet,
              fixture.retention,
              fixture.magnetosphere,
            );

        expect(
          state.atmosphericRadiationShieldingIndex01!,
        ).toBeGreaterThan(0.99);

        expect(
          state.surfaceRadiationExposureIndex01!,
        ).toBeLessThan(0.20);

        expect(
          state.hasEffectiveSurfaceRadiationProtection,
        ).toBe(true);
      },
    );

    it(
      'should leave a Mars-like thin atmosphere weakly protected with moderate surface exposure',
      () => {
        const fixture =
          fixtureFor({
            planetType:
              PlanetType.ROCKY,
            surfaceGravityEarth:
              0.38,
            referenceMeanInsolationEarth:
              0.43,
            retainedSurfacePressurePascal:
              610,
            stellarWindPressureProxyEarth:
              0.43,
            magnetosphericProtectionIndex01:
              0,
            magneticFieldRegime:
              PlanetMagneticFieldRegime.NONE,
            magnetosphereRegime:
              PlanetMagnetosphereRegime.NONE,
          });

        const state =
          PlanetSurfaceRadiationEngine
            .generate(
              generationKey,
              fixture.planet,
              fixture.retention,
              fixture.magnetosphere,
            );

        expect(
          state.protectionRegime,
        ).toBe(
          PlanetRadiationProtectionRegime.NONE,
        );

        expect(
          state.radiationRegime,
        ).toBe(
          PlanetSurfaceRadiationRegime.MODERATE,
        );

        expect(
          state.hasEffectiveSurfaceRadiationProtection,
        ).toBe(false);
      },
    );

    it(
      'should classify a highly irradiated airless world as extreme even with some magnetic shielding',
      () => {
        const fixture =
          fixtureFor({
            referenceMeanInsolationEarth:
              20,
            retainedSurfacePressurePascal:
              0,
            stellarWindPressureProxyEarth:
              20,
            magnetosphericProtectionIndex01:
              0.20,
            magneticFieldRegime:
              PlanetMagneticFieldRegime.STRONG,
            magnetosphereRegime:
              PlanetMagnetosphereRegime.COMPRESSED,
          });

        const state =
          PlanetSurfaceRadiationEngine
            .generate(
              generationKey,
              fixture.planet,
              fixture.retention,
              fixture.magnetosphere,
            );

        expect(
          state.atmosphericRadiationShieldingIndex01,
        ).toBe(0);

        expect(
          state.radiationRegime,
        ).toBe(
          PlanetSurfaceRadiationRegime.EXTREME,
        );
      },
    );

    it(
      'should preserve deep-envelope environmental radiation without inventing a gas-giant solid surface',
      () => {
        const fixture =
          fixtureFor({
            planetType:
              PlanetType.GAS_GIANT,
            surfaceGravityEarth:
              2.53,
            referenceMeanInsolationEarth:
              0.037,
            retainedSurfacePressurePascal:
              null,
            stellarWindPressureProxyEarth:
              0.037,
            magnetosphericProtectionIndex01:
              0.91,
            magneticFieldRegime:
              PlanetMagneticFieldRegime.VERY_STRONG,
            magnetosphereRegime:
              PlanetMagnetosphereRegime.EXTENDED,
          });

        const state =
          PlanetSurfaceRadiationEngine
            .generate(
              generationKey,
              fixture.planet,
              fixture.retention,
              fixture.magnetosphere,
            );

        expect(
          state.radiationRegime,
        ).toBe(
          PlanetSurfaceRadiationRegime.DEEP_ENVELOPE,
        );

        expect(
          state.protectionRegime,
        ).toBe(
          PlanetRadiationProtectionRegime.DEEP_ENVELOPE,
        );

        expect(
          state.surfaceRadiationExposureIndex01,
        ).toBeNull();

        expect(
          state.unshieldedRadiationEnvironmentIndex01,
        ).toBeGreaterThan(0);
      },
    );

    it(
      'should be deterministic, preserve generateAll order and reject cross-body magnetosphere handoff',
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
          PlanetSurfaceRadiationEngine
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
                first.magnetosphere,
                second.magnetosphere,
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

        expect(
          PlanetSurfaceRadiationEngine
            .generate(
              generationKey,
              planetOne,
              first.retention,
              first.magnetosphere,
            ),
        ).toEqual(
          generated[0],
        );

        expect(
          () =>
            PlanetSurfaceRadiationEngine
              .generate(
                generationKey,
                planetOne,
                first.retention,
                second.magnetosphere,
              ),
        ).toThrow(RangeError);
      },
    );

    function fixtureFor(
      overrides: {
        readonly planetOrdinal?: number;
        readonly bodySeedHex?: string;
        readonly planetType?: PlanetType;
        readonly surfaceGravityEarth?: number;
        readonly referenceMeanInsolationEarth?: number;
        readonly retainedSurfacePressurePascal?: number | null;
        readonly stellarWindPressureProxyEarth?: number;
        readonly magnetosphericProtectionIndex01?: number;
        readonly magneticFieldRegime?: PlanetMagneticFieldRegime;
        readonly magnetosphereRegime?: PlanetMagnetosphereRegime;
      } = {},
    ): {
      readonly system: PlanetarySystem;
      readonly planet: Planet;
      readonly retention: AtmosphereRetentionState;
      readonly magnetosphere: PlanetMagnetosphereState;
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

      const surfaceGravityEarth =
        overrides.surfaceGravityEarth ??
        1;

      const referenceMeanInsolationEarth =
        overrides.referenceMeanInsolationEarth ??
        1;

      const retainedSurfacePressurePascal =
        overrides.retainedSurfacePressurePascal ===
        undefined
          ? 101_325
          : overrides.retainedSurfacePressurePascal;

      const stellarWindPressureProxyEarth =
        overrides.stellarWindPressureProxyEarth ??
        referenceMeanInsolationEarth;

      const magnetosphericProtectionIndex01 =
        overrides.magnetosphericProtectionIndex01 ??
        0.56;

      const magneticFieldRegime =
        overrides.magneticFieldRegime ??
        PlanetMagneticFieldRegime.STRONG;

      const magnetosphereRegime =
        overrides.magnetosphereRegime ??
        PlanetMagnetosphereRegime.GLOBAL;

      const planet = {
        generationKey,
        hostPlanetarySystem:
          system,
        planetOrdinal,
        locator,
        seed,
        planetType,
        surfaceGravityEarth,
        isTypePhysicallyCoherent:
          true,
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

      const magnetosphere = {
        planetOrdinal,
        bodyLocator:
          locator,
        bodySeed:
          seed,
        sourcePlanetType:
          planetType,
        sourceReferenceMeanInsolationEarth:
          referenceMeanInsolationEarth,
        sourceRetainedSurfacePressurePascal:
          retainedSurfacePressurePascal,
        stellarWindPressureProxyEarth,
        magnetosphericProtectionIndex01,
        magneticFieldRegime,
        magnetosphereRegime,
      } as unknown as PlanetMagnetosphereState;

      return {
        system,
        planet,
        retention,
        magnetosphere,
      };
    }
  },
);
