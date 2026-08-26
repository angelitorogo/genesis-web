import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  SystemLocator,
} from '../generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  UniverseSeed,
} from '../universe/universe-seed';

import {
  Star,
} from './star';

import {
  StellarBlackHoleFormationChannel,
} from './stellar-black-hole-formation-channel';

import {
  StellarBrownDwarfClass,
} from './stellar-brown-dwarf-class';

import {
  StellarEvolutionState,
} from './stellar-evolution-state';

import {
  StellarMainSequenceClass,
} from './stellar-main-sequence-class';

import {
  StellarNeutronStarFormationChannel,
} from './stellar-neutron-star-formation-channel';

import {
  StellarPostMainSequenceStage,
} from './stellar-post-main-sequence-stage';

import {
  StellarWhiteDwarfComposition,
} from './stellar-white-dwarf-composition';

describe(
  'Star',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const locator =
      new SystemLocator(
        7n,
        -42n,
        3n,
      );

    it(
      'should materialize point-14.2 main-sequence identity without inventing point-15 physical or spectral output',
      () => {
        const star =
          new Star(
            generationKey,
            locator,
            StellarEvolutionState.MAIN_SEQUENCE,
            StellarMainSequenceClass.G,
          );

        expect(
          star.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          star.locator,
        ).toBe(
          locator,
        );

        expect(
          star.evolutionState,
        ).toBe(
          StellarEvolutionState.MAIN_SEQUENCE,
        );

        expect(
          star.mainSequenceClass,
        ).toBe(
          StellarMainSequenceClass.G,
        );

        expect(
          star.brownDwarfClass,
        ).toBeNull();

        expect(
          star.postMainSequenceStage,
        ).toBeNull();

        expect(
          star.whiteDwarfComposition,
        ).toBeNull();

        expect(
          star.neutronStarFormationChannel,
        ).toBeNull();

        expect(
          star.blackHoleFormationChannel,
        ).toBeNull();

        expect(
          Object.keys(
            star,
          ),
        ).toEqual([
          'generationKey',
          'locator',
          'evolutionState',
          'mainSequenceClass',
          'brownDwarfClass',
          'postMainSequenceStage',
          'whiteDwarfComposition',
          'neutronStarFormationChannel',
          'blackHoleFormationChannel',
        ]);

        for (
          const point15Property
          of [
            'massSolar',
            'radiusSolar',
            'luminositySolar',
            'effectiveTemperatureKelvin',
            'spectralType',
            'color',
            'ageBillionYears',
          ]
        ) {
          expect(
            point15Property in
              star,
          ).toBe(
            false,
          );
        }
      },
    );

    it(
      'should materialize point-14.3 brown-dwarf identity without pretending it is main sequence or evolved giant',
      () => {
        for (
          const brownDwarfClass
          of StellarBrownDwarfClass.values
        ) {
          const star =
            new Star(
              generationKey,
              locator,
              StellarEvolutionState.BROWN_DWARF,
              null,
              brownDwarfClass,
            );

          expect(
            star.evolutionState,
          ).toBe(
            StellarEvolutionState.BROWN_DWARF,
          );

          expect(
            star.mainSequenceClass,
          ).toBeNull();

          expect(
            star.brownDwarfClass,
          ).toBe(
            brownDwarfClass,
          );

          expect(
            star.postMainSequenceStage,
          ).toBeNull();

          expect(
            star.whiteDwarfComposition,
          ).toBeNull();

          expect(
            star.neutronStarFormationChannel,
          ).toBeNull();
        }
      },
    );

    it(
      'should model both point-14.4 giant branches explicitly under the GIANT evolutionary state',
      () => {
        for (
          const stage
          of [
            StellarPostMainSequenceStage.RED_GIANT_BRANCH,
            StellarPostMainSequenceStage.ASYMPTOTIC_GIANT_BRANCH,
          ]
        ) {
          const star =
            new Star(
              generationKey,
              locator,
              StellarEvolutionState.GIANT,
              null,
              null,
              stage,
            );

          expect(
            star.evolutionState,
          ).toBe(
            StellarEvolutionState.GIANT,
          );

          expect(
            star.mainSequenceClass,
          ).toBeNull();

          expect(
            star.brownDwarfClass,
          ).toBeNull();

          expect(
            star.postMainSequenceStage,
          ).toBe(
            stage,
          );

          expect(
            star.whiteDwarfComposition,
          ).toBeNull();

          expect(
            star.neutronStarFormationChannel,
          ).toBeNull();
        }
      },
    );

    it(
      'should model point-14.4 supergiants as the distinct massive post-main-sequence branch',
      () => {
        const star =
          new Star(
            generationKey,
            locator,
            StellarEvolutionState.SUPERGIANT,
            null,
            null,
            StellarPostMainSequenceStage.SUPERGIANT,
          );

        expect(
          star.evolutionState,
        ).toBe(
          StellarEvolutionState.SUPERGIANT,
        );

        expect(
          star.postMainSequenceStage,
        ).toBe(
          StellarPostMainSequenceStage.SUPERGIANT,
        );

        expect(
          star.mainSequenceClass,
        ).toBeNull();

        expect(
          star.brownDwarfClass,
        ).toBeNull();

        expect(
          star.whiteDwarfComposition,
        ).toBeNull();

        expect(
          star.neutronStarFormationChannel,
        ).toBeNull();
      },
    );

    it(
      'should materialize point-14.5 white dwarfs with an explicit coarse core composition',
      () => {
        for (
          const composition
          of StellarWhiteDwarfComposition.values
        ) {
          const star =
            new Star(
              generationKey,
              locator,
              StellarEvolutionState.WHITE_DWARF,
              null,
              null,
              null,
              composition,
            );

          expect(
            star.evolutionState,
          ).toBe(
            StellarEvolutionState.WHITE_DWARF,
          );

          expect(
            star.whiteDwarfComposition,
          ).toBe(
            composition,
          );

          expect(
            star.mainSequenceClass,
          ).toBeNull();

          expect(
            star.brownDwarfClass,
          ).toBeNull();

          expect(
            star.postMainSequenceStage,
          ).toBeNull();

          expect(
            star.neutronStarFormationChannel,
          ).toBeNull();
        }
      },
    );

    it(
      'should derive its address directly from the existing SystemLocator hierarchy',
      () => {
        const star =
          new Star(
            generationKey,
            locator,
            StellarEvolutionState.WHITE_DWARF,
            null,
            null,
            null,
            StellarWhiteDwarfComposition.CARBON_OXYGEN_CORE,
          );

        expect(
          star.neutronStarFormationChannel,
        ).toBeNull();

        expect(
          star.galaxyIndex,
        ).toBe(
          7n,
        );

        expect(
          star.sectorKey,
        ).toBe(
          -42n,
        );

        expect(
          star.galacticObjectIndex,
        ).toBe(
          3n,
        );
      },
    );

    it(
      'should support all seven O/B/A/F/G/K/M classes only for MAIN_SEQUENCE stars',
      () => {
        for (
          const mainSequenceClass
          of StellarMainSequenceClass.values
        ) {
          const star =
            new Star(
              generationKey,
              locator,
              StellarEvolutionState.MAIN_SEQUENCE,
              mainSequenceClass,
            );

          expect(
            star.mainSequenceClass,
          ).toBe(
            mainSequenceClass,
          );

          expect(
            star.brownDwarfClass,
          ).toBeNull();

          expect(
            star.postMainSequenceStage,
          ).toBeNull();

          expect(
            star.whiteDwarfComposition,
          ).toBeNull();

          expect(
            star.neutronStarFormationChannel,
          ).toBeNull();
        }
      },
    );

    it(
      'should materialize point-14.6 neutron stars as compact remnants with an explicit formation channel',
      () => {
        for (
          const formationChannel
          of StellarNeutronStarFormationChannel.values
        ) {
          const star =
            new Star(
              generationKey,
              locator,
              StellarEvolutionState.NEUTRON_STAR,
              null,
              null,
              null,
              null,
              formationChannel,
            );

          expect(
            star.evolutionState,
          ).toBe(
            StellarEvolutionState.NEUTRON_STAR,
          );

          expect(
            star.neutronStarFormationChannel,
          ).toBe(
            formationChannel,
          );

          expect(
            star.mainSequenceClass,
          ).toBeNull();

          expect(
            star.brownDwarfClass,
          ).toBeNull();

          expect(
            star.postMainSequenceStage,
          ).toBeNull();

          expect(
            star.whiteDwarfComposition,
          ).toBeNull();

          for (
            const laterPhysicalProperty
            of [
              'spinPeriodSeconds',
              'magneticFieldTesla',
              'isPulsar',
              'isMagnetar',
            ]
          ) {
            expect(
              laterPhysicalProperty in
                star,
            ).toBe(
              false,
            );
          }
        }
      },
    );

    it(
      'should materialize point-14.7 stellar black holes as compact remnants with an explicit isolated-star formation channel',
      () => {
        for (
          const formationChannel
          of StellarBlackHoleFormationChannel.values
        ) {
          const star =
            new Star(
              generationKey,
              locator,
              StellarEvolutionState.STELLAR_BLACK_HOLE,
              null,
              null,
              null,
              null,
              null,
              formationChannel,
            );

          expect(
            star.evolutionState,
          ).toBe(
            StellarEvolutionState.STELLAR_BLACK_HOLE,
          );

          expect(
            star.blackHoleFormationChannel,
          ).toBe(
            formationChannel,
          );

          expect(
            star.mainSequenceClass,
          ).toBeNull();

          expect(
            star.brownDwarfClass,
          ).toBeNull();

          expect(
            star.postMainSequenceStage,
          ).toBeNull();

          expect(
            star.whiteDwarfComposition,
          ).toBeNull();

          expect(
            star.neutronStarFormationChannel,
          ).toBeNull();

          for (
            const laterPhysicalProperty
            of [
              'massSolar',
              'eventHorizonRadiusKm',
              'spin',
              'isAccreting',
              'accretionDisk',
              'jetPower',
            ]
          ) {
            expect(
              laterPhysicalProperty in
                star,
            ).toBe(
              false,
            );
          }

          expect(
            'starIndex' in
              star,
          ).toBe(
            false,
          );
        }
      },
    );

    it(
      'should reject missing or misplaced main-sequence classification',
      () => {
        expect(
          () =>
            new Star(
              generationKey,
              locator,
              StellarEvolutionState.MAIN_SEQUENCE,
              null,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new Star(
              generationKey,
              locator,
              StellarEvolutionState.WHITE_DWARF,
              StellarMainSequenceClass.K,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a brown dwarf without L/T/Y family or any misplaced brown-dwarf family',
      () => {
        expect(
          () =>
            new Star(
              generationKey,
              locator,
              StellarEvolutionState.BROWN_DWARF,
              null,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new Star(
              generationKey,
              locator,
              StellarEvolutionState.MAIN_SEQUENCE,
              StellarMainSequenceClass.M,
              StellarBrownDwarfClass.L,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new Star(
              generationKey,
              locator,
              StellarEvolutionState.WHITE_DWARF,
              null,
              StellarBrownDwarfClass.Y,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );


    it(
      'should require a point-14.5 composition only for WHITE_DWARF remnants',
      () => {
        expect(
          () =>
            new Star(
              generationKey,
              locator,
              StellarEvolutionState.WHITE_DWARF,
              null,
            ),
        ).toThrow(
          RangeError,
        );

        for (
          const evolutionState
          of [
            StellarEvolutionState.MAIN_SEQUENCE,
            StellarEvolutionState.BROWN_DWARF,
            StellarEvolutionState.GIANT,
            StellarEvolutionState.SUPERGIANT,
            StellarEvolutionState.NEUTRON_STAR,
            StellarEvolutionState.STELLAR_BLACK_HOLE,
          ]
        ) {
          const mainSequenceClass =
            evolutionState.name ===
              StellarEvolutionState.MAIN_SEQUENCE.name
              ? StellarMainSequenceClass.G
              : null;

          const brownDwarfClass =
            evolutionState.name ===
              StellarEvolutionState.BROWN_DWARF.name
              ? StellarBrownDwarfClass.T
              : null;

          const postMainSequenceStage =
            evolutionState.name ===
              StellarEvolutionState.GIANT.name
              ? StellarPostMainSequenceStage.RED_GIANT_BRANCH
              : evolutionState.name ===
                  StellarEvolutionState.SUPERGIANT.name
                ? StellarPostMainSequenceStage.SUPERGIANT
                : null;

          expect(
            () =>
              new Star(
                generationKey,
                locator,
                evolutionState,
                mainSequenceClass,
                brownDwarfClass,
                postMainSequenceStage,
                StellarWhiteDwarfComposition.CARBON_OXYGEN_CORE,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );

    it(
      'should require a point-14.6 formation channel only for NEUTRON_STAR remnants',
      () => {
        expect(
          () =>
            new Star(
              generationKey,
              locator,
              StellarEvolutionState.NEUTRON_STAR,
              null,
            ),
        ).toThrow(
          RangeError,
        );

        for (
          const evolutionState
          of [
            StellarEvolutionState.MAIN_SEQUENCE,
            StellarEvolutionState.BROWN_DWARF,
            StellarEvolutionState.GIANT,
            StellarEvolutionState.SUPERGIANT,
            StellarEvolutionState.WHITE_DWARF,
            StellarEvolutionState.STELLAR_BLACK_HOLE,
          ]
        ) {
          const mainSequenceClass =
            evolutionState.name ===
              StellarEvolutionState.MAIN_SEQUENCE.name
              ? StellarMainSequenceClass.G
              : null;

          const brownDwarfClass =
            evolutionState.name ===
              StellarEvolutionState.BROWN_DWARF.name
              ? StellarBrownDwarfClass.T
              : null;

          const postMainSequenceStage =
            evolutionState.name ===
              StellarEvolutionState.GIANT.name
              ? StellarPostMainSequenceStage.RED_GIANT_BRANCH
              : evolutionState.name ===
                  StellarEvolutionState.SUPERGIANT.name
                ? StellarPostMainSequenceStage.SUPERGIANT
                : null;

          const whiteDwarfComposition =
            evolutionState.name ===
              StellarEvolutionState.WHITE_DWARF.name
              ? StellarWhiteDwarfComposition.CARBON_OXYGEN_CORE
              : null;

          expect(
            () =>
              new Star(
                generationKey,
                locator,
                evolutionState,
                mainSequenceClass,
                brownDwarfClass,
                postMainSequenceStage,
                whiteDwarfComposition,
                StellarNeutronStarFormationChannel.IRON_CORE_COLLAPSE,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );

    it(
      'should require a point-14.7 formation channel only for STELLAR_BLACK_HOLE remnants',
      () => {
        expect(
          () =>
            new Star(
              generationKey,
              locator,
              StellarEvolutionState.STELLAR_BLACK_HOLE,
              null,
            ),
        ).toThrow(
          RangeError,
        );

        for (
          const evolutionState
          of [
            StellarEvolutionState.MAIN_SEQUENCE,
            StellarEvolutionState.BROWN_DWARF,
            StellarEvolutionState.GIANT,
            StellarEvolutionState.SUPERGIANT,
            StellarEvolutionState.WHITE_DWARF,
            StellarEvolutionState.NEUTRON_STAR,
          ]
        ) {
          const mainSequenceClass =
            evolutionState.name ===
              StellarEvolutionState.MAIN_SEQUENCE.name
              ? StellarMainSequenceClass.G
              : null;

          const brownDwarfClass =
            evolutionState.name ===
              StellarEvolutionState.BROWN_DWARF.name
              ? StellarBrownDwarfClass.T
              : null;

          const postMainSequenceStage =
            evolutionState.name ===
              StellarEvolutionState.GIANT.name
              ? StellarPostMainSequenceStage.RED_GIANT_BRANCH
              : evolutionState.name ===
                  StellarEvolutionState.SUPERGIANT.name
                ? StellarPostMainSequenceStage.SUPERGIANT
                : null;

          const whiteDwarfComposition =
            evolutionState.name ===
              StellarEvolutionState.WHITE_DWARF.name
              ? StellarWhiteDwarfComposition.CARBON_OXYGEN_CORE
              : null;

          const neutronStarFormationChannel =
            evolutionState.name ===
              StellarEvolutionState.NEUTRON_STAR.name
              ? StellarNeutronStarFormationChannel.IRON_CORE_COLLAPSE
              : null;

          expect(
            () =>
              new Star(
                generationKey,
                locator,
                evolutionState,
                mainSequenceClass,
                brownDwarfClass,
                postMainSequenceStage,
                whiteDwarfComposition,
                neutronStarFormationChannel,
                StellarBlackHoleFormationChannel.DIRECT_COLLAPSE,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );

    it(
      'should require a compatible point-14.4 stage for every GIANT or SUPERGIANT star',
      () => {
        expect(
          () =>
            new Star(
              generationKey,
              locator,
              StellarEvolutionState.GIANT,
              null,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new Star(
              generationKey,
              locator,
              StellarEvolutionState.SUPERGIANT,
              null,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new Star(
              generationKey,
              locator,
              StellarEvolutionState.GIANT,
              null,
              null,
              StellarPostMainSequenceStage.SUPERGIANT,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new Star(
              generationKey,
              locator,
              StellarEvolutionState.SUPERGIANT,
              null,
              null,
              StellarPostMainSequenceStage.RED_GIANT_BRANCH,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject post-main-sequence stages on unevolved or compact-remnant states',
      () => {
        for (
          const evolutionState
          of [
            StellarEvolutionState.MAIN_SEQUENCE,
            StellarEvolutionState.BROWN_DWARF,
            StellarEvolutionState.WHITE_DWARF,
            StellarEvolutionState.NEUTRON_STAR,
            StellarEvolutionState.STELLAR_BLACK_HOLE,
          ]
        ) {
          const mainSequenceClass =
            evolutionState.name ===
              StellarEvolutionState.MAIN_SEQUENCE.name
              ? StellarMainSequenceClass.G
              : null;

          const brownDwarfClass =
            evolutionState.name ===
              StellarEvolutionState.BROWN_DWARF.name
              ? StellarBrownDwarfClass.T
              : null;

          expect(
            () =>
              new Star(
                generationKey,
                locator,
                evolutionState,
                mainSequenceClass,
                brownDwarfClass,
                StellarPostMainSequenceStage.RED_GIANT_BRANCH,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );
  },
);
