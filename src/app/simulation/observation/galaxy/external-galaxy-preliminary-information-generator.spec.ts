import {
  DiscoveryState,
} from '../../../domain/discovery/discovery-state';

import {
  GeneratorVersion,
} from '../../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';

import {
  GalacticNucleusState,
} from '../../../domain/universe/galactic-nucleus-state';

import {
  GalaxyType,
} from '../../../domain/universe/galaxy-type';

import {
  UniverseSeed,
} from '../../../domain/universe/universe-seed';

import {
  GalaxyGenerator,
} from '../../universe/galaxy-generator';

import {
  ExternalGalaxyMorphologyHint,
  ExternalGalaxyNuclearActivityHint,
  ExternalGalaxyScaleHint,
  ExternalGalaxyStellarPopulationHint,
} from '../../../domain/observation/galaxy/external-galaxy-preliminary-information';

import {
  ExternalGalaxyPreliminaryInformationGenerator,
} from './external-galaxy-preliminary-information-generator';

describe(
  'ExternalGalaxyPreliminaryInformationGenerator',
  () => {
    const canonicalSeed =
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      );

    const canonicalGenerationKey =
      new UniverseGenerationKey(
        canonicalSeed,
        GeneratorVersion.V1,
      );

    it(
      'should reproduce the frozen Android V1 preliminary information for external galaxy index one',
      () => {
        const information =
          ExternalGalaxyPreliminaryInformationGenerator
            .generate(
              canonicalGenerationKey,
              1n,
              DiscoveryState.DETECTED,
            );

        expect(
          information.galaxyIndex,
        ).toBe(
          1n,
        );

        expect(
          information.designationCode,
        ).toBe(
          'GEN-V1-G1-A448D6B11BAF31F30904C808DE482290',
        );

        expect(
          information.knowledgeState,
        ).toBe(
          DiscoveryState.DETECTED,
        );

        expect(
          information.morphologyHint,
        ).toBe(
          ExternalGalaxyMorphologyHint
            .DISK_LIKE,
        );

        expect(
          information.scaleHint,
        ).toBe(
          ExternalGalaxyScaleHint
            .MEDIUM,
        );

        expect(
          information.stellarPopulationHint,
        ).toBe(
          ExternalGalaxyStellarPopulationHint
            .HIGH,
        );

        expect(
          information.nuclearActivityHint,
        ).toBe(
          ExternalGalaxyNuclearActivityHint
            .NO_CLEAR_ACTIVITY,
        );
      },
    );

    it(
      'should expose no proper name or exact Ground Truth physical values',
      () => {
        const galaxy =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            1n,
          );

        const information =
          ExternalGalaxyPreliminaryInformationGenerator
            .generate(
              canonicalGenerationKey,
              1n,
              DiscoveryState.DETECTED,
            );

        expect(
          galaxy.designation.name,
        ).toBe(
          'Kelphiis',
        );

        expect(
          Object.keys(
            information,
          ).sort(),
        ).toEqual(
          [
            'designationCode',
            'galaxyIndex',
            'knowledgeState',
            'morphologyHint',
            'nuclearActivityHint',
            'scaleHint',
            'stellarPopulationHint',
          ].sort(),
        );

        const serialized =
          JSON.stringify(
            information,
            (
              _key,
              value,
            ) =>
              typeof value ===
                'bigint'
                ? value.toString()
                : value,
          );

        expect(
          serialized,
        ).not.toContain(
          'Kelphiis',
        );

        expect(
          serialized,
        ).not.toContain(
          String(
            galaxy
              .physicalProperties
              .diameterLightYears,
          ),
        );

        expect(
          serialized,
        ).not.toContain(
          galaxy
            .physicalProperties
            .stellarPopulation
            .toString(),
        );
      },
    );

    it(
      'should preserve every knowledge state from DETECTED onwards without revealing additional fields',
      () => {
        for (
          const state of
          [
            DiscoveryState.DETECTED,
            DiscoveryState.DISCOVERED,
            DiscoveryState.VISITED,
            DiscoveryState.CATALOGUED,
            DiscoveryState.CONFIRMED,
          ]
        ) {
          const information =
            ExternalGalaxyPreliminaryInformationGenerator
              .generate(
                canonicalGenerationKey,
                1n,
                state,
              );

          expect(
            information.knowledgeState,
          ).toBe(
            state,
          );

          expect(
            Object.keys(
              information,
            ),
          ).toHaveLength(
            7,
          );
        }
      },
    );

    it(
      'should reject UNKNOWN and invalid galaxy indices',
      () => {
        expect(
          () =>
            ExternalGalaxyPreliminaryInformationGenerator
              .generate(
                canonicalGenerationKey,
                1n,
                DiscoveryState.UNKNOWN,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            ExternalGalaxyPreliminaryInformationGenerator
              .generate(
                canonicalGenerationKey,
                -1n,
                DiscoveryState.DETECTED,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            ExternalGalaxyPreliminaryInformationGenerator
              .generate(
                canonicalGenerationKey,
                9_223_372_036_854_775_808n,
                DiscoveryState.DETECTED,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should collapse BARRED_SPIRAL and SPIRAL into the same DISK_LIKE preliminary morphology hint',
      () => {
        const barred =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            1n,
          );

        const spiral =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            3n,
          );

        expect(
          barred.type,
        ).toBe(
          GalaxyType.BARRED_SPIRAL,
        );

        expect(
          spiral.type,
        ).toBe(
          GalaxyType.SPIRAL,
        );

        expect(
          ExternalGalaxyPreliminaryInformationGenerator
            .generate(
              canonicalGenerationKey,
              1n,
              DiscoveryState.DETECTED,
            )
            .morphologyHint,
        ).toBe(
          ExternalGalaxyMorphologyHint
            .DISK_LIKE,
        );

        expect(
          ExternalGalaxyPreliminaryInformationGenerator
            .generate(
              canonicalGenerationKey,
              3n,
              DiscoveryState.DETECTED,
            )
            .morphologyHint,
        ).toBe(
          ExternalGalaxyMorphologyHint
            .DISK_LIKE,
        );
      },
    );

    it(
      'should preserve the complete V1 morphology mapping across canonical galaxy types',
      () => {
        const cases = [
          {
            index:
              0n,
            type:
              GalaxyType.ELLIPTICAL,
            hint:
              ExternalGalaxyMorphologyHint
                .SPHEROIDAL,
          },
          {
            index:
              1n,
            type:
              GalaxyType.BARRED_SPIRAL,
            hint:
              ExternalGalaxyMorphologyHint
                .DISK_LIKE,
          },
          {
            index:
              3n,
            type:
              GalaxyType.SPIRAL,
            hint:
              ExternalGalaxyMorphologyHint
                .DISK_LIKE,
          },
          {
            index:
              4n,
            type:
              GalaxyType.DWARF,
            hint:
              ExternalGalaxyMorphologyHint
                .DWARF_LIKE,
          },
          {
            index:
              10n,
            type:
              GalaxyType.IRREGULAR,
            hint:
              ExternalGalaxyMorphologyHint
                .IRREGULAR,
          },
        ] as const;

        for (
          const item of
          cases
        ) {
          expect(
            GalaxyGenerator
              .generate(
                canonicalGenerationKey,
                item.index,
              )
              .type,
          ).toBe(
            item.type,
          );

          expect(
            ExternalGalaxyPreliminaryInformationGenerator
              .generate(
                canonicalGenerationKey,
                item.index,
                DiscoveryState.DETECTED,
              )
              .morphologyHint,
          ).toBe(
            item.hint,
          );
        }
      },
    );

    it(
      'should project exact V1 scale and stellar-population thresholds across a deterministic galaxy sample',
      () => {
        for (
          let index =
            0n;
          index <
            512n;
          index +=
            1n
        ) {
          const galaxy =
            GalaxyGenerator.generate(
              canonicalGenerationKey,
              index,
            );

          const information =
            ExternalGalaxyPreliminaryInformationGenerator
              .generate(
                canonicalGenerationKey,
                index,
                DiscoveryState.DETECTED,
              );

          const diameter =
            galaxy
              .physicalProperties
              .diameterLightYears;

          const expectedScale =
            diameter <
              30_000.0
              ? ExternalGalaxyScaleHint.COMPACT
              : diameter <
                  100_000.0
                ? ExternalGalaxyScaleHint.MEDIUM
                : diameter <
                    180_000.0
                  ? ExternalGalaxyScaleHint.LARGE
                  : ExternalGalaxyScaleHint.EXTENDED;

          const stars =
            galaxy
              .physicalProperties
              .stellarPopulation;

          const expectedPopulation =
            stars <
              1_000_000_000n
              ? ExternalGalaxyStellarPopulationHint.LOW
              : stars <
                  50_000_000_000n
                ? ExternalGalaxyStellarPopulationHint.MODERATE
                : stars <
                    300_000_000_000n
                  ? ExternalGalaxyStellarPopulationHint.HIGH
                  : ExternalGalaxyStellarPopulationHint.VERY_HIGH;

          expect(
            information.scaleHint,
          ).toBe(
            expectedScale,
          );

          expect(
            information.stellarPopulationHint,
          ).toBe(
            expectedPopulation,
          );
        }
      },
    );

    it(
      'should expose inactive AGN and QUASAR nuclei only as preliminary candidate hints',
      () => {
        const noNucleus =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            42n,
          );

        const agn =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            20n,
          );

        const quasar =
          GalaxyGenerator.generate(
            canonicalGenerationKey,
            331n,
          );

        expect(
          noNucleus.nucleus,
        ).toBeNull();

        expect(
          agn.nucleus
            ?.state,
        ).toBe(
          GalacticNucleusState.AGN,
        );

        expect(
          quasar.nucleus
            ?.state,
        ).toBe(
          GalacticNucleusState.QUASAR,
        );

        expect(
          ExternalGalaxyPreliminaryInformationGenerator
            .generate(
              canonicalGenerationKey,
              42n,
              DiscoveryState.DETECTED,
            )
            .nuclearActivityHint,
        ).toBe(
          ExternalGalaxyNuclearActivityHint
            .NO_CLEAR_ACTIVITY,
        );

        expect(
          ExternalGalaxyPreliminaryInformationGenerator
            .generate(
              canonicalGenerationKey,
              20n,
              DiscoveryState.DETECTED,
            )
            .nuclearActivityHint,
        ).toBe(
          ExternalGalaxyNuclearActivityHint
            .ACTIVE_NUCLEUS_CANDIDATE,
        );

        expect(
          ExternalGalaxyPreliminaryInformationGenerator
            .generate(
              canonicalGenerationKey,
              331n,
              DiscoveryState.DETECTED,
            )
            .nuclearActivityHint,
        ).toBe(
          ExternalGalaxyNuclearActivityHint
            .EXTREME_NUCLEUS_CANDIDATE,
        );
      },
    );

    it(
      'should be deterministic and query-order independent for equal inputs',
      () => {
        const expected =
          ExternalGalaxyPreliminaryInformationGenerator
            .generate(
              canonicalGenerationKey,
              42n,
              DiscoveryState.DETECTED,
            );

        for (
          const index of
          [
            0n,
            1n,
            3n,
            4n,
            10n,
            20n,
            331n,
            987654321n,
          ]
        ) {
          ExternalGalaxyPreliminaryInformationGenerator
            .generate(
              canonicalGenerationKey,
              index,
              DiscoveryState.DETECTED,
            );
        }

        expect(
          ExternalGalaxyPreliminaryInformationGenerator
            .generate(
              canonicalGenerationKey,
              42n,
              DiscoveryState.DETECTED,
            ),
        ).toEqual(
          expected,
        );
      },
    );

    it(
      'should be allowed to change across UniverseSeed because the underlying galaxy Ground Truth changes',
      () => {
        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const first =
          ExternalGalaxyPreliminaryInformationGenerator
            .generate(
              canonicalGenerationKey,
              1n,
              DiscoveryState.DETECTED,
            );

        const second =
          ExternalGalaxyPreliminaryInformationGenerator
            .generate(
              otherGenerationKey,
              1n,
              DiscoveryState.DETECTED,
            );

        expect(
          second.designationCode,
        ).not.toBe(
          first.designationCode,
        );
      },
    );

    it(
      'should support signed Long maximum galaxy index and reject unsupported generator versions',
      () => {
        const maxIndex =
          9_223_372_036_854_775_807n;

        const maxInformation =
          ExternalGalaxyPreliminaryInformationGenerator
            .generate(
              canonicalGenerationKey,
              maxIndex,
              DiscoveryState.DETECTED,
            );

        expect(
          maxInformation.galaxyIndex,
        ).toBe(
          maxIndex,
        );

        const unsupportedGenerationKey =
          {
            universeSeed:
              canonicalSeed,

            generatorVersion: {
              code:
                999,
            },
          } as unknown as
            UniverseGenerationKey;

        expect(
          () =>
            ExternalGalaxyPreliminaryInformationGenerator
              .generate(
                unsupportedGenerationKey,
                1n,
                DiscoveryState.DETECTED,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
