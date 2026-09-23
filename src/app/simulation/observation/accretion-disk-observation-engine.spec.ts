import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { ObservationInstrumentType } from '../../domain/observation/observation-instrument';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { CompactAccretionEngine } from '../stellar/compact-accretion-engine';
import { GalaxyGenerator } from '../universe/galaxy-generator';
import { AccretionDiskObservationEngine as Engine } from './accretion-disk-observation-engine';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const v1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
const v2 = new UniverseGenerationKey(seed, GeneratorVersion.V2);

function findGalaxyIndex(
  key: UniverseGenerationKey,
  active: boolean,
): bigint {
  for (let index = 0n; index < 512n; index++) {
    const exists = CompactAccretionEngine
      .fromExistingGalaxy(GalaxyGenerator.generate(key, index)) !== null;
    if (exists === active) return index;
  }
  throw new Error(`The regression seed must contain an ${active ? 'active' : 'inactive'} nucleus.`);
}

const ACTIVE_V1 = findGalaxyIndex(v1, true);
const ACTIVE_V2 = findGalaxyIndex(v2, true);
const INACTIVE_V2 = findGalaxyIndex(v2, false);

describe('28.1 — physical-disk observation contract', () => {
  it('hides a genuine active disk until confirmed, without inventing a new source', () => {
    expect(['AGN', 'QUASAR']).toContain(GalaxyGenerator.generate(v2, ACTIVE_V2).nucleus?.state.name);
    for (const state of [DiscoveryState.UNKNOWN, DiscoveryState.DETECTED,
      DiscoveryState.DISCOVERED, DiscoveryState.VISITED, DiscoveryState.CATALOGUED]) {
      expect(Engine.physicalDiskOrNull(v2, ACTIVE_V2, state)).toBeNull();
    }
    const canonical = CompactAccretionEngine.fromExistingGalaxy(GalaxyGenerator.generate(v2, ACTIVE_V2));
    const confirmed = Engine.physicalDiskOrNull(v2, ACTIVE_V2, DiscoveryState.CONFIRMED);
    expect(confirmed).not.toBeNull();
    expect(confirmed).toEqual(canonical?.disk);
    expect(canonical?.jet).toBeNull();
  });

  it('does not fabricate a disk for an inactive or absent canonical nucleus', () => {
    expect(CompactAccretionEngine.fromExistingGalaxy(GalaxyGenerator.generate(v2, INACTIVE_V2))).toBeNull();
    expect(Engine.physicalDiskOrNull(v2, INACTIVE_V2, DiscoveryState.CONFIRMED)).toBeNull();
  });

  it('keeps each version deterministic and labels all reported magnitudes as model estimates', () => {
    expect(Engine.physicalDiskOrNull(v1, ACTIVE_V1, DiscoveryState.CONFIRMED)).not.toBeNull();
    const current = Engine.physicalDiskOrNull(v2, ACTIVE_V2, DiscoveryState.CONFIRMED)!;
    expect(Engine.physicalDiskOrNull(v2, ACTIVE_V2, DiscoveryState.CONFIRMED)).toEqual(current);
    expect(Engine.modelFacts(current)).toHaveLength(6);
    expect(Engine.modelFacts(current).every(fact =>
      fact.label.toLowerCase().includes('modelo') ||
      fact.label.toLowerCase().includes('referencia') ||
      fact.label.toLowerCase().includes('ilustrativo') ||
      fact.label.toLowerCase().includes('no rotante'))).toBe(true);
    const rule = Engine.evidenceRule(ObservationInstrumentType.SPECTROSCOPY);
    expect(rule.minimumInstrumentLevel.rank).toBe(3);
    expect(() => Engine.evidenceRule(ObservationInstrumentType.OPTICAL)).toThrow();
  });
});
