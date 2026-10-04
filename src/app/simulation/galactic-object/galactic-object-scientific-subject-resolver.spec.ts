import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GalacticObjectScientificSubject,
} from '../../domain/galactic-object/galactic-object-scientific-subject';

import {
  ExtremeType,
} from '../../domain/galactic-object/extreme-object-type';

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
  GalaxySectorContentGenerator,
} from '../sector/galaxy-sector-content-generator';

import {
  GalaxySectorGridGenerator,
} from '../sector/galaxy-sector-grid-generator';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  ExtremeObjectTypeResolver,
} from './extreme-object-type-resolver';

import {
  GalacticObjectScientificSubjectResolver,
} from './galactic-object-scientific-subject-resolver';

import {
  SupernovaRemnantGenerator,
} from './supernova-remnant-generator';

describe(
  'GalacticObjectScientificSubjectResolver',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should refuse to resolve hidden physical subject while the target is only DETECTED',
      () => {
        expect(
          () =>
            GalacticObjectScientificSubjectResolver
              .resolve(
                generationKey,
                new GalacticObjectLocator(
                  0n,
                  123456789n,
                  3n,
                ),
                DiscoveryState.DETECTED,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should resolve a qualifying emission nebula as HII_REGION before generic NEBULA',
      () => {
        expect(
          GalacticObjectScientificSubjectResolver
            .resolve(
              generationKey,
              new GalacticObjectLocator(
                0n,
                123456789n,
                3n,
              ),
              DiscoveryState.DISCOVERED,
            ),
        ).toBe(
          GalacticObjectScientificSubject.HII_REGION,
        );
      },
    );

    it(
      'should resolve a non-HII physical nebula as NEBULA',
      () => {
        expect(
          GalacticObjectScientificSubjectResolver
            .resolve(
              generationKey,
              new GalacticObjectLocator(
                0n,
                123456789n,
                8n,
              ),
              DiscoveryState.DISCOVERED,
            ),
        ).toBe(
          GalacticObjectScientificSubject.NEBULA,
        );
      },
    );

    it(
      'should preserve the frozen open versus globular STAR_CLUSTER partition',
      () => {
        expect(
          GalacticObjectScientificSubjectResolver
            .resolve(
              generationKey,
              new GalacticObjectLocator(
                0n,
                0n,
                2n,
              ),
              DiscoveryState.DISCOVERED,
            ),
        ).toBe(
          GalacticObjectScientificSubject.OPEN_CLUSTER,
        );

        expect(
          GalacticObjectScientificSubjectResolver
            .resolve(
              generationKey,
              new GalacticObjectLocator(
                0n,
                0n,
                7n,
              ),
              DiscoveryState.DISCOVERED,
            ),
        ).toBe(
          GalacticObjectScientificSubject.GLOBULAR_CLUSTER,
        );
      },
    );

    it(
      'should resolve the frozen point-12.6 remnant vector as SUPERNOVA_REMNANT',
      () => {
        expect(
          GalacticObjectScientificSubjectResolver
            .resolve(
              generationKey,
              findPersistentSupernovaRemnantLocator(
                generationKey,
              ),
              DiscoveryState.DISCOVERED,
            ),
        ).toBe(
          GalacticObjectScientificSubject.SUPERNOVA_REMNANT,
        );
      },
    );

    it(
      'should keep the reserved EXTREME_OBJECT complement scientifically unresolved',
      () => {
        expect(
          GalacticObjectScientificSubjectResolver
            .resolve(
              generationKey,
              new GalacticObjectLocator(
                0n,
                0n,
                18n,
              ),
              DiscoveryState.DISCOVERED,
            ),
        ).toBeNull();
      },
    );

    it(
      'should route V2 distributed extremes through one broad scientific subject without leaking the exact ExtremeType',
      () => {
        const v2 =
          new UniverseGenerationKey(
            generationKey.universeSeed.copy(),
            GeneratorVersion.V2,
          );

        const candidate =
          findPopulatedV2UnroutedExtremeLocator(
            v2,
          );

        expect(candidate).not.toBeNull();

        expect(
          ExtremeObjectTypeResolver.resolve(
            v2,
            candidate!,
          ),
        ).not.toBeNull();

        // 28.2G.3 exposes only a broad action-routing subject at DISCOVERED;
        // the exact ExtremeType remains a CATALOGUED-level disclosure.
        expect(
          GalacticObjectScientificSubjectResolver.resolve(
            v2,
            candidate!,
            DiscoveryState.DISCOVERED,
          ),
        ).toBe(
          GalacticObjectScientificSubject.DISTRIBUTED_EXTREME_OBJECT,
        );
      },
    );

    it(
      'should resolve the reserved centre from V2 nuclear Ground Truth instead of inheriting the V1 subject',
      () => {
        const seed =
          UniverseSeed.parse(
            '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
          );
        const v1 =
          new UniverseGenerationKey(
            seed,
            GeneratorVersion.V1,
          );
        const v2 =
          new UniverseGenerationKey(
            seed.copy(),
            GeneratorVersion.V2,
          );
        const centre =
          new GalacticObjectLocator(
            0n,
            0n,
            0n,
          );

        expect(
          GalacticObjectScientificSubjectResolver.resolve(
            v1,
            centre,
            DiscoveryState.DISCOVERED,
          ),
        ).toBe(
          GalacticObjectScientificSubject.GLOBULAR_CLUSTER,
        );
        expect(
          GalacticObjectScientificSubjectResolver.resolve(
            v2,
            centre,
            DiscoveryState.DISCOVERED,
          ),
        ).toBe(
          GalacticObjectScientificSubject.ACTIVE_GALACTIC_NUCLEUS,
        );
      },
    );

    it(
      'should not retrofit the additive active-nucleus subject onto a frozen V1 active centre',
      () => {
        expect(
          GalacticObjectScientificSubjectResolver.resolve(
            generationKey,
            new GalacticObjectLocator(
              20n,
              0n,
              0n,
            ),
            DiscoveryState.DISCOVERED,
          ),
        ).toBeNull();
      },
    );

    it(
      'should reject unsupported generator versions before resolving any physical subject',
      () => {
        const unsupported =
          new UniverseGenerationKey(
            generationKey.universeSeed,
            {
              code:
                999,
            } as unknown as GeneratorVersion,
          );

        expect(
          () =>
            GalacticObjectScientificSubjectResolver
              .resolve(
                unsupported,
                new GalacticObjectLocator(
                  0n,
                  0n,
                  0n,
                ),
                DiscoveryState.DISCOVERED,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function findPersistentSupernovaRemnantLocator(
  generationKey:
    UniverseGenerationKey,
): GalacticObjectLocator {

  for (
    let index =
      1n;
    index <
      2_048n;
    index +=
      1n
  ) {
    const candidate =
      new GalacticObjectLocator(
        0n,
        0n,
        index,
      );

    if (
      SupernovaRemnantGenerator
        .isSupernovaRemnantLocator(
          generationKey,
          candidate,
        )
    ) {
      return candidate;
    }
  }

  throw new RangeError(
    'Missing deterministic persistent supernova-remnant test locator outside the reserved galactic nucleus object.',
  );
}

function findPopulatedV2UnroutedExtremeLocator(
  generationKey:
    UniverseGenerationKey,
): GalacticObjectLocator | null {

  const galaxy =
    GalaxyGenerator.generate(
      generationKey,
      0n,
    );

  const grid =
    GalaxySectorGridGenerator
      .generate(
        galaxy,
      );

  for (
    let radius = 1;
    radius <= 40;
    radius += 1
  ) {
    const coordinates:
      {
        readonly x: number;
        readonly y: number;
      }[] =
      [];

    for (
      let x = -radius;
      x <= radius;
      x += 1
    ) {
      coordinates.push(
        { x, y: -radius },
        { x, y: radius },
      );
    }

    for (
      let y = -radius + 1;
      y <= radius - 1;
      y += 1
    ) {
      coordinates.push(
        { x: -radius, y },
        { x: radius, y },
      );
    }

    for (
      const coordinate
      of coordinates
    ) {
      const content =
        GalaxySectorContentGenerator
          .generate(
            galaxy,
            grid.coordinatesFor(
              grid.sectorKeyFor(
                coordinate,
              ),
            ),
          );

      for (
        const locator
        of content.galacticObjectLocators
      ) {
        const type =
          ExtremeObjectTypeResolver.resolve(
            generationKey,
            locator,
          );

        if (
          type !== null &&
          type !== ExtremeType.SUPERNOVA_REMNANT &&
          type !== ExtremeType.PULSAR_WIND_NEBULA &&
          type !== ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE
        ) {
          return locator;
        }
      }
    }
  }

  return null;
}

