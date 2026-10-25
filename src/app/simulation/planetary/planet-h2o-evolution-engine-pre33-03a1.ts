import type { Planet } from '../../domain/planetary/planet';
import type { Atmosphere } from '../../domain/planetary/atmosphere';
import type { PlanetaryVolatilesHistoryResult32_3 } from '../../domain/planetary-history/planetary-volatiles-history-32-3';
import { PlanetWaterReservoirProjectionPRE3303 } from './planet-water-reservoir-projection-pre33-03';
import type { PlanetH2OFormationContractPRE3303A } from '../../domain/planetary/planet-h2o-formation-contract-pre33-03a';
import {
  H2O_POOLS_PRE3303A1, PLANET_H2O_EVOLUTION_PRE3303A1,
  type H2ODatedHistoryPRE3303A1, type H2ODatedSegmentPRE3303A1,
  type H2ODatedTransferPRE3303A1, type H2OPoolPRE3303A1,
  type H2OEvolutionResultPRE3303A1, validatePlanetH2OEvolutionPRE3303A1,
} from '../../domain/planetary/planet-h2o-evolution-contract-pre33-03a1';

const EARTH_MASS_KG = 5.9722e24;
const EARTH_RADIUS_METERS = 6_371_000;
const G = 6.67430e-11;
const YEAR_SECONDS = 365.25 * 86400;
const TRIPLE_K = 273.16;
const TRIPLE_PA = 611.657;
const MAX_RECONSTRUCTED_SURFACE_PA = 1e6;
const MAX_RECONSTRUCTED_SURFACE_K = 647.096;

type Pools = Record<H2OPoolPRE3303A1, number>;
type Thermal = 'LIQUID_PERMITTED' | 'LIQUID_DISFAVORED' | 'UNRESOLVED';

