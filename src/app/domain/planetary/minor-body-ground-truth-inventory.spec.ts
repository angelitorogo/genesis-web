import {
  type RelevantAsteroid,
} from './relevant-asteroid';

import {
  type RelevantCapturedExtrasolarObject,
} from './relevant-captured-extrasolar-object';

import {
  type RelevantComet,
} from './relevant-comet';

import {
  type RelevantInterstellarObject,
} from './relevant-interstellar-object';

import {
  MinorBodyGroundTruthInventory,
} from './minor-body-ground-truth-inventory';

import {
  type RelevantTransNeptunianObject,
} from './relevant-trans-neptunian-object';

describe(
  'MinorBodyGroundTruthInventory point 22.10',
  () => {
    it(
      'should flatten all five individually addressable phase-22 families without changing their bodies',
      () => {
        const asteroid =
          body(
            '00000000000000000000000000000001',
            'AST-IN-001',
          ) as unknown as RelevantAsteroid;

        const comet =
          body(
            '00000000000000000000000000000002',
            'COM-001',
          ) as unknown as RelevantComet;

        const tno =
          body(
            '00000000000000000000000000000003',
            'TNO-001',
          ) as unknown as RelevantTransNeptunianObject;

        const iso =
          body(
            '00000000000000000000000000000004',
            'ISO-001',
          ) as unknown as RelevantInterstellarObject;

        const captured =
          body(
            '00000000000000000000000000000005',
            'XCAP-001',
          ) as unknown as RelevantCapturedExtrasolarObject;

        const inventory =
          new MinorBodyGroundTruthInventory(
            [asteroid],
            [comet],
            [tno],
            [iso],
            [captured],
          );

        expect(
          inventory.existingObjectCount,
        ).toBe(5);

        expect(
          inventory.entries.map(
            entry => entry.body,
          ),
        ).toEqual([
          asteroid,
          comet,
          tno,
          iso,
          captured,
        ]);
      },
    );
  },
);

function body(
  proceduralId:
    string,

  localDesignation:
    string,
) {
  return Object.freeze({
    proceduralId,
    localDesignation,
    isDiscoverable: true,
  });
}
