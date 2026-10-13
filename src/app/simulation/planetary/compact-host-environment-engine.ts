import { ExtremeType } from '../../domain/galactic-object/extreme-object-type';
import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import { condensableSaturationPressurePascal } from './atmosphere-condensable-thermodynamics';
import {
  type CompactHostPlanet,
  type CompactHostPlanetarySystem,
} from '../../domain/planetary/compact-host-planetary-system';
import {
  type CompactHostPlanetEnvironment,
  type CompactHostRadiationScenario,
} from '../../domain/planetary/compact-host-planetary-environment';
import { type CompactPlanetaryHost } from '../../domain/stellar/compact-planetary-host';

const AU_M = 149_597_870_700;
const SOLAR_LUMINOSITY_W = 3.828e26;
const SOLAR_MASS_KG = 1.98847e30;
const EARTH_MASS_KG = 5.9722e24;
const EARTH_RADIUS_M = 6_371_000;
const STEFAN_BOLTZMANN = 5.670374419e-8;
const G = 6.67430e-11;
const REFERENCE_NEUTRON_RADIUS_M = 12_000;

/**
 * Hypothetical present-day effective surface temperatures, K. These are
 * category-wide DESIGN ASSUMPTIONS, not observed host luminosities, cooling
 * curves, evolutionary ages or values added to host.scientificState.
 * Magnetar non-thermal magnetic heating is not derivable from B alone.
 */
const FIDUCIAL_NEUTRON_TEMPERATURE_K: Readonly<Record<
  Exclude<CompactPlanetaryHost['type'], typeof ExtremeType.STELLAR_MASS_BLACK_HOLE>, number
>> = Object.freeze({
  [ExtremeType.NEUTRON_STAR]: 650_000,
  [ExtremeType.PULSAR]: 800_000,
  [ExtremeType.MILLISECOND_PULSAR]: 400_000,
  [ExtremeType.MAGNETAR]: 2_200_000,
});

/** Energy coupling is *assumed*, not a measured albedo or atmospheric opacity. */
export const COMPACT_REFERENCE_THERMAL_ABSORPTION = 0.30;
export const COMPACT_REFERENCE_ENERGETIC_ABSORPTION = 0.05;
/** Assumed bolometric coupling of an accretion disk; spectral shape unknown. */
export const COMPACT_REFERENCE_ACCRETION_ABSORPTION = 0.15;
/** Fraction of nominal magnetic-dipole power assumed to illuminate isotropically. */
export const COMPACT_REFERENCE_SPINDOWN_RADIATIVE_FRACTION = 0.01;

/** Scientific reference, callable before any 31.4 presentation/campaign cutover. */
export class CompactHostEnvironmentEngine {
  private constructor() {}

