import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  StellarActivityProfile,
} from '../../domain/stellar/stellar-activity-profile';

import {
  StellarActivityRegime,
} from '../../domain/stellar/stellar-activity-regime';

import {
  StellarEvolutionInput,
} from '../../domain/stellar/stellar-evolution-input';

import {
  StellarLifetimeProfile,
} from '../../domain/stellar/stellar-lifetime-profile';

import {
  StellarPhysicalProperties,
} from '../../domain/stellar/stellar-physical-properties';

import {
  StellarRotationRegime,
} from '../../domain/stellar/stellar-rotation-regime';

import {
  StellarStabilityRegime,
} from '../../domain/stellar/stellar-stability-regime';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  StellarEvolutionEngine,
} from './stellar-evolution-engine';

import {
  StellarRotationStabilityModel,
} from './stellar-rotation-stability-model';

describe(
  'StellarRotationStabilityModel point 15.5 V1',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const lifetimeFor =
      (
        massSolar:
          number,

        ageBillionYears:
          number,
      ): StellarLifetimeProfile => {

        const assessment =
          StellarEvolutionEngine
            .evaluate(
              generationKey,
              new StellarEvolutionInput(
                massSolar,
                1.0,
                ageBillionYears,
              ),
            );

        const mainSequenceLifetime =
          assessment
            .mainSequenceLifetimeBillionYears;

        const postMainSequenceDuration =
          assessment
            .postMainSequenceDurationBillionYears;

        if (
          mainSequenceLifetime ===
            null ||
          postMainSequenceDuration ===
            null
        ) {
          return new StellarLifetimeProfile(
            ageBillionYears,
            null,
            null,
            assessment,
          );
        }

        const terminalAge =
          mainSequenceLifetime +
          postMainSequenceDuration;

        return new StellarLifetimeProfile(
          ageBillionYears,
          terminalAge,
          Math.max(
            0,
            terminalAge -
              ageBillionYears,
          ),
          assessment,
        );
      };

    const activityFor =
      (
        activityIndex:
          number,
      ): StellarActivityProfile =>
        new StellarActivityProfile(
          true,
          activityIndex,
          StellarActivityRegime
            .fromActivityIndex(
              activityIndex,
            ),
          0.1,
          1.0e24,
          1.0e25,
        );

    const physicalFor =
      (
        massSolar:
          number,
      ): StellarPhysicalProperties =>
        new StellarPhysicalProperties(
          massSolar,
          massSolar,
          1,
          1,
          5_772,
        );

    it(
      'should cover every O/B/A/F/G/K/M main-sequence family with finite coherent periods and stability',
      () => {
        const cases =
          [
            [
              20.0,
              0.001,
              'O',
            ],
            [
              5.0,
              0.01,
              'B',
            ],
            [
              1.70,
              0.10,
              'A',
            ],
            [
              1.20,
              1.0,
              'F',
            ],
            [
              1.0,
              1.0,
              'G',
            ],
            [
              0.60,
              1.0,
              'K',
            ],
            [
              0.20,
              1.0,
              'M',
            ],
          ] as const;

        for (
          const [
            mass,
            age,
            expectedFamily,
          ]
          of cases
        ) {
          const lifetime =
            lifetimeFor(
              mass,
              age,
            );

          expect(
            lifetime
              .evolutionAssessment
              .mainSequenceClass
              ?.name,
          ).toBe(
            expectedFamily,
          );

          const profile =
            StellarRotationStabilityModel
              .evaluateV1(
                physicalFor(
                  mass,
                ),
                lifetime,
                activityFor(
                  0.30,
                ),
                0.50,
                0.50,
              );

          expect(
            profile.rotationPeriodDays!,
          ).toBeGreaterThan(
            0,
          );

          expect(
            profile.rotationRegime?.name,
          ).toBe(
            StellarRotationRegime
              .fromRotationPeriodDays(
                profile.rotationPeriodDays!,
              )
              .name,
          );

          expect(
            profile.stabilityRegime?.name,
          ).toBe(
            StellarStabilityRegime
              .fromStabilityIndex(
                profile.stabilityIndex!,
              )
              .name,
          );
        }
      },
    );

    it(
      'should cover L/T/Y brown-dwarf cooling families and preserve sub-day rotation',
      () => {
        const cases =
          [
            [
              0.05,
              0.05,
              'L',
            ],
            [
              0.05,
              2.0,
              'T',
            ],
            [
              0.05,
              12.0,
              'Y',
            ],
          ] as const;

        for (
          const [
            mass,
            age,
            expectedFamily,
          ]
          of cases
        ) {
          const lifetime =
            lifetimeFor(
              mass,
              age,
            );

          expect(
            lifetime
              .evolutionAssessment
              .brownDwarfClass
              ?.name,
          ).toBe(
            expectedFamily,
          );

          const profile =
            StellarRotationStabilityModel
              .evaluateV1(
                physicalFor(
                  mass,
                ),
                lifetime,
                activityFor(
                  0.40,
                ),
                0.50,
                0.50,
              );

          expect(
            profile.rotationPeriodDays!,
          ).toBeLessThan(
            1,
          );
        }
      },
    );

    it(
      'should distinguish RGB, AGB and supergiant rotational/stability baselines',
      () => {
        const rgb =
          StellarRotationStabilityModel
            .evaluateV1(
              physicalFor(
                1.0,
              ),
              lifetimeFor(
                1.0,
                10.5,
              ),
              activityFor(
                0.10,
              ),
              0.50,
              0.50,
            );

        const agb =
          StellarRotationStabilityModel
            .evaluateV1(
              physicalFor(
                1.0,
              ),
              lifetimeFor(
                1.0,
                11.0,
              ),
              activityFor(
                0.10,
              ),
              0.50,
              0.50,
            );

        const supergiant =
          StellarRotationStabilityModel
            .evaluateV1(
              physicalFor(
                12.0,
              ),
              lifetimeFor(
                12.0,
                0.021,
              ),
              activityFor(
                0.10,
              ),
              0.50,
              0.50,
            );

        expect(
          agb.rotationPeriodDays!,
        ).toBeGreaterThan(
          rgb.rotationPeriodDays!,
        );

        expect(
          rgb.stabilityIndex!,
        ).toBeGreaterThan(
          agb.stabilityIndex!,
        );

        expect(
          supergiant.rotationPeriodDays!,
        ).toBeGreaterThan(
          0,
        );
      },
    );

    it(
      'should reject invalid entropy draws and non-applicable activity profiles',
      () => {
        const lifetime =
          lifetimeFor(
            1.0,
            1.0,
          );

        expect(
          () =>
            StellarRotationStabilityModel
              .evaluateV1(
                physicalFor(
                  1.0,
                ),
                lifetime,
                activityFor(
                  0.20,
                ),
                1.0,
                0.50,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            StellarRotationStabilityModel
              .evaluateV1(
                physicalFor(
                  1.0,
                ),
                lifetime,
                activityFor(
                  0.20,
                ),
                0.50,
                Number.NaN,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            StellarRotationStabilityModel
              .evaluateV1(
                physicalFor(
                  1.0,
                ),
                lifetime,
                new StellarActivityProfile(
                  false,
                  null,
                  null,
                  null,
                  null,
                  null,
                ),
                0.50,
                0.50,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
