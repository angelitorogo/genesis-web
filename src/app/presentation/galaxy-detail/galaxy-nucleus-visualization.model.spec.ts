import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalacticNucleusState,
} from '../../domain/universe/galactic-nucleus-state';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GalaxyGenerator,
} from '../../simulation/universe/galaxy-generator';

import {
  createGalaxyNucleusVisualization,
} from './galaxy-nucleus-visualization.model';

const GENERATION_KEY =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    ),
    GeneratorVersion.V1,
  );

describe(
  '28.2G.1 — galaxy nucleus visualization',
  () => {
    it(
      'reuses the approved QUIESCENT family and the real generated SMBH when present',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            GENERATION_KEY,
            0n,
          );

        expect(
          galaxy.nucleus?.state,
        ).toBe(
          GalacticNucleusState.QUIESCENT,
        );

        const visual =
          createGalaxyNucleusVisualization(
            GENERATION_KEY,
            0n,
          );

        expect(
          visual?.kind,
        ).toBe(
          'QUIESCENT',
        );

        if (
          visual?.kind !==
            'QUIESCENT'
        ) {
          throw new Error(
            'Expected a QUIESCENT visualization.',
          );
        }

        expect(
          visual.blackHoleCoreModel?.massSolar,
        ).toBe(
          galaxy.nucleus
            ?.supermassiveBlackHole
            ?.massSolarMasses,
        );
      },
    );

    it(
      'maps the real AGN nucleus to the approved AGN renderer with its canonical SMBH core',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            GENERATION_KEY,
            20n,
          );

        expect(
          galaxy.nucleus?.state,
        ).toBe(
          GalacticNucleusState.AGN,
        );

        const visual =
          createGalaxyNucleusVisualization(
            GENERATION_KEY,
            20n,
          );

        expect(
          visual?.kind,
        ).toBe(
          'AGN',
        );

        if (
          visual?.kind !==
            'AGN'
        ) {
          throw new Error(
            'Expected an AGN visualization.',
          );
        }

        const blackHoleCoreModel =
          visual.blackHoleCoreModel;

        expect(
          blackHoleCoreModel,
        ).not.toBeNull();

        if (
          blackHoleCoreModel === null
        ) {
          throw new Error(
            'Expected the AGN visualization to reuse its real SMBH core.',
          );
        }

        expect(
          blackHoleCoreModel.massSolar,
        ).toBe(
          galaxy.nucleus
            ?.supermassiveBlackHole
            ?.massSolarMasses,
        );

        expect(
          blackHoleCoreModel.type,
        ).toBe(
          'SMBH',
        );
      },
    );

    it(
      'maps the real QUASAR nucleus to the approved QUASAR renderer with its canonical SMBH core',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            GENERATION_KEY,
            331n,
          );

        expect(
          galaxy.nucleus?.state,
        ).toBe(
          GalacticNucleusState.QUASAR,
        );

        const visual =
          createGalaxyNucleusVisualization(
            GENERATION_KEY,
            331n,
          );

        expect(
          visual?.kind,
        ).toBe(
          'QUASAR',
        );

        if (
          visual?.kind !==
            'QUASAR'
        ) {
          throw new Error(
            'Expected a QUASAR visualization.',
          );
        }

        const blackHoleCoreModel =
          visual.blackHoleCoreModel;

        expect(
          blackHoleCoreModel,
        ).not.toBeNull();

        if (
          blackHoleCoreModel === null
        ) {
          throw new Error(
            'Expected the QUASAR visualization to reuse its real SMBH core.',
          );
        }

        expect(
          blackHoleCoreModel.massSolar,
        ).toBe(
          galaxy.nucleus
            ?.supermassiveBlackHole
            ?.massSolarMasses,
        );

        expect(
          blackHoleCoreModel.type,
        ).toBe(
          'SMBH',
        );
      },
    );

    it(
      'is deterministic and never creates a second nucleus identity',
      () => {
        expect(
          createGalaxyNucleusVisualization(
            GENERATION_KEY,
            20n,
          ),
        ).toEqual(
          createGalaxyNucleusVisualization(
            GENERATION_KEY,
            20n,
          ),
        );
      },
    );
  },
);
