import {
  type MinorBodyKindValue,
} from './minor-body-kind';

import {
  type MinorBodyKnowledgeProjection,
} from './minor-body-knowledge-projection';

import {
  MinorBodyKnowledgeState,
  type MinorBodyKnowledgeStateValue,
} from './minor-body-knowledge-state';

/**
 * Immutable point-22.10 system snapshot separating generated existence from
 * player-visible knowledge.
 */
export class MinorBodyKnowledgeSnapshot {

  readonly objects:
    readonly MinorBodyKnowledgeProjection[];

  constructor(
    objects:
      readonly MinorBodyKnowledgeProjection[],
  ) {
    this.objects = Object.freeze([
      ...objects,
    ]);

    const keys =
      new Set<string>();

    for (
      const object
      of this.objects
    ) {
      const key =
        `${object.kind.code}:${object.proceduralId}`;

      if (
        keys.has(
          key,
        )
      ) {
        throw new RangeError(
          `Duplicate minor-body knowledge projection: ${key}.`,
        );
      }

      keys.add(
        key,
      );
    }
  }

  get existingCount():
    number {
    return this.objects.length;
  }

  get undiscoveredExistingCount():
    number {
    return this.countState(
      MinorBodyKnowledgeState.EXISTING,
    );
  }

  get discoveredCount():
    number {
    return this.countState(
      MinorBodyKnowledgeState.DISCOVERED,
    );
  }

  get cataloguedCount():
    number {
    return this.countState(
      MinorBodyKnowledgeState.CATALOGUED,
    );
  }

  get knownCount():
    number {
    return this.discoveredCount +
      this.cataloguedCount;
  }

  get knownObjects():
    readonly MinorBodyKnowledgeProjection[] {
    return Object.freeze(
      this.objects.filter(
        object => object.isKnownToPlayer,
      ),
    );
  }

  get cataloguedObjects():
    readonly MinorBodyKnowledgeProjection[] {
    return Object.freeze(
      this.objects.filter(
        object => object.isCatalogued,
      ),
    );
  }

  countKind(
    kind:
      MinorBodyKindValue,
  ): number {
    return this.objects.filter(
      object => object.kind === kind,
    ).length;
  }

  find(
    kind:
      MinorBodyKindValue,

    proceduralId:
      string,
  ): MinorBodyKnowledgeProjection | null {
    return this.objects.find(
      object =>
        object.kind === kind &&
        object.proceduralId === proceduralId,
    ) ?? null;
  }

  private countState(
    state:
      MinorBodyKnowledgeStateValue,
  ): number {
    return this.objects.filter(
      object =>
        object.knowledgeState === state,
    ).length;
  }
}
