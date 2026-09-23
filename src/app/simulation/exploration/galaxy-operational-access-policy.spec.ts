import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GalaxyOperationalAccessMode,
  GalaxyOperationalAccessPolicy,
} from './galaxy-operational-access-policy';

describe(
  'GalaxyOperationalAccessPolicy',
  () => {
    it(
      'should keep an external visited galaxy on its fiche only',
      () => {
        const access =
          GalaxyOperationalAccessPolicy
            .evaluate(
              7n,
              DiscoveryState.VISITED,
            );

        expect(access.mode).toBe(
          GalaxyOperationalAccessMode.FICHE_ONLY,
        );
        expect(access.canOpenGalacticMap).toBe(false);
        expect(access.canExploreSectors).toBe(false);
      },
    );

    it(
      'should expose an external catalogued galaxy map in read-only mode',
      () => {
        const access =
          GalaxyOperationalAccessPolicy
            .evaluate(
              7n,
              DiscoveryState.CATALOGUED,
            );

        expect(access.mode).toBe(
          GalaxyOperationalAccessMode.MAP_READ_ONLY,
        );
        expect(access.canOpenGalacticMap).toBe(true);
        expect(access.canExploreSectors).toBe(false);
      },
    );

    it(
      'should enable full exploration only after external confirmation',
      () => {
        const access =
          GalaxyOperationalAccessPolicy
            .evaluate(
              7n,
              DiscoveryState.CONFIRMED,
            );

        expect(access.mode).toBe(
          GalaxyOperationalAccessMode.FULL_EXPLORATION,
        );
        expect(access.canOpenGalacticMap).toBe(true);
        expect(access.canExploreSectors).toBe(true);
        expect(access.usesOriginOperationalException).toBe(false);
      },
    );

    it(
      'should keep the known origin galaxy operational before confirmation',
      () => {
        const access =
          GalaxyOperationalAccessPolicy
            .evaluate(
              0n,
              DiscoveryState.DISCOVERED,
            );

        expect(access.mode).toBe(
          GalaxyOperationalAccessMode.FULL_EXPLORATION,
        );
        expect(access.canExploreSectors).toBe(true);
        expect(access.usesOriginOperationalException).toBe(true);
      },
    );

    it(
      'should not apply the origin exception while the origin is unknown',
      () => {
        const access =
          GalaxyOperationalAccessPolicy
            .evaluate(
              0n,
              DiscoveryState.UNKNOWN,
            );

        expect(access.mode).toBe(
          GalaxyOperationalAccessMode.FICHE_ONLY,
        );
        expect(access.canExploreSectors).toBe(false);
      },
    );
  },
);
