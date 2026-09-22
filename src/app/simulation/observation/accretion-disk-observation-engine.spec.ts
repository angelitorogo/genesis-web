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

// Fixed indices from the canonical seed, not injected fake physical objects.
const ACTIVE_AGN = 20n;
const INACTIVE = 1n;

describe('28.1 — physical-disk observation contract', () => {
  it('hides a genuine active disk until confirmed, without inventing a new source', () => {
    expect(GalaxyGenerator.generate(v2, ACTIVE_AGN).nucleus?.state.name).toBe('AGN');
    for (const state of [DiscoveryState.UNKNOWN, DiscoveryState.DETECTED,
      DiscoveryState.DISCOVERED, DiscoveryState.VISITED, DiscoveryState.CATALOGUED]) {
      expect(Engine.physicalDiskOrNull(v2, ACTIVE_AGN, state)).toBeNull();
    }
    const canonical = CompactAccretionEngine.fromExistingGalaxy(GalaxyGenerator.generate(v2, ACTIVE_AGN));
    const confirmed = Engine.physicalDiskOrNull(v2, ACTIVE_AGN, DiscoveryState.CONFIRMED);
    expect(confirmed).not.toBeNull();
    expect(confirmed).toEqual(canonical?.disk);
    expect(canonical?.jet).toBeNull();
  });

  it('does not fabricate a disk for an inactive or absent canonical nucleus', () => {
    expect(CompactAccretionEngine.fromExistingGalaxy(GalaxyGenerator.generate(v2, INACTIVE))).toBeNull();
    expect(Engine.physicalDiskOrNull(v2, INACTIVE, DiscoveryState.CONFIRMED)).toBeNull();
  });

  it('retains V1/V2 scientific parity and labels all reported magnitudes as model estimates', () => {
    const old = Engine.physicalDiskOrNull(v1, ACTIVE_AGN, DiscoveryState.CONFIRMED)!;
    const current = Engine.physicalDiskOrNull(v2, ACTIVE_AGN, DiscoveryState.CONFIRMED)!;
    expect(current.massSolar).toBe(old.massSolar);
    expect(current.eddingtonRatio).toBe(old.eddingtonRatio);
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
