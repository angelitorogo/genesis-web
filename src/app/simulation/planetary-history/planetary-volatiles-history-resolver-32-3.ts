import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import type { BodyLocator } from '../../domain/generation/procedural-locator';
import type {
  PlanetaryAtmosphereBalance32_3,
  PlanetaryCondensateBalance32_3,
  PlanetaryVolatileGasBudget32_3,
  PlanetaryVolatilesHistoryInput32_3,
  PlanetaryVolatilesHistoryResult32_3,
  PlanetaryUndatedProcess32_3,
} from '../../domain/planetary-history/planetary-volatiles-history-32-3';
import { PlanetaryHistoryEngine } from './planetary-history-engine';

const TOLERANCE = 1e-7;

/**
 * GENESIS 32.3 — atmospheric retention and volatile partition, read-only.
 *
 * 20.2 -> 20.3 is an integrated model-relative inventory balance, NOT an
 * observed historical escape rate or a dated escape event. 20.4 condensation
 * is a contemporary partition, NOT necessarily an ocean-formation episode.
 * 20.7 water inventory is a dimensionless present-day proxy, NOT kg of H2O.
 * Never connect these quantities as if they shared units, or create fake
 * episode dates from today's temperature/pressure or source model order.
 */
export class PlanetaryVolatilesHistoryResolver32_3 {
  private constructor() {}

