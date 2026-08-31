import {
  MinorBodyGroundTruthInventory,
} from '../../domain/planetary/minor-body-ground-truth-inventory';

import {
  MinorBodyKind,
} from '../../domain/planetary/minor-body-kind';

import {
  MinorBodyKnowledgeRecord,
} from '../../domain/planetary/minor-body-knowledge-record';

import {
  MinorBodyKnowledgeState,
} from '../../domain/planetary/minor-body-knowledge-state';

import {
  type RelevantAsteroid,
} from '../../domain/planetary/relevant-asteroid';

import {
  type RelevantCapturedExtrasolarObject,
} from '../../domain/planetary/relevant-captured-extrasolar-object';

import {
  type RelevantComet,
} from '../../domain/planetary/relevant-comet';

import {
  type RelevantInterstellarObject,
} from '../../domain/planetary/relevant-interstellar-object';

import {
  type RelevantTransNeptunianObject,
} from '../../domain/planetary/relevant-trans-neptunian-object';

import {
  MinorBodyKnowledgeEngine,
} from './minor-body-knowledge-engine';

describe(
  'MinorBodyKnowledgeEngine point 22.10',
  () => {
    const asteroid =
      body(
        '00000000000000000000000000000001',
        'AST-IN-001',
        615.9,
      ) as unknown as RelevantAsteroid;

    const comet =
      body(
        '00000000000000000000000000000002',
        'COM-001',
        44.6,
      ) as unknown as RelevantComet;

    const tno =
      body(
        '00000000000000000000000000000003',
        'TNO-001',
        1882,
      ) as unknown as RelevantTransNeptunianObject;

    const iso =
      body(
        '00000000000000000000000000000004',
        'ISO-001',
        10.5,
      ) as unknown as RelevantInterstellarObject;

    const captured =
      body(
        '00000000000000000000000000000005',
        'XCAP-001',
        2.1,
      ) as unknown as RelevantCapturedExtrasolarObject;

    const inventory =
      new MinorBodyGroundTruthInventory(
        [asteroid],
        [comet],
        [tno],
        [iso],
        [captured],
      );

    it(
      'should project absent records as EXISTING and preserve exact physical object references across knowledge states',
      () => {
        const records = [
          new MinorBodyKnowledgeRecord(
            MinorBodyKind.COMET,
            comet.proceduralId,
            MinorBodyKnowledgeState.DISCOVERED,
          ),
          new MinorBodyKnowledgeRecord(
            MinorBodyKind.TRANS_NEPTUNIAN_OBJECT,
            tno.proceduralId,
            MinorBodyKnowledgeState.CATALOGUED,
          ),
        ];

        const snapshot =
          MinorBodyKnowledgeEngine.project(
            inventory,
            records,
          );

        expect(
          snapshot.existingCount,
        ).toBe(5);
        expect(
          snapshot.undiscoveredExistingCount,
        ).toBe(3);
        expect(
          snapshot.discoveredCount,
        ).toBe(1);
        expect(
          snapshot.cataloguedCount,
        ).toBe(1);

        expect(
          snapshot.find(
            MinorBodyKind.ASTEROID,
            asteroid.proceduralId,
          )?.knowledgeState,
        ).toBe(
          MinorBodyKnowledgeState.EXISTING,
        );

        expect(
          snapshot.find(
            MinorBodyKind.COMET,
            comet.proceduralId,
          )?.body,
        ).toBe(
          comet,
        );

        expect(
          snapshot.find(
            MinorBodyKind.COMET,
            comet.proceduralId,
          )?.body.diameterKilometers,
        ).toBe(44.6);
      },
    );

    it(
      'should enforce monotonic EXISTING -> DISCOVERED -> CATALOGUED transitions without allowing catalogue-before-discovery',
      () => {
        expect(
          () => MinorBodyKnowledgeEngine.catalogue(
            inventory,
            [],
            MinorBodyKind.ASTEROID,
            asteroid.proceduralId,
          ),
        ).toThrow(
          RangeError,
        );

        const discovered =
          MinorBodyKnowledgeEngine.discover(
            inventory,
            [],
            MinorBodyKind.ASTEROID,
            asteroid.proceduralId,
          );

        expect(
          discovered,
        ).toHaveLength(1);
        expect(
          discovered[0].state,
        ).toBe(
          MinorBodyKnowledgeState.DISCOVERED,
        );

        const catalogued =
          MinorBodyKnowledgeEngine.catalogue(
            inventory,
            discovered,
            MinorBodyKind.ASTEROID,
            asteroid.proceduralId,
          );

        expect(
          catalogued[0].state,
        ).toBe(
          MinorBodyKnowledgeState.CATALOGUED,
        );

        const snapshot =
          MinorBodyKnowledgeEngine.project(
            inventory,
            catalogued,
          );

        expect(
          snapshot.find(
            MinorBodyKind.ASTEROID,
            asteroid.proceduralId,
          )?.body,
        ).toBe(
          asteroid,
        );
      },
    );

    it(
      'should reject knowledge records for procedural IDs that do not exist in current Ground Truth',
      () => {
        expect(
          () => MinorBodyKnowledgeEngine.project(
            inventory,
            [
              new MinorBodyKnowledgeRecord(
                MinorBodyKind.COMET,
                'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
                MinorBodyKnowledgeState.DISCOVERED,
              ),
            ],
          ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function body(
  proceduralId:
    string,

  localDesignation:
    string,

  diameterKilometers:
    number,
) {
  return Object.freeze({
    proceduralId,
    localDesignation,
    diameterKilometers,
    isDiscoverable: true,
  });
}
