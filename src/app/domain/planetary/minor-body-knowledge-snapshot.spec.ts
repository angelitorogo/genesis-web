import {
  type RelevantAsteroid,
} from './relevant-asteroid';

import {
  MinorBodyKind,
} from './minor-body-kind';

import {
  MinorBodyKnowledgeProjection,
} from './minor-body-knowledge-projection';

import {
  MinorBodyKnowledgeSnapshot,
} from './minor-body-knowledge-snapshot';

import {
  MinorBodyKnowledgeState,
} from './minor-body-knowledge-state';

describe(
  'MinorBodyKnowledgeSnapshot point 22.10',
  () => {
    it(
      'should count Ground Truth existence separately from current player knowledge',
      () => {
        const objects = [
          projection(
            '00000000000000000000000000000001',
            MinorBodyKnowledgeState.EXISTING,
          ),
          projection(
            '00000000000000000000000000000002',
            MinorBodyKnowledgeState.DISCOVERED,
          ),
          projection(
            '00000000000000000000000000000003',
            MinorBodyKnowledgeState.CATALOGUED,
          ),
        ];

        const snapshot =
          new MinorBodyKnowledgeSnapshot(
            objects,
          );

        expect(
          snapshot.existingCount,
        ).toBe(3);
        expect(
          snapshot.undiscoveredExistingCount,
        ).toBe(1);
        expect(
          snapshot.discoveredCount,
        ).toBe(1);
        expect(
          snapshot.cataloguedCount,
        ).toBe(1);
        expect(
          snapshot.knownCount,
        ).toBe(2);
        expect(
          snapshot.knownObjects,
        ).toHaveLength(2);
      },
    );
  },
);

function projection(
  proceduralId:
    string,

  state:
    typeof MinorBodyKnowledgeState.EXISTING |
    typeof MinorBodyKnowledgeState.DISCOVERED |
    typeof MinorBodyKnowledgeState.CATALOGUED,
): MinorBodyKnowledgeProjection {
  const body = Object.freeze({
    proceduralId,
    localDesignation:
      'AST-IN-001',
    isDiscoverable:
      true,
  }) as unknown as RelevantAsteroid;

  return new MinorBodyKnowledgeProjection(
    MinorBodyKind.ASTEROID,
    body,
    state,
  );
}
