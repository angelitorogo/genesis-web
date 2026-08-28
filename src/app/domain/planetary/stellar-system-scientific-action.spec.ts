import {
  DiscoveryState,
} from '../discovery/discovery-state';

import {
  ObservationActionType,
} from '../observation/observation-action';

import {
  ObservationInstrumentType,
} from '../observation/observation-instrument';

import {
  ObservationInstrumentLevel,
} from '../observation/observation-instrument-capability';

import {
  StellarSystemScientificActionAvailability,
  StellarSystemScientificActionRule,
  StellarSystemScientificActionType,
} from './stellar-system-scientific-action';

describe(
  'StellarSystemScientificActionRule',
  () => {
    const rule =
      new StellarSystemScientificActionRule(
        StellarSystemScientificActionType.ANALYZE_DISK,
        ObservationActionType.REOBSERVE,
        [
          ObservationInstrumentType.INFRARED,
          ObservationInstrumentType.RADIO,
        ],
        ObservationInstrumentLevel.LEVEL_2,
        DiscoveryState.CATALOGUED,
        DiscoveryState.CONFIRMED,
      );

    it(
      'should freeze ANALYZE DISK as a catalogued-to-confirmed system action',
      () => {
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

        expect(
          rule.compatibleInstrumentTypes,
        ).toEqual([
          ObservationInstrumentType.INFRARED,
          ObservationInstrumentType.RADIO,
        ]);
      },
    );

    it(
      'should derive availability only when every system/disk/instrument/state gate is satisfied',
      () => {
        const available =
          new StellarSystemScientificActionAvailability(
            rule,
            DiscoveryState.CATALOGUED,
            true,
            true,
            true,
            true,
            true,
            true,
          );

        const blocked =
          new StellarSystemScientificActionAvailability(
            rule,
            DiscoveryState.CATALOGUED,
            true,
            true,
            true,
            true,
            false,
            true,
          );

        expect(
          available.isAvailable,
        ).toBe(true);

        expect(
          blocked.isAvailable,
        ).toBe(false);
      },
    );

    it(
      'should reject rules that could reveal formation Ground Truth before CATALOGUED',
      () => {
        expect(
          () =>
            new StellarSystemScientificActionRule(
              StellarSystemScientificActionType.ANALYZE_DISK,
              ObservationActionType.REOBSERVE,
              [
                ObservationInstrumentType.INFRARED,
              ],
              ObservationInstrumentLevel.LEVEL_2,
              DiscoveryState.DISCOVERED,
              DiscoveryState.CONFIRMED,
            ),
        ).toThrowError(
          /must start at CATALOGUED/,
        );
      },
    );
  },
);
