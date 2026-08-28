import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  StellarEvolutionInput,
} from '../../domain/stellar/stellar-evolution-input';

import {
  StellarEvolutionState,
} from '../../domain/stellar/stellar-evolution-state';

import {
  StellarLifetimeProfile,
} from '../../domain/stellar/stellar-lifetime-profile';

import {
  StellarPhysicalProperties,
} from '../../domain/stellar/stellar-physical-properties';

import {
  StellarYouthStage,
} from '../../domain/stellar/stellar-youth-stage';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  StellarEvolutionEngine,
} from './stellar-evolution-engine';

import {
  StellarYouthProfileGenerator,
} from './stellar-youth-profile-generator';

describe(
  'StellarYouthProfileGenerator point 17.1',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should resolve a solar-mass component through protostar, pre-main-sequence, young-star and mature boundaries',
      () => {
        const physical =
          physicalFor(
            1.0,
          );

        const proto =
          StellarYouthProfileGenerator
            .generateOrNull(
              generationKey,
              physical,
              lifetimeFor(
                1.0,
                0.00010,
              ),
            );

        const preMainSequence =
          StellarYouthProfileGenerator
            .generateOrNull(
              generationKey,
              physical,
              lifetimeFor(
                1.0,
                0.010,
              ),
            );

        const young =
          StellarYouthProfileGenerator
            .generateOrNull(
              generationKey,
              physical,
              lifetimeFor(
                1.0,
                0.050,
              ),
            );

        const mature =
          StellarYouthProfileGenerator
            .generateOrNull(
              generationKey,
              physical,
              lifetimeFor(
                1.0,
                0.200,
              ),
            );

        expect(
          proto?.stage,
        ).toBe(
          StellarYouthStage.PROTOSTAR,
        );

        expect(
          proto?.protostellarUpperAgeMillionYears,
        ).toBeCloseTo(
          0.45,
          12,
        );

        expect(
          preMainSequence?.stage,
        ).toBe(
          StellarYouthStage.PRE_MAIN_SEQUENCE,
        );

        expect(
          preMainSequence?.preMainSequenceUpperAgeMillionYears,
        ).toBeCloseTo(
          30,
          12,
        );

        expect(
          young?.stage,
        ).toBe(
          StellarYouthStage.YOUNG_STAR,
        );

        expect(
          mature,
        ).toBeNull();
      },
    );

    it(
      'should make lower-mass stars contract for longer while high-mass stars reach the young-star branch sooner',
      () => {
        const lowMass =
          StellarYouthProfileGenerator
            .generateOrNull(
              generationKey,
              physicalFor(
                0.5,
              ),
              lifetimeFor(
                0.5,
                0.100,
              ),
            );

        const highMass =
          StellarYouthProfileGenerator
            .generateOrNull(
              generationKey,
              physicalFor(
                5.0,
              ),
              lifetimeFor(
                5.0,
                0.002,
              ),
            );

        expect(
          lowMass?.stage,
        ).toBe(
          StellarYouthStage.PRE_MAIN_SEQUENCE,
        );

        expect(
          lowMass?.preMainSequenceUpperAgeMillionYears,
        ).toBeGreaterThan(
          100,
        );

        expect(
          highMass?.stage,
        ).toBe(
          StellarYouthStage.YOUNG_STAR,
        );

        expect(
          highMass?.preMainSequenceUpperAgeMillionYears,
        ).toBeLessThan(
          2,
        );
      },
    );

    it(
      'should keep early formation modifiers smooth and converging toward the frozen point-15 reference baseline',
      () => {
        const physical =
          physicalFor(
            1.0,
          );

        const proto =
          StellarYouthProfileGenerator
            .generateOrNull(
              generationKey,
              physical,
              lifetimeFor(
                1.0,
                0.00010,
              ),
            )!;

        const preMainSequence =
          StellarYouthProfileGenerator
            .generateOrNull(
              generationKey,
              physical,
              lifetimeFor(
                1.0,
                0.010,
              ),
            )!;

        const young =
          StellarYouthProfileGenerator
            .generateOrNull(
              generationKey,
              physical,
              lifetimeFor(
                1.0,
                0.090,
              ),
            )!;

        expect(
          proto.referenceRadiusMultiplier,
        ).toBeGreaterThan(
          preMainSequence.referenceRadiusMultiplier,
        );

        expect(
          preMainSequence.referenceRadiusMultiplier,
        ).toBeGreaterThan(
          young.referenceRadiusMultiplier,
        );

        expect(
          proto.referenceLuminosityMultiplier,
        ).toBeGreaterThan(
          preMainSequence.referenceLuminosityMultiplier,
        );

        expect(
          preMainSequence.referenceLuminosityMultiplier,
        ).toBeGreaterThanOrEqual(
          young.referenceLuminosityMultiplier,
        );

        expect(
          proto.accretionActivityIndex,
        ).toBeGreaterThan(
          preMainSequence.accretionActivityIndex,
        );

        expect(
          young.accretionActivityIndex,
        ).toBe(
          0,
        );
      },
    );

    it(
      'should model young brown dwarfs explicitly without pretending they have a main-sequence arrival age',
      () => {
        const youngBrownDwarf =
          StellarYouthProfileGenerator
            .generateOrNull(
              generationKey,
              physicalFor(
                0.05,
              ),
              lifetimeFor(
                0.05,
                0.020,
              ),
            );

        const oldBrownDwarf =
          StellarYouthProfileGenerator
            .generateOrNull(
              generationKey,
              physicalFor(
                0.05,
              ),
              lifetimeFor(
                0.05,
                0.200,
              ),
            );

        expect(
          youngBrownDwarf?.stage,
        ).toBe(
          StellarYouthStage.YOUNG_BROWN_DWARF,
        );

        expect(
          youngBrownDwarf?.preMainSequenceUpperAgeMillionYears,
        ).toBeNull();

        expect(
          oldBrownDwarf,
        ).toBeNull();
      },
    );

    it(
      'should never attach a youth overlay to an already evolved giant or compact remnant',
      () => {
        const evolvedCases = [
          [
            5.0,
            0.25,
          ],
          [
            20.0,
            0.05,
          ],
          [
            40.0,
            0.02,
          ],
        ] as const;

        for (
          const [
            mass,
            ageBillionYears,
          ]
          of evolvedCases
        ) {
          const lifetime =
            lifetimeFor(
              mass,
              ageBillionYears,
            );

          if (
            lifetime
              .evolutionAssessment
              .evolutionState ===
            StellarEvolutionState.MAIN_SEQUENCE
          ) {
            continue;
          }

          expect(
            StellarYouthProfileGenerator
              .generateOrNull(
                generationKey,
                physicalFor(
                  mass,
                ),
                lifetime,
              ),
          ).toBeNull();
        }
      },
    );

    it(
      'should be pure/deterministic and reject physical/lifetime profiles from different component masses',
      () => {
        const physical =
          physicalFor(
            1.0,
          );

        const lifetime =
          lifetimeFor(
            1.0,
            0.010,
          );

        expect(
          StellarYouthProfileGenerator
            .generateOrNull(
              generationKey,
              physical,
              lifetime,
            ),
        ).toEqual(
          StellarYouthProfileGenerator
            .generateOrNull(
              generationKey,
              physical,
              lifetime,
            ),
        );

        expect(
          () =>
            StellarYouthProfileGenerator
              .generateOrNull(
                generationKey,
                physicalFor(
                  0.8,
                ),
                lifetime,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function physicalFor(
  initialMassSolar:
    number,
): StellarPhysicalProperties {

  return new StellarPhysicalProperties(
    initialMassSolar,
    initialMassSolar,
    Math.max(
      0.08,
      initialMassSolar **
        0.75,
    ),
    Math.max(
      1e-5,
      initialMassSolar **
        3.5,
    ),
    5_000,
  );
}

function lifetimeFor(
  initialMassSolar:
    number,

  ageBillionYears:
    number,
): StellarLifetimeProfile {

  const generationKey =
    new UniverseGenerationKey(
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      ),
      GeneratorVersion.V1,
    );

  const assessment =
    StellarEvolutionEngine
      .evaluate(
        generationKey,
        new StellarEvolutionInput(
          initialMassSolar,
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
}
