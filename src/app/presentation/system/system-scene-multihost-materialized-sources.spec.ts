import { vi } from 'vitest';
import { DiscoveryState, type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
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

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V1,
);

function fixture(multiplicity: StellarSystemMultiplicity): SystemLocator {
  for (let index = 0n; index < 128n; index += 1n) {
    const locator = new SystemLocator(0n, 0n, index);
    const seed = ProceduralTargetResolver.resolveTargetSeed(key, locator);
    if (StellarSystemMultiplicitySelector.select(key, seed as Parameters<
      typeof StellarSystemMultiplicitySelector.select>[1]) === multiplicity) return locator;
  }
  throw new Error('No multiple fixture found.');
}

function source(locator: SystemLocator, state: DiscoveryStateValue = DiscoveryState.CATALOGUED): SystemSceneSnapshotSource {
  return Object.freeze({
    universeSeed: key.universeSeed.serialize(),
    generatorVersionCode: key.generatorVersionCode,
    locator,
    proceduralIdentity: `G${locator.galaxyIndex}/S${locator.sectorKey}/O${locator.galacticObjectIndex}`,
    discoveryState: state,
    discoveryStateLabel: state.name,
    stellarSystemCard: ArchiveStellarSystemCardAssembler.build(key, locator, state),
  });
}

describe('Stage 6 pre-generated multihost scene sources (no route cutover)', () => {
  it.each([StellarSystemMultiplicity.BINARY, StellarSystemMultiplicity.TRIPLE])(
    'projects the SAME generated A/B/C planets as scientific resolvers for %s', multiplicity => {
      const locator = fixture(multiplicity);
      const formation = StellarMultihostFormation.generateOrNull(key, locator)!;
      const planetSpy = vi.spyOn(PlanetGenerator, 'generateAll');
      const moonSpy = vi.spyOn(MoonGenerator, 'generateAll');
      const atmosphereSpy = vi.spyOn(AtmosphereGenerator, 'generateAll');
      try {
        const materialized = SystemSceneMultihostMaterializedSources.build(formation, source(locator));
        expect(planetSpy).not.toHaveBeenCalled();
        expect(moonSpy).not.toHaveBeenCalled();
        expect(atmosphereSpy).not.toHaveBeenCalled();
        expect(materialized.singles.map(single => single.label)).toEqual(
          formation.components.map(component => component.label),
        );
        for (const [index, single] of materialized.singles.entries()) {
          const physical = formation.components[index]!;
          expect(single.snapshot.multiplicityName).toBe('SINGLE');
          expect(single.snapshot.stars).toHaveLength(1);
          expect(single.snapshot.planets).toHaveLength(physical.planets.length);
          expect(single.snapshot.moons).toHaveLength(physical.moonSystems.reduce(
            (total, moons) => total + moons.relevantMoonCount, 0,
          ));
          expect(single.snapshot.habitableZone?.topology).toBe('CIRCUMSTELLAR');
          expect(() => assertSystemSceneProjectionSnapshot(single.snapshot)).not.toThrow();
        }
        const ordinary = formation.publicPlanets.filter(planet => planet.host !== 'AB');
        expect(materialized.boundPlanets).toHaveLength(ordinary.length);
        expect(materialized.circumbinaryPublicLocators).toHaveLength(formation.circumbinary.planets.length);
        for (const bound of materialized.boundPlanets) {
          const entity = formation.publicPlanets[Number(bound.publicLocator.bodyIndex)]!;
          expect(entity.publicLocator).toBe(bound.publicLocator);
          expect(bound.sourcePlanetOrdinal).toBe(entity.sourcePlanetOrdinal);
          expect(materialized.scientific.resolveDetailed(key, bound.publicLocator)!.detail.general.massEarth)
            .toBe(entity.planet.massEarth);
          expect(bound.body.kind).toBe('planet');
          expect(Object.isFrozen(bound.body)).toBe(true);
        }
        expect(Object.isFrozen(materialized.singles)).toBe(true);
        expect(Object.isFrozen(materialized.boundPlanets)).toBe(true);
      } finally {
        planetSpy.mockRestore();
        moonSpy.mockRestore();
        atmosphereSpy.mockRestore();
      }
    },
  );

  it('does not resolve hidden Ground Truth or accept another parent or child identity', () => {
    const locator = fixture(StellarSystemMultiplicity.BINARY);
    const formation = StellarMultihostFormation.generateOrNull(key, locator)!;
    expect(() => SystemSceneMultihostMaterializedSources.build(
      formation, source(locator, DiscoveryState.DISCOVERED),
    )).toThrow(RangeError);
    const other = new SystemLocator(locator.galaxyIndex, locator.sectorKey,
      locator.galacticObjectIndex + 1n);
    expect(() => SystemSceneMultihostMaterializedSources.build(formation, source(other)))
      .toThrow(RangeError);
    const foreign = new UniverseGenerationKey(
      UniverseSeed.parse('1234-5678-9ABC-DEF0-1234-5678-9ABC-DEF0'), GeneratorVersion.V1,
    );
    const mismatched = { ...source(locator), universeSeed: foreign.universeSeed.serialize() };
    expect(() => SystemSceneMultihostMaterializedSources.build(formation, mismatched))
      .toThrow(RangeError);
  });
});