function valid(x: number): boolean { return Number.isFinite(x) && x >= 0; }
function assertValid(x: number, name: string): void {
  if (!valid(x)) throw new RangeError(`PRE-33.03a.1 invalid ${name}`);
}
function errorIf(condition: boolean, code: string): void { if (condition) throw new RangeError(`PRE-33.03a.1 ${code}`); }
function summation(items: readonly number[]): number { return items.reduce((n, x) => n + x, 0); }
function key(planet: Planet): string {
  const l = planet.locator;
  return `G${l.galaxyIndex}/S${l.sectorKey}/O${l.galacticObjectIndex}/B${l.bodyIndex}`;
}
function finiteKey(s: string): boolean { return typeof s === 'string' && s.length > 0 && s.trim() === s; }
function thermalState(segment: H2ODatedSegmentPRE3303A1): Thermal {
  const t = segment.surfaceTemperatureKelvin, p = segment.surfacePressurePascal;
  if (t === null || p === null || !Number.isFinite(t) || !Number.isFinite(p) || t <= 0 || p < 0 ||
      p > MAX_RECONSTRUCTED_SURFACE_PA || t > MAX_RECONSTRUCTED_SURFACE_K) return 'UNRESOLVED';
  if (p < TRIPLE_PA || t < TRIPLE_K) return 'LIQUID_DISFAVORED';
  // Valid only within the same bounded, simplified 20.x Clausius–Clapeyron domain.
  const inv = 1/373.15 - (8.314462618/40650)*Math.log(p/101325);
  return inv > 0 && t <= 1/inv ? 'LIQUID_PERMITTED' : 'LIQUID_DISFAVORED';
}
function applyTransfer(pools: Pools, t: H2ODatedTransferPRE3303A1, segment: H2ODatedSegmentPRE3303A1,
  deep: boolean, total: number): number {
  errorIf(!finiteKey(t.sourceRecordKey), 'MISSING_TRANSFER_PROVENANCE');
  assertValid(t.massKilograms, 'dated transfer kg');
  errorIf(!H2O_POOLS_PRE3303A1.includes(t.to), 'INVALID_DESTINATION');
  errorIf(t.from !== 'EXTERNAL' && !H2O_POOLS_PRE3303A1.includes(t.from), 'INVALID_SOURCE_POOL');
  const pairs: Record<string, readonly [string, string]> = {
    OUTGASS: ['INTERIOR_UNSPECIFIED', 'ATMOSPHERIC_VAPOR'],
    CONDENSE_ICE: ['ATMOSPHERIC_VAPOR', 'SURFACE_ICE'],
    CONDENSE_LIQUID: ['ATMOSPHERIC_VAPOR', 'SURFACE_LIQUID'],
    FREEZE: ['SURFACE_LIQUID', 'SURFACE_ICE'],
    MELT: ['SURFACE_ICE', 'SURFACE_LIQUID'],
    SUBDUCT: ['SURFACE_LIQUID', 'INTERIOR_UNSPECIFIED'],
    EXHUME: ['INTERIOR_UNSPECIFIED', 'SURFACE_LIQUID'],
    HYDRATE: ['INTERIOR_UNSPECIFIED', 'MINERAL_BOUND'],
    DEHYDRATE: ['MINERAL_BOUND', 'INTERIOR_UNSPECIFIED'],
    INTERIOR_TRANSPORT: ['ICE_UNLOCATED', 'INTERIOR_UNSPECIFIED'],
    EXTERNAL_DELIVERY: ['EXTERNAL', 'ICE_UNLOCATED'],
  };
  const accepted = pairs[t.process];
  errorIf(!accepted || t.from !== accepted[0] || t.to !== accepted[1], 'INVALID_PHYSICAL_TRANSFER_PAIR');
  if (deep) errorIf(['SURFACE_LIQUID', 'SURFACE_ICE'].includes(t.to) ||
    t.from === 'SURFACE_LIQUID' || t.from === 'SURFACE_ICE', 'DEEP_ENVELOPE_HAS_NO_SOLID_SURFACE');
  const thermo = thermalState(segment);
  if (t.to === 'SURFACE_LIQUID') errorIf(thermo !== 'LIQUID_PERMITTED', 'SURFACE_LIQUID_NOT_THERMODYNAMICALLY_SUPPORTED');
  if (t.process === 'FREEZE' || t.process === 'CONDENSE_ICE') {
    errorIf(segment.surfaceTemperatureKelvin === null ||
      !Number.isFinite(segment.surfaceTemperatureKelvin) ||
      segment.surfaceTemperatureKelvin > TRIPLE_K, 'SURFACE_ICE_FREEZING_UNSUPPORTED');
  }
  if (t.from === 'EXTERNAL') {
    errorIf(!Number.isFinite(total + t.massKilograms), 'DELIVERY_OVERFLOW');
    pools[t.to] += t.massKilograms;
    return t.massKilograms;
  }
  const tolerance = 1e-12 * Math.max(1, total);
  errorIf(t.massKilograms - pools[t.from] > tolerance, 'TRANSFER_EXCEEDS_AVAILABLE_H2O');
  pools[t.from] = Math.max(0, pools[t.from] - t.massKilograms);
  pools[t.to] += t.massKilograms;
  return 0;
}
function applyXuv(pools: Pools, segment: H2ODatedSegmentPRE3303A1,
  massKg: number, planetRadiusMeters: number): { potential: number; actual: number } {
  const x = segment.xuvEscape;
  if (x === null) return { potential:0, actual:0 };
  errorIf(!finiteKey(x.sourceRecordKey), 'MISSING_XUV_PROVENANCE');
  for (const [name, value] of Object.entries(x)) {
    if (name === 'sourceRecordKey') continue;
    assertValid(value as number, name);
  }
  errorIf(x.heatingEfficiency01 > 1 || x.escapingH2OMassFraction01 > 1 ||
    x.rocheFactor01 === 0 || x.rocheFactor01 > 1 ||
    x.absorptionRadiusMeters < planetRadiusMeters ||
    x.absorptionRadiusMeters > 3 * planetRadiusMeters,
    'XUV_PARAMETERS_OUTSIDE_PHYSICAL_DOMAIN');
  // Energy-limited hydrogen/atmospheric escape is a bound, not proof of molecular
  // H2O escape. The explicit species mass fraction is required independently.
  const duration = (segment.endYear - segment.startYear) * YEAR_SECONDS;
  const potential = x.heatingEfficiency01 * Math.PI * x.absorptionRadiusMeters ** 3 *
    x.incidentXuvWattsPerSquareMeter * duration /
    (G * massKg * x.rocheFactor01) * x.escapingH2OMassFraction01;
  assertValid(potential, 'integrated XUV water escape bound');
  const actual = Math.min(potential, pools.ATMOSPHERIC_VAPOR);
  pools.ATMOSPHERIC_VAPOR -= actual;
  return { potential, actual };
}

/**
 * Performs a conditional chronological H2O mass integration, only when an
 * independent DATED, species-resolved forcing history covers [formation,CT-0].
 * Optical irradiation and 20.3 retained mole fractions CANNOT supply this.
 * With missing forcing, no CT-0 water mass is asserted, even if the star is old.
 * Never mutates the real phase-19/20 planet, history or persisted player state.
 */
