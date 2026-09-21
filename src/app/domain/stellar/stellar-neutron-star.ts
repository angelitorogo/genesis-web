import { type StellarNeutronStarFormationChannel } from './stellar-neutron-star-formation-channel';
import { Star } from './star';

/**
 * 27.4 — read-only physical *estimate* of an already formed neutron-star remnant.
 *
 * This does not replace point-15.1 progenitor/reference mass, radius, luminosity
 * or temperature. The mass-radius relation in the engine is an illustrative,
 * bounded approximation, NOT an equation-of-state calculation or measurement.
 * Surface gravity is the Newtonian reference GM/R², not GR proper acceleration.
 * Compactness is GM/(Rc²). Neither implies a pulsar, magnetar, magnetic field,
 * rotation period, accretion, binary status or any observed knowledge.
 */
export class StellarNeutronStar {
  static readonly GRAVITATIONAL_CONSTANT_SI = 6.67430e-11;
  static readonly SOLAR_MASS_KG = 1.98847e30;
  static readonly LIGHT_SPEED_M_PER_S = 299_792_458;
  static readonly MIN_MODEL_MASS_SOLAR = 1.1;
  static readonly MAX_MODEL_MASS_SOLAR = 2.2;
  static readonly MIN_MODEL_RADIUS_KM = 9;
  static readonly MAX_MODEL_RADIUS_KM = 15.5;

  readonly formationChannel: StellarNeutronStarFormationChannel;
  readonly meanDensityKgPerCubicMetre: number;
  readonly newtonianSurfaceGravityMetresPerSecondSquared: number;
  readonly compactness: number;

  constructor(
    readonly star: Star,
    readonly progenitorInitialMassSolar: number,
    readonly massSolar: number,
    readonly radiusKm: number,
    readonly formationAgeBillionYears: number,
    readonly ageSinceFormationBillionYears: number,
  ) {
    if (!(star instanceof Star) || star.evolutionState.name !== 'NEUTRON_STAR' ||
        star.neutronStarFormationChannel === null || star.blackHoleFormationChannel !== null) {
      throw new TypeError('A neutron star requires an existing NEUTRON_STAR Star and its formation channel.');
    }
    this.formationChannel = star.neutronStarFormationChannel;
    if (!Number.isFinite(progenitorInitialMassSolar) || progenitorInitialMassSolar <= 0 ||
        !Number.isFinite(massSolar) ||
        massSolar < StellarNeutronStar.MIN_MODEL_MASS_SOLAR ||
        massSolar > StellarNeutronStar.MAX_MODEL_MASS_SOLAR ||
        massSolar >= progenitorInitialMassSolar) {
      throw new RangeError('Neutron-star mass must be finite, in the model range, and below progenitor mass.');
    }
    if (!Number.isFinite(radiusKm) ||
        radiusKm < StellarNeutronStar.MIN_MODEL_RADIUS_KM ||
        radiusKm > StellarNeutronStar.MAX_MODEL_RADIUS_KM) {
      throw new RangeError('Neutron-star radius must be finite and in the illustrative 9–15.5 km range.');
    }
    if (!Number.isFinite(formationAgeBillionYears) || formationAgeBillionYears <= 0 ||
        !Number.isFinite(ageSinceFormationBillionYears) || ageSinceFormationBillionYears < 0) {
      throw new RangeError('Formation and elapsed ages must be finite and nonnegative.');
    }

    const massKg = massSolar * StellarNeutronStar.SOLAR_MASS_KG;
    const radiusMetres = radiusKm * 1_000;
    this.compactness = StellarNeutronStar.GRAVITATIONAL_CONSTANT_SI * massKg /
      (radiusMetres * StellarNeutronStar.LIGHT_SPEED_M_PER_S ** 2);
    if (!Number.isFinite(this.compactness) || this.compactness >= 0.5) {
      throw new RangeError('A neutron-star material radius must be outside its Schwarzschild reference radius.');
    }
    this.meanDensityKgPerCubicMetre = massKg / ((4 / 3) * Math.PI * radiusMetres ** 3);
    this.newtonianSurfaceGravityMetresPerSecondSquared =
      StellarNeutronStar.GRAVITATIONAL_CONSTANT_SI * massKg / radiusMetres ** 2;
    Object.freeze(this);
  }
}
