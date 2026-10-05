import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  ExtremeType,
} from '../../domain/galactic-object/extreme-object-type';

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
} from '../../simulation/exploration/exploration-sector-result-engine';

import {
  ExtremeObjectTypeResolver,
} from '../../simulation/galactic-object/extreme-object-type-resolver';

import {
  GalaxySectorContentGenerator,
} from '../../simulation/sector/galaxy-sector-content-generator';

import {
  GalaxySectorGridGenerator,
} from '../../simulation/sector/galaxy-sector-grid-generator';

import {
  GalaxyGenerator,
} from '../../simulation/universe/galaxy-generator';

import {
  ArchiveGalacticObjectCardAssembler,
} from './archive-galactic-object-card';

describe(
  '28.2G.2 — real V2 extreme objects in Archive Genesis',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V2,
      );

    const locators =
      sampledExtremeLocators(
        generationKey,
        96,
      );

    it(
      'keeps the exact public identity hidden before CATALOGUED while reusing the approved extreme visual progression',
      () => {
        expect(locators.length).toBeGreaterThanOrEqual(32);

        const progressiveLocators =
          locators
            .filter(
              locator => {
                const type =
                  ExtremeObjectTypeResolver.resolve(
                    generationKey,
                    locator,
                  );

                return (
                  type !== null &&
                  type !== ExtremeType.SUPERNOVA_REMNANT &&
                  type !== ExtremeType.PULSAR_WIND_NEBULA &&
                  type !== ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE
                );
              },
            )
            .slice(
              0,
              32,
            );

        expect(progressiveLocators.length)
          .toBeGreaterThanOrEqual(16);

        for (const locator of progressiveLocators) {
          const expected =
            ExtremeObjectTypeResolver.resolve(
              generationKey,
              locator,
            );

          expect(expected).not.toBeNull();

          for (
            const state
            of [
              DiscoveryState.DETECTED,
              DiscoveryState.DISCOVERED,
            ]
          ) {
            const card =
              ArchiveGalacticObjectCardAssembler.build(
                generationKey,
                locator,
                ExplorationResultKind.EXTREME_OBJECT,
                state,
              );

            expect(card.extremeType ?? null).toBeNull();
            expect(card.render.extremeType ?? null).toBeNull();
            expect(card.render.extremeRender?.type).toBe(expected);
            expect(card.render.extremeRender?.detailStage)
              .toBe(
                state === DiscoveryState.DETECTED
                  ? 'DETECTED'
                  : 'DISCOVERED',
              );
            expect(card.title.toLocaleLowerCase('es-ES'))
              .not.toContain(
                expected === null
                  ? '__never__'
                  : String(expected).toLocaleLowerCase('es-ES'),
              );
          }
        }
      },
    );

    it(
      'publishes the exact canonical ExtremeType for every CATALOGUED and CONFIRMED V2 extreme',
      () => {
        for (const locator of locators) {
          const expected =
            ExtremeObjectTypeResolver.resolve(
              generationKey,
              locator,
            );

          expect(expected).not.toBeNull();

          for (
            const state
            of [
              DiscoveryState.CATALOGUED,
              DiscoveryState.CONFIRMED,
            ]
          ) {
            const card =
              ArchiveGalacticObjectCardAssembler.build(
                generationKey,
                locator,
                ExplorationResultKind.EXTREME_OBJECT,
                state,
              );

            expect(card.extremeType).toBe(expected);
            expect(card.render.extremeType).toBe(expected);
            expect(card.render.extremeRender?.type).toBe(expected);
            expect(card.title.toLocaleLowerCase('es-ES'))
              .not.toContain('sin clasificación física');
          }
        }
      },
    );

    it(
      'keeps the same deterministic A-H visual family between CATALOGUED and CONFIRMED',
      () => {
        for (const locator of locators.slice(0, 48)) {
          const catalogued =
            ArchiveGalacticObjectCardAssembler.build(
              generationKey,
              locator,
              ExplorationResultKind.EXTREME_OBJECT,
              DiscoveryState.CATALOGUED,
            );

          const confirmed =
            ArchiveGalacticObjectCardAssembler.build(
              generationKey,
              locator,
              ExplorationResultKind.EXTREME_OBJECT,
              DiscoveryState.CONFIRMED,
            );

          expect(confirmed.render.extremeRender?.presetIndex)
            .toBe(catalogued.render.extremeRender?.presetIndex);
          expect(confirmed.render.extremeRender?.presetLabel)
            .toBe(catalogued.render.extremeRender?.presetLabel);
        }
      },
    );
  },
);

function sampledExtremeLocators(
  generationKey: UniverseGenerationKey,
  maximum: number,
): GalacticObjectLocator[] {

  const galaxy =
    GalaxyGenerator.generate(
      generationKey,
      0n,
    );

  const grid =
    GalaxySectorGridGenerator.generate(
      galaxy,
    );

  const physicalKey =
    frozenPhysicalSourceKey(
      generationKey,
    );

  const result: GalacticObjectLocator[] = [];

  for (
    let radius = 1;
    radius <= 36 && result.length < maximum;
    radius += 1
  ) {
    for (
      let x = -radius;
      x <= radius && result.length < maximum;
      x += 1
    ) {
      for (const y of [-radius, radius]) {
        appendExtremeLocators(
          physicalKey,
          galaxy,
          grid.coordinatesFor(
            grid.sectorKeyFor({ x, y }),
          ),
          result,
          maximum,
        );
      }
    }

    for (
      let y = -radius + 1;
      y <= radius - 1 && result.length < maximum;
      y += 1
    ) {
      for (const x of [-radius, radius]) {
        appendExtremeLocators(
          physicalKey,
          galaxy,
          grid.coordinatesFor(
            grid.sectorKeyFor({ x, y }),
          ),
          result,
          maximum,
        );
      }
    }
  }

  return result;
}

function appendExtremeLocators(
  physicalKey: UniverseGenerationKey,
  galaxy: ReturnType<typeof GalaxyGenerator.generate>,
  coordinates: Readonly<{ x: number; y: number }>,
  result: GalacticObjectLocator[],
  maximum: number,
): void {

  if (result.length >= maximum) return;

  const content =
    GalaxySectorContentGenerator.generate(
      galaxy,
      coordinates,
    );

  for (const locator of content.galacticObjectLocators) {
    if (
      ExplorationSectorResultEngine.resolveGalacticObjectKind(
        physicalKey,
        locator,
      ) === ExplorationResultKind.EXTREME_OBJECT
    ) {
      result.push(locator);
      if (result.length >= maximum) return;
    }
  }
}
