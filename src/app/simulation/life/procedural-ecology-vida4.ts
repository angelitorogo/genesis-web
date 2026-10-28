/** VIDA.4: procedural *game* ecology; not an assertion of terrestrial ancestry. */
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import { VIDA4_COMPLEX_LIFE_RATE, VIDA4_GROUPS, VIDA4_MODEL_REVISION, VIDA4A_ADVANCED_THRESHOLDS,
  VIDA4_ROLL_NAMESPACE, type Vida4EcologySnapshot, type Vida4Group,
  type Vida4CapReason } from '../../domain/life/procedural-ecology-vida4';
import type { Vida3MicrobialSnapshot } from '../../domain/life/procedural-microbial-vida3';
export { VIDA4_COMPLEX_LIFE_RATE, VIDA4_MODEL_REVISION, VIDA4_GROUPS };
export type { Vida4EcologySnapshot, Vida4Group };

function sha(value: string): string { return bytesToHex(sha256(utf8ToBytes(value))); }
function roll(key: string): number {
  const b = sha256(utf8ToBytes(key));
  return (b[0] * 0x1000000 + b[1] * 0x10000 + b[2] * 0x100 + b[3]) / 0x100000000;
}
export class ProceduralEcologyVIDA4 {
  private constructor() {}

  static evaluate(micro: Vida3MicrobialSnapshot): Vida4EcologySnapshot {
    // VIDA.3b's immutable result owns the initial LIFE_PRESENT decision.
    if (micro.revision !== 'VIDA.3/microbial/v3-aquifer-lunar-surface' ||
        micro.identity.generatorVersionCode !== 3 ||
        micro.lifePresent !== (micro.biology === 'MICROBIAL') ||
        micro.lifePresent !== (micro.biosphereId !== null) ||
        (micro.lifePresent && micro.habitat === null)) {
      throw new Error('VIDA.4 requires a coherent VIDA.3b microbial snapshot');
    }
    const domain = [VIDA4_ROLL_NAMESPACE, micro.identity.universeSeed,
      String(micro.identity.generatorVersionCode), micro.bodyStorageKey];
    const complexRollSelected = micro.lifePresent &&
      roll([...domain, 'COMPLEX_LIFE'].join('|')) < VIDA4_COMPLEX_LIFE_RATE;
    // Subsurface: chemosynthetic microbes may support fungus-like decomposer analogues,
    // but no sunlight-dependent forests, flying fauna or terrestrial civilizations.
    // Shallow protected lunar seeps: microbial only. Open surfaces are the only
    // candidates for the full eight-group terrestrial-like hierarchy.
    const cap = micro.habitat === 'SURFACE_OPEN' ? 8
      : micro.habitat === 'SUBSURFACE' ? 2 : 1;
    let level = micro.lifePresent ? 1 : 0;
    if (complexRollSelected && cap >= 2) {
      const evolution = roll([...domain, 'EVOLUTION_LEVEL'].join('|'));
      // VIDA.4a: only late ecological thresholds are softened; the exact same
      // roll as VIDA.4 v1 is reused, so existing complex-life selections do
      // not change. There is no per-galaxy quota or forced final level.
      const proposed = 2 + VIDA4A_ADVANCED_THRESHOLDS.filter(t => evolution >= t).length;
      level = Math.min(cap, proposed);
    }
    const groups = Object.freeze(VIDA4_GROUPS.slice(0, level));
    const capReason: Vida4CapReason = !micro.lifePresent ? 'NO_LIFE'
      : !complexRollSelected ? 'COMPLEX_ROLL_NOT_SELECTED'
        : cap === 1 ? 'MICROBIAL_ONLY_HABITAT'
          : cap === 2 ? 'NO_OPEN_SURFACE' : 'OPEN_SURFACE';
    const atmosphericFeedbackPending = level >= 3;
    const nativeCivilizationEcosystemReady = level === VIDA4_GROUPS.length;
    const canonical = [VIDA4_MODEL_REVISION, micro.identity.universeSeed,
      micro.bodyStorageKey, micro.digest, micro.biosphereId ?? '-',
      micro.habitat ?? '-', complexRollSelected ? '1' : '0',
      ...groups, capReason, atmosphericFeedbackPending ? '1' : '0',
      nativeCivilizationEcosystemReady ? '1' : '0'].join('|');
    return Object.freeze({ revision: VIDA4_MODEL_REVISION,
      identity: Object.freeze({...micro.identity}), bodyStorageKey: micro.bodyStorageKey,
      microbialRevision: micro.revision, microbialDigest: micro.digest,
      biosphereId: micro.biosphereId, habitat: micro.habitat,
      lifePresent: micro.lifePresent, complexRollSelected,
      complexLifePresent: level >= 2, maximumGroup: level ? VIDA4_GROUPS[level-1] : null,
      groups, capReason, atmosphericFeedbackPending, nativeCivilizationEcosystemReady,
      nativeCivilizationPresent: false as const, digest: sha(canonical) });
  }

  /** To be used by VIDA.7 before a native civilization is ever generated. */
  static assertNativeCivilizationPrerequisites(snapshot: Vida4EcologySnapshot): void {
    if (!snapshot.nativeCivilizationEcosystemReady ||
        snapshot.groups.length !== VIDA4_GROUPS.length ||
        VIDA4_GROUPS.some((group, i) => snapshot.groups[i] !== group) ||
        snapshot.habitat !== 'SURFACE_OPEN') {
      throw new Error('VIDA.4 native civilization requires a complete open-surface ecosystem');
    }
  }
  static audit(items: readonly Vida4EcologySnapshot[]) {
    return Object.freeze((['PLANET','MOON'] as const).map(kind => {
      const rows = items.filter(x => x.identity.kind === kind);
      return Object.freeze({kind, evaluated: rows.length,
        inhabited: rows.filter(x=>x.lifePresent).length,
        complexDrawSelected: rows.filter(x=>x.complexRollSelected).length,
        complexEstablished: rows.filter(x=>x.complexLifePresent).length,
        microbialOnly: rows.filter(x=>x.lifePresent && !x.complexLifePresent).length,
        fullEcosystem: rows.filter(x=>x.nativeCivilizationEcosystemReady).length,
        surfaceComplex: rows.filter(x=>x.complexLifePresent && x.habitat==='SURFACE_OPEN').length,
        subsurfaceFungalAnalogues: rows.filter(x=>x.complexLifePresent && x.habitat==='SUBSURFACE').length,
      });
    }));
  }
}
