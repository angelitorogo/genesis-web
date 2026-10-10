/**
 * Phase 30.1: an observational identity is not a physical classification.
 * All identifiers in this contract are opaque, versioned and deterministic.
 * In particular, scope ids do not disclose procedural locators.
 */
export type MysteryOriginScopeKind =
  | 'UNLOCATED'
  | 'GALAXY'
  | 'SECTOR'
  | 'GALACTIC_OBJECT'
  | 'SYSTEM'
  | 'BODY'
  | 'MOON'
  | 'CIVILIZATION';

export interface MysteryOriginScope {
  readonly kind: MysteryOriginScopeKind;
  /** Stable opaque reference to the observational region, not a physical source. */
  readonly id: string;
}

export interface ObservedUnclassifiedSource {
  readonly id: string;
  readonly scope: MysteryOriginScope;
  readonly classification: 'UNCLASSIFIED';
}

export interface ObservedUnknownPhenomenon {
  readonly id: string;
  readonly scope: MysteryOriginScope;
  readonly classification: 'UNKNOWN_PHENOMENON';
  readonly unclassifiedSourceId: string | null;
}

const ID_PATTERN = /^(?:UCS30|UPH30|USC30)-[A-F0-9]{32}$/;
const SCOPE_PATTERN = /^USC30-[A-F0-9]{32}$/;
const UNIVERSE_PATTERN = /^U30-[A-F0-9]{32}$/;
const SOURCE_PATTERN = /^UCS30-[A-F0-9]{32}$/;
const PHENOMENON_PATTERN = /^UPH30-[A-F0-9]{32}$/;
const KINDS: readonly MysteryOriginScopeKind[] = Object.freeze([
  'UNLOCATED', 'GALAXY', 'SECTOR', 'GALACTIC_OBJECT',
  'SYSTEM', 'BODY', 'MOON', 'CIVILIZATION',
]);

export function assertMysteryScope(scope: MysteryOriginScope): MysteryOriginScope {
  if (!scope || !KINDS.includes(scope.kind) || !SCOPE_PATTERN.test(scope.id)) {
    throw new RangeError('Unknown mystery origin scope or invalid opaque scope id.');
  }
  return Object.freeze({ kind: scope.kind, id: scope.id });
}

/** Source is unknown to the observer, regardless of what Ground Truth contains. */
export class UnclassifiedSource {
  readonly classification = 'UNCLASSIFIED' as const;
  readonly scope: MysteryOriginScope;

  constructor(
    readonly id: string,
    /** Internal generation scope; never part of an observed record. */
    readonly universeIdentity: string,
    scope: MysteryOriginScope,
  ) {
    if (!SOURCE_PATTERN.test(id) || !UNIVERSE_PATTERN.test(universeIdentity)) {
      throw new RangeError('UnclassifiedSource requires a stable 30.1 identity.');
    }
    this.scope = assertMysteryScope(scope);
    Object.freeze(this);
  }

  /** The only DTO intended for map, fiche, observatory and archive in 30.1. */
  toObservedRecord(): ObservedUnclassifiedSource {
    return Object.freeze({ id: this.id, scope: this.scope, classification: this.classification });
  }
}

/** A phenomenon can exist without any source association. */
export class UnknownPhenomenon {
  readonly classification = 'UNKNOWN_PHENOMENON' as const;
  readonly scope: MysteryOriginScope;

  constructor(
    readonly id: string,
    readonly universeIdentity: string,
    scope: MysteryOriginScope,
    readonly unclassifiedSourceId: string | null = null,
  ) {
    if (!PHENOMENON_PATTERN.test(id) || !UNIVERSE_PATTERN.test(universeIdentity)) {
      throw new RangeError('UnknownPhenomenon requires a stable 30.1 identity.');
    }
    if (unclassifiedSourceId !== null && !SOURCE_PATTERN.test(unclassifiedSourceId)) {
      throw new RangeError('UnknownPhenomenon source reference must be a 30.1 source id.');
    }
    this.scope = assertMysteryScope(scope);
    Object.freeze(this);
  }

  toObservedRecord(): ObservedUnknownPhenomenon {
    return Object.freeze({
      id: this.id, scope: this.scope,
      classification: this.classification,
      unclassifiedSourceId: this.unclassifiedSourceId,
    });
  }
}

/** Guard against silently reusing an incompatible persisted id format. */
export function isMysteryIdentity(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value);
}
