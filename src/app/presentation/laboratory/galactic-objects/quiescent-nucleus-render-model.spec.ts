import {
  GeneratorVersion,
} from '../../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';

import {
  GalacticNucleusState,
} from '../../../domain/universe/galactic-nucleus-state';

import {
  UniverseSeed,
} from '../../../domain/universe/universe-seed';

import {
  GalaxyGenerator,
} from '../../../simulation/universe/galaxy-generator';

import {
  createQuiescentNucleusRenderModel,
  QUIESCENT_NUCLEUS_VISUAL_FAMILIES,
} from './quiescent-nucleus-render-model';

const GENERATION_KEY =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    ),
    GeneratorVersion.V1,
  );

describe(
  'QuiescentNucleusRenderModel',
  () => {
    it(
      'should deterministically derive the same visual model for the canonical quiescent nucleus',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            GENERATION_KEY,
            0n,
          );

        expect(
          galaxy.nucleus
            ?.state,
        ).toBe(
          GalacticNucleusState.QUIESCENT,
        );

        const first =
          createQuiescentNucleusRenderModel(
            galaxy,
          );

        const second =
          createQuiescentNucleusRenderModel(
            galaxy,
          );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      'should only emit warm old-stellar palettes and bounded quiescent parameters',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            GENERATION_KEY,
            0n,
          );

        const model =
          createQuiescentNucleusRenderModel(
            galaxy,
          );

        expect(
          QUIESCENT_NUCLEUS_VISUAL_FAMILIES,
        ).toContain(
          model.family,
        );

        expect(
          model.axisRatio,
        ).toBeGreaterThanOrEqual(
          0.54,
        );

        expect(
          model.axisRatio,
        ).toBeLessThanOrEqual(
          0.98,
        );

        expect(
          model.centralIntensity,
        ).toBeLessThanOrEqual(
          0.90,
        );

        expect(
          model.palette.oldStars[0],
        ).toBeGreaterThan(
          model.palette.oldStars[2],
        );

        expect(
          model.palette.redGiants[0],
        ).toBeGreaterThan(
          model.palette.redGiants[1],
        );
      },
    );
  },
);
