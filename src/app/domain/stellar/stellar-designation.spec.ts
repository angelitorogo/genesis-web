import {
  StellarDesignation,
} from './stellar-designation';

describe(
  'StellarDesignation point 15.6',
  () => {
    it(
      'should preserve a valid human name and technical code exactly',
      () => {
        const designation =
          new StellarDesignation(
            'Jotheria',
            'GEN-V1-G0-S0-O0-SYS-DC2EACC73FFB3E9388F8BEB9FEBE1F2E',
          );

        expect(
          designation.name,
        ).toBe(
          'Jotheria',
        );

        expect(
          designation.proceduralCode,
        ).toBe(
          'GEN-V1-G0-S0-O0-SYS-DC2EACC73FFB3E9388F8BEB9FEBE1F2E',
        );
      },
    );

    it.each([
      [
        '',
        'GEN-V1-G0-S0-O0-SYS-DC2EACC73FFB3E9388F8BEB9FEBE1F2E',
      ],
      [
        ' Jotheria',
        'GEN-V1-G0-S0-O0-SYS-DC2EACC73FFB3E9388F8BEB9FEBE1F2E',
      ],
      [
        'Jotheria ',
        'GEN-V1-G0-S0-O0-SYS-DC2EACC73FFB3E9388F8BEB9FEBE1F2E',
      ],
      [
        'Jotheria',
        '',
      ],
      [
        'Jotheria',
        ' GEN-V1-G0-S0-O0-SYS-DC2EACC73FFB3E9388F8BEB9FEBE1F2E',
      ],
      [
        'Jotheria',
        'GEN-V1-G0-S0-O0-SYS-DC2EACC73FFB3E9388F8BEB9FEBE1F2E ',
      ],
    ])(
      'should reject invalid surrounding whitespace or empty identity fields',
      (
        name,
        proceduralCode,
      ) => {
        expect(
          () =>
            new StellarDesignation(
              name,
              proceduralCode,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
