import {
  AtmosphericSpectralAbsorber,
  AtmosphericSpectralComponent,
  AtmosphericSpectrumProfile,
} from './atmospheric-spectrum-profile';

describe(
  'point-13.3 atmospheric-spectrum domain contracts',
  () => {

    it(
      'should canonicalize atmospheric components independently of caller order',
      () => {
        const profile =
          new AtmosphericSpectrumProfile(
            [
              new AtmosphericSpectralComponent(
                AtmosphericSpectralAbsorber
                  .WATER_VAPOR,
                0.01,
              ),
              new AtmosphericSpectralComponent(
                AtmosphericSpectralAbsorber
                  .CARBON_DIOXIDE,
                0.0004,
              ),
              new AtmosphericSpectralComponent(
                AtmosphericSpectralAbsorber
                  .MOLECULAR_OXYGEN,
                0.21,
              ),
            ],
            0.8,
          );

        expect(
          profile
            .components
            .map(
              component =>
                component
                  .absorber,
            ),
        ).toEqual([
          AtmosphericSpectralAbsorber
            .CARBON_DIOXIDE,
          AtmosphericSpectralAbsorber
            .MOLECULAR_OXYGEN,
          AtmosphericSpectralAbsorber
            .WATER_VAPOR,
        ]);

        expect(
          Object.isFrozen(
            profile.components,
          ),
        ).toBe(true);
      },
    );

    it(
      'should allow an empty absorber list to represent no modeled molecular absorption',
      () => {
        const profile =
          new AtmosphericSpectrumProfile(
            [],
            0,
          );

        expect(
          profile.components,
        ).toEqual([]);

        expect(
          profile.relativeColumnScale,
        ).toBe(0);
      },
    );

    it(
      'should reject invalid component mixing ratios',
      () => {
        for (
          const invalid
          of [
            Number.NaN,
            0,
            -0.1,
            1.01,
          ]
        ) {
          expect(
            () =>
              new AtmosphericSpectralComponent(
                AtmosphericSpectralAbsorber
                  .WATER_VAPOR,
                invalid,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );

    it(
      'should reject duplicate absorbers',
      () => {
        expect(
          () =>
            new AtmosphericSpectrumProfile(
              [
                new AtmosphericSpectralComponent(
                  AtmosphericSpectralAbsorber
                    .METHANE,
                  0.01,
                ),
                new AtmosphericSpectralComponent(
                  AtmosphericSpectralAbsorber
                    .METHANE,
                  0.02,
                ),
              ],
              1,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a component inventory whose represented mixing ratios exceed unity',
      () => {
        expect(
          () =>
            new AtmosphericSpectrumProfile(
              [
                new AtmosphericSpectralComponent(
                  AtmosphericSpectralAbsorber
                    .CARBON_DIOXIDE,
                  0.6,
                ),
                new AtmosphericSpectralComponent(
                  AtmosphericSpectralAbsorber
                    .METHANE,
                  0.5,
                ),
              ],
              1,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject an invalid relative absorbing-column scale',
      () => {
        for (
          const invalid
          of [
            Number.NaN,
            -0.01,
            1.01,
          ]
        ) {
          expect(
            () =>
              new AtmosphericSpectrumProfile(
                [],
                invalid,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );
  },
);
