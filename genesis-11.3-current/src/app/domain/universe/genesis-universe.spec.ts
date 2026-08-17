import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  UniverseSeed,
} from './universe-seed';

import {
  GenesisUniverse,
} from './genesis-universe';

describe(
  'GenesisUniverse',
  () => {
    const universeSeed =
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      );

    const generationKey =
      new UniverseGenerationKey(
        universeSeed,
        GeneratorVersion.V1,
      );

    it(
      'should preserve its UniverseGenerationKey exactly',
      () => {
        const universe =
          new GenesisUniverse(
            generationKey,
          );

        expect(
          universe.generationKey,
        ).toBe(
          generationKey,
        );
      },
    );

    it(
      'should define galaxy zero as the canonical initial galaxy',
      () => {
        expect(
          GenesisUniverse
            .INITIAL_GALAXY_INDEX,
        ).toBe(
          0n,
        );
      },
    );

    it(
      'should not materialize a collection of galaxies',
      () => {
        const universe =
          new GenesisUniverse(
            generationKey,
          );

        expect(
          'galaxies' in
            universe,
        ).toBe(false);
      },
    );
  },
);