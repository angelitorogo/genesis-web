import { GeneratorVersion } from '../../domain/generation/generator-version';
import { type ArchiveDiscoveryDetailModel } from '../genesis-archive/archive-discovery-detail.facade';
import { SystemMultihostScientificSession } from './system-multihost-scientific-session';

/**
 * The ONE opt-in gate shared by the system, planet and moon production pages.
 * V1 (including pre-existing saves) always uses the unchanged legacy path.
 * V2 universes can now be created. The scientific session remains scoped to
 * the actual persisted V2 key; later stage-13 work integrates other consumers.
 * Never use the raw route query string or a browser-local flag to opt in.
 */
export class SystemMultihostGameCutover {
  private constructor() {}

  static sessionOrNull(model: ArchiveDiscoveryDetailModel): SystemMultihostScientificSession | null {
    const version = GeneratorVersion.fromCode(model.generatorVersionCode);
    if (version === GeneratorVersion.V1) return null;
    if (version !== GeneratorVersion.V2) {
      throw new RangeError('Unsupported version for multihost scientific cutover.');
    }
    return SystemMultihostScientificSession.buildOrNull(model);
  }
}
