import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { BodyLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { StellarMultihostFormation } from '../../simulation/stellar/stellar-multihost-formation';
import { multihostPhysicalSourceKey } from '../../simulation/stellar/stellar-multihost-physical-source-key';
import { StellarMultihostScientificTargetResolver } from '../../simulation/stellar/stellar-multihost-scientific-target-resolver';
import { StellarSystemMultiplicitySelector } from '../../simulation/stellar/stellar-system-multiplicity-selector';
import { ArchiveDiscoveryLocatorKind, type ArchiveDiscoveryDetailModel } from '../genesis-archive/archive-discovery-detail.facade';
import { ArchiveStellarSystemCardAssembler } from '../genesis-archive/archive-stellar-system-card';
import { SystemMultihostScientificSession } from './system-multihost-scientific-session';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const v1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
const v2 = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V2);

function fixture(multiplicity: StellarSystemMultiplicity): SystemLocator {
  for (let index = 0n; index < 512n; index += 1n) {
    const locator = new SystemLocator(0n, 0n, index);
    const physicalSeed = ProceduralTargetResolver.resolveTargetSeed(v1, locator);
    if (StellarSystemMultiplicitySelector.select(v1, physicalSeed as Parameters<
      typeof StellarSystemMultiplicitySelector.select>[1]) === multiplicity) return locator;
  }
  throw new Error(`Missing ${multiplicity.name} fixture.`);
}

function model(locator: SystemLocator): ArchiveDiscoveryDetailModel {
  const state = DiscoveryState.CONFIRMED;
  // Temporary test-only legacy disclosure card. The real V2 archive/card
  // production route is NOT enabled by this physical compatibility stage.
  return {
    universeSeed: seed.serialize(), generatorVersionCode: 2,
    locatorKind: ArchiveDiscoveryLocatorKind.SYSTEM,
    galaxyIndex: locator.galaxyIndex, sectorKey: locator.sectorKey,
    galacticObjectIndex: locator.galacticObjectIndex,
    proceduralIdentity: `G${locator.galaxyIndex}/S${locator.sectorKey}/O${locator.galacticObjectIndex}`,
    discoveryState: state, discoveryStateLabel: state.name,
    stellarSystemCard: ArchiveStellarSystemCardAssembler.build(v1, locator, state),
  } as unknown as ArchiveDiscoveryDetailModel;
}

describe('Stage 12.2: released V2 reuses frozen V1 physical primitives in private scopes', () => {
  it('preserves frozen legacy generators and distinct V2 identity on release', () => {
    expect(multihostPhysicalSourceKey(v1)).toBe(v1);
    const physical = multihostPhysicalSourceKey(v2);
    expect(physical.generatorVersion).toBe(GeneratorVersion.V1);
    expect(physical.universeSeed.normalizedValue).toBe(v2.universeSeed.normalizedValue);
    expect(physical.equals(v2)).toBe(false);
    expect(v1.equals(v2)).toBe(false);
    expect(GeneratorVersion.isReleasedForNewUniverses(GeneratorVersion.V2)).toBe(true);
    expect(() => multihostPhysicalSourceKey(new UniverseGenerationKey(seed, {
      name: 'V2', code: 2,
    } as GeneratorVersion))).toThrow(RangeError);
    // Parent-system physical seeds can be resolved by either version without
    // changing the distinct PUBLIC persistence key.
    const locator = new SystemLocator(0n, 0n, 0n);
    expect(ProceduralTargetResolver.resolveTargetSeed(v2, locator).normalizedValue).toBe(
      ProceduralTargetResolver.resolveTargetSeed(v1, locator).normalizedValue);
  });

  it.each([StellarSystemMultiplicity.BINARY, StellarSystemMultiplicity.TRIPLE])(
    'materializes %s from identical frozen sources without turning private V1 scopes into public V2 keys', multiplicity => {
      const locator = fixture(multiplicity);
      const baseline = StellarMultihostFormation.generateOrNull(v1, locator)!;
      const formed = StellarMultihostFormation.generateOrNull(v2, locator)!;
      expect(formed).not.toBeNull();
      expect(formed.parentGenerationKey).toBe(v2);
      expect(formed.parentGenerationKey.generatorVersionCode).toBe(2);
      expect(formed.parentSystemSeedHex).toBe(baseline.parentSystemSeedHex);
      expect(formed.components.map(host => host.label)).toEqual(baseline.components.map(host => host.label));
      for (const [index, component] of formed.components.entries()) {
        const before = baseline.components[index]!;
        expect(component.internalGenerationKey.generatorVersion).toBe(GeneratorVersion.V1);
        expect(component.internalGenerationKey.universeSeed.normalizedValue)
          .toBe(before.internalGenerationKey.universeSeed.normalizedValue);
        expect(component.stellarSystem.generationKey).toBe(component.internalGenerationKey);
        expect(component.planets.map(planet => planet.seed.normalizedValue))
          .toEqual(before.planets.map(planet => planet.seed.normalizedValue));
      }
      expect(formed.innerOrbit.semiMajorAxisAu).toBe(baseline.innerOrbit.semiMajorAxisAu);
      expect(formed.outerOrbit?.semiMajorAxisAu).toBe(baseline.outerOrbit?.semiMajorAxisAu);
      expect(formed.publicPlanets.map(body => [body.host, body.publicLocator.bodyIndex,
        body.planet.seed.normalizedValue])).toEqual(baseline.publicPlanets.map(body => [
        body.host, body.publicLocator.bodyIndex, body.planet.seed.normalizedValue,
      ]));
      const resolver = new StellarMultihostScientificTargetResolver(formed);
      for (const entry of formed.publicPlanets) {
        expect(resolver.resolveDetailed(v2, entry.publicLocator)?.detail.general.massEarth)
          .toBe(entry.planet.massEarth);
        expect(resolver.resolveDetailed(v1, entry.publicLocator)).toBeNull();
      }
      const legacy = new StellarMultihostScientificTargetResolver(baseline);
      const address = new BodyLocator(locator.galaxyIndex, locator.sectorKey,
        locator.galacticObjectIndex, 0n);
      expect(legacy.resolveDetailed(v2, address)).toBeNull();
    }, 120_000,
  );

  it('projects a V2 multiple with identical scene/fiche planet identities after bootstrap release', () => {
    const locator = fixture(StellarSystemMultiplicity.BINARY);
    const session = SystemMultihostScientificSession.buildOrNull(model(locator))!;
    const formation = StellarMultihostFormation.generateOrNull(v2, locator)!;
    expect(session).not.toBeNull();
    expect(session.scene.generatorVersionCode).toBe(2);
    expect(session.scene.universeSeed).toBe(seed.serialize());
    expect(session.scene.planets.length).toBe(formation.publicPlanets.length);
    expect(session.stellarSystemCard.render.components).toHaveLength(2);
    for (const binding of session.scene.scientificPlanetBindings ?? []) {
      const entry = formation.publicPlanets[Number(binding.bodyIndex)]!;
      const projected = session.scene.planets.find(body => body.id === binding.sceneBodyId);
      expect(projected).toBeDefined();
      expect(entry.publicLocator.bodyIndex.toString()).toBe(binding.bodyIndex);
    }
    expect(GeneratorVersion.isReleasedForNewUniverses(GeneratorVersion.V2)).toBe(true);
  }, 120_000);
});
