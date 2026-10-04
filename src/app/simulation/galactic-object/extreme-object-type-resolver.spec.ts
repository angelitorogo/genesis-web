import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  ExtremeType,
  isGalacticNucleusExtremeType,
  type ExtremeType as ExtremeTypeValue,
} from '../../domain/galactic-object/extreme-object-type';

import {
  SupernovaRemnantMorphology,
} from '../../domain/galactic-object/supernova-remnant-morphology';

import {
  frozenPhysicalSourceKey,
} from '../../domain/generation/frozen-physical-source-key';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  GalacticObjectLocator,
} from '../../domain/generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ExplorationSectorResultEngine,
} from '../exploration/exploration-sector-result-engine';

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
  IntermediateMassBlackHoleGenerator,
} from './intermediate-mass-black-hole-generator';

import {
  SupernovaRemnantGenerator,
} from './supernova-remnant-generator';

const DISTRIBUTED_TYPES:
  readonly ExtremeTypeValue[] =
  Object.freeze([
    ExtremeType.NEUTRON_STAR,
    ExtremeType.PULSAR,
    ExtremeType.MILLISECOND_PULSAR,
    ExtremeType.MAGNETAR,
    ExtremeType.STELLAR_MASS_BLACK_HOLE,
    ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE,
    ExtremeType.SUPERNOVA_REMNANT,
    ExtremeType.PULSAR_WIND_NEBULA,
    ExtremeType.X_RAY_BINARY_NS,
    ExtremeType.X_RAY_BINARY_BH,
    ExtremeType.MICROQUASAR,
    ExtremeType.ULX,
  ]);

