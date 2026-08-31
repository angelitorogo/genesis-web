import {
  type RelevantComet,
} from './relevant-comet';

import {
  MinorBodyKind,
} from './minor-body-kind';

import {
  MinorBodyKnowledgeProjection,
} from './minor-body-knowledge-projection';

import {
  MinorBodyKnowledgeState,
} from './minor-body-knowledge-state';

describe(
  'MinorBodyKnowledgeProjection point 22.10',
  () => {
    const comet = Object.freeze({
      proceduralId:
        '0123456789ABCDEFFEDCBA9876543210',
      localDesignation:
        'COM-001',
      isDiscoverable:
        true,
    }) as unknown as RelevantComet;

    it(
      'should keep EXISTING hidden while DISCOVERED and CATALOGUED become archive-visible',
      () => {
        const existing =
          new MinorBodyKnowledgeProjection(
            MinorBodyKind.COMET,
            comet,
            MinorBodyKnowledgeState.EXISTING,
          );

        const discovered =
          new MinorBodyKnowledgeProjection(
            MinorBodyKind.COMET,
            comet,
            MinorBodyKnowledgeState.DISCOVERED,
          );

        const catalogued =
          new MinorBodyKnowledgeProjection(
            MinorBodyKind.COMET,
            comet,
            MinorBodyKnowledgeState.CATALOGUED,
          );

        expect(
          existing.exists,
        ).toBe(true);
        expect(
          existing.isArchiveVisible,
        ).toBe(false);
        expect(
          discovered.isDiscovered,
        ).toBe(true);
        expect(
          discovered.isCatalogued,
        ).toBe(false);
        expect(
          catalogued.isCatalogued,
        ).toBe(true);

        expect(
          existing.body,
        ).toBe(comet);
        expect(
          discovered.body,
        ).toBe(comet);
        expect(
          catalogued.body,
        ).toBe(comet);
      },
    );
  },
);
