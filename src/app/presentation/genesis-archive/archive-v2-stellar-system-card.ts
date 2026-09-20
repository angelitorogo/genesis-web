import { DiscoveryState, type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { type SystemLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { StellarMultihostFormation } from '../../simulation/stellar/stellar-multihost-formation';
import { multihostPhysicalSourceKey } from '../../simulation/stellar/stellar-multihost-physical-source-key';
import { SystemMultihostStellarCardAssembler } from '../system/system-multihost-stellar-card';
import { ArchiveStellarSystemCardAssembler, type ArchiveStellarSystemCardModel } from './archive-stellar-system-card';

/**
 * Stage 13.2: the persisted V2 identity is the public authority. Physical
 * singles retain frozen V1 entropy, while multiple-system facts come from the
 * same A/B/C/P aggregate used by planetary fiches. No private generation key,
 * legacy version code or raw SystemSeed is released in a V2 card.
 * DETECTED never materializes the aggregate; DISCOVERED reveals identity only.
 */
export class ArchiveV2StellarSystemCardAssembler {
  private constructor() {}

  static build(key: UniverseGenerationKey, locator: SystemLocator,
    state: DiscoveryStateValue): ArchiveStellarSystemCardModel {
    if (key.generatorVersion !== GeneratorVersion.V2) {
      throw new RangeError('A V2 stellar card requires the persisted V2 generation key.');
    }
    const physical = multihostPhysicalSourceKey(key);
    const baseline = ArchiveStellarSystemCardAssembler.build(physical, locator, state);
    if (state.code < DiscoveryState.DISCOVERED.code) return baseline;

    // The V1 physical generator's procedural code embeds GEN-V1 and its raw
    // SystemSeed. Neither may be presented as the identity of a V2 universe.
    const safeBase: ArchiveStellarSystemCardModel = Object.freeze({
      ...baseline,
      systemFacts: Object.freeze(baseline.systemFacts.filter(fact =>
        fact.label !== 'SystemSeed' && fact.label !== 'Designación procedural')),
      components: Object.freeze(baseline.components.map(component => Object.freeze({
        ...component, proceduralCode: null,
      }))),
      nextScientificStep: baseline.nextScientificStep.replace('Sistema múltiple V1 confirmado; ', ''),
    });
    if (state.code < DiscoveryState.CATALOGUED.code ||
        baseline.render.multiplicity?.name === 'SINGLE') return safeBase;

    const formation = StellarMultihostFormation.generateOrNull(key, locator);
    if (formation === null || formation.multiplicity !== baseline.render.multiplicity) {
      throw new Error('La identidad estelar V2 no coincide con la formación física del sistema.');
    }
    return SystemMultihostStellarCardAssembler.build(safeBase, formation);
  }
}
