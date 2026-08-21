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
  AGN_NUCLEUS_VISUAL_FAMILIES,
  createAgnNucleusRenderModel,
  resolveAgnNucleusVisualFamily,
} from './agn-nucleus-render-model';

const GENERATION_KEY =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    ),
    GeneratorVersion.V1,
  );

describe(
  'agn-nucleus-render-model',
  () => {
    it(
      'should derive deterministic AGN render parameters from real Ground Truth',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            GENERATION_KEY,
            20n,
          );

        expect(
          galaxy.nucleus
            ?.state,
        ).toBe(
          GalacticNucleusState.AGN,
        );

        expect(
          createAgnNucleusRenderModel(
            galaxy,
          ),
        ).toEqual(
          createAgnNucleusRenderModel(
            galaxy,
          ),
        );
      },
    );

    it(
      'should retain the real SMBH mass and keep the shadow physically black in the render contract',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            GENERATION_KEY,
            20n,
          );

        const model =
          createAgnNucleusRenderModel(
            galaxy,
          );

        expect(
          model.blackHoleMassSolarMasses,
        ).toBe(
          galaxy.nucleus
            ?.supermassiveBlackHole
            ?.massSolarMasses,
        );

        expect(
          model.shadowRadius,
        ).toBeGreaterThan(
          0,
        );

        expect(
          model.diskInnerRadius,
        ).toBeGreaterThan(
          model.shadowRadius,
        );

        expect(
          model.diskOuterRadius,
        ).toBeGreaterThan(
          model.diskInnerRadius,
        );
      },
    );

    it(
      'should expose all eight AGN visual families across deterministic generated galaxies',
      () => {
        const families =
          new Set<string>();

        for (
          let galaxyIndex = 0n;
          galaxyIndex < 4096n &&
          families.size < 8;
          galaxyIndex += 1n
        ) {
          const galaxy =
            GalaxyGenerator.generate(
              GENERATION_KEY,
              galaxyIndex,
            );

          if (
            galaxy.nucleus
              ?.state !==
            GalacticNucleusState.AGN
          ) {
            continue;
          }

          families.add(
            resolveAgnNucleusVisualFamily(
              galaxy,
            ),
          );
        }

        expect(
          families.size,
        ).toBe(
          AGN_NUCLEUS_VISUAL_FAMILIES.length,
        );
      },
      15_000,
    );

    it(
      'should reject non-AGN nuclei rather than invent an active accretion disk',
      () => {
        const quiescent =
          GalaxyGenerator.generate(
            GENERATION_KEY,
            0n,
          );

        expect(
          () =>
            createAgnNucleusRenderModel(
              quiescent,
            ),
        ).toThrowError(
          RangeError,
        );
      },
    );
  },
);
