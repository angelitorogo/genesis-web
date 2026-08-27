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
  'StellarSystem points 16.1-16.3',
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

    function companion(
      label:
        StellarSystemComponentLabel,

      initialMassSolar:
        number,

      componentSeedHex:
        string,

      baseDesignation =
        designation,
    ): StellarCompanion {

      return {
        componentLabel:
          label,

        componentSeedHex,

        designation:
          new StellarComponentDesignation(
            baseDesignation,
            label,
          ),

        physicalProperties: {
          initialMassSolar,
        },
      } as unknown as StellarCompanion;
    }

    const secondaryCompanion =
      () =>
        companion(
          StellarSystemComponentLabel.B,
          0.7,
          'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        );

    const tertiaryCompanion =
      () =>
        companion(
          StellarSystemComponentLabel.C,
          0.4,
          'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
        );

    it(
      'should preserve SINGLE as exactly one canonical primary star',
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

        expect(system.primaryStar).toBe(star);
        expect(system.secondaryCompanion).toBeNull();
        expect(system.tertiaryCompanion).toBeNull();
        expect(system.stellarComponentCount).toBe(1);
        expect(system.isMultiple).toBe(false);
        expect(system.primaryComponentDesignation.name).toBe('Testara A');
      },
    );

    it(
      'should preserve BINARY as the same primary plus exactly one B companion',
      () => {
        const secondary =
          secondaryCompanion();

        const system =
          new StellarSystem(
            generationKey,
            locator,
            seed,
            designation,
            StellarSystemMultiplicity.BINARY,
            primaryStar(),
            secondary,
          );

        expect(system.secondaryCompanion).toBe(secondary);
        expect(system.tertiaryCompanion).toBeNull();
        expect(system.stellarComponentCount).toBe(2);
        expect(system.isMultiple).toBe(true);
      },
    );

    it(
      'should model TRIPLE as A plus distinct B/C companions ordered by initial mass',
      () => {
        const secondary =
          secondaryCompanion();

        const tertiary =
          tertiaryCompanion();

        const system =
          new StellarSystem(
            generationKey,
            locator,
            seed,
            designation,
            StellarSystemMultiplicity.TRIPLE,
            primaryStar(),
            secondary,
            tertiary,
          );

        expect(system.secondaryCompanion).toBe(secondary);
        expect(system.tertiaryCompanion).toBe(tertiary);
        expect(system.stellarComponentCount).toBe(3);
        expect(system.isMultiple).toBe(true);
        expect(system.tertiaryCompanion?.designation.name).toBe('Testara C');
      },
    );

    it(
      'should reject multiplicity/component mismatches and invalid triple ordering',
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
        ).toThrow(RangeError);

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
        ).toThrow(RangeError);

        expect(
          () =>
            new StellarSystem(
              generationKey,
              locator,
              seed,
              designation,
              StellarSystemMultiplicity.BINARY,
              primaryStar(),
              secondaryCompanion(),
              tertiaryCompanion(),
            ),
        ).toThrow(RangeError);

        expect(
          () =>
            new StellarSystem(
              generationKey,
              locator,
              seed,
              designation,
              StellarSystemMultiplicity.TRIPLE,
              primaryStar(),
              secondaryCompanion(),
            ),
        ).toThrow(RangeError);

        expect(
          () =>
            new StellarSystem(
              generationKey,
              locator,
              seed,
              designation,
              StellarSystemMultiplicity.TRIPLE,
              primaryStar(),
              secondaryCompanion(),
              companion(
                StellarSystemComponentLabel.C,
                0.8,
                'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
              ),
            ),
        ).toThrow(RangeError);

        expect(
          () =>
            new StellarSystem(
              generationKey,
              locator,
              seed,
              designation,
              StellarSystemMultiplicity.TRIPLE,
              primaryStar(),
              secondaryCompanion(),
              companion(
                StellarSystemComponentLabel.C,
                0.4,
                'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
              ),
            ),
        ).toThrow(RangeError);
      },
    );

    it(
      'should reject companions layered over another system designation',
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
              companion(
                StellarSystemComponentLabel.B,
                0.7,
                'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                otherDesignation,
              ),
            ),
        ).toThrow(RangeError);

        expect(
          () =>
            new StellarSystem(
              generationKey,
              locator,
              seed,
              designation,
              StellarSystemMultiplicity.TRIPLE,
              primaryStar(),
              secondaryCompanion(),
              companion(
                StellarSystemComponentLabel.C,
                0.4,
                'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
                otherDesignation,
              ),
            ),
        ).toThrow(RangeError);
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
              primaryStar(otherGenerationKey),
            ),
        ).toThrow(RangeError);

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
                  locator.galacticObjectIndex + 1n,
                ),
              ),
            ),
        ).toThrow(RangeError);
      },
    );
  },
);
