import { vi } from 'vitest';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { PlanetGenerator } from '../../simulation/planetary/planet-generator';
import { MoonGenerator } from '../../simulation/planetary/moon-generator';
import { AtmosphereGenerator } from '../../simulation/planetary/atmosphere-generator';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { StellarMultihostFormation } from '../../simulation/stellar/stellar-multihost-formation';
import { StellarSystemMultiplicitySelector } from '../../simulation/stellar/stellar-system-multiplicity-selector';
import { ArchiveStellarSystemCardAssembler } from '../genesis-archive/archive-stellar-system-card';
import { assertSystemSceneProjectionSnapshot } from './system-scene-projection-contract';
import { type SystemSceneSnapshotSource } from './system-scene-snapshot';
import { SystemSceneMultihostMaterializedSources } from './system-scene-multihost-materialized-sources';
import { SystemSceneMultihostComposition } from './system-scene-multihost-composition';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V1,
);
function fixture(multiplicity: StellarSystemMultiplicity): SystemLocator {
  for (let index = 0n; index < 128n; index++) {
    const locator = new SystemLocator(0n, 0n, index);
    const seed = ProceduralTargetResolver.resolveTargetSeed(key, locator);
    if (StellarSystemMultiplicitySelector.select(key, seed as Parameters<
      typeof StellarSystemMultiplicitySelector.select>[1]) === multiplicity) return locator;
  }
  throw new Error('No fixture available.');
}
function metadata(locator: SystemLocator): SystemSceneSnapshotSource {
  return Object.freeze({
    universeSeed: key.universeSeed.serialize(), generatorVersionCode: key.generatorVersionCode,
    locator, proceduralIdentity: `G${locator.galaxyIndex}/S${locator.sectorKey}/O${locator.galacticObjectIndex}`,
    discoveryState: DiscoveryState.CATALOGUED,
    discoveryStateLabel: DiscoveryState.CATALOGUED.name,
    stellarSystemCard: ArchiveStellarSystemCardAssembler.build(key, locator, DiscoveryState.CATALOGUED),
  });
}

describe('Stage 7: opt-in physically sourced hierarchical scene, no global route cutover', () => {
  it.each([StellarSystemMultiplicity.BINARY, StellarSystemMultiplicity.TRIPLE])(
    'composes exact A/B/C/P planets and their moons with original physical motions for %s', multiplicity => {
      const locator = fixture(multiplicity);
      const formation = StellarMultihostFormation.generateOrNull(key, locator)!;
      const projected = SystemSceneMultihostMaterializedSources.build(formation, metadata(locator));
      const generatePlanets = vi.spyOn(PlanetGenerator, 'generateAll');
      const generateMoons = vi.spyOn(MoonGenerator, 'generateAll');
      const generateAtmospheres = vi.spyOn(AtmosphereGenerator, 'generateAll');
      try {
        const { snapshot, planetBindings } = SystemSceneMultihostComposition.build(formation, projected);
        expect(generatePlanets).not.toHaveBeenCalled();
        expect(generateMoons).not.toHaveBeenCalled();
        expect(generateAtmospheres).not.toHaveBeenCalled();
        expect(() => assertSystemSceneProjectionSnapshot(snapshot)).not.toThrow();
        expect(snapshot.multiplicityName).toBe(multiplicity.name);
        expect(snapshot.stars).toHaveLength(formation.components.length);
        expect(snapshot.planets).toHaveLength(formation.publicPlanets.length);
        expect(snapshot.moons).toHaveLength(formation.publicPlanets.reduce(
          (sum, entry) => sum + entry.moonSystem.relevantMoonCount, 0));
        expect(planetBindings).toHaveLength(formation.publicPlanets.length);
        expect(snapshot.habitableZones!.length).toBeGreaterThanOrEqual(formation.components.length);
        expect(snapshot.habitableZones!.length).toBeLessThanOrEqual(formation.components.length + 1);
        const pZone = snapshot.habitableZones!.filter(zone => zone.topology === 'CIRCUMBINARY');
        expect(pZone.length).toBeLessThanOrEqual(1);
        if (pZone.length) {
          expect(pZone[0]!.anchorMotionContributions.map(part => part.motionId)).toEqual(
            formation.outerOrbit === null ? [] : ['multihost-abc-relative'],
          );
        }
        expect(snapshot.motions.find(m => m.id === 'multihost-ab-relative')?.semiMajorAxisAu)
          .toBe(formation.innerOrbit.semiMajorAxisAu);
        expect(snapshot.motions.find(m => m.id === 'multihost-ab-relative')?.periodDays)
          .toBe(formation.innerOrbit.periodDays);
        expect(snapshot.motions.find(m => m.id === 'multihost-abc-relative')?.semiMajorAxisAu ?? null)
          .toBe(formation.outerOrbit?.semiMajorAxisAu ?? null);
        for (const [index, binding] of planetBindings.entries()) {
          const publicBody = formation.publicPlanets[index]!;
          expect(binding.publicLocator).toBe(publicBody.publicLocator);
          expect(binding.host).toBe(publicBody.host);
          const sceneBody = snapshot.planets.find(planet => planet.id === binding.sceneBodyId)!;
          expect(sceneBody).toBeDefined();
          const localMotion = snapshot.motions.find(m => m.id === sceneBody.motionContributions.at(-1)?.motionId)!;
          expect(localMotion.semiMajorAxisAu).toBe(publicBody.planet.orbit.semiMajorAxisAu);
          expect(localMotion.periodDays).toBe(publicBody.planet.orbitalPeriod.periodDays);
          expect(projected.scientific.resolveDetailed(key, binding.publicLocator)!.detail.general.massEarth)
            .toBe(publicBody.planet.massEarth);
          expect(snapshot.moons.filter(moon => moon.hostPlanetId === binding.sceneBodyId))
            .toHaveLength(publicBody.moonSystem.relevantMoonCount);
          if (publicBody.host === 'AB') {
            expect(sceneBody.motionContributions.some(part => part.motionId === 'multihost-ab-relative')).toBe(false);
            expect(sceneBody.motionContributions.some(part => part.motionId === 'multihost-abc-relative'))
              .toBe(formation.outerOrbit !== null);
          } else {
            expect(sceneBody.motionContributions.some(part => part.motionId === 'multihost-ab-relative'))
              .toBe(publicBody.host !== 'C');
          }
        }
        expect(new Set(snapshot.planets.map(p => p.id)).size).toBe(snapshot.planets.length);
        expect(new Set(snapshot.orbits.map(o => o.id)).size).toBe(snapshot.orbits.length);
        expect(new Set(snapshot.motions.map(m => m.id)).size).toBe(snapshot.motions.length);
        expect(snapshot.universeSeed).toBe(key.universeSeed.serialize());
        expect(Object.isFrozen(planetBindings)).toBe(true);
      } finally {
        generatePlanets.mockRestore(); generateMoons.mockRestore(); generateAtmospheres.mockRestore();
      }
    }, 120_000,
  );
  it('rejects mismatched single-source materialization instead of silently using foreign bodies', () => {
    const binary = fixture(StellarSystemMultiplicity.BINARY);
    const triple = fixture(StellarSystemMultiplicity.TRIPLE);
    const formation = StellarMultihostFormation.generateOrNull(key, binary)!;
    const foreign = StellarMultihostFormation.generateOrNull(key, triple)!;
    const foreignSource = SystemSceneMultihostMaterializedSources.build(foreign, metadata(triple));
    expect(() => SystemSceneMultihostComposition.build(formation, foreignSource)).toThrow(RangeError);
  }, 120_000);
});
