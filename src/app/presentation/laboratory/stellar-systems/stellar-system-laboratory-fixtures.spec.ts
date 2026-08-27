import {
  DiscoveryState,
} from '../../../domain/discovery/discovery-state';

import {
  type SystemSeed,
} from '../../../domain/seed/hierarchical-seeds';

import {
  StellarSystemMultiplicity,
} from '../../../domain/stellar/stellar-system-multiplicity';

import {
  ProceduralTargetResolver,
} from '../../../simulation/regeneration/procedural-target-resolver';

import {
  StellarSystemMultiplicitySelector,
} from '../../../simulation/stellar/stellar-system-multiplicity-selector';

import {
  ArchiveStellarSystemKnowledgeLevel,
} from '../../genesis-archive/archive-stellar-system-card';

import {
  STELLAR_SYSTEM_LABORATORY_CASES,
  StellarSystemLaboratoryCaseId,
  StellarSystemLaboratoryFamilyId,
  StellarSystemLaboratoryFixtures,
} from './stellar-system-laboratory-fixtures';

describe(
  'StellarSystemLaboratoryFixtures point 16.7',
  () => {
    it(
      'should expose exactly SINGLE, BINARY and TRIPLE without inventing new physical architectures',
      () => {
        expect(
          STELLAR_SYSTEM_LABORATORY_CASES
            .map(
              candidate =>
                candidate.id,
            ),
        ).toEqual([
          StellarSystemLaboratoryCaseId.SINGLE,
          StellarSystemLaboratoryCaseId.BINARY,
          StellarSystemLaboratoryCaseId.TRIPLE,
        ]);

        expect(
          STELLAR_SYSTEM_LABORATORY_CASES
            .map(
              candidate =>
                candidate.multiplicity,
            ),
        ).toEqual([
          StellarSystemMultiplicity.SINGLE,
          StellarSystemMultiplicity.BINARY,
          StellarSystemMultiplicity.TRIPLE,
        ]);
      },
    );

    it.each(
      STELLAR_SYSTEM_LABORATORY_CASES,
    )(
      'should expose eight deterministic A-H real fixtures for $id',
      caseDefinition => {
        const families =
          StellarSystemLaboratoryFixtures
            .families(
              caseDefinition.id,
            );

        expect(families).toHaveLength(8);

        expect(
          families.map(
            family =>
              family.id,
          ),
        ).toEqual([
          'A',
          'B',
          'C',
          'D',
          'E',
          'F',
          'G',
          'H',
        ]);

        expect(
          new Set(
            families.map(
              family =>
                family.locator.galacticObjectIndex.toString(),
            ),
          ).size,
        ).toBe(8);

        for (
          const family of families
        ) {
          const seed =
            ProceduralTargetResolver
              .resolveTargetSeed(
                StellarSystemLaboratoryFixtures
                  .generationKey(),
                family.locator,
              ) as SystemSeed;

          expect(
            seed.normalizedValue,
          ).toBe(
            family.systemSeedHex,
          );

          expect(
            StellarSystemMultiplicitySelector
              .select(
                StellarSystemLaboratoryFixtures
                  .generationKey(),
                seed,
              ),
          ).toBe(
            caseDefinition.multiplicity,
          );
        }
      },
      30_000,
    );

    it(
      'should build the four canonical knowledge stages from the production point-16.7 card assembler',
      () => {
        const frame =
          StellarSystemLaboratoryFixtures
            .frame(
              StellarSystemLaboratoryCaseId.BINARY,
              StellarSystemLaboratoryFamilyId.A,
            );

        expect(
          frame.stages.map(
            stage =>
              stage.discoveryState,
          ),
        ).toEqual([
          DiscoveryState.DETECTED,
          DiscoveryState.DISCOVERED,
          DiscoveryState.CATALOGUED,
          DiscoveryState.CONFIRMED,
        ]);

        expect(
          frame.stages.map(
            stage =>
              stage.card.knowledgeLevel,
          ),
        ).toEqual([
          ArchiveStellarSystemKnowledgeLevel.DETECTED,
          ArchiveStellarSystemKnowledgeLevel.IDENTIFIED,
          ArchiveStellarSystemKnowledgeLevel.CATALOGUED,
          ArchiveStellarSystemKnowledgeLevel.CONFIRMED,
        ]);

        expect(
          frame.stages[0]?.card.multiplicityLabel,
        ).toBeNull();

        expect(
          frame.stages[1]?.card.multiplicityLabel,
        ).toBe(
          'Binario',
        );

        expect(
          frame.stages[2]?.card.components,
        ).toHaveLength(2);

        expect(
          frame.stages[2]?.card.orbits,
        ).toHaveLength(1);

        expect(
          frame.stages[2]?.card.habitabilityFacts,
        ).toEqual([]);

        expect(
          frame.stages[3]?.card.habitabilityFacts.length,
        ).toBeGreaterThan(0);
      },
      30_000,
    );

    it(
      'should keep the selected fixture stable across repeated reads and preserve the rare TRIPLE architecture',
      () => {
        const first =
          StellarSystemLaboratoryFixtures
            .frame(
              StellarSystemLaboratoryCaseId.TRIPLE,
              StellarSystemLaboratoryFamilyId.H,
            );

        const second =
          StellarSystemLaboratoryFixtures
            .frame(
              StellarSystemLaboratoryCaseId.TRIPLE,
              StellarSystemLaboratoryFamilyId.H,
            );

        expect(second).toBe(first);
        expect(first.family.id).toBe('H');
        expect(first.stages[1]?.card.multiplicityLabel).toBe(
          'Triple',
        );
        expect(first.stages[2]?.card.components).toHaveLength(3);
        expect(first.stages[2]?.card.orbits).toHaveLength(2);
      },
      30_000,
    );
  },
);
