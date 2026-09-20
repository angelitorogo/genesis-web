import { vi } from 'vitest';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { StellarMultihostFormation } from '../../simulation/stellar/stellar-multihost-formation';
import { StellarSystemMultiplicitySelector } from '../../simulation/stellar/stellar-system-multiplicity-selector';
import { ArchiveV2StellarSystemCardAssembler } from './archive-v2-stellar-system-card';
import { ArchiveStellarSystemCardAssembler } from './archive-stellar-system-card';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const v1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
const v2 = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V2);
const locator = (index: bigint) => new SystemLocator(0n, 0n, index);

function find(multiplicity: StellarSystemMultiplicity): SystemLocator {
  for (let index = 0n; index < 128n; index++) {
    const address = locator(index);
    const physicalSeed = ProceduralTargetResolver.resolveTargetSeed(v1, address);
    if (StellarSystemMultiplicitySelector.select(v1, physicalSeed as Parameters<
      typeof StellarSystemMultiplicitySelector.select>[1]) === multiplicity) return address;
  }
  throw new Error(`No fixture for ${multiplicity.name}`);
}

describe('13.2: V2 archive stellar fiche uses physical sources without leaking private identities', () => {
  it('does not materialize a detected system and never reveals its identity', () => {
    const generate = vi.spyOn(StellarMultihostFormation, 'generateOrNull');
    try {
      const card = ArchiveV2StellarSystemCardAssembler.build(v2, locator(0n), DiscoveryState.DETECTED);
      expect(card.title).toBe('Sistema estelar sin resolver');
      expect(card.render.multiplicity).toBeNull();
      expect(card.systemFacts).toHaveLength(0);
      expect(generate).not.toHaveBeenCalled();
    } finally { generate.mockRestore(); }
  });

  it.each([StellarSystemMultiplicity.SINGLE, StellarSystemMultiplicity.BINARY, StellarSystemMultiplicity.TRIPLE])(
    '%s preserves the observed name and hides all physical magnitudes before cataloguing', multiplicity => {
      const address = find(multiplicity);
      const v1Card = ArchiveStellarSystemCardAssembler.build(v1, address, DiscoveryState.DISCOVERED);
      const v2Card = ArchiveV2StellarSystemCardAssembler.build(v2, address, DiscoveryState.DISCOVERED);
      expect(v2Card.title).toBe(v1Card.title);
      expect(v2Card.render.multiplicity).toBe(multiplicity);
      expect(v2Card.components.every(component => component.facts.length === 0)).toBe(true);
      expect(v2Card.orbits).toHaveLength(0);
      expect(v2Card.systemFacts.some(fact => fact.label === 'SystemSeed' || fact.label === 'Designación procedural')).toBe(false);
      expect(JSON.stringify(v2Card)).not.toContain('GEN-V1');
    }, 120_000,
  );

  it.each([StellarSystemMultiplicity.BINARY, StellarSystemMultiplicity.TRIPLE])(
    '%s cataloguing uses exactly its generated A/B/C/P facts and public V2 identity', multiplicity => {
      const address = find(multiplicity);
      const formation = StellarMultihostFormation.generateOrNull(v2, address)!;
      const card = ArchiveV2StellarSystemCardAssembler.build(v2, address, DiscoveryState.CONFIRMED);
      expect(card.render.multiplicity).toBe(multiplicity);
      expect(card.components).toHaveLength(formation.components.length);
      expect(card.systemFacts.find(fact => fact.label === 'Planetas generados')?.value)
        .toBe(String(formation.publicPlanets.length));
      expect(card.circumbinaryFacts.find(fact => fact.label === 'Planetas circumbinarios reales (AB)')?.value)
        .toBe(String(formation.circumbinary.planets.length));
      for (const host of formation.components) {
        const component = card.components.find(candidate => candidate.componentLabel === host.label)!;
        expect(component.colorHex).toBe(host.spectral.color.hex);
        expect(component.spectralType).toBe(host.spectral.spectralType.designation);
        expect(component.proceduralCode).toBeNull();
      }
      expect(JSON.stringify(card)).not.toContain(formation.parentSystemSeedHex);
      expect(JSON.stringify(card)).not.toContain('GEN-V1');
    }, 120_000,
  );

  it('does not replace a V1 persisted fiche or accept a mismatched generation version', () => {
    const address = find(StellarSystemMultiplicity.SINGLE);
    const legacy = ArchiveStellarSystemCardAssembler.build(v1, address, DiscoveryState.CONFIRMED);
    expect(legacy.systemFacts.some(fact => fact.label === 'SystemSeed')).toBe(true);
    const publicCard = ArchiveV2StellarSystemCardAssembler.build(v2, address, DiscoveryState.CONFIRMED);
    expect(publicCard.systemFacts.some(fact => fact.label === 'SystemSeed')).toBe(false);
    expect(() => ArchiveV2StellarSystemCardAssembler.build(v1, address, DiscoveryState.CONFIRMED))
      .toThrow(RangeError);
  }, 120_000);
});
