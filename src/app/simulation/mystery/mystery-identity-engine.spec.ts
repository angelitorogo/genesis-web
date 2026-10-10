import {
  BodyLocator, GalaxyLocator, MoonLocator, SectorLocator, SystemLocator,
  GalacticObjectLocator,
} from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import {
  LocatedObservationObject, ObservationTransientCandidate,
  ObservationTransientCandidateId,
} from '../../domain/observation/observation-classification';
import { MysteryIdentityEngine as Engine } from './mystery-identity-engine';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const key = new UniverseGenerationKey(seed, GeneratorVersion.V2);
const located = new LocatedObservationObject(key, new SystemLocator(0n, -40n, 8n));
const candidate = new ObservationTransientCandidate(key, new ObservationTransientCandidateId(17n));

describe('30.1 stable observational mystery identities', () => {
  it('is deterministic for the same V2 seed, scope and signal independently of object allocation', () => {
    const a = Engine.createSource(located, 'OBS:RADIO-001');
    const b = Engine.createSource(
      new LocatedObservationObject(new UniverseGenerationKey(UniverseSeed.parse(seed.toString()), GeneratorVersion.V2),
        new SystemLocator(0n, -40n, 8n)),
      'obs:radio-001',
    );
    expect(a.id).toBe(b.id);
    expect(a.scope).toEqual(b.scope);
    expect(a.id).toMatch(/^UCS30-[A-F0-9]{32}$/);
  });

  it('retains the original observed origin for later map routing, without exposing it in public records', () => {
    const source = Engine.createSource(located, 'SKY-SIGNAL');
    const origin = Engine.associateObservedOrigin(source, located);
    expect(origin.originalSubject).toBe(located);
    expect(origin.originScope.id).toBe(source.scope.id);
    expect(source.toObservedRecord()).not.toHaveProperty('originalSubject');
    expect(() => Engine.associateObservedOrigin(source, candidate)).toThrow(RangeError);
  });

  it('separates generator versions and universe seeds (V1 compatibility, no collision)', () => {
    const v1 = new LocatedObservationObject(new UniverseGenerationKey(seed, GeneratorVersion.V1), new SystemLocator(0n, -40n, 8n));
    const otherSeed = new LocatedObservationObject(
      new UniverseGenerationKey(UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2'), GeneratorVersion.V2),
      new SystemLocator(0n, -40n, 8n),
    );
    expect(Engine.createSource(v1, 'SIGNAL').id).not.toBe(Engine.createSource(located, 'SIGNAL').id);
    expect(Engine.createSource(otherSeed, 'SIGNAL').id).not.toBe(Engine.createSource(located, 'SIGNAL').id);
  });

  it('distinguishes location, scope class and individual signal without using physical taxonomy', () => {
    const system = Engine.createSource(located, 'X');
    const other = Engine.createSource(new LocatedObservationObject(key, new SystemLocator(0n, -40n, 9n)), 'X');
    const galaxyObject = Engine.createSource(new LocatedObservationObject(key, new GalacticObjectLocator(0n, -40n, 8n)), 'X');
    const otherSignal = Engine.createSource(located, 'Y');
    expect(new Set([system.id, other.id, galaxyObject.id, otherSignal.id]).size).toBe(4);
    expect(system.scope.kind).toBe('SYSTEM');
    expect(galaxyObject.scope.kind).toBe('GALACTIC_OBJECT');
    expect(system.toObservedRecord().classification).toBe('UNCLASSIFIED');
  });

  it('supports galactic, sector and body anchors without inferring a source type', () => {
    const anchors = [
      new GalaxyLocator(0n), new SectorLocator(0n, -3n),
      new BodyLocator(0n, -3n, 2n, 5n),
    ];
    expect(anchors.map(locator => Engine.createSource(new LocatedObservationObject(key, locator), 'A').scope.kind))
      .toEqual(['GALAXY', 'SECTOR', 'BODY']);
  });

  it('creates genuinely UNLOCATED sources from the already defined observational transient subject', () => {
    const a = Engine.createSource(candidate, 'FRB-SIGNAL');
    const b = Engine.createSource(new ObservationTransientCandidate(key, new ObservationTransientCandidateId(18n)), 'FRB-SIGNAL');
    expect(a.scope.kind).toBe('UNLOCATED');
    expect(a.id).not.toBe(b.id);
    expect(a.toObservedRecord()).not.toHaveProperty('physicalType');
    expect(a.toObservedRecord()).not.toHaveProperty('canonicalTarget');
    expect(a.toObservedRecord()).not.toHaveProperty('generationKey');
  });

  it('creates separate phenomena, with or without a source, and keeps their identities stable', () => {
    const source = Engine.createSource(candidate, 'RADIO-01');
    const alone = Engine.createPhenomenon(candidate, 'PULSE-01');
    const linked = Engine.createPhenomenon(candidate, 'PULSE-01', source);
    expect(alone.id).toBe(linked.id);
    expect(alone.unclassifiedSourceId).toBeNull();
    expect(linked.unclassifiedSourceId).toBe(source.id);
    expect(linked.id).toMatch(/^UPH30-[A-F0-9]{32}$/);
    expect(linked.id).not.toBe(source.id);
  });

  it('refuses cross-universe/cross-scope phenomenon-to-source links', () => {
    const source = Engine.createSource(candidate, 'RADIO');
    expect(() => Engine.createPhenomenon(located, 'PULSE', source)).toThrow(RangeError);
    const otherKey = new UniverseGenerationKey(UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2'), GeneratorVersion.V2);
    const other = new ObservationTransientCandidate(otherKey, new ObservationTransientCandidateId(17n));
    expect(() => Engine.createPhenomenon(other, 'PULSE', source)).toThrow(RangeError);
  });

  it('accepts optional canonical object/event links without changing public identity or class', () => {
    const source = Engine.createSource(candidate, 'GAMMA');
    const observedBefore = JSON.stringify(source.toObservedRecord());
    const objectLink = Engine.associateCanonicalSource(source, key, {
      kind: 'PROCEDURAL_OBJECT', locator: new BodyLocator(0n, -5n, 1n, 2n),
    });
    const eventLink = Engine.associateCanonicalSource(source, key, { kind: 'CANONICAL_EVENT', eventId: 'SN-29.1-A' });
    expect(objectLink.unclassifiedSourceId).toBe(source.id);
    expect(eventLink.unclassifiedSourceId).toBe(source.id);
    expect(JSON.stringify(source.toObservedRecord())).toBe(observedBefore);
    expect(JSON.stringify(source.toObservedRecord())).not.toContain('SN-29.1-A');
    expect(JSON.stringify(source.toObservedRecord())).not.toContain('bodyIndex');
  });

  it('accepts a moon as an internal physical target without claiming the moon was observationally located', () => {
    const source = Engine.createSource(candidate, 'MYSTERY-1');
    const association = Engine.associateCanonicalSource(source, key, {
      kind: 'PROCEDURAL_OBJECT', locator: new MoonLocator(0n, -2n, 4n, 3n, 1n),
    });
    expect(association.target.kind).toBe('PROCEDURAL_OBJECT');
    expect(source.scope.kind).toBe('UNLOCATED');
  });

  it('rejects a physical association from another universe or generator version', () => {
    const source = Engine.createSource(candidate, 'MYSTERY');
    expect(() => Engine.associateCanonicalSource(source,
      new UniverseGenerationKey(seed, GeneratorVersion.V1),
      { kind: 'CANONICAL_EVENT', eventId: 'E-1' },
    )).toThrow(RangeError);
  });

  it('does not accept fabricated observation subjects, blank keys or time-dependent key material', () => {
    expect(() => Engine.createSource({} as never, 'REAL')).toThrow(RangeError);
    expect(() => Engine.createSource(located, '')).toThrow(RangeError);
    expect(() => Engine.createSource(located, ' bad key ')).toThrow(RangeError);
    expect(() => Engine.createPhenomenon(candidate, 'x'.repeat(129))).toThrow(RangeError);
  });

  it('is completely clock-independent and uses no PRNG or inferred physical family', () => {
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('Clock forbidden in 30.1'); });
    try {
      const a = Engine.createSource(candidate, 'RADIO-02');
      const b = Engine.createSource(candidate, 'RADIO-02');
      expect(a.id).toBe(b.id);
    } finally { clock.mockRestore(); }
  });
});
