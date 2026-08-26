import {
  STELLAR_SPECTRAL_FAMILIES,
  StellarSpectralType,
} from './stellar-spectral-type';

describe(
  'StellarSpectralType point 15.2',
  () => {
    it(
      'should expose exactly the O/B/A/F/G/K/M plus L/T/Y family vocabulary inherited from phase 14',
      () => {
        expect(
          STELLAR_SPECTRAL_FAMILIES,
        ).toEqual([
          'O',
          'B',
          'A',
          'F',
          'G',
          'K',
          'M',
          'L',
          'T',
          'Y',
        ]);
      },
    );

    it(
      'should materialize a detailed family plus integer subtype as a canonical designation',
      () => {
        const type =
          new StellarSpectralType(
            'G',
            2,
          );

        expect(
          type,
        ).toEqual(
          expect.objectContaining({
            family:
              'G',

            subtype:
              2,

            designation:
              'G2',
          }),
        );

        expect(
          structuredClone(
            type,
          ),
        ).toEqual({
          family:
            'G',

          subtype:
            2,

          designation:
            'G2',
        });
      },
    );

    it(
      'should accept both subtype boundaries for every supported family',
      () => {
        for (
          const family
          of STELLAR_SPECTRAL_FAMILIES
        ) {
          expect(
            new StellarSpectralType(
              family,
              0,
            )
              .designation,
          ).toBe(
            `${family}0`,
          );

          expect(
            new StellarSpectralType(
              family,
              9,
            )
              .designation,
          ).toBe(
            `${family}9`,
          );
        }
      },
    );

    it(
      'should reject unknown families and invalid subtypes',
      () => {
        expect(
          () =>
            new StellarSpectralType(
              'Q' as never,
              0,
            ),
        ).toThrow(
          RangeError,
        );

        for (
          const invalidSubtype
          of [
            -1,
            10,
            2.5,
            Number.NaN,
          ]
        ) {
          expect(
            () =>
              new StellarSpectralType(
                'G',
                invalidSubtype,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );
  },
);
