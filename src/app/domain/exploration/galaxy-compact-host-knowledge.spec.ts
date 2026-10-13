import { KnownDiscovery } from '../discovery/known-discovery';
import { DiscoveryState, type DiscoveryStateValue } from '../discovery/discovery-state';
import { ExtremeType } from '../galactic-object/extreme-object-type';
import { GeneratorVersion } from '../generation/generator-version';
import { SystemLocator, GalacticObjectLocator } from '../generation/procedural-locator';
import { UniverseGenerationKey } from '../generation/universe-generation-key';
import { CompactPlanetaryHost, type CompactPlanetaryHostType } from '../stellar/compact-planetary-host';
import { UniverseSeed } from '../universe/universe-seed';
import {
  EMPTY_GALAXY_COMPACT_HOST_KNOWLEDGE,
  projectGalaxyCompactHostKnowledge,
} from './galaxy-compact-host-knowledge';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'), GeneratorVersion.V2,
);

function host(type: CompactPlanetaryHostType, index: bigint, extremeIndex = index) {
  return new CompactPlanetaryHost({
    generationKey: key,
    systemLocator: new SystemLocator(0n, -6n, index),
    extremeObjectLocator: new GalacticObjectLocator(0n, 11n, extremeIndex),
    type,
    scientificState: {
      activityRegime: type === ExtremeType.STELLAR_MASS_BLACK_HOLE ? 'QUIESCENT' : 'UNRESOLVED',
      massSolar: type === ExtremeType.STELLAR_MASS_BLACK_HOLE ? 9 : 1.4,
      thermalLuminositySolar: 0,
      highEnergyLuminositySolar: 0,
      accretionLuminositySolar: 0,
      surfaceMagneticFieldTesla: null,
      rotationPeriodSeconds: null,
    },
  });
}

function known(h: CompactPlanetaryHost, state: DiscoveryStateValue = DiscoveryState.CATALOGUED) {
  return new KnownDiscovery(key, h.systemLocator, state);
}

describe('31.1 galaxy compact-host system subset', () => {
  it('counts one known system per exclusive compact type without double counting NS and pulsars', () => {
    const hosts = [
      host(ExtremeType.NEUTRON_STAR, 1n),
      host(ExtremeType.PULSAR, 2n),
      host(ExtremeType.MILLISECOND_PULSAR, 3n),
      host(ExtremeType.MAGNETAR, 4n),
      host(ExtremeType.STELLAR_MASS_BLACK_HOLE, 5n),
    ];
    const counts = projectGalaxyCompactHostKnowledge(key, 0n, hosts.map(h => known(h)), hosts);
    expect(counts).toEqual({ total: 5n, neutronStars: 1n, pulsars: 1n, millisecondPulsars: 1n, magnetars: 1n, stellarMassBlackHoles: 1n });
    expect(Object.isFrozen(counts)).toBe(true);
    expect(projectGalaxyCompactHostKnowledge(key, 0n, [...hosts.map(h => known(h))].reverse(), [...hosts].reverse())).toEqual(counts);
  });

  it('never reveals hidden or not-yet-catalogued host types', () => {
    const a = host(ExtremeType.PULSAR, 1n);
    const b = host(ExtremeType.MAGNETAR, 2n);
    const rows = [known(a, DiscoveryState.DISCOVERED), known(b, DiscoveryState.CONFIRMED)];
    expect(projectGalaxyCompactHostKnowledge(key, 0n, rows, [a, b])).toEqual({
      ...EMPTY_GALAXY_COMPACT_HOST_KNOWLEDGE, total: 1n, magnetars: 1n,
    });
    expect(projectGalaxyCompactHostKnowledge(key, 0n, [], [a, b])).toEqual(EMPTY_GALAXY_COMPACT_HOST_KNOWLEDGE);
    expect(projectGalaxyCompactHostKnowledge(key, 1n, rows, [a, b])).toEqual(EMPTY_GALAXY_COMPACT_HOST_KNOWLEDGE);
  });

  it('rejects duplicate system identities and duplicate underlying extreme source aliases', () => {
    const a = host(ExtremeType.PULSAR, 1n);
    expect(() => projectGalaxyCompactHostKnowledge(key, 0n, [known(a)], [a, a])).toThrow(/two compact-host/);
    const b = host(ExtremeType.MAGNETAR, 2n, 1n);
    expect(() => projectGalaxyCompactHostKnowledge(key, 0n, [known(a), known(b)], [a, b])).toThrow(/same physical extreme/);
  });

  it('rejects descriptors from another universe while never modifying the provided rows', () => {
    const a = host(ExtremeType.PULSAR, 1n);
    const foreign = new CompactPlanetaryHost({
      generationKey: new UniverseGenerationKey(UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B6'), GeneratorVersion.V2),
      systemLocator: a.systemLocator,
      type: a.type,
      scientificState: a.scientificState,
    });
    const rows = [known(a)];
    expect(() => projectGalaxyCompactHostKnowledge(key, 0n, rows, [foreign])).toThrow(/generation/);
    expect(rows).toHaveLength(1);
    expect(rows[0].state).toBe(DiscoveryState.CATALOGUED);
  });
});
