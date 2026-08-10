import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  type GalaxySeed,
} from '../seed/hierarchical-seeds';

import {
  GalacticNucleus,
} from './galactic-nucleus';

import {
  GalacticNucleusState,
} from './galactic-nucleus-state';

import {
  GalaxyDesignation,
} from './galaxy-designation';

import {
  GalaxyPhysicalProperties,
} from './galaxy-physical-properties';

import {
  GalaxyStructure,
} from './galaxy-structure';

import {
  GalaxyType,
} from './galaxy-type';

import {
  SupermassiveBlackHole,
} from './supermassive-black-hole';

import {
  UniverseSeed,
} from './universe-seed';

import {
  Galaxy,
} from './galaxy';

describe(
  'Galaxy',
  () => {
    const universeSeed =
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      );

    const generationKey =
      new UniverseGenerationKey(
        universeSeed,
        GeneratorVersion.V1,
      );

    const galaxySeed =
      Object.freeze({
        normalizedValue:
          '8BA08585BCBD4D3041C1FD9EEBD048E4',
      }) as unknown as
        GalaxySeed;

    const designation =
      new GalaxyDesignation(
        'Caeloria',
        'GEN-V1-G0-8BA08585BCBD4D3041C1FD9EEBD048E4',
      );

    const structure =
      new GalaxyStructure(
        0.65,
        0.32,
        0.08,
        0.02,
        0,
      );

    const physicalProperties =
      new GalaxyPhysicalProperties(
        10.5,
        120000,
        8.5e11,
        180000000000n,
        1.15,
        2.75,
        structure,
      );

    const supermassiveBlackHole =
      new SupermassiveBlackHole(
        1.5e8,
      );

    const nucleus =
      new GalacticNucleus(
        GalacticNucleusState.QUIESCENT,
        supermassiveBlackHole,
      );

    it(
      'should preserve its complete point 4.7 domain state exactly',
      () => {
        const galaxy =
          new Galaxy(
            generationKey,
            0n,
            galaxySeed,
            designation,
            GalaxyType.SPIRAL,
            physicalProperties,
            nucleus,
          );

        expect(
          galaxy.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          galaxy.index,
        ).toBe(
          0n,
        );

        expect(
          galaxy.seed,
        ).toBe(
          galaxySeed,
        );

        expect(
          galaxy.designation,
        ).toBe(
          designation,
        );

        expect(
          galaxy.type,
        ).toBe(
          GalaxyType.SPIRAL,
        );

        expect(
          galaxy.physicalProperties,
        ).toBe(
          physicalProperties,
        );

        expect(
          galaxy.nucleus,
        ).toBe(
          nucleus,
        );
      },
    );

    it(
      'should support every canonical galaxy type',
      () => {
        for (
          const type of
          GalaxyType.values
        ) {
          const galaxy =
            new Galaxy(
              generationKey,
              0n,
              galaxySeed,
              designation,
              type,
              physicalProperties,
              nucleus,
            );

          expect(
            galaxy.type,
          ).toBe(
            type,
          );
        }
      },
    );

    it(
      'should support a galaxy without a nucleus',
      () => {
        const galaxy =
          new Galaxy(
            generationKey,
            0n,
            galaxySeed,
            designation,
            GalaxyType.IRREGULAR,
            physicalProperties,
            null,
          );

        expect(
          galaxy.nucleus,
        ).toBeNull();
      },
    );

    it(
      'should support arbitrary non-negative galaxy indices',
      () => {
        const galaxy =
          new Galaxy(
            generationKey,
            123456789n,
            galaxySeed,
            designation,
            GalaxyType.ELLIPTICAL,
            physicalProperties,
            nucleus,
          );

        expect(
          galaxy.index,
        ).toBe(
          123456789n,
        );
      },
    );

    it(
      'should support signed Long.MAX_VALUE',
      () => {
        const longMax =
          9223372036854775807n;

        const galaxy =
          new Galaxy(
            generationKey,
            longMax,
            galaxySeed,
            designation,
            GalaxyType.DWARF,
            physicalProperties,
            nucleus,
          );

        expect(
          galaxy.index,
        ).toBe(
          longMax,
        );
      },
    );

    it(
      'should reject a negative galaxy index',
      () => {
        expect(
          () =>
            new Galaxy(
              generationKey,
              -1n,
              galaxySeed,
              designation,
              GalaxyType.IRREGULAR,
              physicalProperties,
              nucleus,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject values above signed Long.MAX_VALUE',
      () => {
        expect(
          () =>
            new Galaxy(
              generationKey,
              9223372036854775808n,
              galaxySeed,
              designation,
              GalaxyType.BARRED_SPIRAL,
              physicalProperties,
              nucleus,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should not preimplement exploration state',
      () => {
        const galaxy =
          new Galaxy(
            generationKey,
            0n,
            galaxySeed,
            designation,
            GalaxyType.SPIRAL,
            physicalProperties,
            nucleus,
          );

        expect(
          'explorationState' in
            galaxy,
        ).toBe(
          false,
        );
      },
    );
  },
);