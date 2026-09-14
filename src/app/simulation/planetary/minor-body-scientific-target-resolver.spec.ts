import {
  SystemLocator,
} from '../../domain/generation/procedural-locator';

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
  MinorBodyScientificTargetKind,
  MinorBodyScientificTargetResolver,
} from './minor-body-scientific-target-resolver';

describe(
  'MinorBodyScientificTargetResolver point 26.8 + TNO fiche extension',
  () => {

    it(
      'should expose the stable trans-Neptunian route kind without creating a new locator level',
      () => {
        expect(
          MinorBodyScientificTargetKind.TRANS_NEPTUNIAN_OBJECT,
        ).toBe(
          'tno',
        );
      },
    );

    it(
      'should reject a malformed point-22.10 identity before materializing the system',
      () => {
        const generationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
            ),
            GeneratorVersion.V1,
          );

        const result =
          MinorBodyScientificTargetResolver
            .resolveDetailed(
              generationKey,
              new SystemLocator(
                3n,
                -17n,
                8n,
              ),
              MinorBodyScientificTargetKind.ASTEROID,
              'NOT-A-PROCEDURAL-ID',
            );

        expect(result).toBeNull();
      },
    );
  },
);
