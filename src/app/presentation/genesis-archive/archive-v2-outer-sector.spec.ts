import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GalaxySectorCoordinates } from '../../domain/sector/galaxy-sector-coordinates';
import { GalaxySectorKeyCodec } from '../../domain/sector/galaxy-sector-key-codec';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { ArchiveV2StellarSystemCardAssembler } from './archive-v2-stellar-system-card';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { GalaxySectorGridGenerator } from '../../simulation/sector/galaxy-sector-grid-generator';
import { GalaxyGenerator } from '../../simulation/universe/galaxy-generator';
import { StellarMultihostFormation } from '../../simulation/stellar/stellar-multihost-formation';
import { multihostPhysicalSourceKey } from '../../simulation/stellar/stellar-multihost-physical-source-key';
import { StellarSystemMultiplicitySelector } from '../../simulation/stellar/stellar-system-multiplicity-selector';

// Real V2 archive link reported during the 15.3 visual pass:
// /archive/system/0/-184683593782/0?seed=...-D8B5&version=2
const v2 = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),
  GeneratorVersion.V2,
);
const physical = multihostPhysicalSourceKey(v2);
const observedSectorKey = -184683593782n;
const observedCoordinates = new GalaxySectorCoordinates(-44, -54);

function fixture(multiplicity: StellarSystemMultiplicity, sectorKey = observedSectorKey): SystemLocator {
  for (let index = 0n; index < 128n; index += 1n) {
    const locator = new SystemLocator(0n, sectorKey, index);
    const seed = ProceduralTargetResolver.resolveTargetSeed(physical, locator);
    if (StellarSystemMultiplicitySelector.select(physical, seed as Parameters<
      typeof StellarSystemMultiplicitySelector.select>[1]) === multiplicity) return locator;
  }
  throw new Error(`No ${multiplicity.name} fixture in 128 possible locators.`);
}

describe('V2: valid outer sectors must remain addressable by private B/C/P physical sources', () => {
  it('decodes the reported link within the real parent grid without modifying the public address', () => {
    const grid = GalaxySectorGridGenerator.generate(GalaxyGenerator.generate(v2, 0n));
    const decoded = GalaxySectorKeyCodec.decode(observedSectorKey);
    expect(decoded).toEqual(observedCoordinates);
    expect(grid.contains(decoded)).toBe(true);
    expect(grid.sectorKeyFor(decoded)).toBe(observedSectorKey);
  });

  it('opens the exact reported V2 system at DETECTED and CATALOGUED without an off-grid error', () => {
    const locator = new SystemLocator(0n, observedSectorKey, 0n);
    expect(ArchiveV2StellarSystemCardAssembler.build(v2, locator, DiscoveryState.DETECTED)
      .knowledgeLevel).toBe('DETECTED');
    const card = ArchiveV2StellarSystemCardAssembler.build(v2, locator, DiscoveryState.CATALOGUED);
    expect(card.render.multiplicity).not.toBeNull();
  }, 120_000);

  it.each([StellarSystemMultiplicity.BINARY, StellarSystemMultiplicity.TRIPLE])(
    '%s reconstructs the same parent address and complete child scopes twice at the reported sector', multiplicity => {
      const locator = fixture(multiplicity);
      const first = StellarMultihostFormation.generateOrNull(v2, locator)!;
      const replay = StellarMultihostFormation.generateOrNull(v2, locator)!;
      expect(first.multiplicity).toBe(multiplicity);
      expect(first.parentGenerationKey.equals(v2)).toBe(true);
      expect(first.parentLocator.sectorKey).toBe(observedSectorKey);
      expect(first.components.map(c => c.stellarSystem.seed.normalizedValue))
        .toEqual(replay.components.map(c => c.stellarSystem.seed.normalizedValue));
      expect(first.publicPlanets.map(p => [p.host, p.publicLocator.bodyIndex.toString(), p.planet.seed.normalizedValue]))
        .toEqual(replay.publicPlanets.map(p => [p.host, p.publicLocator.bodyIndex.toString(), p.planet.seed.normalizedValue]));
      for (const host of first.components) {
        const privateGrid = GalaxySectorGridGenerator.generate(
          GalaxyGenerator.generate(host.internalGenerationKey, locator.galaxyIndex),
        );
        expect(privateGrid.contains(observedCoordinates)).toBe(true);
      }
    }, 120_000,
  );

  it('also supports a valid boundary sector even when a private galaxy is narrower', () => {
    const grid = GalaxySectorGridGenerator.generate(GalaxyGenerator.generate(v2, 0n));
    const outer = new GalaxySectorCoordinates(grid.maxCoordinate, 0);
    const sectorKey = grid.sectorKeyFor(outer);
    const locator = fixture(StellarSystemMultiplicity.BINARY, sectorKey);
    const result = StellarMultihostFormation.generateOrNull(v2, locator)!;
    expect(result.parentLocator.sectorKey).toBe(sectorKey);
    expect(result.components.every(host => GalaxySectorGridGenerator.generate(
      GalaxyGenerator.generate(host.internalGenerationKey, 0n),
    ).contains(outer))).toBe(true);
  }, 120_000);
});