  static resolveHostRadiation(host: CompactPlanetaryHost): CompactHostRadiationScenario {
    const state = host.scientificState;
    let thermalBasis: CompactHostRadiationScenario['thermalBasis'] = 'NOT_AVAILABLE';
    let energeticBasis: CompactHostRadiationScenario['energeticBasis'] = 'NOT_AVAILABLE';
    let thermalLuminositySolar: number | null = null;
    let energeticLuminositySolar: number | null = null;
    let fiducialTemperatureK: number | null = null;
    let dipoleSpinDownPowerSolar: number | null = null;

    if (state.thermalLuminositySolar !== null) {
      thermalLuminositySolar = state.thermalLuminositySolar;
      thermalBasis = 'HOST_STATE';
    } else if (host.type !== ExtremeType.STELLAR_MASS_BLACK_HOLE) {
      fiducialTemperatureK = FIDUCIAL_NEUTRON_TEMPERATURE_K[host.type];
      // Stefan-Boltzmann L = 4 π R² σ T⁴ for a reference neutron-star radius.
      thermalLuminositySolar = 4 * Math.PI * REFERENCE_NEUTRON_RADIUS_M ** 2 *
        STEFAN_BOLTZMANN * fiducialTemperatureK ** 4 / SOLAR_LUMINOSITY_W;
      thermalBasis = 'FIDUCIAL_NEUTRON_SURFACE';
    }

    if (state.highEnergyLuminositySolar !== null) {
      energeticBasis = 'HOST_STATE';
      energeticLuminositySolar = state.highEnergyLuminositySolar;
    } else if (
      host.type === ExtremeType.PULSAR || host.type === ExtremeType.MILLISECOND_PULSAR
    ) {
      const b = state.surfaceMagneticFieldTesla;
      const p = state.rotationPeriodSeconds;
      if (b !== null && p !== null) {
        // Nominal magnetic dipole scaling; field geometry, beaming and spin-down
        // measurement are NOT known. 10^12 G = 10^8 T, P in seconds.
        const estimatedWatts = 3.85e24 * (b / 1e8) ** 2 * p ** -4 *
          (REFERENCE_NEUTRON_RADIUS_M / 10_000) ** 6;
        if (Number.isFinite(estimatedWatts) && estimatedWatts >= 0) {
          dipoleSpinDownPowerSolar = estimatedWatts / SOLAR_LUMINOSITY_W;
          energeticLuminositySolar = dipoleSpinDownPowerSolar *
            COMPACT_REFERENCE_SPINDOWN_RADIATIVE_FRACTION;
          energeticBasis = 'DIPOLE_REFERENCE_ASSUMPTION';
        }
      }
    }

    // Keep accretion bolometric emission separate from XUV and spin-down.
    // No spectral partition can be inferred from L_accretion alone.
    const accretionBolometricLuminositySolar = state.accretionLuminositySolar;
    const presentChannels = thermalLuminositySolar !== null ||
      energeticLuminositySolar !== null || accretionBolometricLuminositySolar !== null;
    return Object.freeze({
      modelVersion: 'COMPACT_HOST_RADIATION_31_3_V1' as const,
      thermalBasis,
      energeticBasis,
      fiducialTemperatureK,
      thermalLuminositySolar,
      energeticLuminositySolar,
      accretionBolometricLuminositySolar,
      dipoleSpinDownPowerSolar,
      magneticActivityEmissionUnresolved: host.type === ExtremeType.MAGNETAR &&
        state.highEnergyLuminositySolar === null,
      bolometricCompleteness: presentChannels ? 'PARTIAL_SCENARIO' as const :
        'NO_HOST_EMISSION_MODEL' as const,
    });
  }

