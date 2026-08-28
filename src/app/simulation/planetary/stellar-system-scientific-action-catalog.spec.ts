import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ObservationActionType,
} from '../../domain/observation/observation-action';

import {
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  StellarSystemScientificActionType,
} from '../../domain/planetary/stellar-system-scientific-action';

import {
  StellarSystemScientificActionCatalogV1,
} from './stellar-system-scientific-action-catalog';

describe(
  'StellarSystemScientificActionCatalogV1',
  () => {
    it(
      'should freeze ANALYZE DISK as level-2 infrared/radio REOBSERVE',
      () => {
        const rule =
          StellarSystemScientificActionCatalogV1
            .rule(
              StellarSystemScientificActionType.ANALYZE_DISK,
            );

        expect(
          rule.observationActionType,
        ).toBe(
          ObservationActionType.REOBSERVE,
        );

        expect(
          rule.compatibleInstrumentTypes,
        ).toEqual([
          ObservationInstrumentType.INFRARED,
          ObservationInstrumentType.RADIO,
        ]);

        expect(
          rule.minimumInstrumentLevel,
        ).toBe(
          ObservationInstrumentLevel.LEVEL_2,
        );

        expect(
          rule.minimumDiscoveryState,
        ).toBe(
          DiscoveryState.CATALOGUED,
        );

        expect(
          rule.targetDiscoveryState,
        ).toBe(
          DiscoveryState.CONFIRMED,
        );
      },
    );
  },
);