export class PlanetH2OEvolutionEnginePRE3303A1 {
  private constructor() {}
  static project(planet: Planet, atmosphere: Atmosphere,
    formation: PlanetH2OFormationContractPRE3303A, history?: H2ODatedHistoryPRE3303A1,
    volatile32?: PlanetaryVolatilesHistoryResult32_3): H2OEvolutionResultPRE3303A1 {
    const bodyKey = key(planet);
    errorIf(bodyKey !== formation.bodyKey || formation.lifeEvaluated ||
      formation.physicalCT0WaterConserved ||
      formation.epoch !== 'CT0_CARRIER_ENDMEMBER_SCENARIO', 'FOREIGN_OR_PROMOTED_FORMATION');
    // 32.3 source is undated by design: it may confirm identity and current
    // atmospheric handoffs but CANNOT be turned into water kg or a new episode.
    if (volatile32) errorIf(volatile32.contractVersion !== '32.3-CT0' ||
      volatile32.bodyKey !== bodyKey || volatile32.chronology.bodyKey !== bodyKey ||
      volatile32.historicalCompleteness !== 'NOT_ESTABLISHED',
      'PHASE32_VOLATILE_IDENTITY_OR_PROVENANCE_MISMATCH');
    const f = formation.formation;
    const start = f.modeledFormationH2OKilograms;
    assertValid(start, 'conditional source H2O');
    const domain = PlanetWaterReservoirProjectionPRE3303.planet(planet, atmosphere).surfaceDomain;
    const noSurface = domain === 'DEEP_ENVELOPE_NO_SOLID_SURFACE';
    const originalReservoirs = Object.fromEntries(H2O_POOLS_PRE3303A1.map(k=>[k,null])) as
      Record<H2OPoolPRE3303A1, null>;
    const basic = {
      contractVersion: PLANET_H2O_EVOLUTION_PRE3303A1,
      perspective: 'INTERNAL_SIMULATED_REALITY' as const, bodyKey, epoch: 'CT0' as const,
      formationHypothesis: 'CT0_CARRIER_CHEMISTRY_BACKPROJECTION_NOT_FORMATION_OBSERVATION' as const,
      sourceH2OKilograms: start, observedEvidenceGranted: false as const,
      ct0PhysicalInventoryCertified: false as const, lifeEvaluated: false as const,
    };
    if (!history) {
      const unresolved: H2OEvolutionResultPRE3303A1 = Object.freeze({
        ...basic, state:'UNRESOLVED_NO_DATED_H2O_FORCING', datedHistorySource:null,
        chronology:{ageYearsCT0:null,coveredYears:null},
        massBalance:{inputH2OKilograms:start, externalDeliveryKilograms:null,
          escapedH2OKilograms:null,retainedCT0Kilograms:null,relativeResidual01:null,
          conditionalConservationVerified:false},
        reservoirs:Object.freeze(originalReservoirs),
        xuv:{potentialEscapedH2OKilograms:null,supplyLimitedEscapedH2OKilograms:null},
        surfaceLiquidPhaseSupported:null,
      });
      return Object.freeze(unresolved);
    }
    errorIf(history.bodyKey !== bodyKey || history.provenance !== 'DATED_PHYSICAL_H2O_MODEL' ||
      !finiteKey(history.sourceRecordKey), 'FOREIGN_OR_UNGROUNDED_CHRONOLOGY');
    errorIf(!Number.isSafeInteger(history.ageYearsCT0) || history.ageYearsCT0 < 1 ||
      history.ageYearsCT0 > 20_000_000_000 || history.segments.length < 1 ||
      history.segments.length > 512, 'INVALID_DATED_TIME_DOMAIN');
    if (history.phase32Chronology) errorIf(
      history.phase32Chronology.bodyKey !== bodyKey ||
      history.phase32Chronology.ageYearsCT0 !== history.ageYearsCT0,
      'PHASE32_TEMPORAL_IDENTITY_MISMATCH');
    if (history.materializedPhase32) {
      const p32=history.materializedPhase32;
      errorIf(p32.contractVersion !== '31.F.i.3-v1' ||
        p32.ageYearsCT0 !== history.ageYearsCT0 || p32.planet.bodyKey !== bodyKey ||
        p32.planet.waterHistory !== 'UNKNOWN', 'PHASE32_MATERIALIZED_HISTORY_MISMATCH');
    }
    // Fase 32 timeline must terminate at the SAME frozen CT-0 snapshot.
    // A proposed independently dated scenario may not rewrite present climate,
    // atmospheric pressure, or invent a solid surface on a deep envelope.
    const endpoint = history.segments[history.segments.length - 1];
    const actualT = atmosphere.climateState.meanSurfaceTemperatureKelvin;
    const actualP = atmosphere.waterInventory.sourceRetainedSurfacePressurePascal;
    const match = (a: number | null, b: number | null): boolean =>
      a === null || b === null ? a === b :
        Number.isFinite(a) && Number.isFinite(b) &&
        Math.abs(a-b) <= 1e-7*Math.max(1,Math.abs(a),Math.abs(b));
    errorIf(!match(endpoint.surfaceTemperatureKelvin, actualT) ||
      !match(endpoint.surfacePressurePascal, actualP), 'CT0_ENDPOINT_CONTRADICTS_FROZEN_20X');
    const pools = Object.fromEntries(H2O_POOLS_PRE3303A1.map(k=>[k,0])) as Pools;
    if (noSurface) {
      pools.DEEP_ENVELOPE_UNRESOLVED = f.iceCarrierH2OKilograms + f.volatileCarrierH2OKilograms;
    } else {
      pools.ICE_UNLOCATED = f.iceCarrierH2OKilograms;
      pools.INTERIOR_UNSPECIFIED = f.volatileCarrierH2OKilograms;
    }
    pools.MINERAL_BOUND = f.silicateBoundH2OKilograms;
    let time=0, delivered=0, escaped=0, potential=0, supplyLimited=0;
    const seen = new Set<string>([history.sourceRecordKey]);
    let lastThermal: Thermal = 'UNRESOLVED';
    for (const segment of history.segments) {
      errorIf(!Number.isSafeInteger(segment.startYear) || !Number.isSafeInteger(segment.endYear) ||
        segment.startYear !== time || segment.endYear <= time ||
        segment.endYear > history.ageYearsCT0 || !finiteKey(segment.sourceRecordKey) ||
        seen.has(segment.sourceRecordKey), 'GAP_OVERLAP_OR_DUPLICATE_HISTORY');
      seen.add(segment.sourceRecordKey);
      if (segment.surfaceTemperatureKelvin !== null)
        errorIf(!Number.isFinite(segment.surfaceTemperatureKelvin) ||
          segment.surfaceTemperatureKelvin <= 0, 'INVALID_THERMAL_TEMPERATURE');
      if (segment.surfacePressurePascal !== null)
        errorIf(!valid(segment.surfacePressurePascal), 'INVALID_THERMAL_PRESSURE');
      lastThermal=thermalState(segment);
      for (const transfer of segment.transfers) {
        errorIf(seen.has(transfer.sourceRecordKey), 'DUPLICATE_TRANSFER_PROVENANCE');
        seen.add(transfer.sourceRecordKey);
        delivered += applyTransfer(pools, transfer, segment, noSurface, start + delivered);
      }
      if (segment.xuvEscape) {
        errorIf(seen.has(segment.xuvEscape.sourceRecordKey), 'DUPLICATE_XUV_PROVENANCE');
        seen.add(segment.xuvEscape.sourceRecordKey);
      }
      const effect=applyXuv(pools,segment,
        planet.physicalProperties.massEarth * EARTH_MASS_KG,
        planet.physicalProperties.radiusEarth * EARTH_RADIUS_METERS);
      escaped += effect.actual;
      potential += effect.potential;
      supplyLimited += effect.potential-effect.actual;
      if (pools.SURFACE_LIQUID > 0 && lastThermal !== 'LIQUID_PERMITTED')
        throw new RangeError('PRE-33.03a.1 UNRESOLVED_SURFACE_LIQUID_AFTER_THERMAL_CHANGE');
      time=segment.endYear;
    }
    errorIf(time !== history.ageYearsCT0, 'INCOMPLETE_DATED_HISTORY');
    for (const v of Object.values(pools)) assertValid(v, 'CT0 reservoir');
    const retained=summation(Object.values(pools));
    const available=start+delivered, diff=Math.abs(available-(retained+escaped));
    const relative=diff/Math.max(1,available);
    errorIf(!valid(available) || !valid(retained) || !valid(escaped) || relative>1e-10,
      'EVOLUTION_WATER_MASS_BALANCE_FAILED');
    const result: H2OEvolutionResultPRE3303A1 = Object.freeze({
      ...basic, state:'CONDITIONAL_EVOLUTION_COMPLETED', datedHistorySource:history.sourceRecordKey,
      chronology:{ageYearsCT0:history.ageYearsCT0,coveredYears:time},
      massBalance:Object.freeze({inputH2OKilograms:start,externalDeliveryKilograms:delivered,
        escapedH2OKilograms:escaped,retainedCT0Kilograms:retained,
        relativeResidual01:relative,conditionalConservationVerified:true}),
      reservoirs:Object.freeze({...pools}),
      xuv:Object.freeze({potentialEscapedH2OKilograms:potential,
        supplyLimitedEscapedH2OKilograms:supplyLimited}),
      surfaceLiquidPhaseSupported:noSurface?null:lastThermal==='LIQUID_PERMITTED'?true:
        lastThermal==='LIQUID_DISFAVORED'?false:null,
    });
    const issues=validatePlanetH2OEvolutionPRE3303A1(result);
    if(issues.length)throw new RangeError(`PRE-33.03a.1 ${issues.join(',')}`);
    return result;
  }
}
