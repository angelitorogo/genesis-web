import {
  SCIENTIFIC_ROUTE_UNIVERSE_QUERY_PARAM,
  isScientificRouteUniverseRef,
  scientificRouteQueryParams,
  scientificRouteUniverseRef,
} from './scientific-route-identity';

describe(
  'scientific route identity point 26.10',
  () => {

    const universeSeed =
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1';

    it(
      'should expose a stable opaque reference instead of the raw universe seed',
      () => {
        const routeRef =
          scientificRouteUniverseRef(
            universeSeed,
            1,
          );

        expect(
          routeRef,
        ).toBe(
          '96F17ABD83F31EF747FC750C996EB1C2',
        );
        expect(
          isScientificRouteUniverseRef(
            routeRef,
          ),
        ).toBe(true);
        expect(
          routeRef,
        ).not.toContain(
          universeSeed,
        );
        expect(
          scientificRouteUniverseRef(
            universeSeed,
            2,
          ),
        ).not.toBe(
          routeRef,
        );
      },
    );

    it(
      'should build the only public query parameter required by phase-26 scientific routes',
      () => {
        expect(
          SCIENTIFIC_ROUTE_UNIVERSE_QUERY_PARAM,
        ).toBe(
          'u',
        );
        expect(
          scientificRouteQueryParams(
            universeSeed,
            1,
          ),
        ).toEqual({
          u:
            '96F17ABD83F31EF747FC750C996EB1C2',
        });
      },
    );

    it(
      'should reject malformed public route references',
      () => {
        expect(
          isScientificRouteUniverseRef(
            null,
          ),
        ).toBe(false);
        expect(
          isScientificRouteUniverseRef(
            universeSeed,
          ),
        ).toBe(false);
        expect(
          isScientificRouteUniverseRef(
            '96f17abd83f31ef747fc750c996eb1c2',
          ),
        ).toBe(false);
      },
    );
  },
);
