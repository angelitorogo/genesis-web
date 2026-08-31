import {
  type MinorBodyGroundTruthInventory,
} from '../../domain/planetary/minor-body-ground-truth-inventory';

import {
  type MinorBodyKindValue,
} from '../../domain/planetary/minor-body-kind';

import {
  MinorBodyKnowledgeProjection,
} from '../../domain/planetary/minor-body-knowledge-projection';

import {
  MinorBodyKnowledgeRecord,
} from '../../domain/planetary/minor-body-knowledge-record';

import {
  MinorBodyKnowledgeSnapshot,
} from '../../domain/planetary/minor-body-knowledge-snapshot';

import {
  MinorBodyKnowledgeState,
} from '../../domain/planetary/minor-body-knowledge-state';

/**
 * Point-22.10 pure knowledge-state engine.
 *
 * Generation remains authoritative for existence. This engine overlays only
 * positive DISCOVERED/CATALOGUED records on those exact Ground Truth objects.
 * It consumes no entropy, derives no seed and never mutates a generated body.
 */
export class MinorBodyKnowledgeEngine {

  private constructor() {}

  static project(
    inventory:
      MinorBodyGroundTruthInventory,

    records:
      readonly MinorBodyKnowledgeRecord[],
  ): MinorBodyKnowledgeSnapshot {
    const recordByKey =
      validateAndIndexRecords(
        inventory,
        records,
      );

    return new MinorBodyKnowledgeSnapshot(
      inventory.entries.map(
        entry => {
          const key =
            knowledgeKey(
              entry.kind,
              entry.body.proceduralId,
            );

          const state =
            recordByKey.get(
              key,
            )?.state ??
            MinorBodyKnowledgeState.EXISTING;

          return new MinorBodyKnowledgeProjection(
            entry.kind,
            entry.body,
            state,
          );
        },
      ),
    );
  }

  static discover(
    inventory:
      MinorBodyGroundTruthInventory,

    records:
      readonly MinorBodyKnowledgeRecord[],

    kind:
      MinorBodyKindValue,

    proceduralId:
      string,
  ): readonly MinorBodyKnowledgeRecord[] {
    const indexed =
      validateAndIndexRecords(
        inventory,
        records,
      );

    assertExistingTarget(
      inventory,
      kind,
      proceduralId,
    );

    const key =
      knowledgeKey(
        kind,
        proceduralId,
      );

    if (
      indexed.has(
        key,
      )
    ) {
      return Object.freeze([
        ...records,
      ]);
    }

    return Object.freeze([
      ...records,
      new MinorBodyKnowledgeRecord(
        kind,
        proceduralId,
        MinorBodyKnowledgeState.DISCOVERED,
      ),
    ]);
  }

  static catalogue(
    inventory:
      MinorBodyGroundTruthInventory,

    records:
      readonly MinorBodyKnowledgeRecord[],

    kind:
      MinorBodyKindValue,

    proceduralId:
      string,
  ): readonly MinorBodyKnowledgeRecord[] {
    const indexed =
      validateAndIndexRecords(
        inventory,
        records,
      );

    assertExistingTarget(
      inventory,
      kind,
      proceduralId,
    );

    const key =
      knowledgeKey(
        kind,
        proceduralId,
      );

    const current =
      indexed.get(
        key,
      );

    if (
      current ===
      undefined
    ) {
      throw new RangeError(
        'A minor body must be DISCOVERED before it can become CATALOGUED.',
      );
    }

    if (
      current.state ===
      MinorBodyKnowledgeState.CATALOGUED
    ) {
      return Object.freeze([
        ...records,
      ]);
    }

    return Object.freeze(
      records.map(
        record =>
          record.key === key
            ? new MinorBodyKnowledgeRecord(
                kind,
                proceduralId,
                MinorBodyKnowledgeState.CATALOGUED,
              )
            : record,
      ),
    );
  }
}

function validateAndIndexRecords(
  inventory:
    MinorBodyGroundTruthInventory,

  records:
    readonly MinorBodyKnowledgeRecord[],
): ReadonlyMap<string, MinorBodyKnowledgeRecord> {
  const existingKeys =
    new Set(
      inventory.entries.map(
        entry => knowledgeKey(
          entry.kind,
          entry.body.proceduralId,
        ),
      ),
    );

  const indexed =
    new Map<string, MinorBodyKnowledgeRecord>();

  for (
    const record
    of records
  ) {
    if (
      indexed.has(
        record.key,
      )
    ) {
      throw new RangeError(
        `Duplicate minor-body knowledge record: ${record.key}.`,
      );
    }

    if (
      !existingKeys.has(
        record.key,
      )
    ) {
      throw new RangeError(
        `Minor-body knowledge record does not match current Ground Truth: ${record.key}.`,
      );
    }

    indexed.set(
      record.key,
      record,
    );
  }

  return indexed;
}

function assertExistingTarget(
  inventory:
    MinorBodyGroundTruthInventory,

  kind:
    MinorBodyKindValue,

  proceduralId:
    string,
): void {
  const exists =
    inventory.entries.some(
      entry =>
        entry.kind === kind &&
        entry.body.proceduralId === proceduralId,
    );

  if (
    !exists
  ) {
    throw new RangeError(
      'Cannot change player knowledge for a minor body that is absent from current Ground Truth.',
    );
  }
}

function knowledgeKey(
  kind:
    MinorBodyKindValue,

  proceduralId:
    string,
): string {
  return `${kind.code}:${proceduralId}`;
}
