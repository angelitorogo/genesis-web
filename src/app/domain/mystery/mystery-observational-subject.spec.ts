import {
  UnknownPhenomenon, UnclassifiedSource, isMysteryIdentity,
} from './mystery-observational-subject';
import { CanonicalMysterySourceAssociation } from './canonical-mystery-source-association';

const SID = `UCS30-${'A'.repeat(32)}`;
const PID = `UPH30-${'B'.repeat(32)}`;
const UID = `U30-${'C'.repeat(32)}`;
const scope = { kind: 'UNLOCATED' as const, id: `USC30-${'D'.repeat(32)}` };

describe('30.1 mystery contracts have no hidden taxonomy in observed records', () => {
  it('defensively freezes the source, origin scope and public view', () => {
    const source = new UnclassifiedSource(SID, UID, scope);
    expect(source.toObservedRecord()).toEqual({ id: SID, scope, classification: 'UNCLASSIFIED' });
    expect(Object.isFrozen(source)).toBe(true);
    expect(Object.isFrozen(source.scope)).toBe(true);
    expect(Object.isFrozen(source.toObservedRecord())).toBe(true);
  });

  it('allows an unknown phenomenon without asserting any progenitor', () => {
    const phenomenon = new UnknownPhenomenon(PID, UID, scope);
    expect(phenomenon.toObservedRecord()).toEqual({
      id: PID, scope, classification: 'UNKNOWN_PHENOMENON', unclassifiedSourceId: null,
    });
    expect(JSON.stringify(phenomenon.toObservedRecord())).not.toContain('canonical');
  });

  it('rejects malformed ids, scopes, event ids and association kinds', () => {
    expect(isMysteryIdentity(SID)).toBe(true);
    expect(isMysteryIdentity('source-1')).toBe(false);
    expect(() => new UnclassifiedSource('source-1', UID, scope)).toThrow(RangeError);
    expect(() => new UnknownPhenomenon(PID, UID, { kind: 'BAD' as never, id: scope.id })).toThrow(RangeError);
    expect(() => new UnknownPhenomenon(PID, UID, scope, 'not-a-source')).toThrow(RangeError);
    expect(() => new CanonicalMysterySourceAssociation(SID, UID, { kind: 'CANONICAL_EVENT', eventId: ' ' })).toThrow(RangeError);
    expect(() => new CanonicalMysterySourceAssociation(SID, UID, { kind: 'PROCEDURAL_OBJECT', locator: {} as never })).toThrow(RangeError);
  });
});
