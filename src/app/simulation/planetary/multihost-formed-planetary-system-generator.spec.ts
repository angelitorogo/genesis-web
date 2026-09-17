import {
  generateMultihostPlanetaryCatalog,
  type MultihostStellarInput,
} from './multihost-planetary-catalog-generator';
import {
  generateMultihostFormedPlanetarySystemV22,
} from './multihost-formed-planetary-system-generator';

const BINARY: MultihostStellarInput = Object.freeze({
  seed: '00000000000000000000000000000000',
  massA: 1, massB: 0.8, massC: null,
  radiusAAu: 0.00465, radiusBAu: 0.004, radiusCAu: null,
  innerBinaryAxisAu: 12, innerBinaryEccentricity: 0.12,
  outerBinaryAxisAu: null, outerBinaryEccentricity: null,
  frozenPAbInnerAu: 36, frozenPAbOuterAu: null,
  samplingOuterAu: 1000,
});

const build = (input: MultihostStellarInput) => {
  const catalog = generateMultihostPlanetaryCatalog(input);
  return generateMultihostFormedPlanetarySystemV22({
    systemSeed: catalog.sourceSystemSeed, windows: catalog.windows,
  });
};

describe('V2.4.1 experimental luminosity-aware circumstellar formation', () => {
  it('uses independent per-host snow lines only when explicitly requested; preserves legacy V2.2', () => {
    const catalog = generateMultihostPlanetaryCatalog({...BINARY, innerBinaryAxisAu: 93});
    const input = {systemSeed: catalog.sourceSystemSeed, windows: catalog.windows};
    const baseline = generateMultihostFormedPlanetarySystemV22(input);
    expect(generateMultihostFormedPlanetarySystemV22({...input})).toEqual(baseline);
    const cool = generateMultihostFormedPlanetarySystemV22({
      ...input, hostLuminositiesSolarV241: {A: 1, B: 0.05},
    });
    const hot = generateMultihostFormedPlanetarySystemV22({
      ...input, hostLuminositiesSolarV241: {A: 1, B: 100},
    });
    expect(generateMultihostFormedPlanetarySystemV22({
      ...input, hostLuminositiesSolarV241: {A: 1, B: 0.05},
    })).toEqual(cool);
    expect(cool.disks.find(d => d.hostId === 'A')).toEqual(hot.disks.find(d => d.hostId === 'A'));
    expect(cool.disks.find(d => d.hostId === 'B')?.planets).not.toEqual(
      hot.disks.find(d => d.hostId === 'B')?.planets);
    for (const system of [cool, hot]) {
      for (const disk of system.disks) {
        expect(disk.accretedSolidsEarth).toBeLessThanOrEqual(disk.initialSolidsEarth + 1e-8);
        expect(disk.accretedGasEarth).toBeLessThanOrEqual(disk.initialGasEarth + 1e-8);
        for (const planet of disk.planets) {
          expect(planet.periapsisAu).toBeGreaterThan(disk.window.innerStableAu);
          expect(planet.apoapsisAu).toBeLessThan(disk.window.outerStableAu ?? disk.window.referenceOuterAu);
        }
      }
    }
    expect(() => generateMultihostFormedPlanetarySystemV22({
      ...input, hostLuminositiesSolarV241: {A: -1},
    })).toThrow(RangeError);
  });
});

