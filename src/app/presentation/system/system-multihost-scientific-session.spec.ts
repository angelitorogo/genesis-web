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
import { StellarSystemMultiplicitySelector } from '../../simulation/stellar/stellar-system-multiplicity-selector';
import { ArchiveDiscoveryLocatorKind, type ArchiveDiscoveryDetailModel } from '../genesis-archive/archive-discovery-detail.facade';
import { ArchiveStellarSystemCardAssembler } from '../genesis-archive/archive-stellar-system-card';
import { PlanetScientificFicheResolutionKind } from '../planet-detail/planet-scientific-card';
import { MoonScientificFicheResolutionKind } from '../moon-detail/moon-scientific-card';
import { systemScenePlanetFicheRoute, systemSceneMoonFicheRoute } from './system-scene-scientific-route';
import { SystemMultihostScientificSession } from './system-multihost-scientific-session';

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
  throw new Error('Missing stellar fixture.');
}
function model(locator: SystemLocator, state: DiscoveryStateValue = DiscoveryState.CONFIRMED): ArchiveDiscoveryDetailModel {
  return {
    universeSeed: key.universeSeed.serialize(), generatorVersionCode: key.generatorVersionCode,
    locatorKind: ArchiveDiscoveryLocatorKind.SYSTEM,
    galaxyIndex: locator.galaxyIndex, sectorKey: locator.sectorKey,
    galacticObjectIndex: locator.galacticObjectIndex,
    proceduralIdentity: `G${locator.galaxyIndex}/S${locator.sectorKey}/O${locator.galacticObjectIndex}`,
    discoveryState: state, discoveryStateLabel: state.name,
    stellarSystemCard: ArchiveStellarSystemCardAssembler.build(key, locator, state),
  } as unknown as ArchiveDiscoveryDetailModel;
}

describe('Stage 8: one atomic multihost scene and scientific fiche source (not globally activated)', () => {
  it.each([StellarSystemMultiplicity.BINARY, StellarSystemMultiplicity.TRIPLE])(
    '%s uses the exact same public body for renderer, route, detailed fiche and preview', multiplicity => {
      const loaded = model(fixture(multiplicity));
      const session = SystemMultihostScientificSession.buildOrNull(loaded)!;
      expect(session).not.toBeNull();
      expect(session.scene.multiplicityName).toBe(multiplicity.name);
      expect(session.planetCount).toBe(session.scene.planets.length);
      const generatePlanets = vi.spyOn(PlanetGenerator, 'generateAll');
      const generateMoons = vi.spyOn(MoonGenerator, 'generateAll');
      const generateAtmospheres = vi.spyOn(AtmosphereGenerator, 'generateAll');
      try {
        const routes = session.scene.scientificPlanetBindings!;
        expect(routes).toHaveLength(session.planetCount);
        // Exercise different stellar hosts, and any circumbinary P population.
        for (const binding of routes) {
          expect(systemScenePlanetFicheRoute(session.scene, binding.sceneBodyId)?.at(-1))
            .toBe(binding.bodyIndex);
          const fiche = session.planetFiche(BigInt(binding.bodyIndex));
          expect(fiche.kind).toBe(PlanetScientificFicheResolutionKind.AVAILABLE);
          if (fiche.kind !== PlanetScientificFicheResolutionKind.AVAILABLE) continue;
          expect(fiche.card.bodyIndex).toBe(BigInt(binding.bodyIndex));
          expect(fiche.card.preview.kind).toBe('PLANET');
          if (fiche.card.preview.kind === 'PLANET') {
            expect(fiche.card.preview.primary.planetId).toBe(binding.sceneBodyId);
            expect(fiche.card.preview.primary.sourceRadiusScene).toBe(
              session.scene.planets.find(body => body.id === binding.sceneBodyId)?.radiusScene);
          }
        }
        const moon = session.scene.scientificMoonBindings?.[0];
        if (moon) {
          const route = systemSceneMoonFicheRoute(session.scene, moon.sceneBodyId);
          expect(route?.slice(-3)).toEqual([moon.bodyIndex, 'moon', moon.moonIndex]);
          const fiche = session.moonFiche(BigInt(moon.bodyIndex), BigInt(moon.moonIndex));
          expect(fiche.kind).toBe(MoonScientificFicheResolutionKind.AVAILABLE);
          if (fiche.kind === MoonScientificFicheResolutionKind.AVAILABLE) {
            expect(fiche.card.preview.kind).toBe('MOON');
          }
        }
        expect(systemScenePlanetFicheRoute(session.scene, 'planet-1')).toBeNull();
        expect(systemSceneMoonFicheRoute(session.scene, 'moon-1-1')).toBeNull();
        expect(session.planetFiche(BigInt(session.planetCount)).kind)
          .toBe(PlanetScientificFicheResolutionKind.NOT_FOUND);
        expect(generatePlanets).not.toHaveBeenCalled();
        expect(generateMoons).not.toHaveBeenCalled();
        expect(generateAtmospheres).not.toHaveBeenCalled();
      } finally {
        generatePlanets.mockRestore(); generateMoons.mockRestore(); generateAtmospheres.mockRestore();
      }
    }, 120_000,
  );

  it('does not activate unresolved systems or single-star worlds through the new boundary', () => {
    const single = fixture(StellarSystemMultiplicity.SINGLE);
    const binary = fixture(StellarSystemMultiplicity.BINARY);
    expect(SystemMultihostScientificSession.buildOrNull(model(single))).toBeNull();
    expect(SystemMultihostScientificSession.buildOrNull(model(binary, DiscoveryState.DISCOVERED))).toBeNull();
  });
});
