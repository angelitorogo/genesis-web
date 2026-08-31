import {
  MinorBodyKnowledgeState,
} from './minor-body-knowledge-state';

describe(
  'MinorBodyKnowledgeState point 22.10',
  () => {
    it(
      'should freeze EXISTING -> DISCOVERED -> CATALOGUED as the complete V1 projection',
      () => {
        expect(
          MinorBodyKnowledgeState.values,
        ).toEqual([
          MinorBodyKnowledgeState.EXISTING,
          MinorBodyKnowledgeState.DISCOVERED,
          MinorBodyKnowledgeState.CATALOGUED,
        ]);

        expect(
          MinorBodyKnowledgeState.isKnown(
            MinorBodyKnowledgeState.EXISTING,
          ),
        ).toBe(false);

        expect(
          MinorBodyKnowledgeState.isKnown(
            MinorBodyKnowledgeState.DISCOVERED,
          ),
        ).toBe(true);

        expect(
          MinorBodyKnowledgeState.isKnown(
            MinorBodyKnowledgeState.CATALOGUED,
          ),
        ).toBe(true);
      },
    );
  },
);
