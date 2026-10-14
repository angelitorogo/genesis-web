import { type MoonInternalWaterAssessment, type MoonIceShellThermalRegime } from '../../domain/planetary/moon-internal-water-assessment';
import { type MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import { type MoonTidalState } from '../../domain/planetary/moon-tidal-state';

const G = 6.67430e-11;
const EARTH_MASS_KG = 5.9722e24;
const EARTH_RADIUS_METERS = 6_371_000;
const SECONDS_PER_DAY = 86_400;
const MIN_K2_OVER_Q = 1e-6;
const MAX_K2_OVER_Q = 1e-3;
const ICE_CONDUCTIVITY_W_M_K = 2.5;
const BRINE_MELT_K = 240;
const PURE_WATER_MELT_K = 273.15;
const MIN_SHELL_KM = 0.5;

/**
 * First-order bounded eccentricity-tide + conductive-shell consistency check.
 * This deliberately does NOT translate the V1 normalized tidal heating index
 * into watts: without k2/Q such a conversion would invent an energy flux.
 * It cannot resolve radiogenic heat, pressure-dependent melting, salts,
 * tidal resonances, equilibrium shell dynamics or present-day ocean existence.
 */
export class MoonInternalWaterEngine {
  private constructor() {}

  static assess(
    physical: MoonPhysicalProperties,
    tidal: MoonTidalState,
    surfaceTemperatureKelvin: number,
    inferredIceRichnessIndex01: number,
    waterInventoryIndex01: number,
  ): MoonInternalWaterAssessment {
    if (
      physical.hostPlanetOrdinal !== tidal.hostPlanetOrdinal ||
      physical.moonOrdinal !== tidal.moonOrdinal ||
      !Number.isFinite(surfaceTemperatureKelvin) || surfaceTemperatureKelvin <= 0 ||
      !inUnitInterval(inferredIceRichnessIndex01) ||
      !inUnitInterval(waterInventoryIndex01)
      || !approximatelyEqual(physical.massEarth, tidal.sourceMoonMassEarth)
      || !approximatelyEqual(physical.radiusEarth, tidal.sourceMoonRadiusEarth)
    ) {
      throw new RangeError('Lunar cryosphere requires aligned finite physical/thermal sources.');
    }

    if (!tidal.isTidallyLocked || tidal.sourceEccentricity >= 0.15) {
      return Object.freeze({
        basis: 'ECCENTRICITY_TIDES_BOUNDED_SCENARIO',
        tidalHeatFluxMinimumWattsPerSquareMeter: null,
        tidalHeatFluxMaximumWattsPerSquareMeter: null,
        conductiveShellThicknessMinimumKilometers: null,
        conductiveShellThicknessMaximumKilometers: null,
        iceShellThermalRegime: tidal.isTidallyLocked
          ? 'NOT_EVALUABLE_HIGH_ECCENTRICITY'
          : 'NOT_EVALUABLE_NON_SYNCHRONOUS',
        cryovolcanism: 'NOT_EVALUABLE',
        radiogenicHeatResolved: false,
        oceanConfirmed: false,
      });
    }

    // Synchronous, small-eccentricity equilibrium-tide scaling:
    // P = 21/2 (k2/Q) G M_host^2 R_moon^5 n e^2 / a^6.
    // Never infer k2/Q from the legacy normalized tidal index.
    const n = 2 * Math.PI / (tidal.sourceOrbitalPeriodDays * SECONDS_PER_DAY);
    const a = tidal.sourceSemiMajorAxisKilometers * 1_000;
    const r = physical.radiusEarth * EARTH_RADIUS_METERS;
    const hostMass = tidal.sourceHostPlanetMassEarth * EARTH_MASS_KG;
    const powerFactor = (21 / 2) * G * hostMass ** 2 * r ** 5 * n *
      tidal.sourceEccentricity ** 2 / a ** 6;
    const surfaceArea = 4 * Math.PI * r ** 2;
    const minimumFlux = powerFactor * MIN_K2_OVER_Q / surfaceArea;
    const maximumFlux = powerFactor * MAX_K2_OVER_Q / surfaceArea;
    if (![minimumFlux, maximumFlux].every(v => Number.isFinite(v) && v >= 0)) {
      throw new RangeError('Non-finite lunar tidal heat-flux scenario.');
    }

    const frozenSurface = surfaceTemperatureKelvin < PURE_WATER_MELT_K;
    const sufficientWater = inferredIceRichnessIndex01 >= 0.08 &&
      waterInventoryIndex01 >= 0.08;
    const maxShellKm = 0.35 * physical.radiusEarth * EARTH_RADIUS_METERS / 1_000;
    const deltaBrine = Math.max(0, BRINE_MELT_K - surfaceTemperatureKelvin);
    const deltaPure = Math.max(0, PURE_WATER_MELT_K - surfaceTemperatureKelvin);

    // Shell thicknesses are reference equilibria, not an estimated ice depth.
    const minimumShellKm = frozenSurface && maximumFlux > 0
      ? ICE_CONDUCTIVITY_W_M_K * deltaBrine / maximumFlux / 1_000
      : null;
    const maximumShellKm = frozenSurface && minimumFlux > 0
      ? ICE_CONDUCTIVITY_W_M_K * deltaPure / minimumFlux / 1_000
      : null;

    let iceShellThermalRegime: MoonIceShellThermalRegime;
    if (!frozenSurface) {
      iceShellThermalRegime = 'NO_STABLE_SURFACE_ICE';
    } else if (!sufficientWater) {
      iceShellThermalRegime = 'ICE_INVENTORY_LIMITED';
    } else if (deltaBrine <= 0) {
      // Surface already warmer than the assumed brine melting point.
      iceShellThermalRegime = 'CONDITIONAL_ICE_OCEAN';
    } else if (
      maximumFlux < ICE_CONDUCTIVITY_W_M_K * deltaBrine /
        Math.max(MIN_SHELL_KM, maxShellKm) / 1_000
    ) {
      iceShellThermalRegime = 'TIDAL_HEAT_INSUFFICIENT_IN_SCENARIO';
    } else if (
      minimumFlux > ICE_CONDUCTIVITY_W_M_K * deltaPure /
        (MIN_SHELL_KM * 1_000)
    ) {
      iceShellThermalRegime = 'HIGH_TIDAL_FLUX_SCENARIO';
    } else {
      iceShellThermalRegime = 'CONDITIONAL_ICE_OCEAN';
    }

    const cryovolcanism = !frozenSurface || !sufficientWater
      ? 'NOT_EVALUABLE'
      : maximumFlux >= 0.05 && tidal.tidalHeatingIndex01 >= 0.20
        ? 'CONDITIONAL'
        : 'NOT_SUPPORTED_BY_SCENARIO';

    return Object.freeze({
      basis: 'ECCENTRICITY_TIDES_BOUNDED_SCENARIO',
      tidalHeatFluxMinimumWattsPerSquareMeter: minimumFlux,
      tidalHeatFluxMaximumWattsPerSquareMeter: maximumFlux,
      conductiveShellThicknessMinimumKilometers: minimumShellKm,
      conductiveShellThicknessMaximumKilometers: maximumShellKm,
      iceShellThermalRegime,
      cryovolcanism,
      radiogenicHeatResolved: false,
      oceanConfirmed: false,
    });
  }
}

function inUnitInterval(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function approximatelyEqual(a: number, b: number): boolean {
  return Number.isFinite(a) && Number.isFinite(b) &&
    Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
}
