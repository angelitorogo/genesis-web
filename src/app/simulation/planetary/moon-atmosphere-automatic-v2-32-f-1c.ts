import type { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import type { MoonAtmosphereAutomaticConstraints32F1c } from '../../domain/planetary/moon-atmosphere-automatic-constraints-32-f-1c';
import { waterSaturationVaporPressurePascal } from './atmosphere-radiative-column-model';

const EARTH_RADIUS_METERS = 6_371_000;
const EARTH_GRAVITY_METERS_PER_SECOND_SQUARED = 9.80665;
const WATER_SATURATION_MIN_KELVIN = 150;
const WATER_CRITICAL_TEMPERATURE_KELVIN = 647.096;

/**
 * Pure, deterministic V2 adapter: automatically consumes already materialized
 * lunar bulk gravity, radius and conditional environmental temperature.
 * Does not generate moons, simulate a gas inventory, assume zero loss rates,
 * or claim water exists. The equation P = M*g/(4*pi*R^2) is invertible even
 * when M is UNKNOWN, and vapor saturation is only a conditional limit.
 */
export class MoonAtmosphereAutomaticV2Source32F1c {
  private constructor() {}

  static fromMaterialized(
    moon: Pick<MoonPhysicalProperties, 'radiusEarth' | 'surfaceGravityEarth'>,
    estimatedSurfaceTemperatureKelvin: number,
  ): MoonAtmosphereAutomaticConstraints32F1c {
    if (!Number.isFinite(moon.radiusEarth) || moon.radiusEarth <= 0 ||
        !Number.isFinite(moon.surfaceGravityEarth) || moon.surfaceGravityEarth <= 0 ||
        !Number.isFinite(estimatedSurfaceTemperatureKelvin) || estimatedSurfaceTemperatureKelvin <= 0) {
      throw new RangeError('32.F.1c requires positive finite lunar radius, gravity and temperature.');
    }
    const radiusMeters = moon.radiusEarth * EARTH_RADIUS_METERS;
    const gravity = moon.surfaceGravityEarth * EARTH_GRAVITY_METERS_PER_SECOND_SQUARED;
    const escapeVelocity = Math.sqrt(2 * radiusMeters * gravity);
    const kilogramsPerPascal = 4 * Math.PI * radiusMeters ** 2 / gravity;
    const vaporSaturation = estimatedSurfaceTemperatureKelvin >= WATER_SATURATION_MIN_KELVIN &&
      estimatedSurfaceTemperatureKelvin < WATER_CRITICAL_TEMPERATURE_KELVIN
      ? waterSaturationVaporPressurePascal(estimatedSurfaceTemperatureKelvin) : null;
    if (!Number.isFinite(escapeVelocity) || !Number.isFinite(kilogramsPerPascal) ||
        kilogramsPerPascal <= 0 ||
        (vaporSaturation !== null && (!Number.isFinite(vaporSaturation) || vaporSaturation < 0))) {
      throw new RangeError('32.F.1c lunar physical constraints are not finite.');
    }
    return Object.freeze({
      basis: 'V2_MATERIALIZED_GRAVITY_RADIUS_AND_TEMPERATURE',
      escapeVelocityMetersPerSecond: escapeVelocity,
      kilogramsOfGasPerPascal: kilogramsPerPascal,
      waterVaporSaturationPascalIfEquilibrated: vaporSaturation,
      pressureStatus: 'UNRESOLVED_WITHOUT_INDEPENDENT_GAS_MASS',
      rateStatus: 'UNRESOLVED_WITHOUT_EUV_PARTICLES_PHOTOCHEMISTRY_AND_SOURCE_RATES',
    });
  }
}
