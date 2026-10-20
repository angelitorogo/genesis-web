import type { MoonSystem } from '../../domain/planetary/moon-system';
import type { MoonEnvironmentalHistory32F5 } from '../../domain/planetary/moon-environmental-history-32-f-5';
import { MoonEnvironmentalHistoryEngine32F5 } from '../planetary/moon-environmental-history-engine-32-f-5';
import { PlanetaryV2DatedPhysics31Fi3, type MaterializedPhysicalHistory31Fi3, type MaterializedPrimary31Fi3 } from './planetary-v2-dated-physics-31-f-i-3';
import type { Atmosphere } from '../../domain/planetary/atmosphere';
import type { Planet } from '../../domain/planetary/planet';
import type { PlanetScientificResolvedTarget } from '../planetary/planet-scientific-target-resolver';
import type { HistoricalHabContext31_7 } from '../../domain/habitability/habitability-historical-windows-31-7';
import type { PlanetaryHistoryIntervalRequest32_12 } from '../../domain/planetary-history/planetary-history-interval-32-12';
import { PlanetaryClimateGeochemistryHistoryResolver32_6 } from './planetary-climate-geochemistry-history-resolver-32-6';
import { PlanetaryEnvironmentalEvolution31Fh, type DatedEnvironmentalForcing31Fh } from './planetary-environmental-evolution-31-f-h';
import { PlanetaryEnvironmentalHistoryCertification31Fg, type EnvironmentalHistoryReconstruction31Fg } from './planetary-environmental-history-certification-31-f-g';
import { PlanetaryHistoricalPhysicalForcingProducer31Fi2, type HistoricalPhysicalForcingInput31Fi2 } from './planetary-historical-physical-forcing-producer-31-f-i-2';
import { PlanetaryPaleoenvironment31Fi4, type DatedPaleoModel31Fi4, type PaleoEnvironmentalResult31Fi4 } from './planetary-paleoenvironment-31-f-i-4';
import { PlanetaryAutomaticHistoricalCoverage31Fi5, type HistoricalCoverageReport31Fi5 } from './planetary-automatic-historical-coverage-31-f-i-5';

/**
 * 31.F.i.1 — Internal production boundary for already materialized phase-19/20 data.
 *
 * This attaches a genuine 32.6 CURRENT physical state to the canonical fiche
 * projection. It never manufactures a CT-0 age, an event, a thermal anchor, a
 * forcing series, a moon history, or player-visible knowledge.
 *
 * The dated query is usable ONLY when a separate physical historian supplies
 * a provenance-identified CT-0 system age and independent interval forcings.
 * Until then the status remains unknown; attachment alone is NOT certification.
 * Records live in a WeakMap keyed by the ephemeral private resolver target.
 */
export interface DatedEpoch31Fi1 {
  readonly context: HistoricalHabContext31_7;
  readonly provenance: {
    readonly sourcePhase: string;
    readonly sourceModel: string;
    readonly sourceRecordKey: string;
    readonly temporalSupport: 'DATED_SYSTEM_AGE_CT0';
  };
}

export interface HistoricalRuntimeRequest31Fi1 {
  readonly epoch: DatedEpoch31Fi1;
  readonly query: PlanetaryHistoryIntervalRequest32_12;
  /** 31.F.i.2 independently dated, MULTI-host stellar/orbital source. */
  readonly physicalHistory?: HistoricalPhysicalForcingInput31Fi2;
  /** Legacy independent full dated forcing supplied by a trusted source. */
  /** Independently dated mass/radiation evolution, with materialized body geometry. */
  readonly paleoHistory?: DatedPaleoModel31Fi4;
  readonly forcing?: {
    readonly sourceRevision: string;
    readonly stepYears: number;
    readonly intervals: readonly DatedEnvironmentalForcing31Fh[];
  };
}

export interface MaterializedHistoricalStatus31Fi1 {
  readonly contractVersion: '31.F.i.1-v1';
  readonly currentClimate: 'MATERIALIZED_32_6' | 'SOURCE_NOT_COMPATIBLE_WITH_32_6';
  readonly datedSystemAge: 'NOT_AVAILABLE_IN_19_20_21';
  readonly environmentalHistory: 'UNKNOWN';
  readonly playerVisible: false;
}

type InternalMaterialized = Readonly<{
  planet: Planet;
  atmosphere: Atmosphere;
  moons?: MoonSystem;
  physicalBodyKey: string;
  multiplicity: 'SINGLE' | 'BINARY' | 'TRIPLE' | 'UNKNOWN';
  status: MaterializedHistoricalStatus31Fi1;
  dated?: MaterializedPhysicalHistory31Fi3;
}>;

