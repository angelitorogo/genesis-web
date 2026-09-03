import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  resolveExplorationGenerationKey,
} from './exploration.facade';

function generationKey(
  serializedSeed:
    string,
): UniverseGenerationKey {

  return new UniverseGenerationKey(
    UniverseSeed.parse(
      serializedSeed,
    ),
    GeneratorVersion.V1,
  );
}

describe(
  'Exploration active-universe resolution after point-26.1 PD spending',
  () => {
    const selectedDefault =
      generationKey(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
      );

    const persistedUniverse =
      generationKey(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      );

    const anotherPersistedUniverse =
      generationKey(
        'ABCD-0000-0000-0000-0000-0000-0000-0001',
      );

    it(
      'should keep the sole persisted universe available when the in-memory seed selection is stale',
      () => {
        const resolved =
          resolveExplorationGenerationKey(
            selectedDefault,
            Object.freeze([
              persistedUniverse,
            ]),
          );

        expect(
          resolved,
        ).toBe(
          persistedUniverse,
        );
      },
    );

    it(
      'should prefer the selected persisted universe when several universes exist',
      () => {
        const resolved =
          resolveExplorationGenerationKey(
            persistedUniverse,
            Object.freeze([
              anotherPersistedUniverse,
              persistedUniverse,
            ]),
          );

        expect(
          resolved,
        ).toBe(
          persistedUniverse,
        );
      },
    );

    it(
      'should refuse to invent an active universe when several persisted universes exist and none matches the selection',
      () => {
        const resolved =
          resolveExplorationGenerationKey(
            selectedDefault,
            Object.freeze([
              persistedUniverse,
              anotherPersistedUniverse,
            ]),
          );

        expect(
          resolved,
        ).toBeNull();
      },
    );

    it(
      'should return no universe only when persistence is genuinely empty',
      () => {
        const resolved =
          resolveExplorationGenerationKey(
            selectedDefault,
            Object.freeze([]),
          );

        expect(
          resolved,
        ).toBeNull();
      },
    );
  },
);
