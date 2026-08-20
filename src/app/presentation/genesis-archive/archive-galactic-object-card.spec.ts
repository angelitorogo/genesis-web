import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  GalacticObjectScientificSubject,
} from '../../domain/galactic-object/galactic-object-scientific-subject';

import {
  StarFormationActivity,
} from '../../domain/galactic-object/star-formation-activity';

import {
  GalacticObjectLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GalacticObjectScientificSubjectResolver,
} from '../../simulation/galactic-object/galactic-object-scientific-subject-resolver';

import {
  HiiRegionGenerator,
} from '../../simulation/galactic-object/hii-region-generator';

import {
  NebulaGenerator,
} from '../../simulation/galactic-object/nebula-generator';

import {
  ArchiveGalacticObjectCardAssembler,
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  ArchiveGalacticObjectRenderProfile,
} from './archive-galactic-object-card';

describe(
  'ArchiveGalacticObjectCardAssembler',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    afterEach(
      () => {
        vi.restoreAllMocks();
      },
    );

    it(
      'should keep DETECTED on the coarse point-9.4 family without materializing hidden physical properties',
      () => {
        const resolverSpy =
          vi.spyOn(
            GalacticObjectScientificSubjectResolver,
            'resolve',
          );

        const hiiGenerateSpy =
          vi.spyOn(
            HiiRegionGenerator,
            'generate',
          );

        const card =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              new GalacticObjectLocator(
                0n,
                123456789n,
                3n,
              ),
              ExplorationResultKind.NEBULA,
              DiscoveryState.DETECTED,
            );

        expect(
          resolverSpy,
        ).not.toHaveBeenCalled();

        expect(
          hiiGenerateSpy,
        ).not.toHaveBeenCalled();

        expect(
          card.scientificSubject,
        ).toBeNull();

        expect(
          card.facts,
        ).toHaveLength(
          0,
        );

        expect(
          card.knowledgeLevel,
        ).toBe(
          ArchiveGalacticObjectKnowledgeLevel.SIGNAL,
        );

        expect(
          card.render.kind,
        ).toBe(
          ArchiveGalacticObjectRenderKind.NEBULA,
        );

        expect(
          card.render.variant,
        ).toBeNull();
      },
    );

    it(
      'should preserve a LOW H II volume as an opaque visual profile at DETECTED without materializing H II physical properties',
      () => {
        const hiiGenerateSpy =
          vi.spyOn(
            HiiRegionGenerator,
            'generate',
          );

        const card =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              new GalacticObjectLocator(
                0n,
                123456789n,
                11n,
              ),
              ExplorationResultKind.NEBULA,
              DiscoveryState.DETECTED,
            );

        expect(
          hiiGenerateSpy,
        ).not.toHaveBeenCalled();

        expect(
          card.scientificSubject,
        ).toBeNull();

        expect(
          card.facts,
        ).toHaveLength(
          0,
        );

        expect(
          card.render.variant,
        ).toBeNull();

        expect(
          card.render.renderProfile,
        ).toBe(
          ArchiveGalacticObjectRenderProfile
            .HII_LOW_VOLUME,
        );
      },
    );

    it(
      'should preserve the hidden LOW H II morphology at DISCOVERED without revealing activity or numeric facts',
      () => {
        const hiiGenerateSpy =
          vi.spyOn(
            HiiRegionGenerator,
            'generate',
          );

        const card =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              new GalacticObjectLocator(
                0n,
                123456789n,
                11n,
              ),
              ExplorationResultKind.NEBULA,
              DiscoveryState.DISCOVERED,
            );

        expect(
          hiiGenerateSpy,
        ).not.toHaveBeenCalled();

        expect(
          card.scientificSubject,
        ).toBe(
          GalacticObjectScientificSubject
            .HII_REGION,
        );

        expect(
          card.render.variant,
        ).toBeNull();

        expect(
          card.render.renderProfile,
        ).toBe(
          ArchiveGalacticObjectRenderProfile
            .HII_LOW_VOLUME,
        );

        expect(
          card.facts,
        ).toHaveLength(
          0,
        );
      },
    );


    it(
      'should preserve MODERATE H II as an opaque renderer profile before confirmation and reveal only the activity at CONFIRMED',
      () => {
        let locator:
          GalacticObjectLocator | null =
          null;

        for (
          let index =
            0n;
          index <
            2_048n;
          index +=
            1n
        ) {
          const candidate =
            new GalacticObjectLocator(
              0n,
              123456789n,
              index,
            );

          if (
            HiiRegionGenerator
              .resolveActivity(
                generationKey,
                candidate,
              ) ===
            StarFormationActivity.MODERATE
          ) {
            locator =
              candidate;

            break;
          }
        }

        if (
          locator ===
            null
        ) {
          throw new RangeError(
            'Missing deterministic MODERATE H II representative for renderer-profile test.',
          );
        }

        const detected =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              locator,
              ExplorationResultKind.NEBULA,
              DiscoveryState.DETECTED,
            );

        const catalogued =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              locator,
              ExplorationResultKind.NEBULA,
              DiscoveryState.CATALOGUED,
            );

        const confirmed =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              locator,
              ExplorationResultKind.NEBULA,
              DiscoveryState.CONFIRMED,
            );

        expect(
          detected.render.variant,
        ).toBeNull();

        expect(
          detected.render.renderProfile,
        ).toBe(
          ArchiveGalacticObjectRenderProfile
            .HII_MODERATE_VOLUME,
        );

        expect(
          catalogued.render.variant,
        ).toBeNull();

        expect(
          catalogued.render.renderProfile,
        ).toBe(
          ArchiveGalacticObjectRenderProfile
            .HII_MODERATE_VOLUME,
        );

        expect(
          confirmed.render.variant,
        ).toBe(
          StarFormationActivity.MODERATE,
        );

        expect(
          confirmed.render.renderProfile,
        ).toBe(
          ArchiveGalacticObjectRenderProfile
            .HII_MODERATE_VOLUME,
        );
      },
    );

    it(
      'should preserve HIGH H II as an opaque renderer profile before confirmation and reveal only the activity at CONFIRMED',
      () => {
        let locator:
          GalacticObjectLocator | null =
          null;

        for (
          let index =
            0n;
          index <
            2_048n;
          index +=
            1n
        ) {
          const candidate =
            new GalacticObjectLocator(
              0n,
              123456789n,
              index,
            );

          if (
            HiiRegionGenerator
              .resolveActivity(
                generationKey,
                candidate,
              ) ===
            StarFormationActivity.HIGH
          ) {
            locator =
              candidate;

            break;
          }
        }

        if (
          locator ===
            null
        ) {
          throw new RangeError(
            'Missing deterministic HIGH H II representative for renderer-profile test.',
          );
        }

        const detected =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              locator,
              ExplorationResultKind.NEBULA,
              DiscoveryState.DETECTED,
            );

        const catalogued =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              locator,
              ExplorationResultKind.NEBULA,
              DiscoveryState.CATALOGUED,
            );

        const confirmed =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              locator,
              ExplorationResultKind.NEBULA,
              DiscoveryState.CONFIRMED,
            );

        expect(
          detected.render.variant,
        ).toBeNull();

        expect(
          detected.render.renderProfile,
        ).toBe(
          ArchiveGalacticObjectRenderProfile
            .HII_HIGH_VOLUME,
        );

        expect(
          catalogued.render.variant,
        ).toBeNull();

        expect(
          catalogued.render.renderProfile,
        ).toBe(
          ArchiveGalacticObjectRenderProfile
            .HII_HIGH_VOLUME,
        );

        expect(
          confirmed.render.variant,
        ).toBe(
          StarFormationActivity.HIGH,
        );

        expect(
          confirmed.render.renderProfile,
        ).toBe(
          ArchiveGalacticObjectRenderProfile
            .HII_HIGH_VOLUME,
        );
      },
    );

    it(
      'should preserve INTENSE H II as an opaque renderer profile before confirmation and reveal only the activity at CONFIRMED',
      () => {
        let locator:
          GalacticObjectLocator | null =
          null;

        for (
          let index =
            0n;
          index <
            2_048n;
          index +=
            1n
        ) {
          const candidate =
            new GalacticObjectLocator(
              0n,
              123456789n,
              index,
            );

          if (
            HiiRegionGenerator
              .resolveActivity(
                generationKey,
                candidate,
              ) ===
            StarFormationActivity.INTENSE
          ) {
            locator =
              candidate;

            break;
          }
        }

        if (
          locator ===
            null
        ) {
          throw new RangeError(
            'Missing deterministic INTENSE H II representative for renderer-profile test.',
          );
        }

        const detected =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              locator,
              ExplorationResultKind.NEBULA,
              DiscoveryState.DETECTED,
            );

        const catalogued =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              locator,
              ExplorationResultKind.NEBULA,
              DiscoveryState.CATALOGUED,
            );

        const confirmed =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              locator,
              ExplorationResultKind.NEBULA,
              DiscoveryState.CONFIRMED,
            );

        expect(
          detected.render.variant,
        ).toBeNull();

        expect(
          detected.render.renderProfile,
        ).toBe(
          ArchiveGalacticObjectRenderProfile
            .HII_INTENSE_VOLUME,
        );

        expect(
          catalogued.render.variant,
        ).toBeNull();

        expect(
          catalogued.render.renderProfile,
        ).toBe(
          ArchiveGalacticObjectRenderProfile
            .HII_INTENSE_VOLUME,
        );

        expect(
          confirmed.render.variant,
        ).toBe(
          StarFormationActivity.INTENSE,
        );

        expect(
          confirmed.render.renderProfile,
        ).toBe(
          ArchiveGalacticObjectRenderProfile
            .HII_INTENSE_VOLUME,
        );
      },
    );

    it(
      'should preserve a planetary volume as an opaque visual profile at DETECTED without materializing physical properties',
      () => {
        const generateSpy =
          vi.spyOn(
            NebulaGenerator,
            'generate',
          );

        const resolveTypeSpy =
          vi.spyOn(
            NebulaGenerator,
            'resolveType',
          );

        const card =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              new GalacticObjectLocator(
                0n,
                123456789n,
                10n,
              ),
              ExplorationResultKind.NEBULA,
              DiscoveryState.DETECTED,
            );

        expect(
          resolveTypeSpy,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          generateSpy,
        ).not.toHaveBeenCalled();

        expect(
          card.scientificSubject,
        ).toBeNull();

        expect(
          card.facts,
        ).toHaveLength(
          0,
        );

        expect(
          card.render.variant,
        ).toBeNull();

        expect(
          card.render.renderProfile,
        ).toBe(
          ArchiveGalacticObjectRenderProfile
            .PLANETARY_VOLUME,
        );
      },
    );

    it(
      'should preserve the same hidden planetary render profile at DISCOVERED while subtype and numeric facts stay unavailable',
      () => {
        const generateSpy =
          vi.spyOn(
            NebulaGenerator,
            'generate',
          );

        const card =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              new GalacticObjectLocator(
                0n,
                123456789n,
                10n,
              ),
              ExplorationResultKind.NEBULA,
              DiscoveryState.DISCOVERED,
            );

        expect(
          generateSpy,
        ).not.toHaveBeenCalled();

        expect(
          card.render.variant,
        ).toBeNull();

        expect(
          card.render.renderProfile,
        ).toBe(
          ArchiveGalacticObjectRenderProfile
            .PLANETARY_VOLUME,
        );

        expect(
          card.facts,
        ).toHaveLength(
          0,
        );
      },
    );

    it(
      'should expose HII identity at DISCOVERED without materializing numeric physical facts',
      () => {
        const hiiGenerateSpy =
          vi.spyOn(
            HiiRegionGenerator,
            'generate',
          );

        const card =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              new GalacticObjectLocator(
                0n,
                123456789n,
                3n,
              ),
              ExplorationResultKind.NEBULA,
              DiscoveryState.DISCOVERED,
            );

        expect(
          card.scientificSubject,
        ).toBe(
          GalacticObjectScientificSubject.HII_REGION,
        );

        expect(
          card.title,
        ).toBe(
          'Región H II',
        );

        expect(
          card.facts,
        ).toHaveLength(
          0,
        );

        expect(
          card.render.variant,
        ).toBeNull();

        expect(
          hiiGenerateSpy,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'should keep the same LOW H II renderer profile at CATALOGUED and CONFIRMED while activity remains hidden until confirmation',
      () => {
        const locator =
          new GalacticObjectLocator(
            0n,
            123456789n,
            11n,
          );

        const catalogued =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              locator,
              ExplorationResultKind.NEBULA,
              DiscoveryState.CATALOGUED,
            );

        const confirmed =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              locator,
              ExplorationResultKind.NEBULA,
              DiscoveryState.CONFIRMED,
            );

        expect(
          catalogued.render.renderProfile,
        ).toBe(
          ArchiveGalacticObjectRenderProfile
            .HII_LOW_VOLUME,
        );

        expect(
          catalogued.render.variant,
        ).toBeNull();

        expect(
          confirmed.render.renderProfile,
        ).toBe(
          ArchiveGalacticObjectRenderProfile
            .HII_LOW_VOLUME,
        );

        expect(
          confirmed.render.variant,
        ).toBe(
          StarFormationActivity
            .LOW,
        );
      },
    );

    it(
      'should reveal HII ionization facts at CATALOGUED but keep star-formation confirmation hidden',
      () => {
        const card =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              new GalacticObjectLocator(
                0n,
                123456789n,
                3n,
              ),
              ExplorationResultKind.NEBULA,
              DiscoveryState.CATALOGUED,
            );

        const labels =
          card.facts.map(
            (fact) =>
              fact.label,
          );

        expect(
          labels,
        ).toEqual([
          'Radio ionizado',
          'Temperatura electrónica',
          'Densidad electrónica',
        ]);

        expect(
          labels,
        ).not.toContain(
          'Formación estelar',
        );

        expect(
          card.knowledgeLevel,
        ).toBe(
          ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
        );
      },
    );

    it(
      'should add HII star-formation facts only after CONFIRMED',
      () => {
        const card =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              new GalacticObjectLocator(
                0n,
                123456789n,
                3n,
              ),
              ExplorationResultKind.NEBULA,
              DiscoveryState.CONFIRMED,
            );

        const labels =
          card.facts.map(
            (fact) =>
              fact.label,
          );

        expect(
          labels,
        ).toContain(
          'Formación estelar',
        );

        expect(
          labels,
        ).toContain(
          'Fotones ionizantes',
        );

        expect(
          card.nextScientificStep,
        ).toBe(
          'Ciclo científico completado',
        );
      },
    );

    it(
      'should preserve open versus globular cluster identity and withhold age/metallicity until confirmation',
      () => {
        const openCatalogued =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              new GalacticObjectLocator(
                0n,
                0n,
                2n,
              ),
              ExplorationResultKind.STAR_CLUSTER,
              DiscoveryState.CATALOGUED,
            );

        const globularCatalogued =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              new GalacticObjectLocator(
                0n,
                0n,
                7n,
              ),
              ExplorationResultKind.STAR_CLUSTER,
              DiscoveryState.CATALOGUED,
            );

        expect(
          openCatalogued.scientificSubject,
        ).toBe(
          GalacticObjectScientificSubject.OPEN_CLUSTER,
        );

        expect(
          globularCatalogued.scientificSubject,
        ).toBe(
          GalacticObjectScientificSubject.GLOBULAR_CLUSTER,
        );

        expect(
          openCatalogued.facts.map(
            (fact) =>
              fact.label,
          ),
        ).not.toContain(
          'Edad',
        );

        expect(
          globularCatalogued.facts.map(
            (fact) =>
              fact.label,
          ),
        ).not.toContain(
          'Metalicidad',
        );

        const openConfirmed =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              new GalacticObjectLocator(
                0n,
                0n,
                2n,
              ),
              ExplorationResultKind.STAR_CLUSTER,
              DiscoveryState.CONFIRMED,
            );

        const globularConfirmed =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              new GalacticObjectLocator(
                0n,
                0n,
                7n,
              ),
              ExplorationResultKind.STAR_CLUSTER,
              DiscoveryState.CONFIRMED,
            );

        expect(
          openConfirmed.facts.map(
            (fact) =>
              fact.label,
          ),
        ).toContain(
          'Edad',
        );

        expect(
          globularConfirmed.facts.map(
            (fact) =>
              fact.label,
          ),
        ).toContain(
          'Metalicidad',
        );
      },
    );

    it(
      'should reveal only shock characterization for a catalogued persistent supernova remnant',
      () => {
        const card =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              new GalacticObjectLocator(
                0n,
                0n,
                0n,
              ),
              ExplorationResultKind.EXTREME_OBJECT,
              DiscoveryState.CATALOGUED,
            );

        const labels =
          card.facts.map(
            (fact) =>
              fact.label,
          );

        expect(
          card.scientificSubject,
        ).toBe(
          GalacticObjectScientificSubject.SUPERNOVA_REMNANT,
        );

        expect(
          labels,
        ).toContain(
          'Velocidad de expansión',
        );

        expect(
          labels,
        ).not.toContain(
          'Energía de explosión',
        );

        expect(
          card.render.variant,
        ).not.toBeNull();
      },
    );

    it(
      'should reveal supernova-remnant evolution facts only after confirmation',
      () => {
        const card =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              new GalacticObjectLocator(
                0n,
                0n,
                0n,
              ),
              ExplorationResultKind.EXTREME_OBJECT,
              DiscoveryState.CONFIRMED,
            );

        const labels =
          card.facts.map(
            (fact) =>
              fact.label,
          );

        expect(
          labels,
        ).toContain(
          'Edad',
        );

        expect(
          labels,
        ).toContain(
          'Energía de explosión',
        );

        expect(
          labels,
        ).toContain(
          'Masa barrida',
        );
      },
    );

    it(
      'should preserve the reserved EXTREME_OBJECT complement without inventing a point-12.8 physical card',
      () => {
        const card =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              new GalacticObjectLocator(
                0n,
                0n,
                18n,
              ),
              ExplorationResultKind.EXTREME_OBJECT,
              DiscoveryState.CONFIRMED,
            );

        expect(
          card.scientificSubject,
        ).toBeNull();

        expect(
          card.title,
        ).toContain(
          'sin clasificación física V1',
        );

        expect(
          card.facts,
        ).toHaveLength(
          0,
        );

        expect(
          card.render.kind,
        ).toBe(
          ArchiveGalacticObjectRenderKind.EXTREME_OBJECT,
        );
      },
    );

    it(
      'should preserve one open-cluster renderer profile from coarse detection through physical confirmation without leaking the subtype early',
      () => {
        const locator =
          new GalacticObjectLocator(
            0n,
            0n,
            2n,
          );

        const cards =
          [
            DiscoveryState.DETECTED,
            DiscoveryState.DISCOVERED,
            DiscoveryState.CATALOGUED,
            DiscoveryState.CONFIRMED,
          ].map(
            state =>
              ArchiveGalacticObjectCardAssembler
                .build(
                  generationKey,
                  locator,
                  ExplorationResultKind.STAR_CLUSTER,
                  state,
                ),
          );

        expect(
          new Set(
            cards.map(
              card =>
                card.render.seed,
            ),
          ).size,
        ).toBe(
          1,
        );

        for (
          const card
          of cards
        ) {
          expect(
            card.render.renderProfile,
          ).toBe(
            ArchiveGalacticObjectRenderProfile
              .OPEN_CLUSTER_FIELD,
          );
        }

        expect(
          cards[
            0
          ].scientificSubject,
        ).toBeNull();

        expect(
          cards[
            0
          ].render.kind,
        ).toBe(
          ArchiveGalacticObjectRenderKind
            .STAR_CLUSTER,
        );

        expect(
          cards[
            1
          ].scientificSubject,
        ).toBe(
          GalacticObjectScientificSubject
            .OPEN_CLUSTER,
        );

        expect(
          cards[
            1
          ].render.kind,
        ).toBe(
          ArchiveGalacticObjectRenderKind
            .OPEN_CLUSTER,
        );
      },
    );

    it(
      'should keep the renderer-only descriptor deterministic for the same persisted identity and state',
      () => {
        const locator =
          new GalacticObjectLocator(
            0n,
            0n,
            7n,
          );

        const first =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              locator,
              ExplorationResultKind.STAR_CLUSTER,
              DiscoveryState.CONFIRMED,
            );

        const second =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              locator,
              ExplorationResultKind.STAR_CLUSTER,
              DiscoveryState.CONFIRMED,
            );

        expect(
          first.render,
        ).toEqual(
          second.render,
        );
      },
    );

    it(
      'should reject SYSTEM because point 12.8 cards are only for GalacticObjectLocator families',
      () => {
        expect(
          () =>
            ArchiveGalacticObjectCardAssembler
              .build(
                generationKey,
                new GalacticObjectLocator(
                  0n,
                  0n,
                  0n,
                ),
                ExplorationResultKind.SYSTEM,
                DiscoveryState.DETECTED,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
