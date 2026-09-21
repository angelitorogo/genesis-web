import { StellarBlackHole } from '../../domain/stellar/stellar-black-hole';
import { StellarLifetimeProfile } from '../../domain/stellar/stellar-lifetime-profile';
import { StellarPhysicalProperties } from '../../domain/stellar/stellar-physical-properties';
import { Star } from '../../domain/stellar/star';

/**
 * 27.1: deterministic, zero-PRNG materialization from EXISTING phase-14/15
 * stellar inputs. This is deliberately compatible with V2 multihost components:
 * pass each component's own Star + physical properties + lifetime; never
 * regenerate a V2 component by guessing its parent SystemLocator.
 *
 * Mass retention is an explicitly approximate illustration of metallicity-
 * dependent winds, not a detailed stellar-collapse/pair-instability model.
 * Only the frozen phase-14 engine decides which stars become black holes and
 * which formation channel applies. No new objects are spawned.
 */
export class StellarBlackHoleEngine {
  private constructor() {}

  static fromExistingStar(
    star: Star,
    physical: StellarPhysicalProperties,
    lifetime: StellarLifetimeProfile,
  ): StellarBlackHole | null {
    if (!(star instanceof Star) || !(physical instanceof StellarPhysicalProperties) ||
        !(lifetime instanceof StellarLifetimeProfile)) {
      throw new TypeError('27.1 requires an existing Star, physical properties and lifetime profile.');
    }
    const assessment = lifetime.evolutionAssessment;
    if (star.evolutionState.name !== assessment.evolutionState.name ||
        star.blackHoleFormationChannel?.code !== assessment.blackHoleFormationChannel?.code ||
        !sameMass(physical.initialMassSolar, assessment.input.initialMassSolar)) {
      throw new RangeError('Stellar-black-hole inputs disagree with the same canonical stellar evolution.');
    }
    if (star.evolutionState.name !== 'STELLAR_BLACK_HOLE') return null;

    const channel = assessment.blackHoleFormationChannel;
    const formedAt = lifetime.terminalAgeBillionYears;
    if (!channel || formedAt === null || lifetime.remainingLifeBillionYears !== 0 ||
        formedAt > lifetime.ageBillionYears + 1e-9 ||
        !Number.isFinite(assessment.input.metallicitySolarRatio)) {
      throw new RangeError('27.1 requires a completed stellar-black-hole formation with coherent age/channel.');
    }

    // Independent, bounded estimate. No new random draws and no changes to
    // the frozen progenitor's initial/current mass baseline in point 15.1.
    const metallicity = clamp(assessment.input.metallicitySolarRatio, 0.01, 3);
    const windRetention = clamp(1 - 0.20 * Math.log10(1 + metallicity), 0.84, 1);
    const collapseRetention = channel.name === 'DIRECT_COLLAPSE' ? 0.62 : 0.29;
    const progenitorMass = physical.initialMassSolar;
    const mass = clamp(
      progenitorMass * windRetention * collapseRetention,
      StellarBlackHole.MIN_MODEL_MASS_SOLAR,
      progenitorMass * 0.95,
    );

    return new StellarBlackHole(
      star,
      progenitorMass,
      mass,
      StellarBlackHole.schwarzschildRadiusFor(mass),
      formedAt,
      Math.max(0, lifetime.ageBillionYears - formedAt),
    );
  }
}

function sameMass(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(a), Math.abs(b));
}

function clamp(value: number, lower: number, upper: number): number {
  return Math.max(lower, Math.min(upper, value));
}
