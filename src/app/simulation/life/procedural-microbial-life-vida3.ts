/** VIDA.3: game rule for primordial microbes, NOT proof of abiogenesis. */
import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes, bytesToHex } from '@noble/hashes/utils.js';
import type { Vida2WorldAssessment } from './life-plausibility-engine-vida2';

import { VIDA3_MODEL_REVISION, VIDA3_LIFE_PROBABILITY, VIDA3_LIFE_ROLL_NAMESPACE,
  type Vida3BodyIdentity, type Vida3BodyKind, type Vida3MicrobialSnapshot } from '../../domain/life/procedural-microbial-vida3';
export { VIDA3_MODEL_REVISION, VIDA3_LIFE_PROBABILITY };
export type { Vida3BodyIdentity, Vida3BodyKind, Vida3MicrobialSnapshot };

const hexDigest = (value: string): string => bytesToHex(sha256(utf8ToBytes(value)));
const safeInt = (value: string, label: string) => {
  if (!/^(0|[1-9][0-9]*)$/.test(value)) throw new Error(`VIDA.3 invalid ${label}`);
};
export class ProceduralMicrobialLifeVIDA3 {
  private constructor() {}

  static bodyStorageKey(id: Vida3BodyIdentity): string {
    if (!/^[0-9A-F]{4}(?:-[0-9A-F]{4}){7}$/.test(id.universeSeed) || id.generatorVersionCode !== 3)
      throw new Error('VIDA.3 requires a canonical V3 universe');
    safeInt(id.galaxyIndex, 'galaxyIndex');
    if (!/^-?(0|[1-9][0-9]*)$/.test(id.sectorKey)) throw new Error('VIDA.3 invalid sectorKey');
    safeInt(id.galacticObjectIndex, 'galacticObjectIndex');
    safeInt(id.bodyIndex, 'bodyIndex');
    if ((id.kind === 'MOON') !== (id.moonIndex !== null)) throw new Error('VIDA.3 body kind mismatch');
    if (id.moonIndex !== null) safeInt(id.moonIndex, 'moonIndex');
    // Body kind is part of the key; no ordinal or catalogue array position is used.
    return [id.galaxyIndex, id.sectorKey, id.galacticObjectIndex,
      id.bodyIndex, id.kind, id.moonIndex ?? '-'].join(':');
  }

  static evaluate(id: Vida3BodyIdentity, assessment: Vida2WorldAssessment): Vida3MicrobialSnapshot {
    if (assessment.contract !== 'VIDA.2/plausibility/v2' || assessment.lifeGenerated !== false)
      throw new Error('VIDA.3 requires an unchanged VIDA.2 assessment');
    const bodyStorageKey = this.bodyStorageKey(id);
    const plausible = assessment.classification === 'PLAUSIBLE';
    const selectedRoute = plausible
      ? assessment.routes.find(x => x.classification === 'PLAUSIBLE')?.route ?? null : null;
    if (plausible && selectedRoute === null) throw new Error('VIDA.3 no eligible habitat');
    const habitat = selectedRoute === 'SUBSURFACE' ? 'SUBSURFACE' as const
      : selectedRoute === 'SURFACE' ?
        (assessment.routes[0].surfaceMicrohabitatKind === 'PROTECTED_SEEP'
          ? 'SURFACE_PROTECTED_SEEP' as const : 'SURFACE_OPEN' as const)
        : null;
    const domain = [VIDA3_LIFE_ROLL_NAMESPACE, id.universeSeed, String(id.generatorVersionCode),
      bodyStorageKey, 'LIFE_PRESENT'].join('|');
    const bytes = sha256(utf8ToBytes(domain));
    const draw = (bytes[0] * 0x1000000 + bytes[1] * 0x10000 + bytes[2] * 0x100 + bytes[3]) / 0x100000000;
    const lifePresent = plausible && draw < VIDA3_LIFE_PROBABILITY;
    const biosphereId = lifePresent ? `vida3:${hexDigest(domain + '|MICROBIAL_BIOSPHERE')}` : null;
    const canonical = [VIDA3_MODEL_REVISION, id.universeSeed, String(id.generatorVersionCode),
      bodyStorageKey, assessment.classification, selectedRoute ?? 'NONE', habitat ?? 'NONE',
      lifePresent ? '1' : '0', biosphereId ?? 'NONE'].join('|');
    return Object.freeze({revision: VIDA3_MODEL_REVISION, identity: Object.freeze({...id}), bodyStorageKey,
      plausibility: assessment.classification, selectedRoute, habitat, lifePresent,
      biology: lifePresent ? 'MICROBIAL' : 'NONE', biosphereId,
      digest: hexDigest(canonical)});
  }

  static audit(items: readonly Vida3MicrobialSnapshot[]) {
    const totals = (kind: Vida3BodyKind) => {
      const bodies = items.filter(x => x.identity.kind === kind);
      return Object.freeze({kind, evaluated: bodies.length,
        plausible: bodies.filter(x => x.plausibility === 'PLAUSIBLE').length,
        notPlausible: bodies.filter(x => x.plausibility === 'NOT_PLAUSIBLE').length,
        indeterminate: bodies.filter(x => x.plausibility === 'INDETERMINATE').length,
        microbial: bodies.filter(x => x.lifePresent).length,
        surfaceMicrobial: bodies.filter(x => x.lifePresent && x.selectedRoute === 'SURFACE').length,
        subsurfaceMicrobial: bodies.filter(x => x.lifePresent && x.selectedRoute === 'SUBSURFACE').length});
    };
    return Object.freeze([totals('PLANET'), totals('MOON')]);
  }
}
