import {
  StellarComponentDesignation,
} from './stellar-component-designation';

import {
  StellarDesignation,
} from './stellar-designation';

import {
  StellarSystemComponentLabel,
} from './stellar-system-component-label';

describe(
  'StellarComponentDesignation point 16.2',
  () => {
    const systemDesignation =
      new StellarDesignation(
        'Jotheria',
        'GEN-V1-G0-S0-O0-SYS-DC2EACC73FFB3E9388F8BEB9FEBE1F2E',
      );

    it(
      'should layer A/B labels over the frozen point-15.6 system designation without renaming it',
      () => {
        const primary =
          new StellarComponentDesignation(
            systemDesignation,
            StellarSystemComponentLabel.A,
          );

        const secondary =
          new StellarComponentDesignation(
            systemDesignation,
            StellarSystemComponentLabel.B,
          );

        expect(
          primary.name,
        ).toBe(
          'Jotheria A',
        );

        expect(
          secondary.name,
        ).toBe(
          'Jotheria B',
        );

        expect(
          primary.proceduralCode,
        ).toBe(
          `${systemDesignation.proceduralCode}-A`,
        );

        expect(
          secondary.proceduralCode,
        ).toBe(
          `${systemDesignation.proceduralCode}-B`,
        );

        expect(
          systemDesignation.name,
        ).toBe(
          'Jotheria',
        );
      },
    );
  },
);
