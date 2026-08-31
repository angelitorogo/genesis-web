import {
  MinorBodyKind,
} from './minor-body-kind';

import {
  MinorBodyKnowledgeRecord,
} from './minor-body-knowledge-record';

import {
  MinorBodyKnowledgeState,
} from './minor-body-knowledge-state';

describe(
  'MinorBodyKnowledgeRecord point 22.10',
  () => {
    it(
      'should persist only positive player knowledge and reject EXISTING records',
      () => {
        const record =
          new MinorBodyKnowledgeRecord(
            MinorBodyKind.COMET,
            '0123456789ABCDEFFEDCBA9876543210',
            MinorBodyKnowledgeState.DISCOVERED,
          );

        expect(
          record.key,
        ).toBe(
          '2:0123456789ABCDEFFEDCBA9876543210',
        );

        expect(
          () => new MinorBodyKnowledgeRecord(
            MinorBodyKind.COMET,
            '0123456789ABCDEFFEDCBA9876543210',
            MinorBodyKnowledgeState.EXISTING,
          ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
