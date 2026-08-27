import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  SystemLocator,
} from '../generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  SystemSeed,
} from '../seed/hierarchical-seeds';

import {
  UniverseSeed,
} from '../universe/universe-seed';

import {
  Star,
} from './star';

import {
  StellarDesignation,
} from './stellar-designation';

import {
  StellarEvolutionState,
} from './stellar-evolution-state';

import {
  StellarMainSequenceClass,
} from './stellar-main-sequence-class';

import {
  StellarSystem,
} from './stellar-system';

import {
  StellarSystemMultiplicity,
} from './stellar-system-multiplicity';

describe(
  'StellarSystem',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const locator =
      new SystemLocator(
        3n,
        -27n,
        42n,
      );

    const seed =
      new SystemSeed(
        '0123456789ABCDEFFEDCBA9876543210',
      );

    const designation =
      new StellarDesignation(
        'Testara',
        'GEN-V1-G3-S-27-O42-SYS-0123456789ABCDEFFEDCBA9876543210',
      );

    function primaryStar(
      starGenerationKey =
        generationKey,

      starLocator =
        locator,
    ): Star {

      return new Star(
        starGenerationKey,
        starLocator,
        StellarEvolutionState.MAIN_SEQUENCE,
        StellarMainSequenceClass.G,
      );
    }

    it(
      'should model a point-16.1 system as exactly one canonical primary star',
      () => {
        const star =
          primaryStar();

        const system =
          new StellarSystem(
            generationKey,
            locator,
            seed,
            designation,
            StellarSystemMultiplicity.SINGLE,
            star,
          );

        expect(
          system.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          system.locator,
        ).toBe(
          locator,
        );

        expect(
          system.seed,
        ).toBe(
          seed,
        );

        expect(
          system.designation,
        ).toBe(
          designation,
        );

        expect(
          system.primaryStar,
        ).toBe(
          star,
        );

        expect(
          system.multiplicity,
        ).toBe(
          StellarSystemMultiplicity.SINGLE,
        );

        expect(
          system.stellarComponentCount,
        ).toBe(
          1,
        );

        expect(
          system.isMultiple,
        ).toBe(
          false,
        );
      },
    );

    it(
      'should reject a primary star from a different generation key',
      () => {
        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '0000-0000-0000-0000-0000-0000-0000-0001',
            ),
            GeneratorVersion.V1,
          );

        expect(
          () =>
            new StellarSystem(
              generationKey,
              locator,
              seed,
              designation,
              StellarSystemMultiplicity.SINGLE,
              primaryStar(
                otherGenerationKey,
              ),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a primary star from a different SystemLocator',
      () => {
        expect(
          () =>
            new StellarSystem(
              generationKey,
              locator,
              seed,
              designation,
              StellarSystemMultiplicity.SINGLE,
              primaryStar(
                generationKey,
                new SystemLocator(
                  locator.galaxyIndex,
                  locator.sectorKey,
                  locator.galacticObjectIndex +
                    1n,
                ),
              ),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
