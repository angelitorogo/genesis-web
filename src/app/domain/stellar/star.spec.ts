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
      'should materialize point-14.1 identity and evolutionary state without inventing later stellar properties',
      () => {
        const star =
          new Star(
            generationKey,
            locator,
            StellarEvolutionState.MAIN_SEQUENCE,
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
          Object.keys(
            star,
          ),
        ).toEqual([
          'generationKey',
          'locator',
          'evolutionState',
        ]);
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
      'should support every canonical evolutionary state without adding a StarLocator or starIndex',
      () => {
        for (
          const evolutionState
          of StellarEvolutionState.values
        ) {
          const star =
            new Star(
              generationKey,
              locator,
              evolutionState,
            );

          expect(
            star.evolutionState,
          ).toBe(
            evolutionState,
          );

          expect(
            'starIndex' in
              star,
          ).toBe(
            false,
          );
        }
      },
    );
  },
);
