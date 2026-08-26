import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  StellarBlackHoleFormationChannel,
} from '../../domain/stellar/stellar-black-hole-formation-channel';

import {
  StellarBrownDwarfClass,
} from '../../domain/stellar/stellar-brown-dwarf-class';

import {
  StellarEvolutionInput,
} from '../../domain/stellar/stellar-evolution-input';

import {
  StellarEvolutionState,
} from '../../domain/stellar/stellar-evolution-state';

import {
  StellarMainSequenceClass,
} from '../../domain/stellar/stellar-main-sequence-class';

import {
  StellarNeutronStarFormationChannel,
} from '../../domain/stellar/stellar-neutron-star-formation-channel';

import {
  StellarPostMainSequenceStage,
} from '../../domain/stellar/stellar-post-main-sequence-stage';

import {
  StellarWhiteDwarfComposition,
} from '../../domain/stellar/stellar-white-dwarf-composition';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  StellarEvolutionEngine,
} from './stellar-evolution-engine';

describe(
  'StellarEvolutionEngine',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should classify the complete point-14.2 main-sequence family from initial mass while the progenitor remains hydrogen burning',
      () => {
        const cases = [
          [
            0.10,
            StellarMainSequenceClass.M,
          ],
          [
            0.60,
            StellarMainSequenceClass.K,
          ],
          [
            1.00,
            StellarMainSequenceClass.G,
          ],
          [
            1.20,
            StellarMainSequenceClass.F,
          ],
          [
            1.60,
            StellarMainSequenceClass.A,
          ],
          [
            5.00,
            StellarMainSequenceClass.B,
          ],
          [
            20.0,
            StellarMainSequenceClass.O,
          ],
        ] as const;

        for (
          const [
            initialMassSolar,
            expectedClass,
          ] of cases
        ) {
          const assessment =
            StellarEvolutionEngine
              .evaluate(
                generationKey,
                new StellarEvolutionInput(
                  initialMassSolar,
                  1.0,
                  0,
                ),
              );

          expect(
            assessment.evolutionState,
          ).toBe(
            StellarEvolutionState.MAIN_SEQUENCE,
          );

          expect(
            assessment.mainSequenceClass,
          ).toBe(
            expectedClass,
          );
        }
      },
    );

    it(
      'should keep brown dwarfs substellar while allowing age-dependent L to T to Y cooling families',
      () => {
        const young =
          StellarEvolutionEngine
            .evaluate(
              generationKey,
              new StellarEvolutionInput(
                0.05,
                1.0,
                0.05,
              ),
            );

        const mature =
          StellarEvolutionEngine
            .evaluate(
              generationKey,
              new StellarEvolutionInput(
                0.05,
                1.0,
                2.0,
              ),
            );

        const old =
          StellarEvolutionEngine
            .evaluate(
              generationKey,
              new StellarEvolutionInput(
                0.05,
                1.0,
                12.0,
              ),
            );

        expect(
          young.evolutionState,
        ).toBe(
          StellarEvolutionState.BROWN_DWARF,
        );

        expect(
          young.brownDwarfClass,
        ).toBe(
          StellarBrownDwarfClass.L,
        );

        expect(
          mature.brownDwarfClass,
        ).toBe(
          StellarBrownDwarfClass.T,
        );

        expect(
          old.brownDwarfClass,
        ).toBe(
          StellarBrownDwarfClass.Y,
        );

        expect(
          old.mainSequenceLifetimeBillionYears,
        ).toBeNull();
      },
    );

    it(
      'should evolve a solar-mass progenitor through main sequence, RGB, AGB and a carbon-oxygen white dwarf',
      () => {
        const mainSequence =
          StellarEvolutionEngine
            .evaluate(
              generationKey,
              new StellarEvolutionInput(
                1.0,
                1.0,
                9.9,
              ),
            );

        const redGiant =
          StellarEvolutionEngine
            .evaluate(
              generationKey,
              new StellarEvolutionInput(
                1.0,
                1.0,
                10.5,
              ),
            );

        const asymptoticGiant =
          StellarEvolutionEngine
            .evaluate(
              generationKey,
              new StellarEvolutionInput(
                1.0,
                1.0,
                11.0,
              ),
            );

        const whiteDwarf =
          StellarEvolutionEngine
            .evaluate(
              generationKey,
              new StellarEvolutionInput(
                1.0,
                1.0,
                11.2,
              ),
            );

        expect(
          mainSequence.mainSequenceLifetimeBillionYears,
        ).toBe(
          10.0,
        );

        expect(
          mainSequence.evolutionState,
        ).toBe(
          StellarEvolutionState.MAIN_SEQUENCE,
        );

        expect(
          redGiant.evolutionState,
        ).toBe(
          StellarEvolutionState.GIANT,
        );

        expect(
          redGiant.postMainSequenceStage,
        ).toBe(
          StellarPostMainSequenceStage.RED_GIANT_BRANCH,
        );

        expect(
          asymptoticGiant.postMainSequenceStage,
        ).toBe(
          StellarPostMainSequenceStage.ASYMPTOTIC_GIANT_BRANCH,
        );

        expect(
          whiteDwarf.evolutionState,
        ).toBe(
          StellarEvolutionState.WHITE_DWARF,
        );

        expect(
          whiteDwarf.whiteDwarfComposition,
        ).toBe(
          StellarWhiteDwarfComposition.CARBON_OXYGEN_CORE,
        );
      },
    );

    it(
      'should produce an oxygen-neon white dwarf near the upper isolated white-dwarf progenitor boundary',
      () => {
        const assessment =
          StellarEvolutionEngine
            .evaluate(
              generationKey,
              new StellarEvolutionInput(
                7.5,
                1.0,
                0.2,
              ),
            );

        expect(
          assessment.evolutionState,
        ).toBe(
          StellarEvolutionState.WHITE_DWARF,
        );

        expect(
          assessment.whiteDwarfComposition,
        ).toBe(
          StellarWhiteDwarfComposition.OXYGEN_NEON_CORE,
        );
      },
    );

    it(
      'should evolve massive progenitors through SUPERGIANT before a neutron-star or black-hole remnant',
      () => {
        const supergiant =
          StellarEvolutionEngine
            .evaluate(
              generationKey,
              new StellarEvolutionInput(
                12.0,
                1.0,
                0.021,
              ),
            );

        const neutronStar =
          StellarEvolutionEngine
            .evaluate(
              generationKey,
              new StellarEvolutionInput(
                12.0,
                1.0,
                0.030,
              ),
            );

        expect(
          supergiant.evolutionState,
        ).toBe(
          StellarEvolutionState.SUPERGIANT,
        );

        expect(
          supergiant.postMainSequenceStage,
        ).toBe(
          StellarPostMainSequenceStage.SUPERGIANT,
        );

        expect(
          neutronStar.evolutionState,
        ).toBe(
          StellarEvolutionState.NEUTRON_STAR,
        );

        expect(
          neutronStar.neutronStarFormationChannel,
        ).toBe(
          StellarNeutronStarFormationChannel.IRON_CORE_COLLAPSE,
        );
      },
    );

    it(
      'should reserve electron-capture collapse for the narrow low-mass neutron-star progenitor band',
      () => {
        const assessment =
          StellarEvolutionEngine
            .evaluate(
              generationKey,
              new StellarEvolutionInput(
                8.5,
                1.0,
                0.10,
              ),
            );

        expect(
          assessment.evolutionState,
        ).toBe(
          StellarEvolutionState.NEUTRON_STAR,
        );

        expect(
          assessment.neutronStarFormationChannel,
        ).toBe(
          StellarNeutronStarFormationChannel.ELECTRON_CAPTURE_COLLAPSE,
        );
      },
    );

    it(
      'should let metallicity alter lifetime and the neutron-star versus black-hole outcome at fixed initial mass',
      () => {
        const lowMetallicityMainSequence =
          StellarEvolutionEngine
            .evaluate(
              generationKey,
              new StellarEvolutionInput(
                1.0,
                0.10,
                0,
              ),
            );

        const highMetallicityMainSequence =
          StellarEvolutionEngine
            .evaluate(
              generationKey,
              new StellarEvolutionInput(
                1.0,
                2.0,
                0,
              ),
            );

        expect(
          lowMetallicityMainSequence
            .mainSequenceLifetimeBillionYears,
        ).toBeLessThan(
          highMetallicityMainSequence
            .mainSequenceLifetimeBillionYears ??
            0,
        );

        const lowMetallicityRemnant =
          StellarEvolutionEngine
            .evaluate(
              generationKey,
              new StellarEvolutionInput(
                22.0,
                0.10,
                0.10,
              ),
            );

        const highMetallicityRemnant =
          StellarEvolutionEngine
            .evaluate(
              generationKey,
              new StellarEvolutionInput(
                22.0,
                2.0,
                0.10,
              ),
            );

        expect(
          lowMetallicityRemnant.evolutionState,
        ).toBe(
          StellarEvolutionState.STELLAR_BLACK_HOLE,
        );

        expect(
          lowMetallicityRemnant.blackHoleFormationChannel,
        ).toBe(
          StellarBlackHoleFormationChannel.FALLBACK_CORE_COLLAPSE,
        );

        expect(
          highMetallicityRemnant.evolutionState,
        ).toBe(
          StellarEvolutionState.NEUTRON_STAR,
        );
      },
    );

    it(
      'should select direct collapse for sufficiently massive black-hole progenitors',
      () => {
        const assessment =
          StellarEvolutionEngine
            .evaluate(
              generationKey,
              new StellarEvolutionInput(
                60.0,
                0.10,
                0.05,
              ),
            );

        expect(
          assessment.evolutionState,
        ).toBe(
          StellarEvolutionState.STELLAR_BLACK_HOLE,
        );

        expect(
          assessment.blackHoleFormationChannel,
        ).toBe(
          StellarBlackHoleFormationChannel.DIRECT_COLLAPSE,
        );
      },
    );

    it(
      'should be exactly deterministic for the same versioned physical input and consume no seed entropy',
      () => {
        const input =
          new StellarEvolutionInput(
            3.25,
            0.65,
            0.42,
          );

        const first =
          StellarEvolutionEngine
            .evaluate(
              generationKey,
              input,
            );

        const second =
          StellarEvolutionEngine
            .evaluate(
              new UniverseGenerationKey(
                UniverseSeed.parse(
                  'FFFF-FFFF-FFFF-FFFF-FFFF-FFFF-FFFF-FFFF',
                ),
                GeneratorVersion.V1,
              ),
              input,
            );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );
  },
);
