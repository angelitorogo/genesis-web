import { frozenPhysicalSourceKey } from '../../domain/generation/frozen-physical-source-key';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';

/**
 * Stage 11 — compatibility boundary for the already-frozen physical V1 engines.
 *
 * The V2 multihost aggregate has a distinct PUBLIC parent generation key.
 * Its component populations are generated in PRIVATE V1 scopes because the
 * existing galaxy/stellar/planet/moon primitives currently reject V2. This
 * conversion must be confined to physical inputs. Never use its result for
 * persistence, browser routes, public target validation or universe bootstrap.
 *
 * An unchanged seed here is deliberate: V2 changes system composition, not
 * the validated single-star physical algorithms or their entropy streams.
 */
export function multihostPhysicalSourceKey(parent: UniverseGenerationKey): UniverseGenerationKey {
  return frozenPhysicalSourceKey(parent);
}