describe('V2.2 independent scientific multihost formation', () => {
  it('creates formed planets, not test particles, with stable disjoint per-host identities', () => {
    const catalog = generateMultihostPlanetaryCatalog(BINARY);
    const formed = build(BINARY);
    expect(formed.version).toBe('V2_2_FORMATION_V1');
    expect(formed.disks.map(disk => disk.hostId)).toEqual(['A', 'B', 'AB']);
    expect(formed.planets.length).toBeGreaterThan(0);
    const candidateIds = new Set(catalog.candidates.map(body => body.id));
    const ids = new Set<string>();
    const seeds = new Set<string>();
    for (const planet of formed.planets) {
      expect(planet.origin).toBe('V2_2_FORMED');
      expect(candidateIds.has(planet.id)).toBe(false);
      expect(ids.has(planet.id)).toBe(false);
      expect(seeds.has(planet.formationSeedHex)).toBe(false);
      ids.add(planet.id);
      seeds.add(planet.formationSeedHex);
      expect(planet.formationSeedHex).toMatch(/^[0-9A-F]{32}$/);
      expect(planet.id).toContain(`-${planet.hostId}-`);
    }
  });

  it('depends on windows alone: QA test-particle order, count and membership are irrelevant', () => {
    const catalog = generateMultihostPlanetaryCatalog(BINARY);
    const input = {systemSeed: catalog.sourceSystemSeed, windows: catalog.windows};
    const original = generateMultihostFormedPlanetarySystemV22(input);
    expect(generateMultihostFormedPlanetarySystemV22(input)).toEqual(original);
    expect(generateMultihostFormedPlanetarySystemV22({
      ...input, windows: [...catalog.windows].reverse(),
    })).toEqual(original);
    expect(generateMultihostFormedPlanetarySystemV22({
      ...input, windows: catalog.windows.map(window => ({...window})),
    })).toEqual(original);
    // Candidate orbits are purposefully NOT passed to the formation generator.
    expect(catalog.candidates.every(candidate => candidate.experimental)).toBe(true);
  });

  it('conserves each independent disk and validates whole periapsis–apoapsis and host mass', () => {
    for (const input of [BINARY, {
      ...BINARY, massC: 0.6, radiusCAu: 0.003,
      outerBinaryAxisAu: 350, outerBinaryEccentricity: 0.12,
      samplingOuterAu: 5000,
    }]) {
      const system = build(input);
      expect(system.disks.map(disk => disk.hostId)).toEqual(
        input.massC === null ? ['A', 'B', 'AB'] : ['A', 'B', 'C', 'AB', 'ABC'],
      );
      for (const disk of system.disks) {
        const {window} = disk;
        expect(disk.accretedSolidsEarth).toBeLessThanOrEqual(disk.initialSolidsEarth + 1e-9);
        expect(disk.accretedGasEarth).toBeLessThanOrEqual(disk.initialGasEarth + 1e-9);
        expect(disk.remainingSolidsEarth).toBeCloseTo(
          disk.initialSolidsEarth - disk.accretedSolidsEarth, 8,
        );
        expect(disk.planets.reduce((sum, p) => sum + p.coreMassEarth, 0))
          .toBeCloseTo(disk.accretedSolidsEarth, 8);
        let previousOuter = window.innerStableAu;
        for (const planet of disk.planets) {
          expect(planet.hostId).toBe(disk.hostId);
          expect(planet.family).toBe(disk.family);
          expect(planet.massEarth).toBeCloseTo(
            planet.coreMassEarth + planet.envelopeMassEarth, 9,
          );
          expect(planet.periodDays).toBeCloseTo(365.25 * Math.sqrt(
            planet.semiMajorAxisAu ** 3 / window.gravitatingMassSolar), 9);
          expect(planet.periapsisAu).toBeGreaterThan(previousOuter);
          expect(planet.periapsisAu).toBeGreaterThan(window.innerStableAu);
          if (window.outerStableAu !== null) {
            expect(planet.apoapsisAu).toBeLessThan(window.outerStableAu);
          }
          expect(planet.apoapsisAu).toBeLessThan(window.referenceOuterAu);
          previousOuter = planet.apoapsisAu;
        }
      }
    }
  });

  it('never manufactures planets for a closed/no-disk host or at zero metallicity', () => {
    const catalog = generateMultihostPlanetaryCatalog(BINARY);
    const closed = catalog.windows.map(window => window.hostId === 'B' ?
      {...window, usable: false, outerStableAu: window.innerStableAu} : window);
    const system = generateMultihostFormedPlanetarySystemV22({
      systemSeed: BINARY.seed, windows: closed,
    });
    expect(system.disks.find(disk => disk.hostId === 'B')?.planets).toEqual([]);
    expect(system.disks.find(disk => disk.hostId === 'B')?.status)
      .toBe('NO_USABLE_WINDOW');
    const zero = generateMultihostFormedPlanetarySystemV22({
      systemSeed: BINARY.seed, windows: catalog.windows, metallicitySolarRatio: 0,
    });
    expect(zero.planets).toHaveLength(0);
  });

  it('rejects invalid seeds, conflicting host identities and invalid windows', () => {
    const windows = generateMultihostPlanetaryCatalog(BINARY).windows;
    expect(() => generateMultihostFormedPlanetarySystemV22({
      systemSeed: 'bad', windows,
    })).toThrow(RangeError);
    expect(() => generateMultihostFormedPlanetarySystemV22({
      systemSeed: BINARY.seed, windows: [...windows, windows[0]!],
    })).toThrow(RangeError);
    expect(() => generateMultihostFormedPlanetarySystemV22({
      systemSeed: BINARY.seed, windows, metallicitySolarRatio: Number.NaN,
    })).toThrow(RangeError);
  });


  it('produces some envelope-bearing outer worlds across representative binary seeds when cold stable annuli exist', () => {
    const representative: MultihostStellarInput[] = [
      BINARY,
      {...BINARY, seed: '00000000000000000000000000000002', innerBinaryAxisAu: 3.06},
      {...BINARY, seed: '00000000000000000000000000000003', innerBinaryAxisAu: 6.4},
      {...BINARY, seed: '00000000000000000000000000000004', innerBinaryAxisAu: 12},
      {...BINARY, seed: '00000000000000000000000000000005', innerBinaryAxisAu: 24},
      {...BINARY, seed: '00000000000000000000000000000006', innerBinaryAxisAu: 93},
    ];
    let envelopeWorlds = 0;
    const hosts = new Set<string>();
    let systemsWithEnvelopeWorlds = 0;
    for (const input of representative) {
      const massB = input.massB;
      if (massB === null) throw new RangeError('BINARY test fixture requires secondary stellar mass.');
      const catalog = generateMultihostPlanetaryCatalog(input);
      const formed = generateMultihostFormedPlanetarySystemV22({
        systemSeed: catalog.sourceSystemSeed,
        windows: catalog.windows,
        hostLuminositiesSolarV241: {A: input.massA ** 3.5, B: massB ** 3.5},
      });
      const envelope = formed.planets.filter(planet => (planet.hostId === 'A' || planet.hostId === 'B') &&
        planet.bulkType === 'GAS_ENVELOPE');
      envelopeWorlds += envelope.length;
      if (envelope.length > 0) systemsWithEnvelopeWorlds += 1;
      envelope.forEach(planet => hosts.add(planet.hostId));
    }
    expect(envelopeWorlds).toBeGreaterThanOrEqual(4);
    expect(hosts).toEqual(new Set(['A', 'B']));
    expect(systemsWithEnvelopeWorlds).toBeGreaterThanOrEqual(3);
  });

});
