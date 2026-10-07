import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { type SupernovaCanonicalEventRepository } from '../../domain/repository/supernova-canonical-event-repository';
import { type SystemSeed } from '../../domain/seed/hierarchical-seeds';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { type SupernovaCanonicalEvent } from '../../domain/transient/supernova-canonical-event';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { StellarDesignationGenerator } from '../../simulation/stellar/stellar-designation-generator';
import { multihostPhysicalSourceKey } from '../../simulation/stellar/stellar-multihost-physical-source-key';
import { StellarSystemMultiplicitySelector } from '../../simulation/stellar/stellar-system-multiplicity-selector';
import { StellarSupernovaScientificIntegration } from './stellar-supernova-scientific-integration';

const generationKey = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V2,
);

function findBinarySystem(): SystemLocator {
  const physicalKey = multihostPhysicalSourceKey(generationKey);
  for (let index = 0n; index < 4096n; index += 1n) {
    const locator = new SystemLocator(0n, 0n, index);
    const seed = ProceduralTargetResolver.resolveTargetSeed(
      physicalKey,
      locator,
    ) as SystemSeed;
    if (
      StellarSystemMultiplicitySelector.select(physicalKey, seed) ===
      StellarSystemMultiplicity.BINARY
    ) {
      return locator;
    }
  }
  throw new Error('Could not find a deterministic V2 binary fixture.');
}

describe('29.1E — StellarSupernovaScientificIntegration', () => {
  it('uses the real V2 A/B physical hosts while persisting only under the public V2 system identity', async () => {
    const locator = findBinarySystem();
    let stored: readonly SupernovaCanonicalEvent[] = Object.freeze([]);
    const loadKeys: UniverseGenerationKey[] = [];
    const replaceKeys: UniverseGenerationKey[] = [];

    const repository: SupernovaCanonicalEventRepository = {
      async loadForSystem(key, requestedLocator) {
        expect(requestedLocator.galaxyIndex).toBe(locator.galaxyIndex);
        expect(requestedLocator.sectorKey).toBe(locator.sectorKey);
        expect(requestedLocator.galacticObjectIndex).toBe(locator.galacticObjectIndex);
        loadKeys.push(key);
        return stored;
      },
      async replaceForSystem(key, requestedLocator, events) {
        expect(requestedLocator.galacticObjectIndex).toBe(locator.galacticObjectIndex);
        replaceKeys.push(key);
        stored = Object.freeze([...events]);
      },
    };

    const snapshot = await StellarSupernovaScientificIntegration.synchronize(
      repository,
      generationKey,
      locator,
    );

    const systemName = StellarDesignationGenerator.generate(
      multihostPhysicalSourceKey(generationKey),
      locator,
    ).name;

    expect(snapshot.lineages.map((entry) => entry.componentLabel.name)).toEqual([
      'A',
      'B',
    ]);
    expect(snapshot.lineages.map((entry) => entry.stellarDesignation)).toEqual([
      `${systemName} A`,
      `${systemName} B`,
    ]);
    expect(snapshot.consequences).toHaveLength(snapshot.events.length);
    expect(loadKeys.length).toBeGreaterThan(0);
    expect(loadKeys.every((key) => key.equals(generationKey))).toBe(true);
    expect(replaceKeys.every((key) => key.equals(generationKey))).toBe(true);

    const writesAfterFirstRead = replaceKeys.length;
    await StellarSupernovaScientificIntegration.synchronize(
      repository,
      generationKey,
      locator,
    );

    expect(replaceKeys).toHaveLength(writesAfterFirstRead);
  });
});
