import {
  GalacticNucleusState,
} from '../../../domain/universe/galactic-nucleus-state';

import {
  ExtremeType,
} from '../../../domain/galactic-object/extreme-object-type';

import {
  blackHoleLaboratoryModel,
} from './black-hole-laboratory-render-model';

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


          expect(
            frame.galaxy
              .nucleus
              ?.supermassiveBlackHole,
          ).not.toBeNull();

          expect(
            frame.blackHoleCoreRenderModel
              ?.massSolar,
          ).toBe(
            frame.galaxy
              .nucleus
              ?.supermassiveBlackHole
              ?.massSolarMasses,
          );
        }
      },
      15_000,
    );



    it(
      'should expose eight deterministic real AGN samples covering eight visual families',
      () => {
        const samples =
          GalacticNucleusLaboratoryFixtures
            .agnSamples();

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
          20n,
        );

        for (
          const sample
          of samples
        ) {
          const frame =
            GalacticNucleusLaboratoryFixtures
              .frame(
                GalacticNucleusLaboratoryCaseId
                  .AGN,
                0,
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
              .AGN,
          );

          expect(
            frame.agnRenderModel
              ?.family,
          ).toBe(
            sample.family,
          );

          expect(
            frame.agnRenderModel
              ?.blackHoleMassSolarMasses,
          ).toBe(
            frame.galaxy
              .nucleus
              ?.supermassiveBlackHole
              ?.massSolarMasses,
          );
        }
      },
      15_000,
    );

    it(
      'should expose eight deterministic real QUASAR samples covering eight visual families',
      () => {
        const samples =
          GalacticNucleusLaboratoryFixtures
            .quasarSamples();

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
          331n,
        );

        for (
          const sample
          of samples
        ) {
          const frame =
            GalacticNucleusLaboratoryFixtures
              .frame(
                GalacticNucleusLaboratoryCaseId
                  .QUASAR,
                0,
                0,
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
              .QUASAR,
          );

          expect(
            frame.quasarRenderModel
              ?.family,
          ).toBe(
            sample.family,
          );

          expect(
            frame.quasarRenderModel
              ?.blackHoleMassSolarMasses,
          ).toBe(
            frame.galaxy
              .nucleus
              ?.supermassiveBlackHole
              ?.massSolarMasses,
          );
        }
      },
      30_000,
    );

    it(
      'should keep dedicated quiescent rendering absent from AGN and QUASAR frames',
      () => {
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
          agn.quiescentRenderModel,
        ).toBeNull();

        expect(
          agn.agnRenderModel,
        ).not.toBeNull();

        expect(
          quasar.quiescentRenderModel,
        ).toBeNull();

        expect(
          quasar.agnRenderModel,
        ).toBeNull();

        expect(
          quasar.quasarRenderModel,
        ).not.toBeNull();

        expect(
          agn.quasarRenderModel,
        ).toBeNull();
      },
      15_000,
    );

    it(
      'should reuse the canonical 28.2F.3 SMBH core across quiescent, AGN and QUASAR regimes',
      () => {
        const quiescent = GalacticNucleusLaboratoryFixtures.frame(
          GalacticNucleusLaboratoryCaseId.QUIESCENT,
        );
        const agn = GalacticNucleusLaboratoryFixtures.frame(
          GalacticNucleusLaboratoryCaseId.AGN,
        );
        const quasar = GalacticNucleusLaboratoryFixtures.frame(
          GalacticNucleusLaboratoryCaseId.QUASAR,
        );

        expect(quiescent.blackHoleCoreRenderModel?.type).toBe('SMBH');
        expect(agn.blackHoleCoreRenderModel?.type).toBe('SMBH');
        expect(quasar.blackHoleCoreRenderModel?.type).toBe('SMBH');

        expect(quiescent.blackHoleCoreRenderModel?.diskBrightness ?? 99)
          .toBeLessThan(agn.blackHoleCoreRenderModel?.diskBrightness ?? 0);

        const expectedAgnCore = blackHoleLaboratoryModel(
          ExtremeType.SMBH,
          agn.agnRenderModel?.familyIndex ?? 0,
        );
        const expectedQuasarCore = blackHoleLaboratoryModel(
          ExtremeType.SMBH,
          quasar.quasarRenderModel?.familyIndex ?? 0,
        );

        expect(agn.blackHoleCoreRenderModel?.diskBrightness)
          .toBe(expectedAgnCore.diskBrightness);
        expect(agn.blackHoleCoreRenderModel?.diskThickness)
          .toBe(expectedAgnCore.diskThickness);
        expect(agn.blackHoleCoreRenderModel?.lensingStrength)
          .toBe(expectedAgnCore.lensingStrength);

        expect(quasar.blackHoleCoreRenderModel?.diskBrightness)
          .toBe(expectedQuasarCore.diskBrightness);
        expect(quasar.blackHoleCoreRenderModel?.diskThickness)
          .toBe(expectedQuasarCore.diskThickness);
        expect(quasar.blackHoleCoreRenderModel?.lensingStrength)
          .toBe(expectedQuasarCore.lensingStrength);

        expect(quasar.quasarRenderModel?.accretionBrightness ?? 0)
          .toBeGreaterThan(0);

        expect(quasar.quasarRenderModel?.coronaStrength ?? 0)
          .toBeGreaterThan(0);
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
