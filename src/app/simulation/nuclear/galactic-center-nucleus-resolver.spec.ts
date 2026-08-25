import {
  GalacticNucleus,
} from '../../domain/universe/galactic-nucleus';

import {
  GalacticNucleusState,
} from '../../domain/universe/galactic-nucleus-state';

import {
  Galaxy,
} from '../../domain/universe/galaxy';

import {
  GalaxyType,
} from '../../domain/universe/galaxy-type';

import {
  SupermassiveBlackHole,
} from '../../domain/universe/supermassive-black-hole';

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
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  GalacticCenterNucleusResolver,
} from './galactic-center-nucleus-resolver';

describe(
  'GalacticCenterNucleusResolver',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const source =
      GalaxyGenerator.generate(
        generationKey,
        0n,
      );

    it(
      'should interpret an undifferentiated V1 centre as QUIESCENT rather than empty',
      () => {
        const galaxy =
          cloneWith(
            source,
            GalaxyType.SPIRAL,
            null,
          );

        expect(
          GalacticCenterNucleusResolver
            .resolveState(
              galaxy,
            ),
        ).toBe(
          GalacticNucleusState.QUIESCENT,
        );
      },
    );

    it(
      'should preserve QUIESCENT, AGN and allowed QUASAR states',
      () => {
        expect(
          GalacticCenterNucleusResolver
            .resolveState(
              cloneWith(
                source,
                GalaxyType.ELLIPTICAL,
                new GalacticNucleus(
                  GalacticNucleusState.QUIESCENT,
                  null,
                ),
              ),
            ),
        ).toBe(
          GalacticNucleusState.QUIESCENT,
        );

        expect(
          GalacticCenterNucleusResolver
            .resolveState(
              cloneWith(
                source,
                GalaxyType.SPIRAL,
                new GalacticNucleus(
                  GalacticNucleusState.AGN,
                  new SupermassiveBlackHole(
                    1.0e7,
                  ),
                ),
              ),
            ),
        ).toBe(
          GalacticNucleusState.AGN,
        );

        expect(
          GalacticCenterNucleusResolver
            .resolveState(
              cloneWith(
                source,
                GalaxyType.ELLIPTICAL,
                new GalacticNucleus(
                  GalacticNucleusState.QUASAR,
                  new SupermassiveBlackHole(
                    1.0e8,
                  ),
                ),
              ),
            ),
        ).toBe(
          GalacticNucleusState.QUASAR,
        );
      },
    );

    it(
      'should reject QUASAR Ground Truth in DWARF and IRREGULAR galaxies',
      () => {
        for (
          const type of [
            GalaxyType.DWARF,
            GalaxyType.IRREGULAR,
          ]
        ) {
          const galaxy =
            cloneWith(
              source,
              type,
              new GalacticNucleus(
                GalacticNucleusState.QUASAR,
                new SupermassiveBlackHole(
                  1.0e6,
                ),
              ),
            );

          expect(
            () =>
              GalacticCenterNucleusResolver
                .resolveState(
                  galaxy,
                ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );
  },
);

function cloneWith(
  source:
    Galaxy,

  type:
    GalaxyType,

  nucleus:
    GalacticNucleus | null,
): Galaxy {
  return new Galaxy(
    source.generationKey,
    source.index,
    source.seed,
    source.designation,
    type,
    source.physicalProperties,
    nucleus,
  );
}
