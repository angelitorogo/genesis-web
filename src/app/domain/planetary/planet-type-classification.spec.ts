import {
  BodyLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetaryOrbitHabitableZoneRelation,
} from './planetary-orbit-habitable-zone-relation';

import {
  PlanetarySystemHabitableZoneEvolutionRegime,
} from './planetary-system-habitable-zone-evolution-regime';

import {
  PlanetType,
} from './planet-type';

import {
  PlanetTypeClassification,
} from './planet-type-classification';

describe(
  'PlanetTypeClassification point 19.4',
  () => {
    const locator =
      new BodyLocator(
        2n,
        -8n,
        4n,
        0n,
      );

    const seed =
      new BodySeed(
        '11111111111111111111111111111111',
      );

    it(
      'should preserve one auditable physical classification and its source diagnostics',
      () => {
        const classification =
          new PlanetTypeClassification(
            1,
            locator,
            seed,
            PlanetType.OCEAN,
            1.4,
            1.15,
            5.08,
            0.01,
            0.62,
            PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
            PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_HOST,
            0.94,
            0.02,
          );

        expect(
          classification.planetType,
        ).toBe(
          PlanetType.OCEAN,
        );

        expect(
          classification.isGiant,
        ).toBe(false);

        expect(
          classification.isEnvelopeRich,
        ).toBe(false);
      },
    );

    it(
      'should expose envelope-rich and giant convenience semantics without changing the primary type',
      () => {
        const mini =
          classification(
            PlanetType.MINI_NEPTUNE,
          );

        const gas =
          classification(
            PlanetType.GAS_GIANT,
          );

        const ice =
          classification(
            PlanetType.ICE_GIANT,
          );

        expect(
          mini.isEnvelopeRich,
        ).toBe(true);

        expect(
          mini.isGiant,
        ).toBe(false);

        expect(
          gas.isGiant,
        ).toBe(true);

        expect(
          ice.isGiant,
        ).toBe(true);
      },
    );

    it(
      'should reject invalid identity, normalized diagnostics and non-finite physical inputs',
      () => {
        expect(
          () =>
            new PlanetTypeClassification(
              2,
              locator,
              seed,
              PlanetType.ROCKY,
              1,
              1,
              5.514,
              0,
              0,
              PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
              PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_HOST,
              1,
              0,
            ),
        ).toThrow(
          RangeError,
        );

        for (
          const invalidFraction
          of [
            -0.01,
            1.01,
            Number.NaN,
          ]
        ) {
          expect(
            () =>
              new PlanetTypeClassification(
                1,
                locator,
                seed,
                PlanetType.ROCKY,
                1,
                1,
                5.514,
                invalidFraction,
                0.2,
                PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
                PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_HOST,
                1,
                0,
              ),
          ).toThrow(
            RangeError,
          );
        }

        expect(
          () =>
            new PlanetTypeClassification(
              1,
              locator,
              seed,
              PlanetType.ROCKY,
              1,
              1,
              5.514,
              0,
              0.2,
              PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
              PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_HOST,
              0,
              0,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    function classification(
      planetType:
        PlanetType,
    ): PlanetTypeClassification {

      return new PlanetTypeClassification(
        1,
        locator,
        seed,
        planetType,
        10,
        3,
        2.04,
        0.2,
        0.5,
        PlanetaryOrbitHabitableZoneRelation.WHOLLY_EXTERIOR_TO_ZONE,
        PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_HOST,
        0.2,
        0,
      );
    }
  },
);
