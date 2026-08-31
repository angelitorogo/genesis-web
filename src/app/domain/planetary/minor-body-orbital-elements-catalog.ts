import {
  type MinorBodyDynamicsState,
} from './minor-body-dynamics-state';

import {
  type MinorBodyGroundTruthObject,
} from './minor-body-ground-truth-inventory';

import {
  MinorBodyKind,
  type MinorBodyKindValue,
} from './minor-body-kind';

import {
  type MinorBodyOrbitalElements,
} from './minor-body-orbital-elements';

export interface MinorBodyOrbitalElementsCatalogEntry {
  readonly body:
    MinorBodyGroundTruthObject;

  readonly orbitalElements:
    MinorBodyOrbitalElements;
}

/**
 * Point-23.2 one-to-one normalized orbital view of a point-23.1 dynamics state.
 *
 * The catalog never creates or removes physical objects. Entry order and object
 * references must match the complete phase-22 Ground Truth inventory exactly.
 */
export class MinorBodyOrbitalElementsCatalog {

  readonly entries:
    readonly MinorBodyOrbitalElementsCatalogEntry[];

  constructor(
    readonly dynamicsState:
      MinorBodyDynamicsState,

    entries:
      readonly MinorBodyOrbitalElementsCatalogEntry[],
  ) {
    this.entries =
      Object.freeze([
        ...entries,
      ]);

    validateOneToOneCoverage(
      dynamicsState,
      this.entries,
    );
  }

  get existingObjectCount():
    number {
    return this.entries.length;
  }

  get boundObjectCount():
    number {
    return this.entries.filter(
      entry =>
        entry
          .orbitalElements
          .isBound,
    ).length;
  }

  get unboundObjectCount():
    number {
    return (
      this.existingObjectCount -
      this.boundObjectCount
    );
  }

  get retrogradeObjectCount():
    number {
    return this.entries.filter(
      entry =>
        entry
          .orbitalElements
          .isRetrograde,
    ).length;
  }

  find(
    kind:
      MinorBodyKindValue,

    proceduralId:
      string,
  ): MinorBodyOrbitalElementsCatalogEntry | null {
    return this.entries.find(
      entry =>
        entry.orbitalElements.kind ===
          kind &&
        entry.orbitalElements.proceduralId ===
          proceduralId,
    ) ?? null;
  }
}

function validateOneToOneCoverage(
  dynamicsState:
    MinorBodyDynamicsState,

  entries:
    readonly MinorBodyOrbitalElementsCatalogEntry[],
): void {
  const groundTruthEntries =
    dynamicsState
      .groundTruthInventory
      .entries;

  if (
    entries.length !==
    groundTruthEntries.length
  ) {
    throw new RangeError(
      'MinorBodyOrbitalElementsCatalog requires exactly one orbital entry for every existing Ground Truth minor body.',
    );
  }

  const keys =
    new Set<string>();

  for (
    let index = 0;
    index <
      entries.length;
    index += 1
  ) {
    const expected =
      groundTruthEntries[index];

    const actual =
      entries[index];

    if (
      actual.body !==
        expected.body ||
      actual.orbitalElements.kind !==
        expected.kind ||
      actual.orbitalElements.proceduralId !==
        expected.body.proceduralId ||
      actual.orbitalElements.localDesignation !==
        expected.body.localDesignation
    ) {
      throw new RangeError(
        'MinorBodyOrbitalElementsCatalog must preserve exact Ground Truth order, object reference, family and identity.',
      );
    }

    const key =
      `${actual.orbitalElements.kind.code}:${actual.orbitalElements.proceduralId}`;

    if (
      keys.has(
        key,
      )
    ) {
      throw new RangeError(
        `Duplicate point-23.2 orbital identity: ${key}.`,
      );
    }

    keys.add(
      key,
    );
  }

  if (
    entries.filter(
      entry =>
        !entry
          .orbitalElements
          .isBound,
    ).length !==
      dynamicsState.unboundMinorBodyCount ||
    entries.filter(
      entry =>
        entry
          .orbitalElements
          .isBound,
    ).length !==
      dynamicsState.boundMinorBodyCount
  ) {
    throw new RangeError(
      'Point-23.2 bound/unbound orbital counts must preserve the point-23.1 dynamics boundary.',
    );
  }

  for (
    const kind
    of MinorBodyKind.values
  ) {
    const expectedCount =
      groundTruthEntries.filter(
        entry =>
          entry.kind ===
          kind,
      ).length;

    const actualCount =
      entries.filter(
        entry =>
          entry.orbitalElements.kind ===
          kind,
      ).length;

    if (
      expectedCount !==
      actualCount
    ) {
      throw new RangeError(
        `Point-23.2 orbital family cardinality mismatch for ${kind.name}.`,
      );
    }
  }
}
