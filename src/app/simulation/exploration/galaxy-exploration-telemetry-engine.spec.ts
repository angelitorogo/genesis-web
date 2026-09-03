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
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  ExplorationSectorResultEngine,
} from './exploration-sector-result-engine';

import {
  GalaxyExplorationTelemetryEngine,
} from './galaxy-exploration-telemetry-engine';

describe(
  'GalaxyExplorationTelemetryEngine point 26.1',
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
