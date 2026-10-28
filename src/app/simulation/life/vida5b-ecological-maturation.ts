/** VIDA.5b: deterministic ecological maturation without changing atmospheric physics. */
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import { VIDA4_GROUPS } from '../../domain/life/procedural-ecology-vida4';
import type { Vida5aCoupledBiosphere } from '../../domain/life/vida5a-ecology-atmosphere';
import type { Vida5AtmosphericFeedback } from '../../domain/life/vida5-biogenic-atmosphere';
import { VIDA5B_MATURATION_REVISION,
  VIDA7_FUTURE_INTELLIGENCE_RATE, VIDA7_FUTURE_CIVILIZATION_RATE,
  type Vida5bMaturedBiosphere,
} from '../../domain/life/vida5b-ecological-maturation';

const digest = (text: string): string => bytesToHex(sha256(utf8ToBytes(text)));
const ALL_GROUPS = VIDA4_GROUPS.length;

export class Vida5bEcologicalMaturation {
  private constructor() {}

  /** Calibrated final ecological succession, not a re-roll of life or complexity.
   * Any surface biosphere that has ALREADY established reptiles or more and a
   * closed aerobic atmosphere can mature its remaining fauna and humanoid
   * analogues. No number of civilizations or systems enters this decision.
   * VIDA.5a's stabilized O2, pressure, gas fractions, climate and original digest
   * are preserved bit-for-bit; only the derived ecological-stage metadata evolves.
   */
  static evaluate(source: Vida5aCoupledBiosphere): Vida5bMaturedBiosphere {
    if (source.revision !== 'VIDA.5a/ecology-atmosphere/v1') {
      throw Error('VIDA.5b requires an evaluated VIDA.5a ecological-atmospheric coupling');
    }
    const old = source.atmosphericFeedback;
    const previous = source.effectiveGroups;
    const prefixOK = previous.length <= ALL_GROUPS &&
      previous.every((group, index) => group === VIDA4_GROUPS[index]);
    if (!prefixOK || (source.nativeCivilizationPrerequisitesReady && previous.length !== ALL_GROUPS)) {
      throw Error('VIDA.5b refuses incoherent or non-cumulative ecological input');
    }
    const aerobicallyStable = old.status === 'APPLIED' &&
      old.advancedAerobicFaunaSupported === true &&
      source.status === 'STABLE_ADVANCED_BIOSPHERE' &&
      Number.isFinite(old.pressurePascal) && old.pressurePascal !== null &&
      (old.oxygenFraction01 ?? 0) >= 0.16 && (old.oxygenFraction01 ?? 1) <= 0.28 &&
      (old.oxygenPartialPressurePascal ?? 0) >= 16_000 &&
      (old.oxygenPartialPressurePascal ?? Number.POSITIVE_INFINITY) <= 35_000 &&
      old.meanSurfaceTemperatureKelvin !== null &&
      old.meanSurfaceTemperatureKelvin >= 260 && old.meanSurfaceTemperatureKelvin <= 335;
    // The prerequisite is the appearance of advanced aerobic fauna, not a
    // fixed galaxy target, random re-roll, or an assumed breathable atmosphere.
    const mature = previous.length >= 5 && previous.length < ALL_GROUPS && aerobicallyStable;
    const groups = Object.freeze(mature ? [...VIDA4_GROUPS] : [...previous]);
    const ready = groups.length === ALL_GROUPS &&
      (mature ? aerobicallyStable : source.nativeCivilizationPrerequisitesReady && aerobicallyStable);
    // Re-label an already-closed atmospheric scenario without re-running any
    // chemistry. No gas mass, O2, pressure or climate quantity can change.
    const feedback: Vida5AtmosphericFeedback = !mature ? old : Object.freeze({
      ...old,
      effectiveGroups: groups,
      nativeCivilizationAtmosphereReady: ready,
      digest: digest([VIDA5B_MATURATION_REVISION, old.digest,
        'metadata-only', ...groups].join('|')),
    });
    return Object.freeze({
      revision: VIDA5B_MATURATION_REVISION,
      sourceCouplingRevision: source.revision,
      sourceCouplingDigest: source.digest,
      originalEffectiveGroups: Object.freeze([...previous]),
      effectiveGroups: groups,
      maturationApplied: mature,
      maturationReason: mature ? 'ADVANCED_AEROBIC_SUCCESSION' : 'PRESERVED_PREVIOUS_RESULT',
      nativeCivilizationPrerequisitesReady: ready,
      atmosphericFeedback: feedback,
      futureIntelligenceProbability: VIDA7_FUTURE_INTELLIGENCE_RATE,
      futureCivilizationConditionalProbability: VIDA7_FUTURE_CIVILIZATION_RATE,
      digest: digest([VIDA5B_MATURATION_REVISION, source.digest,
        mature ? '1' : '0', ready ? '1' : '0', feedback.digest, ...groups].join('|')),
    });
  }

  /** Mandatory gate for a future VIDA.7 generator. Does NOT create anything. */
  static assertNativeCivilizationReady(value: Vida5bMaturedBiosphere): void {
    const air = value.atmosphericFeedback;
    if (value.revision !== VIDA5B_MATURATION_REVISION ||
        !value.nativeCivilizationPrerequisitesReady || value.effectiveGroups.length !== ALL_GROUPS ||
        VIDA4_GROUPS.some((group, index) => value.effectiveGroups[index] !== group) ||
        air.status !== 'APPLIED' || !air.advancedAerobicFaunaSupported ||
        (air.oxygenFraction01 ?? 0) < 0.16 ||
        (air.oxygenPartialPressurePascal ?? 0) < 16_000) {
      throw Error('VIDA.5b native civilization requires eight groups and a closed aerobic atmosphere');
    }
  }
}
