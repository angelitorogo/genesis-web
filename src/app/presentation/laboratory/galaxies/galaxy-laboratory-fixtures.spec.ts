import {
  DiscoveryState,
} from '../../../domain/discovery/discovery-state';

import {
  GalaxyType,
} from '../../../domain/universe/galaxy-type';

import {
  GalaxyLaboratoryCaseId,
  GALAXY_LABORATORY_CASES,
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
      'should keep the frozen representative galaxy indices mapped to their expected real types',
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
          const candidate
          of GALAXY_LABORATORY_CASES
        ) {
          expect(
            GalaxyLaboratoryFixtures
              .frame(
                candidate.id,
              )
              .galaxy
              .type,
          ).toBe(
            expected.get(
              candidate.id,
            ),
          );
        }
      },
      15_000,
    );

    it(
      'should expose each representative only through a real DISCOVERED detailed map model',
      () => {
        for (
          const candidate
          of GALAXY_LABORATORY_CASES
        ) {
          const frame =
            GalaxyLaboratoryFixtures
              .frame(
                candidate.id,
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
      15_000,
    );

    it(
      'should keep the laboratory free of exploration coverage, markers and environmental gameplay layers',
      () => {
        for (
          const candidate
          of GALAXY_LABORATORY_CASES
        ) {
          const model =
            GalaxyLaboratoryFixtures
              .frame(
                candidate.id,
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
        }
      },
      15_000,
    );

    it(
      'should remain deterministic for repeated reads of the same laboratory case',
      () => {
        const first =
          GalaxyLaboratoryFixtures
            .frame(
              GalaxyLaboratoryCaseId
                .IRREGULAR,
            );

        const second =
          GalaxyLaboratoryFixtures
            .frame(
              GalaxyLaboratoryCaseId
                .IRREGULAR,
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
