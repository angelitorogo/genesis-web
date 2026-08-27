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
  StellarOrbitHierarchy,
} from './stellar-orbit-hierarchy';

import {
  StellarRelativeOrbit,
} from './stellar-relative-orbit';

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
  'StellarSystem points 16.1-16.4',
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

    function hierarchy(
      multiplicity:
        StellarSystemMultiplicity,
    ): StellarOrbitHierarchy {

      if (
        multiplicity ===
        StellarSystemMultiplicity.SINGLE
      ) {
        return new StellarOrbitHierarchy(
          multiplicity,
          null,
          null,
        );
      }

      const inner =
        new StellarRelativeOrbit(
          1,
          0.1,
          1,
        );

      if (
        multiplicity ===
        StellarSystemMultiplicity.BINARY
      ) {
        return new StellarOrbitHierarchy(
          multiplicity,
          inner,
          null,
        );
      }

      return new StellarOrbitHierarchy(
        multiplicity,
        inner,
        new StellarRelativeOrbit(
          10,
          0.2,
          30,
        ),
      );
    }

    it(
      'should preserve SINGLE as exactly one canonical primary star with no stellar relative orbit',
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
            hierarchy(
              StellarSystemMultiplicity.SINGLE,
            ),
          );

        expect(system.primaryStar).toBe(star);
        expect(system.secondaryCompanion).toBeNull();
        expect(system.tertiaryCompanion).toBeNull();
        expect(system.stellarComponentCount).toBe(1);
        expect(system.isMultiple).toBe(false);
        expect(system.primaryComponentDesignation.name).toBe('Testara A');
        expect(system.orbitHierarchy.hasInnerOrbit).toBe(false);
      },
    );

    it(
      'should preserve BINARY as A+B with the point-16.4 A-B inner orbit',
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
            hierarchy(
              StellarSystemMultiplicity.BINARY,
            ),
            secondary,
          );

        expect(system.secondaryCompanion).toBe(secondary);
        expect(system.tertiaryCompanion).toBeNull();
        expect(system.stellarComponentCount).toBe(2);
        expect(system.isMultiple).toBe(true);
        expect(system.orbitHierarchy.hasInnerOrbit).toBe(true);
        expect(system.orbitHierarchy.hasOuterOrbit).toBe(false);
      },
    );

    it(
      'should model TRIPLE as A-B inner pair plus distinct outer C companion',
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
            hierarchy(
              StellarSystemMultiplicity.TRIPLE,
            ),
            secondary,
            tertiary,
          );

        expect(system.secondaryCompanion).toBe(secondary);
        expect(system.tertiaryCompanion).toBe(tertiary);
        expect(system.stellarComponentCount).toBe(3);
        expect(system.isMultiple).toBe(true);
        expect(system.tertiaryCompanion?.designation.name).toBe('Testara C');
        expect(system.orbitHierarchy.hasOuterOrbit).toBe(true);
      },
    );

    it(
      'should reject multiplicity/orbit/component mismatches and invalid triple ordering',
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
              hierarchy(
                StellarSystemMultiplicity.BINARY,
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
              StellarSystemMultiplicity.BINARY,
              primaryStar(),
              hierarchy(
                StellarSystemMultiplicity.BINARY,
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
              StellarSystemMultiplicity.BINARY,
              primaryStar(),
              hierarchy(
                StellarSystemMultiplicity.BINARY,
              ),
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
              hierarchy(
                StellarSystemMultiplicity.TRIPLE,
              ),
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
              hierarchy(
                StellarSystemMultiplicity.TRIPLE,
              ),
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
              hierarchy(
                StellarSystemMultiplicity.TRIPLE,
              ),
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
              hierarchy(
                StellarSystemMultiplicity.BINARY,
              ),
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
              hierarchy(
                StellarSystemMultiplicity.TRIPLE,
              ),
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
              hierarchy(
                StellarSystemMultiplicity.SINGLE,
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
              hierarchy(
                StellarSystemMultiplicity.SINGLE,
              ),
            ),
        ).toThrow(RangeError);
      },
    );
  },
);
