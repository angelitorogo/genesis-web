import {
  vi,
} from 'vitest';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  BodyLocator,
  CivilizationLocator,
  GalacticObjectLocator,
  GalaxyLocator,
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
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

import {
  CapturedExtrasolarObjectGenerator,
} from '../planetary/captured-extrasolar-object-generator';

import {
  CometGenerator,
} from '../planetary/comet-generator';

import {
  TransNeptunianObjectGenerator,
} from '../planetary/trans-neptunian-object-generator';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

import {
  StellarMultihostFormation,
} from '../stellar/stellar-multihost-formation';

import {
  StellarSystemMultiplicitySelector,
} from '../stellar/stellar-system-multiplicity-selector';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  ExplorationSectorResultEngine,
} from './exploration-sector-result-engine';

import {
  GalaxyExplorationTelemetryEngine,
} from './galaxy-exploration-telemetry-engine';

describe(
  'GalaxyExplorationTelemetryEngine point 26.1b',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should expose the existing B5 addressable sector denominator and a sector-only exploration percentage',
      () => {
        const known = [
          new KnownDiscovery(
            generationKey,
            new GalaxyLocator(
              0n,
            ),
            DiscoveryState
              .VISITED,
          ),
          new KnownDiscovery(
            generationKey,
            new SectorLocator(
              0n,
              0n,
            ),
            DiscoveryState
              .DETECTED,
          ),
          new KnownDiscovery(
            generationKey,
            new SectorLocator(
              0n,
              1n,
            ),
            DiscoveryState
              .DISCOVERED,
          ),
          new KnownDiscovery(
            generationKey,
            new SystemLocator(
              0n,
              0n,
              0n,
            ),
            DiscoveryState
              .DETECTED,
          ),
        ];

        const telemetry =
          GalaxyExplorationTelemetryEngine
            .build(
              generationKey,
              0n,
              DiscoveryState
                .VISITED,
              known,
            );

        expect(
          telemetry.totalSectors,
        ).toBe(
          20_449n,
        );

        expect(
          telemetry.inventory.sectors,
        ).toBe(
          2n,
        );

        expect(
          telemetry.inventory.systems,
        ).toBe(
          1n,
        );

        expect(
          telemetry.breakdown.systems.unclassified,
        ).toBe(
          1n,
        );

        expect(
          telemetry.breakdown.confirmedSystemsWithInventory,
        ).toBe(
          0n,
        );

        expect(
          telemetry.exploredPercentageBasisPoints,
        ).toBe(
          1n,
        );
      },
    );

    it(
      'should split only persisted galactic-object records into cluster, nebula and extreme families',
      () => {
        const locators =
          knownGalacticObjectFamilyLocators();

        const known = [
          new KnownDiscovery(
            generationKey,
            new GalaxyLocator(
              0n,
            ),
            DiscoveryState
              .DISCOVERED,
          ),
          ...locators.map(
            locator =>
              new KnownDiscovery(
                generationKey,
                locator,
                DiscoveryState
                  .DETECTED,
              ),
          ),
          new KnownDiscovery(
            generationKey,
            new BodyLocator(
              0n,
              0n,
              0n,
              0n,
            ),
            DiscoveryState
              .DISCOVERED,
          ),
          new KnownDiscovery(
            generationKey,
            new CivilizationLocator(
              0n,
              0n,
              0n,
              0n,
              0n,
            ),
            DiscoveryState
              .DETECTED,
          ),
        ];

        const telemetry =
          GalaxyExplorationTelemetryEngine
            .build(
              generationKey,
              0n,
              DiscoveryState
                .DISCOVERED,
              known,
            );

        expect(
          telemetry.inventory.starClusters,
        ).toBe(
          1n,
        );
        expect(
          telemetry.inventory.nebulae,
        ).toBe(
          1n,
        );
        expect(
          telemetry.inventory.extremeObjects,
        ).toBe(
          1n,
        );
        expect(
          telemetry.inventory.planets,
        ).toBe(
          1n,
        );
        expect(
          telemetry.inventory.civilizations,
        ).toBe(
          1n,
        );

        expect(
          telemetry.breakdown.starClusters.unclassified,
        ).toBe(
          1n,
        );
        expect(
          telemetry.breakdown.nebulae.unclassified,
        ).toBe(
          1n,
        );
        expect(
          telemetry.breakdown.extremeObjects.unclassified,
        ).toBe(
          1n,
        );
        expect(
          telemetry.breakdown.planets.unclassified,
        ).toBe(
          1n,
        );

        expect(
          telemetry.inventory.moons,
        ).toBe(
          0n,
        );
        expect(
          telemetry.inventory.asteroids,
        ).toBe(
          0n,
        );
        expect(
          telemetry.inventory.comets,
        ).toBe(
          0n,
        );
        expect(
          telemetry.inventory.transNeptunianObjects,
        ).toBe(
          0n,
        );
        expect(
          telemetry.inventory.capturedObjects,
        ).toBe(
          0n,
        );
      },
    );

    it(
      'should reveal SINGLE, BINARY and TRIPLE multiplicity at DISCOVERED without materializing planetary inventory',
      () => {
        const key =
          v2GenerationKey();

        const single =
          findSystemByMultiplicity(
            StellarSystemMultiplicity.SINGLE,
          );
        const binary =
          findSystemByMultiplicity(
            StellarSystemMultiplicity.BINARY,
          );
        const triple =
          findSystemByMultiplicity(
            StellarSystemMultiplicity.TRIPLE,
          );

        const telemetry =
          GalaxyExplorationTelemetryEngine.build(
            key,
            0n,
            DiscoveryState.DISCOVERED,
            [
              new KnownDiscovery(
                key,
                new GalaxyLocator(0n),
                DiscoveryState.DISCOVERED,
              ),
              new KnownDiscovery(
                key,
                single,
                DiscoveryState.DISCOVERED,
              ),
              new KnownDiscovery(
                key,
                binary,
                DiscoveryState.DISCOVERED,
              ),
              new KnownDiscovery(
                key,
                triple,
                DiscoveryState.DISCOVERED,
              ),
            ],
          );

        expect(
          telemetry.inventory.systems,
        ).toBe(
          3n,
        );

        expect(
          telemetry.breakdown.systems.single,
        ).toBe(
          1n,
        );
        expect(
          telemetry.breakdown.systems.binary,
        ).toBe(
          1n,
        );
        expect(
          telemetry.breakdown.systems.triple,
        ).toBe(
          1n,
        );
        expect(
          telemetry.breakdown.systems.unclassified,
        ).toBe(
          0n,
        );

        expect(
          telemetry.breakdown.confirmedSystemsWithInventory,
        ).toBe(
          0n,
        );
        expect(
          telemetry.inventory.planets,
        ).toBe(
          0n,
        );
        expect(
          telemetry.inventory.moons,
        ).toBe(
          0n,
        );
      },
      30_000,
    );

    it(
      'should project complete confirmed V2 SINGLE planet, moon and requested minor-body counts without persisted child rows',
      () => {
        const key =
          v2GenerationKey();

        const locator =
          findSingleSystemWithPlanets();

        const source =
          StellarMultihostFormation.generateV2SingleOrNull(
            key,
            locator,
          );

        if (
          source ===
          null ||
          source.planetarySystem ===
          null ||
          source.asteroidBelts ===
          null
        ) {
          throw new Error(
            '26.1b fixture requires one confirmed V2 SINGLE with a planetary system.',
          );
        }

        const telemetry =
          GalaxyExplorationTelemetryEngine.build(
            key,
            0n,
            DiscoveryState.CONFIRMED,
            [
              new KnownDiscovery(
                key,
                new GalaxyLocator(0n),
                DiscoveryState.CONFIRMED,
              ),
              new KnownDiscovery(
                key,
                locator,
                DiscoveryState.CONFIRMED,
              ),
              new KnownDiscovery(
                key,
                new BodyLocator(
                  locator.galaxyIndex,
                  locator.sectorKey,
                  locator.galacticObjectIndex,
                  0n,
                ),
                DiscoveryState.CATALOGUED,
              ),
            ],
          );

        const expectedMoons =
          source.moonSystems.reduce(
            (
              total,
              moons,
            ) =>
              total +
              BigInt(
                moons.moonCount,
              ),
            0n,
          );

        expect(
          telemetry.breakdown.confirmedSystemsWithInventory,
        ).toBe(
          1n,
        );

        expect(
          telemetry.inventory.planets,
        ).toBe(
          BigInt(
            source.planets.length,
          ),
        );

        expect(
          telemetry.inventory.moons,
        ).toBe(
          expectedMoons,
        );

        expect(
          telemetry.inventory.asteroids,
        ).toBe(
          BigInt(
            source.asteroidBelts.relevantAsteroidCount,
          ),
        );

        expect(
          telemetry.inventory.comets,
        ).toBe(
          BigInt(
            CometGenerator.generate(
              source.internalGenerationKey,
              source.planetarySystem,
            ).relevantCometCount,
          ),
        );

        expect(
          telemetry.inventory.transNeptunianObjects,
        ).toBe(
          BigInt(
            TransNeptunianObjectGenerator.generate(
              source.internalGenerationKey,
              source.planetarySystem,
            ).relevantObjectCount,
          ),
        );

        expect(
          telemetry.inventory.capturedObjects,
        ).toBe(
          BigInt(
            CapturedExtrasolarObjectGenerator.generate(
              source.internalGenerationKey,
              source.planetarySystem,
            ).relevantObjectCount,
          ),
        );

        expect(
          telemetry.breakdown.planets.rocky +
            telemetry.breakdown.planets.superEarth +
            telemetry.breakdown.planets.desert +
            telemetry.breakdown.planets.ocean +
            telemetry.breakdown.planets.ice +
            telemetry.breakdown.planets.volcanic +
            telemetry.breakdown.planets.miniNeptune +
            telemetry.breakdown.planets.gasGiant +
            telemetry.breakdown.planets.iceGiant +
            telemetry.breakdown.planets.postCollapseModel +
            telemetry.breakdown.planets.unclassified,
        ).toBe(
          telemetry.inventory.planets,
        );

        expect(
          telemetry.breakdown.moons.rocky +
            telemetry.breakdown.moons.mixedRockIce +
            telemetry.breakdown.moons.icy +
            telemetry.breakdown.moons.uncharacterized,
        ).toBe(
          telemetry.inventory.moons,
        );
      },
      120_000,
    );

    it(
      'should keep exact grid size hidden at DETECTED without materializing Galaxy Ground Truth',
      () => {
        const generateSpy =
          vi.spyOn(
            GalaxyGenerator,
            'generate',
          );

        const telemetry =
          GalaxyExplorationTelemetryEngine
            .build(
              generationKey,
              1n,
              DiscoveryState
                .DETECTED,
              [
                new KnownDiscovery(
                  generationKey,
                  new GalaxyLocator(
                    1n,
                  ),
                  DiscoveryState
                    .DETECTED,
                ),
                new KnownDiscovery(
                  generationKey,
                  new GalacticObjectLocator(
                    1n,
                    0n,
                    0n,
                  ),
                  DiscoveryState
                    .DETECTED,
                ),
              ],
            );

        expect(
          telemetry.totalSectors,
        ).toBeNull();
        expect(
          telemetry.exploredPercentageBasisPoints,
        ).toBeNull();
        expect(
          telemetry.inventory.extremeObjects +
            telemetry.inventory.starClusters +
            telemetry.inventory.nebulae,
        ).toBe(
          0n,
        );

        expect(
          generateSpy,
        ).not.toHaveBeenCalled();

        generateSpy
          .mockRestore();
      },
    );

    function v2GenerationKey():
      UniverseGenerationKey {

      return new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V2,
      );
    }

    function findSystemByMultiplicity(
      expected:
        StellarSystemMultiplicity,
    ): SystemLocator {

      const key =
        v2GenerationKey();

      const physicalKey =
        new UniverseGenerationKey(
          key.universeSeed.copy(),
          GeneratorVersion.V1,
        );

      for (
        let index = 0n;
        index < 2_048n;
        index += 1n
      ) {
        const locator =
          new SystemLocator(
            0n,
            0n,
            index,
          );

        const seed =
          ProceduralTargetResolver.resolveTargetSeed(
            physicalKey,
            locator,
          );

        if (
          StellarSystemMultiplicitySelector.select(
            physicalKey,
            seed as Parameters<
              typeof StellarSystemMultiplicitySelector.select
            >[1],
          ) === expected
        ) {
          return locator;
        }
      }

      throw new Error(
        `Missing deterministic ${expected.name} fixture in first 2048 objects.`,
      );
    }

    function findSingleSystemWithPlanets():
      SystemLocator {

      const key =
        v2GenerationKey();

      const physicalKey =
        new UniverseGenerationKey(
          key.universeSeed.copy(),
          GeneratorVersion.V1,
        );

      for (
        let index = 0n;
        index < 256n;
        index += 1n
      ) {
        const locator =
          new SystemLocator(
            0n,
            0n,
            index,
          );

        const seed =
          ProceduralTargetResolver.resolveTargetSeed(
            physicalKey,
            locator,
          );

        if (
          StellarSystemMultiplicitySelector.select(
            physicalKey,
            seed as Parameters<
              typeof StellarSystemMultiplicitySelector.select
            >[1],
          ) !==
          StellarSystemMultiplicity.SINGLE
        ) {
          continue;
        }

        const source =
          StellarMultihostFormation.generateV2SingleOrNull(
            key,
            locator,
          );

        if (
          source !== null &&
          source.planets.length > 0 &&
          source.planetarySystem !== null &&
          source.asteroidBelts !== null
        ) {
          return locator;
        }
      }

      throw new Error(
        'Missing deterministic V2 SINGLE fixture with planets in first 256 objects.',
      );
    }

    function knownGalacticObjectFamilyLocators():
      readonly GalacticObjectLocator[] {

      const byKind =
        new Map<
          ExplorationResultKind,
          GalacticObjectLocator
        >();

      for (
        let index =
          0n;
        index <
          1_024n;
        index +=
          1n
      ) {
        const locator =
          new GalacticObjectLocator(
            0n,
            0n,
            index,
          );

        const kind =
          ExplorationSectorResultEngine
            .resolveGalacticObjectKind(
              generationKey,
              locator,
            );

        if (
          kind ===
            ExplorationResultKind
              .STAR_CLUSTER ||
          kind ===
            ExplorationResultKind
              .NEBULA ||
          kind ===
            ExplorationResultKind
              .EXTREME_OBJECT
        ) {
          byKind.set(
            kind,
            locator,
          );
        }

        if (
          byKind.size ===
          3
        ) {
          break;
        }
      }

      const starCluster =
        byKind.get(
          ExplorationResultKind
            .STAR_CLUSTER,
        );
      const nebula =
        byKind.get(
          ExplorationResultKind
            .NEBULA,
        );
      const extreme =
        byKind.get(
          ExplorationResultKind
            .EXTREME_OBJECT,
        );

      if (
        starCluster ===
          undefined ||
        nebula ===
          undefined ||
        extreme ===
          undefined
      ) {
        throw new RangeError(
          'Missing deterministic broad galactic-object family fixture.',
        );
      }

      return Object.freeze([
        starCluster,
        nebula,
        extreme,
      ]);
    }
  },
);