describe(
  '28.2G.1 — ExtremeObjectTypeResolver V2',
  () => {
    const seed =
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
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

    const sampled =
      sampledExtremeLocators(
        v2,
        256,
      );

    it(
      'assigns a non-null distributed ExtremeType to every sampled populated V2 EXTREME_OBJECT locator',
      () => {
        const locators =
          sampled;

        expect(
          locators.length,
        ).toBeGreaterThanOrEqual(
          64,
        );

        for (
          const locator
          of locators
        ) {
          const type =
            ExtremeObjectTypeResolver
              .resolve(
                v2,
                locator,
              );

          expect(
            type,
          ).not.toBeNull();

          expect(
            DISTRIBUTED_TYPES,
          ).toContain(
            type,
          );

          expect(
            isGalacticNucleusExtremeType(
              type!,
            ),
          ).toBe(
            false,
          );
        }
      },
    );

    it(
      'is deterministic for the same V2 universe and locator without persisting the specialization',
      () => {
        const locators =
          sampled.slice(
            0,
            48,
          );

        for (
          const locator
          of locators
        ) {
          expect(
            ExtremeObjectTypeResolver
              .resolve(
                v2,
                locator,
              ),
          ).toBe(
            ExtremeObjectTypeResolver
              .resolve(
                v2,
                locator,
              ),
          );
        }
      },
    );

    it(
      'preserves the exact existing SNR membership and maps pure plerions to PULSAR_WIND_NEBULA',
      () => {
        const physicalKey =
          frozenPhysicalSourceKey(
            v2,
          );

        const locators =
          sampled
          .filter(
            locator =>
              SupernovaRemnantGenerator
                .isSupernovaRemnantLocator(
                  physicalKey,
                  locator,
                ),
          );

        expect(
          locators.length,
        ).toBeGreaterThan(
          0,
        );

        for (
          const locator
          of locators
        ) {
          const morphology =
            SupernovaRemnantGenerator
              .resolveMorphology(
                physicalKey,
                locator,
              );

          expect(
            ExtremeObjectTypeResolver
              .resolve(
                v2,
                locator,
              ),
          ).toBe(
            morphology ===
              SupernovaRemnantMorphology.PLERION
              ? ExtremeType.PULSAR_WIND_NEBULA
              : ExtremeType.SUPERNOVA_REMNANT,
          );
        }
      },
    );

    it(
      'replaces the historical reserved complement with a concrete physical type instead of null',
      () => {
        const physicalKey =
          frozenPhysicalSourceKey(
            v2,
          );

        const locator =
          sampled
          .find(
            candidate =>
              !SupernovaRemnantGenerator
                .isSupernovaRemnantLocator(
                  physicalKey,
                  candidate,
                ) &&
              !IntermediateMassBlackHoleGenerator
                .isIntermediateMassBlackHoleLocator(
                  v2,
                  candidate,
                ),
          );

        expect(
          locator,
        ).toBeDefined();

        const type =
          ExtremeObjectTypeResolver
            .resolve(
              v2,
              locator!,
            );

        expect(
          type,
        ).not.toBeNull();

        expect([
          ExtremeType.NEUTRON_STAR,
          ExtremeType.PULSAR,
          ExtremeType.MILLISECOND_PULSAR,
          ExtremeType.MAGNETAR,
          ExtremeType.STELLAR_MASS_BLACK_HOLE,
          ExtremeType.X_RAY_BINARY_NS,
          ExtremeType.X_RAY_BINARY_BH,
          ExtremeType.MICROQUASAR,
          ExtremeType.ULX,
        ]).toContain(
          type,
        );
      },
    );

    it(
      'preserves the already-populated 27.2 IMBH subset exactly',
      () => {
        const locator =
          new GalacticObjectLocator(
            0n,
            -73014444020n,
            0n,
          );

        expect(
          IntermediateMassBlackHoleGenerator
            .isIntermediateMassBlackHoleLocator(
              v2,
              locator,
            ),
        ).toBe(
          true,
        );

        expect(
          ExtremeObjectTypeResolver
            .resolve(
              v2,
              locator,
            ),
        ).toBe(
          ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE,
        );
      },
    );

    it(
      'does not reclassify nuclei, nebulae, clusters or nonexistent ordinals',
      () => {
        expect(
          ExtremeObjectTypeResolver
            .resolve(
              v2,
              new GalacticObjectLocator(
                0n,
                0n,
                0n,
              ),
            ),
        ).toBeNull();

        const ordinary =
          firstPopulatedNonExtremeLocator(
            v2,
          );

        expect(
          ordinary,
        ).not.toBeNull();

        expect(
          ExtremeObjectTypeResolver
            .resolve(
              v2,
              ordinary!,
            ),
        ).toBeNull();

        expect(
          ExtremeObjectTypeResolver
            .resolve(
              v2,
              new GalacticObjectLocator(
                0n,
                ordinary!.sectorKey,
                999_999n,
              ),
            ),
        ).toBeNull();
      },
    );

    it(
      'keeps frozen V1 untouched and rejects malformed inputs',
      () => {
        const representative =
          sampled[0]!;

        expect(
          () =>
            ExtremeObjectTypeResolver
              .resolve(
                v1,
                representative,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            ExtremeObjectTypeResolver
              .resolve(
                v2,
                null as never,
              ),
        ).toThrow(
          TypeError,
        );
      },
    );
  },
);

function sampledExtremeLocators(
  generationKey:
    UniverseGenerationKey,

  maximum:
    number,
): GalacticObjectLocator[] {

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

  const physicalKey =
    frozenPhysicalSourceKey(
      generationKey,
    );

  const result:
    GalacticObjectLocator[] =
    [];

  for (
    let radius = 1;
    radius <= 40 &&
      result.length < maximum;
    radius += 1
  ) {
    for (
      let x = -radius;
      x <= radius &&
        result.length < maximum;
      x += 1
    ) {
      for (
        const y
        of [-radius, radius]
      ) {
        appendExtremeLocators(
          generationKey,
          physicalKey,
          grid.sectorKeyFor({
            x,
            y,
          }),
          result,
          maximum,
        );
      }
    }

    for (
      let y = -radius + 1;
      y <= radius - 1 &&
        result.length < maximum;
      y += 1
    ) {
      for (
        const x
        of [-radius, radius]
      ) {
        appendExtremeLocators(
          generationKey,
          physicalKey,
          grid.sectorKeyFor({
            x,
            y,
          }),
          result,
          maximum,
        );
      }
    }
  }

  return result;
}

function appendExtremeLocators(
  generationKey:
    UniverseGenerationKey,

  physicalKey:
    UniverseGenerationKey,

  sectorKey:
    bigint,

  result:
    GalacticObjectLocator[],

  maximum:
    number,
): void {

  if (
    result.length >=
    maximum
  ) {
    return;
  }

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

  const content =
    GalaxySectorContentGenerator
      .generate(
        galaxy,
        grid.coordinatesFor(
          sectorKey,
        ),
      );

  for (
    const locator
    of content.galacticObjectLocators
  ) {
    if (
      ExplorationSectorResultEngine
        .resolveGalacticObjectKind(
          physicalKey,
          locator,
        ) ===
      ExplorationResultKind.EXTREME_OBJECT
    ) {
      result.push(
        locator,
      );

      if (
        result.length >=
        maximum
      ) {
        return;
      }
    }
  }
}

function firstPopulatedNonExtremeLocator(
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

  const physicalKey =
    frozenPhysicalSourceKey(
      generationKey,
    );

  for (
    let x = -12;
    x <= 12;
    x += 1
  ) {
    for (
      let y = -12;
      y <= 12;
      y += 1
    ) {
      if (
        x === 0 &&
        y === 0
      ) {
        continue;
      }

      const content =
        GalaxySectorContentGenerator
          .generate(
            galaxy,
            {
              x,
              y,
            },
          );

      for (
        const locator
        of content.galacticObjectLocators
      ) {
        if (
          ExplorationSectorResultEngine
            .resolveGalacticObjectKind(
              physicalKey,
              locator,
            ) !==
          ExplorationResultKind.EXTREME_OBJECT
        ) {
          return locator;
        }
      }
    }
  }

  return null;
}
