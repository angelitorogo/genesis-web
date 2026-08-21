import {
  GalacticNucleusState,
} from '../../../domain/universe/galactic-nucleus-state';

import {
  GALACTIC_NUCLEUS_LABORATORY_CASES,
  GalacticNucleusLaboratoryCaseId,
  GalacticNucleusLaboratoryFixtures,
} from './galactic-nucleus-laboratory-fixtures';

describe(
  'GalacticNucleusLaboratoryFixtures',
  () => {
    it(
      'should expose exactly the three already-implemented V1 nucleus states',
      () => {
        expect(
          GALACTIC_NUCLEUS_LABORATORY_CASES
            .map(
              candidate =>
                candidate.expectedState,
            ),
        ).toEqual([
          GalacticNucleusState
            .QUIESCENT,
          GalacticNucleusState
            .AGN,
          GalacticNucleusState
            .QUASAR,
        ]);
      },
    );

    it(
      'should preserve the frozen galaxy indices 0, 20 and 331',
      () => {
        expect(
          GALACTIC_NUCLEUS_LABORATORY_CASES
            .map(
              candidate =>
                candidate
                  .galaxyIndex,
            ),
        ).toEqual([
          0n,
          20n,
          331n,
        ]);
      },
    );

    it(
      'should regenerate each nucleus through the real GalaxyGenerator',
      () => {
        for (
          const candidate
          of GALACTIC_NUCLEUS_LABORATORY_CASES
        ) {
          const frame =
            GalacticNucleusLaboratoryFixtures
              .frame(
                candidate.id,
              );

          expect(
            frame.galaxy
              .nucleus
              ?.state,
          ).toBe(
            candidate.expectedState,
          );

          expect(
            frame.model
              .visualStructure,
          ).not.toBeNull();
        }
      },
      15_000,
    );

    it(
      'should keep AGN and QUASAR as active episodes while QUIESCENT remains inactive',
      () => {
        const quiescent =
          GalacticNucleusLaboratoryFixtures
            .frame(
              GalacticNucleusLaboratoryCaseId
                .QUIESCENT,
            );

        const agn =
          GalacticNucleusLaboratoryFixtures
            .frame(
              GalacticNucleusLaboratoryCaseId
                .AGN,
            );

        const quasar =
          GalacticNucleusLaboratoryFixtures
            .frame(
              GalacticNucleusLaboratoryCaseId
                .QUASAR,
            );

        expect(
          quiescent
            .activity
            .isActiveEpisode,
        ).toBe(false);

        expect(
          agn
            .activity
            .isActiveEpisode,
        ).toBe(true);

        expect(
          quasar
            .activity
            .isActiveEpisode,
        ).toBe(true);
      },
      15_000,
    );


    it(
      'should expose eight deterministic real QUIESCENT samples covering eight visual families',
      () => {
        const samples =
          GalacticNucleusLaboratoryFixtures
            .quiescentSamples();

        expect(
          samples,
        ).toHaveLength(
          8,
        );

        expect(
          new Set(
            samples.map(
              sample =>
                sample.family,
            ),
          ).size,
        ).toBe(
          8,
        );

        expect(
          samples[0]
            .galaxyIndex,
        ).toBe(
          0n,
        );

        for (
          const sample
          of samples
        ) {
          const frame =
            GalacticNucleusLaboratoryFixtures
              .frame(
                GalacticNucleusLaboratoryCaseId
                  .QUIESCENT,
                sample.index,
              );

          expect(
            frame.galaxy
              .index,
          ).toBe(
            sample.galaxyIndex,
          );

          expect(
            frame.galaxy
              .nucleus
              ?.state,
          ).toBe(
            GalacticNucleusState
              .QUIESCENT,
          );

          expect(
            frame.quiescentRenderModel
              ?.family,
          ).toBe(
            sample.family,
          );
        }
      },
      15_000,
    );

    it(
      'should keep dedicated quiescent rendering absent from AGN and QUASAR frames',
      () => {
        expect(
          GalacticNucleusLaboratoryFixtures
            .frame(
              GalacticNucleusLaboratoryCaseId
                .AGN,
            )
            .quiescentRenderModel,
        ).toBeNull();

        expect(
          GalacticNucleusLaboratoryFixtures
            .frame(
              GalacticNucleusLaboratoryCaseId
                .QUASAR,
            )
            .quiescentRenderModel,
        ).toBeNull();
      },
      15_000,
    );

    it(
      'should keep nuclear laboratory map models free of gameplay coverage, markers and layers',
      () => {
        for (
          const candidate
          of GALACTIC_NUCLEUS_LABORATORY_CASES
        ) {
          const model =
            GalacticNucleusLaboratoryFixtures
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
  },
);
