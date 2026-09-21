import { StellarLifetimeProfile } from '../../domain/stellar/stellar-lifetime-profile';
import { StellarNeutronStar } from '../../domain/stellar/stellar-neutron-star';
import { StellarPhysicalProperties } from '../../domain/stellar/stellar-physical-properties';
import { Star } from '../../domain/stellar/star';

/**
 * 27.4 — zero-new-PRNG projection from EXISTING 14.6/14.8/15.1/15.3 data.
 * Compatible with V2 multihost ONLY when supplied the component's actual
 * Star + physical properties + lifetime, never its public-parent V1 locator.
 *
 * These remnant-mass/radius estimates are bounded phenomenology, not an EOS or
 * a detailed core-collapse model. We do not change the frozen 14.8 thresholds,
 * create extra objects, or classify pulsars/magnetars (27.5–27.6).
 */
export class StellarNeutronStarEngine {
  private constructor() {}

  static fromExistingStar(
    star: Star,
    physical: StellarPhysicalProperties,
    lifetime: StellarLifetimeProfile,
  ): StellarNeutronStar | null {
    if (!(star instanceof Star) || !(physical instanceof StellarPhysicalProperties) ||
        !(lifetime instanceof StellarLifetimeProfile)) {
      throw new TypeError('27.4 requires an existing Star, physical properties and lifetime profile.');
    }
    const assessment = lifetime.evolutionAssessment;
    if (star.evolutionState.name !== assessment.evolutionState.name ||
        star.neutronStarFormationChannel?.code !== assessment.neutronStarFormationChannel?.code ||
        star.blackHoleFormationChannel?.code !== assessment.blackHoleFormationChannel?.code ||
        !sameMass(physical.initialMassSolar, assessment.input.initialMassSolar)) {
      throw new RangeError('Neutron-star inputs disagree with the same canonical stellar evolution.');
    }
    if (star.evolutionState.name !== 'NEUTRON_STAR') return null;

    const channel = assessment.neutronStarFormationChannel;
    const formedAt = lifetime.terminalAgeBillionYears;
    if (!channel || formedAt === null || lifetime.remainingLifeBillionYears !== 0 ||
        formedAt > lifetime.ageBillionYears + 1e-9 ||
        !Number.isFinite(assessment.input.metallicitySolarRatio)) {
      throw new RangeError('27.4 requires a completed neutron-star formation with coherent age/channel.');
    }

    const initialMass = physical.initialMassSolar;
    const metallicity = clamp(assessment.input.metallicitySolarRatio, 0.01, 3);
    // Electron capture is assigned only by the canonical 14.8 channel.
    // All values are coarse model estimates, not predictions of observed mass.
    const mass = channel.name === 'ELECTRON_CAPTURE_COLLAPSE'
      ? clamp(1.25 + 0.022 * (initialMass - 8), 1.2, 1.37)
      : clamp(1.36 + 0.034 * (initialMass - 9) +
          0.025 * (1 - metallicity / 3), 1.32, 2.1);
    const radiusKm = clamp(12.65 - 1.25 * (mass - 1.4), 10.5, 13.2);

    return new StellarNeutronStar(
      star,
      initialMass,
      mass,
      radiusKm,
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
