import {
  DiscoveryState,
} from '../../../domain/discovery/discovery-state';

import {
  GalaxyType,
} from '../../../domain/universe/galaxy-type';

import {
  GalaxyLaboratoryCaseId,
  GalaxyLaboratoryFamilyId,
  GALAXY_LABORATORY_CASES,
  GALAXY_LABORATORY_FAMILY_IDS,
  GalaxyLaboratoryFixtures,
} from './galaxy-laboratory-fixtures';

describe(
  'GalaxyLaboratoryFixtures',
  () => {
    it(
      'should expose exactly the five canonical V1 galaxy morphologies',
      () => {
        expect(
          GALAXY_LABORATORY_CASES
            .map(
              candidate =>
                candidate.id,
            ),
        ).toEqual([
          GalaxyLaboratoryCaseId
            .SPIRAL,
          GalaxyLaboratoryCaseId
            .BARRED_SPIRAL,
          GalaxyLaboratoryCaseId
            .ELLIPTICAL,
          GalaxyLaboratoryCaseId
            .DWARF,
          GalaxyLaboratoryCaseId
            .IRREGULAR,
        ]);
      },
    );

    it(
      'should expose eight deterministic A-H families for every morphology',
      () => {
        for (
          const candidate of
          GALAXY_LABORATORY_CASES
        ) {
          const families =
            GalaxyLaboratoryFixtures
              .families(
                candidate.id,
              );

          expect(
            families,
          ).toHaveLength(
            8,
          );

          expect(
            families.map(
              family =>
                family.id,
            ),
          ).toEqual(
            GALAXY_LABORATORY_FAMILY_IDS,
          );

          expect(
            new Set(
              families.map(
                family =>
                  family.galaxyIndex.toString(),
              ),
            ).size,
          ).toBe(
            8,
          );
        }
      },
      30_000,
    );

    it(
      'should keep family A on the historical canonical representatives',
      () => {
        for (
          const candidate of
          GALAXY_LABORATORY_CASES
        ) {
          expect(
            GalaxyLaboratoryFixtures
              .families(
                candidate.id,
              )[0]
              .galaxyIndex,
          ).toBe(
            candidate.galaxyIndex,
          );
        }
      },
      30_000,
    );

    it(
      'should keep every family mapped to the requested real morphology without forcing nucleus presence',
      () => {
        const expected =
          new Map([
            [
              GalaxyLaboratoryCaseId
                .SPIRAL,
              GalaxyType.SPIRAL,
            ],
            [
              GalaxyLaboratoryCaseId
                .BARRED_SPIRAL,
              GalaxyType.BARRED_SPIRAL,
            ],
            [
              GalaxyLaboratoryCaseId
                .ELLIPTICAL,
              GalaxyType.ELLIPTICAL,
            ],
            [
              GalaxyLaboratoryCaseId
                .DWARF,
              GalaxyType.DWARF,
            ],
            [
              GalaxyLaboratoryCaseId
                .IRREGULAR,
              GalaxyType.IRREGULAR,
            ],
          ] as const);

        for (
          const candidate of
          GALAXY_LABORATORY_CASES
        ) {
          for (
            const family of
            GalaxyLaboratoryFixtures
              .families(
                candidate.id,
              )
          ) {
            const frame =
              GalaxyLaboratoryFixtures
                .frame(
                  candidate.id,
                  family.id,
                );

            expect(
              frame.galaxy.type,
            ).toBe(
              expected.get(
                candidate.id,
              ),
            );
          }
        }
      },
      30_000,
    );

    it(
      'should expose SPIRAL A-H with real 3..8-arm structural variety',
      () => {
        const armCounts =
          new Set<number>();

        for (
          const family of
          GalaxyLaboratoryFixtures
            .families(
              GalaxyLaboratoryCaseId.SPIRAL,
            )
        ) {
          const frame =
            GalaxyLaboratoryFixtures
              .frame(
                GalaxyLaboratoryCaseId.SPIRAL,
                family.id,
              );

          const armCount =
            frame.model
              .visualStructure
              ?.arms
              .length ??
            0;

          expect(
            armCount,
          ).toBeGreaterThanOrEqual(
            3,
          );

          expect(
            armCount,
          ).toBeLessThanOrEqual(
            8,
          );

          armCounts.add(
            armCount,
          );
        }

        expect(
          armCounts.size,
        ).toBeGreaterThanOrEqual(
          6,
        );
      },
      30_000,
    );

    it(
      'should expose each family only through a real DISCOVERED detailed map model',
      () => {
        for (
          const candidate of
          GALAXY_LABORATORY_CASES
        ) {
          const frame =
            GalaxyLaboratoryFixtures
              .frame(
                candidate.id,
                GalaxyLaboratoryFamilyId.H,
              );

          expect(
            frame.model
              .knowledgeState,
          ).toBe(
            DiscoveryState
              .DISCOVERED,
          );

          expect(
            frame.model
              .visualStructure,
          ).not.toBeNull();

          expect(
            frame.model
              .galaxyType,
          ).toBe(
            frame.galaxy
              .type,
          );
        }
      },
      30_000,
    );

    it(
      'should keep the laboratory free of exploration coverage, markers and environmental gameplay layers',
      () => {
        const model =
          GalaxyLaboratoryFixtures
            .frame(
              GalaxyLaboratoryCaseId.SPIRAL,
              GalaxyLaboratoryFamilyId.D,
            )
            .model;

        expect(
          model.explorationCoverage,
        ).toBeNull();

        expect(
          model.discoveryMarkers,
        ).toBeNull();

        expect(
          model.environmentalLayers,
        ).toBeNull();
      },
      30_000,
    );

    it(
      'should remain deterministic for repeated reads of the same morphology and family',
      () => {
        const first =
          GalaxyLaboratoryFixtures
            .frame(
              GalaxyLaboratoryCaseId.SPIRAL,
              GalaxyLaboratoryFamilyId.F,
            );

        const second =
          GalaxyLaboratoryFixtures
            .frame(
              GalaxyLaboratoryCaseId.SPIRAL,
              GalaxyLaboratoryFamilyId.F,
            );

        expect(
          second.galaxy,
        ).toEqual(
          first.galaxy,
        );

        expect(
          second.model
            .visualStructure,
        ).toEqual(
          first.model
            .visualStructure,
        );
      },
    );
  },
);
