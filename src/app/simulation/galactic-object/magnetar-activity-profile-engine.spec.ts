import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { ExplorationResultKind } from '../../domain/exploration/exploration-sector-result';
import { ExtremeType } from '../../domain/galactic-object/extreme-object-type';
import { frozenPhysicalSourceKey } from '../../domain/generation/frozen-physical-source-key';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { GalacticObjectLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { ExplorationSectorResultEngine } from '../exploration/exploration-sector-result-engine';
import { GalaxySectorContentGenerator } from '../sector/galaxy-sector-content-generator';
import { GalaxyGenerator } from '../universe/galaxy-generator';
import { ExtremeObjectTypeResolver } from './extreme-object-type-resolver';
import { GalacticMagnetarActivityProfileEngine } from './magnetar-activity-profile-engine';
import { GalacticPulsarTimingProfileEngine } from './pulsar-timing-profile-engine';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V2,
);
const magnetar = findExtreme(ExtremeType.MAGNETAR);
const pulsar = findExtreme(ExtremeType.PULSAR);

describe('28.4 deterministic distributed magnetar activity profile', () => {
  it('is hidden before CONFIRMED and exists only for MAGNETAR', () => {
    for (const state of [DiscoveryState.DETECTED, DiscoveryState.DISCOVERED, DiscoveryState.CATALOGUED]) {
      expect(GalacticMagnetarActivityProfileEngine.resolveConfirmed(key, magnetar, state)).toBeNull();
    }
    expect(GalacticMagnetarActivityProfileEngine.resolveConfirmed(
      key, pulsar, DiscoveryState.CONFIRMED,
    )).toBeNull();
    expect(GalacticMagnetarActivityProfileEngine.resolveConfirmed(
      key, magnetar, DiscoveryState.CONFIRMED,
    )).not.toBeNull();
  });

  it('is deterministic and keeps the exterior dipole inside the established high-field scale', () => {
    const a = GalacticMagnetarActivityProfileEngine.resolveConfirmed(key, magnetar, DiscoveryState.CONFIRMED)!;
    const b = GalacticMagnetarActivityProfileEngine.resolveConfirmed(key, magnetar, DiscoveryState.CONFIRMED)!;
    expect(a).toEqual(b);
    expect(Object.isFrozen(a)).toBe(true);
    expect(a.extremeType).toBe(ExtremeType.MAGNETAR);
    expect(a.dipolarMagneticFieldTesla).toBeGreaterThanOrEqual(3e9);
    expect(a.dipolarMagneticFieldTesla).toBeLessThanOrEqual(1e11);
  });

  it('derives Pdot self-consistently from the already-established 28.3 timing period', () => {
    const activity = GalacticMagnetarActivityProfileEngine.resolveConfirmed(
      key, magnetar, DiscoveryState.CONFIRMED,
    )!;
    const timing = GalacticPulsarTimingProfileEngine.resolveConfirmed(
      key, magnetar, DiscoveryState.CONFIRMED,
    )!;
    const reference = ((activity.dipolarMagneticFieldTesla * 1e4) / 3.2e19) ** 2 /
      timing.pulsePeriodSeconds;
    expect(activity.periodDerivativeSecondsPerSecond).toBeCloseTo(reference, 10);
    expect(activity.characteristicAgeYears).toBeGreaterThan(0);
  });

  it('models only a bounded short-burst monitoring window and never invents a giant flare field', () => {
    const profile = GalacticMagnetarActivityProfileEngine.resolveConfirmed(
      key, magnetar, DiscoveryState.CONFIRMED,
    )!;
    expect(profile.monitoringWindowSeconds).toBe(21_600);
    expect(profile.detectedBurstCount).toBeGreaterThanOrEqual(0);
    if (profile.detectedBurstCount === 0) {
      expect(profile.strongestBurstDurationSeconds).toBeNull();
      expect(profile.shortestBurstSeparationSeconds).toBeNull();
    } else {
      expect(profile.strongestBurstDurationSeconds).toBeGreaterThanOrEqual(0.018);
      expect(profile.strongestBurstDurationSeconds).toBeLessThanOrEqual(0.48);
    }
    for (const forbidden of ['giantFlareEnergy', 'interiorFieldTesla', 'crustFieldTesla', 'discoveryState']) {
      expect(Object.keys(profile)).not.toContain(forbidden);
    }
  });
});

function findExtreme(type: ExtremeType): GalacticObjectLocator {
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
  throw new Error(`Missing deterministic V2 ${type} fixture for 28.4.`);
}
