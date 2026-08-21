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
  OpenClusterGenerator,
} from '../../../simulation/galactic-object/open-cluster-generator';

import {
  GlobularClusterGenerator,
} from '../../../simulation/galactic-object/globular-cluster-generator';

import {
  NebulaGenerator,
} from '../../../simulation/galactic-object/nebula-generator';

import {
  SupernovaRemnantGenerator,
} from '../../../simulation/galactic-object/supernova-remnant-generator';

import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  ArchiveGalacticObjectRenderProfile,
} from '../../genesis-archive/archive-galactic-object-card';

import {
  HiiRegionLowRenderModelBuilder,
} from '../../genesis-archive/hii-region-low-render-model';

import {
  HiiRegionModerateRenderModelBuilder,
} from '../../genesis-archive/hii-region-moderate-render-model';

import {
  HiiRegionHighRenderModelBuilder,
} from '../../genesis-archive/hii-region-high-render-model';

import {
  HiiRegionIntenseRenderModelBuilder,
} from '../../genesis-archive/hii-region-intense-render-model';

import {
  OpenClusterRenderModelBuilder,
} from '../../genesis-archive/open-cluster-render-model';

import {
  GlobularClusterRenderModelBuilder,
} from '../../genesis-archive/globular-cluster-render-model';

import {
  SupernovaRemnantRenderModelBuilder,
} from '../../genesis-archive/supernova-remnant-render-model';

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
      'should expose eight deterministic SHELL samples covering all eight visual families while preserving one object across knowledge levels',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .supernovaRemnantShellSamples();

        expect(
          samples.map(
            sample =>
              sample.label,
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

        const visualFamilies =
          new Set<string>();

        for (
          const sample
          of samples
        ) {
          expect(
            SupernovaRemnantGenerator
              .resolveMorphology(
                generationKey,
                sample.locator,
              ),
          ).toBe(
            SupernovaRemnantMorphology
              .SHELL,
          );

          const frames =
            GalacticObjectLaboratoryFixtures
              .frames(
                GalacticObjectLaboratoryCaseId
                  .SNR_SHELL,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                sample.index,
              );

          const models =
            frames.map(
              frame =>
                SupernovaRemnantRenderModelBuilder
                  .build(
                    frame.card.render,
                  ),
            );

          visualFamilies.add(
            models[0].morphologyFamily,
          );

          expect(
            new Set(
              models.map(
                model =>
                  JSON.stringify({
                    structureSeedX:
                      model.structureSeedX,
                    structureSeedY:
                      model.structureSeedY,
                    morphologyFamily:
                      model.morphologyFamily,
                    morphologyIndex:
                      model.morphologyIndex,
                    paletteFamily:
                      model.paletteFamily,
                    paletteIndex:
                      model.paletteIndex,
                    orientationRadians:
                      model.orientationRadians,
                    shellRadius:
                      model.shellRadius,
                    shellThickness:
                      model.shellThickness,
                  }),
              ),
            ).size,
          ).toBe(
            1,
          );

          expect(
            frames[0].card.render.kind,
          ).toBe(
            ArchiveGalacticObjectRenderKind
              .EXTREME_OBJECT,
          );

          expect(
            frames[0].card.render.variant,
          ).toBeNull();

          expect(
            frames[0].card.render.renderProfile,
          ).toBe(
            ArchiveGalacticObjectRenderProfile
              .SUPERNOVA_REMNANT_SHELL,
          );

          expect(
            frames.slice(1).map(
              frame =>
                frame.card.render.seed,
            ),
          ).toEqual([
            frames[0].card.render.seed,
            frames[0].card.render.seed,
            frames[0].card.render.seed,
          ]);
        }

        expect(
          visualFamilies,
        ).toEqual(
          new Set([
            'FRACTURED_SHELL',
            'FILAMENT_RING',
            'BILOBED_SHELL',
            'KNOTTY_SHELL',
            'WISPY_ARC',
            'BUBBLE_SHELL',
            'OFFSET_SHELL',
            'SHOCK_COMPLEX',
          ]),
        );
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

    it(
      'should expose eight deterministic real reflection-nebula samples with O8 preserved as A',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .reflectionNebulaSamples();

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
          8n,
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
              .isNebulaLocator(
                generationKey,
                sample.locator,
              ),
          ).toBe(
            true,
          );

          expect(
            NebulaGenerator
              .generate(
                generationKey,
                sample.locator,
              )
              .nebulaType,
          ).toBe(
            NebulaType
              .REFLECTION,
          );
        }
      },
      30_000,
    );

    it(
      'should give every reflection-nebula sample a unique stable render seed across four knowledge levels',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .reflectionNebulaSamples();

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
                  .NEBULA_REFLECTION,
                0,
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

    it(
      'should expose eight deterministic real dark-nebula samples with O16 preserved as A',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .darkNebulaSamples();

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
          16n,
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
              .isNebulaLocator(
                generationKey,
                sample.locator,
              ),
          ).toBe(
            true,
          );

          expect(
            NebulaGenerator
              .generate(
                generationKey,
                sample.locator,
              )
              .nebulaType,
          ).toBe(
            NebulaType
              .DARK,
          );
        }
      },
      30_000,
    );

    it(
      'should give every dark-nebula sample a unique stable render seed across four knowledge levels',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .darkNebulaSamples();

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
                  .NEBULA_DARK,
                0,
                0,
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

    it(
      'should expose eight deterministic real planetary-nebula samples with O10 preserved as A',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .planetaryNebulaSamples();

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
          10n,
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
              .isNebulaLocator(
                generationKey,
                sample.locator,
              ),
          ).toBe(
            true,
          );

          expect(
            NebulaGenerator
              .generate(
                generationKey,
                sample.locator,
              )
              .nebulaType,
          ).toBe(
            NebulaType
              .PLANETARY,
          );
        }
      },
      30_000,
    );

    it(
      'should give every planetary-nebula sample a unique stable render seed across four knowledge levels',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .planetaryNebulaSamples();

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
                  .NEBULA_PLANETARY,
                0,
                0,
                0,
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

    it(
      'should expose eight deterministic real LOW H II samples while preserving the canonical LOW representative as A',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .hiiLowSamples();

        const canonicalLow =
          GALACTIC_OBJECT_LABORATORY_CASES
            .find(
              candidate =>
                candidate.id ===
                GalacticObjectLaboratoryCaseId
                  .HII_LOW,
            );

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
          ].locator,
        ).toEqual(
          canonicalLow
            ?.locator,
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
            HiiRegionGenerator
              .resolveActivity(
                generationKey,
                sample.locator,
              ),
          ).toBe(
            StarFormationActivity
              .LOW,
          );
        }
      },
      30_000,
    );

    it(
      'should expose the full eight-family V2.2 morphology set across the LOW H II laboratory samples',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .hiiLowSamples();

        const morphologies =
          samples.map(
            sample => {
              const confirmed =
                GalacticObjectLaboratoryFixtures
                  .frames(
                    GalacticObjectLaboratoryCaseId
                      .HII_LOW,
                    0,
                    0,
                    0,
                    0,
                    sample.index,
                  )[
                    3
                  ];

              return HiiRegionLowRenderModelBuilder
                .build(
                  confirmed
                    .card
                    .render,
                )
                .morphologyFamily;
            },
          );

        expect(
          new Set(
            morphologies,
          ),
        ).toEqual(
          new Set([
            'BUBBLE',
            'BLISTER',
            'CLUMPY',
            'COMPACT',
            'PILLARS',
            'FILAMENTARY',
            'DOUBLE',
            'BROKEN_SHELL',
          ]),
        );
      },
      30_000,
    );

    it(
      'should keep one unique LOW H II render seed and HII_LOW_VOLUME profile across the four knowledge projections of every sample',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .hiiLowSamples();

        const allSeeds:
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
                  .HII_LOW,
                0,
                0,
                0,
                0,
                sample.index,
              );

          const seeds =
            frames.map(
              frame =>
                frame.card.render.seed,
            );

          expect(
            new Set(
              seeds,
            ).size,
          ).toBe(
            1,
          );

          for (
            const frame
            of frames
          ) {
            expect(
              frame.card.render.renderProfile,
            ).toBe(
              ArchiveGalacticObjectRenderProfile
                .HII_LOW_VOLUME,
            );
          }

          expect(
            frames[
              0
            ].card.render.variant,
          ).toBeNull();

          expect(
            frames[
              1
            ].card.render.variant,
          ).toBeNull();

          expect(
            frames[
              2
            ].card.render.variant,
          ).toBeNull();

          expect(
            frames[
              3
            ].card.render.variant,
          ).toBe(
            StarFormationActivity
              .LOW,
          );

          allSeeds.push(
            seeds[
              0
            ],
          );
        }

        expect(
          new Set(
            allSeeds,
          ).size,
        ).toBe(
          8,
        );
      },
      30_000,
    );

    it(
      'should expose eight deterministic real MODERATE H II samples while preserving the canonical MODERATE representative as A',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .hiiModerateSamples();

        const canonicalModerate =
          GALACTIC_OBJECT_LABORATORY_CASES
            .find(
              candidate =>
                candidate.id ===
                GalacticObjectLaboratoryCaseId
                  .HII_MODERATE,
            );

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
          ].locator,
        ).toEqual(
          canonicalModerate
            ?.locator,
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
            HiiRegionGenerator
              .resolveActivity(
                generationKey,
                sample.locator,
              ),
          ).toBe(
            StarFormationActivity
              .MODERATE,
          );
        }
      },
      30_000,
    );

    it(
      'should expose all eight renderer morphology families across the MODERATE H II laboratory samples',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .hiiModerateSamples();

        const morphologies =
          samples.map(
            sample => {
              const confirmed =
                GalacticObjectLaboratoryFixtures
                  .frames(
                    GalacticObjectLaboratoryCaseId
                      .HII_MODERATE,
                    0,
                    0,
                    0,
                    0,
                    0,
                    sample.index,
                  )[
                    3
                  ];

              return HiiRegionModerateRenderModelBuilder
                .build(
                  confirmed
                    .card
                    .render,
                )
                .morphologyFamily;
            },
          );

        expect(
          new Set(
            morphologies,
          ),
        ).toEqual(
          new Set([
            'BUBBLE',
            'BLISTER',
            'CLUMPY',
            'COMPACT',
            'PILLARS',
            'FILAMENTARY',
            'DOUBLE',
            'BROKEN_SHELL',
          ]),
        );
      },
      30_000,
    );

    it(
      'should keep one unique MODERATE H II render seed and HII_MODERATE_VOLUME profile across the four knowledge projections of every sample',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .hiiModerateSamples();

        const allSeeds:
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
                  .HII_MODERATE,
                0,
                0,
                0,
                0,
                0,
                sample.index,
              );

          const seeds =
            frames.map(
              frame =>
                frame.card.render.seed,
            );

          expect(
            new Set(
              seeds,
            ).size,
          ).toBe(
            1,
          );

          for (
            const frame
            of frames
          ) {
            expect(
              frame.card.render.renderProfile,
            ).toBe(
              ArchiveGalacticObjectRenderProfile
                .HII_MODERATE_VOLUME,
            );
          }

          expect(
            frames[
              0
            ].card.render.variant,
          ).toBeNull();

          expect(
            frames[
              1
            ].card.render.variant,
          ).toBeNull();

          expect(
            frames[
              2
            ].card.render.variant,
          ).toBeNull();

          expect(
            frames[
              3
            ].card.render.variant,
          ).toBe(
            StarFormationActivity
              .MODERATE,
          );

          allSeeds.push(
            seeds[
              0
            ],
          );
        }

        expect(
          new Set(
            allSeeds,
          ).size,
        ).toBe(
          8,
        );
      },
      30_000,
    );

    it(
      'should expose eight deterministic real HIGH H II samples while preserving the canonical HIGH representative as A',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .hiiHighSamples();

        const canonicalHigh =
          GALACTIC_OBJECT_LABORATORY_CASES
            .find(
              candidate =>
                candidate.id ===
                GalacticObjectLaboratoryCaseId
                  .HII_HIGH,
            );

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
          ].locator,
        ).toEqual(
          canonicalHigh
            ?.locator,
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
            HiiRegionGenerator
              .resolveActivity(
                generationKey,
                sample.locator,
              ),
          ).toBe(
            StarFormationActivity
              .HIGH,
          );
        }
      },
      30_000,
    );

    it(
      'should expose all eight renderer morphology families across the HIGH H II laboratory samples',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .hiiHighSamples();

        const morphologies =
          samples.map(
            sample => {
              const confirmed =
                GalacticObjectLaboratoryFixtures
                  .frames(
                    GalacticObjectLaboratoryCaseId
                      .HII_HIGH,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    sample.index,
                  )[
                    3
                  ];

              return HiiRegionHighRenderModelBuilder
                .build(
                  confirmed
                    .card
                    .render,
                )
                .morphologyFamily;
            },
          );

        expect(
          new Set(
            morphologies,
          ),
        ).toEqual(
          new Set([
            'BUBBLE',
            'BLISTER',
            'CLUMPY',
            'COMPACT',
            'PILLARS',
            'FILAMENTARY',
            'DOUBLE',
            'BROKEN_SHELL',
          ]),
        );
      },
      30_000,
    );

    it(
      'should keep one unique HIGH H II render seed and HII_HIGH_VOLUME profile across the four knowledge projections of every sample',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .hiiHighSamples();

        const allSeeds:
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
                  .HII_HIGH,
                0,
                0,
                0,
                0,
                0,
                0,
                sample.index,
              );

          const seeds =
            frames.map(
              frame =>
                frame.card.render.seed,
            );

          expect(
            new Set(
              seeds,
            ).size,
          ).toBe(
            1,
          );

          for (
            const frame
            of frames
          ) {
            expect(
              frame.card.render.renderProfile,
            ).toBe(
              ArchiveGalacticObjectRenderProfile
                .HII_HIGH_VOLUME,
            );
          }

          expect(
            frames[
              0
            ].card.render.variant,
          ).toBeNull();

          expect(
            frames[
              1
            ].card.render.variant,
          ).toBeNull();

          expect(
            frames[
              2
            ].card.render.variant,
          ).toBeNull();

          expect(
            frames[
              3
            ].card.render.variant,
          ).toBe(
            StarFormationActivity
              .HIGH,
          );

          allSeeds.push(
            seeds[
              0
            ],
          );
        }

        expect(
          new Set(
            allSeeds,
          ).size,
        ).toBe(
          8,
        );
      },
      30_000,
    );

    it(
      'should expose eight deterministic real INTENSE H II samples while preserving the canonical INTENSE representative as A',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .hiiIntenseSamples();

        const canonicalIntense =
          GALACTIC_OBJECT_LABORATORY_CASES
            .find(
              candidate =>
                candidate.id ===
                GalacticObjectLaboratoryCaseId
                  .HII_INTENSE,
            );

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
          ].locator,
        ).toEqual(
          canonicalIntense
            ?.locator,
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
            HiiRegionGenerator
              .resolveActivity(
                generationKey,
                sample.locator,
              ),
          ).toBe(
            StarFormationActivity
              .INTENSE,
          );
        }
      },
      30_000,
    );

    it(
      'should expose all eight renderer morphology families across the INTENSE H II laboratory samples',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .hiiIntenseSamples();

        const morphologies =
          samples.map(
            sample => {
              const confirmed =
                GalacticObjectLaboratoryFixtures
                  .frames(
                    GalacticObjectLaboratoryCaseId
                      .HII_INTENSE,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    sample.index,
                  )[
                    3
                  ];

              return HiiRegionIntenseRenderModelBuilder
                .build(
                  confirmed
                    .card
                    .render,
                )
                .morphologyFamily;
            },
          );

        expect(
          new Set(
            morphologies,
          ),
        ).toEqual(
          new Set([
            'BUBBLE',
            'BLISTER',
            'CLUMPY',
            'COMPACT',
            'PILLARS',
            'FILAMENTARY',
            'DOUBLE',
            'BROKEN_SHELL',
          ]),
        );
      },
      30_000,
    );

    it(
      'should keep one unique INTENSE H II render seed and HII_INTENSE_VOLUME profile across the four knowledge projections of every sample',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .hiiIntenseSamples();

        const allSeeds:
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
                  .HII_INTENSE,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                sample.index,
              );

          const seeds =
            frames.map(
              frame =>
                frame.card.render.seed,
            );

          expect(
            new Set(
              seeds,
            ).size,
          ).toBe(
            1,
          );

          for (
            const frame
            of frames
          ) {
            expect(
              frame.card.render.renderProfile,
            ).toBe(
              ArchiveGalacticObjectRenderProfile
                .HII_INTENSE_VOLUME,
            );
          }

          expect(
            frames[
              0
            ].card.render.variant,
          ).toBeNull();

          expect(
            frames[
              1
            ].card.render.variant,
          ).toBeNull();

          expect(
            frames[
              2
            ].card.render.variant,
          ).toBeNull();

          expect(
            frames[
              3
            ].card.render.variant,
          ).toBe(
            StarFormationActivity
              .INTENSE,
          );

          allSeeds.push(
            seeds[
              0
            ],
          );
        }

        expect(
          new Set(
            allSeeds,
          ).size,
        ).toBe(
          8,
        );
      },
      30_000,
    );


    it(
      'should expose eight deterministic real open-cluster samples while preserving O2 as A',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .openClusterSamples();

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
          2n,
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
            OpenClusterGenerator
              .isOpenClusterLocator(
                generationKey,
                sample.locator,
              ),
          ).toBe(
            true,
          );
        }
      },
      30_000,
    );

    it(
      'should expose the full eight-family open-cluster procedural morphology set across A to H',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .openClusterSamples();

        const models =
          samples.map(
            sample => {
              const detected =
                GalacticObjectLaboratoryFixtures
                  .frames(
                    GalacticObjectLaboratoryCaseId
                      .OPEN_CLUSTER,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    sample.index,
                  )[
                    0
                  ];

              return OpenClusterRenderModelBuilder
                .build(
                  detected
                    .card
                    .render,
                );
            },
          );

        expect(
          new Set(
            models.map(
              model =>
                model.morphologyFamily,
            ),
          ),
        ).toEqual(
          new Set([
            'LOOSE',
            'COMPACT',
            'ELONGATED',
            'SUBCLUSTERED',
            'CHAIN',
            'ASYMMETRIC',
            'HALO',
            'MULTI_CORE',
          ]),
        );

        expect(
          new Set(
            models.map(
              model =>
                model.paletteFamily,
            ),
          ).size,
        ).toBeGreaterThanOrEqual(
          5,
        );
      },
      30_000,
    );

    it(
      'should preserve one open-cluster render seed and OPEN_CLUSTER_FIELD profile across all four knowledge levels for every sample',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .openClusterSamples();

        const allSeeds:
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
                  .OPEN_CLUSTER,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                sample.index,
              );

          const seeds =
            frames.map(
              frame =>
                frame.card.render.seed,
            );

          expect(
            new Set(
              seeds,
            ).size,
          ).toBe(
            1,
          );

          for (
            const frame
            of frames
          ) {
            expect(
              frame.card.render.renderProfile,
            ).toBe(
              ArchiveGalacticObjectRenderProfile
                .OPEN_CLUSTER_FIELD,
            );
          }

          expect(
            frames[
              0
            ].card.render.kind,
          ).toBe(
            ArchiveGalacticObjectRenderKind
              .STAR_CLUSTER,
          );

          expect(
            frames[
              1
            ].card.render.kind,
          ).toBe(
            ArchiveGalacticObjectRenderKind
              .OPEN_CLUSTER,
          );

          allSeeds.push(
            seeds[
              0
            ],
          );
        }

        expect(
          new Set(
            allSeeds,
          ).size,
        ).toBe(
          8,
        );
      },
      30_000,
    );


    it(
      'should expose eight deterministic real globular-cluster samples while preserving O7 as A',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .globularClusterSamples();

        expect(
          samples,
        ).toHaveLength(
          8,
        );

        expect(
          samples[0].label,
        ).toBe(
          'A',
        );

        expect(
          samples[0].locator.galacticObjectIndex,
        ).toBe(
          7n,
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
            GlobularClusterGenerator
              .isGlobularClusterLocator(
                generationKey,
                sample.locator,
              ),
          ).toBe(
            true,
          );
        }
      },
      30_000,
    );

    it(
      'should expose the full eight-family globular-cluster procedural morphology set and several palettes across A to H',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .globularClusterSamples();

        const models =
          samples.map(
            sample => {
              const detected =
                GalacticObjectLaboratoryFixtures
                  .frames(
                    GalacticObjectLaboratoryCaseId
                      .GLOBULAR_CLUSTER,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    sample.index,
                  )[0];

              return GlobularClusterRenderModelBuilder
                .build(
                  detected.card.render,
                );
            },
          );

        expect(
          new Set(
            models.map(
              model =>
                model.morphologyFamily,
            ),
          ),
        ).toEqual(
          new Set([
            'CLASSIC',
            'CORE_COLLAPSED',
            'EXTENDED_HALO',
            'ELLIPTICAL',
            'TIDAL_STRETCHED',
            'ASYMMETRIC_HALO',
            'GRANULAR_CORE',
            'RICH_HALO',
          ]),
        );

        expect(
          new Set(
            models.map(
              model =>
                model.paletteFamily,
            ),
          ).size,
        ).toBeGreaterThanOrEqual(
          5,
        );

        expect(
          Math.max(
            ...models.map(
              model =>
                model.apparentExtent,
            ),
          ) -
          Math.min(
            ...models.map(
              model =>
                model.apparentExtent,
            ),
          ),
        ).toBeGreaterThan(
          0.28,
        );
      },
      30_000,
    );

    it(
      'should preserve one globular-cluster render seed and GLOBULAR_CLUSTER_FIELD profile across all four knowledge levels for every sample',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .globularClusterSamples();

        const allSeeds:
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
                  .GLOBULAR_CLUSTER,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                sample.index,
              );

          const seeds =
            frames.map(
              frame =>
                frame.card.render.seed,
            );

          expect(
            new Set(
              seeds,
            ).size,
          ).toBe(
            1,
          );

          for (
            const frame
            of frames
          ) {
            expect(
              frame.card.render.renderProfile,
            ).toBe(
              ArchiveGalacticObjectRenderProfile
                .GLOBULAR_CLUSTER_FIELD,
            );
          }

          expect(
            frames[0].card.render.kind,
          ).toBe(
            ArchiveGalacticObjectRenderKind
              .STAR_CLUSTER,
          );

          expect(
            frames[1].card.render.kind,
          ).toBe(
            ArchiveGalacticObjectRenderKind
              .GLOBULAR_CLUSTER,
          );

          allSeeds.push(
            seeds[0],
          );
        }

        expect(
          new Set(
            allSeeds,
          ).size,
        ).toBe(
          8,
        );
      },
      30_000,
    );


    it(
      'should expose eight deterministic PLERION samples covering all eight wind-nebula families while preserving one object across knowledge levels',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .supernovaRemnantPlerionSamples();

        expect(
          samples.map(
            sample =>
              sample.label,
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

        const visualFamilies =
          new Set<string>();

        const palettes =
          new Set<string>();

        for (
          const sample
          of samples
        ) {
          expect(
            SupernovaRemnantGenerator
              .resolveMorphology(
                generationKey,
                sample.locator,
              ),
          ).toBe(
            SupernovaRemnantMorphology
              .PLERION,
          );

          const frames =
            GalacticObjectLaboratoryFixtures
              .frames(
                GalacticObjectLaboratoryCaseId
                  .SNR_PLERION,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                sample.index,
              );

          const models =
            frames.map(
              frame =>
                SupernovaRemnantRenderModelBuilder
                  .build(
                    frame.card.render,
                  ),
            );

          visualFamilies.add(
            models[0].morphologyFamily,
          );

          palettes.add(
            models[0].paletteFamily,
          );

          expect(
            new Set(
              models.map(
                model =>
                  JSON.stringify({
                    structureSeedX:
                      model.structureSeedX,
                    structureSeedY:
                      model.structureSeedY,
                    morphologyFamily:
                      model.morphologyFamily,
                    morphologyIndex:
                      model.morphologyIndex,
                    paletteFamily:
                      model.paletteFamily,
                    paletteIndex:
                      model.paletteIndex,
                    orientationRadians:
                      model.orientationRadians,
                    structureAspect:
                      model.structureAspect,
                    apparentExtent:
                      model.apparentExtent,
                    shellRadius:
                      model.shellRadius,
                    filamentStrength:
                      model.filamentStrength,
                    clumpiness:
                      model.clumpiness,
                    interiorGlow:
                      model.interiorGlow,
                    haloStrength:
                      model.haloStrength,
                    jetStrength:
                      model.jetStrength,
                    centralEngineStrength:
                      model.centralEngineStrength,
                    coreOffsetX:
                      model.coreOffsetX,
                    coreOffsetY:
                      model.coreOffsetY,
                  }),
              ),
            ).size,
          ).toBe(
            1,
          );

          expect(
            frames[0].card.render.kind,
          ).toBe(
            ArchiveGalacticObjectRenderKind
              .EXTREME_OBJECT,
          );

          expect(
            frames[0].card.render.variant,
          ).toBeNull();

          expect(
            frames[0].card.render.renderProfile,
          ).toBe(
            ArchiveGalacticObjectRenderProfile
              .SUPERNOVA_REMNANT_PLERION,
          );

          expect(
            frames.slice(1).map(
              frame =>
                frame.card.render.seed,
            ),
          ).toEqual([
            frames[0].card.render.seed,
            frames[0].card.render.seed,
            frames[0].card.render.seed,
          ]);
        }

        expect(
          visualFamilies,
        ).toEqual(
          new Set([
            'FILAMENTARY_WIND_NEBULA',
            'PETALLED_CORE',
            'TORUS_JET',
            'ELLIPTICAL_WISPS',
            'KNOTTED_SYNCHROTRON',
            'DOUBLE_HALO',
            'OFFSET_PLUME',
            'TURBULENT_WIND_WEB',
          ]),
        );

        expect(
          palettes.size,
        ).toBeGreaterThanOrEqual(
          4,
        );
      },
      30_000,
    );


    it(
      'should expose eight deterministic COMPOSITE samples covering all eight shell-plus-PWN families while preserving one object across knowledge levels',
      () => {
        const samples =
          GalacticObjectLaboratoryFixtures
            .supernovaRemnantCompositeSamples();

        expect(
          samples.map(
            sample =>
              sample.label,
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

        const visualFamilies =
          new Set<string>();

        const palettes =
          new Set<string>();

        for (
          const sample
          of samples
        ) {
          expect(
            SupernovaRemnantGenerator
              .resolveMorphology(
                generationKey,
                sample.locator,
              ),
          ).toBe(
            SupernovaRemnantMorphology
              .COMPOSITE,
          );

          const frames =
            GalacticObjectLaboratoryFixtures
              .frames(
                GalacticObjectLaboratoryCaseId
                  .SNR_COMPOSITE,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                sample.index,
              );

          const models =
            frames.map(
              frame =>
                SupernovaRemnantRenderModelBuilder
                  .build(
                    frame.card.render,
                  ),
            );

          visualFamilies.add(
            models[0].morphologyFamily,
          );

          palettes.add(
            models[0].paletteFamily,
          );

          expect(
            new Set(
              models.map(
                model =>
                  JSON.stringify({
                    structureSeedX:
                      model.structureSeedX,
                    structureSeedY:
                      model.structureSeedY,
                    morphologyFamily:
                      model.morphologyFamily,
                    morphologyIndex:
                      model.morphologyIndex,
                    paletteFamily:
                      model.paletteFamily,
                    paletteIndex:
                      model.paletteIndex,
                    orientationRadians:
                      model.orientationRadians,
                    structureAspect:
                      model.structureAspect,
                    apparentExtent:
                      model.apparentExtent,
                    shellRadius:
                      model.shellRadius,
                    shellThickness:
                      model.shellThickness,
                    filamentStrength:
                      model.filamentStrength,
                    interiorGlow:
                      model.interiorGlow,
                    haloStrength:
                      model.haloStrength,
                    jetStrength:
                      model.jetStrength,
                    centralEngineStrength:
                      model.centralEngineStrength,
                    coreOffsetX:
                      model.coreOffsetX,
                    coreOffsetY:
                      model.coreOffsetY,
                  }),
              ),
            ).size,
          ).toBe(
            1,
          );

          expect(
            frames[0].card.render.kind,
          ).toBe(
            ArchiveGalacticObjectRenderKind
              .EXTREME_OBJECT,
          );

          expect(
            frames[0].card.render.variant,
          ).toBeNull();

          expect(
            frames[0].card.render.renderProfile,
          ).toBe(
            ArchiveGalacticObjectRenderProfile
              .SUPERNOVA_REMNANT_COMPOSITE,
          );

          expect(
            frames.slice(1).map(
              frame =>
                frame.card.render.seed,
            ),
          ).toEqual([
            frames[0].card.render.seed,
            frames[0].card.render.seed,
            frames[0].card.render.seed,
          ]);
        }

        expect(
          visualFamilies,
        ).toEqual(
          new Set([
            'BALANCED_CORE_SHELL',
            'BIPOLAR_PWN_SHELL',
            'OFFSET_CORE_SHELL',
            'FILAMENT_BRIDGE',
            'BREAKOUT_COMPOSITE',
            'DOUBLE_ARC_CORE',
            'KNOTTED_RIM_PULSAR',
            'WIND_TAIL_SHELL',
          ]),
        );

        expect(
          palettes.size,
        ).toBeGreaterThanOrEqual(
          4,
        );
      },
      30_000,
    );

  },
);
