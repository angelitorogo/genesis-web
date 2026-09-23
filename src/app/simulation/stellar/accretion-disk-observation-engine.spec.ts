import { describe, expect, it } from 'vitest';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { ScientificEvidence } from '../../domain/discovery/scientific-evidence';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GalaxyGenerator } from '../universe/galaxy-generator';
import { CompactAccretionEngine } from './compact-accretion-engine';
import { AccretionDiskObservationEngine, ACCRETION_DISK_OBSERVATION_RULE } from './accretion-disk-observation-engine';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');

function findGalaxyIndex(key: UniverseGenerationKey, active: boolean): bigint {
  for (let index = 0n; index < 512n; index++) {
    const exists = CompactAccretionEngine
      .fromExistingGalaxy(GalaxyGenerator.generate(key, index)) !== null;
    if (exists === active) return index;
  }
  throw new Error(`The regression seed must contain an ${active ? 'active' : 'inactive'} nucleus.`);
}

function observedEvidence(): ScientificEvidence {
  return new ScientificEvidence({
    dimensionCode: ACCRETION_DISK_OBSERVATION_RULE.dimensionCode,
    evidenceCode: ACCRETION_DISK_OBSERVATION_RULE.evidenceCode,
    independenceKey: ACCRETION_DISK_OBSERVATION_RULE.independenceKey,
    sourceKey: `${ACCRETION_DISK_OBSERVATION_RULE.sourceKey}:OPTICAL`,
    quality01: 0.8, uncertainty01: 0.1, observedAtEpochMs: 1000,
  });
}

describe('28.1 — existing active disks and observed provenance', () => {
  for (const version of [GeneratorVersion.V1, GeneratorVersion.V2]) {
    const key = new UniverseGenerationKey(seed, version);
    const activeIndex = findGalaxyIndex(key, true);
    const quietIndex = findGalaxyIndex(key, false);
    it(`uses a canonical active nucleus and disk in generator version ${version.code}, only after CONFIRMED`, () => {
      const existing = CompactAccretionEngine.fromExistingGalaxy(GalaxyGenerator.generate(key, activeIndex));
      expect(existing).not.toBeNull();
      expect(AccretionDiskObservationEngine.existingDiskOrNull(key, activeIndex, DiscoveryState.DETECTED)).toBeNull();
      expect(AccretionDiskObservationEngine.existingDiskOrNull(key, activeIndex, DiscoveryState.DISCOVERED)).toBeNull();
      expect(AccretionDiskObservationEngine.existingDiskOrNull(key, activeIndex, DiscoveryState.CATALOGUED)).toBeNull();
      expect(AccretionDiskObservationEngine.existingDiskOrNull(key, activeIndex, DiscoveryState.CONFIRMED))
        .toEqual(existing?.disk);
      expect(existing?.jet).toBeNull();
    });
    it(`never makes a disk for a quiet nucleus in version ${version.code}`, () => {
      expect(CompactAccretionEngine.fromExistingGalaxy(GalaxyGenerator.generate(key, quietIndex))).toBeNull();
      expect(AccretionDiskObservationEngine.existingDiskOrNull(key, quietIndex, DiscoveryState.CONFIRMED)).toBeNull();
    });
  }

  it('recognizes only the dedicated per-target, instrument-specific evidence, never an unrelated campaign', () => {
    const evidence = observedEvidence();
    expect(AccretionDiskObservationEngine.matchingEvidence([evidence])).toBe(evidence);
    expect(AccretionDiskObservationEngine.matchingEvidence([])).toBeNull();
    expect(AccretionDiskObservationEngine.matchingEvidence([new ScientificEvidence({
      dimensionCode: evidence.dimensionCode, evidenceCode: evidence.evidenceCode,
      independenceKey: 'OTHER_INDEPENDENCE', sourceKey: evidence.sourceKey,
      quality01: 0.8, uncertainty01: 0.1, observedAtEpochMs: 1000,
    })])).toBeNull();
    expect(AccretionDiskObservationEngine.matchingEvidence([new ScientificEvidence({
      dimensionCode: evidence.dimensionCode, evidenceCode: evidence.evidenceCode,
      independenceKey: evidence.independenceKey, sourceKey: 'NUCLEAR_DISK_CAMPAIGN:GAMMA_RAY',
      quality01: 0.8, uncertainty01: 0.1, observedAtEpochMs: 1000,
    })])).toBeNull();
  });
});