  static resolve(input: PlanetaryVolatilesHistoryInput32_3): PlanetaryVolatilesHistoryResult32_3 {
    if (!input?.atmosphere || !input.time || input.time.kind !== 'CURRENT_SNAPSHOT') {
      throw new TypeError('32.3 requires a resolved atmosphere and CT-0 current snapshot.');
    }
    const a = input.atmosphere;
    const p = a.hostPlanet;
    const bulk = a.bulkProperties;
    const retention = a.retentionState;
    const greenhouse = a.greenhouseEffect;
    const water = a.waterInventory;
    const climate = a.climateState;
    if (!p || !bulk || !retention || !greenhouse || !water || !climate ||
        !Number.isSafeInteger(p.planetOrdinal) || p.planetOrdinal <= 0) {
      throw new TypeError('32.3 requires frozen 20.2–20.7 results for the same mature planet.');
    }
    const locator = p.locator;
    if (!locator || locator.bodyIndex !== BigInt(p.planetOrdinal - 1)) {
      throw new RangeError('32.3 planet locator and ordinal disagree.');
    }
    const bodyKey = bodyKeyFor(locator);
    for (const state of [bulk, retention, greenhouse, water, climate]) {
      if (state.planetOrdinal !== p.planetOrdinal || !sameBody(state.bodyLocator, locator) ||
          !sameSeed(state.bodySeed, p.seed)) {
        throw new RangeError('32.3 received volatile/climate states from different planets or seeds.');
      }
    }
    const hostMultiplicity = p.hostPlanetarySystem?.hostStellarSystem?.multiplicity?.name;
    if (hostMultiplicity !== 'SINGLE' && hostMultiplicity !== 'BINARY' && hostMultiplicity !== 'TRIPLE') {
      throw new RangeError('32.3 requires the original SINGLE/BINARY/TRIPLE architecture.');
    }
    // Match the actual 20.7 handoff: surface-water pressure is the *effective*
    // 20.4 gas-phase pressure after condensation, not the pre-condensation
    // retained pressure of 20.3. This difference matters on cold/wet worlds.
    const effectivePressureForWater =
      greenhouse.condensableEquilibriumState?.effectiveSurfacePressurePascal ??
      greenhouse.waterVaporEquilibriumState?.effectiveSurfacePressurePascal ??
      retention.retainedSurfacePressurePascal;
    const vacuumInventory = retention.gasRetentions.length === 0 &&
      retention.retainedMoleInventoryFraction01 === 0 &&
      retention.lostMoleInventoryFraction01 === 0;
    if (bulk.sourcePlanetType !== water.sourcePlanetType ||
        !approxNullable(bulk.surfacePressurePascal, retention.sourceSurfacePressurePascal) ||
        !approxNullable(effectivePressureForWater, water.sourceRetainedSurfacePressurePascal) ||
        !approxNullable(climate.meanSurfaceTemperatureKelvin, water.sourceMeanSurfaceTemperatureKelvin) ||
        (!vacuumInventory && !approx(
          retention.retainedMoleInventoryFraction01 + retention.lostMoleInventoryFraction01, 1))) {
      throw new RangeError('32.3 atmospheric and hydrosphere handoffs are inconsistent.');
    }

    const gasBudgets: PlanetaryVolatileGasBudget32_3[] = [];
    let sumSource = 0;
    let sumRetained = 0;
    let sumLost = 0;
    const seen = new Set<AtmosphereGas>();
    for (const gas of retention.gasRetentions) {
      if (seen.has(gas.gas) || !Object.values(AtmosphereGas).includes(gas.gas)) {
        throw new RangeError('32.3 received duplicated or unknown gas species.');
      }
      seen.add(gas.gas);
      const source = gas.sourceMoleFraction01;
      const retained = source * gas.retentionFraction01;
      const lost = source * gas.lossFraction01;
      if (![source, retained, lost, gas.retainedMoleFraction01].every(valid01) ||
          !approx(retained + lost, source)) {
        throw new RangeError('32.3 has an invalid per-species retention budget.');
      }
      sumSource += source;
      sumRetained += retained;
      sumLost += lost;
      gasBudgets.push(Object.freeze({
        gas: gas.gas, sourceEquivalentFraction01: source,
        retainedSourceEquivalentFraction01: retained, lostSourceEquivalentFraction01: lost,
        retainedAtmosphereMoleFraction01: gas.retainedMoleFraction01,
      }));
    }
    const isEmptyVacuum = gasBudgets.length === 0 && bulk.surfacePressurePascal === 0;
    if (isEmptyVacuum) {
      if (retention.retainedMoleInventoryFraction01 !== 0 ||
          retention.lostMoleInventoryFraction01 !== 0) {
        throw new RangeError('32.3 vacuum cannot have retained or escaped gas inventory.');
      }
    } else if (!approx(sumSource, 1) ||
        !approx(sumRetained, retention.retainedMoleInventoryFraction01) ||
        !approx(sumLost, retention.lostMoleInventoryFraction01) ||
        !approx(sumRetained + sumLost, 1)) {
      throw new RangeError('32.3 source-weighted gas budgets must close.');
    }
    if (bulk.surfacePressurePascal !== null &&
        !approx(retention.retainedSurfacePressurePascal ?? NaN,
          bulk.surfacePressurePascal * retention.retainedMoleInventoryFraction01)) {
      throw new RangeError('32.3 source and retained surface-pressure proxies disagree.');
    }
    const atmosphere: PlanetaryAtmosphereBalance32_3 = Object.freeze({
      sourceSurfacePressurePascal: bulk.surfacePressurePascal,
      retainedSurfacePressurePascal: retention.retainedSurfacePressurePascal,
      retainedSourceInventoryFraction01: retention.retainedMoleInventoryFraction01,
      lostSourceInventoryFraction01: retention.lostMoleInventoryFraction01,
      species: Object.freeze(gasBudgets.sort((x, y) => compare(x.gas, y.gas))),
      sourceModel: 'ATMOSPHERE_20_2_20_3',
      interpretation: 'INTEGRATED_MODEL_BALANCE_NOT_DATED',
    });

    const condensates: PlanetaryCondensateBalance32_3[] = [];
    const multi = greenhouse.condensableEquilibriumState;
    const vapor = greenhouse.waterVaporEquilibriumState;
    if (multi) {
      for (const s of multi.speciesEquilibria) {
        pushCondensate(condensates, s.gas, s.sourcePartialPressurePascal,
          s.effectivePartialPressurePascal, s.condensedPartialPressurePascal);
      }
      if (vapor && !approx(multi.effectiveSurfacePressurePascal, vapor.effectiveSurfacePressurePascal)) {
        throw new RangeError('32.3 overlapping condensable and H2O gas partitions disagree.');
      }
    } else if (vapor) {
      pushCondensate(condensates, AtmosphereGas.WATER_VAPOR,
        vapor.sourceWaterVaporPartialPressurePascal,
        vapor.effectiveWaterVaporPartialPressurePascal,
        vapor.condensedWaterPartialPressurePascal);
    }
    condensates.sort((x, y) => compare(x.gas, y.gas));
    if (multi || vapor) {
      const effectivePressure = multi?.effectiveSurfacePressurePascal ?? vapor!.effectiveSurfacePressurePascal;
      const sourcePressure = multi?.sourceSurfacePressurePascal ?? vapor!.sourceSurfacePressurePascal;
      const sumCondensate = condensates.reduce((sum, s) => sum + s.condensedEquivalentPressurePascal, 0);
      if (!approx(sourcePressure - effectivePressure, sumCondensate)) {
        throw new RangeError('32.3 condensed and gas-phase atmospheric equivalents do not close.');
      }
    }

    for (const n of [water.waterInventoryIndex01,
      water.iceFraction01, water.liquidFraction01, water.vaporFraction01,
      water.surfaceIceCoverageFraction01, water.surfaceLiquidWaterCoverageFraction01]) {
      if (n !== null && !valid01(n)) {
        throw new RangeError('32.3 received a water index/fraction outside [0,1].');
      }
    }
    const phases = [water.iceFraction01, water.liquidFraction01, water.vaporFraction01];
    if (phases.every(x => x !== null)) {
      const total = (phases[0] ?? 0) + (phases[1] ?? 0) + (phases[2] ?? 0);
      if (total > TOLERANCE && !approx(total, 1)) {
        throw new RangeError('32.3 20.7 phase fractions do not close.');
      }
    } else if (!phases.every(x => x === null)) {
      throw new RangeError('32.3 partial-null water phase partition is invalid.');
    }
    const waterSnapshot = Object.freeze({
      inventoryIndex01: water.waterInventoryIndex01,
      phaseRegime: water.phaseRegime,
      iceFraction01: water.iceFraction01,
      liquidFraction01: water.liquidFraction01,
      vaporFraction01: water.vaporFraction01,
      surfaceIceCoverageFraction01: water.surfaceIceCoverageFraction01,
      surfaceLiquidWaterCoverageFraction01: water.surfaceLiquidWaterCoverageFraction01,
      surfaceLiquidPersistenceModelled: water.hasPersistentSurfaceLiquidWater,
      sourceModel: 'PLANET_WATER_20_7' as const,
      interpretation: 'CURRENT_PHASE_PARTITION_NOT_HISTORICAL_MASS' as const,
    });

    const processes: PlanetaryUndatedProcess32_3[] = [
      undated('ATMOSPHERE_FORMATION', 'NOT_RESOLVED', '20.2',
        'The current source-inventory model does not date initial atmosphere formation or outgassing.'),
      undated('ATMOSPHERE_ESCAPE', gasBudgets.length > 0 ? 'MODELED_INTEGRATED_BALANCE' : 'NOT_RESOLVED',
        '20.3', 'Retained/lost mole fractions describe an integrated model balance, not a dated escape rate.'),
      undated('ATMOSPHERE_CONDENSATION', condensates.length > 0 ? 'CURRENT_STATE_ONLY' : 'NOT_RESOLVED',
        '20.4', 'Condensation is a present-state thermodynamic partition, not a dated deposition event.'),
      undated('WATER_RESERVOIR_TRANSFORMATION', 'CURRENT_STATE_ONLY', '20.7',
        'Current phase partition does not establish past liquid reservoirs or their formation dates.'),
      undated('WATER_DELIVERY_OR_LOSS', 'NOT_RESOLVED', '20.7/23.11',
        'Water index is not a mass balance; expected early impacts cannot be promoted to realized delivery.'),
    ];
    const prior = input.precedingFormation;
    if (prior && (prior.bodyKey !== bodyKey ||
          prior.chronology.bodyKey !== bodyKey ||
          prior.chronology.bodyKind !== 'PLANET' ||
          prior.chronology.multiplicity !== hostMultiplicity ||
          JSON.stringify(prior.chronology.time) !== JSON.stringify(input.time) ||
          prior.chronology.episodes.length !== prior.sourceEpisodes.length)) {
      throw new RangeError('32.3 cannot merge formation chronology from another body, architecture or CT-0 age.');
    }
    const sourceEpisodes = prior?.sourceEpisodes ?? [];
    const chronology = PlanetaryHistoryEngine.build({
      bodyKind: 'PLANET', bodyKey, multiplicity: hostMultiplicity,
      time: input.time, episodes: sourceEpisodes,
    });
    if (prior && !sameChronology(chronology, prior.chronology)) {
      throw new RangeError('32.3 preceding formation episodes disagree with their canonical 32.1 chronology.');
    }
    return Object.freeze({
      contractVersion: '32.3-CT0', layer: 'SIMULATED_REALITY', bodyKey,
      atmosphere, condensates: Object.freeze(condensates), water: waterSnapshot,
      processes: Object.freeze(processes),
      sourceEpisodes: Object.freeze([...sourceEpisodes]), chronology,
      historicalCompleteness: 'NOT_ESTABLISHED', lifePresence: 'NOT_EVALUATED',
    });
  }
}

