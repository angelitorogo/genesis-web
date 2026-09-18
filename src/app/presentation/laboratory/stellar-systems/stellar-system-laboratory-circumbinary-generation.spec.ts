import { DiscoveryState } from '../../../domain/discovery/discovery-state';
import { PlanetarySystemOrbitTopology } from '../../../domain/planetary/planetary-system-orbit-topology';
import { SystemSceneSnapshotBuilder, type SystemSceneSnapshot } from '../../system/system-scene-snapshot';
import { assertSystemSceneProjectionSnapshot } from '../../system/system-scene-projection-contract';
import { composeLaboratoryBinaryScene } from './stellar-system-laboratory-binary-composition';
import { composeLaboratoryTripleScene } from './stellar-system-laboratory-triple-composition';
import {
  generateLaboratoryCircumbinaryPopulation,
  LAB_P_MAX_APOASTRON_BINARY_AXES,
} from './stellar-system-laboratory-circumbinary-generation';
import { appendLaboratoryCircumbinaryScene } from './stellar-system-laboratory-circumbinary-scene';
import {
  StellarSystemLaboratoryCaseId,
  StellarSystemLaboratoryFamilyId,
  StellarSystemLaboratoryFixtures,
  type StellarSystemLaboratoryFrame,
} from './stellar-system-laboratory-fixtures';

function singleScene(frame: StellarSystemLaboratoryFrame): SystemSceneSnapshot {
  const stage = frame.stages.find(item => item.discoveryState.code === DiscoveryState.CATALOGUED.code)!;
  const key = StellarSystemLaboratoryFixtures.generationKey();
  return SystemSceneSnapshotBuilder.buildFromSource({
    universeSeed: key.universeSeed.serialize(),
    generatorVersionCode: key.generatorVersionCode,
    locator: frame.family.locator,
    proceduralIdentity: `Laboratory/SINGLE/${frame.family.id}`,
    discoveryState: stage.discoveryState,
    discoveryStateLabel: stage.label,
    stellarSystemCard: stage.card,
    revealMinorBodyGroundTruth: true,
  });
}

function sample(kind: 'BINARY' | 'TRIPLE', family: StellarSystemLaboratoryFamilyId) {
  const frame = StellarSystemLaboratoryFixtures.frame(kind, family);
  const sources = frame.sourceSystems!;
  const scenes = sources.map(singleScene);
  const masses = sources.map(source =>
    source.stages[2]!.card.render.components[0]!.massSolar!);
  const base = kind === 'BINARY'
    ? composeLaboratoryBinaryScene(scenes[0]!, scenes[1]!, frame.family,
      masses as [number, number])
    : composeLaboratoryTripleScene(scenes[0]!, scenes[1]!, scenes[2]!, frame.family,
      masses as [number, number, number]);
  const inner = base.motions.find(motion => motion.id === 'lab-binary-relative')!;
  const outer = base.motions.find(motion => motion.id === 'lab-triple-outer-relative');
  const population = generateLaboratoryCircumbinaryPopulation(frame.family, sources, inner, outer);
  const rendered = appendLaboratoryCircumbinaryScene(base, population);
  return { frame, sources, base, inner, population, rendered };
}

describe('LAB independent, generated circumbinary P-type planets', () => {
  it('builds real domain planets in a BINARY and reuses them in an immutable scene', () => {
    const { frame, sources, base, inner, population, rendered } = sample('BINARY', StellarSystemLaboratoryFamilyId.B);
    expect(population.planets.length).toBeGreaterThan(0);
    expect(generateLaboratoryCircumbinaryPopulation(frame.family, sources, inner)).toBe(population);
    for (const planet of population.planets) {
      expect(planet.orbitTopology).toBe(PlanetarySystemOrbitTopology.CIRCUMBINARY);
      expect(planet.orbit.semiMajorAxisAu)
        .toBeGreaterThanOrEqual(population.compatibility!.minimumStableSemiMajorAxisAu);
      expect(planet.orbit.apoastronAu)
        .toBeLessThanOrEqual(inner.semiMajorAxisAu * LAB_P_MAX_APOASTRON_BINARY_AXES);
      expect(planet.massEarth).toBeGreaterThan(0);
      expect(rendered.planets.find(body => body.id === `lab-p-planet-${planet.planetOrdinal}`)
        ?.specialPresentation?.sourcePlanetType).toBe(planet.planetType);
    }
    expect(rendered.stars).toBe(base.stars);
    expect(rendered.moons).toBe(base.moons);
    expect(rendered.minorBodies).toBe(base.minorBodies);
    expect(rendered.planets.slice(0, base.planets.length)).toEqual(base.planets);
    expect(rendered.planets.length).toBe(base.planets.length + population.planets.length);
    assertSystemSceneProjectionSnapshot(rendered);
  }, 120_000);

  it('binds TRIPLE P planets to the inner A-B barycentre, bounds them against C and retains all three SINGLE systems', () => {
    const { base, inner, population, rendered } = sample('TRIPLE', StellarSystemLaboratoryFamilyId.G);
    expect(population.planets.length).toBeGreaterThan(0);
    expect(population.stableOuterLimitAu).not.toBeNull();
    expect(rendered.stars).toBe(base.stars);
    expect(rendered.moons).toBe(base.moons);
    expect(rendered.planets.slice(0, base.planets.length)).toEqual(base.planets);
    for (const planet of population.planets) {
      expect(planet.orbitTopology).toBe(PlanetarySystemOrbitTopology.CIRCUMBINARY);
      expect(planet.orbit.apoastronAu).toBeLessThanOrEqual(population.stableOuterLimitAu!);
      expect(planet.orbit.apoastronAu).toBeLessThanOrEqual(inner.semiMajorAxisAu * LAB_P_MAX_APOASTRON_BINARY_AXES);
      const scenePlanet = rendered.planets.find(body => body.id === `lab-p-planet-${planet.planetOrdinal}`)!;
      expect(scenePlanet.motionContributions.map(contribution => contribution.motionId)).toEqual([
        'lab-triple-outer-relative', `lab-p-motion-${planet.planetOrdinal}`,
      ]);
    }
    assertSystemSceneProjectionSnapshot(rendered);
  }, 120_000);

  it('does not synthesize P planets when disk maturation produces no cores or hierarchy is incompatible', () => {
    const emptyBinary = sample('BINARY', StellarSystemLaboratoryFamilyId.A);
    expect(emptyBinary.population.planets).toHaveLength(0);
    expect(emptyBinary.rendered.planets).toEqual(emptyBinary.base.planets);
    const excludedTriple = sample('TRIPLE', StellarSystemLaboratoryFamilyId.A);
    expect(excludedTriple.population.planets).toHaveLength(0);
    expect(excludedTriple.rendered.planets).toEqual(excludedTriple.base.planets);
    assertSystemSceneProjectionSnapshot(excludedTriple.rendered);
  }, 120_000);
});
