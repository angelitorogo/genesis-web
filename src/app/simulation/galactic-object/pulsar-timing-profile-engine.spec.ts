import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { ExplorationResultKind } from '../../domain/exploration/exploration-sector-result';
import { ExtremeType, type ExtremeType as ExtremeTypeValue } from '../../domain/galactic-object/extreme-object-type';
import { frozenPhysicalSourceKey } from '../../domain/generation/frozen-physical-source-key';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { GalacticObjectLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { ExplorationSectorResultEngine } from '../exploration/exploration-sector-result-engine';
import { GalaxySectorContentGenerator } from '../sector/galaxy-sector-content-generator';
import { GalaxyGenerator } from '../universe/galaxy-generator';
import { ExtremeObjectTypeResolver } from './extreme-object-type-resolver';
import { GalacticPulsarTimingProfileEngine } from './pulsar-timing-profile-engine';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V2,
);

const pulseTypes: readonly ExtremeTypeValue[] = Object.freeze([
  ExtremeType.PULSAR,
  ExtremeType.MILLISECOND_PULSAR,
  ExtremeType.MAGNETAR,
  ExtremeType.X_RAY_BINARY_NS,
]);

const fixtures = pulseTypes.map(type => [type, findExtreme(type)] as const);

describe('28.3 — deterministic pulse timing Ground Truth', () => {
  it('stays completely hidden before CONFIRMED', () => {
    for (const [, locator] of fixtures) {
      for (const state of [DiscoveryState.DETECTED, DiscoveryState.DISCOVERED, DiscoveryState.CATALOGUED]) {
        expect(GalacticPulsarTimingProfileEngine.resolveConfirmed(key, locator, state)).toBeNull();
      }
    }
  });

  it('derives stable physical timing without reading A-H renderer presets', () => {
    for (const [type, locator] of fixtures) {
      const first = GalacticPulsarTimingProfileEngine.resolveConfirmed(key, locator, DiscoveryState.CONFIRMED);
      const second = GalacticPulsarTimingProfileEngine.resolveConfirmed(key, locator, DiscoveryState.CONFIRMED);
      expect(first).not.toBeNull();
      expect(second).toEqual(first);
      expect(first!.extremeType).toBe(type);
      expect(first!.pulsePeriodSeconds).toBeGreaterThan(0);
      expect(first!.pulseFrequencyHz).toBeCloseTo(1 / first!.pulsePeriodSeconds, 8);
      expect(first!.pulseWidthSeconds).toBeGreaterThan(0);
      expect(first!.pulseWidthSeconds).toBeLessThan(first!.pulsePeriodSeconds);
      expect(first!.synchronizedPulseCount).toBeGreaterThan(0);
      expect(first!.referencePhase01).toBeGreaterThanOrEqual(0);
      expect(first!.referencePhase01).toBeLessThan(1);
    }
  });

  it('keeps the established ordinary and millisecond period envelopes distinct', () => {
    const ordinary = GalacticPulsarTimingProfileEngine.resolveConfirmed(
      key, fixtures.find(([type]) => type === ExtremeType.PULSAR)![1], DiscoveryState.CONFIRMED,
    )!;
    const millisecond = GalacticPulsarTimingProfileEngine.resolveConfirmed(
      key, fixtures.find(([type]) => type === ExtremeType.MILLISECOND_PULSAR)![1], DiscoveryState.CONFIRMED,
    )!;
    expect(ordinary.pulsePeriodSeconds).toBeGreaterThanOrEqual(0.04);
    expect(ordinary.pulsePeriodSeconds).toBeLessThanOrEqual(30);
    expect(millisecond.pulsePeriodSeconds).toBeGreaterThanOrEqual(0.002);
    expect(millisecond.pulsePeriodSeconds).toBeLessThanOrEqual(0.03);
  });

  it('does not invent pulse timing for an unrelated extreme type', () => {
    const locator = findExtreme(ExtremeType.STELLAR_MASS_BLACK_HOLE);
    expect(GalacticPulsarTimingProfileEngine.resolveConfirmed(
      key, locator, DiscoveryState.CONFIRMED,
    )).toBeNull();
  });
});

function findExtreme(type: ExtremeTypeValue): GalacticObjectLocator {
  const galaxy = GalaxyGenerator.generate(key, 0n);
  const physicalKey = frozenPhysicalSourceKey(key);
  for (let x = -40; x <= 40; x += 1) {
    for (let y = -40; y <= 40; y += 1) {
      if (x === 0 && y === 0) continue;
      const content = GalaxySectorContentGenerator.generate(galaxy, { x, y });
      for (const locator of content.galacticObjectLocators) {
        if (ExplorationSectorResultEngine.resolveGalacticObjectKind(physicalKey, locator) !==
            ExplorationResultKind.EXTREME_OBJECT) continue;
        if (ExtremeObjectTypeResolver.resolve(key, locator) === type) return locator;
      }
    }
  }
  throw new Error(`Missing deterministic 28.3 fixture for ${type}.`);
}
