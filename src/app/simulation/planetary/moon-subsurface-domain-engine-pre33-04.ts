import type { MoonEnergyConfinementPRE3305 } from '../../domain/planetary/moon-energy-confinement-pre33-05';
import type { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import type { MoonFormationInventory32F1d } from '../../domain/planetary/moon-formation-inventory-32-f-1d';
import type { MoonInteriorStructure32F2b } from '../../domain/planetary/moon-interior-structure-32-f-2b';
import type { MoonOceanReality32F2c } from '../../domain/planetary/moon-ocean-reality-32-f-2c';
import type { MoonInternalWaterAssessment } from '../../domain/planetary/moon-internal-water-assessment';
import type { MoonSubsurfaceDomainPRE3304, LunarOceanScenarioPRE3304 } from '../../domain/planetary/moon-subsurface-domain-pre33-04';

const GRAVITY = 6.67430e-11;
const EARTH_RADIUS_METERS = 6_371_000;
const ICE_CONDUCTIVITY = 2.5;
const LIQUID_ADIABAT = 1.2e-8;
const TWO_GPA = 2e9;
const TEN_GPA = 1e10;
const STEPS = 384;
/** Approximate pure-H2O melting curve: pressure knots are NOT an EOS.
 * >2 GPa values represent an explicitly conditional ice-VII region. */
const MELTING: readonly (readonly [number, number])[] = [
  [0, 273.15], [.209e9, 251.2], [.35e9, 256], [.63e9, 273],
  [1e9, 300], [1.5e9, 330], [2e9, 355], [3e9, 390],
  [5e9, 453], [10e9, 600],
];
const LIMITS = Object.freeze([
  'LUNAR_H2O_MASS_IS_THE_32F1D_CONDITIONAL_FORMATION_ENDMEMBER_NOT_AN_INDEPENDENT_V3_CHEMICAL_INVENTORY',
  'DENSITIES_ARE_PIECEWISE_CONSTANT_NO_COMPRESSIBLE_HIGH_PRESSURE_EQUATION_OF_STATE',
  '2_TO_10_GPA_ICE_VII_MELTING_IS_APPROXIMATE_PURE_H2O_NO_SALINITY',
  'ICE_CONDUCTION_AND_LIQUID_ADIABAT_ARE_ALTERNATIVE_CONDITIONAL_THERMAL_MODELS',
  '32F2C_TIDAL_K2_Q_AND_RADIOGENIC_POWER_ARE_PARAMETRIC_NOT_INDEPENDENT_HEAT_HISTORIES',
  'MOON_WATER_DELIVERY_LOSS_AND_LONG_TERM_OCEAN_STABILITY_ARE_NOT_YET_CERTIFIED',
  'NO_LIFE_HABITABILITY_OR_OBSERVED_OCEAN_INFERRED',
]);
const close = (a: number, b: number): boolean =>
  Number.isFinite(a) && Number.isFinite(b) &&
  Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
function meltingTemperature(p: number): number | null {
  if (!Number.isFinite(p) || p < 0 || p > TEN_GPA) return null;
  for (let i = 1; i < MELTING.length; i++) {
    if (p <= MELTING[i][0]) {
      const [p0, t0] = MELTING[i - 1];
      const [p1, t1] = MELTING[i];
      return t0 + (t1 - t0) * (p - p0) / (p1 - p0);
    }
  }
  return MELTING[MELTING.length - 1][1];
}

/** Domain extension: consumes the SAME frozen lunar formation, radial interior,
 * CT-0 ocean and tidal-flux interval. Does not redraw seeds, move moons,
 * overwrite 32.F.2c or publish findings as observed knowledge. */
export class MoonSubsurfaceDomainEnginePRE3304 {
  private constructor() {}

  static fromMaterialized(
    physical: MoonPhysicalProperties,
    formation: MoonFormationInventory32F1d,
    interior: MoonInteriorStructure32F2b,
    ocean: MoonOceanReality32F2c,
    tides: MoonInternalWaterAssessment | null,
    energyPRE3305: MoonEnergyConfinementPRE3305 | null = null,
  ): MoonSubsurfaceDomainPRE3304 {
    const same = (x: {hostPlanetOrdinal: number; moonOrdinal: number}) =>
      x.hostPlanetOrdinal === physical.hostPlanetOrdinal && x.moonOrdinal === physical.moonOrdinal;
    const shell = interior.layers.find(layer => layer.kind === 'H2O_OUTER_SHELL');
    if (![formation, interior, ocean].every(same) || !shell ||
      formation.provenance !== 'DETERMINISTIC_CONDITIONAL_FORMATION_MODEL_NOT_OBSERVATION' ||
      interior.provenance !== 'CONDITIONAL_DIFFERENTIATED_FORMATION_ENDMEMBER_NOT_OBSERVED' ||
      ocean.provenance !== 'SIMULATED_CT0_CONSTITUTIVE_MODEL_NOT_DIRECT_OBSERVATION' ||
      !close(formation.totalMassKilograms, interior.totalMassKilograms) ||
      !close(formation.waterIceMassKilograms, interior.waterMassKilograms) ||
      !close(ocean.waterInventoryKilograms, interior.waterMassKilograms) ||
      !close(shell.massKilograms, interior.waterMassKilograms) ||
      !close(shell.outerRadiusKilometers * 1000, physical.radiusEarth * EARTH_RADIUS_METERS) ||
      !Number.isFinite(ocean.surfaceTemperatureKelvin) || ocean.surfaceTemperatureKelvin <= 0) {
      throw new RangeError('PRE-33.04 requires aligned lunar physical/formation/CT-0 sources.');
    }
    const waterMass = interior.waterMassKilograms;
    const surface = shell.outerRadiusKilometers * 1000;
    const base = shell.innerRadiusKilometers * 1000;
    const thickness = surface - base;
    if (thickness < 0 || base < 0 || (waterMass > 0 && (base <= 0 || thickness <= 0)) ||
      !Number.isFinite(surface) || !Number.isFinite(thickness)) {
      throw new RangeError('PRE-33.04 invalid lunar water shell geometry.');
    }
    let domain: MoonSubsurfaceDomainPRE3304['domain'];
    let basal: number | null = null;
    let depth2: number | null = null;
    let depth10: number | null = null;
    const scenarios: LunarOceanScenarioPRE3304[] = [];
    let thermalEvaluation: MoonSubsurfaceDomainPRE3304['thermalEvaluation'] = 'DRY';
    const profile: {depthKilometers: number; pressurePascal: number}[] = [];
    if (waterMass === 0) {
      domain = 'NO_FORMATION_H2O';
    } else {
      const layers = interior.layers;
      const enclosed = (r: number): number => {
        let sum = 0;
        for (const layer of layers) {
          const a = layer.innerRadiusKilometers * 1000;
          const b = layer.outerRadiusKilometers * 1000;
          if (r >= b) { sum += layer.massKilograms; continue; }
          if (r > a && b > a) sum += layer.massKilograms *
            (r ** 3 - a ** 3) / (b ** 3 - a ** 3);
          break;
        }
        return sum;
      };
      const dr = thickness / STEPS;
      const pressure = Array<number>(STEPS + 1).fill(0);
      for (let i = 1; i <= STEPS; i++) {
        const r = surface - (i - .5) * dr;
        pressure[i] = pressure[i - 1] + GRAVITY * enclosed(r) *
          shell.effectiveDensityKilogramsPerCubicMeter * dr / (r * r);
      }
      basal = pressure[STEPS];
      if (!Number.isFinite(basal) || basal < 0) {
        throw new RangeError('PRE-33.04 nonfinite hydrostatic pressure.');
      }
      const interpolateDepth = (target: number): number | null => {
        if (basal! < target) return null;
        let low = 0, high = STEPS;
        while (low < high) {
          const m = (low + high) >>> 1;
          if (pressure[m] >= target) high = m;
          else low = m + 1;
        }
        const i = Math.max(1, low);
        return ((i - 1) + (target - pressure[i - 1]) /
          Math.max(1e-20, pressure[i] - pressure[i - 1])) * dr / 1000;
      };
      depth2 = interpolateDepth(TWO_GPA);
      depth10 = interpolateDepth(TEN_GPA);
      for (let i = 0; i <= STEPS; i += 24) {
        profile.push(Object.freeze({depthKilometers: i * dr / 1000, pressurePascal: pressure[i]}));
      }
      domain = basal > TEN_GPA ? 'BEYOND_10_GPA_UNRESOLVED' :
        basal > TWO_GPA ? 'EXTENDED_2_TO_10_GPA' : 'LEGACY_BELOW_2_GPA';
      if (energyPRE3305 && (energyPRE3305.hostPlanetOrdinal !== physical.hostPlanetOrdinal ||
          energyPRE3305.moonOrdinal !== physical.moonOrdinal ||
          energyPRE3305.provenance !== 'V3_MATERIALIZED_ORBIT_INTERIOR_AND_CT0_RADIOGENIC_PRIOR' ||
          energyPRE3305.radiogenicFluxWattsPerSquareMeter !== ocean.generatedRadiogenicFluxWattsPerSquareMeter)) {
        throw new RangeError('PRE-33.04 refuses a misaligned PRE-33.05 energetic handoff.');
      }
      const min = energyPRE3305 ? energyPRE3305.tidalFluxMinimumWattsPerSquareMeter :
        tides?.tidalHeatFluxMinimumWattsPerSquareMeter ?? null;
      const max = energyPRE3305 ? energyPRE3305.tidalFluxMaximumWattsPerSquareMeter :
        tides?.tidalHeatFluxMaximumWattsPerSquareMeter ?? null;
      const nominal = energyPRE3305 ? energyPRE3305.totalFluxNominalWattsPerSquareMeter :
        ocean.generatedTotalSurfaceHeatFluxWattsPerSquareMeter;
      const radiogenic = energyPRE3305 ? energyPRE3305.radiogenicFluxWattsPerSquareMeter :
        ocean.generatedRadiogenicFluxWattsPerSquareMeter;
      if (domain === 'BEYOND_10_GPA_UNRESOLVED') {
        thermalEvaluation = 'OUTSIDE_PRESSURE_DOMAIN';
      } else if ([min, max, nominal, radiogenic].some(v => v === null || !Number.isFinite(v) || v < 0) ||
        min! > max! || ocean.surfaceTemperatureKelvin < 100 ||
        ocean.surfaceTemperatureKelvin >= 273.15) {
        thermalEvaluation = 'MISSING_THERMAL_INPUTS';
      } else {
        thermalEvaluation = 'THREE_CONDITIONAL_CASES';
        const heatCases = [
          ['LOW_TIDAL', min! + radiogenic!],
          ['NOMINAL_CT0', nominal!],
          ['HIGH_TIDAL', max! + radiogenic!],
        ] as const;
        const radius = surface;
        const phaseMass = (a: number, b: number): number =>
          waterMass * ((radius - a) ** 3 - (radius - b) ** 3) /
            (radius ** 3 - base ** 3);
        const sampledPressure = (d: number) => {
          const pos = Math.min(STEPS, Math.max(0, d / dr));
          const j = Math.min(STEPS - 1, Math.floor(pos));
          return pressure[j] + (pressure[j + 1] - pressure[j]) * (pos - j);
        };
        for (const [thermalCase, flux] of heatCases) {
          const conductive = (d: number): number =>
            ocean.surfaceTemperatureKelvin + flux * radius ** 2 / ICE_CONDUCTIVITY *
            (1 / (radius - d) - 1 / radius);
          let iceEnd: number | null = null;
          let freezeDepth: number | null = null;
          let temperatureAtInterface = 0;
          let unresolved = false;
          for (let i = 1; i <= STEPS; i++) {
            const d = i * dr;
            const temp = iceEnd === null ? conductive(d) :
              temperatureAtInterface + LIQUID_ADIABAT *
                (pressure[i] - sampledPressure(iceEnd));
            const melt = meltingTemperature(pressure[i]);
            if (melt === null || !Number.isFinite(temp) || temp <= 0 || temp > 850 || flux > 500) {
              unresolved = true; break;
            }
            if (iceEnd === null && temp >= melt) {
              let lo = (i - 1) * dr, hi = d;
              for (let k = 0; k < 30; k++) {
                const mid = (lo + hi) / 2;
                if (conductive(mid) >= meltingTemperature(sampledPressure(mid))!) hi = mid;
                else lo = mid;
              }
              iceEnd = hi;
              temperatureAtInterface = conductive(hi);
            } else if (iceEnd !== null && temp < melt) {
              freezeDepth = d;
              break;
            }
          }
          const ice = iceEnd ?? thickness;
          const lower = freezeDepth ?? thickness;
          const liquid = unresolved || lower <= ice ? 0 : phaseMass(ice, lower);
          const scenario: LunarOceanScenarioPRE3304 = Object.freeze({
            thermalCase, heatFluxWattsPerSquareMeter: flux,
            iceCoverKilometers: ice / 1000,
            liquidLayerKilometers: unresolved ? 0 : Math.max(0, lower - ice) / 1000,
            highPressureIceKilometers: unresolved ? 0 : (thickness - lower) / 1000,
            liquidMassKilograms: liquid,
            solidMassKilograms: waterMass - liquid,
            classification: unresolved ? 'UNRESOLVED_TRANSPORT' :
              iceEnd === null ? 'CONDITIONAL_ICE_ONLY' :
                freezeDepth === null ? 'CONDITIONAL_LIQUID_BENEATH_ICE' :
                  'CONDITIONAL_LIQUID_AND_HIGH_PRESSURE_ICE',
          });
          if (!unresolved && (!close(scenario.solidMassKilograms + scenario.liquidMassKilograms, waterMass) ||
            scenario.solidMassKilograms < 0 || scenario.liquidMassKilograms < 0)) {
            throw new RangeError('PRE-33.04 lunar water phase balance must conserve mass.');
          }
          scenarios.push(scenario);
        }
      }
    }
    return Object.freeze({
      contractVersion: 'PRE-33.04/V3-LUNAR-SUBSURFACE-DOMAIN/v1',
      provenance: 'V3_PUBLIC_PROJECTION_FROM_MATERIALIZED_32F_LUNAR_SOURCES',
      hostPlanetOrdinal: physical.hostPlanetOrdinal,
      moonOrdinal: physical.moonOrdinal,
      domain,
      waterMassKilograms: waterMass,
      shellThicknessKilometers: thickness / 1000,
      basalPressurePascal: basal,
      depthAt2GPaKilometers: depth2,
      depthAt10GPaKilometers: depth10,
      pressureProfile: Object.freeze(profile),
      thermalEvaluation,
      thermalScenarios: Object.freeze(scenarios),
      actualPhaseCertified: false,
      actualSalinityResolved: false,
      lunarHistoryWaterBudgetResolved: false,
      observationalOceanConfirmed: false,
      scientificLimits: LIMITS,
    } satisfies MoonSubsurfaceDomainPRE3304);
  }
}
