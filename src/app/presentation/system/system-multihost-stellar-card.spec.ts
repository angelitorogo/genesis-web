import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { StellarMultihostFormation } from '../../simulation/stellar/stellar-multihost-formation';
import { StellarSystemMultiplicitySelector } from '../../simulation/stellar/stellar-system-multiplicity-selector';
import { ArchiveDiscoveryLocatorKind, type ArchiveDiscoveryDetailModel } from '../genesis-archive/archive-discovery-detail.facade';
import { ArchiveStellarSystemCardAssembler } from '../genesis-archive/archive-stellar-system-card';
import { SystemMultihostScientificSession } from './system-multihost-scientific-session';
import { SystemMultihostStellarCardAssembler } from './system-multihost-stellar-card';

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
  throw new Error('No multihost fixture found.');
}
function model(locator: SystemLocator): ArchiveDiscoveryDetailModel {
  return {
    universeSeed: key.universeSeed.serialize(), generatorVersionCode: key.generatorVersionCode,
    locatorKind: ArchiveDiscoveryLocatorKind.SYSTEM,
    galaxyIndex: locator.galaxyIndex, sectorKey: locator.sectorKey,
    galacticObjectIndex: locator.galacticObjectIndex,
    proceduralIdentity: `G${locator.galaxyIndex}/S${locator.sectorKey}/O${locator.galacticObjectIndex}`,
    discoveryState: DiscoveryState.CONFIRMED,
    discoveryStateLabel: DiscoveryState.CONFIRMED.name,
    stellarSystemCard: ArchiveStellarSystemCardAssembler.build(key, locator, DiscoveryState.CONFIRMED),
  } as unknown as ArchiveDiscoveryDetailModel;
}

describe('Stage 9: canonical multihost stellar fiche is physically coherent and opt-in', () => {
  it.each([StellarSystemMultiplicity.BINARY, StellarSystemMultiplicity.TRIPLE])(
    '%s fiche A/B/C masses, colors, orbital elements and populations are sourced from one generated aggregate',
    multiplicity => {
      const locator = fixture(multiplicity);
      const legacy = model(locator);
      const originalCard = legacy.stellarSystemCard!;
      const source = StellarMultihostFormation.generateOrNull(key, locator)!;
      const session = SystemMultihostScientificSession.buildOrNull(legacy)!;
      const card = session.stellarSystemCard;
      expect(legacy.stellarSystemCard).toBe(originalCard); // Never rewrite persisted V1.
      expect(card).not.toBe(originalCard);
      expect(card.components).toHaveLength(source.components.length);
      expect(card.render.components).toHaveLength(session.scene.stars.length);
      expect(card.orbits).toHaveLength(source.outerOrbit === null ? 1 : 2);
      expect(card.render.innerOrbitEccentricity).toBe(source.innerOrbit.eccentricity);
      expect(card.render.outerOrbitEccentricity).toBe(source.outerOrbit?.eccentricity ?? null);
      expect(session.scene.planets).toHaveLength(source.publicPlanets.length);
      for (const host of source.components) {
        const component = card.components.find(item => item.componentLabel === host.label)!;
        const render = card.render.components.find(item => item.label === host.label)!;
        const star = session.scene.stars.find(item => item.label === host.label)!;
        expect(component.colorHex).toBe(host.spectral.color.hex);
        expect(component.spectralType).toBe(host.spectral.spectralType.designation);
        expect(render.massSolar).toBe(host.physical.initialMassSolar);
        expect(render.colorHex).toBe(star.colorHex);
        expect(component.facts.find(f => f.label === 'Planetas circumestelares')?.value)
          .toBe(String(host.planets.length));
      }
      expect(card.circumbinaryFacts.find(f => f.label === 'Planetas circumbinarios reales (AB)')?.value)
        .toBe(String(source.circumbinary.planets.length));
      expect(card.systemFacts.find(f => f.label === 'Planetas generados')?.value)
        .toBe(String(session.planetCount));
      expect(card.systemFacts.some(f => f.label === 'SystemSeed')).toBe(false);
      expect(JSON.stringify(card)).not.toContain(source.parentSystemSeedHex);
    }, 120_000,
  );

  it('refuses a mismatched multiplicity and does not silently use the old stellar card', () => {
    const binary = fixture(StellarSystemMultiplicity.BINARY);
    const triple = fixture(StellarSystemMultiplicity.TRIPLE);
    const source = StellarMultihostFormation.generateOrNull(key, binary)!;
    expect(() => SystemMultihostStellarCardAssembler.build(model(triple).stellarSystemCard!, source))
      .toThrow(RangeError);
  }, 120_000);
});
