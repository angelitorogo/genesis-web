import {
  AtmosphereGas,
  atmosphereGasMolarMassGramsPerMole,
} from '../../domain/planetary/atmosphere-gas';
import {
  type MoonAtmosphereAssessment,
  type MoonAtmosphereSpeciesAssessment,
} from '../../domain/planetary/moon-atmosphere-assessment';
import type { MoonFormationInventory32F1d } from '../../domain/planetary/moon-formation-inventory-32-f-1d';
import { MoonAtmosphereFormationEvolutionEngine32F1e } from './moon-atmosphere-formation-evolution-32-f-1e';
import type { MoonAtmospherePhysicalForcing32F1 } from '../../domain/planetary/moon-atmosphere-physical-32-f-1';
import { MoonAtmospherePhysicalEngine32F1 } from './moon-atmosphere-physical-engine-32-f-1';
import { MoonAtmosphereAutomaticV2Source32F1c } from './moon-atmosphere-automatic-v2-32-f-1c';
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
    independentForcing32F1: MoonAtmospherePhysicalForcing32F1 | null = null,
    formationInventory32F1d: MoonFormationInventory32F1d | null = null,
    orbitPeriodDays32F1e: number | null = null,
  ): MoonAtmosphereAssessment {
    if (!Number.isFinite(temperatureKelvin) || temperatureKelvin <= 0 ||
        !Number.isFinite(iceRichnessIndex01) || iceRichnessIndex01 < 0 || iceRichnessIndex01 > 1 ||
        !Number.isFinite(irradiationReferenceEarth) || irradiationReferenceEarth < 0 ||
        physical.moonOrdinal !== tidal.moonOrdinal ||
        physical.hostPlanetOrdinal !== tidal.hostPlanetOrdinal) {
      throw new RangeError('Moon atmosphere sources must be finite and aligned.');
    }

    // The 32.F.1d inventory must never be passed as an independent gaseous
    // forcing. It provides only a conditional H2O-only endmember in 32.F.1e.
    if (independentForcing32F1 !== null &&
        independentForcing32F1.sourceKind !== 'INDEPENDENT_MASS_AND_FLUXES') {
      throw new RangeError('32.F.1e conditional mass cannot impersonate independent forcing.');
    }
    if ((formationInventory32F1d === null) !== (orbitPeriodDays32F1e === null)) {
      throw new RangeError('32.F.1e requires both inventory and orbit interval.');
    }
    const formationEvolution32F1e = formationInventory32F1d === null ? null
      : MoonAtmosphereFormationEvolutionEngine32F1e.fromMaterialized(
          physical, formationInventory32F1d, temperatureKelvin, orbitPeriodDays32F1e!,
        );
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

    // Real mass/flux inputs take precedence over the old *conditional* scenario.
    // The generator does not possess these inputs and never fabricates them.
    const physicalBalance32F1 = independentForcing32F1 === null ? null
      : MoonAtmospherePhysicalEngine32F1.evaluate(physical, temperatureKelvin, independentForcing32F1);
    const physicalPressure = physicalBalance32F1?.surfacePressurePascal ?? null;
    const physicalSpecies = physicalBalance32F1 === null || physicalPressure === null || physicalPressure <= 0
      ? [] : physicalBalance32F1.gasResults.filter(item => item.gasMassKilograms > 0);
    const totalMoles = physicalSpecies.reduce((sum, item) =>
      sum + item.gasMassKilograms / (atmosphereGasMolarMassGramsPerMole(item.gas) / 1000), 0);
    const effectiveSpecies: readonly MoonAtmosphereSpeciesAssessment[] = physicalPressure !== null
      ? Object.freeze(physicalSpecies.map(item => Object.freeze({
          gas: item.gas,
          partialPressurePascal: item.partialPressurePascal,
          moleFraction01: totalMoles > 0 ?
            item.gasMassKilograms / (atmosphereGasMolarMassGramsPerMole(item.gas) / 1000) / totalMoles : 0,
        }))) : species;
    const hasPhysicalColumn = physicalPressure !== null;
    return Object.freeze({
      volatileInventoryIndex01,
      thermalEscapeSupportIndex01: clamp01(1 - escapedPressure / Math.max(1, sourcePressure)),
      replenishmentSupportIndex01,
      condensationRemovalIndex01: clamp01(condensedPressure / Math.max(1, sourcePressure - escapedPressure)),
      estimatedSurfacePressurePascal: physicalBalance32F1 !== null ? physicalPressure : pressure,
      pressureBasis: physicalBalance32F1 !== null ? (hasPhysicalColumn ? 'PHYSICAL_BALANCE' : 'UNRESOLVED') : pressure === null ? 'UNRESOLVED' : 'CONDITIONAL_SCENARIO',
      physicalBalance32F1,
      formationEvolution32F1e,
      automaticConstraints32F1c: MoonAtmosphereAutomaticV2Source32F1c.fromMaterialized(physical, temperatureKelvin),
      species: physicalBalance32F1 !== null && !hasPhysicalColumn ? Object.freeze([]) : effectiveSpecies,
      irradiationReferenceEarth,
      chargedParticleEnvironment: 'UNRESOLVED',
      hostMagnetosphereShielding: 'UNRESOLVED',
    });
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
