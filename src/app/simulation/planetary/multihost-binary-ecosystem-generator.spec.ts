import { generateMultihostPlanetaryCatalog, type MultihostStellarInput } from './multihost-planetary-catalog-generator';
import { generateMultihostFormedPlanetarySystemV22 } from './multihost-formed-planetary-system-generator';
import { generateBinaryEcosystemV23 } from './multihost-binary-ecosystem-generator';

const INPUT: MultihostStellarInput = Object.freeze({
  seed: '00000000000000000000000000000001',
  massA: 1, massB: 0.8, massC: null,
  radiusAAu: 0.00465, radiusBAu: 0.004, radiusCAu: null,
  innerBinaryAxisAu: 12, innerBinaryEccentricity: 0.12,
  outerBinaryAxisAu: null, outerBinaryEccentricity: null,
  frozenPAbInnerAu: 36, frozenPAbOuterAu: null, samplingOuterAu: 1000,
});

function formation(seed = INPUT.seed) {
  const catalog = generateMultihostPlanetaryCatalog({...INPUT, seed});
  return generateMultihostFormedPlanetarySystemV22({
    systemSeed: catalog.sourceSystemSeed, windows: catalog.windows,
  });
}

describe('V2.3 experimental BINARY ecosystem, distinct from V1 Ground Truth', () => {
  it('is immutable, deterministic and never changes V2.2 formed planets or inventory', () => {
    const formed = formation();
    const before = JSON.stringify(formed);
    const first = generateBinaryEcosystemV23(formed, {A: 1, B: 0.5});
    const second = generateBinaryEcosystemV23(formed, {A: 1, B: 0.5});
    expect(first).toEqual(second);
    expect(first.version).toBe('V2_3_EXPERIMENTAL_ECOSYSTEM');
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.planets)).toBe(true);
    expect(Object.isFrozen(first.minorBodies)).toBe(true);
    expect(Object.isFrozen(first.belts)).toBe(true);
    expect(JSON.stringify(formed)).toBe(before);
    expect(first.planets.every(planet => planet.planetId.startsWith('v22-'))).toBe(true);
    expect(first.minorBodies.every(body => body.id.startsWith('v23-'))).toBe(true);
    expect(new Set(first.minorBodies.map(body => body.id)).size).toBe(first.minorBodies.length);
    expect(new Set(first.belts.map(belt => belt.id)).size).toBe(first.belts.length);
  });

  it('creates per-host appearances without copying V1 identities or AB P-type planets', () => {
    const formed = formation();
    const ecosystem = generateBinaryEcosystemV23(formed, {A: 1, B: 0.5});
    const circumstellar = formed.planets.filter(planet =>
      planet.family === 'S_TYPE' && (planet.hostId === 'A' || planet.hostId === 'B'));
    expect(ecosystem.planets).toHaveLength(circumstellar.length);
    expect(new Set(ecosystem.planets.map(item => item.planetId)).size)
      .toBe(circumstellar.length);
    for (const item of ecosystem.planets) {
      const formedPlanet = circumstellar.find(planet => planet.id === item.planetId)!;
      expect(item.hostId).toBe(formedPlanet.hostId);
      expect(item.incidentFluxReferenceEarth).toBeCloseTo(
        (item.hostId === 'A' ? 1 : 0.5) / formedPlanet.semiMajorAxisAu ** 2, 12);
      expect(item.tentativeMoonCount).toBeGreaterThanOrEqual(0);
      expect(item.tentativeMoonCount).toBeLessThanOrEqual(3);
    }
  });

  it('keeps small bodies and belts strictly inside their own stable host windows', () => {
    const formed = formation();
    const ecosystem = generateBinaryEcosystemV23(formed, {A: 1, B: 0.5});
    expect(ecosystem.minorBodies.length).toBeGreaterThan(0);
    for (const item of ecosystem.minorBodies) {
      const disk = formed.disks.find(entry => entry.hostId === item.hostId)!;
      const outer = Math.min(disk.window.referenceOuterAu,
        disk.window.outerStableAu ?? disk.window.referenceOuterAu);
      expect(item.periapsisAu).toBeGreaterThan(disk.window.innerStableAu);
      expect(item.apoapsisAu).toBeLessThan(outer);
      expect(item.periapsisAu).toBeCloseTo(item.semiMajorAxisAu * (1 - item.eccentricity), 12);
      expect(item.apoapsisAu).toBeCloseTo(item.semiMajorAxisAu * (1 + item.eccentricity), 12);
      expect(item.periodDays).toBeCloseTo(365.25 * Math.sqrt(
        item.semiMajorAxisAu ** 3 / disk.window.gravitatingMassSolar), 12);
    }
    for (const belt of ecosystem.belts) {
      const disk = formed.disks.find(entry => entry.hostId === belt.hostId)!;
      const outer = Math.min(disk.window.referenceOuterAu,
        disk.window.outerStableAu ?? disk.window.referenceOuterAu);
      expect(belt.innerEdgeAu).toBeGreaterThan(disk.window.innerStableAu);
      expect(belt.innerEdgeAu).toBeLessThan(belt.peakAu);
      expect(belt.peakAu).toBeLessThan(belt.outerEdgeAu);
      expect(belt.outerEdgeAu).toBeLessThan(outer);
      expect(disk.planets.every(planet => planet.apoapsisAu < belt.innerEdgeAu ||
        planet.periapsisAu > belt.outerEdgeAu)).toBe(true);
    }
  });

  it('does not fabricate debris when the host has no remaining solids', () => {
    const formed = formation();
    const noSolids = Object.freeze({...formed,
      disks: Object.freeze(formed.disks.map(disk => disk.hostId !== 'A' ? disk :
        Object.freeze({...disk, remainingSolidsEarth: 0}))),
    });
    const ecosystem = generateBinaryEcosystemV23(noSolids, {A: 1, B: 0.5});
    expect(ecosystem.minorBodies.some(item => item.hostId === 'A')).toBe(false);
    expect(ecosystem.belts.some(item => item.hostId === 'A')).toBe(false);
    expect(ecosystem.planets.some(item => item.hostId === 'A')).toBe(true);
  });

  it('varies planetary appearances between seeds and isolates each star luminosity', () => {
    const formed = formation();
    const first = generateBinaryEcosystemV23(formed, {A: 1, B: 0.5});
    const altered = generateBinaryEcosystemV23(formed, {A: 1, B: 0.8});
    expect(first.planets.filter(item => item.hostId === 'A')).toEqual(
      altered.planets.filter(item => item.hostId === 'A'));
    expect(first.planets.filter(item => item.hostId === 'B').map(item => item.incidentFluxReferenceEarth))
      .not.toEqual(altered.planets.filter(item => item.hostId === 'B')
        .map(item => item.incidentFluxReferenceEarth));
    const kinds = new Set<string>();
    for (let i = 0; i < 12; i++) {
      const seed = i.toString(16).padStart(32, '0');
      for (const appearance of generateBinaryEcosystemV23(
        formation(seed), {A: 1, B: 0.5}).planets) kinds.add(appearance.visualKind);
    }
    expect(kinds.size).toBeGreaterThanOrEqual(5);
  });
});
