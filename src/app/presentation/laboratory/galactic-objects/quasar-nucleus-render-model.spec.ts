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
  createQuasarNucleusRenderModel,
  QUASAR_NUCLEUS_VISUAL_FAMILIES,
  resolveQuasarNucleusVisualFamily,
} from './quasar-nucleus-render-model';

const GENERATION_KEY =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    ),
    GeneratorVersion.V1,
  );

describe(
  'quasar-nucleus-render-model',
  () => {
    it(
      'should derive deterministic QUASAR render parameters from real Ground Truth',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            GENERATION_KEY,
            331n,
          );

        expect(
          galaxy.nucleus
            ?.state,
        ).toBe(
          GalacticNucleusState
            .QUASAR,
        );

        expect(
          createQuasarNucleusRenderModel(
            galaxy,
          ),
        ).toEqual(
          createQuasarNucleusRenderModel(
            galaxy,
          ),
        );
      },
    );

    it(
      'should preserve the real SMBH mass and expose an intrinsically extreme active-nucleus contract',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            GENERATION_KEY,
            331n,
          );

        const model =
          createQuasarNucleusRenderModel(
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

        expect(
          model.accretionBrightness,
        ).toBeGreaterThanOrEqual(
          0.9,
        );

        expect(
          model.coronaStrength,
        ).toBeGreaterThan(
          0.7,
        );

        expect(
          Math.max(
            model.jetStrength,
            model.windStrength,
          ),
        ).toBeGreaterThan(
          0.2,
        );
      },
    );

    it(
      'should expose all eight QUASAR visual families across deterministic generated galaxies',
      () => {
        const families =
          new Set<string>();

        for (
          let galaxyIndex = 0n;
          galaxyIndex < 32768n &&
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
            GalacticNucleusState
              .QUASAR
          ) {
            continue;
          }

          families.add(
            resolveQuasarNucleusVisualFamily(
              galaxy,
            ),
          );
        }

        expect(
          families.size,
        ).toBe(
          QUASAR_NUCLEUS_VISUAL_FAMILIES
            .length,
        );
      },
      30_000,
    );

    it(
      'should reject AGN and QUIESCENT nuclei rather than promoting them visually to QUASAR',
      () => {
        const quiescent =
          GalaxyGenerator.generate(
            GENERATION_KEY,
            0n,
          );

        const agn =
          GalaxyGenerator.generate(
            GENERATION_KEY,
            20n,
          );

        expect(
          () =>
            createQuasarNucleusRenderModel(
              quiescent,
            ),
        ).toThrowError(
          RangeError,
        );

        expect(
          () =>
            createQuasarNucleusRenderModel(
              agn,
            ),
        ).toThrowError(
          RangeError,
        );
      },
    );
  },
);
