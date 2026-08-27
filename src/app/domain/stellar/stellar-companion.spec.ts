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
  'StellarCompanion points 16.2-16.3',
  () => {
    const systemDesignation =
      new StellarDesignation(
        'Testara',
        'GEN-V1-G0-S0-O0-SYS-0123456789ABCDEFFEDCBA9876543210',
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

    function create(
      label:
        StellarSystemComponentLabel,

      seed:
        string,

      massRatio =
        0.5,

      properties =
        physicalProperties,
    ): StellarCompanion {

      return new StellarCompanion(
        label,
        seed,
        new StellarComponentDesignation(
          systemDesignation,
          label,
        ),
        1.0,
        massRatio,
        properties,
        spectralAppearance,
        lifetimeProfile,
      );
    }

    it(
      'should preserve B and add C as valid non-primary stellar companions',
      () => {
        const secondary =
          create(
            StellarSystemComponentLabel.B,
            'ABCDEF0123456789ABCDEF0123456789',
          );

        const tertiary =
          create(
            StellarSystemComponentLabel.C,
            '1234567890ABCDEF1234567890ABCDEF',
          );

        expect(
          secondary.componentLabel,
        ).toBe(
          StellarSystemComponentLabel.B,
        );

        expect(
          tertiary.componentLabel,
        ).toBe(
          StellarSystemComponentLabel.C,
        );

        expect(
          secondary.designation.name,
        ).toBe(
          'Testara B',
        );

        expect(
          tertiary.designation.name,
        ).toBe(
          'Testara C',
        );

        expect(
          tertiary.currentEvolutionState,
        ).toBe(
          StellarEvolutionState.MAIN_SEQUENCE,
        );
      },
    );

    it(
      'should reject A, malformed component seeds, invalid mass ratios and a mass inconsistent with q',
      () => {
        expect(
          () =>
            create(
              StellarSystemComponentLabel.A,
              'ABCDEF0123456789ABCDEF0123456789',
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            create(
              StellarSystemComponentLabel.B,
              'BAD-SEED',
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            create(
              StellarSystemComponentLabel.C,
              '1234567890ABCDEF1234567890ABCDEF',
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            create(
              StellarSystemComponentLabel.C,
              '1234567890ABCDEF1234567890ABCDEF',
              0.6,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
