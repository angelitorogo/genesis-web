import type { BodyLocator } from '../../domain/generation/procedural-locator';
import type {
  PlanetaryCryosphereSnapshot32_4,
  PlanetaryGlacialCurrentRegime32_4,
  PlanetaryGlaciationHistoryInput32_4,
  PlanetaryGlaciationHistoryResult32_4,
  PlanetaryFreezeThawWindow32_4,
  PlanetaryUndatedCryosphereProcess32_4,
} from '../../domain/planetary-history/planetary-glaciation-history-32-4';
import { PlanetaryHistoryEngine } from './planetary-history-engine';

const TOL = 1e-7;
const WATER_REFERENCE_FREEZING_POINT_KELVIN = 273.15;
const WATER_TRIPLE_POINT_PRESSURE_PASCAL = 611.657;

/**
 * GENESIS 32.4 — read-only cryosphere and glaciation/thaw *possibility* audit.
 *
 * Frozen present-day 20.5–20.7 projections are not a paleoclimate time-series.
 * Even a current mixed ice/liquid state and a thermal range crossing 273.15 K
 * establish NO glaciation onset, deglaciation, direction, date or duration.
 * The reference threshold is deliberately only a window for further study:
 * it does not replace 20.7 pressure-aware phase physics, local geography,
 * ocean circulation or a resolved historical water/illumination trajectory.
 */
export class PlanetaryGlaciationHistoryResolver32_4 {
  private constructor() {}

