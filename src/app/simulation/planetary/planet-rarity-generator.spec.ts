import {
  BodyLocator,
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
  type PlanetInternalComposition,
} from '../../domain/planetary/planet-internal-composition';

import {
  type PlanetPhysicalProperties,
} from '../../domain/planetary/planet-physical-properties';

import {
  PlanetRarityTrait,
} from '../../domain/planetary/planet-rarity-trait';

import {
  type PlanetRotationProperties,
} from '../../domain/planetary/planet-rotation-properties';

import {
  type PlanetSurfaceBaseProperties,
} from '../../domain/planetary/planet-surface-base-properties';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  type PlanetTypeClassification,
} from '../../domain/planetary/planet-type-classification';

import {
  type PlanetTypePhysicalCoherenceAssessment,
} from '../../domain/planetary/planet-type-physical-coherence-assessment';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  PlanetRarityGenerator,
} from './planet-rarity-generator';

describe(
  'PlanetRarityGenerator point 19.8',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should derive basic rarity traits without entropy and preserve exact planet identity',
      () => {
        const fixture =
          rarityFixture();

        const rarity =
          PlanetRarityGenerator
            .generate(
              generationKey,
              fixture.system,
              fixture.physical[1],
              fixture.rotation[1],
              fixture.types[1],
              fixture.compositions[1],
              fixture.surfaces[1],
              fixture.coherence[1],
            );

        expect(
          rarity.planetOrdinal,
        ).toBe(2);

        expect(
          rarity.bodyLocator,
        ).toBe(
          fixture.physical[1].bodyLocator,
        );

        expect(
          rarity.bodySeed,
        ).toBe(
          fixture.physical[1].bodySeed,
        );

        expect(
          rarity.traits,
        ).toEqual([
          PlanetRarityTrait.ULTRA_DENSE,
          PlanetRarityTrait.EXTREME_SURFACE_GRAVITY,
          PlanetRarityTrait.RAPID_ROTATOR,
          PlanetRarityTrait.EXTREME_OBLIQUITY,
          PlanetRarityTrait.HIGH_ORBITAL_ECCENTRICITY,
          PlanetRarityTrait.EXTREME_IRRADIATION,
          PlanetRarityTrait.EXTREME_TIDAL_HEATING,
          PlanetRarityTrait.MASSIVE_SOLID_WORLD,
          PlanetRarityTrait.EXTREME_BASE_ALBEDO,
        ]);
      },
    );

    it(
      'should be deterministic and generate an aligned frozen collection including ordinary planets with no rarity',
      () => {
        const fixture =
          rarityFixture();

        const before =
          PlanetRarityGenerator
            .generate(
              generationKey,
              fixture.system,
              fixture.physical[1],
              fixture.rotation[1],
              fixture.types[1],
              fixture.compositions[1],
              fixture.surfaces[1],
              fixture.coherence[1],
            );

        PlanetRarityGenerator
          .generate(
            generationKey,
            fixture.system,
            fixture.physical[0],
            fixture.rotation[0],
            fixture.types[0],
            fixture.compositions[0],
            fixture.surfaces[0],
            fixture.coherence[0],
          );

        const after =
          PlanetRarityGenerator
            .generate(
              generationKey,
              fixture.system,
              fixture.physical[1],
              fixture.rotation[1],
              fixture.types[1],
              fixture.compositions[1],
              fixture.surfaces[1],
              fixture.coherence[1],
            );

        expect(
          after,
        ).toEqual(
          before,
        );

        const all =
          PlanetRarityGenerator
            .generateAll(
              generationKey,
              fixture.system,
              fixture.physical,
              fixture.rotation,
              fixture.types,
              fixture.compositions,
              fixture.surfaces,
              fixture.coherence,
            );

        expect(
          Object.isFrozen(
            all,
          ),
        ).toBe(true);

        expect(
          all[0].traits,
        ).toEqual([]);

        expect(
          all[1],
        ).toEqual(
          before,
        );
      },
    );

    it(
      'should suppress traits for an incoherent point-19.7 baseline and reject misaligned collections',
      () => {
        const fixture =
          rarityFixture();

        const incoherent = {
          ...fixture.coherence[1],
          isCoherent:
            false,
        } as PlanetTypePhysicalCoherenceAssessment;

        const rarity =
          PlanetRarityGenerator
            .generate(
              generationKey,
              fixture.system,
              fixture.physical[1],
              fixture.rotation[1],
              fixture.types[1],
              fixture.compositions[1],
              fixture.surfaces[1],
              incoherent,
            );

        expect(
          rarity.isAssessmentEligible,
        ).toBe(false);

        expect(
          rarity.traits,
        ).toEqual([]);

        expect(
          () =>
            PlanetRarityGenerator
              .generateAll(
                generationKey,
                fixture.system,
                fixture.physical,
                fixture.rotation.slice(0, 1),
                fixture.types,
                fixture.compositions,
                fixture.surfaces,
                fixture.coherence,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    function rarityFixture(): {
      readonly system:
        PlanetarySystem;
      readonly physical:
        readonly PlanetPhysicalProperties[];
      readonly rotation:
        readonly PlanetRotationProperties[];
      readonly types:
        readonly PlanetTypeClassification[];
      readonly compositions:
        readonly PlanetInternalComposition[];
      readonly surfaces:
        readonly PlanetSurfaceBaseProperties[];
      readonly coherence:
        readonly PlanetTypePhysicalCoherenceAssessment[];
    } {
      const physical:
        PlanetPhysicalProperties[] = [];
      const rotation:
        PlanetRotationProperties[] = [];
      const types:
        PlanetTypeClassification[] = [];
      const compositions:
        PlanetInternalComposition[] = [];
      const surfaces:
        PlanetSurfaceBaseProperties[] = [];
      const coherence:
        PlanetTypePhysicalCoherenceAssessment[] = [];

      const slots:
        Array<{
          planetOrdinal: number;
          bodyLocator: BodyLocator;
          bodySeed: BodySeed;
        }> = [];

      const orbits:
        Array<{
          planetOrdinal: number;
          bodyLocator: BodyLocator;
          bodySeed: BodySeed;
          eccentricity: number;
        }> = [];

      for (
        const [
          index,
          source,
        ]
        of [
          {
            massEarth: 1,
            radiusEarth: 1,
            density: 5.514,
            gravity: 1,
            envelope: 0,
            rotationHours: 24,
            tilt: 23.44,
            eccentricity: 0.02,
            insolation: 1,
            tidal: 0.001,
            coreFractionSolids: 0.28,
            iceFractionSolids: 0.10,
            albedo: 0.20,
          },
          {
            massEarth: 10,
            radiusEarth: 1.75,
            density: 10.288513119533528,
            gravity: 3.2653061224489797,
            envelope: 0.02,
            rotationHours: 5.5,
            tilt: 90,
            eccentricity: 0.31,
            insolation: 1_100,
            tidal: 1_200,
            coreFractionSolids: 0.30,
            iceFractionSolids: 0.20,
            albedo: 0.07,
          },
        ].entries()
      ) {
        const planetOrdinal =
          index +
          1;

        const locator =
          new BodyLocator(
            3n,
            -17n,
            8n,
            BigInt(
              index,
            ),
          );

        const seed =
          new BodySeed(
            index ===
              0
              ? '11111111111111111111111111111111'
              : '22222222222222222222222222222222',
          );

        const envelopeMassEarth =
          source.massEarth *
          source.envelope;

        const solidMassEarth =
          source.massEarth -
          envelopeMassEarth;

        slots.push({
          planetOrdinal,
          bodyLocator:
            locator,
          bodySeed:
            seed,
        });

        orbits.push({
          planetOrdinal,
          bodyLocator:
            locator,
          bodySeed:
            seed,
          eccentricity:
            source.eccentricity,
        });

        physical.push({
          planetOrdinal,
          bodyLocator:
            locator,
          bodySeed:
            seed,
          inheritedSolidCoreMassEarth:
            solidMassEarth,
          accretedEnvelopeMassEarth:
            envelopeMassEarth,
          massEarth:
            source.massEarth,
          radiusEarth:
            source.radiusEarth,
          densityGramsPerCubicCentimeter:
            source.density,
          surfaceGravityEarth:
            source.gravity,
          surfaceGravityMetersPerSecondSquared:
            source.gravity *
            9.80665,
          envelopeMassFraction01:
            source.envelope,
          solidMassFraction01:
            1 -
            source.envelope,
        } as PlanetPhysicalProperties);

        rotation.push({
          planetOrdinal,
          bodyLocator:
            locator,
          bodySeed:
            seed,
          sourceOrbitalPeriodHours:
            1_000,
          rotationPeriodHours:
            source.rotationHours,
          dayLengthHours:
            24,
          axialTiltDegrees:
            source.tilt,
          isRetrograde:
            source.tilt >
            90,
          isTidallySynchronized:
            false,
          hasFiniteDayLength:
            true,
        } as PlanetRotationProperties);

        types.push({
          planetOrdinal,
          bodyLocator:
            locator,
          bodySeed:
            seed,
          planetType:
            index ===
              0
              ? PlanetType.ROCKY
              : PlanetType.VOLCANIC,
          sourceMassEarth:
            source.massEarth,
          sourceRadiusEarth:
            source.radiusEarth,
          sourceDensityGramsPerCubicCentimeter:
            source.density,
          sourceEnvelopeMassFraction01:
            source.envelope,
          sourceIceBearingSolidFraction01:
            source.iceFractionSolids,
          referenceMeanInsolationEarth:
            source.insolation,
          tidalHeatingProxy:
            source.tidal,
        } as PlanetTypeClassification);

        compositions.push({
          planetOrdinal,
          bodyLocator:
            locator,
          bodySeed:
            seed,
          sourceSolidMassEarth:
            solidMassEarth,
          sourceEnvelopeMassEarth:
            envelopeMassEarth,
          totalMassEarth:
            source.massEarth,
          solidInteriorMassEarth:
            solidMassEarth,
          metallicCoreMassEarth:
            solidMassEarth *
            source.coreFractionSolids,
          silicateInteriorMassEarth:
            solidMassEarth *
            (
              1 -
              source.coreFractionSolids -
              source.iceFractionSolids
            ),
          condensedIceMassEarth:
            solidMassEarth *
            source.iceFractionSolids,
          volatileRichInteriorMassEarth:
            0,
          gaseousEnvelopeMassEarth:
            envelopeMassEarth,
          gaseousEnvelopeMassFraction01:
            source.envelope,
          iceBearingFractionOfSolids01:
            source.iceFractionSolids,
        } as PlanetInternalComposition);

        surfaces.push({
          planetOrdinal,
          bodyLocator:
            locator,
          bodySeed:
            seed,
          sourcePlanetType:
            index ===
              0
              ? PlanetType.ROCKY
              : PlanetType.VOLCANIC,
          sourceEnvelopeMassFraction01:
            source.envelope,
          sourceIceBearingInteriorFraction01:
            source.iceFractionSolids,
          sourceReferenceMeanInsolationEarth:
            source.insolation,
          referenceBondAlbedo01:
            source.albedo,
        } as PlanetSurfaceBaseProperties);

        coherence.push({
          planetOrdinal,
          bodyLocator:
            locator,
          bodySeed:
            seed,
          planetType:
            index ===
              0
              ? PlanetType.ROCKY
              : PlanetType.VOLCANIC,
          isCoherent:
            true,
        } as PlanetTypePhysicalCoherenceAssessment);
      }

      const system = {
        generationKey,
        planetCount:
          2,
        planetSlots:
          slots,
        orbits,
      } as unknown as PlanetarySystem;

      return {
        system,
        physical,
        rotation,
        types,
        compositions,
        surfaces,
        coherence,
      };
    }
  },
);
