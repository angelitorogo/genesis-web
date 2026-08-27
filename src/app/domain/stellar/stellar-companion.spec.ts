import {
  StellarColor,
} from './stellar-color';

import {
  StellarCompanion,
} from './stellar-companion';

import {
  StellarComponentDesignation,
} from './stellar-component-designation';

import {
  StellarDesignation,
} from './stellar-designation';

import {
  StellarEvolutionAssessment,
} from './stellar-evolution-assessment';

import {
  StellarEvolutionInput,
} from './stellar-evolution-input';

import {
  StellarEvolutionState,
} from './stellar-evolution-state';

import {
  StellarLifetimeProfile,
} from './stellar-lifetime-profile';

import {
  StellarMainSequenceClass,
} from './stellar-main-sequence-class';

import {
  StellarPhysicalProperties,
} from './stellar-physical-properties';

import {
  StellarSpectralAppearance,
} from './stellar-spectral-appearance';

import {
  StellarSpectralType,
} from './stellar-spectral-type';

import {
  StellarSystemComponentLabel,
} from './stellar-system-component-label';

describe(
  'StellarCompanion point 16.2',
  () => {
    const systemDesignation =
      new StellarDesignation(
        'Testara',
        'GEN-V1-G0-S0-O0-SYS-0123456789ABCDEFFEDCBA9876543210',
      );

    const designation =
      new StellarComponentDesignation(
        systemDesignation,
        StellarSystemComponentLabel.B,
      );

    const physicalProperties =
      new StellarPhysicalProperties(
        0.5,
        0.5,
        0.57,
        0.0625,
        3_820,
      );

    const spectralAppearance =
      new StellarSpectralAppearance(
        new StellarSpectralType(
          'K',
          7,
        ),
        new StellarColor(
          255,
          210,
          170,
        ),
      );

    const input =
      new StellarEvolutionInput(
        0.5,
        1.0,
        4.0,
      );

    const assessment =
      new StellarEvolutionAssessment(
        input,
        StellarEvolutionState.MAIN_SEQUENCE,
        StellarMainSequenceClass.K,
        null,
        null,
        null,
        null,
        null,
        56,
        5,
      );

    const lifetimeProfile =
      new StellarLifetimeProfile(
        4.0,
        61,
        57,
        assessment,
      );

    it(
      'should hold one valid B component with a normalized intra-system seed and coherent mass ratio',
      () => {
        const companion =
          new StellarCompanion(
            StellarSystemComponentLabel.B,
            'ABCDEF0123456789ABCDEF0123456789',
            designation,
            1.0,
            0.5,
            physicalProperties,
            spectralAppearance,
            lifetimeProfile,
          );

        expect(
          companion.componentLabel,
        ).toBe(
          StellarSystemComponentLabel.B,
        );

        expect(
          companion.designation.name,
        ).toBe(
          'Testara B',
        );

        expect(
          companion.currentEvolutionState,
        ).toBe(
          StellarEvolutionState.MAIN_SEQUENCE,
        );
      },
    );

    it(
      'should reject malformed component seeds, invalid mass ratios and a mass inconsistent with q',
      () => {
        const create =
          (
            componentSeedHex:
              string,

            massRatio:
              number,

            properties =
              physicalProperties,
          ) =>
            new StellarCompanion(
              StellarSystemComponentLabel.B,
              componentSeedHex,
              designation,
              1.0,
              massRatio,
              properties,
              spectralAppearance,
              lifetimeProfile,
            );

        expect(
          () =>
            create(
              'BAD-SEED',
              0.5,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            create(
              'ABCDEF0123456789ABCDEF0123456789',
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            create(
              'ABCDEF0123456789ABCDEF0123456789',
              0.6,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
