import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { ExtremeType } from '../../domain/galactic-object/extreme-object-type';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { GalacticObjectLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { ObservationActionType } from '../../domain/observation/observation-action';
import { ObservationInstrumentType } from '../../domain/observation/observation-instrument';
import { ObservationInstrumentLevel } from '../../domain/observation/observation-instrument-capability';
import { ExtremeObjectTypeResolver } from '../galactic-object/extreme-object-type-resolver';
import { PulsarTimingObservationEngine, PULSAR_TIMING_OBSERVATION_INSTRUMENTS } from './pulsar-timing-observation-engine';
import { ExplorationResultKind } from '../../domain/exploration/exploration-sector-result';
import { frozenPhysicalSourceKey } from '../../domain/generation/frozen-physical-source-key';
import { ExplorationSectorResultEngine } from '../exploration/exploration-sector-result-engine';
import { GalaxySectorContentGenerator } from '../sector/galaxy-sector-content-generator';
import { GalaxyGenerator } from '../universe/galaxy-generator';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V2,
);
const pulsar = findPulsar();

describe('28.3 — synchronize / measure pulses observation contract', () => {
  it('requires a confirmed pulse-timing-capable target', () => {
    expect(PulsarTimingObservationEngine.physicalProfileOrNull(
      key, pulsar, DiscoveryState.CATALOGUED,
    )).toBeNull();
    expect(PulsarTimingObservationEngine.physicalProfileOrNull(
      key, pulsar, DiscoveryState.CONFIRMED,
    )).not.toBeNull();
  });

  it('uses the existing MEASURE_PERIOD vocabulary with radio/X-ray level 4', () => {
    expect(PULSAR_TIMING_OBSERVATION_INSTRUMENTS).toEqual([
      ObservationInstrumentType.RADIO,
      ObservationInstrumentType.X_RAY,
    ]);
    for (const instrument of PULSAR_TIMING_OBSERVATION_INSTRUMENTS) {
      const rule = PulsarTimingObservationEngine.evidenceRule(instrument);
      expect(rule.observationActionType).toBe(ObservationActionType.MEASURE_PERIOD);
      expect(rule.minimumInstrumentLevel).toBe(ObservationInstrumentLevel.LEVEL_4);
      expect(rule.compatibleInstrumentTypes).toEqual([instrument]);
    }
  });

  it('publishes timing only as measurement facts and does not infer 28.4 magnetic physics', () => {
    const profile = PulsarTimingObservationEngine.physicalProfileOrNull(
      key, pulsar, DiscoveryState.CONFIRMED,
    )!;
    const labels = PulsarTimingObservationEngine.measurementFacts(profile).map(fact => fact.label);
    expect(labels).toContain('Período de pulso');
    expect(labels).toContain('Frecuencia de pulsos');
    expect(labels.some(label => /campo|magnét|estallido/i.test(label))).toBe(false);
  });
});

function findPulsar(): GalacticObjectLocator {
  const galaxy = GalaxyGenerator.generate(key, 0n);
  const physicalKey = frozenPhysicalSourceKey(key);
  for (let x = -32; x <= 32; x += 1) {
    for (let y = -32; y <= 32; y += 1) {
      if (x === 0 && y === 0) continue;
      const content = GalaxySectorContentGenerator.generate(galaxy, { x, y });
      for (const locator of content.galacticObjectLocators) {
        if (ExplorationSectorResultEngine.resolveGalacticObjectKind(physicalKey, locator) !==
            ExplorationResultKind.EXTREME_OBJECT) continue;
        if (ExtremeObjectTypeResolver.resolve(key, locator) === ExtremeType.PULSAR) return locator;
      }
    }
  }
  throw new Error('Missing deterministic V2 pulsar fixture for 28.3.');
}
