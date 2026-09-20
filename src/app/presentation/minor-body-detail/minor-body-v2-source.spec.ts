import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { StellarSystemMultiplicitySelector } from '../../simulation/stellar/stellar-system-multiplicity-selector';
import { ArchiveV2StellarSystemCardAssembler } from '../genesis-archive/archive-v2-stellar-system-card';
import { ArchiveDiscoveryLocatorKind, type ArchiveDiscoveryDetailModel } from '../genesis-archive/archive-discovery-detail.facade';
import { SystemV2SingleScientificSession } from '../system/system-v2-single-scientific-session';
import { SystemMultihostGameCutover } from '../system/system-multihost-game-cutover';
import { MinorBodyScientificCardAssembler } from './minor-body-scientific-card';
import { MinorBodyScientificTargetKind } from '../../simulation/planetary/minor-body-scientific-target-resolver';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const legacy = new UniverseGenerationKey(seed, GeneratorVersion.V1);
const key = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V2);
function fixture(kind: 'SINGLE' | 'BINARY' | 'TRIPLE'): ArchiveDiscoveryDetailModel {
  for (let i = 0n; i < 256n; i++) {
    const locator = new SystemLocator(0n, 0n, i);
    const target = ProceduralTargetResolver.resolveTargetSeed(legacy, locator);
    if (StellarSystemMultiplicitySelector.select(legacy,
      target as Parameters<typeof StellarSystemMultiplicitySelector.select>[1]).name !== kind) continue;
    const state = DiscoveryState.CONFIRMED;
    const model = {
      universeSeed: seed.serialize(), generatorVersionCode: 2,
      locatorKind: ArchiveDiscoveryLocatorKind.SYSTEM,
      galaxyIndex: locator.galaxyIndex, sectorKey: locator.sectorKey,
      galacticObjectIndex: locator.galacticObjectIndex,
      proceduralIdentity: `G${locator.galaxyIndex}/S${locator.sectorKey}/O${locator.galacticObjectIndex}`,
      discoveryState: state, discoveryStateLabel: state.name,
      stellarSystemCard: ArchiveV2StellarSystemCardAssembler.build(key, locator, state),
    } as unknown as ArchiveDiscoveryDetailModel;
    const session = SystemV2SingleScientificSession.buildOrNull(model) ??
      SystemMultihostGameCutover.sessionOrNull(model);
    if (session && session.scene.minorBodies.some(body =>
      body.minorBodyKind.name === 'ASTEROID' || body.minorBodyKind.name === 'COMET' ||
      body.minorBodyKind.name === 'TRANS_NEPTUNIAN_OBJECT')) return model;
  }
  throw new Error(`No V2 ${kind} fixture has a bound minor body.`);
}

describe('15.3 — V2 real minor-body fiche/preview source', () => {
  it.each(['SINGLE', 'BINARY', 'TRIPLE'] as const)(
    '%s resolves actual A/B/C minor-body identities without passing the public V2 key to a V1 generator', kind => {
      const model = fixture(kind);
      const session = SystemV2SingleScientificSession.buildOrNull(model) ??
        SystemMultihostGameCutover.sessionOrNull(model);
      if (!session) throw new Error('No V2 session');
      // Each category uses the exact renderer identity; avoid regenerating
      // the complete physical system once per asteroid in this oriented test.
      const selected = new Map(session.scene.minorBodies.map(body =>
        [body.minorBodyKind.name, body] as const));
      for (const body of selected.values()) {
        const target = body.minorBodyKind.name === 'ASTEROID'
          ? MinorBodyScientificTargetKind.ASTEROID
          : body.minorBodyKind.name === 'COMET'
            ? MinorBodyScientificTargetKind.COMET
            : body.minorBodyKind.name === 'TRANS_NEPTUNIAN_OBJECT'
              ? MinorBodyScientificTargetKind.TRANS_NEPTUNIAN_OBJECT
              : body.minorBodyKind.name === 'CAPTURED_EXTRASOLAR_OBJECT'
                ? MinorBodyScientificTargetKind.CAPTURED_EXTRASOLAR_OBJECT
                : null;
        if (target === null) continue;
        const id = body.id.slice(-32);
        const result = MinorBodyScientificCardAssembler.build(model, target, id);
        expect(result.kind).toBe('AVAILABLE');
        if (result.kind === 'AVAILABLE') {
          expect(result.card.title.length).toBeGreaterThan(0);
          expect(JSON.stringify(result.card)).not.toContain(id);
          expect(result.card.preview.accessibleLabel.length).toBeGreaterThan(0);
        }
      }
      const invalid = MinorBodyScientificCardAssembler.build(model,
        MinorBodyScientificTargetKind.ASTEROID, 'F'.repeat(32));
      expect(invalid.kind).toBe('NOT_FOUND');
      expect(session.scene.stars.every(star => star.radiusScene > 0)).toBe(true);
    }, 120_000,
  );
});
