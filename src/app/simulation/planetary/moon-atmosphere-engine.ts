import {
  AtmosphereGas,
  atmosphereGasMolarMassGramsPerMole,
} from '../../domain/planetary/atmosphere-gas';
import {
  type MoonAtmosphereAssessment,
  type MoonAtmosphereSpeciesAssessment,
} from '../../domain/planetary/moon-atmosphere-assessment';
import { type MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import { type MoonTidalState } from '../../domain/planetary/moon-tidal-state';
import {
  condensableSaturationPressurePascal,
} from './atmosphere-condensable-thermodynamics';
import { waterSaturationVaporPressurePascal } from './atmosphere-radiative-column-model';

const EARTH_ESCAPE_VELOCITY_METERS_SECOND = 11_186;
const UNIVERSAL_GAS_CONSTANT = 8.314462618;
const REFERENCE_PRESSURE_PASCAL = 101_325;

interface GasSource {
  readonly gas: AtmosphereGas;
  readonly weight: number;
}

/**
 * A deterministic prospective gas-column scenario. Uses only already available
 * bulk properties, mean temperature, ice proxy and tidal activity.
 * Thermal Jeans retention and phase saturation bound candidate partial columns.
 * Unknown stellar EUV, sputtering, photochemistry and magnetic shielding
 * explicitly prevent this output from becoming an authoritative pressure.
 * No randomness, moon seeds, external textures or changes to phase-21 V1 data.
 */
export class MoonAtmosphereEngine {
  private constructor() {}

  static assess(
    physical: MoonPhysicalProperties,
    tidal: MoonTidalState,
    temperatureKelvin: number,
    iceRichnessIndex01: number,
    irradiationReferenceEarth: number,
  ): MoonAtmosphereAssessment {
    if (!Number.isFinite(temperatureKelvin) || temperatureKelvin <= 0 ||
        !Number.isFinite(iceRichnessIndex01) || iceRichnessIndex01 < 0 || iceRichnessIndex01 > 1 ||
        !Number.isFinite(irradiationReferenceEarth) || irradiationReferenceEarth < 0 ||
        physical.moonOrdinal !== tidal.moonOrdinal ||
        physical.hostPlanetOrdinal !== tidal.hostPlanetOrdinal) {
      throw new RangeError('Moon atmosphere sources must be finite and aligned.');
    }

    const tidalHeat = tidal.tidalHeatingIndex01;
    const escapeVelocity = EARTH_ESCAPE_VELOCITY_METERS_SECOND *
      Math.sqrt(physical.massEarth / physical.radiusEarth);
    const volatileInventoryIndex01 = clamp01(
      0.07 + 0.82 * iceRichnessIndex01 + 0.11 * tidalHeat,
    );
    const replenishmentSupportIndex01 = clamp01(
      0.10 * volatileInventoryIndex01 + 0.55 * tidalHeat *
      (0.25 + 0.75 * volatileInventoryIndex01),
    );

    // Distinguish rocky outgassing from ice-derived nitrogen/methane candidates.
    // Weights are a chemical scenario, not a claim of measured abundances.
    const sources: readonly GasSource[] = [
      { gas: AtmosphereGas.NITROGEN, weight: 0.02 + 1.6 * iceRichnessIndex01 ** 2 },
      { gas: AtmosphereGas.METHANE, weight: 0.01 + 0.65 * iceRichnessIndex01 ** 2 },
      { gas: AtmosphereGas.CARBON_DIOXIDE, weight: 0.15 + 1.2 * (1 - iceRichnessIndex01) },
      { gas: AtmosphereGas.ARGON, weight: 0.04 },
      { gas: AtmosphereGas.AMMONIA, weight: 0.16 * iceRichnessIndex01 },
      { gas: AtmosphereGas.WATER_VAPOR, weight: 0.08 * iceRichnessIndex01 },
      { gas: AtmosphereGas.SULFUR_DIOXIDE, weight: 0.32 * tidalHeat * (1 - iceRichnessIndex01) },
    ];

    // This is a bounded inventory scenario, not a calibrated atmosphere mass.
    // Atmospheric column scales with volatile supply and surface gravity;
    // the physically derived escape and saturation filters act on each species.
    const sourcePressure = REFERENCE_PRESSURE_PASCAL *
      10 * physical.surfaceGravityEarth *
      volatileInventoryIndex01 * (0.6 + 0.4 * replenishmentSupportIndex01);
    const sourceWeight = sources.reduce((sum, source) => sum + source.weight, 0);

    let survivingPressure = 0;
    let escapedPressure = 0;
    let condensedPressure = 0;
    const components: Array<{ gas: AtmosphereGas; partialPressurePascal: number }> = [];

    for (const source of sources) {
      const candidatePressure = sourcePressure * source.weight / sourceWeight;
      const molarMassKgPerMol = atmosphereGasMolarMassGramsPerMole(source.gas) / 1000;
      // Molecular escape parameter at the exobase proxy temperature.
      // An elevated kinetic temperature is a conservative proxy for an
      // upper atmosphere exposed to stellar heating, not a measured exobase.
      // It stops a warm, low-mass Earth-Moon analogue retaining dense CO2
      // on the basis of surface-temperature Jeans escape alone.
      const exobaseProxyKelvin = Math.max(
        temperatureKelvin, 180 + 3 * Math.max(0, temperatureKelvin - 80),
      );
      const jeansParameter = escapeVelocity ** 2 * molarMassKgPerMol /
        (2 * UNIVERSAL_GAS_CONSTANT * exobaseProxyKelvin);
      // Stronger gravitational binding is necessary but not sufficient for
      // longevity: unknown EUV/sputtering are deliberately not guessed here.
      const retention = clamp01((jeansParameter - 22) / 36);
      const afterEscape = candidatePressure * retention;
      escapedPressure += candidatePressure - afterEscape;

      const saturation = source.gas === AtmosphereGas.WATER_VAPOR
        ? waterSaturationVaporPressurePascal(temperatureKelvin)
        : condensableSaturationPressurePascal(source.gas, temperatureKelvin);
      const partialPressure = Math.max(0, Math.min(afterEscape, saturation ?? afterEscape));
      condensedPressure += afterEscape - partialPressure;
      survivingPressure += partialPressure;
      if (partialPressure > 0) {
        components.push({ gas: source.gas, partialPressurePascal: partialPressure });
      }
    }

    const hasDefensibleColumn = survivingPressure >= 10 &&
      // A small escaping source should not be interpreted as a static surface atmosphere.
      survivingPressure / Math.max(1, sourcePressure) >= 0.05;
    const pressure = hasDefensibleColumn ? survivingPressure : null;
    const species: readonly MoonAtmosphereSpeciesAssessment[] = pressure === null
      ? Object.freeze([])
      : Object.freeze(components
          .filter(component => component.partialPressurePascal / survivingPressure >= 0.0001)
          .map(component => Object.freeze({
            gas: component.gas,
            partialPressurePascal: component.partialPressurePascal,
            moleFraction01: component.partialPressurePascal / survivingPressure,
          }))
          .sort((a, b) => b.moleFraction01 - a.moleFraction01));

    return Object.freeze({
      volatileInventoryIndex01,
      thermalEscapeSupportIndex01: clamp01(1 - escapedPressure / Math.max(1, sourcePressure)),
      replenishmentSupportIndex01,
      condensationRemovalIndex01: clamp01(condensedPressure / Math.max(1, sourcePressure - escapedPressure)),
      estimatedSurfacePressurePascal: pressure,
      pressureBasis: pressure === null ? 'UNRESOLVED' : 'CONDITIONAL_SCENARIO',
      species,
      irradiationReferenceEarth,
      chargedParticleEnvironment: 'UNRESOLVED',
      hostMagnetosphereShielding: 'UNRESOLVED',
    });
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
