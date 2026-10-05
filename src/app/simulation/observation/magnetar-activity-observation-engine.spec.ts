import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { ExplorationResultKind } from '../../domain/exploration/exploration-sector-result';
import { ExtremeType } from '../../domain/galactic-object/extreme-object-type';
import { frozenPhysicalSourceKey } from '../../domain/generation/frozen-physical-source-key';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { GalacticObjectLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { ObservationActionType } from '../../domain/observation/observation-action';
import { ObservationInstrumentType } from '../../domain/observation/observation-instrument';
import { ObservationInstrumentLevel } from '../../domain/observation/observation-instrument-capability';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { ExplorationSectorResultEngine } from '../exploration/exploration-sector-result-engine';
import { ExtremeObjectTypeResolver } from '../galactic-object/extreme-object-type-resolver';
import { GalaxySectorContentGenerator } from '../sector/galaxy-sector-content-generator';
import { GalaxyGenerator } from '../universe/galaxy-generator';
import {
  MAGNETAR_ACTIVITY_EVIDENCE_CODE,
  MAGNETAR_ACTIVITY_EVIDENCE_DIMENSION,
  MagnetarActivityObservationEngine,
} from './magnetar-activity-observation-engine';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V2,
);
const magnetar = findMagnetar();

describe('28.4 magnetar high-energy observation engine', () => {
  it('publishes a profile only for a confirmed magnetar', () => {
    expect(MagnetarActivityObservationEngine.physicalProfileOrNull(
      key, magnetar, DiscoveryState.CATALOGUED,
    )).toBeNull();
    expect(MagnetarActivityObservationEngine.physicalProfileOrNull(
      key, magnetar, DiscoveryState.CONFIRMED,
    )?.extremeType).toBe(ExtremeType.MAGNETAR);
  });

  it('uses only X-ray/gamma level-4 temporal monitoring evidence', () => {
    for (const instrument of [ObservationInstrumentType.X_RAY, ObservationInstrumentType.GAMMA_RAY]) {
      const rule = MagnetarActivityObservationEngine.evidenceRule(instrument);
      expect(rule.observationActionType).toBe(ObservationActionType.TEMPORAL_MONITORING);
      expect(rule.minimumInstrumentLevel).toBe(ObservationInstrumentLevel.LEVEL_4);
      expect(rule.dimensionCode).toBe(MAGNETAR_ACTIVITY_EVIDENCE_DIMENSION);
      expect(rule.evidenceCode).toBe(MAGNETAR_ACTIVITY_EVIDENCE_CODE);
    }
    expect(() => MagnetarActivityObservationEngine.evidenceRule(
      ObservationInstrumentType.OPTICAL,
    )).toThrow(RangeError);
  });

  it('formats field, timing derivative and short-burst monitoring without claiming an interior field', () => {
    const profile = MagnetarActivityObservationEngine.physicalProfileOrNull(
      key, magnetar, DiscoveryState.CONFIRMED,
    )!;
    const facts = MagnetarActivityObservationEngine.measurementFacts(profile);
    expect(facts.some(f => f.label === 'Campo dipolar inferido')).toBe(true);
    expect(facts.some(f => f.label === 'Derivada del período')).toBe(true);
    expect(facts.some(f => f.label === 'Estallidos detectados')).toBe(true);
    expect(facts.map(f => f.label).join(' ')).not.toContain('interior');
  });
});

function findMagnetar(): GalacticObjectLocator {
  const galaxy = GalaxyGenerator.generate(key, 0n);
  const physicalKey = frozenPhysicalSourceKey(key);
  for (let x = -40; x <= 40; x += 1) {
    for (let y = -40; y <= 40; y += 1) {
      if (x === 0 && y === 0) continue;
      const content = GalaxySectorContentGenerator.generate(galaxy, { x, y });
      for (const locator of content.galacticObjectLocators) {
        if (ExplorationSectorResultEngine.resolveGalacticObjectKind(physicalKey, locator) !==
            ExplorationResultKind.EXTREME_OBJECT) continue;
        if (ExtremeObjectTypeResolver.resolve(key, locator) === ExtremeType.MAGNETAR) return locator;
      }
    }
  }
  throw new Error('Missing deterministic V2 magnetar fixture for 28.4.');
}
