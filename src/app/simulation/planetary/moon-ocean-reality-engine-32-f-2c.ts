import type { MoonSeed } from '../../domain/seed/hierarchical-seeds';
import type { MoonFormationInventory32F1d } from '../../domain/planetary/moon-formation-inventory-32-f-1d';
import type { MoonWaterPhaseInventory32F2a } from '../../domain/planetary/moon-water-phase-inventory-32-f-2a';
import type { MoonInteriorStructure32F2b, MoonInteriorLayer32F2b } from '../../domain/planetary/moon-interior-structure-32-f-2b';
import type { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import type { MoonInternalWaterAssessment } from '../../domain/planetary/moon-internal-water-assessment';
import type { MoonOceanRadialLayer32F2c, MoonOceanReality32F2c } from '../../domain/planetary/moon-ocean-reality-32-f-2c';

const G = 6.67430e-11;
const ICE_K = 2.5;
const ADIABAT = 1.2e-8;
const MAX_PRESSURE = 2e9;
const RADIOGENIC_UPPER = 1e-11;
const GRID = 384;
const LIMITS = Object.freeze([
  'MODELLED_WORLD_NOT_AN_OBSERVED_OR_UNIQUELY_INFERRED_INTERIOR',
  'FORMATION_COMPOSITION_DENSITY_ENDMEMBER_AND_RADIAL_SORTING_ARE_CONDITIONAL',
  'TIDAL_K2_Q_AND_RADIOGENIC_POWERS_ARE_SEEDED_BOUNDED_PRIORS_NOT_DATED_SOURCES',
  'H2O_PHASE_DIAGRAM_IS_APPROXIMATE_AND_VALID_ONLY_0_TO_2_GPA',
  'CONDUCTION_ONLY_IN_ICE_AND_ASSUMED_WEAK_LIQUID_ADIABAT;_NO_CONVECTION_SOLVER',
  'NO_SALINITY_VOLATILE_TRANSPORT_PHASE_KINETICS_OR_HISTORICAL_PERSISTENCE',
  'NO_OCEAN_PRESENCE_IS_EVIDENCE_OF_LIFE_OR_BIOLOGICAL_COMPATIBILITY',
]);

// Approximate pure-water melting temperatures at experimentally motivated
// phase-region knots. These are MODEL APPROXIMATIONS, not an exact IAPWS
// equation of state or a salinity-dependent melting diagram.
const MELT_KNOTS: readonly (readonly [number, number])[] = [
  [0, 273.15], [0.209e9, 251.2], [0.35e9, 256.0],
  [0.63e9, 273.0], [1.0e9, 300.0], [1.5e9, 330.0], [2e9, 355.0],
];

const close = (a: number, b: number): boolean =>
  Number.isFinite(a) && Number.isFinite(b) &&
  Math.abs(a - b) <= 1e-10 * Math.max(1, Math.abs(a), Math.abs(b));

/** Pure, deterministic, domain-separated sampler; no V2 PRNG calls consumed. */
const unit = (seed: MoonSeed, salt: number): number => {
  let h = (0x811c9dc5 ^ salt) >>> 0;
  for (const c of `GENESIS-32-F-2C-OCEAN-V1|${seed.normalizedValue}`) {
    h = Math.imul(h ^ c.charCodeAt(0), 0x01000193) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 0x100000000;
};

const melt = (p: number): number | null => {
  if (!Number.isFinite(p) || p < 0 || p > MAX_PRESSURE) return null;
  for (let i = 1; i < MELT_KNOTS.length; i++) {
    const [p1, t1] = MELT_KNOTS[i];
    if (p <= p1) {
      const [p0, t0] = MELT_KNOTS[i - 1];
      return t0 + (p - p0) * (t1 - t0) / (p1 - p0);
    }
  }
  return MELT_KNOTS[MELT_KNOTS.length - 1][1];
};

/** Resolves the CT-0 model's simulated-world water layers. This is a complete
 * constitutive realization only *within* its stated physical domain; otherwise
 * the correct value is UNRESOLVED, never a made-up yes/no. */
export class MoonOceanRealityEngine32F2c {
  private constructor() {}

  static fromMaterialized(
    physical: MoonPhysicalProperties,
    seed: MoonSeed,
    formation: MoonFormationInventory32F1d,
    phases: MoonWaterPhaseInventory32F2a,
    interior: MoonInteriorStructure32F2b,
    cryosphere: MoonInternalWaterAssessment | null,
    surfaceTemperatureKelvin: number,
  ): MoonOceanReality32F2c {
    const identity = (x: { hostPlanetOrdinal: number; moonOrdinal: number }): boolean =>
      x.hostPlanetOrdinal === physical.hostPlanetOrdinal && x.moonOrdinal === physical.moonOrdinal;
    if (seed.kind !== 'moon' || ![formation, phases, interior].every(identity) ||
      interior.provenance !== 'CONDITIONAL_DIFFERENTIATED_FORMATION_ENDMEMBER_NOT_OBSERVED' ||
      formation.provenance !== 'DETERMINISTIC_CONDITIONAL_FORMATION_MODEL_NOT_OBSERVATION' ||
      phases.provenance !== 'FORMATION_H2O_ENDMEMBER_CONDITIONAL_NOT_OBSERVED' ||
      !close(interior.totalMassKilograms, formation.totalMassKilograms) ||
      !close(interior.waterMassKilograms, formation.waterIceMassKilograms) ||
      !close(phases.sourceFormationWaterKilograms, interior.waterMassKilograms) ||
      !close(surfaceTemperatureKelvin, phases.sourceSurfaceTemperatureKelvin) ||
      !Number.isFinite(surfaceTemperatureKelvin) || surfaceTemperatureKelvin <= 0 ||
      !Number.isFinite(interior.surfaceRadiusKilometers) || interior.surfaceRadiusKilometers <= 0 ||
      interior.layers.length !== 4 ||
      interior.layers[3].kind !== 'H2O_OUTER_SHELL') {
      throw new RangeError('32.F.2c requires aligned, valid physical/formation/interior inputs.');
    }
    const shell = interior.layers[3];
    const radius = shell.outerRadiusKilometers * 1000;
    const bottomRadius = shell.innerRadiusKilometers * 1000;
    const thickness = radius - bottomRadius;
    const waterMass = interior.waterMassKilograms;
    if (!close(shell.massKilograms, waterMass) || thickness < 0 ||
        !close(radius, physical.radiusEarth * 6371000)) {
      throw new RangeError('32.F.2c water shell must conserve formation mass and lunar radius.');
    }
    const min = cryosphere?.tidalHeatFluxMinimumWattsPerSquareMeter ?? null;
    const max = cryosphere?.tidalHeatFluxMaximumWattsPerSquareMeter ?? null;
    if (cryosphere !== null && cryosphere.basis !== 'ECCENTRICITY_TIDES_BOUNDED_SCENARIO') {
      throw new RangeError('32.F.2c requires a physical tidal-flux interval, not an index.');
    }
    if ([min, max].some(x => x !== null && (!Number.isFinite(x) || x < 0)) ||
        (min !== null && max !== null && min > max)) {
      throw new RangeError('32.F.2c invalid tidal heat interval.');
    }
    const tidal = min === null || max === null ? null :
      min === 0 ? max * unit(seed, 0x1234) :
        min * Math.pow(max / min, unit(seed, 0x1234));
    const power = waterMass > 0 && tidal !== null
      ? RADIOGENIC_UPPER * unit(seed, 0x5678) : null;
    const radio = power === null ? null : power * formation.rockMassKilograms /
      (4 * Math.PI * radius ** 2);
    const flux = tidal === null || radio === null ? null : tidal + radio;

    // In the 32.F.2b differentiated scenario, densities are held constant
    // through phase changes. Radial liquid/solid mass allocation follows the
    // frozen shell geometry. Layer-specific pressure is recomputed at a finer
    // radial resolution; no global constant-g approximation is used.
    const structural = interior.layers;
    const enclosed = (r: number): number => {
      let m = 0;
      for (const l of structural) {
        const inner = l.innerRadiusKilometers * 1000;
        const outer = l.outerRadiusKilometers * 1000;
        if (r >= outer) { m += l.massKilograms; continue; }
        if (r > inner && outer > inner) {
          m += l.massKilograms * (r ** 3 - inner ** 3) / (outer ** 3 - inner ** 3);
        }
        break;
      }
      return m;
    };
    const pressure: number[] = new Array(GRID + 1).fill(0);
    const dr = thickness / GRID;
    for (let i = 1; i <= GRID; i++) {
      const r = radius - (i - .5) * dr;
      pressure[i] = pressure[i - 1] + G * enclosed(r) *
        shell.effectiveDensityKilogramsPerCubicMeter * dr / (r * r);
    }
    let state: MoonOceanReality32F2c['state'] = 'UNRESOLVED_IN_SIMULATED_MODEL';
    let reason: MoonOceanReality32F2c['reason'] = 'UNRESOLVED_INTERFACE';
    let upperIce: number | null = null;
    let ocean: number | null = null;
    let highIce: number | null = null;
    let liquidMass: number | null = null;
    let solidMass: number | null = null;
    let layers: MoonOceanRadialLayer32F2c[] = [];
    const waterFraction = (a: number, b: number): number =>
      waterMass * ((radius - a) ** 3 - (radius - b) ** 3) /
      (radius ** 3 - bottomRadius ** 3);
    const tempConductive = (d: number): number =>
      surfaceTemperatureKelvin + flux! * radius ** 2 / ICE_K *
        (1 / (radius - d) - 1 / radius);
    const tempLiquid = (d: number, interfaceDepth: number, interfaceT: number): number => {
      const p = pressure[Math.min(GRID, Math.round(d / dr))];
      const pi = pressure[Math.min(GRID, Math.round(interfaceDepth / dr))];
      return interfaceT + ADIABAT * (p - pi);
    };
    const phaseTemperature = (depth: number, iface: number, interfaceT: number): number =>
      depth <= iface ? tempConductive(depth) : tempLiquid(depth, iface, interfaceT);
    const push = (phase: MoonOceanRadialLayer32F2c['phase'], a: number, b: number,
      iface: number, interfaceT: number) => {
      if (b <= a) return;
      const pressureAt = (d: number) => {
        const x = Math.max(0, Math.min(GRID, d / dr));
        const i = Math.min(GRID - 1, Math.floor(x));
        return pressure[i] * (1 - (x - i)) + pressure[i + 1] * (x - i);
      };
      layers.push(Object.freeze({ phase, topDepthKilometers: a / 1000,
        bottomDepthKilometers: b / 1000,
        massKilograms: waterFraction(a, b), pressureTopPascal: pressureAt(a),
        pressureBottomPascal: pressureAt(b),
        temperatureTopKelvin: phaseTemperature(a, iface, interfaceT),
        temperatureBottomKelvin: phaseTemperature(b, iface, interfaceT),
      }));
    };

    if (waterMass === 0 || thickness === 0) {
      state = 'ABSENT_IN_SIMULATED_MODEL'; reason = 'NO_FORMATION_H2O';
      upperIce = 0; ocean = 0; highIce = 0; liquidMass = 0; solidMass = 0;
    } else if (flux === null) {
      reason = 'MISSING_TIDAL_HEAT';
    } else if (surfaceTemperatureKelvin >= 273.15) {
      reason = 'TEMPERATE_SURFACE_WITH_UNRESOLVED_CONFINEMENT';
    } else if (surfaceTemperatureKelvin < 100 ||
      flux > 500 || pressure[GRID] > MAX_PRESSURE || bottomRadius <= 0) {
      reason = pressure[GRID] > MAX_PRESSURE ?
        'HIGH_PRESSURE_PHASE_OUTSIDE_DOMAIN' : 'THERMAL_TRANSPORT_OUTSIDE_DOMAIN';
    } else {
      // Scan frozen-ice conductive branch down to the first melting interface.
      // Below that boundary, an approximate liquid adiabat is tested against
      // the high-pressure polymorph melting envelope. Re-freezing at depth
      // creates a physically meaningful lower high-pressure ice layer.
      let interfaceDepth: number | null = null;
      let freezeDepth: number | null = null;
      let interfaceT = 0;
      let outsideDomain = false;
      for (let i = 1; i <= GRID; i++) {
        const depth = i * dr;
        const t = interfaceDepth === null ? tempConductive(depth) :
          tempLiquid(depth, interfaceDepth, interfaceT);
        const tm = melt(pressure[i]);
        if (tm === null || !Number.isFinite(t) || t > 850 || t <= 0) {
          outsideDomain = true;
          break;
        }
        if (interfaceDepth === null && t >= tm) {
          // Resolve boundary with a binary search *inside* the current zone.
          let low = (i - 1) * dr, high = depth;
          for (let j = 0; j < 36; j++) {
            const mid = (low + high) / 2;
            const x = mid / dr;
            const k = Math.min(GRID - 1, Math.floor(x));
            const p = pressure[k] * (1 - (x - k)) + pressure[k + 1] * (x - k);
            if (tempConductive(mid) >= melt(p)!) high = mid;
            else low = mid;
          }
          interfaceDepth = high;
          interfaceT = tempConductive(high);
        } else if (interfaceDepth !== null && t < tm) {
          // Approximate high-pressure solid branch beneath a liquid layer.
          freezeDepth = depth;
          break;
        }
      }
      if (outsideDomain) {
        reason = 'THERMAL_TRANSPORT_OUTSIDE_DOMAIN';
      } else if (interfaceDepth === null) {
        state = 'ABSENT_IN_SIMULATED_MODEL';
        reason = 'ICE_STABLE_IN_GENERATED_MODEL';
        upperIce = thickness / 1000; ocean = 0; highIce = 0;
        liquidMass = 0; solidMass = waterMass;
        push('ICE_IH', 0, thickness, thickness, tempConductive(thickness));
      } else if (interfaceDepth >= thickness ||
        (freezeDepth !== null && freezeDepth - interfaceDepth < 1)) {
        reason = 'UNRESOLVED_INTERFACE';
      } else {
        const lowerBoundary = freezeDepth ?? thickness;
        if (lowerBoundary - interfaceDepth < 1 ||
          interfaceDepth < .001) {
          reason = 'UNRESOLVED_INTERFACE';
        } else {
          state = 'PRESENT_IN_SIMULATED_MODEL';
          reason = 'SUBSURFACE_LIQUID_IN_GENERATED_MODEL';
          upperIce = interfaceDepth / 1000;
          ocean = (lowerBoundary - interfaceDepth) / 1000;
          highIce = (thickness - lowerBoundary) / 1000;
          liquidMass = waterFraction(interfaceDepth, lowerBoundary);
          solidMass = waterMass - liquidMass;
          push('ICE_IH', 0, interfaceDepth, interfaceDepth, interfaceT);
          push('LIQUID_H2O', interfaceDepth, lowerBoundary, interfaceDepth, interfaceT);
          push('HIGH_PRESSURE_ICE_APPROX', lowerBoundary, thickness, interfaceDepth, interfaceT);
        }
      }
    }
    if (state !== 'UNRESOLVED_IN_SIMULATED_MODEL' &&
      (!close((liquidMass ?? 0) + (solidMass ?? 0), waterMass) ||
        !close(layers.reduce((a, b) => a + b.massKilograms, 0), waterMass) && waterMass > 0 ||
        (liquidMass ?? 0) < 0 || (solidMass ?? 0) < 0)) {
      throw new RangeError('32.F.2c must conserve H2O across radial phases.');
    }
    return Object.freeze({
      contractVersion: '32.F.2c-seeded-interior-ocean-model-v1',
      provenance: 'SIMULATED_CT0_CONSTITUTIVE_MODEL_NOT_DIRECT_OBSERVATION',
      hostPlanetOrdinal: physical.hostPlanetOrdinal,
      moonOrdinal: physical.moonOrdinal,
      state, reason,
      generatedTidalFluxWattsPerSquareMeter: tidal,
      generatedRadiogenicSpecificPowerWattsPerKilogramRock: power,
      generatedRadiogenicFluxWattsPerSquareMeter: radio,
      generatedTotalSurfaceHeatFluxWattsPerSquareMeter: flux,
      assumedIceConductivityWattsPerMeterKelvin: 2.5,
      assumedOceanAdiabaticTemperatureGradientKelvinPerPascal: ADIABAT,
      meltingDiagram: 'APPROX_PURE_H2O_IH_III_V_VI_0_TO_2_GPA',
      surfaceTemperatureKelvin,
      waterInventoryKilograms: waterMass,
      pressureAtWaterShellBasePascal: pressure[GRID],
      waterShellThicknessKilometers: thickness / 1000,
      iceCoverThicknessKilometers: upperIce,
      liquidLayerThicknessKilometers: ocean,
      highPressureIceThicknessKilometers: highIce,
      simulatedLiquidWaterMassKilograms: liquidMass,
      simulatedSolidWaterMassKilograms: solidMass,
      radialLayers: Object.freeze(layers),
      scientificLimits: LIMITS,
    } satisfies MoonOceanReality32F2c);
  }
}