  static resolve(input: PlanetaryGlaciationHistoryInput32_4): PlanetaryGlaciationHistoryResult32_4 {
    if (!input?.atmosphere || !input.time || input.time.kind !== 'CURRENT_SNAPSHOT') {
      throw new TypeError('32.4 requires frozen atmosphere/climate/water and CT-0.');
    }
    const { hostPlanet: p, climateState: climate, climateVariabilityState: variability,
      waterInventory: water } = input.atmosphere;
    if (!p || !climate || !variability || !water ||
        !Number.isSafeInteger(p.planetOrdinal) || p.planetOrdinal < 1 ||
        !p.locator || p.locator.bodyIndex !== BigInt(p.planetOrdinal - 1) ||
        p.seed?.kind !== 'body') {
      throw new RangeError('32.4 requires a mature planet with canonical locator/seed.');
    }
    const multiplicity = p.hostPlanetarySystem?.hostStellarSystem?.multiplicity?.name;
    if (multiplicity !== 'SINGLE' && multiplicity !== 'BINARY' && multiplicity !== 'TRIPLE') {
      throw new RangeError('32.4 requires a resolved SINGLE/BINARY/TRIPLE host.');
    }
    for (const state of [climate, variability, water]) {
      if (state.planetOrdinal !== p.planetOrdinal || !sameLocator(state.bodyLocator, p.locator) ||
          !sameSeed(state.bodySeed, p.seed)) {
        throw new RangeError('32.4 cannot mix different planets or procedural seeds.');
      }
    }
    if (!approx(climate.equilibriumTemperatureKelvin,
          variability.sourceEquilibriumTemperatureKelvin) ||
        !approxNullable(climate.meanSurfaceTemperatureKelvin,
          variability.sourceMeanSurfaceTemperatureKelvin) ||
        !approxNullable(climate.meanSurfaceTemperatureKelvin,
          water.sourceMeanSurfaceTemperatureKelvin) ||
        !approxNullable(variability.minimumSurfaceTemperatureKelvin,
          water.sourceMinimumSurfaceTemperatureKelvin) ||
        !approxNullable(variability.maximumSurfaceTemperatureKelvin,
          water.sourceMaximumSurfaceTemperatureKelvin) ||
        !approxNullable(variability.stabilityIndex01, water.sourceClimateStabilityIndex01) ||
        !validNonnegative(climate.sourceReferenceMeanInsolationEarth) ||
        !valid01(water.waterInventoryIndex01)) {
      throw new RangeError('32.4 requires the exact 20.5 → 20.6 → 20.7 handoffs.');
    }
    const deep = climate.meanSurfaceTemperatureKelvin === null;
    const phases = [water.iceFraction01, water.liquidFraction01, water.vaporFraction01];
    const coverages = [water.surfaceIceCoverageFraction01, water.surfaceLiquidWaterCoverageFraction01];
    if (deep) {
      if (phases.some(x => x !== null) || coverages.some(x => x !== null) ||
          variability.minimumSurfaceTemperatureKelvin !== null ||
          variability.maximumSurfaceTemperatureKelvin !== null ||
          water.sourceRetainedSurfacePressurePascal !== null ||
          water.hasPersistentSurfaceLiquidWater) {
        throw new RangeError('32.4 cannot invent cryospheric terrain on a deep envelope.');
      }
    } else {
      if (!phases.every(valid01) || !coverages.every(valid01) ||
          !validNonnegative(water.sourceRetainedSurfacePressurePascal) ||
          coverages.reduce<number>((total, value) => total + (value ?? 0), 0) > 1 + TOL ||
          (liquidPhaseMissing(water.liquidFraction01, water.surfaceLiquidWaterCoverageFraction01)) ||
          (water.waterInventoryIndex01 <= TOL && phases.some(x => (x ?? 0) > TOL)) ||
          !validPositive(variability.minimumSurfaceTemperatureKelvin) ||
          !validPositive(variability.maximumSurfaceTemperatureKelvin) ||
          variability.minimumSurfaceTemperatureKelvin! > climate.meanSurfaceTemperatureKelvin! ||
          variability.maximumSurfaceTemperatureKelvin! < climate.meanSurfaceTemperatureKelvin! ||
          !approx(phases.reduce<number>((a, b) => a + (b ?? 0), 0), 1) &&
            phases.some(x => (x ?? 0) > 0)) {
        throw new RangeError('32.4 requires coherent surface water phases and thermal bounds.');
      }
    }
    const ice = water.iceFraction01 ?? 0;
    const liquid = water.liquidFraction01 ?? 0;
    const vapor = water.vaporFraction01 ?? 0;
    let regime: PlanetaryGlacialCurrentRegime32_4;
    if (deep) regime = 'DEEP_ENVELOPE_NO_SOLID_SURFACE';
    else if (ice + liquid + vapor <= TOL || water.waterInventoryIndex01 <= TOL) {
      regime = 'NO_MODELED_ACCESSIBLE_WATER';
    } else if (ice > liquid && ice > vapor) regime = 'ICE_DOMINATED_INVENTORY';
    else if (liquid > ice && liquid > vapor) regime = 'LIQUID_DOMINATED_INVENTORY';
    else if (vapor > ice && vapor > liquid) regime = 'VAPOR_DOMINATED_INVENTORY';
    else regime = 'MIXED_PHASE_INVENTORY';

    let window: PlanetaryFreezeThawWindow32_4 = 'NOT_EVALUABLE';
    if (!deep && water.waterInventoryIndex01 > TOL &&
        water.sourceRetainedSurfacePressurePascal! >= WATER_TRIPLE_POINT_PRESSURE_PASCAL &&
        (ice > TOL || water.surfaceIceCoverageFraction01! > TOL) &&
        (liquid > TOL || water.surfaceLiquidWaterCoverageFraction01! > TOL)) {
      window = variability.minimumSurfaceTemperatureKelvin! < WATER_REFERENCE_FREEZING_POINT_KELVIN &&
        variability.maximumSurfaceTemperatureKelvin! > WATER_REFERENCE_FREEZING_POINT_KELVIN
        ? 'REFERENCE_FREEZING_CROSSING_POSSIBLE'
        : 'NO_REFERENCE_CROSSING_IN_ENVELOPE';
    }

    const key = bodyKeyFor(p.locator);
    const prev = input.precedingVolatiles;
    if (prev && (prev.bodyKey !== key || prev.chronology?.bodyKind !== 'PLANET' ||
        prev.chronology.bodyKey !== key || prev.chronology.multiplicity !== multiplicity ||
        JSON.stringify(prev.chronology.time) !== JSON.stringify(input.time) ||
        !approx(prev.water.inventoryIndex01, water.waterInventoryIndex01) ||
        prev.water.phaseRegime !== water.phaseRegime ||
        !approxNullable(prev.water.iceFraction01, water.iceFraction01) ||
        !approxNullable(prev.water.liquidFraction01, water.liquidFraction01) ||
        !approxNullable(prev.water.vaporFraction01, water.vaporFraction01) ||
        !approxNullable(prev.water.surfaceIceCoverageFraction01, water.surfaceIceCoverageFraction01) ||
        !approxNullable(prev.water.surfaceLiquidWaterCoverageFraction01,
          water.surfaceLiquidWaterCoverageFraction01) ||
        prev.water.surfaceLiquidPersistenceModelled !== water.hasPersistentSurfaceLiquidWater)) {
      throw new RangeError('32.4 preceding 32.3 state belongs to another epoch/body or disagrees with water physics.');
    }
    const sourceEpisodes = prev?.sourceEpisodes ?? [];
    const chronology = PlanetaryHistoryEngine.build({
      bodyKind: 'PLANET', bodyKey: key, multiplicity, time: input.time, episodes: sourceEpisodes,
    });
    if (prev && JSON.stringify(chronology) !== JSON.stringify(prev.chronology)) {
      throw new RangeError('32.4 refuses a preceding chronology inconsistent with 32.1.');
    }

    const cryosphere: PlanetaryCryosphereSnapshot32_4 = Object.freeze({
      sourceModels: Object.freeze(['CLIMATE_20_5', 'CLIMATE_VARIABILITY_20_6', 'WATER_20_7'] as const),
      interpretation: 'CURRENT_MODEL_SNAPSHOT_NOT_HISTORICAL_EPISODES',
      currentMeanReferenceInsolationEarth: climate.sourceReferenceMeanInsolationEarth,
      currentEquilibriumTemperatureKelvin: climate.equilibriumTemperatureKelvin,
      currentMeanSurfaceTemperatureKelvin: climate.meanSurfaceTemperatureKelvin,
      currentSurfaceMinimumKelvin: variability.minimumSurfaceTemperatureKelvin,
      currentSurfaceMaximumKelvin: variability.maximumSurfaceTemperatureKelvin,
      iceInventoryFraction01: water.iceFraction01,
      liquidInventoryFraction01: water.liquidFraction01,
      vaporInventoryFraction01: water.vaporFraction01,
      iceSurfaceCoverageFraction01: water.surfaceIceCoverageFraction01,
      liquidSurfaceCoverageFraction01: water.surfaceLiquidWaterCoverageFraction01,
      waterInventoryIndex01: water.waterInventoryIndex01,
      pressurePascal: water.sourceRetainedSurfacePressurePascal,
      currentRegime: regime, freezeThawWindow: window,
      transitionDirection: 'NOT_RESOLVED',
    });
    const processes: readonly PlanetaryUndatedCryosphereProcess32_4[] = Object.freeze([
      Object.freeze({ process: 'GLACIATION_ONSET', temporalStatus: 'EPOCH_NOT_RESOLVED',
        evidence: 'CURRENT_STATE_ONLY',
        note: '20.5–20.7 contain no dated earlier climate, illumination or water-reservoir state.' }),
      Object.freeze({ process: 'DEGLACIATION', temporalStatus: 'EPOCH_NOT_RESOLVED',
        evidence: 'CURRENT_STATE_ONLY',
        note: 'A reference freezing-point crossing in current thermal bounds is not a historical thaw.' }),
    ]);
    return Object.freeze({ contractVersion: '32.4-CT0', layer: 'SIMULATED_REALITY',
      bodyKey: key, cryosphere, processes,
      sourceEpisodes: Object.freeze([...sourceEpisodes]), chronology,
      historicalCompleteness: 'NOT_ESTABLISHED', lifePresence: 'NOT_EVALUATED',
    });
  }
}

