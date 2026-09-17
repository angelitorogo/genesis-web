import { presentationPlanetRadiusFromPhysicsV1 } from './system-scene-planet-size-v1';
import {
  type SystemSceneSnapshot,
  type SystemSceneBodySnapshot,
} from './system-scene-snapshot';
import {
  buildLinearFitSystemScale,
  buildSingleAdaptiveSystemScaleV3,
  systemSceneProjectedRadiusAu,
  SystemSceneProjectionSpace,
} from './system-scene-scale-projection';
import { buildSystemSceneFirstOrbitAnchorV53 } from './system-scene-first-orbit-anchor';
import { systemSceneMultihostProjectedRadiusV22, systemSceneMultihostProjectVectorV221 } from './system-scene-multihost-radial-projection';
import { systemSceneCometActivityAtSimulationDayV1 } from './system-scene-comet-presentation';
import { buildSystemSceneMinorBodyOrbitPresentationV1 } from './system-scene-minor-body-orbit-v1';
import { SystemOrbitalMotionEngine } from '../../simulation/orbital/system-orbital-motion-engine';
import {
  assertSystemSceneProjectionSnapshot,
} from './system-scene-projection-contract';
import {
  buildSystemSceneMultihostLaboratoryPreview,
} from './system-scene-multihost-laboratory-preview';
import {
  projectSystemSceneMotionContributions,
  sampleSystemSceneOrbitLocalAu,
} from './system-scene-motion-projection';
import {
  MULTIHOST_V221_SECONDS_PER_ORBIT,
} from './system-scene-multihost-laboratory-cadence';
import {
  systemSceneMultihostRenderBudgetV221,
} from './system-scene-multihost-render-consistency';
import {
  generateMultihostFormedPlanetarySystemV22,
} from '../../simulation/planetary/multihost-formed-planetary-system-generator';
import {
  generateMultihostPlanetaryCatalog,
  type MultihostStellarInput,
} from '../../simulation/planetary/multihost-planetary-catalog-generator';

const BASE_INPUT: MultihostStellarInput = Object.freeze({
  seed: '00000000000000000000000000000000',
  massA: 1,
  massB: 0.8,
  massC: null,
  radiusAAu: 0.00465,
  radiusBAu: 0.004,
  radiusCAu: null,
  innerBinaryAxisAu: 12,
  innerBinaryEccentricity: 0.12,
  outerBinaryAxisAu: null,
  outerBinaryEccentricity: null,
  frozenPAbInnerAu: 36,
  frozenPAbOuterAu: null,
  samplingOuterAu: 1_000,
});

const spin = Object.freeze({
  source: 'UNAVAILABLE' as const,
  rotationPeriodHours: null,
  axialTiltDegrees: null,
  isRetrograde: null,
  isSynchronized: false,
  epochPhaseDegrees: 0,
});

function star(
  label: 'A' | 'B' | 'C',
  contributions: SystemSceneBodySnapshot['motionContributions'],
): SystemSceneBodySnapshot {
  return Object.freeze({
    id: `star-${label.toLowerCase()}`,
    kind: 'star' as const,
    label,
    title: `Test ${label}`,
    colorHex: '#FFFFFF',
    radiusScene: 0.2,
    opticalRadiusScene: 0.25,
    position: Object.freeze({ x: 0, y: 0, z: 0 }),
    orbitId: null,
    motionContributions: Object.freeze(contributions),
    surfaceStyle: 'emissive' as const,
    lightIntensity: 1,
    sourceLuminositySolar: 1,
    spin,
    surfaceEnvironment: null,
    giantAtmosphere: null,
    specialPresentation: null,
  });
}

function makeSnapshot(triple: boolean): SystemSceneSnapshot {
  const inner = Object.freeze({
    id: 'inner',
    semiMajorAxisAu: 12,
    eccentricity: 0.12,
    periodDays: 365.25 * Math.sqrt(12 ** 3 / 1.8),
    rotationDegrees: 0,
    inclinationDegrees: 3,
    epochMeanAnomalyDegrees: 20,
  });
  const outer = Object.freeze({
    id: 'outer',
    semiMajorAxisAu: 350,
    eccentricity: 0.12,
    periodDays: 365.25 * Math.sqrt(350 ** 3 / 2.4),
    rotationDegrees: 12,
    inclinationDegrees: 3,
    epochMeanAnomalyDegrees: 30,
  });
  const innerA = Object.freeze({
    motionId: 'inner',
    scale: 0.8 / 1.8,
    ...(triple ? { projectionSpace: SystemSceneProjectionSpace.TRIPLE_LOCAL } : {}),
  });
  const innerB = Object.freeze({
    motionId: 'inner',
    scale: -1 / 1.8,
    ...(triple ? { projectionSpace: SystemSceneProjectionSpace.TRIPLE_LOCAL } : {}),
  });
  const outerAb = Object.freeze({
    motionId: 'outer',
    scale: 0.6 / 2.4,
    projectionSpace: SystemSceneProjectionSpace.TRIPLE_OUTER,
  });
  const outerC = Object.freeze({
    motionId: 'outer',
    scale: -1.8 / 2.4,
    projectionSpace: SystemSceneProjectionSpace.TRIPLE_OUTER,
  });
  const stars = Object.freeze([
    star('A', Object.freeze(triple ? [outerAb, innerA] : [innerA])),
    star('B', Object.freeze(triple ? [outerAb, innerB] : [innerB])),
    ...(triple ? [star('C', Object.freeze([outerC]))] : []),
  ]);
  return Object.freeze({
    universeSeed: 'test',
    generatorVersionCode: 1,
    address: Object.freeze({ galaxyIndex: '0', sectorKey: '0', galacticObjectIndex: '0' }),
    title: 'QA test',
    multiplicityName: triple ? 'TRIPLE' : 'BINARY',
    stars,
    planets: Object.freeze([]),
    moons: Object.freeze([]),
    minorBodies: Object.freeze([]),
    asteroidBelts: Object.freeze([]),
    habitableZone: null,
    hostVisualEnvelope: null,
    multistellarPresentation: null,
    multistellarPTypeClearance: null,
    multistellarCoreCompaction: null,
    stellarOrbitClearance: null,
    firstOrbitAnchor: null,
    orbitalRiskTargets: Object.freeze([]),
    layers: Object.freeze({
      moonCount: 0,
      minorBodyCount: 0,
      habitableZoneAvailable: false,
      orbitalRiskTargetCount: 0,
      orbitalCrossingTargetCount: 0,
      orbitalApproachTargetCount: 0,
      orbitalCollisionGeometryTargetCount: 0,
    }),
    orbits: Object.freeze([]),
    motions: Object.freeze(triple ? [inner, outer] : [inner]),
    simulation: Object.freeze({ epochSimulationDay: 150, playbackDaysPerRealSecond: 2 }),
    scale: buildLinearFitSystemScale(triple ? 5_000 : 1_000, 5),
  } as unknown as SystemSceneSnapshot);
}

