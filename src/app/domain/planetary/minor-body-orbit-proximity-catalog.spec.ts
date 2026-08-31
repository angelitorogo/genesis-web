import {
  BodyLocator,
} from '../generation/procedural-locator';

import {
  type MinorBodyOrbitalElementsCatalog,
} from './minor-body-orbital-elements-catalog';

import {
  MinorBodyOrbitProximityCatalog,
} from './minor-body-orbit-proximity-catalog';

import {
  type MoonSystem,
} from './moon-system';

import {
  type Planet,
} from './planet';

import {
  type PlanetarySystem,
} from './planetary-system';

describe(
  'MinorBodyOrbitProximityCatalog point 23.3',
  () => {
    it(
      'should preserve target coverage while reporting moon populations that have no individual orbit to assess',
      () => {
        const host =
          {
            planetCount:
              1,
          } as unknown as PlanetarySystem;

        const planet =
          {
            hostPlanetarySystem:
              host,
            planetOrdinal:
              1,
            locator:
              new BodyLocator(
                0n,
                0n,
                0n,
                0n,
              ),
          } as unknown as Planet;

        const moonSystem =
          {
            hostPlanet:
              planet,
            relevantMoons:
              Object.freeze([]),
            relevantMoonCount:
              0,
            unmaterializedMinorMoonCount:
              3,
          } as unknown as MoonSystem;

        const orbitalCatalog =
          {
            dynamicsState: {
              hostPlanetarySystem:
                host,
            },
            existingObjectCount:
              0,
            entries:
              Object.freeze([]),
          } as unknown as MinorBodyOrbitalElementsCatalog;

        const catalog =
          new MinorBodyOrbitProximityCatalog(
            orbitalCatalog,
            [
              planet,
            ],
            [
              moonSystem,
            ],
            [],
          );

        expect(
          catalog.planetTargetCount,
        ).toBe(1);

        expect(
          catalog.relevantMoonTargetCount,
        ).toBe(0);

        expect(
          catalog.unmaterializedMinorMoonCount,
        ).toBe(3);

        expect(
          catalog.assessmentCount,
        ).toBe(0);
      },
    );

    it(
      'should reject a MoonSystem that does not reference the exact Planet instance',
      () => {
        const host =
          {
            planetCount:
              1,
          } as unknown as PlanetarySystem;

        const planet =
          {
            hostPlanetarySystem:
              host,
            planetOrdinal:
              1,
          } as unknown as Planet;

        const otherPlanet =
          {
            hostPlanetarySystem:
              host,
            planetOrdinal:
              1,
          } as unknown as Planet;

        const orbitalCatalog =
          {
            dynamicsState: {
              hostPlanetarySystem:
                host,
            },
            existingObjectCount:
              0,
            entries:
              Object.freeze([]),
          } as unknown as MinorBodyOrbitalElementsCatalog;

        expect(
          () =>
            new MinorBodyOrbitProximityCatalog(
              orbitalCatalog,
              [
                planet,
              ],
              [
                {
                  hostPlanet:
                    otherPlanet,
                  relevantMoons:
                    [],
                  relevantMoonCount:
                    0,
                  unmaterializedMinorMoonCount:
                    0,
                } as unknown as MoonSystem,
              ],
              [],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
