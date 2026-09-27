import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  BodyLocator,
  GalaxyLocator,
  MoonLocator,
  SectorLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  MoonWaterRegime,
} from '../../domain/planetary/moon-water-regime';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  type GalaxyKnowledgeSnapshotEntity,
} from '../../data/local/entity/galaxy-knowledge-snapshot.entity';

import {
  type GalaxyKnowledgeSnapshotRepository,
} from '../../data/local/repository/dexie-galaxy-knowledge-snapshot.repository';

import {
  GALAXY_SCIENTIFIC_MODEL_VERSION,
} from './galaxy-knowledge-snapshot.runtime';

import {
  DexieGalaxyWaterIndexSnapshotRuntime,
} from './galaxy-water-index-snapshot.runtime';

describe(
  'DexieGalaxyWaterIndexSnapshotRuntime',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          'ABCD-EF01-2345-6789-ABCD-EF01-2345-6789',
        ),
        GeneratorVersion.V2,
      );

    const discoveries =
      Object.freeze([
        new KnownDiscovery(
          generationKey,
          new GalaxyLocator(0n),
          DiscoveryState.CONFIRMED,
        ),
        new KnownDiscovery(
          generationKey,
          new SectorLocator(0n, 2n),
          DiscoveryState.DETECTED,
        ),
        new KnownDiscovery(
          generationKey,
          new SystemLocator(0n, 2n, 0n),
          DiscoveryState.CONFIRMED,
        ),
      ]);

    const worldIndex =
      Object.freeze({
        galaxyIndex:
          0n,

        totalWorlds:
          1n,

        systems:
          Object.freeze([
            Object.freeze({
              locator:
                new SystemLocator(0n, 2n, 0n),

              designation:
                'TEST-1',

              multiplicity:
                'SINGLE' as const,

              worlds:
                Object.freeze([
                  Object.freeze({
                    locator:
                      new BodyLocator(0n, 2n, 0n, 1n),

                    designation:
                      'TEST-1 b',

                    planetType:
                      PlanetType.OCEAN,

                    surfaceLiquidWaterCoverageFraction01:
                      0.72,

                    hostLabel:
                      'A' as const,

                    orbitClass:
                      'SINGLE_HOST' as const,
                  }),
                ]),
            }),
          ]),
      });

    const moonIndex =
      Object.freeze({
        galaxyIndex:
          0n,

        totalUniqueMoons:
          1n,

        surfaceLiquidPotentialMoonCount:
          1n,

        subsurfaceOceanEvidenceMoonCount:
          1n,

        systems:
          Object.freeze([
            Object.freeze({
              locator:
                new SystemLocator(0n, 2n, 0n),

              designation:
                'TEST-1',

              multiplicity:
                'SINGLE' as const,

              moons:
                Object.freeze([
                  Object.freeze({
                    locator:
                      new MoonLocator(0n, 2n, 0n, 1n, 0n),

                    designation:
                      'TEST-1 b I',

                    hostPlanetDesignation:
                      'TEST-1 b',

                    hostLabel:
                      'A' as const,

                    orbitClass:
                      'SINGLE_HOST' as const,

                    surfaceLiquidWaterPotentialIndex01:
                      0.65,

                    subsurfaceOceanPotentialIndex01:
                      0.83,

                    waterRegime:
                      MoonWaterRegime.MIXED,

                    surfaceLiquidPotentialAtLeast40Percent:
                      true,

                    subsurfaceOceanEvidence:
                      true,
                  }),
                ]),
            }),
          ]),
      });

    it(
      'builds each expensive water index once, persists independent fragments and restores canonical locators',
      async () => {
        let stored:
          GalaxyKnowledgeSnapshotEntity | undefined;

        const repository:
          GalaxyKnowledgeSnapshotRepository = {
            async get() {
              return stored;
            },

            async put(entity) {
              stored = entity;
            },
          };

        const worldBuilder = vi.fn().mockReturnValue(worldIndex);
        const moonBuilder = vi.fn().mockReturnValue(moonIndex);

        const runtime =
          new DexieGalaxyWaterIndexSnapshotRuntime(
            repository,
            () => 456,
            worldBuilder,
            moonBuilder,
          );

        const firstWorld =
          await runtime.resolveWorldIndex(
            generationKey,
            0n,
            DiscoveryState.CONFIRMED,
            discoveries,
          );

        expect(firstWorld).toBe(worldIndex);
        expect(worldBuilder).toHaveBeenCalledTimes(1);
        expect(stored?.waterWorldIndexJson).toBeDefined();
        expect(stored?.waterMoonIndexJson).toBeUndefined();
        expect(stored?.scientificModelVersion).toBe(
          GALAXY_SCIENTIFIC_MODEL_VERSION,
        );

        const cachedWorld =
          await runtime.resolveWorldIndex(
            generationKey,
            0n,
            DiscoveryState.CONFIRMED,
            discoveries,
          );

        expect(worldBuilder).toHaveBeenCalledTimes(1);
        expect(cachedWorld.systems[0]?.locator).toBeInstanceOf(SystemLocator);
        expect(cachedWorld.systems[0]?.worlds[0]?.locator).toBeInstanceOf(BodyLocator);
        expect(cachedWorld.systems[0]?.worlds[0]?.planetType).toBe(PlanetType.OCEAN);

        await runtime.resolveMoonIndex(
          generationKey,
          0n,
          DiscoveryState.CONFIRMED,
          discoveries,
        );

        expect(moonBuilder).toHaveBeenCalledTimes(1);
        expect(stored?.waterWorldIndexJson).toBeDefined();
        expect(stored?.waterMoonIndexJson).toBeDefined();
        expect(stored?.updatedAtEpochMs).toBe(456);

        const cachedMoon =
          await runtime.resolveMoonIndex(
            generationKey,
            0n,
            DiscoveryState.CONFIRMED,
            discoveries,
          );

        expect(moonBuilder).toHaveBeenCalledTimes(1);
        expect(cachedMoon.systems[0]?.locator).toBeInstanceOf(SystemLocator);
        expect(cachedMoon.systems[0]?.moons[0]?.locator).toBeInstanceOf(MoonLocator);
        expect(cachedMoon.systems[0]?.moons[0]?.waterRegime).toBe(MoonWaterRegime.MIXED);
      },
    );

    it(
      'invalidates every old water fragment when persisted galaxy knowledge changes',
      async () => {
        let stored:
          GalaxyKnowledgeSnapshotEntity | undefined;

        const repository:
          GalaxyKnowledgeSnapshotRepository = {
            async get() {
              return stored;
            },

            async put(entity) {
              stored = entity;
            },
          };

        const worldBuilder = vi.fn().mockReturnValue(worldIndex);
        const moonBuilder = vi.fn().mockReturnValue(moonIndex);

        const runtime =
          new DexieGalaxyWaterIndexSnapshotRuntime(
            repository,
            () => 789,
            worldBuilder,
            moonBuilder,
          );

        await runtime.resolveWorldIndex(
          generationKey,
          0n,
          DiscoveryState.CONFIRMED,
          discoveries,
        );

        await runtime.resolveMoonIndex(
          generationKey,
          0n,
          DiscoveryState.CONFIRMED,
          discoveries,
        );

        const changedDiscoveries = [
          ...discoveries,
          new KnownDiscovery(
            generationKey,
            new SectorLocator(0n, 3n),
            DiscoveryState.DETECTED,
          ),
        ];

        await runtime.resolveWorldIndex(
          generationKey,
          0n,
          DiscoveryState.CONFIRMED,
          changedDiscoveries,
        );

        expect(worldBuilder).toHaveBeenCalledTimes(2);
        expect(stored?.waterWorldIndexJson).toBeDefined();
        expect(stored?.waterMoonIndexJson).toBeUndefined();
      },
    );
  },
);
