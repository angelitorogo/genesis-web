import { generateMultihostPlanetaryCatalog, type MultihostStellarInput } from './multihost-planetary-catalog-generator';
import { generateMultihostFormedPlanetarySystemV22 } from './multihost-formed-planetary-system-generator';
import { generateMultihostScientificMinorBodiesV243 } from './multihost-scientific-minor-body-generator-v243';

const INPUT: MultihostStellarInput = Object.freeze({
  seed: '00000000000000000000000000000001',
  massA: 1, massB: 0.8, massC: null,
  radiusAAu: 0.00465, radiusBAu: 0.004, radiusCAu: null,
  innerBinaryAxisAu: 12, innerBinaryEccentricity: 0.12,
  outerBinaryAxisAu: null, outerBinaryEccentricity: null,
  frozenPAbInnerAu: 36, frozenPAbOuterAu: null, samplingOuterAu: 1000,
});

const source = (input: MultihostStellarInput) => {
  const windows = generateMultihostPlanetaryCatalog(input).windows;
  return generateMultihostFormedPlanetarySystemV22({
    systemSeed: input.seed, windows,
    hostLuminositiesSolarV241: {A: 1, B: 0.42},
  });
};

describe('V2.4.3 circumstellar scientific minor bodies', () => {
  it('is deterministic and immutable, never mutates its formed A/B disks or V1 identities', () => {
    const formed = source(INPUT);
    const original = JSON.stringify(formed);
    const catalog = generateMultihostScientificMinorBodiesV243(formed, {A: 1, B: 0.42});
    expect(catalog).toEqual(generateMultihostScientificMinorBodiesV243(formed, {A: 1, B: 0.42}));
    expect(JSON.stringify(formed)).toBe(original);
    expect(catalog.version).toBe('V2_4_3_MINOR_BODY_SCIENCE');
    expect(catalog.hosts.map(host => host.hostId)).toEqual(['A', 'B']);
    expect(Object.isFrozen(catalog)).toBe(true);
    expect(Object.isFrozen(catalog.bodies)).toBe(true);
    expect(Object.isFrozen(catalog.belts)).toBe(true);
    expect(catalog.bodies.every(body => body.id.startsWith('v243-') &&
      body.formationSeedHex.match(/^[0-9A-F]{32}$/) && body.source ===
      'V2_4_3_DETERMINISTIC_RESIDUAL_FORMATION')).toBe(true);
    expect(new Set([...catalog.belts, ...catalog.bodies].map(body => body.id)).size)
      .toBe(catalog.bodies.length + catalog.belts.length);
    expect(catalog.bodies.every(body => !('bodyLocator' in body))).toBe(true);
  });

  it('bounds belt masses and comet reservoirs to the *separate* residual inventory of A/B', () => {
    const formed = source(INPUT);
    const catalog = generateMultihostScientificMinorBodiesV243(formed, {A: 1, B: 0.42});
    for (const host of catalog.hosts) {
      const disk = formed.disks.find(d => d.hostId === host.hostId)!;
      expect(host.remainingSolidsEarth).toBe(disk.remainingSolidsEarth);
      expect(host.allocatedBeltMassEarth + host.allocatedCometReservoirEarth)
        .toBeLessThanOrEqual(disk.remainingSolidsEarth + 1e-8);
      expect(host.modeledAsteroidMassEarth).toBeLessThanOrEqual(host.allocatedBeltMassEarth + 1e-9);
      expect(host.modeledCometMassEarth).toBeLessThanOrEqual(host.allocatedCometReservoirEarth + 1e-9);
      expect(host.estimatedAsteroidPopulation).toBeGreaterThanOrEqual(
        host.bodies.filter(body => body.kind === 'ASTEROID').length);
      expect(host.estimatedCometPopulation).toBeGreaterThanOrEqual(
        host.bodies.filter(body => body.kind === 'COMET').length);
      if (host.cometReservoir === null) {
        expect(host.allocatedCometReservoirEarth).toBe(0);
        expect(host.bodies.filter(body => body.kind === 'COMET')).toEqual([]);
      } else {
        expect(host.cometReservoir.hostId).toBe(host.hostId);
        expect(host.cometReservoir.innerEdgeAu).toBeGreaterThan(host.cometReservoir.snowLineAu);
        expect(host.cometReservoir.outerEdgeAu).toBeLessThan(
          disk.window.outerStableAu ?? disk.window.referenceOuterAu);
        expect(disk.planets.some(p => host.cometReservoir!.innerEdgeAu <= p.apoapsisAu &&
          host.cometReservoir!.outerEdgeAu >= p.periapsisAu)).toBe(false);
      }
      for (const belt of host.belts) {
        expect(belt.hostId).toBe(host.hostId);
        expect(belt.innerEdgeAu).toBeGreaterThan(disk.window.innerStableAu);
        expect(belt.outerEdgeAu).toBeLessThan(
          disk.window.outerStableAu ?? disk.window.referenceOuterAu);
        expect(belt.peakAu).toBeGreaterThan(belt.innerEdgeAu);
        expect(belt.peakAu).toBeLessThan(belt.outerEdgeAu);
        expect(disk.planets.some(p => belt.innerEdgeAu <= p.apoapsisAu &&
          belt.outerEdgeAu >= p.periapsisAu)).toBe(false);
      }
      for (const body of host.bodies) {
        expect(body.hostId).toBe(host.hostId);
        expect(body.periapsisAu).toBeGreaterThan(disk.window.innerStableAu);
        expect(body.apoapsisAu).toBeLessThan(
          disk.window.outerStableAu ?? disk.window.referenceOuterAu);
        expect(body.periapsisAu).toBeCloseTo(body.semiMajorAxisAu * (1 - body.eccentricity), 10);
        expect(body.apoapsisAu).toBeCloseTo(body.semiMajorAxisAu * (1 + body.eccentricity), 10);
        expect(body.periodDays).toBeCloseTo(365.25 * Math.sqrt(
          body.semiMajorAxisAu ** 3 / disk.window.gravitatingMassSolar), 10);
        expect(body.massEarth).toBeGreaterThan(0);
        expect(body.massEarth).toBeLessThanOrEqual(disk.remainingSolidsEarth);
        expect(body.iceFraction01 + body.dustFraction01).toBeCloseTo(1, 10);
        const radialCrosses = disk.planets.some(p => body.periapsisAu <= p.apoapsisAu &&
          body.apoapsisAu >= p.periapsisAu);
        if (body.kind === 'ASTEROID') {
          expect(radialCrosses).toBe(false);
          expect(body.cometOrbitClass).toBeUndefined();
          const belt = host.belts.find(item => item.id === body.beltId)!;
          expect(belt).toBeDefined();
          expect(body.periapsisAu).toBeGreaterThan(belt.innerEdgeAu);
          expect(body.apoapsisAu).toBeLessThan(belt.outerEdgeAu);
        } else {
          expect(body.beltId).toBeNull();
          expect(host.cometReservoir).not.toBeNull();
          expect(body.cometReservoirId).toBe(host.cometReservoir!.id);
          expect(body.longitudeAscendingNodeDegrees).toBeGreaterThanOrEqual(0);
          expect(body.argumentOfPeriapsisDegrees).toBeGreaterThanOrEqual(0);
          expect(body.rotationDegrees).toBeCloseTo(
            (body.longitudeAscendingNodeDegrees! + body.argumentOfPeriapsisDegrees!) % 360, 9);
          expect(body.apoapsisAu).toBeGreaterThan(host.cometReservoir!.innerEdgeAu);
          expect(body.apoapsisAu).toBeLessThan(host.cometReservoir!.outerEdgeAu);
          expect(body.crossesPlanetaryRadialEnvelope).toBe(radialCrosses);
          if (body.cometOrbitClass === 'INBOUND_VISITOR') {
            expect(radialCrosses).toBe(true);
            expect(body.periapsisAu).toBeLessThan(host.cometReservoir!.innerEdgeAu);
          } else {
            expect(body.cometOrbitClass).toBe('RESERVOIR_BOUND');
            expect(radialCrosses).toBe(false);
            expect(body.periapsisAu).toBeGreaterThan(host.cometReservoir!.snowLineAu);
          }
        }
      }
    }
  });

  it('does not fabricate minor bodies in an unusable or depleted S-type disk', () => {
    const formed = source(INPUT);
    const empty = {...formed, disks: formed.disks.map(d => d.hostId === 'B'
      ? {...d, remainingSolidsEarth: 0, planets: [], window: {...d.window, usable: false}}
      : d)};
    const inventory = generateMultihostScientificMinorBodiesV243(empty, {A: 1, B: 0.42});
    expect(inventory.hosts.find(host => host.hostId === 'B')?.bodies).toEqual([]);
    expect(inventory.hosts.find(host => host.hostId === 'B')?.belts).toEqual([]);
    expect(inventory.hosts.find(host => host.hostId === 'B')?.estimatedAsteroidPopulation).toBe(0);
    expect(inventory.hosts.find(host => host.hostId === 'B')?.estimatedCometPopulation).toBe(0);
    expect(inventory.hosts.find(host => host.hostId === 'B')?.cometReservoir).toBeNull();
  });

  it('samples multiple binary separations while preserving host-local radial clearance', () => {
    let modeledAsteroids = 0;
    let modeledComets = 0;
    let modeledBelts = 0;
    let boundComets = 0;
    let inboundComets = 0;
    let coldReservoirs = 0;
    const seenHosts = new Set<string>();
    for (const axis of [3.06, 12, 30, 93]) for (let number = 1; number <= 8; number++) {
      const seed = number.toString(16).padStart(32, '0').toUpperCase();
      const formed = source({...INPUT, seed, innerBinaryAxisAu: axis});
      const catalog = generateMultihostScientificMinorBodiesV243(formed, {A: 1, B: 0.42});
      modeledAsteroids += catalog.bodies.filter(body => body.kind === 'ASTEROID').length;
      modeledComets += catalog.bodies.filter(body => body.kind === 'COMET').length;
      modeledBelts += catalog.belts.length;
      coldReservoirs += catalog.hosts.filter(host => host.cometReservoir !== null).length;
      boundComets += catalog.bodies.filter(body => body.cometOrbitClass === 'RESERVOIR_BOUND').length;
      inboundComets += catalog.bodies.filter(body => body.cometOrbitClass === 'INBOUND_VISITOR').length;
      for (const host of catalog.hosts) if (host.bodies.length) seenHosts.add(host.hostId);
      expect(catalog.bodies.every(body => Number.isFinite(body.periodDays) &&
        body.periodDays > 0)).toBe(true);
    }
    expect(modeledAsteroids).toBeGreaterThan(20);
    expect(modeledComets).toBeGreaterThan(0);
    expect(coldReservoirs).toBeGreaterThan(0);
    expect(boundComets).toBeGreaterThan(0);
    expect(inboundComets).toBeGreaterThan(0);
    expect(modeledBelts).toBeGreaterThan(6);
    expect([...seenHosts].sort()).toEqual(['A', 'B']);
  });

  it('isolates luminosity and rejects non-physical inputs', () => {
    const formed = source(INPUT);
    const cool = generateMultihostScientificMinorBodiesV243(formed, {A: 1, B: 0.01});
    const hot = generateMultihostScientificMinorBodiesV243(formed, {A: 1, B: 100});
    expect(cool.hosts.find(h => h.hostId === 'A'))
      .toEqual(hot.hosts.find(h => h.hostId === 'A'));
    expect(() => generateMultihostScientificMinorBodiesV243(formed, {A: -1, B: 0.42}))
      .toThrow(RangeError);
    expect(() => generateMultihostScientificMinorBodiesV243({
      ...formed, sourceSystemSeed: 'invalid',
    }, {A: 1, B: 0.42})).toThrow(RangeError);
  });
  it('does not fabricate icy S-type comet reservoirs inside the snow line of close binaries', () => {
    const formed = source({...INPUT, seed: '0000000000000000000000000000000D', innerBinaryAxisAu: 3.06});
    const hot = generateMultihostScientificMinorBodiesV243(formed, {A: 100, B: 100});
    expect(hot.hosts.every(host => host.cometReservoir === null &&
      host.allocatedCometReservoirEarth === 0 &&
      host.bodies.every(body => body.kind !== 'COMET'))).toBe(true);
    const unknown = generateMultihostScientificMinorBodiesV243(formed, {A: null, B: null});
    expect(unknown.hosts.every(host => host.cometReservoir === null &&
      host.bodies.every(body => body.kind !== 'COMET'))).toBe(true);
  });

  it('uses the V1-style high-e comet visitor family and broad inclinations without violating A/B windows', () => {
    let visitors = 0;
    let bound = 0;
    let inclined = 0;
    const visitorsByHost = new Set<string>();
    for (const axis of [12, 21.75, 30, 93, 180]) for (let n = 1; n <= 16; n++) {
      const seed = n.toString(16).padStart(32, '0').toUpperCase();
      const formed = source({...INPUT, seed, innerBinaryAxisAu: axis});
      const science = generateMultihostScientificMinorBodiesV243(formed, {A: 1, B: 0.42});
      for (const comet of science.bodies.filter(item => item.kind === 'COMET')) {
        const disk = formed.disks.find(item => item.hostId === comet.hostId)!;
        const host = science.hosts.find(item => item.hostId === comet.hostId)!;
        expect(comet.apoapsisAu).toBeGreaterThan(host.cometReservoir!.innerEdgeAu);
        expect(comet.apoapsisAu).toBeLessThan(host.cometReservoir!.outerEdgeAu);
        expect(comet.periapsisAu).toBeGreaterThan(disk.window.innerStableAu);
        expect(comet.apoapsisAu).toBeLessThan(disk.window.outerStableAu!);
        expect(comet.inclinationDegrees).toBeGreaterThanOrEqual(0);
        expect(comet.inclinationDegrees).toBeLessThanOrEqual(180);
        if (comet.cometOrbitClass === 'INBOUND_VISITOR') {
          visitors++;
          visitorsByHost.add(comet.hostId);
          inclined += Number(comet.inclinationDegrees > 20);
          expect(comet.eccentricity).toBeGreaterThanOrEqual(0.724);
          expect(comet.periapsisAu / comet.apoapsisAu).toBeLessThanOrEqual(0.16 + 1e-10);
          expect(comet.crossesPlanetaryRadialEnvelope).toBe(true);
        } else {
          bound++;
          // Bound cold nuclei are retained in science, but near-circular ones
          // are not misrepresented as the active V1-style visiting population.
          expect(comet.cometOrbitClass).toBe('RESERVOIR_BOUND');
          expect(comet.periapsisAu).toBeGreaterThan(host.cometReservoir!.innerEdgeAu);
        }
      }
    }
    expect(visitors).toBeGreaterThan(20);
    expect(bound).toBeGreaterThan(0);
    expect(inclined).toBeGreaterThan(4);
    expect([...visitorsByHost].sort()).toEqual(['A', 'B']);
  });

  it('isolate inbound radial crossings from the collision forecast and asteroid/belt clearance', () => {
    let visitors = 0;
    let residents = 0;
    for (const axis of [12, 30, 93, 180]) for (let n = 0; n < 18; n++) {
      const seed = (n + 31).toString(16).padStart(32, '0').toUpperCase();
      const formed = source({...INPUT, seed, innerBinaryAxisAu: axis});
      const science = generateMultihostScientificMinorBodiesV243(formed, {A: 1, B: 0.42});
      for (const comet of science.bodies.filter(body => body.kind === 'COMET')) {
        const host = science.hosts.find(item => item.hostId === comet.hostId)!;
        const sourceDisk = formed.disks.find(disk => disk.hostId === comet.hostId)!;
        expect(comet.cometReservoirId).toBe(host.cometReservoir!.id);
        expect(comet.apoapsisAu).toBeGreaterThan(host.cometReservoir!.innerEdgeAu);
        expect(comet.apoapsisAu).toBeLessThan(host.cometReservoir!.outerEdgeAu);
        expect(comet.periapsisAu).toBeGreaterThan(sourceDisk.window.innerStableAu);
        if (comet.cometOrbitClass === 'INBOUND_VISITOR') {
          visitors++;
          expect(comet.crossesPlanetaryRadialEnvelope).toBe(true);
        } else {
          residents++;
          expect(comet.crossesPlanetaryRadialEnvelope).toBe(false);
        }
      }
    }
    expect(visitors).toBeGreaterThan(0);
    expect(residents).toBeGreaterThan(0);
  });

});
