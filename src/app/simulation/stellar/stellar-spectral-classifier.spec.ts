import {
  StellarBrownDwarfClass,
} from '../../domain/stellar/stellar-brown-dwarf-class';

import {
  StellarMainSequenceClass,
} from '../../domain/stellar/stellar-main-sequence-class';

import {
  STELLAR_SPECTRAL_V1_MAX_EFFECTIVE_TEMPERATURE_KELVIN,
  STELLAR_SPECTRAL_V1_MIN_EFFECTIVE_TEMPERATURE_KELVIN,
  StellarSpectralClassifier,
} from './stellar-spectral-classifier';

describe(
  'StellarSpectralClassifier point 15.2',
  () => {
    it(
      'should resolve a solar-temperature G-family baseline as G2 with a warm-white display color',
      () => {
        const appearance =
          StellarSpectralClassifier
            .classify(
              5_772,
              StellarMainSequenceClass.G,
              null,
            );

        expect(
          appearance
            .spectralType
            .designation,
        ).toBe(
          'G2',
        );

        expect(
          appearance
            .color
            .red,
        ).toBeGreaterThanOrEqual(
          appearance
            .color
            .green,
        );

        expect(
          appearance
            .color
            .green,
        ).toBeGreaterThan(
          appearance
            .color
            .blue,
        );
      },
    );

    it(
      'should preserve every phase-14 O/B/A/F/G/K/M broad family while resolving a 0..9 temperature subtype',
      () => {
        const cases = [
          [
            StellarMainSequenceClass.O,
            40_000,
            'O5',
          ],
          [
            StellarMainSequenceClass.B,
            20_000,
            'B5',
          ],
          [
            StellarMainSequenceClass.A,
            8_750,
            'A5',
          ],
          [
            StellarMainSequenceClass.F,
            6_750,
            'F5',
          ],
          [
            StellarMainSequenceClass.G,
            5_600,
            'G5',
          ],
          [
            StellarMainSequenceClass.K,
            4_450,
            'K5',
          ],
          [
            StellarMainSequenceClass.M,
            3_050,
            'M5',
          ],
        ] as const;

        for (
          const [
            broadClass,
            temperature,
            expected,
          ]
          of cases
        ) {
          expect(
            StellarSpectralClassifier
              .classify(
                temperature,
                broadClass,
                null,
              )
              .spectralType
              .designation,
          ).toBe(
            expected,
          );
        }
      },
    );

    it(
      'should preserve the phase-14 L/T/Y brown-dwarf family while resolving detailed subtypes',
      () => {
        const cases = [
          [
            StellarBrownDwarfClass.L,
            1_850,
            'L5',
          ],
          [
            StellarBrownDwarfClass.T,
            900,
            'T5',
          ],
          [
            StellarBrownDwarfClass.Y,
            375,
            'Y5',
          ],
        ] as const;

        for (
          const [
            broadClass,
            temperature,
            expected,
          ]
          of cases
        ) {
          expect(
            StellarSpectralClassifier
              .classify(
                temperature,
                null,
                broadClass,
              )
              .spectralType
              .designation,
          ).toBe(
            expected,
          );
        }
      },
    );

    it(
      'should make hotter photospheres visually bluer than solar-like and cool ones visually redder',
      () => {
        const hot =
          StellarSpectralClassifier
            .classify(
              30_000,
              StellarMainSequenceClass.B,
              null,
            )
            .color;

        const solarLike =
          StellarSpectralClassifier
            .classify(
              5_772,
              StellarMainSequenceClass.G,
              null,
            )
            .color;

        const cool =
          StellarSpectralClassifier
            .classify(
              3_000,
              StellarMainSequenceClass.M,
              null,
            )
            .color;

        expect(
          hot.blue -
            hot.red,
        ).toBeGreaterThan(
          solarLike.blue -
            solarLike.red,
        );

        expect(
          cool.red -
            cool.blue,
        ).toBeGreaterThan(
          solarLike.red -
            solarLike.blue,
        );
      },
    );

    it(
      'should require exactly one phase-14 broad classification source',
      () => {
        expect(
          () =>
            StellarSpectralClassifier
              .classify(
                5_772,
                null,
                null,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            StellarSpectralClassifier
              .classify(
                5_772,
                StellarMainSequenceClass.G,
                StellarBrownDwarfClass.L,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should support the full point-15.2 scientific temperature envelope while saturating display RGB safely',
      () => {
        const cool =
          StellarSpectralClassifier
            .classify(
              STELLAR_SPECTRAL_V1_MIN_EFFECTIVE_TEMPERATURE_KELVIN,
              null,
              StellarBrownDwarfClass.Y,
            );

        const hot =
          StellarSpectralClassifier
            .classify(
              STELLAR_SPECTRAL_V1_MAX_EFFECTIVE_TEMPERATURE_KELVIN,
              StellarMainSequenceClass.O,
              null,
            );

        for (
          const appearance
          of [
            cool,
            hot,
          ]
        ) {
          for (
            const channel
            of [
              appearance.color.red,
              appearance.color.green,
              appearance.color.blue,
            ]
          ) {
            expect(
              channel,
            ).toBeGreaterThanOrEqual(
              0,
            );

            expect(
              channel,
            ).toBeLessThanOrEqual(
              255,
            );
          }
        }
      },
    );

    it(
      'should reject temperatures outside the point-15.2 modeled envelope',
      () => {
        for (
          const invalidTemperature
          of [
            249.999,
            200_000.001,
            Number.NaN,
            Number.POSITIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              StellarSpectralClassifier
                .classify(
                  invalidTemperature,
                  StellarMainSequenceClass.G,
                  null,
                ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );
  },
);
