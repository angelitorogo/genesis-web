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
  PlanetaryOrbitHabitableZoneRelation,
} from '../../domain/planetary/planetary-orbit-habitable-zone-relation';

import {
  PlanetaryOrbitalElements,
} from '../../domain/planetary/planetary-orbital-elements';

import {
  PlanetarySystemHabitableZoneDynamicalRegime,
} from '../../domain/planetary/planetary-system-habitable-zone-dynamical-regime';

import {
  PlanetarySystemHabitableZoneEvolutionRegime,
} from '../../domain/planetary/planetary-system-habitable-zone-evolution-regime';

import {
  PlanetarySystemHabitableZone,
} from '../../domain/planetary/planetary-system-habitable-zone';

import {
  PlanetarySystemOrbitalLayout,
} from '../../domain/planetary/planetary-system-orbital-layout';

import {
  PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

import {
  type StellarSystem,
} from '../../domain/stellar/stellar-system';

import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  PlanetarySystemHabitableZoneClassificationGenerator,
} from './planetary-system-habitable-zone-classification-generator';

describe(
  'PlanetarySystemHabitableZoneClassificationGenerator point 18.7',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const locator =
      new SystemLocator(
        0n,
        0n,
        17n,
      );

    const bodyLocator =
      new BodyLocator(
        locator.galaxyIndex,
        locator.sectorKey,
        locator.galacticObjectIndex,
        0n,
      );

    const bodySeed =
      new BodySeed(
        '0123456789ABCDEFFEDCBA9876543210',
      );

    function stellarSystem(
      multiplicity =
        StellarSystemMultiplicity.SINGLE,
    ): StellarSystem {

      return {
        generationKey,
        locator,
        multiplicity,
      } as unknown as StellarSystem;
    }

    function layout(
      semiMajorAxisAu:
        number,

      eccentricity:
        number,

      topology =
        PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
    ): PlanetarySystemOrbitalLayout {

      return new PlanetarySystemOrbitalLayout(
        locator,
        topology,
        0.1,
        3,
        [
          new PlanetaryOrbitalElements(
            1,
            bodyLocator,
            bodySeed,
            semiMajorAxisAu,
            eccentricity,
            0,
            0,
            0,
          ),
        ],
      );
    }

    function fullZone(
      topology =
        PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
    ): PlanetarySystemHabitableZone {

      return new PlanetarySystemHabitableZone(
        locator,
        topology,
        1,
        1,
        0.25,
        1,
        2,
        1,
        2,
        1,
        PlanetarySystemHabitableZoneDynamicalRegime.FULL_DYNAMICAL_OVERLAP,
        topology ===
          PlanetarySystemOrbitTopology.CIRCUMSTELLAR
          ? PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_HOST
          : PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_INNER_PAIR,
      );
    }

    it(
      'should classify all six periapsis-apoapsis relations rather than using semi-major axis alone',
      () => {
        const cases:
          readonly [
            number,
            number,
            PlanetaryOrbitHabitableZoneRelation,
          ][] = [
            [
              0.5,
              0.2,
              PlanetaryOrbitHabitableZoneRelation.WHOLLY_INTERIOR_TO_ZONE,
            ],
            [
              0.9,
              0.2,
              PlanetaryOrbitHabitableZoneRelation.CROSSES_INNER_EDGE,
            ],
            [
              1.5,
              0.2,
              PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
            ],
            [
              1.9,
              0.1,
              PlanetaryOrbitHabitableZoneRelation.CROSSES_OUTER_EDGE,
            ],
            [
              1.5,
              0.5,
              PlanetaryOrbitHabitableZoneRelation.SPANS_BOTH_EDGES,
            ],
            [
              2.5,
              0.1,
              PlanetaryOrbitHabitableZoneRelation.WHOLLY_EXTERIOR_TO_ZONE,
            ],
          ];

        for (
          const [
            semiMajorAxisAu,
            eccentricity,
            expected,
          ]
          of cases
        ) {
          const result =
            PlanetarySystemHabitableZoneClassificationGenerator
              .generate(
                generationKey,
                stellarSystem(),
                layout(
                  semiMajorAxisAu,
                  eccentricity,
                ),
                fullZone(),
              );

          expect(
            result
              .orbitClassifications[0]
              .radiativeRelation,
          ).toBe(
            expected,
          );

          expect(
            result
              .orbitClassifications[0]
              .dynamicallyAvailableRelation,
          ).toBe(
            expected,
          );
        }
      },
    );

    it(
      'should keep radiative and dynamically available classifications distinct for a partially clipped circumbinary HZ',
      () => {
        const zone =
          new PlanetarySystemHabitableZone(
            locator,
            PlanetarySystemOrbitTopology.CIRCUMBINARY,
            1,
            1,
            0.25,
            1,
            2,
            1.4,
            2,
            0.6,
            PlanetarySystemHabitableZoneDynamicalRegime.PARTIAL_DYNAMICAL_OVERLAP,
            PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_INNER_PAIR,
          );

        const result =
          PlanetarySystemHabitableZoneClassificationGenerator
            .generate(
              generationKey,
              stellarSystem(
                StellarSystemMultiplicity.BINARY,
              ),
              layout(
                1.2,
                0.05,
                PlanetarySystemOrbitTopology.CIRCUMBINARY,
              ),
              zone,
            );

        expect(
          result
            .orbitClassifications[0]
            .radiativeRelation,
        ).toBe(
          PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
        );

        expect(
          result
            .orbitClassifications[0]
            .dynamicallyAvailableRelation,
        ).toBe(
          PlanetaryOrbitHabitableZoneRelation.WHOLLY_INTERIOR_TO_ZONE,
        );
      },
    );

    it(
      'should preserve radiative classification but expose null dynamic relation when point 18.6 has no dynamical HZ overlap',
      () => {
        const zone =
          new PlanetarySystemHabitableZone(
            locator,
            PlanetarySystemOrbitTopology.CIRCUMBINARY,
            1,
            1,
            0.25,
            1,
            2,
            null,
            null,
            0,
            PlanetarySystemHabitableZoneDynamicalRegime.NO_DYNAMICAL_OVERLAP,
            PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_INNER_PAIR,
          );

        const result =
          PlanetarySystemHabitableZoneClassificationGenerator
            .generate(
              generationKey,
              stellarSystem(
                StellarSystemMultiplicity.BINARY,
              ),
              layout(
                1.5,
                0,
                PlanetarySystemOrbitTopology.CIRCUMBINARY,
              ),
              zone,
            );

        expect(
          result
            .orbitClassifications[0]
            .radiativeRelation,
        ).toBe(
          PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
        );

        expect(
          result
            .orbitClassifications[0]
            .dynamicallyAvailableRelation,
        ).toBeNull();

        expect(
          result.hasOrbitIntersectingDynamicallyAvailableHabitableZone,
        ).toBe(false);
      },
    );

    it(
      'should treat exact edge contact as zone intersection and remain deterministic without entropy',
      () => {
        const inner =
          PlanetarySystemHabitableZoneClassificationGenerator
            .generate(
              generationKey,
              stellarSystem(),
              layout(
                1,
                0,
              ),
              fullZone(),
            );

        const outer =
          PlanetarySystemHabitableZoneClassificationGenerator
            .generate(
              generationKey,
              stellarSystem(),
              layout(
                2,
                0,
              ),
              fullZone(),
            );

        expect(
          inner.orbitClassifications[0].radiativeRelation,
        ).toBe(
          PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
        );

        expect(
          outer.orbitClassifications[0].radiativeRelation,
        ).toBe(
          PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
        );

        expect(
          PlanetarySystemHabitableZoneClassificationGenerator
            .generate(
              generationKey,
              stellarSystem(),
              layout(
                1.5,
                0.2,
              ),
              fullZone(),
            ),
        ).toEqual(
          PlanetarySystemHabitableZoneClassificationGenerator
            .generate(
              generationKey,
              stellarSystem(),
              layout(
                1.5,
                0.2,
              ),
              fullZone(),
            ),
        );
      },
    );
  },
);
