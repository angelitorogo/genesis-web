import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import type { BodyLocator } from '../../domain/generation/procedural-locator';
import type {
  PlanetaryClimateGeochemistryHistoryInput32_6, PlanetaryClimateGeochemistryHistoryResult32_6,
  PlanetaryClimateGeochemistrySnapshot32_6, PlanetaryClimateGeochemistryDriver32_6,
} from '../../domain/planetary-history/planetary-climate-geochemistry-history-32-6';
import { PlanetaryHistoryEngine } from './planetary-history-engine';

const EPS = 1e-7;

/**
 * GENESIS 32.6 — Read-only attribution of *possible* climate/geochemical drivers.
 *
 * The present 20.x model is not a time-series. A difference between radiative
 * equilibrium and current surface temperature is a greenhouse offset, NOT a
 * historical temperature change. Normalized geologic indices are not fluxes.
 * Even a 23.13 realized impact has no resolved ΔT, aerosol lifetime or dated
 * forcing in point 23.10; no climate transition is added to 32.1 on that basis.
 * 32.7–32.9 may supply real event-based physics, while 32.12 owns interval replay.
 */
export class PlanetaryClimateGeochemistryHistoryResolver32_6 {
  private constructor() {}

  static resolve(input: PlanetaryClimateGeochemistryHistoryInput32_6): PlanetaryClimateGeochemistryHistoryResult32_6 {
    if (!input?.atmosphere || input.time?.kind !== 'CURRENT_SNAPSHOT') {
      throw new TypeError('32.6 requires a frozen atmosphere and CT-0 snapshot.');
    }
    const a = input.atmosphere;
    const p = a.hostPlanet;
    const climate = a.climateState;
    const variability = a.climateVariabilityState;
    const greenhouse = a.greenhouseEffect;
    const retention = a.retentionState;
    const water = a.waterInventory;
    const geology = a.geologyState;
    if (!p || !climate || !variability || !greenhouse || !retention || !water || !geology ||
        !Number.isSafeInteger(p.planetOrdinal) || p.planetOrdinal < 1 ||
        p.locator?.bodyIndex !== BigInt(p.planetOrdinal - 1) || p.seed?.kind !== 'body') {
      throw new RangeError('32.6 requires the canonical mature planet and phases 20.3–20.8.');
    }
    const multiplicity = p.hostPlanetarySystem?.hostStellarSystem?.multiplicity?.name;
    if (multiplicity !== 'SINGLE' && multiplicity !== 'BINARY' && multiplicity !== 'TRIPLE') {
      throw new RangeError('32.6 requires a resolved SINGLE/BINARY/TRIPLE host.');
    }
    for (const state of [climate, variability, greenhouse, retention, water, geology]) {
      if (state.planetOrdinal !== p.planetOrdinal || !sameLocator(state.bodyLocator, p.locator) ||
          state.bodySeed?.kind !== 'body' || state.bodySeed.normalizedValue !== p.seed.normalizedValue) {
        throw new RangeError('32.6 cannot mix different planet ordinals, locators or procedural seeds.');
      }
    }
    const effectivePressure = greenhouse.condensableEquilibriumState?.effectiveSurfacePressurePascal ??
      greenhouse.waterVaporEquilibriumState?.effectiveSurfacePressurePascal ??
      retention.retainedSurfacePressurePascal;
    if (!positive(climate.equilibriumTemperatureKelvin) ||
        !nonnegative(climate.sourceReferenceMeanInsolationEarth) ||
        !fraction(greenhouse.longwaveTrappingFraction01) ||
        !approx(climate.sourceReferenceMeanInsolationEarth, retention.sourceReferenceMeanInsolationEarth) ||
        !approx(climate.sourceReferenceMeanInsolationEarth, greenhouse.sourceReferenceMeanInsolationEarth) ||
        !approx(climate.sourceInfraredOpticalDepthProxy, greenhouse.infraredOpticalDepthProxy) ||
        !approx(climate.sourceGreenhouseRegime, greenhouse.regime) ||
        !approxNullable(climate.sourceGreenhouseTemperatureAmplificationFactor, greenhouse.temperatureAmplificationFactor) ||
        !approx(climate.equilibriumTemperatureKelvin, variability.sourceEquilibriumTemperatureKelvin) ||
        !approxNullable(climate.meanSurfaceTemperatureKelvin, variability.sourceMeanSurfaceTemperatureKelvin) ||
        !approxNullable(climate.meanSurfaceTemperatureKelvin, water.sourceMeanSurfaceTemperatureKelvin) ||
        !approxNullable(variability.minimumSurfaceTemperatureKelvin, water.sourceMinimumSurfaceTemperatureKelvin) ||
        !approxNullable(variability.maximumSurfaceTemperatureKelvin, water.sourceMaximumSurfaceTemperatureKelvin) ||
        !approxNullable(variability.stabilityIndex01, water.sourceClimateStabilityIndex01) ||
        !approxNullable(effectivePressure, water.sourceRetainedSurfacePressurePascal) ||
        !approx(geology.sourceWaterInventoryIndex01, water.waterInventoryIndex01) ||
        !approxNullable(geology.sourceSurfaceLiquidWaterCoverageFraction01, water.surfaceLiquidWaterCoverageFraction01) ||
        !approxNullable(retention.retainedSurfacePressurePascal, greenhouse.sourceRetainedSurfacePressurePascal) ||
        !fraction(water.waterInventoryIndex01)) {
      throw new RangeError('32.6 requires physically consistent 20.3–20.8 handoffs.');
    }
    const deep = climate.meanSurfaceTemperatureKelvin === null;
    if (deep !== (water.surfaceLiquidWaterCoverageFraction01 === null) ||
        deep !== (geology.volcanismIndex01 === null) ||
        deep !== (variability.minimumSurfaceTemperatureKelvin === null) ||
        deep !== (variability.maximumSurfaceTemperatureKelvin === null) ||
        deep !== (variability.stabilityIndex01 === null) ||
        deep !== (effectivePressure === null) ||
        (!deep && (!positive(climate.meanSurfaceTemperatureKelvin) ||
          !positive(variability.minimumSurfaceTemperatureKelvin) ||
          !positive(variability.maximumSurfaceTemperatureKelvin) ||
          variability.minimumSurfaceTemperatureKelvin > climate.meanSurfaceTemperatureKelvin ||
          variability.maximumSurfaceTemperatureKelvin < climate.meanSurfaceTemperatureKelvin))) {
      throw new RangeError('32.6 cannot infer a solid-surface climate on a deep envelope or invalid thermal bounds.');
    }
    for (const x of [variability.seasonalTemperatureAmplitudeKelvin,
      variability.diurnalTemperatureRangeKelvin]) {
      if (deep ? x !== null : !nonnegative(x)) {
        throw new RangeError('32.6 requires valid 20.6 seasonal and diurnal values.');
      }
    }
    for (const x of [geology.volcanismIndex01, geology.volatileOutgassingPotential01,
      geology.tectonicMobilityIndex01, variability.stabilityIndex01]) {
      if (deep ? x !== null : !fraction(x)) {
        throw new RangeError('32.6 geology and stability proxies must be normalized for solid surfaces.');
      }
    }

    const gases = greenhouse.condensableEquilibriumState?.effectiveGasComponents ??
      greenhouse.waterVaporEquilibriumState?.effectiveGasComponents ??
      retention.retainedGasComponents;
    if (!Array.isArray(gases)) throw new RangeError('32.6 requires an explicit gas-phase composition.');
    const unique = new Set<AtmosphereGas>();
    let gasSum = 0;
    const gasFractions = gases.map(g => {
      if (!Object.values(AtmosphereGas).includes(g.gas) || unique.has(g.gas) ||
          !Number.isFinite(g.moleFraction01) || g.moleFraction01 <= 0 || g.moleFraction01 > 1) {
        throw new RangeError('32.6 rejects invalid or duplicated gas species.');
      }
      unique.add(g.gas);
      gasSum += g.moleFraction01;
      return Object.freeze({ gas: g.gas, fraction01: g.moleFraction01 });
    }).sort((x, y) => compare(x.gas, y.gas));
    if (gasFractions.length && !approx(gasSum, 1)) {
      throw new RangeError('32.6 current mole fractions do not close.');
    }
    // A retained inventory may be fully condensed: no gas-phase constituents
    // then remain, even though 20.3 originally retained molecules.
    if (!gasFractions.length && effectivePressure !== null && effectivePressure > 0) {
      throw new RangeError('32.6 cannot have nonzero final gas pressure with no gas-phase species.');
    }
    const key = keyFor(p.locator);
    const previous = input.precedingCatastrophe;
    if (previous) {
      const c = previous.chronology;
      if (previous.bodyKey !== key || c?.bodyKind !== 'PLANET' || c.bodyKey !== key ||
          c.multiplicity !== multiplicity || JSON.stringify(c.time) !== JSON.stringify(input.time) ||
          !approxNullable(previous.volcanism.volcanismIndex01, geology.volcanismIndex01) ||
          !approxNullable(previous.volcanism.outgassingPotential01, geology.volatileOutgassingPotential01) ||
          !approxNullable(previous.volcanism.geologicalActivityIndex01, geology.geologicalActivityIndex01) ||
          !approxNullable(previous.volcanism.surfaceRenewalPotential01, geology.surfaceRenewalPotential01) ||
          previous.volcanism.sourceModel !== 'GEOLOGY_20_8' ||
          (previous.impactCoverage !== 'SOURCE_NOT_SUPPLIED' &&
           previous.impactCoverage !== 'SUPPLIED_EVENTS_ONLY')) {
        throw new RangeError('32.6 preceding 32.5 result belongs to another body, epoch or geological state.');
      }
    }
    const episodes = previous?.sourceEpisodes ?? [];
    const chronology = PlanetaryHistoryEngine.build({
      bodyKind: 'PLANET', bodyKey: key, multiplicity, time: input.time, episodes,
    });
    if (previous && JSON.stringify(chronology) !== JSON.stringify(previous.chronology)) {
      throw new RangeError('32.6 refuses a noncanonical preceding chronology.');
    }

    const snapshot: PlanetaryClimateGeochemistrySnapshot32_6 = Object.freeze({
      sourceModels: Object.freeze(['ATMOSPHERE_20_3_20_4', 'CLIMATE_20_5_20_6',
        'WATER_20_7', 'GEOLOGY_20_8'] as const),
      interpretation: 'CURRENT_PHYSICAL_STATE_NOT_HISTORICAL_TREND',
      meanInsolationEarth: climate.sourceReferenceMeanInsolationEarth,
      equilibriumTemperatureKelvin: climate.equilibriumTemperatureKelvin,
      meanSurfaceTemperatureKelvin: climate.meanSurfaceTemperatureKelvin,
      minimumSurfaceTemperatureKelvin: variability.minimumSurfaceTemperatureKelvin,
      maximumSurfaceTemperatureKelvin: variability.maximumSurfaceTemperatureKelvin,
      seasonalTemperatureAmplitudeKelvin: variability.seasonalTemperatureAmplitudeKelvin,
      dayNightTemperatureRangeKelvin: variability.diurnalTemperatureRangeKelvin,
      currentClimateStabilityIndex01: variability.stabilityIndex01,
      greenhouseTrappingFraction01: greenhouse.longwaveTrappingFraction01,
      currentEffectiveSurfacePressurePascal: effectivePressure,
      gasPhaseSource: greenhouse.condensableEquilibriumState
        ? 'CONDENSATION_EQUILIBRIUM_20_4'
        : greenhouse.waterVaporEquilibriumState
          ? 'WATER_VAPOR_EQUILIBRIUM_20_4' : 'RETAINED_GASES_20_3',
      gasPhaseMoleFractions: Object.freeze(gasFractions),
      waterInventoryIndex01: water.waterInventoryIndex01,
      surfaceWaterCoverageFraction01: water.surfaceLiquidWaterCoverageFraction01,
      surfaceIceCoverageFraction01: water.surfaceIceCoverageFraction01,
      volcanismPotential01: geology.volcanismIndex01,
      volatileOutgassingPotential01: geology.volatileOutgassingPotential01,
      tectonicMobilityIndex01: geology.tectonicMobilityIndex01,
    });

    const drivers: PlanetaryClimateGeochemistryDriver32_6[] = [];
    const add = (keySuffix: string, kind: PlanetaryClimateGeochemistryDriver32_6['kind'],
      sourceModel: string, status: PlanetaryClimateGeochemistryDriver32_6['status'],
      record: string | null = null) => {
      drivers.push(Object.freeze({
        driverKey: `${key}:${keySuffix}${record === null ? '' : `:${JSON.stringify(record)}`}`,
        kind, status, sourceModel, sourceRecordKey: record,
        causeEvidence: status === 'CURRENT_CONDITION_ONLY' ? 'PRESENT_MODEL_PROXY' : 'RESOLVED_PHYSICAL_EVENT',
        climateResponse: 'NOT_QUANTIFIED', geochemicalResponse: 'NOT_QUANTIFIED',
        direction: 'NOT_RESOLVED', startYear: null, endYear: null, durationYears: null,
        temperatureDeltaKelvin: null, gasMassDeltaKilograms: null,
        radiativeForcingWattsPerSquareMeter: null,
        uncertainty: status === 'CURRENT_CONDITION_ONLY' ? 'NO_HISTORICAL_STATES' :
          'IMPACT_CONSEQUENCES_NOT_CLIMATICALLY_RESOLVED',
      }));
    };
    add('stellar-forcing', 'ILLUMINATION_OR_ORBITAL_FORCING', 'CLIMATE_20_5', 'CURRENT_CONDITION_ONLY');
    add('greenhouse', 'GREENHOUSE_AND_GAS_CHEMISTRY', 'ATMOSPHERE_20_3_20_4', 'CURRENT_CONDITION_ONLY');
    if (!deep) {
      add('water', 'WATER_PHASE_FEEDBACK', 'WATER_20_7', 'CURRENT_CONDITION_ONLY');
      add('outgassing', 'GEOLOGICAL_OUTGASSING_AND_CYCLING', 'GEOLOGY_20_8', 'CURRENT_CONDITION_ONLY');
    }
    if (previous) {
      const ids = new Set<string>();
      if (!Array.isArray(previous.realizedImpactEffects)) {
        throw new RangeError('32.6 preceding realized impact effects must be an array.');
      }
      for (const impact of previous.realizedImpactEffects) {
        if (impact.sourceModel !== 'REALIZED_IMPACT_23_13_EFFECTS_23_10' ||
            impact.targetBodyKey !== key || !impact.sourceEventId || ids.has(impact.sourceEventId) ||
            impact.radiativeEffect !== 'NOT_QUANTIFIED' ||
            impact.radiativeForcingWattsPerSquareMeter !== null ||
            impact.temperatureChangeKelvin !== null || impact.historicalDating !== 'DEFERRED_TO_32_8') {
          throw new RangeError('32.6 rejects foreign, duplicated or fabricated radiative impact consequences.');
        }
        ids.add(impact.sourceEventId);
      }
      if (previous.impactCoverage === 'SOURCE_NOT_SUPPLIED' && ids.size > 0) {
        throw new RangeError('32.6 cannot accept an impact without the supplied realized catalogue.');
      }
      for (const id of [...ids].sort(compare)) {
        add('impact', 'REALIZED_IMPACT_POSSIBLE_CLIMATE_EFFECT',
          'REALIZED_IMPACT_23_13_EFFECTS_23_10', 'RESOLVED_IMPACT_UNQUANTIFIED_EFFECT', id);
      }
    }
    return Object.freeze({ contractVersion: '32.6-CT0', layer: 'SIMULATED_REALITY',
      bodyKey: key, snapshot, drivers: Object.freeze(drivers),
      resolvedClimateGeochemistryChanges: Object.freeze([] as const),
      sourceEpisodes: Object.freeze([...episodes]), chronology,
      historicalCompleteness: 'NOT_ESTABLISHED', lifePresence: 'NOT_EVALUATED',
    });
  }
}

function keyFor(l: BodyLocator): string {
  return `G${l.galaxyIndex}/S${l.sectorKey}/O${l.galacticObjectIndex}/B${l.bodyIndex}`;
}
function sameLocator(a: BodyLocator, b: BodyLocator): boolean {
  return !!a && !!b && a.galaxyIndex === b.galaxyIndex && a.sectorKey === b.sectorKey &&
    a.galacticObjectIndex === b.galacticObjectIndex && a.bodyIndex === b.bodyIndex;
}
function approx(a: number | string, b: number | string): boolean {
  if (typeof a === 'string' || typeof b === 'string') return a === b;
  return Number.isFinite(a) && Number.isFinite(b) &&
    Math.abs(a - b) <= EPS * Math.max(1, Math.abs(a), Math.abs(b));
}
function approxNullable(a: number | null, b: number | null): boolean {
  return a === null || b === null ? a === b : approx(a, b);
}
function positive(x: number | null): x is number { return x !== null && Number.isFinite(x) && x > 0; }
function nonnegative(x: number | null): x is number { return x !== null && Number.isFinite(x) && x >= 0; }
function fraction(x: number | null): x is number {
  return x !== null && Number.isFinite(x) && x >= 0 && x <= 1;
}
function compare(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }
