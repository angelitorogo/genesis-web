import {
  GeneratorVersion,
} from '../../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';

import {
  GalacticObjectScientificSubject,
} from '../../../domain/galactic-object/galactic-object-scientific-subject';

import {
  NebulaType,
} from '../../../domain/galactic-object/nebula-type';

import {
  StarFormationActivity,
} from '../../../domain/galactic-object/star-formation-activity';

import {
  SupernovaRemnantMorphology,
} from '../../../domain/galactic-object/supernova-remnant-morphology';

import {
  UniverseSeed,
} from '../../../domain/universe/universe-seed';

import {
  HiiRegionGenerator,
} from '../../../simulation/galactic-object/hii-region-generator';

import {
  NebulaGenerator,
} from '../../../simulation/galactic-object/nebula-generator';

import {
  SupernovaRemnantGenerator,
} from '../../../simulation/galactic-object/supernova-remnant-generator';

import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
} from '../../genesis-archive/archive-galactic-object-card';

import {
  GalacticObjectLaboratoryCaseId,
  GalacticObjectLaboratoryGroup,
  GALACTIC_OBJECT_LABORATORY_CASES,
  GALACTIC_OBJECT_LABORATORY_STATES,
  GalacticObjectLaboratoryFixtures,
} from './galactic-object-laboratory-fixtures';

