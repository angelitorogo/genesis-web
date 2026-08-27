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
  type StellarCompanion,
} from './stellar-companion';

import {
  StellarComponentDesignation,
} from './stellar-component-designation';

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
  StellarSystemComponentLabel,
} from './stellar-system-component-label';

import {
  StellarSystemMultiplicity,
} from './stellar-system-multiplicity';

describe(
  'StellarSystem points 16.1-16.2',
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

    function secondaryCompanion(
      baseDesignation =
        designation,
    ): StellarCompanion {

      return {
        componentLabel:
          StellarSystemComponentLabel.B,

        designation:
          new StellarComponentDesignation(
            baseDesignation,
            StellarSystemComponentLabel.B,
          ),
      } as unknown as StellarCompanion;
    }

    it(
      'should preserve point-16.1 SINGLE as exactly one canonical primary star',
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
          system.primaryStar,
        ).toBe(
          star,
        );

        expect(
          system.secondaryCompanion,
        ).toBeNull();

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

        expect(
          system.primaryComponentDesignation.name,
        ).toBe(
          'Testara A',
        );
      },
    );

    it(
      'should model point-16.2 BINARY as the same primary plus exactly one B companion',
      () => {
        const companion =
          secondaryCompanion();

        const system =
          new StellarSystem(
            generationKey,
            locator,
            seed,
            designation,
            StellarSystemMultiplicity.BINARY,
            primaryStar(),
            companion,
          );

        expect(
          system.secondaryCompanion,
        ).toBe(
          companion,
        );

        expect(
          system.stellarComponentCount,
        ).toBe(
          2,
        );

        expect(
          system.isMultiple,
        ).toBe(
          true,
        );

        expect(
          system.primaryComponentDesignation.proceduralCode,
        ).toBe(
          `${designation.proceduralCode}-A`,
        );
      },
    );

    it(
      'should reject multiplicity/component mismatches',
      () => {
        expect(
          () =>
            new StellarSystem(
              generationKey,
              locator,
              seed,
              designation,
              StellarSystemMultiplicity.SINGLE,
              primaryStar(),
              secondaryCompanion(),
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new StellarSystem(
              generationKey,
              locator,
              seed,
              designation,
              StellarSystemMultiplicity.BINARY,
              primaryStar(),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a binary companion layered over another system designation',
      () => {
        const otherDesignation =
          new StellarDesignation(
            'Othera',
            'GEN-V1-G3-S-27-O43-SYS-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          );

        expect(
          () =>
            new StellarSystem(
              generationKey,
              locator,
              seed,
              designation,
              StellarSystemMultiplicity.BINARY,
              primaryStar(),
              secondaryCompanion(
                otherDesignation,
              ),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a primary star from a different generation key or SystemLocator',
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
