import {
  type ScientificEvidence,
} from '../discovery/scientific-evidence';

import {
  type ProceduralLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

/**
 * Persistence port for point-26.A scientific evidence.
 *
 * Evidence belongs to observed knowledge and is intentionally separate from
 * the procedural target/Ground Truth generators.
 */
export interface ScientificEvidenceRepository {
  getEvidence(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,
  ): Promise<readonly ScientificEvidence[]>;

  recordEvidence(
    generationKey:
      UniverseGenerationKey,

    locator:
      ProceduralLocator,

    evidence:
      ScientificEvidence,
  ): Promise<ScientificEvidence>;
}
