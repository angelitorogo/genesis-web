import { atmosphereGasMolarMassGramsPerMole } from '../../domain/planetary/atmosphere-gas';
import type { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import type {
  MoonAtmospherePhysicalForcing32F1,
  MoonAtmospherePhysicalBalance32F1,
  MoonAtmosphereGasResult32F1,
} from '../../domain/planetary/moon-atmosphere-physical-32-f-1';
import { condensableSaturationPressurePascal } from './atmosphere-condensable-thermodynamics';
import { waterSaturationVaporPressurePascal } from './atmosphere-radiative-column-model';
import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';

const EARTH_RADIUS_METERS = 6_371_000;
const EARTH_GRAVITY_METERS_SECONDS_SQUARED = 9.80665;
const AVOGADRO = 6.02214076e23;
const STEPS = 128;

function nonnegative(n: number, name: string): void {
  if (!Number.isFinite(n) || n < 0) throw new RangeError(`32.F.1 invalid ${name}.`);
}

/**
 * Physical mass/pressure budget for a real lunar body's independent gas inventory.
 * Pressure P = M*g/(4*pi*R²). Photolysis is a reaction, not automatically
 * escape: retained products make gas pressure UNKNOWN until chemistry resolves.
 * No default atmosphere inventory, UV activity, sputtering or source rates.
 */
export class MoonAtmospherePhysicalEngine32F1 {
  private constructor() {}

  static evaluate(
    moon: MoonPhysicalProperties,
    temperatureKelvin: number,
    forcing: MoonAtmospherePhysicalForcing32F1,
  ): MoonAtmospherePhysicalBalance32F1 {
    if ((forcing.sourceKind !== 'INDEPENDENT_MASS_AND_FLUXES' &&
         forcing.sourceKind !== 'CONDITIONAL_FORMATION_ENDMEMBER') ||
        typeof forcing.sourceId !== 'string' || !forcing.sourceId.trim() ||
        !Number.isFinite(temperatureKelvin) || temperatureKelvin <= 0 ||
        !Number.isFinite(forcing.durationSeconds) || forcing.durationSeconds <= 0 ||
        !Number.isFinite(forcing.collisionCrossSectionSquareMeters) ||
        forcing.collisionCrossSectionSquareMeters <= 0 ||
        forcing.gasForcings.length === 0 ||
        !Number.isFinite(moon.radiusEarth) || moon.radiusEarth <= 0 ||
        !Number.isFinite(moon.surfaceGravityEarth) || moon.surfaceGravityEarth <= 0) {
      throw new RangeError('32.F.1 needs a complete, quantified lunar gas forcing.');
    }
    const used = new Set<AtmosphereGas>();
    for (const gas of forcing.gasForcings) {
      if (used.has(gas.gas)) throw new RangeError('32.F.1 duplicate gas species.');
      used.add(gas.gas);
      // Also reject unrecognised gas identifiers from deserialized data.
      if (!Number.isFinite(atmosphereGasMolarMassGramsPerMole(gas.gas))) {
        throw new RangeError('32.F.1 unknown gas species.');
      }
      nonnegative(gas.initialGasMassKilograms, 'initial gas mass');
      nonnegative(gas.replenishmentKilogramsPerSecond, 'replenishment rate');
      nonnegative(gas.thermalEscapeKilogramsPerSecond, 'thermal escape rate');
      nonnegative(gas.particleEscapeKilogramsPerSecond, 'particle escape rate');
      nonnegative(gas.photolysisRatePerSecond, 'photolysis rate');
      if (!Number.isFinite(gas.photolysisEscapingFraction01) ||
          gas.photolysisEscapingFraction01 < 0 || gas.photolysisEscapingFraction01 > 1) {
        throw new RangeError('32.F.1 photolysis escaping fraction must be in [0,1].');
      }
    }
    const radiusMeters = moon.radiusEarth * EARTH_RADIUS_METERS;
    const area = 4 * Math.PI * radiusMeters ** 2;
    const g = moon.surfaceGravityEarth * EARTH_GRAVITY_METERS_SECONDS_SQUARED;
    const kgPerPascal = area / g;
    const dt = forcing.durationSeconds / STEPS;
    const masses = forcing.gasForcings.map(gas => gas.initialGasMassKilograms);
    const initialMass = masses.reduce((sum, v) => sum + v, 0);
    let supplied = 0;
    let thermalEscaped = 0;
    let particleEscaped = 0;
    let photoEscaped = 0;
    let photoProducts = 0;
    let condensed = 0;

    for (let step = 0; step < STEPS; step++) {
      forcing.gasForcings.forEach((gas, i) => {
        let m = masses[i];
        const addition = gas.replenishmentKilogramsPerSecond * dt;
        m += addition;
        supplied += addition;
        const thermalLoss = Math.min(m, gas.thermalEscapeKilogramsPerSecond * dt);
        m -= thermalLoss;
        thermalEscaped += thermalLoss;
        const particleLoss = Math.min(m, gas.particleEscapeKilogramsPerSecond * dt);
        m -= particleLoss;
        particleEscaped += particleLoss;
        const photolyzed = m * (-Math.expm1(-gas.photolysisRatePerSecond * dt));
        const escape = photolyzed * gas.photolysisEscapingFraction01;
        photoEscaped += escape;
        photoProducts += photolyzed - escape;
        m -= photolyzed;
        const saturation = gas.gas === AtmosphereGas.WATER_VAPOR
          ? waterSaturationVaporPressurePascal(temperatureKelvin)
          : condensableSaturationPressurePascal(gas.gas, temperatureKelvin);
        if (saturation !== null && saturation !== undefined && Number.isFinite(saturation)) {
          const condensedHere = Math.max(0, m - Math.max(0, saturation) * kgPerPascal);
          m -= condensedHere;
          condensed += condensedHere;
        }
        masses[i] = Math.max(0, m);
      });
    }
    const remaining = masses.reduce((sum, v) => sum + v, 0);
    // A photoproduct is not necessarily a gas and may condense / escape itself.
    // Its unidentified fraction must not silently be counted as a gas pressure.
    const chemistryUnresolved = photoProducts > Math.max(1e-12, (remaining + photoProducts) * 1e-12);
    const pressure = chemistryUnresolved ? null : remaining / kgPerPascal;
    const results: readonly MoonAtmosphereGasResult32F1[] = Object.freeze(
      forcing.gasForcings.map((gas, i) => Object.freeze({
        gas: gas.gas,
        gasMassKilograms: masses[i],
        partialPressurePascal: masses[i] / kgPerPascal,
      })),
    );
    const totalMolecules = forcing.gasForcings.reduce((sum, gas, i) =>
      sum + masses[i] / (atmosphereGasMolarMassGramsPerMole(gas.gas) / 1000) * AVOGADRO, 0);
    const meanMolecularMass = totalMolecules > 0 ? remaining / totalMolecules : null;
    const knudsen = pressure !== null && pressure > 0 && meanMolecularMass !== null
      ? meanMolecularMass * g / (Math.SQRT2 * forcing.collisionCrossSectionSquareMeters * pressure)
      : null;
    const change = Math.abs(remaining - initialMass) /
      Math.max(Number.MIN_VALUE, initialMass, remaining);
    const regime = chemistryUnresolved ? 'UNRESOLVED_PHOTOCHEMISTRY' as const
      : remaining === 0 ? 'ABSENT_IN_EVALUATED_MODEL' as const
        : knudsen !== null && knudsen >= 1 ? 'EXOSPHERE' as const
          : change <= 0.1 && knudsen !== null && knudsen < 0.1
            ? 'STABLE_OVER_EVALUATED_INTERVAL' as const : 'TRANSIENT' as const;
    const balance: MoonAtmospherePhysicalBalance32F1 = {
      sourceKind: forcing.sourceKind,
      sourceId: forcing.sourceId,
      regime,
      durationSeconds: forcing.durationSeconds,
      initialGasMassKilograms: initialMass,
      remainingGasMassKilograms: remaining,
      surfacePressurePascal: pressure,
      gasResults: results,
      replenishedMassKilograms: supplied,
      thermalEscapedMassKilograms: thermalEscaped,
      particleEscapedMassKilograms: particleEscaped,
      photolysisEscapedMassKilograms: photoEscaped,
      photochemicalProductMassKilograms: photoProducts,
      condensedMassKilograms: condensed,
      surfaceKnudsenNumber: knudsen,
      interpretation: forcing.sourceKind === 'INDEPENDENT_MASS_AND_FLUXES'
        ? 'PHYSICAL_INTERVAL_MODEL_NOT_OBSERVATION'
        : 'CONDITIONAL_ENDMEMBER_NOT_ATMOSPHERIC_EVIDENCE',
    };
    for (const [name, value] of Object.entries(balance)) {
      if (typeof value === 'number' && !Number.isFinite(value)) {
        throw new RangeError(`32.F.1 nonfinite physical budget: ${name}.`);
      }
    }
    const available = initialMass + supplied;
    const accounted = remaining + thermalEscaped + particleEscaped + photoEscaped + photoProducts + condensed;
    if (Math.abs(available - accounted) > 1e-8 * Math.max(1, available)) {
      throw new RangeError('32.F.1 atmospheric mass is not conserved.');
    }
    return Object.freeze(balance);
  }
}
