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
  PlanetInternalComposition,
} from '../../domain/planetary/planet-internal-composition';

import {
  PlanetSurfaceBaseRegime,
} from '../../domain/planetary/planet-surface-base-regime';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  PlanetTypeClassification,
} from '../../domain/planetary/planet-type-classification';

import {
  type PlanetaryArchitectureSlot,
} from '../../domain/planetary/planetary-architecture-slot';

import {
  PlanetaryOrbitHabitableZoneRelation,
} from '../../domain/planetary/planetary-orbit-habitable-zone-relation';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  PlanetarySystemHabitableZoneEvolutionRegime,
} from '../../domain/planetary/planetary-system-habitable-zone-evolution-regime';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  PlanetSurfaceBaseGenerator,
} from './planet-surface-base-generator';

describe(
  'PlanetSurfaceBaseGenerator point 19.6',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should map all nine planet types to physically distinct baseline solid/envelope surface regimes',
      () => {
        const types = [
          PlanetType.ROCKY,
          PlanetType.SUPER_EARTH,
          PlanetType.DESERT,
          PlanetType.OCEAN,
          PlanetType.ICE,
          PlanetType.VOLCANIC,
          PlanetType.MINI_NEPTUNE,
          PlanetType.GAS_GIANT,
          PlanetType.ICE_GIANT,
        ];

        const fixture =
          systemFixture(
            types,
          );

        const surfaces =
          PlanetSurfaceBaseGenerator
            .generateAll(
              generationKey,
              fixture.system,
              fixture.classifications,
              fixture.compositions,
            );

        expect(
          surfaces.map(
            surface =>
              surface.surfaceRegime,
          ),
        ).toEqual([
          PlanetSurfaceBaseRegime.MINERAL_REGOLITH,
          PlanetSurfaceBaseRegime.MASSIVE_MINERAL_REGOLITH,
          PlanetSurfaceBaseRegime.ARID_MINERAL,
          PlanetSurfaceBaseRegime.VOLATILE_RICH_SOLID,
          PlanetSurfaceBaseRegime.FROZEN_VOLATILE,
          PlanetSurfaceBaseRegime.THERMALLY_REWORKED_MINERAL,
          PlanetSurfaceBaseRegime.DEEP_ENVELOPE,
          PlanetSurfaceBaseRegime.DEEP_ENVELOPE,
          PlanetSurfaceBaseRegime.ICE_RICH_DEEP_ENVELOPE,
        ]);

        for (
          let index = 0;
          index <
            surfaces.length;
          index +=
            1
        ) {
          const surface =
            surfaces[index];

          expect(
            surface.sourcePlanetType,
          ).toBe(
            types[index],
          );

          expect(
            surface.referenceBondAlbedo01,
          ).toBeGreaterThanOrEqual(0);

          expect(
            surface.referenceBondAlbedo01,
          ).toBeLessThanOrEqual(1);

          expect(
            surface.baseMineralSurfaceFraction01 +
            surface.baseVolatileBearingSurfaceFraction01 +
            surface.baseMoltenSurfaceFraction01 +
            surface.baseDeepEnvelopeSurfaceFraction01,
          ).toBeCloseTo(
            1,
            12,
          );
        }

        for (
          const index
          of [
            6,
            7,
            8,
          ]
        ) {
          expect(
            surfaces[index].isDeepEnvelopeSurface,
          ).toBe(true);

          expect(
            surfaces[index].baseDeepEnvelopeSurfaceFraction01,
          ).toBe(1);

          expect(
            surfaces[index].baseSolidSurfaceRoughness01,
          ).toBeNull();
        }
      },
    );

    it(
      'should keep frozen volatile and volcanic baselines physically distinguishable without claiming phase-20 climate or geology',
      () => {
        const fixture =
          systemFixture([
            PlanetType.OCEAN,
            PlanetType.ICE,
            PlanetType.VOLCANIC,
          ]);

        const surfaces =
          PlanetSurfaceBaseGenerator
            .generateAll(
              generationKey,
              fixture.system,
              fixture.classifications,
              fixture.compositions,
            );

        expect(
          surfaces[0].baseVolatileBearingSurfaceFraction01,
        ).toBeGreaterThanOrEqual(0.40);

        expect(
          surfaces[1].baseVolatileBearingSurfaceFraction01,
        ).toBeGreaterThanOrEqual(0.68);

        expect(
          surfaces[2].baseMoltenSurfaceFraction01,
        ).toBeGreaterThanOrEqual(0.25);

        expect(
          surfaces[1].referenceBondAlbedo01,
        ).toBeGreaterThan(
          surfaces[2].referenceBondAlbedo01,
        );
      },
    );

    it(
      'should be exactly deterministic and independent from unrelated body surface materialization order',
      () => {
        const fixture =
          systemFixture([
            PlanetType.ROCKY,
            PlanetType.ICE,
          ]);

        const before =
          PlanetSurfaceBaseGenerator
            .generate(
              generationKey,
              fixture.system,
              fixture.classifications[0],
              fixture.compositions[0],
            );

        PlanetSurfaceBaseGenerator
          .generate(
            generationKey,
            fixture.system,
            fixture.classifications[1],
            fixture.compositions[1],
          );

        const after =
          PlanetSurfaceBaseGenerator
            .generate(
              generationKey,
              fixture.system,
              fixture.classifications[0],
              fixture.compositions[0],
            );

        expect(
          after,
        ).toEqual(
          before,
        );
      },
    );

    it(
      'should reject reordered, foreign or cross-generation point-19.4/19.5 source states',
      () => {
        const fixture =
          systemFixture([
            PlanetType.ROCKY,
            PlanetType.ICE,
          ]);

        expect(
          () =>
            PlanetSurfaceBaseGenerator
              .generateAll(
                generationKey,
                fixture.system,
                [
                  fixture.classifications[1],
                  fixture.classifications[0],
                ],
                fixture.compositions,
              ),
        ).toThrow(
          RangeError,
        );

        const foreignComposition =
          new PlanetInternalComposition(
            1,
            fixture.compositions[0].bodyLocator,
            new BodySeed(
              'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
            ),
            10,
            0,
            0,
            0.9,
            0.1,
            0,
            2,
            7,
            1,
            0,
            0,
          );

        expect(
          () =>
            PlanetSurfaceBaseGenerator
              .generate(
                generationKey,
                fixture.system,
                fixture.classifications[0],
                foreignComposition,
              ),
        ).toThrow(
          RangeError,
        );

        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '1111-2222-3333-4444-5555-6666-7777-8888',
            ),
            GeneratorVersion.V1,
          );

        expect(
          () =>
            PlanetSurfaceBaseGenerator
              .generate(
                otherGenerationKey,
                fixture.system,
                fixture.classifications[0],
                fixture.compositions[0],
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    function systemFixture(
      planetTypes:
        readonly PlanetType[],
    ): {
      readonly system:
        PlanetarySystem;
      readonly classifications:
        readonly PlanetTypeClassification[];
      readonly compositions:
        readonly PlanetInternalComposition[];
    } {
      const systemLocator =
        new SystemLocator(
          4n,
          -12n,
          7n,
        );

      const slots:
        PlanetaryArchitectureSlot[] = [];

      const classifications:
        PlanetTypeClassification[] = [];

      const compositions:
        PlanetInternalComposition[] = [];

      for (
        let index = 0;
        index <
          planetTypes.length;
        index +=
          1
      ) {
        const planetOrdinal =
          index +
          1;

        const bodyLocator =
          new BodyLocator(
            systemLocator.galaxyIndex,
            systemLocator.sectorKey,
            systemLocator.galacticObjectIndex,
            BigInt(
              index,
            ),
          );

        const bodySeed =
          new BodySeed(
            `${planetOrdinal}`
              .repeat(32),
          );

        const planetType =
          planetTypes[index];

        const sourceIceFraction01 =
          sourceIceFractionForType(
            planetType,
          );

        const envelopeFraction01 =
          envelopeFractionForType(
            planetType,
          );

        const solidMassEarth =
          10;

        const envelopeMassEarth =
          envelopeFraction01 ===
            0
            ? 0
            : solidMassEarth *
              envelopeFraction01 /
              (
                1 -
                envelopeFraction01
              );

        slots.push({
          planetOrdinal,
          bodyLocator,
          bodySeed,
        } as PlanetaryArchitectureSlot);

        classifications.push(
          new PlanetTypeClassification(
            planetOrdinal,
            bodyLocator,
            bodySeed,
            planetType,
            solidMassEarth +
              envelopeMassEarth,
            planetType ===
              PlanetType.GAS_GIANT
              ? 8
              : 2,
            planetType ===
              PlanetType.GAS_GIANT
              ? 1.2
              : 5,
            envelopeFraction01,
            sourceIceFraction01,
            PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
            PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_HOST,
            planetType ===
              PlanetType.VOLCANIC
              ? 500
              : 1,
            planetType ===
              PlanetType.VOLCANIC
              ? 200
              : 0,
          ),
        );

        const iceBearingMassEarth =
          solidMassEarth *
          sourceIceFraction01;

        compositions.push(
          new PlanetInternalComposition(
            planetOrdinal,
            bodyLocator,
            bodySeed,
            solidMassEarth,
            envelopeMassEarth,
            0,
            1 -
              sourceIceFraction01,
            sourceIceFraction01,
            0,
            solidMassEarth *
              0.20,
            solidMassEarth *
              0.80 -
              iceBearingMassEarth,
            iceBearingMassEarth,
            0,
            envelopeMassEarth,
          ),
        );
      }

      const system = {
        generationKey,
        locator:
          systemLocator,
        planetCount:
          planetTypes.length,
        planetSlots:
          slots,
      } as unknown as PlanetarySystem;

      return {
        system,
        classifications,
        compositions,
      };
    }

    function sourceIceFractionForType(
      planetType:
        PlanetType,
    ): number {

      switch (
        planetType
      ) {
        case PlanetType.OCEAN:
        case PlanetType.ICE:
        case PlanetType.ICE_GIANT:
          return 0.60;

        case PlanetType.MINI_NEPTUNE:
        case PlanetType.GAS_GIANT:
          return 0.30;

        case PlanetType.ROCKY:
        case PlanetType.SUPER_EARTH:
        case PlanetType.DESERT:
        case PlanetType.VOLCANIC:
          return 0.10;
      }
    }

    function envelopeFractionForType(
      planetType:
        PlanetType,
    ): number {

      switch (
        planetType
      ) {
        case PlanetType.MINI_NEPTUNE:
          return 0.10;

        case PlanetType.GAS_GIANT:
          return 0.60;

        case PlanetType.ICE_GIANT:
          return 0.20;

        case PlanetType.ROCKY:
        case PlanetType.SUPER_EARTH:
        case PlanetType.DESERT:
        case PlanetType.OCEAN:
        case PlanetType.ICE:
        case PlanetType.VOLCANIC:
          return 0;
      }
    }
  },
);
