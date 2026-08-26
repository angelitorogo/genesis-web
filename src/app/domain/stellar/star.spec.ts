import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  SystemLocator,
} from '../generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  UniverseSeed,
} from '../universe/universe-seed';

import {
  Star,
} from './star';

import {
  StellarEvolutionState,
} from './stellar-evolution-state';

import {
  StellarMainSequenceClass,
} from './stellar-main-sequence-class';

describe(
  'Star',
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
        7n,
        -42n,
        3n,
      );

    it(
      'should materialize point-14.2 main-sequence identity without inventing point-15 physical or spectral output',
      () => {
        const star =
          new Star(
            generationKey,
            locator,
            StellarEvolutionState.MAIN_SEQUENCE,
            StellarMainSequenceClass.G,
          );

        expect(
          star.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          star.locator,
        ).toBe(
          locator,
        );

        expect(
          star.evolutionState,
        ).toBe(
          StellarEvolutionState.MAIN_SEQUENCE,
        );

        expect(
          star.mainSequenceClass,
        ).toBe(
          StellarMainSequenceClass.G,
        );

        expect(
          Object.keys(
            star,
          ),
        ).toEqual([
          'generationKey',
          'locator',
          'evolutionState',
          'mainSequenceClass',
        ]);

        for (
          const point15Property
          of [
            'massSolar',
            'radiusSolar',
            'luminositySolar',
            'effectiveTemperatureKelvin',
            'spectralType',
            'color',
            'ageBillionYears',
          ]
        ) {
          expect(
            point15Property in
              star,
          ).toBe(
            false,
          );
        }
      },
    );

    it(
      'should derive its address directly from the existing SystemLocator hierarchy',
      () => {
        const star =
          new Star(
            generationKey,
            locator,
            StellarEvolutionState.WHITE_DWARF,
            null,
          );

        expect(
          star.galaxyIndex,
        ).toBe(
          7n,
        );

        expect(
          star.sectorKey,
        ).toBe(
          -42n,
        );

        expect(
          star.galacticObjectIndex,
        ).toBe(
          3n,
        );
      },
    );

    it(
      'should support all seven O/B/A/F/G/K/M classes only for MAIN_SEQUENCE stars',
      () => {
        for (
          const mainSequenceClass
          of StellarMainSequenceClass.values
        ) {
          const star =
            new Star(
              generationKey,
              locator,
              StellarEvolutionState.MAIN_SEQUENCE,
              mainSequenceClass,
            );

          expect(
            star.mainSequenceClass,
          ).toBe(
            mainSequenceClass,
          );
        }
      },
    );

    it(
      'should keep every non-main-sequence evolutionary family free of a main-sequence class',
      () => {
        for (
          const evolutionState
          of StellarEvolutionState.values
        ) {
          if (
            evolutionState.name ===
            StellarEvolutionState.MAIN_SEQUENCE.name
          ) {
            continue;
          }

          const star =
            new Star(
              generationKey,
              locator,
              evolutionState,
              null,
            );

          expect(
            star.mainSequenceClass,
          ).toBeNull();

          expect(
            'starIndex' in
              star,
          ).toBe(
            false,
          );
        }
      },
    );

    it(
      'should reject missing or misplaced main-sequence classification',
      () => {
        expect(
          () =>
            new Star(
              generationKey,
              locator,
              StellarEvolutionState.MAIN_SEQUENCE,
              null,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new Star(
              generationKey,
              locator,
              StellarEvolutionState.GIANT,
              StellarMainSequenceClass.K,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
