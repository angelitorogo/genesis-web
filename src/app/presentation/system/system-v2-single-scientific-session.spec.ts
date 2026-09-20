import { DiscoveryState, type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { BodyLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { StellarMultihostFormation } from '../../simulation/stellar/stellar-multihost-formation';
import { StellarSystemMultiplicitySelector } from '../../simulation/stellar/stellar-system-multiplicity-selector';
import { ArchiveDiscoveryLocatorKind, type ArchiveDiscoveryDetailModel } from '../genesis-archive/archive-discovery-detail.facade';
import { ArchiveV2StellarSystemCardAssembler } from '../genesis-archive/archive-v2-stellar-system-card';
import { PlanetScientificFicheResolutionKind } from '../planet-detail/planet-scientific-card';
import { MoonScientificFicheResolutionKind } from '../moon-detail/moon-scientific-card';
import { SystemV2SingleScientificSession } from './system-v2-single-scientific-session';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const physical = new UniverseGenerationKey(seed, GeneratorVersion.V1);
const publicKey = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V2);

function singleWithPlanets(): SystemLocator {
  for (let index = 0n; index < 256n; index++) {
    const locator = new SystemLocator(0n, 0n, index);
    const systemSeed = ProceduralTargetResolver.resolveTargetSeed(physical, locator);
    if (StellarSystemMultiplicitySelector.select(physical, systemSeed as Parameters<
      typeof StellarSystemMultiplicitySelector.select>[1]) !== StellarSystemMultiplicity.SINGLE) continue;
    if (StellarMultihostFormation.generateV2SingleOrNull(publicKey, locator)!.planets.length > 0) return locator;
  }
  throw new Error('No SINGLE system with planets available in fixture range.');
}
function model(locator: SystemLocator, state: DiscoveryStateValue = DiscoveryState.CONFIRMED): ArchiveDiscoveryDetailModel {
  return {
    universeSeed: seed.serialize(), generatorVersionCode: 2,
    locatorKind: ArchiveDiscoveryLocatorKind.SYSTEM,
    galaxyIndex: locator.galaxyIndex, sectorKey: locator.sectorKey,
    galacticObjectIndex: locator.galacticObjectIndex,
    proceduralIdentity: `G${locator.galaxyIndex}/S${locator.sectorKey}/O${locator.galacticObjectIndex}`,
    discoveryState: state, discoveryStateLabel: state.name,
    stellarSystemCard: ArchiveV2StellarSystemCardAssembler.build(publicKey, locator, state),
  } as unknown as ArchiveDiscoveryDetailModel;
}

describe('13.2: atomic V2 SINGLE scientific fiches', () => {
  it('enforces disclosure: no physical session is created for DETECTED or DISCOVERED', () => {
    const locator = new SystemLocator(0n, 0n, 0n);
    expect(SystemV2SingleScientificSession.buildOrNull(model(locator, DiscoveryState.DETECTED))).toBeNull();
    expect(SystemV2SingleScientificSession.buildOrNull(model(locator, DiscoveryState.DISCOVERED))).toBeNull();
  }, 120_000);

  it('shares one physical source between the V2 public planet, moon and preview, without V1 fallback', () => {
    const locator = singleWithPlanets();
    const persisted = model(locator);
    const source = StellarMultihostFormation.generateV2SingleOrNull(publicKey, locator)!;
    const session = SystemV2SingleScientificSession.buildOrNull(persisted)!;
    expect(session).not.toBeNull();
    expect(session.planetCount).toBe(source.planets.length);
    expect(session.scene.generatorVersionCode).toBe(2);
    expect(session.scene.planets).toHaveLength(source.planets.length);
    for (let index = 0; index < source.planets.length; index++) {
      const fiche = session.planetFiche(BigInt(index));
      expect(fiche.kind).toBe(PlanetScientificFicheResolutionKind.AVAILABLE);
      if (fiche.kind !== PlanetScientificFicheResolutionKind.AVAILABLE) continue;
      expect(fiche.card.bodyIndex).toBe(BigInt(index));
      expect(fiche.card.sections).toBeDefined();
      expect(fiche.card.preview.kind).toBe('PLANET');
      if (fiche.card.preview.kind === 'PLANET') {
        expect(fiche.card.preview.primary.planetId).toBe(`planet-${index + 1}`);
      }
      const relevant = source.moonSystems[index]!.relevantMoons[0];
      if (relevant !== undefined) {
        const moon = session.moonFiche(BigInt(index), BigInt(relevant.moonOrdinal - 1));
        expect(moon.kind).toBe(MoonScientificFicheResolutionKind.AVAILABLE);
        if (moon.kind === MoonScientificFicheResolutionKind.AVAILABLE) {
          expect(moon.card.hostPlanetTitle).toBe(fiche.card.title);
          expect(moon.card.preview.kind).toBe('MOON');
        }
      }
    }
    expect(session.planetFiche(BigInt(source.planets.length)).kind)
      .toBe(PlanetScientificFicheResolutionKind.NOT_FOUND);
    expect(session.moonFiche(0n, BigInt(Number.MAX_SAFE_INTEGER) + 1n).kind)
      .toBe(MoonScientificFicheResolutionKind.NOT_FOUND);
    expect(physical.equals(publicKey)).toBe(false);
    const externalPlanet = new BodyLocator(locator.galaxyIndex, locator.sectorKey,
      locator.galacticObjectIndex + 1n, 0n);
    expect(externalPlanet.galacticObjectIndex).not.toBe(locator.galacticObjectIndex);
  }, 120_000);

  it('does not activate on V1 or reinterpret the V2 multiple as a SINGLE', () => {
    const address = singleWithPlanets();
    const single = model(address);
    expect(SystemV2SingleScientificSession.buildOrNull({ ...single, generatorVersionCode: 1 })).toBeNull();
    const multiple = { ...single, stellarSystemCard: {
      ...single.stellarSystemCard!, render: { ...single.stellarSystemCard!.render,
        multiplicity: StellarSystemMultiplicity.BINARY },
    } } as ArchiveDiscoveryDetailModel;
    expect(SystemV2SingleScientificSession.buildOrNull(multiple)).toBeNull();
  }, 120_000);
});
