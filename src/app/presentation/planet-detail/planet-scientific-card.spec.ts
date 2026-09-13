import {
  vi,
} from 'vitest';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  BodyLocator,
} from '../../domain/generation/procedural-locator';

import {
  PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

import {
  ArchiveDiscoveryLocatorKind,
  type ArchiveDiscoveryDetailModel,
} from '../genesis-archive/archive-discovery-detail.facade';

import {
  PlanetScientificCardAssembler,
  PlanetScientificFicheResolutionKind,
  type PlanetScientificIdentityResolver,
} from './planet-scientific-card';

describe(
  'PlanetScientificCardAssembler point 26.3',
  () => {

    it(
      'should keep the planet resolver behind the host-system CONFIRMED boundary',
      () => {
        const resolve =
          vi.fn();

        const resolver:
          PlanetScientificIdentityResolver =
          Object.freeze({
            resolve,
          });

        const result =
          PlanetScientificCardAssembler
            .build(
              systemModel(
                DiscoveryState.CATALOGUED,
              ),
              0n,
              resolver,
            );

        expect(result.kind).toBe(
          PlanetScientificFicheResolutionKind.LOCKED,
        );
        expect(resolve).not.toHaveBeenCalled();
      },
    );

    it(
      'should expose only the 26.3 identity/context layer after system confirmation',
      () => {
        const resolver:
          PlanetScientificIdentityResolver =
          Object.freeze({
            resolve:
              vi.fn(
                () =>
                  Object.freeze({
                    locator:
                      new BodyLocator(
                        3n,
                        -17n,
                        8n,
                        0n,
                      ),
                    planetOrdinal:
                      1,
                    designation:
                      'Jotheria b',
                    hostSystemDesignation:
                      'Jotheria',
                    orbitTopology:
                      PlanetarySystemOrbitTopology.CIRCUMBINARY,
                    hostPlanetCount:
                      4,
                  }),
              ),
          });

        const result =
          PlanetScientificCardAssembler
            .build(
              systemModel(
                DiscoveryState.CONFIRMED,
              ),
              0n,
              resolver,
            );

        expect(result.kind).toBe(
          PlanetScientificFicheResolutionKind.AVAILABLE,
        );

        if (
          result.kind !==
            PlanetScientificFicheResolutionKind.AVAILABLE
        ) {
          throw new Error(
            'Expected available planet fiche.',
          );
        }

        expect(result.card.title).toBe(
          'Jotheria b',
        );
        expect(result.card.planetOrdinal).toBe(1);
        expect(result.card.orbitTopologyLabel).toBe(
          'Circumbinaria',
        );
        expect(result.card.locatorLabel).toBe(
          'G3 / S-17 / O8 / B0',
        );

        expect(
          result.card.bodyIndex,
        ).toBe(
          0n,
        );

        const serialized =
          JSON.stringify(
            result.card,
            (_key, value) =>
              typeof value ===
                'bigint'
                ? value.toString(10)
                : value,
          );

        for (
          const forbidden
          of [
            'bodySeed',
            'systemSeed',
            'massEarth',
            'radiusEarth',
            'densityGramsPerCubicCentimeter',
            'atmosphere',
            'climate',
            'geology',
            'magnetosphere',
            'radiation',
          ]
        ) {
          expect(serialized).not.toContain(
            forbidden,
          );
        }
      },
    );

    it(
      'should reject invalid or missing mature planet indices without inventing a target',
      () => {
        const resolver:
          PlanetScientificIdentityResolver =
          Object.freeze({
            resolve:
              vi.fn(
                () =>
                  null,
              ),
          });

        const negative =
          PlanetScientificCardAssembler
            .build(
              systemModel(
                DiscoveryState.CONFIRMED,
              ),
              -1n,
              resolver,
            );

        expect(negative.kind).toBe(
          PlanetScientificFicheResolutionKind.NOT_FOUND,
        );
        expect(resolver.resolve).not.toHaveBeenCalled();

        const missing =
          PlanetScientificCardAssembler
            .build(
              systemModel(
                DiscoveryState.CONFIRMED,
              ),
              99n,
              resolver,
            );

        expect(missing.kind).toBe(
          PlanetScientificFicheResolutionKind.NOT_FOUND,
        );
        expect(resolver.resolve).toHaveBeenCalledTimes(1);
      },
    );
  },
);

function systemModel(
  state:
    typeof DiscoveryState.CATALOGUED |
    typeof DiscoveryState.CONFIRMED,
): ArchiveDiscoveryDetailModel {

  return {
    universeSeed:
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    generatorVersionCode:
      1,
    locatorKind:
      ArchiveDiscoveryLocatorKind.SYSTEM,
    discoveryState:
      state,
    discoveryStateLabel:
      state.name,
    galaxyIndex:
      3n,
    sectorKey:
      -17n,
    galacticObjectIndex:
      8n,
    stellarSystemCard:
      {
        title:
          'Jotheria',
      },
  } as unknown as ArchiveDiscoveryDetailModel;
}
