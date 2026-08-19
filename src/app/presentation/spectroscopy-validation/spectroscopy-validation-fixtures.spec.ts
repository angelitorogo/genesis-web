import {
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  SpectroscopyValidationCaseId,
  SPECTROSCOPY_VALIDATION_CASES,
  SpectroscopyValidationFixtures,
} from './spectroscopy-validation-fixtures';

describe(
  'SpectroscopyValidationFixtures',
  () => {
    it(
      'should expose the six real phase-13 visual-validation families',
      () => {
        expect(
          SPECTROSCOPY_VALIDATION_CASES
            .map(
              entry =>
                entry.id,
            ),
        ).toEqual([
          SpectroscopyValidationCaseId
            .STELLAR,
          SpectroscopyValidationCaseId
            .ATMOSPHERE,
          SpectroscopyValidationCaseId
            .NEBULA,
          SpectroscopyValidationCaseId
            .AGN,
          SpectroscopyValidationCaseId
            .QUASAR,
          SpectroscopyValidationCaseId
            .SUPERNOVA_REMNANT,
        ]);
      },
    );

    it(
      'should generate the actual point-13.2 stellar sampling contract',
      () => {
        const frame =
          SpectroscopyValidationFixtures
            .frame(
              SpectroscopyValidationCaseId
                .STELLAR,
              ObservationInstrumentLevel
                .LEVEL_3,
            );

        expect(
          frame.idealized
            .minimumWavelengthNanometers,
        ).toBe(380);

        expect(
          frame.idealized
            .maximumWavelengthNanometers,
        ).toBe(750);

        expect(
          frame.idealized
            .sampleCount,
        ).toBe(741);
      },
    );

    it(
      'should generate the actual point-13.3 atmospheric sampling contract',
      () => {
        const frame =
          SpectroscopyValidationFixtures
            .frame(
              SpectroscopyValidationCaseId
                .ATMOSPHERE,
              ObservationInstrumentLevel
                .LEVEL_3,
            );

        expect(
          frame.idealized
            .minimumWavelengthNanometers,
        ).toBe(400);

        expect(
          frame.idealized
            .maximumWavelengthNanometers,
        ).toBe(2_500);

        expect(
          frame.idealized
            .sampleCount,
        ).toBe(421);
      },
    );

    it(
      'should generate the actual point-13.4 emission-nebula spectrum',
      () => {
        const frame =
          SpectroscopyValidationFixtures
            .frame(
              SpectroscopyValidationCaseId
                .NEBULA,
              ObservationInstrumentLevel
                .LEVEL_3,
            );

        expect(
          frame.idealized
            .minimumWavelengthNanometers,
        ).toBe(450);

        expect(
          frame.idealized
            .maximumWavelengthNanometers,
        ).toBe(700);

        expect(
          frame.idealized
            .sampleCount,
        ).toBe(2_501);
      },
    );

    it(
      'should generate the actual frozen AGN and QUASAR vectors and keep them distinct',
      () => {
        const agn =
          SpectroscopyValidationFixtures
            .frame(
              SpectroscopyValidationCaseId
                .AGN,
              ObservationInstrumentLevel
                .LEVEL_3,
            );

        const quasar =
          SpectroscopyValidationFixtures
            .frame(
              SpectroscopyValidationCaseId
                .QUASAR,
              ObservationInstrumentLevel
                .LEVEL_3,
            );

        expect(
          agn.idealized
            .sampleCount,
        ).toBe(1_601);

        expect(
          quasar.idealized
            .sampleCount,
        ).toBe(1_601);

        expect(
          agn.idealized
            .samples,
        ).not.toEqual(
          quasar.idealized
            .samples,
        );
      },
    );

    it(
      'should generate the actual point-13.5 supernova-remnant spectrum',
      () => {
        const frame =
          SpectroscopyValidationFixtures
            .frame(
              SpectroscopyValidationCaseId
                .SUPERNOVA_REMNANT,
              ObservationInstrumentLevel
                .LEVEL_3,
            );

        expect(
          frame.idealized
            .minimumWavelengthNanometers,
        ).toBe(450);

        expect(
          frame.idealized
            .maximumWavelengthNanometers,
        ).toBe(700);

        expect(
          frame.idealized
            .sampleCount,
        ).toBe(2_501);
      },
    );

    it(
      'should generate every visual-validation family at all five real instrument levels',
      () => {
        const levels = [
          ObservationInstrumentLevel
            .LEVEL_1,
          ObservationInstrumentLevel
            .LEVEL_2,
          ObservationInstrumentLevel
            .LEVEL_3,
          ObservationInstrumentLevel
            .LEVEL_4,
          ObservationInstrumentLevel
            .LEVEL_5,
        ] as const;

        for (
          const caseOption
          of SPECTROSCOPY_VALIDATION_CASES
        ) {
          for (
            const level
            of levels
          ) {
            expect(
              () =>
                SpectroscopyValidationFixtures
                  .frame(
                    caseOption.id,
                    level,
                  ),
              `${caseOption.id} ${level.name}`,
            ).not.toThrow();
          }
        }
      },
    );

    it(
      'should generate the real LEVEL_1 versus LEVEL_5 comparison for every visual-validation family',
      () => {
        for (
          const caseOption
          of SPECTROSCOPY_VALIDATION_CASES
        ) {
          expect(
            () =>
              SpectroscopyValidationFixtures
                .comparison(
                  caseOption.id,
                ),
            caseOption.id,
          ).not.toThrow();
        }
      },
    );

    it(
      'should compare the same idealized source through real LEVEL_1 and LEVEL_5 instrumental projections',
      () => {
        const comparison =
          SpectroscopyValidationFixtures
            .comparison(
              SpectroscopyValidationCaseId
                .STELLAR,
            );

        expect(
          comparison
            .level1
            .idealized
            .samples,
        ).toEqual(
          comparison
            .level5
            .idealized
            .samples,
        );

        expect(
          comparison
            .level1
            .instrumental
            .quantizationFraction,
        ).toBeCloseTo(
          0.2,
          12,
        );

        expect(
          comparison
            .level5
            .instrumental
            .quantizationFraction,
        ).toBeCloseTo(
          0.01,
          12,
        );

        expect(
          comparison
            .level1
            .instrumental
            .effectiveResolutionElementNanometers,
        ).toBeGreaterThan(
          comparison
            .level5
            .instrumental
            .effectiveResolutionElementNanometers,
        );
      },
    );
  },
);
