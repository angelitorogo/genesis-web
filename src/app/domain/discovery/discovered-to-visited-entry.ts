/**
 * Interaction surfaces that can legitimately record the VISITED milestone
 * under point 26.A.4.
 *
 * Merely resolving a route is not scientific evidence. These values identify
 * an explicit entry into either the object's scene or its detailed fiche.
 */
export const DiscoveredToVisitedEntryKind =
  Object.freeze({
    SCENE:
      'SCENE',

    DETAILED_CARD:
      'DETAILED_CARD',
  } as const);

export type DiscoveredToVisitedEntryKindValue =
  typeof DiscoveredToVisitedEntryKind[
    keyof typeof DiscoveredToVisitedEntryKind
  ];

const ENTRY_KINDS:
  readonly DiscoveredToVisitedEntryKindValue[] =
    Object.freeze([
      DiscoveredToVisitedEntryKind.SCENE,
      DiscoveredToVisitedEntryKind.DETAILED_CARD,
    ]);

/**
 * Point-26.A.4 interaction marker.
 *
 * It intentionally carries no physical/scientific payload. VISITED records
 * that the player entered a valid detailed interaction surface; it does not
 * manufacture new Ground Truth or scientific evidence.
 */
export class DiscoveredToVisitedEntry {

  constructor(
    readonly kind:
      DiscoveredToVisitedEntryKindValue,
  ) {

    if (
      !ENTRY_KINDS
        .includes(
          kind,
        )
    ) {
      throw new RangeError(
        `Unknown point-26.A.4 detailed-entry kind: ${String(kind)}.`,
      );
    }

    Object.freeze(
      this,
    );
  }
}