  static project(
    host: CompactPlanetaryHost,
    planet: CompactHostPlanet,
    radiation: CompactHostRadiationScenario = this.resolveHostRadiation(host),
  ): CompactHostPlanetEnvironment {
    if (!(planet.semiMajorAxisAu > 0) || !Number.isFinite(planet.semiMajorAxisAu) ||
      !(planet.eccentricity >= 0 && planet.eccentricity < 1) ||
      !(planet.massEarth > 0) || !(planet.radiusEarth > 0)) {
      throw new RangeError('Invalid compact-host planet orbital or intrinsic properties.');
    }
    const gravitationalRadius = planet.radiusEarth * EARTH_RADIUS_M;
    const escapeVelocityKmS = Math.sqrt(2 * G * planet.massEarth * EARTH_MASS_KG /
      gravitationalRadius) / 1000;
    // Orbit-averaged <1/r²> = 1/(a² sqrt(1-e²)) for a Kepler ellipse.
    const averagedGeometry = 1 / (4 * Math.PI * (planet.semiMajorAxisAu * AU_M) ** 2 *
      Math.sqrt(1 - planet.eccentricity ** 2));
    const thermal = radiation.thermalLuminositySolar === null ? null :
      radiation.thermalLuminositySolar * SOLAR_LUMINOSITY_W * averagedGeometry;
    const energetic = radiation.energeticLuminositySolar === null ? null :
      radiation.energeticLuminositySolar * SOLAR_LUMINOSITY_W * averagedGeometry;
    const accretion = radiation.accretionBolometricLuminositySolar === null ? null :
      radiation.accretionBolometricLuminositySolar * SOLAR_LUMINOSITY_W * averagedGeometry;
    const modeledIncludedFluxWm2 = thermal === null && energetic === null &&
      accretion === null ? null :
      (thermal ?? 0) + (energetic ?? 0) + (accretion ?? 0);
    const modeledAbsorbedFlux = modeledIncludedFluxWm2 === null ? null :
      (thermal ?? 0) * COMPACT_REFERENCE_THERMAL_ABSORPTION +
      (energetic ?? 0) * COMPACT_REFERENCE_ENERGETIC_ABSORPTION +
      (accretion ?? 0) * COMPACT_REFERENCE_ACCRETION_ABSORPTION;
    // Zero modeled host flux NEVER means an actual surface temperature of 0 K.
    const referenceRadiativeTemperatureK = modeledAbsorbedFlux === null ||
      modeledAbsorbedFlux <= 0 ? null :
      (modeledAbsorbedFlux / (4 * STEFAN_BOLTZMANN)) ** 0.25;
    const includedFluxBlackbodyEquivalentK = modeledIncludedFluxWm2 === null ||
      modeledIncludedFluxWm2 <= 0 ? null :
      (modeledIncludedFluxWm2 / (4 * STEFAN_BOLTZMANN)) ** 0.25;
    if (![escapeVelocityKmS, averagedGeometry, modeledIncludedFluxWm2,
      referenceRadiativeTemperatureK, includedFluxBlackbodyEquivalentK]
      .every(value => value === null || Number.isFinite(value) && value >= 0)) {
      throw new RangeError('Non-finite compact-host environmental projection.');
    }
    const referenceCondensableCapsPa = referenceRadiativeTemperatureK === null ? null :
      Object.freeze({
        nitrogen: vaporCap(AtmosphereGas.NITROGEN, referenceRadiativeTemperatureK, 126.192),
        carbonDioxide: vaporCap(AtmosphereGas.CARBON_DIOXIDE, referenceRadiativeTemperatureK, 304.128),
        argon: vaporCap(AtmosphereGas.ARGON, referenceRadiativeTemperatureK, 150.687),
        carbonMonoxide: vaporCap(AtmosphereGas.CARBON_MONOXIDE, referenceRadiativeTemperatureK, 132.86),
      });
    return Object.freeze({
      modelVersion: 'COMPACT_PLANET_ENVIRONMENT_31_3_V1' as const,
      planetOrdinal: planet.ordinal,
      bulkKind: planet.bulkKind,
      regime: referenceRadiativeTemperatureK === null ? 'HOST_EMISSION_UNRESOLVED' as const :
        'RADIATION_CONDITIONED' as const,
      escapeVelocityKmS,
      modeledThermalFluxWm2: thermal,
      modeledEnergeticFluxWm2: energetic,
      modeledAccretionBolometricFluxWm2: accretion,
      modeledIncludedFluxWm2,
      referenceRadiativeTemperatureK,
      includedFluxBlackbodyEquivalentK,
      actualSurfaceTemperatureK: null,
      greenhouseWarmingK: null,
      intrinsicHeatFluxWm2: null,
      surfacePressurePa: null,
      atmosphericComposition: null,
      intrinsicSurface: 'SOLID_ROCKY_REFERENCE' as const,
      waterInventory: 'UNRESOLVED' as const,
      liquidSurfaceWater: 'UNRESOLVED_PRESSURE_INVENTORY_AND_HEATING' as const,
      atmosphericSurvival: 'UNRESOLVED_COMPOSITION_EXOBASE_AND_SHIELDING' as const,
      referenceCondensableCapsPa,
      waterPhaseAtReference: referenceRadiativeTemperatureK === null ? 'UNRESOLVED' as const :
        referenceRadiativeTemperatureK < 273.16 ? 'ICE_IF_PRESENT' as const :
          'PRESSURE_AND_INVENTORY_REQUIRED' as const,
      particleEnvironment: host.type === ExtremeType.PULSAR ||
        host.type === ExtremeType.MILLISECOND_PULSAR ?
        'PULSAR_WIND_UNQUANTIFIED' as const : host.type === ExtremeType.MAGNETAR ?
        'MAGNETAR_PARTICLES_UNQUANTIFIED' as const : 'UNRESOLVED' as const,
      planetaryMagneticShielding: 'UNRESOLVED_PLANET_FIELD_AND_COUPLING' as const,
      energeticExposureAssessment: energetic === null ? 'UNRESOLVED' as const :
        'MODELED_ENERGETIC_CHANNEL' as const,
      newPlanetaryTaxon: false as const,
    });
  }

  static projectSystem(system: CompactHostPlanetarySystem): readonly CompactHostPlanetEnvironment[] {
    const radiation = this.resolveHostRadiation(system.host);
    return Object.freeze(system.planets.map(planet => this.project(system.host, planet, radiation)));
  }
}

/** Null above critical temperature: this is not a 10^12 Pa atmosphere. */
function vaporCap(gas: AtmosphereGas, referenceTemperatureK: number, criticalTemperatureK: number): number | null {
  if (referenceTemperatureK >= criticalTemperatureK || referenceTemperatureK <= 0) return null;
  return condensableSaturationPressurePascal(gas, referenceTemperatureK);
}
