import {
  TestBed,
} from '@angular/core/testing';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  DEFAULT_UNIVERSE_SEED,
  UniverseSeedFacade,
} from './universe-seed.facade';

describe(
  'UniverseSeedFacade',
  () => {
    let facade:
      UniverseSeedFacade;

    beforeEach(
      () => {
        TestBed.configureTestingModule(
          {},
        );

        facade =
          TestBed.inject(
            UniverseSeedFacade,
          );
      },
    );

    it(
      'should expose the default canonical seed',
      () => {
        expect(
          facade.serializedSeed(),
        ).toBe(
          DEFAULT_UNIVERSE_SEED,
        );

        expect(
          facade.normalizedSeed(),
        ).toBe(
          DEFAULT_UNIVERSE_SEED
            .replaceAll(
              '-',
              '',
            ),
        );
      },
    );

    it(
      'should serialize the active seed canonically',
      () => {
        expect(
          facade
            .activeSeed()
            .serialize(),
        ).toBe(
          DEFAULT_UNIVERSE_SEED,
        );
      },
    );

    it(
      'should expose GeneratorVersion V1',
      () => {
        expect(
          facade.generatorVersion(),
        ).toBe(
          GeneratorVersion.V1,
        );

        expect(
          facade.generatorVersionCode(),
        ).toBe(
          1,
        );
      },
    );

    it(
      'should expose the active UniverseGenerationKey',
      () => {
        const key =
          facade
            .activeGenerationKey();

        expect(
          key
            .universeSeed
            .serialize(),
        ).toBe(
          DEFAULT_UNIVERSE_SEED,
        );

        expect(
          key.generatorVersion,
        ).toBe(
          GeneratorVersion.V1,
        );
      },
    );

    it(
      'should update the manual draft',
      () => {
        const value =
          'ABCD-0000-0000-0000-0000-0000-0000-0001';

        facade.updateDraft(
          value,
        );

        expect(
          facade.draft(),
        ).toBe(
          value,
        );
      },
    );

    it(
      'should apply a valid manual seed',
      () => {
        const value =
          'abcd-0000-0000-0000-0000-0000-0000-0001';

        facade.updateDraft(
          value,
        );

        expect(
          facade.applyDraft(),
        ).toBe(true);

        expect(
          facade.serializedSeed(),
        ).toBe(
          'ABCD-0000-0000-0000-0000-0000-0000-0001',
        );

        expect(
          facade.draft(),
        ).toBe(
          'ABCD-0000-0000-0000-0000-0000-0000-0001',
        );

        expect(
          facade.feedback().kind,
        ).toBe(
          'success',
        );

        expect(
          facade.generatorVersion(),
        ).toBe(
          GeneratorVersion.V1,
        );
      },
    );

    it(
      'should accept surrounding whitespace from manual input',
      () => {
        facade.updateDraft(
          '  ABCD-0000-0000-0000-0000-0000-0000-0001  ',
        );

        expect(
          facade.applyDraft(),
        ).toBe(true);

        expect(
          facade.serializedSeed(),
        ).toBe(
          'ABCD-0000-0000-0000-0000-0000-0000-0001',
        );
      },
    );

    it(
      'should reject invalid input without changing the active seed',
      () => {
        const before =
          facade.serializedSeed();

        facade.updateDraft(
          'INVALID',
        );

        expect(
          facade.applyDraft(),
        ).toBe(false);

        expect(
          facade.serializedSeed(),
        ).toBe(
          before,
        );

        expect(
          facade.feedback().kind,
        ).toBe(
          'error',
        );
      },
    );

    it(
      'should restore the active seed into the draft',
      () => {
        facade.updateDraft(
          'INVALID',
        );

        facade.restoreActiveSeed();

        expect(
          facade.draft(),
        ).toBe(
          DEFAULT_UNIVERSE_SEED,
        );

        expect(
          facade.draftIsValid(),
        ).toBe(true);
      },
    );
  },
);