describe(
  'GalacticObjectLaboratoryFixtures',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should expose all fourteen currently implemented persistent-object visual variants',
      () => {
        expect(
          GALACTIC_OBJECT_LABORATORY_CASES,
        ).toHaveLength(
          14,
        );

        expect(
          new Set(
            GALACTIC_OBJECT_LABORATORY_CASES
              .map(
                candidate =>
                  candidate.id,
              ),
          ).size,
        ).toBe(
          14,
        );
      },
      30_000,
    );

    it(
      'should expose the complete 4 nebula + 4 HII + 2 cluster + 3 remnant + 1 reserved-extreme inventory',
      () => {
        const count =
          (
            group:
              GalacticObjectLaboratoryGroup,
          ) =>
            GALACTIC_OBJECT_LABORATORY_CASES
              .filter(
                candidate =>
                  candidate.group ===
                  group,
              )
              .length;

        expect(
          count(
            GalacticObjectLaboratoryGroup
              .NEBULAE,
          ),
        ).toBe(
          4,
        );

        expect(
          count(
            GalacticObjectLaboratoryGroup
              .HII,
          ),
        ).toBe(
          4,
        );

        expect(
          count(
            GalacticObjectLaboratoryGroup
              .CLUSTERS,
          ),
        ).toBe(
          2,
        );

        expect(
          count(
            GalacticObjectLaboratoryGroup
              .SUPERNOVA_REMNANTS,
          ),
        ).toBe(
          3,
        );

        expect(
          count(
            GalacticObjectLaboratoryGroup
              .EXTREME,
          ),
        ).toBe(
          1,
        );
      },
      30_000,
    );

    it(
      'should use real non-HII representatives for all four physical NebulaType values',
      () => {
        const nebulaCases =
          GALACTIC_OBJECT_LABORATORY_CASES
            .filter(
              candidate =>
                candidate.group ===
                GalacticObjectLaboratoryGroup
                  .NEBULAE,
            );

        expect(
          new Set(
            nebulaCases.map(
              candidate =>
                candidate
                  .expectedNebulaType,
            ),
          ),
        ).toEqual(
          new Set(
            Object.values(
              NebulaType,
            ),
          ),
        );

        for (
          const candidate
          of nebulaCases
        ) {
          expect(
            candidate.expectedSubject,
          ).toBe(
            GalacticObjectScientificSubject
              .NEBULA,
          );

          expect(
            NebulaGenerator
              .generate(
                generationKey,
                candidate.locator,
              )
              .nebulaType,
          ).toBe(
            candidate
              .expectedNebulaType,
          );

          expect(
            HiiRegionGenerator
              .isHiiRegionLocator(
                generationKey,
                candidate.locator,
              ),
          ).toBe(
            false,
          );
        }
      },
    );

    it(
      'should preserve the four distinct HII star-formation activity variants',
      () => {
        const hiiCases =
          GALACTIC_OBJECT_LABORATORY_CASES
            .filter(
              candidate =>
                candidate.group ===
                GalacticObjectLaboratoryGroup
                  .HII,
            );

        expect(
          new Set(
            hiiCases.map(
              candidate =>
                candidate
                  .expectedHiiActivity,
            ),
          ),
        ).toEqual(
          new Set(
            Object.values(
              StarFormationActivity,
            ),
          ),
        );

        for (
          const candidate
          of hiiCases
        ) {
          expect(
            candidate.expectedSubject,
          ).toBe(
            GalacticObjectScientificSubject
              .HII_REGION,
          );

          expect(
            HiiRegionGenerator
              .generate(
                generationKey,
                candidate.locator,
              )
              .starFormationProfile
              .activity,
          ).toBe(
            candidate
              .expectedHiiActivity,
          );
        }
      },
      30_000,
    );

    it(
      'should preserve all three real persistent supernova-remnant morphologies',
      () => {
        const remnantCases =
          GALACTIC_OBJECT_LABORATORY_CASES
            .filter(
              candidate =>
                candidate.group ===
                GalacticObjectLaboratoryGroup
                  .SUPERNOVA_REMNANTS,
            );

        expect(
          new Set(
            remnantCases.map(
              candidate =>
                candidate
                  .expectedRemnantMorphology,
            ),
          ),
        ).toEqual(
          new Set(
            Object.values(
              SupernovaRemnantMorphology,
            ),
          ),
        );

        for (
          const candidate
          of remnantCases
        ) {
          expect(
            SupernovaRemnantGenerator
              .generate(
                generationKey,
                candidate.locator,
              )
              .morphology,
          ).toBe(
            candidate
              .expectedRemnantMorphology,
          );
        }
      },
      30_000,
    );

    it(
      'should compare only the four distinct point-12.8 knowledge projections',
      () => {
        expect(
          GALACTIC_OBJECT_LABORATORY_STATES
            .map(
              candidate =>
                candidate.shortLabel,
            ),
        ).toEqual([
          'DETECTED',
          'DISCOVERED',
          'CATALOGUED',
          'CONFIRMED',
        ]);
      },
    );

    it(
      'should never leak a physical subject or numeric facts while any case is only DETECTED',
      () => {
        for (
          const candidate
          of GALACTIC_OBJECT_LABORATORY_CASES
        ) {
          const detected =
            GalacticObjectLaboratoryFixtures
              .frames(
                candidate.id,
              )[
                0
              ];

          expect(
            detected
              .card
              .scientificSubject,
          ).toBeNull();

          expect(
            detected
              .card
              .facts,
          ).toHaveLength(
            0,
          );

          expect(
            detected
              .card
              .knowledgeLevel,
          ).toBe(
            ArchiveGalacticObjectKnowledgeLevel
              .SIGNAL,
          );

          expect(
            detected
              .card
              .render
              .variant,
          ).toBeNull();
        }
      },
      30_000,
    );

    it(
      'should keep open and globular clusters generic before discovery and distinct afterwards',
      () => {
        const open =
          GalacticObjectLaboratoryFixtures
            .frames(
              GalacticObjectLaboratoryCaseId
                .OPEN_CLUSTER,
            );

        const globular =
          GalacticObjectLaboratoryFixtures
            .frames(
              GalacticObjectLaboratoryCaseId
                .GLOBULAR_CLUSTER,
            );

        expect(
          open[
            0
          ].card.render.kind,
        ).toBe(
          ArchiveGalacticObjectRenderKind
            .STAR_CLUSTER,
        );

        expect(
          globular[
            0
          ].card.render.kind,
        ).toBe(
          ArchiveGalacticObjectRenderKind
            .STAR_CLUSTER,
        );

        expect(
          open[
            1
          ].card.render.kind,
        ).toBe(
          ArchiveGalacticObjectRenderKind
            .OPEN_CLUSTER,
        );

        expect(
          globular[
            1
          ].card.render.kind,
        ).toBe(
          ArchiveGalacticObjectRenderKind
            .GLOBULAR_CLUSTER,
        );
      },
    );

    it(
      'should preserve the reserved EXTREME_OBJECT complement as unresolved at every displayed state',
      () => {
        const frames =
          GalacticObjectLaboratoryFixtures
            .frames(
              GalacticObjectLaboratoryCaseId
                .RESERVED_EXTREME,
            );

        for (
          const frame
          of frames
        ) {
          expect(
            frame
              .card
              .scientificSubject,
          ).toBeNull();

          expect(
            frame
              .card
              .facts,
          ).toHaveLength(
            0,
          );

          expect(
            frame
              .card
              .render
              .kind,
          ).toBe(
            ArchiveGalacticObjectRenderKind
              .EXTREME_OBJECT,
          );
        }
      },
    );

    it(
      'should keep one identical render seed for the same emission nebula across all four knowledge projections',
      () => {
        const frames =
          GalacticObjectLaboratoryFixtures
            .frames(
              GalacticObjectLaboratoryCaseId
                .NEBULA_EMISSION,
            );

        expect(
          new Set(
            frames.map(
              frame =>
                frame.card
                  .render
                  .seed,
            ),
          ).size,
        ).toBe(
          1,
        );
      },
      30_000,
    );

    it(
      'should expose eight deterministic real non-HII emission-nebula diversity samples with O17 preserved as A',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .emissionNebulaSamples();

        expect(
          samples,
        ).toHaveLength(
          8,
        );

        expect(
          samples[
            0
          ].label,
        ).toBe(
          'A',
        );

        expect(
          samples[
            0
          ].locator
            .galacticObjectIndex,
        ).toBe(
          17n,
        );

        expect(
          new Set(
            samples.map(
              sample =>
                sample.locator
                  .galacticObjectIndex
                  .toString(),
            ),
          ).size,
        ).toBe(
          8,
        );

        for (
          const sample
          of samples
        ) {
          expect(
            NebulaGenerator
              .generate(
                generationKey,
                sample.locator,
              )
              .nebulaType,
          ).toBe(
            NebulaType
              .EMISSION,
          );

          expect(
            HiiRegionGenerator
              .isHiiRegionLocator(
                generationKey,
                sample.locator,
              ),
          ).toBe(
            false,
          );
        }
      },
      30_000,
    );

    it(
      'should give every emission-nebula diversity sample its own stable render seed while preserving that seed across four knowledge levels',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .emissionNebulaSamples();

        const confirmedSeeds:
          string[] =
          [];

        for (
          const sample
          of samples
        ) {
          const frames =
            GalacticObjectLaboratoryFixtures
              .frames(
                GalacticObjectLaboratoryCaseId
                  .NEBULA_EMISSION,
                sample.index,
              );

          const seeds =
            frames.map(
              frame =>
                frame.card
                  .render
                  .seed,
            );

          expect(
            new Set(
              seeds,
            ).size,
          ).toBe(
            1,
          );

          confirmedSeeds.push(
            seeds[
              3
            ],
          );
        }

        expect(
          new Set(
            confirmedSeeds,
          ).size,
        ).toBe(
          8,
        );
      },
      30_000,
    );

  },
);
