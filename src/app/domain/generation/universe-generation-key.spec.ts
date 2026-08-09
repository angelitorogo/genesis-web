import {
  UniverseSeed,
} from '../universe/universe-seed';

import {
  GeneratorVersion,
} from './generator-version';

import {
  UniverseGenerationKey,
} from './universe-generation-key';

describe(
  'UniverseGenerationKey',
  () => {
    const seed =
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      );

    it(
      'should combine UniverseSeed and GeneratorVersion',
      () => {
        const key =
          new UniverseGenerationKey(
            seed,
            GeneratorVersion.V1,
          );

        expect(
          key
            .universeSeed
            .serialize(),
        ).toBe(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        );

        expect(
          key.generatorVersion,
        ).toBe(
          GeneratorVersion.V1,
        );
      },
    );

    it(
      'should expose the persistent generator version code',
      () => {
        const key =
          new UniverseGenerationKey(
            seed,
            GeneratorVersion.V1,
          );

        expect(
          key.generatorVersionCode,
        ).toBe(
          1,
        );
      },
    );

    it(
      'should compare identical generation keys by value',
      () => {
        const first =
          new UniverseGenerationKey(
            seed,
            GeneratorVersion.V1,
          );

        const second =
          new UniverseGenerationKey(
            seed.copy(),
            GeneratorVersion.V1,
          );

        expect(
          first.equals(
            second,
          ),
        ).toBe(true);
      },
    );

    it(
      'should distinguish different universe seeds',
      () => {
        const first =
          new UniverseGenerationKey(
            seed,
            GeneratorVersion.V1,
          );

        const second =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        expect(
          first.equals(
            second,
          ),
        ).toBe(false);
      },
    );

    it(
      'should create an independent copy',
      () => {
        const original =
          new UniverseGenerationKey(
            seed,
            GeneratorVersion.V1,
          );

        const copy =
          original.copy();

        expect(
          copy,
        ).not.toBe(
          original,
        );

        expect(
          copy.universeSeed,
        ).not.toBe(
          original.universeSeed,
        );

        expect(
          copy.equals(
            original,
          ),
        ).toBe(true);

        expect(
          copy.generatorVersion,
        ).toBe(
          GeneratorVersion.V1,
        );
      },
    );
  },
);