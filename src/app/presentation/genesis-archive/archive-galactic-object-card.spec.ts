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
  ArchiveGalacticObjectCardAssembler,
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
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
      'should keep DETECTED on the coarse point-9.4 family without resolving hidden physical Ground Truth',
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