const status = (supported: boolean): MaterializedHistoricalStatus31Fi1 => Object.freeze({
  contractVersion: '31.F.i.1-v1',
  currentClimate: supported ? 'MATERIALIZED_32_6' : 'SOURCE_NOT_COMPATIBLE_WITH_32_6',
  datedSystemAge: 'NOT_AVAILABLE_IN_19_20_21',
  environmentalHistory: 'UNKNOWN', playerVisible: false,
});

export class PlanetaryHistoricalRuntime31Fi1 {
  private static readonly materialized = new WeakMap<PlanetScientificResolvedTarget, InternalMaterialized>();
  private static readonly paleoResults = new WeakMap<PlanetScientificResolvedTarget, PaleoEnvironmentalResult31Fi4>();
  private static readonly automaticCoverage = new WeakMap<PlanetScientificResolvedTarget, HistoricalCoverageReport31Fi5>();
  private static readonly lunarEnvironmentalHistory = new WeakMap<PlanetScientificResolvedTarget, ReadonlyMap<number, MoonEnvironmentalHistory32F5>>();
  private constructor() {}

  /** Called once by the shared V1/V2 production projection, after authorization. */
  static attach(
    target: PlanetScientificResolvedTarget,
    planet: Planet,
    atmosphere: Atmosphere,
    moons?: MoonSystem,
    retainedStellarHistory?: MaterializedPrimary31Fi3,
    publicHost?: { readonly multiplicity: 'BINARY' | 'TRIPLE';
      readonly component: 'A' | 'B' | 'C' | 'AB' },
  ): void {
    if (atmosphere.hostPlanet !== planet || !planet.locator) {
      throw new RangeError('31.F.i.1 rejects mixed or unmaterialized physical states.');
    }
    const host = planet.hostPlanetarySystem?.hostStellarSystem?.multiplicity?.name;
    const supported = host === 'SINGLE' || host === 'BINARY' || host === 'TRIPLE';
    const physicalBodyKey = `G${planet.locator.galaxyIndex}/S${planet.locator.sectorKey}` +
      `/O${planet.locator.galacticObjectIndex}/B${planet.locator.bodyIndex}`;
    if (!supported) {
      // Compact/special source without canonical 32.6 host: no guessed SINGLE.
      this.materialized.set(target, Object.freeze({
        planet, atmosphere, physicalBodyKey, multiplicity: 'UNKNOWN', status: status(false),
      }));
      return;
    }
    // A nonstandard materialized host can satisfy the ordinary 26.x fiche
    // contract without providing all 32.6 source contracts. This new sidecar
    // MUST NOT break a previously valid fiche. Fail closed and keep its past
    // UNKNOWN, rather than inventing missing physical quantities.
    let compatible = false;
    try {
      const current = PlanetaryClimateGeochemistryHistoryResolver32_6.resolve({
        atmosphere, time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: null },
      });
      if (current.bodyKey !== physicalBodyKey ||
          current.snapshot.interpretation !== 'CURRENT_PHYSICAL_STATE_NOT_HISTORICAL_TREND') {
        throw new RangeError('31.F.i.1 current materialized chronology has an invalid identity.');
      }
      // Real runtime invocation of 31.F.g: no synthetic chronology or dated forcing.
      const bridge = new PlanetaryEnvironmentalHistoryCertification31Fg(current, '31Fi1-current-32.6');
      if (bridge.certification.certifiedContinuousIntervals !== 0 ||
          bridge.certification.historicalCoverage !== 'UNKNOWN') {
        throw new RangeError('31.F.i.1 current climate must never certify a historical window.');
      }
      compatible = true;
    } catch (error) {
      if (!(error instanceof RangeError) && !(error instanceof TypeError)) throw error;
    }
    // 31.F.i.3 reuses ONLY the retained phase-17/15 source already materialized
    // by the caller. A V2 adapter lacking it stays UNKNOWN, not regenerated.
    // Fail closed: a partial/compact stellar host can still display its prior fiche.
    let dated: MaterializedPhysicalHistory31Fi3 | undefined;
    if (compatible && moons && retainedStellarHistory) {
      try {
        dated = PlanetaryV2DatedPhysics31Fi3.fromMaterialized({
          planet, moons, primary: retainedStellarHistory,
        });
      } catch (error) {
        if (!(error instanceof RangeError) && !(error instanceof TypeError)) throw error;
      }
    }
    this.materialized.set(target, Object.freeze({
      planet, atmosphere, moons, physicalBodyKey, multiplicity: host, status: status(compatible), dated,
    }));
    // 32.F.5: the already-materialized V2 lunar snapshots remain CT-0 only.
    // Only the independently dated 31.F.i.3 source can supply past irradiance.
    // No event date, frozen ancient ocean, or historical tidal watts is synthesized.
    if (moons) {
      const histories = new Map<number, MoonEnvironmentalHistory32F5>();
      for (const moon of moons.relevantMoons) {
        if (!moon.oceanReality32F2c || !moon.geochemicalEnergy32F4) continue;
        const expectedKey = `${physicalBodyKey}/M${moon.moonOrdinal - 1}`;
        const world = dated?.moons.find(w => w.bodyKey === expectedKey) ?? null;
        histories.set(moon.moonOrdinal, MoonEnvironmentalHistoryEngine32F5.fromMaterialized(
          moon, world, dated ? dated.ageYearsCT0 : null,
        ));
      }
      this.lunarEnvironmentalHistory.set(target, histories);
    }
    // 31.F.i.5: automatic PRIVATE coverage of materialized planet and relevant moons.
    // Irradiance is source-backed but model-conditioned; 32.6 current atmosphere
    // never supplies historical pressure, water, radiation or thermal anchors.
    if (dated) {
      try {
        this.automaticCoverage.set(target,
          PlanetaryAutomaticHistoricalCoverage31Fi5.fromMaterialized(dated, undefined, publicHost));
      } catch (error) {
        // A new accounting layer must never break an existing scientific fiche.
        // Invalid historical provenance remains UNKNOWN, not publicly visible.
        if (!(error instanceof RangeError) && !(error instanceof TypeError)) throw error;
      }
    }
  }

  /** 32.F.5 read-only lunar historical sidecar; authorization remains in the
   * MoonScientificCardAssembler CONFIRMED guard, before any target resolution. */
  static moonEnvironmentalHistory32F5(
    target: PlanetScientificResolvedTarget, moonOrdinal: number,
  ): MoonEnvironmentalHistory32F5 | null {
    return this.lunarEnvironmentalHistory.get(target)?.get(moonOrdinal) ?? null;
  }

  /** Internal status only. Never add it to the public scientific target/card. */
  static inspect(target: PlanetScientificResolvedTarget): MaterializedHistoricalStatus31Fi1 | null {
    return this.materialized.get(target)?.status ?? null;
  }

  /** Preserve sidecar ownership across a display-only public-name clone. */
  static forwardPrivateTarget(
    privateTarget: PlanetScientificResolvedTarget,
    renamedTarget: PlanetScientificResolvedTarget,
  ): void {
    const retained = this.materialized.get(privateTarget);
    if (!retained || renamedTarget.identity.locator !== privateTarget.identity.locator) {
      throw new RangeError('31.F.i.3 cannot forward a foreign physical fiche source.');
    }
    this.materialized.set(renamedTarget, retained);
    const paleo = this.paleoResults.get(privateTarget);
    if (paleo) this.paleoResults.set(renamedTarget, paleo);
    const automatic = this.automaticCoverage.get(privateTarget);
    if (automatic) this.automaticCoverage.set(renamedTarget, automatic);
    const lunar = this.lunarEnvironmentalHistory.get(privateTarget);
    if (lunar) this.lunarEnvironmentalHistory.set(renamedTarget, lunar);
  }

  /** Internal irradiation envelopes and UNKNOWN fields only; never serialized into the public fiche. */
  static inspectPhysicalHistory(target: PlanetScientificResolvedTarget): MaterializedPhysicalHistory31Fi3 | null {
    return this.materialized.get(target)?.dated ?? null;
  }

  /** 31.F.i.5 — PRIVATE materialization-time temporal coverage for all relevant moons. */
  static inspectAutomaticHistoricalCoverage(target: PlanetScientificResolvedTarget): HistoricalCoverageReport31Fi5 | null {
    return this.automaticCoverage.get(target) ?? null;
  }

  /** Internal only: no paleo-result property is added to a scientific fiche. */
  static inspectPaleoHistory(target: PlanetScientificResolvedTarget): PaleoEnvironmentalResult31Fi4 | null {
    return this.paleoResults.get(target) ?? null;
  }

  /**
   * Evaluate a materialized relevant moon with its own dated mass/radiation source.
   * Moon data NEVER fall back to the parent's geometry or atmosphere.
   */
  static evaluateMaterializedMoonPaleo(
    target: PlanetScientificResolvedTarget, moonOrdinal: number, input: DatedPaleoModel31Fi4,
  ): PaleoEnvironmentalResult31Fi4 {
    const retained = this.materialized.get(target);
    const moon = retained?.moons?.relevantMoons.find(m => m.moonOrdinal === moonOrdinal);
    const expected = retained?.dated?.moons.find(m => m.bodyKey === input?.context?.bodyKey);
    if (!moon || !expected || !retained || input.context.bodyKind !== 'MOON' ||
        expected.bodyKey !== `${retained.physicalBodyKey}/M${moonOrdinal - 1}` ||
        input.context.multiplicity !== retained.multiplicity ||
        input.context.time.systemAgeBillionYears !== expected.source.context.time.systemAgeBillionYears) {
      throw new RangeError('31.F.i.4 lunar paleo source must belong to an independently materialized relevant moon.');
    }
    const radius = moon.physicalProperties.radiusEarth * 6_371_000;
    const gravity = moon.physicalProperties.surfaceGravityEarth * 9.80665;
    if (!geometryMatches(input.geometry, radius, gravity)) {
      throw new RangeError('31.F.i.4 refuses a foreign lunar radius/gravity.');
    }
    return PlanetaryPaleoenvironment31Fi4.produce(input);
  }

  /**
   * Reconstruct a materialized V1/V2 planet using its *actual* retained dated
   * stellar/Keplerian model. An irradiation-only record NEVER becomes a
   * temperature/pressure/water/radiation history. The query must still use the
   * exact physical CT-0 age and body identity supplied by the internal model.
   */
  static reconstructFromMaterialized(
    target: PlanetScientificResolvedTarget,
    query: PlanetaryHistoryIntervalRequest32_12,
    paleoHistory?: DatedPaleoModel31Fi4,
  ): EnvironmentalHistoryReconstruction31Fg {
    const dated = this.materialized.get(target)?.dated?.planet;
    if (!dated) throw new RangeError('31.F.i.3 no retained dated stellar/Keplerian history.');
    return this.reconstruct(target, {
      epoch: {
        context: dated.source.context,
        provenance: {
          sourcePhase: '15.3/31.F.i.3', sourceModel: 'MATERIALIZED_STELLAR_LIFETIME_CT0',
          sourceRecordKey: `${dated.bodyKey}/age`, temporalSupport: 'DATED_SYSTEM_AGE_CT0',
        },
      },
      query, physicalHistory: dated.source, paleoHistory,
    });
  }

  /**
   * Explicit on-demand internal reconstruction using a separately dated source.
   * 31.F.h is run only with physical forcing supplied by that source. This
   * method does not query user-visible fixtures or manufacture missing history.
   */
  static reconstruct(
    target: PlanetScientificResolvedTarget,
    input: HistoricalRuntimeRequest31Fi1,
  ): EnvironmentalHistoryReconstruction31Fg {
    const retained = this.materialized.get(target);
    if (!retained || retained.status.currentClimate !== 'MATERIALIZED_32_6') {
      throw new RangeError('31.F.i.1 has no compatible materialized physical source.');
    }
    const ctx = input?.epoch?.context;
    const origin = input?.epoch?.provenance;
    if (!ctx || ctx.bodyKind !== 'PLANET' || ctx.bodyKey !== retained.physicalBodyKey ||
        ctx.multiplicity !== retained.multiplicity || ctx.time?.kind !== 'CURRENT_SNAPSHOT' ||
        ctx.time.systemAgeBillionYears === null ||
        !Number.isFinite(ctx.time.systemAgeBillionYears) || ctx.time.systemAgeBillionYears < 0 ||
        !Number.isSafeInteger(Math.round(ctx.time.systemAgeBillionYears * 1e9)) ||
        origin?.temporalSupport !== 'DATED_SYSTEM_AGE_CT0' ||
        !valid(origin.sourcePhase) || !valid(origin.sourceModel) || !valid(origin.sourceRecordKey) ||
        /^(?:32\.6|20\.|CURRENT_)/i.test(origin.sourceModel) ||
        input.query?.context?.bodyKey !== ctx.bodyKey ||
        input.query.context.bodyKind !== ctx.bodyKind ||
        input.query.context.multiplicity !== ctx.multiplicity ||
        input.query.context.time?.kind !== ctx.time.kind ||
        input.query.context.time.systemAgeBillionYears !== ctx.time.systemAgeBillionYears ||
        !valid(input.query.version?.sourceRevision) || !valid(input.query.version.universeKey) ||
        !valid(input.query.version.physicsModelRevision)) {
      throw new RangeError('31.F.i.1 requires independent dated CT-0 age and matching source/version.');
    }
    const climate = PlanetaryClimateGeochemistryHistoryResolver32_6.resolve({
      atmosphere: retained.atmosphere, time: ctx.time,
    });
    if (input.forcing && input.physicalHistory) {
      throw new RangeError('31.F.i.1 refuses competing historical forcing sources.');
    }
    const derived = input.physicalHistory
      ? PlanetaryHistoricalPhysicalForcingProducer31Fi2.produce(input.physicalHistory) : null;
    if (derived && (input.physicalHistory?.context.bodyKind !== ctx.bodyKind ||
        input.physicalHistory.context.bodyKey !== ctx.bodyKey ||
        input.physicalHistory.context.multiplicity !== ctx.multiplicity ||
        input.physicalHistory.context.time.systemAgeBillionYears !== ctx.time.systemAgeBillionYears)) {
      throw new RangeError('31.F.i.2 historical source disagrees with CT-0 identity.');
    }
    let paleo: PaleoEnvironmentalResult31Fi4 | null = null;
    if (input.paleoHistory) {
      const model = input.paleoHistory;
      const p = retained.planet.physicalProperties;
      if (model.context.bodyKind !== 'PLANET' || model.context.bodyKey !== ctx.bodyKey ||
          model.context.multiplicity !== ctx.multiplicity ||
          model.context.time.systemAgeBillionYears !== ctx.time.systemAgeBillionYears ||
          !geometryMatches(model.geometry, p.radiusEarth * 6_371_000,
            p.surfaceGravityMetersPerSecondSquared)) {
        throw new RangeError('31.F.i.4 requires materialized planetary geometry and matching CT-0 provenance.');
      }
      if (!retained.planet.hasDefinedSolidSurfaceBase &&
          model.epochs.some(epoch => !!epoch.atmosphere || !!epoch.radiation)) {
        throw new RangeError('31.F.i.4 no solid surface reference for hydrostatic pressure or surface dose.');
      }
      paleo = PlanetaryPaleoenvironment31Fi4.produce(model);
    }
    // Preserve the independent 31.F.h thermal input contract. A dated pressure
    // envelope may enrich an EXISTING, independent thermal interval, but water
    // inventories/doses NEVER become a habitability verdict or thermal forcing.
    const rawForcing = input.forcing?.intervals ?? derived?.forcing;
    const fullForcing = paleo && rawForcing ? rawForcing.map(item => {
      const match = paleo!.surfacePressurePascal.find(p =>
        p.startYear <= item.startYear && p.endYear >= item.endYear);
      if (!match || item.surfacePressurePascal) return item;
      return Object.freeze({ ...item, surfacePressurePascal: match.envelope,
        surfacePressureSource: Object.freeze({sourceModel:'31.F.i.4-DATED_MASS_CONSERVATION',
          sourceRecordKey:match.sourceRecordKey,
          temporalSupport:'CONTINUOUS_DATED_PHYSICAL_PRESSURE' as const}) });
    }) : rawForcing;

    const evolution = fullForcing && fullForcing.length > 0 ? new PlanetaryEnvironmentalEvolution31Fh({
      context: ctx, sourceRevision: input.forcing?.sourceRevision ?? derived!.sourceRevision,
      stepYears: input.forcing?.stepYears ?? 100, forcing: fullForcing,
    }) : null;
    const bridge = new PlanetaryEnvironmentalHistoryCertification31Fg(
      climate, input.query.version.sourceRevision, evolution,
    );
    const result = bridge.reconstruct(input.query);
    // A bounded thermal history alone does not certify reservoir/radiation/life.
    if (result.certification.certifiedContinuousIntervals !== 0 ||
        result.certification.lifePresence !== 'NOT_EVALUATED') {
      throw new RangeError('31.F.i.1 never certifies a complete historical environment.');
    }
    if (paleo) {
      this.paleoResults.set(target, paleo);
      if (retained.dated) this.automaticCoverage.set(target,
        PlanetaryAutomaticHistoricalCoverage31Fi5.fromMaterialized(retained.dated, paleo));
    }
    return result;
  }
}

function geometryMatches(actual: {readonly radiusMeters:number;readonly gravityMetersPerSecondSquared:number},
  radius:number,gravity:number): boolean {
  return Number.isFinite(radius) && radius > 0 && Number.isFinite(gravity) && gravity > 0 &&
    Number.isFinite(actual?.radiusMeters) && Number.isFinite(actual?.gravityMetersPerSecondSquared) &&
    Math.abs(actual.radiusMeters - radius) <= Math.max(1e-5, radius * 1e-8) &&
    Math.abs(actual.gravityMetersPerSecondSquared - gravity) <= Math.max(1e-8, gravity * 1e-8);
}

function valid(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.trim() === value && !value.includes('\0');
}