describe('Multihost V2 experimental scene projection boundary', () => {

  it('V2.4.4 attaches matching host-specific V1-reference habitability without touching the scene or changing V1', () => {
    const source = makeSnapshot(false);
    const catalog = generateMultihostPlanetaryCatalog(BASE_INPUT);
    const formed = generateMultihostFormedPlanetarySystemV22({
      systemSeed: catalog.sourceSystemSeed, windows: catalog.windows,
      hostLuminositiesSolarV241: {A: 1, B: 1},
    });
    const context = Object.freeze({
      binarySemiMajorAxisAu: 12, binaryEccentricity: 0.12,
      stellarEvolution: Object.freeze({A: 'MAIN_SEQUENCE' as const, B: 'MAIN_SEQUENCE' as const}),
    });
    const result = buildSystemSceneMultihostLaboratoryPreview(source, catalog, 'ALL', formed, context);
    const habitability = result.scientificMultihostHabitabilityV244!;
    expect(habitability.version).toBe('V2_4_4_S_TYPE_HABITABILITY');
    expect(habitability.hosts.map(host => host.hostId)).toEqual(['A', 'B']);
    expect(habitability.planets.length).toBe(result.scientificMultihostPlanetsV241?.planets.length);
    expect(habitability.planets.every(planet => planet.irradiance.status === 'BOUNDED')).toBe(true);
    expect(result.habitableZone).toBeNull();
    expect(source.scientificMultihostHabitabilityV244).toBeUndefined();
    expect(result.planets.every(planet => habitability.planets.some(body => body.planetId === planet.id))).toBe(true);
    expect(() => assertSystemSceneProjectionSnapshot(result)).not.toThrow();
    const triple = makeSnapshot(true);
    const originalTriple = buildSystemSceneMultihostLaboratoryPreview(triple, catalog, 'ALL', formed);
    expect(originalTriple.scientificMultihostHabitabilityV244).toBeUndefined();
  });

  it('renders V2.2 formed bodies rather than test particles while retaining the whole V1 scene', () => {
    const source = makeSnapshot(false);
    const catalog = generateMultihostPlanetaryCatalog(BASE_INPUT);
    const formed = generateMultihostFormedPlanetarySystemV22({
      systemSeed: catalog.sourceSystemSeed, windows: catalog.windows,
    });
    const result = buildSystemSceneMultihostLaboratoryPreview(
      source, catalog, 'ALL', formed,
    );
    expect(formed.planets.length).toBeGreaterThan(0);
    expect(result.formedMultihostSystemV22).toBe(formed);
    expect(result.planets.every(planet => planet.id.startsWith('v22-'))).toBe(true);
    expect(result.planets.length).toBeLessThanOrEqual(
      systemSceneMultihostRenderBudgetV221('BINARY').globalPlanetCap,
    );
    expect(result.planets.length).toBeLessThanOrEqual(formed.planets.length);
    expect(result.planets.every(planet => planet.spin.source === 'V2_2_FORMED'))
      .toBe(true);
    expect(result.planets.every(planet => planet.multihostOrbitV221?.translationState === 'ACTIVE'))
      .toBe(true);
    // Regression: tiny first S orbit must not expand the entire S disk beyond
    // the camera scale (old single AU->scene factor made it tens of scene units).
    for (const body of result.planets) {
      expect(Math.hypot(body.position.x, body.position.y, body.position.z))
        .toBeLessThan(result.laboratoryFrameRadiusSceneV224!);
    }
    for (const planet of result.planets) {
      const binding = planet.multihostOrbitV221!;
      const orbit = result.orbits.find(entry => entry.id === planet.orbitId);
      const motion = result.motions.find(entry => entry.id === binding.motionId);
      expect(orbit).toBeDefined();
      expect(motion).toBeDefined();
      expect(orbit!.semiMajorScene).toBeGreaterThan(0);
      expect(orbit!.motionId).toBe(binding.motionId);
      const later = projectSystemSceneMotionContributions(
        planet.motionContributions, id => result.motions.find(item => item.id === id),
        source.simulation.epochSimulationDay + source.simulation.playbackDaysPerRealSecond * 20,
        result.scale,
      );
      expect(Math.hypot(later.x - planet.position.x, later.y - planet.position.y, later.z - planet.position.z))
        .toBeGreaterThan(1e-7);
    }
    expect(result.moons.filter(moon => moon.previewOnlyV221 === true).length)
      .toBeLessThanOrEqual(systemSceneMultihostRenderBudgetV221('BINARY').globalLaboratoryMoonCap);
    expect(result.layers.moonCount).toBe(result.moons.length);
    expect(result.habitableZone).toBe(source.habitableZone);
    expect(result.experimentalMultihostCatalog).toBe(catalog);
    expect(() => assertSystemSceneProjectionSnapshot(result)).not.toThrow();
  });

  it('V2.4.1 attaches per-host scientific planet metadata without replacing V1 bodies or minting V1 identities', () => {
    const source = makeSnapshot(false);
    const catalog = generateMultihostPlanetaryCatalog({
      ...BASE_INPUT, seed: '00000000000000000000000000000001',
    });
    const formed = generateMultihostFormedPlanetarySystemV22({
      systemSeed: catalog.sourceSystemSeed, windows: catalog.windows,
    });
    const before = JSON.stringify(formed);
    const result = buildSystemSceneMultihostLaboratoryPreview(source, catalog, 'ALL', formed);
    const scientific = result.scientificMultihostPlanetsV241;
    expect(scientific?.version).toBe('V2_4_1_PLANET_SCIENCE');
    expect(scientific?.sourceSystemSeed).toBe(formed.sourceSystemSeed);
    expect(JSON.stringify(formed)).toBe(before);
    expect(result.planets.length).toBeGreaterThan(0);
    for (const visual of result.planets) {
      const record = scientific!.planets.find(planet => planet.id === visual.id);
      expect(record).toBeDefined();
      expect(visual.previewOnlyV241).toBe(true);
      expect(visual.radiusScene).toBeCloseTo(presentationPlanetRadiusFromPhysicsV1({
        radiusEarth: record!.physics.radiusEarth,
        planetType: record!.type,
        densityGramsPerCubicCentimeter: record!.physics.densityGramsPerCubicCentimeter,
        envelopeMassFraction01: record!.physics.envelopeMassEarth / record!.physics.massEarth,
        isDeepEnvelopeSurface: ['GAS_GIANT', 'ICE_GIANT', 'MINI_NEPTUNE'].includes(record!.type),
      }), 12);
      expect(visual.multihostOrbitV221?.hostId).toBe(record!.hostId);
      expect(visual.specialPresentation?.sourcePlanetType).toBe(record!.type);
      if (['GAS_GIANT', 'ICE_GIANT', 'MINI_NEPTUNE'].includes(record!.type)) {
        expect(visual.surfaceEnvironment).toBeNull();
      } else {
        expect(visual.surfaceEnvironment?.source).toBe('V2_4_1_HOST_ENVIRONMENT_ESTIMATE');
        expect(visual.surfaceEnvironment?.surfaceLiquidWaterCoverageFraction01)
          .toBe(record!.environment.water.surfaceLiquidWaterCoverageFraction01);
      }
      if (visual.giantAtmosphere !== null) {
        expect(visual.giantAtmosphere.source).toBe('V2_4_1_BULK_ENVELOPE_PRESENTATION');
      }
      expect(record!.thermal.atmosphereSurfacePressurePascal)
        .toBe(record!.environment.atmosphere.pressurePascal);
      expect(record!.thermal.liquidOceanCoverageFraction01)
        .toBe(record!.environment.water.surfaceLiquidWaterCoverageFraction01);
    }
    expect(result.moons.every(moon => moon.scientificV242 && !moon.previewOnlyV221)).toBe(true);
    expect(source.planets).toHaveLength(0);
    expect(() => assertSystemSceneProjectionSnapshot(result)).not.toThrow();
  });

  it('reuses V1 visual algorithms on V2.2 worlds with scientific V2.4.2 moons and V2.4.3 debris', () => {
    const source = makeSnapshot(false);
    const catalog = generateMultihostPlanetaryCatalog({
      ...BASE_INPUT, seed: '00000000000000000000000000000001',
    });
    const formed = generateMultihostFormedPlanetarySystemV22({
      systemSeed: catalog.sourceSystemSeed, windows: catalog.windows,
    });
    const result = buildSystemSceneMultihostLaboratoryPreview(source, catalog, 'ALL', formed);
    const again = buildSystemSceneMultihostLaboratoryPreview(source, catalog, 'ALL', formed);
    expect(result.planets.map(planet => planet.id)).toEqual(again.planets.map(planet => planet.id));
    expect(result.minorBodies.map(body => body.id)).toEqual(again.minorBodies.map(body => body.id));
    expect(result.asteroidBelts?.map(belt => belt.id)).toEqual(
      again.asteroidBelts?.map(belt => belt.id));
    expect(result.planets.every(planet => planet.previewOnlyV23 &&
      planet.specialPresentation?.sourcePlanetType !== undefined)).toBe(true);
    expect(result.moons.length).toBeGreaterThan(0);
    expect(result.moons.every(moon => moon.scientificV242 && !moon.previewOnlyV221 &&
      result.planets.some(planet => planet.id === moon.hostPlanetId))).toBe(true);
    // Scientific V2.4.2 moon counts do not depend on the old visual QA styles.
    // Deterministic formation may produce a single surface style in this seed.
    expect(result.moons.every(moon =>
      ['ROCKY', 'ICY', 'OCEANIC', 'VOLCANIC', 'MIXED']
        .includes(moon.visualPresentation.surfaceStyle))).toBe(true);
    expect(result.minorBodies.length).toBeGreaterThan(0);
    expect(result.scientificMultihostMinorBodiesV243?.hosts.some(host => host.hostId === 'A')).toBe(true);
    expect(result.scientificMultihostMinorBodiesV243?.hosts.some(host => host.hostId === 'B')).toBe(true);
    expect(result.asteroidBelts!.length).toBeGreaterThan(0);
    for (const body of result.minorBodies) {
      const star = result.stars.find(item => item.label === body.hostIdV243)!;
      const orbit = result.orbits.find(item => item.id === body.orbitId)!;
      const local = body.motionContributions.at(-1)!;
      expect(orbit.kind).toBe('minor-body');
      expect(orbit.anchorMotionContributions).toBe(star.motionContributions);
      expect(orbit.hostRadialProjectionV22).toBe(local.hostRadialProjectionV22);
      expect((body.asteroidPresentation ?? body.cometPresentation)?.source)
        .toBe('V2_4_3_SCIENTIFIC_REFERENCE');
      expect(result.motions.some(item => item.id === orbit.motionId)).toBe(true);
    }
    expect(result.layers.minorBodyCount).toBe(result.minorBodies.length);
    expect(source.planets).toHaveLength(0);
    expect(source.minorBodies).toHaveLength(0);
    expect(source.asteroidBelts).toHaveLength(0);
    expect(() => assertSystemSceneProjectionSnapshot(result)).not.toThrow();
  });

  it('V2.4.2 renders only catalogued A/B moons, preserves physical orbits and rejects forged render identities', () => {
    const source = makeSnapshot(false);
    const catalog = generateMultihostPlanetaryCatalog({
      ...BASE_INPUT, seed: '00000000000000000000000000000001',
    });
    const formed = generateMultihostFormedPlanetarySystemV22({
      systemSeed: catalog.sourceSystemSeed, windows: catalog.windows,
      hostLuminositiesSolarV241: {A: 1, B: 0.42},
    });
    const untouched = JSON.stringify(formed);
    const result = buildSystemSceneMultihostLaboratoryPreview(source, catalog, 'ALL', formed);
    const again = buildSystemSceneMultihostLaboratoryPreview(source, catalog, 'ALL', formed);
    const scientific = result.scientificMultihostMoonsV242!;
    expect(scientific.version).toBe('V2_4_2_MOON_SCIENCE');
    expect(scientific.sourceSystemSeed).toBe(formed.sourceSystemSeed);
    expect(scientific.systems).toHaveLength(result.scientificMultihostPlanetsV241!.planets.length);
    expect(scientific.moons.length).toBe(scientific.systems.reduce((total, item) =>
      total + item.modeledMoonCount, 0));
    expect(JSON.stringify(formed)).toBe(untouched);
    expect(again.scientificMultihostMoonsV242).toEqual(scientific);
    expect(result.moons.map(moon => moon.id)).toEqual(again.moons.map(moon => moon.id));
    expect(result.moons.length).toBeGreaterThan(10);
    expect(result.moons.length).toBeLessThanOrEqual(
      systemSceneMultihostRenderBudgetV221('BINARY').globalLaboratoryMoonCap);
    const moonHosts = new Set(result.moons.map(moon =>
      result.planets.find(planet => planet.id === moon.hostPlanetId)?.multihostOrbitV221?.hostId));
    expect(moonHosts.has('A')).toBe(true);
    expect(moonHosts.has('B')).toBe(true);
    expect(result.moons.every(moon => moon.scientificV242 && !moon.previewOnlyV221)).toBe(true);
    for (const visual of result.moons) {
      const physical = scientific.moons.find(moon => moon.id === visual.id)!;
      const parent = result.planets.find(planet => planet.id === visual.hostPlanetId)!;
      const guide = result.orbits.find(orbit => orbit.id === visual.orbitId)!;
      const motion = result.motions.find(entry => entry.id === guide.motionId)!;
      expect(parent.multihostOrbitV221?.hostId).toBe(physical.hostId);
      expect(physical.semiMajorAxisPlanetRadii * (1 - physical.eccentricity))
        .toBeGreaterThan(physical.rocheLimitPlanetRadii);
      expect(physical.semiMajorAxisPlanetRadii * (1 + physical.eccentricity))
        .toBeLessThan(physical.progradeOuterLimitPlanetRadii);
      expect(motion.periodDays).toBe(physical.periodDays);
      expect(motion.semiMajorAxisAu).toBe(physical.semiMajorAxisAu);
      expect(guide.anchorMotionContributions).toBe(parent.motionContributions);
      expect(visual.visualPresentation.sourceMassEarth).toBe(physical.massEarth);
      expect(visual.visualPresentation.sourceRadiusEarth).toBe(physical.radiusEarth);
      expect(visual.spin.source).toBe('V2_4_2_SCIENTIFIC_MOON');
    }
    expect(source.moons).toHaveLength(0);
    expect(() => assertSystemSceneProjectionSnapshot(result)).not.toThrow();
    const first = result.moons[0]!;
    const forged = Object.freeze({...result, moons: Object.freeze([
      Object.freeze({...first, hostPlanetId: 'fake-planet'}), ...result.moons.slice(1),
    ])});
    expect(() => assertSystemSceneProjectionSnapshot(forged)).toThrow(RangeError);
  });

  it('V2.3.4 compares the EXACT V1 SINGLE scale, first-orbit anchor and every sampled AU against BOTH binary hosts', () => {
    const source = makeSnapshot(false);
    const catalog = generateMultihostPlanetaryCatalog(BASE_INPUT);
    const formed = generateMultihostFormedPlanetarySystemV22({
      systemSeed: catalog.sourceSystemSeed, windows: catalog.windows,
    });
    const result = buildSystemSceneMultihostLaboratoryPreview(source, catalog, 'ALL', formed);
    expect(result.multihostLayoutV222?.version).toBe('V2_2_4_BINARY_LAYOUT_V1');
    expect(result.laboratoryFrameRadiusSceneV224).toBeGreaterThan(4.8);
    for (const host of ['A', 'B'] as const) {
      const star = result.stars.find(item => item.label === host)!;
      const worlds = result.planets.filter(planet => planet.multihostOrbitV221?.hostId === host);
      expect(worlds.length).toBeGreaterThan(0);
      const scientific = worlds.map(planet => formed.planets.find(item => item.id === planet.id)!);
      const innerAu = Math.min(...scientific.map(planet => planet.periapsisAu));
      const outerAu = Math.max(...scientific.map(planet => planet.apoapsisAu));
      const hz = result.multihostHabitableZonesV23?.find(item => item.hostId === host);
      const v1Base = buildSingleAdaptiveSystemScaleV3({
        outerRadiusAu: outerAu,
        targetOuterRadiusScene: 4.8,
        innerPeriapsisAu: innerAu,
        starRadiusScene: star.radiusScene,
        maxPlanetRadiusScene: 0.081,
        habitableZoneInnerAu: hz?.radiativeInnerEdgeAu ?? null,
        habitableZoneOuterAu: hz?.radiativeOuterEdgeAu ?? null,
      });
      const anchor = buildSystemSceneFirstOrbitAnchorV53({
        architecture: 'SINGLE', projectionSpace: SystemSceneProjectionSpace.GLOBAL,
        nearestPeriapsisAu: innerAu,
        originalPeriapsisScene: systemSceneProjectedRadiusAu(innerAu, v1Base),
        localOuterRadiusScene: v1Base.targetOuterRadiusScene,
        basePrimaryRadiusScene: star.radiusScene, baseSecondaryRadiusScene: 0,
        firstPlanetRadiusScene: 0.081,
      });
      const trueV1 = Object.freeze({...v1Base, firstOrbitAnchor: anchor});
      const radial = worlds[0]!.motionContributions.at(-1)!.hostRadialProjectionV22!;
      expect(radial.singleSystemScaleV233).toEqual(trueV1);
      expect(radial.orbitLadderV233).toBeUndefined();
      expect(radial.firstPeriapsisScene).toBeCloseTo(systemSceneProjectedRadiusAu(innerAu, trueV1), 12);
      expect(radial.lastApoapsisScene).toBeCloseTo(systemSceneProjectedRadiusAu(outerAu, trueV1), 12);
      const sampleAu = [0, innerAu / 2, innerAu, ...scientific.flatMap(item =>
        [item.periapsisAu, item.semiMajorAxisAu, item.apoapsisAu]), outerAu];
      if (hz !== undefined) sampleAu.push(hz.radiativeInnerEdgeAu, hz.radiativeOuterEdgeAu);
      for (const au of sampleAu) {
        expect(systemSceneMultihostProjectedRadiusV22(au, radial))
          .toBeCloseTo(systemSceneProjectedRadiusAu(au, trueV1), 12);
      }
      const window = catalog.windows.find(item => item.hostId === host)!;
      for (const world of worlds) {
        const physical = scientific.find(item => item.id === world.id)!;
        const guide = result.orbits.find(item => item.id === world.orbitId)!;
        expect(guide.semiMajorScene).toBeCloseTo(
          systemSceneProjectedRadiusAu(physical.semiMajorAxisAu, trueV1), 12);
        expect(guide.hostRadialProjectionV22).toBe(radial);
        expect(world.motionContributions.at(-1)!.hostRadialProjectionV22).toBe(radial);
        expect(physical.periapsisAu).toBeGreaterThan(window.innerStableAu);
        expect(physical.apoapsisAu).toBeLessThan(
          window.outerStableAu ?? window.referenceOuterAu);
      }
      const envelope = result.multihostLayoutV222!.hostEnvelopes.find(item => item.hostId === host)!;
      expect(envelope.outerEnvelopeScene).toBe(4.8);
      expect(star.localSystemFocusRadiusScene).toBeGreaterThanOrEqual(4.8);
    }
    expect(source.scale).toBe(result.scale);
    expect(source.planets).toHaveLength(0);
    expect(result.formedMultihostSystemV22).toBe(formed);
    expect(() => assertSystemSceneProjectionSnapshot(result)).not.toThrow();
  });

  it('binds each formed S/P planet to its own displayed orbit and a moving host-relative translation', () => {
    const tripleInput = {
      ...BASE_INPUT, seed: '00000000000000000000000000000002',
      massC: 0.6, radiusCAu: 0.003, outerBinaryAxisAu: 350,
      outerBinaryEccentricity: 0.12, samplingOuterAu: 5_000,
    };
    for (const [input, triple] of [
      [BASE_INPUT, false], [tripleInput, true],
    ] as const) {
      const source = makeSnapshot(triple);
      const catalog = generateMultihostPlanetaryCatalog(input);
      const formed = generateMultihostFormedPlanetarySystemV22({
        systemSeed: catalog.sourceSystemSeed, windows: catalog.windows,
      });
      const result = buildSystemSceneMultihostLaboratoryPreview(source, catalog, 'ALL', formed);
      const v2 = result.planets.filter(body => body.multihostOrbitV221 !== undefined);
      const limit = systemSceneMultihostRenderBudgetV221(result.multiplicityName);
      expect(result.planets.length).toBeLessThanOrEqual(limit.globalPlanetCap);
      expect(formed.planets.length).toBeGreaterThanOrEqual(v2.length);
      expect(new Set(v2.map(body => body.multihostOrbitV221!.hostId)).size)
        .toBeGreaterThan(1);
      for (const planet of v2) {
        const binding = planet.multihostOrbitV221!;
        const science = formed.planets.find(body => body.id === planet.id)!;
        const orbit = result.orbits.find(guide => guide.id === planet.orbitId)!;
        const motion = result.motions.find(item => item.id === binding.motionId)!;
        expect(orbit).toBeDefined();
        expect(motion).toBeDefined();
        expect(binding.hostId).toBe(science.hostId);
        expect(binding.orbitalPeriodDays).toBe(science.periodDays);
        expect(motion.periodDays).toBe(science.periodDays);
        expect(binding.translationState).toBe('ACTIVE');
        expect(orbit.motionId).toBe(binding.motionId);
        expect(orbit.hostRadialProjectionV22)
          .toBe(planet.motionContributions.at(-1)?.hostRadialProjectionV22);
        const sample = (seconds: number) => projectSystemSceneMotionContributions(
          planet.motionContributions, id => result.motions.find(item => item.id === id),
          result.simulation.epochSimulationDay + seconds * result.simulation.playbackDaysPerRealSecond,
          result.scale,
        );
        const origin = sample(0);
        const later = sample(20);
        expect(Math.hypot(later.x - origin.x, later.y - origin.y, later.z - origin.z))
          .toBeGreaterThan(1e-7);
      }
      expect(() => assertSystemSceneProjectionSnapshot(result)).not.toThrow();
    }
  });

  it('anchors V2.4.2 scientific moons to moving formed planets, never to the stellar barycenter', () => {
    const source = makeSnapshot(false);
    const catalog = generateMultihostPlanetaryCatalog(BASE_INPUT);
    const formed = generateMultihostFormedPlanetarySystemV22({
      systemSeed: catalog.sourceSystemSeed, windows: catalog.windows,
    });
    const result = buildSystemSceneMultihostLaboratoryPreview(source, catalog, 'ALL', formed);
    const scientificMoons = result.moons.filter(moon => moon.scientificV242 === true);
    expect(scientificMoons.length).toBeGreaterThan(0);
    expect(scientificMoons.length).toBeLessThanOrEqual(
      systemSceneMultihostRenderBudgetV221('BINARY').globalLaboratoryMoonCap);
    for (const moon of scientificMoons) {
      const parent = result.planets.find(planet => planet.id === moon.hostPlanetId)!;
      expect(parent.multihostOrbitV221).toBeDefined();
      expect(moon.spin.source).toBe('V2_4_2_SCIENTIFIC_MOON');
      expect(moon.title).toContain('Roche/Hill físicos verificados');
      expect(result.scientificMultihostMoonsV242?.moons.some(item => item.id === moon.id)).toBe(true);
      expect(moon.motionContributions.slice(0, -1)).toEqual(parent.motionContributions);
      const guide = result.orbits.find(orbit => orbit.id === moon.orbitId)!;
      expect(guide.kind).toBe('moon');
      expect(guide.anchorMotionContributions).toEqual(parent.motionContributions);
      const sample = (body: typeof moon | typeof parent, seconds: number) =>
        projectSystemSceneMotionContributions(body.motionContributions,
          id => result.motions.find(motion => motion.id === id),
          result.simulation.epochSimulationDay +
            seconds * result.simulation.playbackDaysPerRealSecond, result.scale);
      const relative = (seconds: number) => {
        const child = sample(moon, seconds);
        const host = sample(parent, seconds);
        return {x: child.x - host.x, y: child.y - host.y, z: child.z - host.z};
      };
      const first = relative(0);
      const later = relative(15);
      expect(Math.hypot(later.x - first.x, later.y - first.y, later.z - first.z))
        .toBeGreaterThan(1e-6);
    }
    expect(result.layers.moonCount).toBe(result.moons.length);
  });

  it('never interprets a V2.1 candidate as a V2.2 planet when formed host has no disk', () => {
    const source = makeSnapshot(false);
    const catalog = generateMultihostPlanetaryCatalog(BASE_INPUT);
    const formed = generateMultihostFormedPlanetarySystemV22({
      systemSeed: catalog.sourceSystemSeed, windows: catalog.windows,
      metallicitySolarRatio: 0,
    });
    const result = buildSystemSceneMultihostLaboratoryPreview(
      source, catalog, 'ALL', formed,
    );
    expect(result.planets).toHaveLength(0);
    expect(result.formedMultihostSystemV22?.planets).toHaveLength(0);
    expect(catalog.candidates.length).toBeGreaterThan(0);
  });

  it('renders a mixed binary with independently anchored S-A, S-B and P-AB orbit guides', () => {
    const source = makeSnapshot(false);
    const catalog = generateMultihostPlanetaryCatalog(BASE_INPUT);
    const result = buildSystemSceneMultihostLaboratoryPreview(source, catalog);
    expect(new Set(result.planets.map(planet => planet.label.split(' ')[0])))
      .toEqual(new Set(['A', 'B', 'AB']));
    expect(result.planets.find(planet => planet.label.startsWith('A '))!
      .motionContributions).toHaveLength(2);
    expect(result.planets.find(planet => planet.label.startsWith('AB '))!
      .motionContributions).toHaveLength(1);
    expect(result.habitableZone).toBeNull();
    expect(result.moons).toHaveLength(0);
    expect(source.experimentalMultihostCatalog).toBeUndefined();
    expect(source.planets).toHaveLength(0);
    expect(() => assertSystemSceneProjectionSnapshot(result)).not.toThrow();
  });

  it('anchors P-AB to the outer hierarchy and P-ABC to the total barycenter in a triple', () => {
    const source = makeSnapshot(true);
    const catalog = generateMultihostPlanetaryCatalog({
      ...BASE_INPUT,
      seed: '00000000000000000000000000000002',
      massC: 0.6,
      radiusCAu: 0.003,
      outerBinaryAxisAu: 350,
      outerBinaryEccentricity: 0.12,
      samplingOuterAu: 5_000,
    });
    const result = buildSystemSceneMultihostLaboratoryPreview(source, catalog);
    const ab = result.planets.find(planet => planet.label.startsWith('AB '));
    const abc = result.planets.find(planet => planet.label.startsWith('ABC '));
    expect(ab).toBeDefined();
    expect(abc).toBeDefined();
    expect(ab!.motionContributions[0]!.projectionSpace)
      .toBe(SystemSceneProjectionSpace.TRIPLE_OUTER);
    expect(abc!.motionContributions).toHaveLength(1);
    expect(abc!.motionContributions[0]!.projectionSpace)
      .toBe(SystemSceneProjectionSpace.TRIPLE_OUTER);
    expect(() => assertSystemSceneProjectionSnapshot(result)).not.toThrow();
  });

  it('retains V1 bodies, motions, HZ and belt layers when drawing QA candidates over them', () => {
    const base = makeSnapshot(false);
    const v1Motion = Object.freeze({
      id: 'v1-planet-motion', semiMajorAxisAu: 52, eccentricity: 0.03,
      periodDays: 95000, rotationDegrees: 0, inclinationDegrees: 0,
      epochMeanAnomalyDegrees: 0,
    });
    const v1Planet = Object.freeze({
      ...base.stars[0]!, id: 'v1-planet', kind: 'planet' as const,
      label: 'Original V1', orbitId: 'v1-orbit', surfaceStyle: 'rocky' as const,
      motionContributions: Object.freeze([{motionId: v1Motion.id, scale: 1}]),
    });
    const extraOrbit = Object.freeze({
      id: 'v1-orbit', kind: 'planetary' as const, label: 'Órbita V1',
      colorHex: '#FFFFFF', opacity: 1, semiMajorScene: 0.6,
      semiMinorScene: 0.6, focusOffsetScene: 0, rotationDegrees: 0,
      inclinationDegrees: 0, motionId: v1Motion.id, motionScale: 1,
      anchorMotionContributions: Object.freeze([]),
    });
    const layers = Object.freeze({...base.layers, moonCount: 1,
      minorBodyCount: 1, habitableZoneAvailable: true});
    const moon = Object.freeze({id: 'v1-moon'});
    const minor = Object.freeze({id: 'v1-comet'});
    const belt = Object.freeze({id: 'v1-belt'});
    const hz = Object.freeze({id: 'v1-hz'});
    const source = Object.freeze({...base,
      planets: Object.freeze([v1Planet]),
      moons: Object.freeze([moon]),
      minorBodies: Object.freeze([minor]),
      asteroidBelts: Object.freeze([belt]),
      habitableZone: hz,
      motions: Object.freeze([...base.motions, v1Motion]),
      orbits: Object.freeze([extraOrbit]), layers,
    } as unknown as SystemSceneSnapshot);
    const catalog = generateMultihostPlanetaryCatalog(BASE_INPUT);
    const result = buildSystemSceneMultihostLaboratoryPreview(source, catalog);
    expect(result.planets[0]).toBe(v1Planet);
    expect(result.planets.length).toBeGreaterThan(source.planets.length);
    expect(result.moons).toBe(source.moons);
    expect(result.minorBodies).toBe(source.minorBodies);
    expect(result.asteroidBelts).toBe(source.asteroidBelts);
    expect(result.habitableZone).toBe(source.habitableZone);
    expect(result.layers).toBe(source.layers);
    expect(result.orbits[0]).toBe(extraOrbit);
    expect(result.motions).toContain(v1Motion);
    expect(result.experimentalMultihostCatalog).toBe(catalog);
    expect(source.planets).toHaveLength(1);
  });

  it('slows fast S-type and accelerates nearly static P-type ONLY in presentation', () => {
    const source = makeSnapshot(false);
    const catalog = generateMultihostPlanetaryCatalog(BASE_INPUT);
    const result = buildSystemSceneMultihostLaboratoryPreview(source, catalog);
    for (const candidate of catalog.candidates) {
      const body = result.planets.find(p => p.id === candidate.id);
      if (body === undefined) continue; // outside scene extent
      const contribution = body.motionContributions.at(-1)!;
      const realSecondsPerCycle = candidate.periodDays /
        (source.simulation.playbackDaysPerRealSecond * contribution.presentationTimeScale!);
      expect(realSecondsPerCycle).toBeCloseTo(
        candidate.family === 'S_TYPE'
          ? MULTIHOST_V221_SECONDS_PER_ORBIT.PLANET_S
          : MULTIHOST_V221_SECONDS_PER_ORBIT.PLANET_P,
        9,
      );
      expect(result.motions.find(m => m.id === contribution.motionId)!.periodDays)
        .toBe(candidate.periodDays);
      expect(body.spin.source).toBe('QA_PREVIEW_V2');
      expect(body.spin.rotationPeriodHours).toBeNull();
      // Measure actual moving QA position, not only its declared display rate.
      const sample = (day: number) => projectSystemSceneMotionContributions(
        [contribution], id => result.motions.find(motion => motion.id === id),
        day, result.scale,
      );
      const before = sample(source.simulation.epochSimulationDay);
      const after = sample(source.simulation.epochSimulationDay +
        source.simulation.playbackDaysPerRealSecond * 15);
      expect(Math.hypot(after.x - before.x, after.y - before.y, after.z - before.z))
        .toBeGreaterThan(1e-4);
    }
    expect(source.simulation).toBe(result.simulation);
  });

  it('slows the stellar hierarchy far below planet cadence and keeps auxiliary V1 layers coherent', () => {
    const source = makeSnapshot(true);
    const catalog = generateMultihostPlanetaryCatalog({
      ...BASE_INPUT, seed: '00000000000000000000000000000002',
      massC: 0.6, radiusCAu: 0.003, outerBinaryAxisAu: 350,
      outerBinaryEccentricity: 0.12, samplingOuterAu: 5_000,
    });
    const formed = generateMultihostFormedPlanetarySystemV22({
      systemSeed: catalog.sourceSystemSeed, windows: catalog.windows,
    });
    const result = buildSystemSceneMultihostLaboratoryPreview(source, catalog, 'ALL', formed);
    for (const star of result.stars) {
      for (const contribution of star.motionContributions) {
        const motion = result.motions.find(entry => entry.id === contribution.motionId)!;
        const seconds = motion.periodDays /
          (result.simulation.playbackDaysPerRealSecond * contribution.presentationTimeScale!);
        const expected = contribution.projectionSpace === SystemSceneProjectionSpace.TRIPLE_OUTER
          ? MULTIHOST_V221_SECONDS_PER_ORBIT.STELLAR_OUTER
          : MULTIHOST_V221_SECONDS_PER_ORBIT.STELLAR_INNER;
        expect(seconds).toBeCloseTo(expected, 8);
        expect(seconds).toBeGreaterThan(MULTIHOST_V221_SECONDS_PER_ORBIT.PLANET_P * 4);
      }
    }
    expect(result.minorBodies.map(body => body.id)).toEqual(source.minorBodies.map(body => body.id));
    expect(result.asteroidBelts?.map(belt => belt.id)).toEqual(source.asteroidBelts?.map(belt => belt.id));
    expect(result.habitableZone === null).toBe(source.habitableZone === null);
    expect(() => assertSystemSceneProjectionSnapshot(result)).not.toThrow();
  });


  it('decompacts binary and triple layouts into separated local S envelopes and outer shared P layers', () => {
    for (const [input, triple] of [
      [BASE_INPUT, false],
      [{
        ...BASE_INPUT,
        seed: '00000000000000000000000000000002',
        massC: 0.6,
        radiusCAu: 0.003,
        outerBinaryAxisAu: 350,
        outerBinaryEccentricity: 0.12,
        samplingOuterAu: 5_000,
      }, true],
    ] as const) {
      const source = makeSnapshot(triple);
      const catalog = generateMultihostPlanetaryCatalog(input);
      const formed = generateMultihostFormedPlanetarySystemV22({
        systemSeed: catalog.sourceSystemSeed, windows: catalog.windows,
      });
      const result = buildSystemSceneMultihostLaboratoryPreview(source, catalog, 'ALL', formed);
      expect(result.multihostLayoutV222?.version).toBe(
        triple ? 'V2_2_3_LAYOUT_V1' : 'V2_2_4_BINARY_LAYOUT_V1');
      const envelopes = result.multihostLayoutV222?.hostEnvelopes ?? [];
      // Formation is stochastic and may leave otherwise usable A/B/C/AB/ABC
      // disks empty. A layout envelope exists for rendered hosts, not for
      // every theoretically admissible but unpopulated host window.
      const renderedHosts = new Set(result.planets
        .map(planet => planet.multihostOrbitV221?.hostId)
        .filter((host): host is NonNullable<typeof host> => host !== undefined));
      const byHost = new Map(envelopes.map(envelope => [envelope.hostId, envelope]));
      expect(new Set(byHost.keys())).toEqual(renderedHosts);
      expect(envelopes.length).toBeGreaterThan(0);
      for (const host of triple ? ['A', 'B', 'C'] as const : ['A', 'B'] as const) {
        const envelope = byHost.get(host);
        if (envelope === undefined) continue;
        expect(envelope.family).toBe('S_TYPE');
        expect(envelope.renderedPlanetCount).toBeGreaterThan(0);
        expect(envelope.outerEnvelopeScene).toBeGreaterThan(envelope.firstOrbitScene);
      }
      const sharedAb = byHost.get('AB');
      if (!triple) {
        expect(sharedAb).toBeUndefined();
        expect(result.planets.every(planet =>
          planet.multihostOrbitV221?.hostId === 'A' ||
          planet.multihostOrbitV221?.hostId === 'B')).toBe(true);
      } else {
        if (sharedAb !== undefined) {
          for (const host of ['A', 'B'] as const) {
            const local = byHost.get(host);
            if (local !== undefined) {
              expect(sharedAb.firstOrbitScene).toBeGreaterThan(local.outerEnvelopeScene);
            }
          }
        }
        const sharedAbc = byHost.get('ABC');
        if (sharedAbc !== undefined) {
          if (sharedAb !== undefined) {
            expect(sharedAbc.firstOrbitScene).toBeGreaterThan(sharedAb.outerEnvelopeScene);
          }
          const localC = byHost.get('C');
          if (localC !== undefined) {
            expect(localC.outerEnvelopeScene).toBeLessThan(sharedAbc.firstOrbitScene);
          }
        }
      }
      const sourceSpread = Math.max(...source.stars.map(star => Math.hypot(star.position.x, star.position.y, star.position.z)));
      const resultSpread = Math.max(...result.stars.map(star => Math.hypot(star.position.x, star.position.y, star.position.z)));
      expect(resultSpread).toBeGreaterThan(sourceSpread);
      expect(() => assertSystemSceneProjectionSnapshot(result)).not.toThrow();
    }
  });

  it('in BINARY formed QA renders exclusively S-A/S-B and never a barycentric or legacy planetary orbit', () => {
    const source = makeSnapshot(false);
    const original = Object.freeze({
      ...source,
      planets: Object.freeze([Object.freeze({
        ...source.stars[0]!, id: 'v1-frozen-planet', kind: 'planet' as const,
        label: 'V1 P-type', orbitId: 'v1-planetary-orbit', surfaceStyle: 'rocky' as const,
      })]),
      orbits: Object.freeze([Object.freeze({
        id: 'v1-planetary-orbit', kind: 'planetary' as const,
        label: 'V1 barycentric guide', colorHex: '#FFFFFF', opacity: 1,
        semiMajorScene: 1, semiMinorScene: 1, focusOffsetScene: 0,
        rotationDegrees: 0, inclinationDegrees: 0,
        motionId: 'inner', motionScale: 1, anchorMotionContributions: Object.freeze([]),
      })]),
      asteroidBelts: Object.freeze([Object.freeze({
        id: 'v1-global-belt', anchorMotionContributions: Object.freeze([]),
      })]),
    } as unknown as SystemSceneSnapshot);
    const catalog = generateMultihostPlanetaryCatalog(BASE_INPUT);
    const formed = generateMultihostFormedPlanetarySystemV22({
      systemSeed: catalog.sourceSystemSeed, windows: catalog.windows,
    });
    expect(formed.planets.some(planet => planet.hostId === 'AB')).toBe(true);
    const result = buildSystemSceneMultihostLaboratoryPreview(original, catalog, 'ALL', formed);
    const renderedHosts = new Set(result.planets.map(planet => planet.multihostOrbitV221?.hostId));
    expect(renderedHosts.has('A')).toBe(true);
    expect(renderedHosts.has('B')).toBe(true);
    expect([...renderedHosts].every(host => host === 'A' || host === 'B')).toBe(true);
    expect(result.planets.find(planet => planet.id === 'v1-frozen-planet')).toBeUndefined();
    expect(result.orbits.find(orbit => orbit.id === 'v1-planetary-orbit')).toBeUndefined();
    expect(result.orbits.every(orbit =>
      orbit.kind === 'stellar' ||
      (orbit.kind === 'planetary' && result.planets.some(planet => planet.orbitId === orbit.id)) ||
      (orbit.kind === 'moon' && result.moons.some(moon => moon.orbitId === orbit.id)) ||
      (orbit.kind === 'minor-body' && result.minorBodies.some(body => body.orbitId === orbit.id)))).toBe(true);
    expect(result.multihostLayoutV222?.hostEnvelopes.map(envelope => envelope.hostId))
      .toEqual(['A', 'B']);
    expect(result.asteroidBelts?.every(belt => belt.scientificV243 && !belt.previewOnlyV23)).toBe(true);
    expect(result.habitableZone).toBeNull();
    expect(result.layers.minorBodyCount).toBe(result.minorBodies.length);
    expect(result.minorBodies.every(body => body.scientificV243 && !body.previewOnlyV23)).toBe(true);
    expect(result.layers.habitableZoneAvailable).toBe(true);
    expect(result.multihostHabitableZonesV23?.map(zone => zone.hostId)).toEqual(['A', 'B']);
    for (const zone of result.multihostHabitableZonesV23 ?? []) {
      const star = result.stars.find(value => value.label === zone.hostId)!;
      expect(zone.anchorMotionContributions).toBe(star.motionContributions);
      expect(zone.radiativeInnerRadiusScene).toBeLessThan(zone.radiativeOuterRadiusScene);
    }
    expect(result.moons.every(moon => moon.scientificV242 === true)).toBe(true);
    for (const star of result.stars) {
      const stellar = star.motionContributions[0]!;
      const stellarMotion = result.motions.find(motion => motion.id === stellar.motionId)!;
      const secondsPerOrbit = stellarMotion.periodDays /
        (result.simulation.playbackDaysPerRealSecond * stellar.presentationTimeScale!);
      expect(secondsPerOrbit).toBeCloseTo(MULTIHOST_V221_SECONDS_PER_ORBIT.STELLAR_INNER, 7);
      const later = projectSystemSceneMotionContributions(
        star.motionContributions, id => result.motions.find(motion => motion.id === id),
        result.simulation.epochSimulationDay + result.simulation.playbackDaysPerRealSecond * 30,
        result.scale,
      );
      expect(Math.hypot(later.x - star.position.x, later.y - star.position.y, later.z - star.position.z))
        .toBeGreaterThan(1e-5);
    }
    for (const planet of result.planets) {
      const host = source.stars.find(star => star.label === planet.multihostOrbitV221?.hostId)!;
      const orbit = result.orbits.find(guide => guide.id === planet.orbitId)!;
      expect(planet.motionContributions.slice(0, -1)).toEqual(
        result.stars.find(star => star.id === host.id)!.motionContributions);
      expect(orbit.anchorMotionContributions).toEqual(planet.motionContributions.slice(0, -1));
      expect(planet.multihostOrbitV221?.translationState).toBe('ACTIVE');
    }
    // No destructive migration: source and scientific P-AB aggregate stay untouched.
    expect(original.planets).toHaveLength(1);
    expect(original.orbits).toHaveLength(1);
    expect(formed.planets.some(planet => planet.hostId === 'AB')).toBe(true);
    const pOnly = buildSystemSceneMultihostLaboratoryPreview(original, catalog, 'P_TYPE', formed);
    expect(pOnly.planets).toHaveLength(0);
    expect(pOnly.orbits.every(orbit => orbit.kind === 'stellar')).toBe(true);
    expect(() => assertSystemSceneProjectionSnapshot(result)).not.toThrow();
  });

  it('V2.4.3 retains complete A/B minor-body science behind bounded host-relative renderer layers', () => {
    const fixture = makeSnapshot(false);
    const source: SystemSceneSnapshot = Object.freeze({
      ...fixture,
      stars: Object.freeze(fixture.stars.map(star => star.label === 'B'
        ? Object.freeze({...star, sourceLuminositySolar: 0.42}) : star)),
    });
    const before = JSON.stringify(source);
    let seenVisible = 0;
    let seenScientific = 0;
    let visibleComets = 0;
    let inboundVisitors = 0;
    for (let ordinal = 1; ordinal <= 10; ordinal++) {
      const seed = ordinal.toString(16).padStart(32, '0').toUpperCase();
      const catalog = generateMultihostPlanetaryCatalog({...BASE_INPUT, seed});
      const formed = generateMultihostFormedPlanetarySystemV22({
        systemSeed: catalog.sourceSystemSeed, windows: catalog.windows,
        hostLuminositiesSolarV241: {A: 1, B: 0.42},
      });
      const result = buildSystemSceneMultihostLaboratoryPreview(source, catalog, 'ALL', formed);
      const science = result.scientificMultihostMinorBodiesV243!;
      expect(science.version).toBe('V2_4_3_MINOR_BODY_SCIENCE');
      expect(science.sourceSystemSeed).toBe(catalog.sourceSystemSeed);
      expect(science.hosts.map(host => host.hostId)).toEqual(['A', 'B']);
      expect(result.minorBodies.length).toBeLessThanOrEqual(26);
      expect(result.asteroidBelts!.length).toBeLessThanOrEqual(4);
      expect(result.minorBodies.length).toBeLessThanOrEqual(science.bodies.length);
      expect(result.asteroidBelts!.length).toBeLessThanOrEqual(science.belts.length);
      expect(result.minorBodies.every(body => body.scientificV243 === true &&
        body.previewOnlyV23 !== true)).toBe(true);
      expect(result.asteroidBelts!.every(belt => belt.scientificV243 === true &&
        belt.previewOnlyV23 !== true)).toBe(true);
      seenVisible += result.minorBodies.length;
      seenScientific += science.bodies.length;
      for (const body of result.minorBodies) {
        const physical = science.bodies.find(item => item.id === body.id)!;
        const guide = result.orbits.find(item => item.id === body.orbitId)!;
        const motion = result.motions.find(item => item.id === guide.motionId)!;
        const host = result.stars.find(item => item.label === physical.hostId)!;
        expect(physical).toBeDefined();
        expect(body.hostIdV243).toBe(physical.hostId);
        expect(body.motionContributions.slice(0, -1)).toEqual(host.motionContributions);
        expect(guide.anchorMotionContributions).toBe(host.motionContributions);
        expect(guide.hostRadialProjectionV22)
          .toBe(body.motionContributions.at(-1)!.hostRadialProjectionV22);
        expect(motion.periodDays).toBe(physical.periodDays);
        expect(motion.semiMajorAxisAu).toBe(physical.semiMajorAxisAu);
        expect((body.asteroidPresentation ?? body.cometPresentation)?.source)
          .toBe('V2_4_3_SCIENTIFIC_REFERENCE');
        if (physical.kind === 'COMET') {
          visibleComets++;
          inboundVisitors += Number(physical.cometOrbitClass === 'INBOUND_VISITOR');
          expect(body.title).toContain('reservorio frío S-type');
          expect(guide.hostRadialProjectionV22).toBeUndefined();
          expect(guide.linearScenePerAu).toBe(body.motionContributions.at(-1)!.linearScenePerAu);
          const ellipse = buildSystemSceneMinorBodyOrbitPresentationV1({
            semiMajorAxisAu: physical.semiMajorAxisAu, eccentricity: physical.eccentricity,
            projectedSemiMajorScene: systemSceneMultihostProjectedRadiusV22(
              physical.semiMajorAxisAu,
              result.planets.find(p => p.multihostOrbitV221?.hostId === physical.hostId)!
                .motionContributions.at(-1)!.hostRadialProjectionV22!,
            ),
            maximumVisibleStarRadiusScene: Math.max(host.radiusScene,
              host.opticalRadiusScene ?? host.radiusScene),
          });
          expect(guide.semiMajorScene).toBeCloseTo(ellipse.semiMajorScene, 9);
          expect(guide.semiMinorScene).toBeCloseTo(ellipse.semiMinorScene, 9);
          expect(guide.focusOffsetScene).toBeCloseTo(ellipse.focusOffsetScene, 9);
          const visual = {...body.cometPresentation!, epochMeanAnomalyDegrees: 0};
          const near = systemSceneCometActivityAtSimulationDayV1(visual, 0, body.radiusScene);
          const far = systemSceneCometActivityAtSimulationDayV1(visual,
            physical.periodDays / (2 * visual.presentationTimeScale), body.radiusScene);
          expect(near.incidentFluxEarth).toBeGreaterThan(far.incidentFluxEarth);
          expect(near.activityIndex01).toBeGreaterThanOrEqual(far.activityIndex01);
        }
      }
      expect(() => assertSystemSceneProjectionSnapshot(result)).not.toThrow();
    }
    expect(seenScientific).toBeGreaterThan(20);
    expect(seenVisible).toBeGreaterThan(10);
    expect(visibleComets).toBeGreaterThan(0);
    expect(inboundVisitors).toBeGreaterThan(0);
    expect(JSON.stringify(source)).toBe(before);
    expect(source.minorBodies).toHaveLength(0);
  });

  it('uses exactly the V1 Kepler ellipse/clearance and Ω/i/ω orientation for every binary comet', () => {
    const fixture = makeSnapshot(false);
    const source = Object.freeze({...fixture,
      stars: Object.freeze(fixture.stars.map(star => star.label === 'B'
        ? Object.freeze({...star, sourceLuminositySolar: 0.42}) : star)),
    });
    let visitors = 0;
    let tilted = 0;
    let rotatedPeriapsides = 0;
    for (const axis of [12, 21.75, 93]) for (let n = 1; n <= 10; n++) {
      const seed = n.toString(16).padStart(32, '0').toUpperCase();
      const catalog = generateMultihostPlanetaryCatalog({...BASE_INPUT, seed, innerBinaryAxisAu: axis});
      const formed = generateMultihostFormedPlanetarySystemV22({
        systemSeed: catalog.sourceSystemSeed, windows: catalog.windows,
        hostLuminositiesSolarV241: {A: 1, B: 0.42},
      });
      const result = buildSystemSceneMultihostLaboratoryPreview(source, catalog, 'ALL', formed);
      const physical = result.scientificMultihostMinorBodiesV243!;
      const motions = new Map(result.motions.map(motion => [motion.id, motion]));
      for (const body of result.minorBodies.filter(item => item.cometPresentation !== null)) {
        const comet = physical.bodies.find(item => item.id === body.id)!;
        const orbit = result.orbits.find(item => item.id === body.orbitId)!;
        const local = body.motionContributions.at(-1)!;
        const motion = motions.get(local.motionId)!;
        const host = result.stars.find(item => item.label === comet.hostId)!;
        const hostPlanet = result.planets.find(item => item.multihostOrbitV221?.hostId === comet.hostId)!;
        const projection = hostPlanet.motionContributions.at(-1)!.hostRadialProjectionV22!;
        const reference = buildSystemSceneMinorBodyOrbitPresentationV1({
          semiMajorAxisAu: comet.semiMajorAxisAu,
          eccentricity: comet.eccentricity,
          projectedSemiMajorScene: systemSceneMultihostProjectedRadiusV22(comet.semiMajorAxisAu, projection),
          maximumVisibleStarRadiusScene: Math.max(host.radiusScene,
            host.opticalRadiusScene ?? host.radiusScene),
        });
        expect(orbit.semiMajorScene).toBeCloseTo(reference.semiMajorScene, 9);
        expect(orbit.semiMinorScene).toBeCloseTo(reference.semiMinorScene, 9);
        expect(orbit.focusOffsetScene).toBeCloseTo(reference.focusOffsetScene, 9);
        expect(local.hostRadialProjectionV22).toBeUndefined();
        expect(orbit.hostRadialProjectionV22).toBeUndefined();
        expect(local.linearScenePerAu).toBeCloseTo(reference.semiMajorScene / comet.semiMajorAxisAu, 9);
        expect(orbit.linearScenePerAu).toBe(local.linearScenePerAu);
        expect(motion.longitudeAscendingNodeDegrees).toBe(comet.longitudeAscendingNodeDegrees);
        expect(motion.argumentOfPeriapsisDegrees).toBe(comet.argumentOfPeriapsisDegrees);
        expect(orbit.inclinationDegrees).toBe(comet.inclinationDegrees);
        expect(body.cometPresentation!.eccentricity).toBe(comet.eccentricity);
        const points = sampleSystemSceneOrbitLocalAu(motion, 'minor-body', 128);
        const radii = points.map(point => Math.hypot(point.x, point.y, point.z) * local.linearScenePerAu!);
        expect(Math.min(...radii)).toBeCloseTo(reference.semiMajorScene * (1-comet.eccentricity), 7);
        expect(Math.max(...radii)).toBeCloseTo(reference.semiMajorScene * (1+comet.eccentricity), 7);
        // The moving V2 nucleus uses precisely the same V1 local AU sample
        // and affine scale as the Three.js guide (not a warped radial map).
        const epoch = result.simulation.epochSimulationDay;
        const parentAtEpoch = projectSystemSceneMotionContributions(
          host.motionContributions, id => motions.get(id), epoch, result.scale);
        const nucleusAtEpoch = projectSystemSceneMotionContributions(
          body.motionContributions, id => motions.get(id), epoch, result.scale);
        const point = SystemOrbitalMotionEngine.positionAtSimulationDay(
          motion, epoch * local.presentationTimeScale!);
        expect(nucleusAtEpoch.x - parentAtEpoch.x).toBeCloseTo(point.xAu * local.linearScenePerAu!, 7);
        expect(nucleusAtEpoch.y - parentAtEpoch.y).toBeCloseTo(point.yAu * local.linearScenePerAu!, 7);
        expect(nucleusAtEpoch.z - parentAtEpoch.z).toBeCloseTo(point.zAu * local.linearScenePerAu!, 7);
        if (comet.cometOrbitClass === 'INBOUND_VISITOR') {
          visitors++;
          expect(comet.eccentricity).toBeGreaterThanOrEqual(0.724);
          tilted += Number(comet.inclinationDegrees > 20);
          rotatedPeriapsides += Number(Math.abs(comet.argumentOfPeriapsisDegrees ?? 0) > 1);
        }
      }
      expect(() => assertSystemSceneProjectionSnapshot(result)).not.toThrow();
    }
    expect(visitors).toBeGreaterThan(10);
    expect(tilted).toBeGreaterThan(3);
    expect(rotatedPeriapsides).toBeGreaterThan(10);
  });

  it('filters S/P families without mutating the catalogue or existing scene', () => {
    const source = makeSnapshot(false);
    const catalog = generateMultihostPlanetaryCatalog(BASE_INPUT);
    const s = buildSystemSceneMultihostLaboratoryPreview(source, catalog, 'S_TYPE');
    const p = buildSystemSceneMultihostLaboratoryPreview(source, catalog, 'P_TYPE');
    expect(s.planets.every(planet => !planet.label.startsWith('AB '))).toBe(true);
    expect(p.planets.every(planet => planet.label.startsWith('AB '))).toBe(true);
    expect(s.experimentalMultihostCatalog).toBe(catalog);
    expect(p.experimentalMultihostCatalog).toBe(catalog);
    expect(Object.isFrozen(s.planets)).toBe(true);
    expect(Object.isFrozen(p.planets)).toBe(true);
    expect(source.planets).toHaveLength(0);
  });
});