function pushCondensate(
  dest: PlanetaryCondensateBalance32_3[], gas: AtmosphereGas,
  source: number, gaseous: number, condensed: number,
): void {
  if (!Object.values(AtmosphereGas).includes(gas) ||
      ![source, gaseous, condensed].every(x => Number.isFinite(x) && x >= 0) ||
      !approx(source, gaseous + condensed) || dest.some(x => x.gas === gas)) {
    throw new RangeError('32.3 invalid condensable species pressure-equivalent budget.');
  }
  dest.push(Object.freeze({
    gas, sourcePartialPressurePascal: source, gasPhasePartialPressurePascal: gaseous,
    condensedEquivalentPressurePascal: condensed,
    sourceModel: 'ATMOSPHERE_20_4_CONDENSATION',
  }));
}
function undated(
  process: PlanetaryUndatedProcess32_3['process'],
  evidence: PlanetaryUndatedProcess32_3['evidence'], phase: string, note: string,
): PlanetaryUndatedProcess32_3 {
  return Object.freeze({ process, temporalStatus: 'EPOCH_NOT_RESOLVED',
    evidence, sourcePhase: phase, note });
}
function bodyKeyFor(l: BodyLocator): string {
  return `G${l.galaxyIndex}/S${l.sectorKey}/O${l.galacticObjectIndex}/B${l.bodyIndex}`;
}
function sameBody(a: BodyLocator, b: BodyLocator): boolean {
  return !!a && !!b && a.galaxyIndex === b.galaxyIndex && a.sectorKey === b.sectorKey &&
    a.galacticObjectIndex === b.galacticObjectIndex && a.bodyIndex === b.bodyIndex;
}
function sameSeed(
  a: { kind: string; normalizedValue: string },
  b: { kind: string; normalizedValue: string },
): boolean {
  return !!a && !!b && a.kind === 'body' && b.kind === 'body' &&
    typeof a.normalizedValue === 'string' && a.normalizedValue === b.normalizedValue;
}
function approx(a: number, b: number): boolean {
  return Number.isFinite(a) && Number.isFinite(b) &&
    Math.abs(a - b) <= TOLERANCE * Math.max(1, Math.abs(a), Math.abs(b));
}
function approxNullable(a: number | null, b: number | null): boolean {
  return a === null || b === null ? a === b : approx(a, b);
}
function valid01(a: number): boolean { return Number.isFinite(a) && a >= 0 && a <= 1; }
function compare(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }
function sameChronology(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