function sameLocator(a: BodyLocator, b: BodyLocator): boolean {
  return !!a && !!b && a.galaxyIndex === b.galaxyIndex && a.sectorKey === b.sectorKey &&
    a.galacticObjectIndex === b.galacticObjectIndex && a.bodyIndex === b.bodyIndex;
}
function sameSeed(a: { kind: string; normalizedValue: string }, b: { kind: string; normalizedValue: string }): boolean {
  return !!a && !!b && a.kind === 'body' && b.kind === 'body' && a.normalizedValue === b.normalizedValue;
}
function bodyKeyFor(b: BodyLocator): string {
  return `G${b.galaxyIndex}/S${b.sectorKey}/O${b.galacticObjectIndex}/B${b.bodyIndex}`;
}
function approx(a: number, b: number): boolean {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= TOL * Math.max(1, Math.abs(a), Math.abs(b));
}
function approxNullable(a: number | null, b: number | null): boolean {
  return a === null || b === null ? a === b : approx(a, b);
}
function liquidPhaseMissing(liquid: number | null, coverage: number | null): boolean {
  return liquid === 0 && coverage !== null && coverage > 0;
}
function validNonnegative(n: number | null): boolean { return n !== null && Number.isFinite(n) && n >= 0; }
function validPositive(n: number | null): boolean { return n !== null && Number.isFinite(n) && n > 0; }
function valid01(n: number | null): boolean { return n !== null && Number.isFinite(n) && n >= 0 && n <= 1; }
