import {
  StellarColor,
} from './stellar-color';

import {
  StellarSpectralAppearance,
} from './stellar-spectral-appearance';

import {
  StellarSpectralType,
} from './stellar-spectral-type';

describe(
  'StellarSpectralAppearance point 15.2',
  () => {
    it(
      'should keep spectral classification and representative color as pure domain data',
      () => {
        const appearance =
          new StellarSpectralAppearance(
            new StellarSpectralType(
              'G',
              2,
            ),
            new StellarColor(
              255,
              241,
              230,
            ),
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
            .hex,
        ).toBe(
          '#FFF1E6',
        );

        for (
          const renderingProperty
          of [
            'cssColor',
            'material',
            'texture',
            'canvas',
            'threeColor',
          ]
        ) {
          expect(
            renderingProperty in
              appearance,
          ).toBe(
            false,
          );
        }
      },
    );
  },
);
