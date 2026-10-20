import type { BodyLocator } from '../../domain/generation/procedural-locator';
import { MinorBodyApproachTargetKind } from '../../domain/planetary/minor-body-approach-target-kind';
import type { MinorBodyHistoricalImpactEvent } from '../../domain/planetary/minor-body-historical-impact-event';
import type {
  PlanetaryCatastropheHistoryInput32_5,
  PlanetaryCatastropheHistoryResult32_5,
  PlanetaryResolvedImpactEffects32_5,
  PlanetaryUndatedCatastropheProcess32_5,
  PlanetaryVolcanismSnapshot32_5,
} from '../../domain/planetary-history/planetary-catastrophe-history-32-5';
import { PlanetaryHistoryEngine } from './planetary-history-engine';

const TOL = 1e-7;

/**
 * GENESIS 32.5 — read-only event/consequence reconciliation.
 *
 * Planet geology 20.8 is a present-day normalized proxy: it does NOT date or
 * realize an eruption. Point 23.10 impact effects are conditional until the
 * authoritative 23.13 history has realized an event. A realized event's already
 * frozen consequence proxies can be reported but do NOT constitute an absolute
 * radiative forcing, atmospheric mass loss, volcanic release or climate history.
 * Impact epoch mapping and the historical causal links are reserved for 32.8.
 */
export class PlanetaryCatastropheHistoryResolver32_5 {
  private constructor() {}

  static resolve(input: PlanetaryCatastropheHistoryInput32_5): PlanetaryCatastropheHistoryResult32_5 {
    if (!input?.planet || !input.geology || input.time?.kind !== 'CURRENT_SNAPSHOT') {
      throw new TypeError('32.5 requires a mature planet, frozen geology 20.8 and CT-0.');
    }
    const p = input.planet;
    const g = input.geology;
    const multiplicity = p.hostPlanetarySystem?.hostStellarSystem?.multiplicity?.name;
    if (multiplicity !== 'SINGLE' && multiplicity !== 'BINARY' && multiplicity !== 'TRIPLE') {
      throw new RangeError('32.5 requires a resolved SINGLE/BINARY/TRIPLE host.');
    }
    if (!Number.isSafeInteger(p.planetOrdinal) || p.planetOrdinal < 1 ||
        p.seed?.kind !== 'body' || p.locator?.bodyIndex !== BigInt(p.planetOrdinal - 1) ||
        g.planetOrdinal !== p.planetOrdinal || !sameLocator(g.bodyLocator, p.locator) ||
        g.bodySeed?.kind !== 'body' || g.bodySeed.normalizedValue !== p.seed.normalizedValue ||
        g.sourcePlanetType !== p.planetType ||
        !approx(g.sourceMassEarth, p.massEarth) ||
        !approx(g.sourceRadiusEarth, p.radiusEarth) ||
        !approx(g.sourceSurfaceGravityEarth, p.surfaceGravityEarth) ||
        !approx(g.sourceMetallicCoreMassFraction01, p.internalComposition.metallicCoreMassFraction01) ||
        !approx(g.sourceSilicateInteriorMassFraction01, p.internalComposition.silicateInteriorMassFraction01)) {
      throw new RangeError('32.5 geology 20.8 belongs to another planet/seed or an incompatible physical state.');
    }
    const key = bodyKey(p.locator);
    const deep = g.sourceSurfaceLiquidWaterCoverageFraction01 === null;
    const indicators = [g.volcanismIndex01, g.volatileOutgassingPotential01,
      g.surfaceRenewalPotential01, g.geologicalActivityIndex01];
    if (deep ? indicators.some(x => x !== null) : indicators.some(x => !normalized(x))) {
      throw new RangeError('32.5 cannot apply solid-surface volcanism to a deep envelope or invalid indices.');
    }
    const prev = input.precedingGlaciation;
    if (prev && (prev.bodyKey !== key || prev.chronology.bodyKey !== key ||
      prev.chronology.bodyKind !== 'PLANET' || prev.chronology.multiplicity !== multiplicity ||
      JSON.stringify(prev.chronology.time) !== JSON.stringify(input.time) ||
      !approx(prev.cryosphere.waterInventoryIndex01, g.sourceWaterInventoryIndex01) ||
      !approxNullable(prev.cryosphere.liquidSurfaceCoverageFraction01,
        g.sourceSurfaceLiquidWaterCoverageFraction01))) {
      throw new RangeError('32.5 preceding 32.4 belongs to a different world, epoch or water state.');
    }
    const episodes = prev?.sourceEpisodes ?? [];
    const chronology = PlanetaryHistoryEngine.build({
      bodyKind: 'PLANET', bodyKey: key, multiplicity, time: input.time, episodes,
    });
    if (prev && JSON.stringify(chronology) !== JSON.stringify(prev.chronology)) {
      throw new RangeError('32.5 preceding 32.4 chronology is not canonical.');
    }
    const volcanism: PlanetaryVolcanismSnapshot32_5 = Object.freeze({
      sourceModel: 'GEOLOGY_20_8', interpretation: 'CURRENT_NORMALIZED_PROXY_NOT_DATED_ERUPTION',
      regime: g.volcanismRegime, geologyRegime: g.geologyRegime,
      volcanismIndex01: g.volcanismIndex01,
      outgassingPotential01: g.volatileOutgassingPotential01,
      surfaceRenewalPotential01: g.surfaceRenewalPotential01,
      geologicalActivityIndex01: g.geologicalActivityIndex01,
      supervolcanicEpisode: 'NOT_RESOLVED', eruptedVolumeCubicKilometers: null,
      volcanicAtmosphericMassDeltaKilograms: null, volcanicRadiativeForcingWattsPerSquareMeter: null,
    });
    const processes: readonly PlanetaryUndatedCatastropheProcess32_5[] = Object.freeze([
      Object.freeze({ process: 'SUPERVOLCANIC_ERUPTION', status: 'EPOCH_AND_MAGNITUDE_NOT_RESOLVED', sourceModel: 'GEOLOGY_20_8' }),
      Object.freeze({ process: 'VOLCANIC_ATMOSPHERIC_CHANGE', status: 'EPOCH_AND_MAGNITUDE_NOT_RESOLVED', sourceModel: 'GEOLOGY_20_8' }),
      Object.freeze({ process: 'VOLCANIC_RADIATIVE_CHANGE', status: 'EPOCH_AND_MAGNITUDE_NOT_RESOLVED', sourceModel: 'GEOLOGY_20_8' }),
    ]);

    const catalogue = input.impactHistory;
    let impactCoverage: 'SOURCE_NOT_SUPPLIED' | 'SUPPLIED_EVENTS_ONLY' = 'SOURCE_NOT_SUPPLIED';
    const effects: PlanetaryResolvedImpactEffects32_5[] = [];
    if (catalogue) {
      if (catalogue.planetarySystem !== p.hostPlanetarySystem ||
          !Array.isArray(catalogue.historicalMinorBodyImpactEvents) ||
          !Array.isArray(catalogue.minorBodyRealizations)) {
        throw new RangeError('32.5 requires the authoritative 23.13 catalogue from the same planetary system.');
      }
      impactCoverage = 'SUPPLIED_EVENTS_ONLY';
      const realized = new Set(catalogue.minorBodyRealizations
        .map(x => x.event).filter((x): x is MinorBodyHistoricalImpactEvent => x !== null));
      const seenIds = new Set<string>();
      for (const event of catalogue.historicalMinorBodyImpactEvents) {
        if (!realized.has(event) || seenIds.has(event.eventId) ||
            event.targetPlanet.hostPlanetarySystem !== p.hostPlanetarySystem) {
          throw new RangeError('32.5 rejects unrealized, duplicated or foreign point-23.13 impact events.');
        }
        seenIds.add(event.eventId);
        if (event.targetKind !== MinorBodyApproachTargetKind.PLANET || event.targetPlanet !== p) continue;
        const source = event.impactEffectsAssessment;
        if (!source.impactScenarioApplicable || source.targetPlanet !== p ||
            !positive(event.kineticEnergyJoules) ||
            !normalized(source.atmosphericShockIndex01) ||
            !normalized(source.atmosphericLossPotentialIndex01) ||
            (source.hasSolidSurface !== true && source.hasSolidSurface !== false)) {
          throw new RangeError('32.5 requires exact physically resolved point-23.10 effects for every realized impact.');
        }
        const terrain = [source.hydrosphereShockIndex01, source.surfaceWaterVaporizationPotentialIndex01,
          source.geologicalShockIndex01, source.ejectaGenerationIndex01];
        if (source.hasSolidSurface === deep ||
            (deep && (source.craterDiameterKilometers !== null || terrain.some(x => x !== null))) ||
            (!deep && (!positive(source.craterDiameterKilometers) || terrain.some(x => !normalized(x))))) {
          throw new RangeError('32.5 impact consequences contradict 20.8 solid-surface/deep-envelope state.');
        }
        effects.push(Object.freeze({
          sourceModel: 'REALIZED_IMPACT_23_13_EFFECTS_23_10', sourceEventId: event.eventId,
          targetBodyKey: key, sourceMinorBodyId: event.minorBodyProceduralId,
          hasSolidSurface: source.hasSolidSurface, kineticEnergyJoules: event.kineticEnergyJoules!,
          surfaceResponseRegime: source.surfaceResponseRegime,
          craterDiameterKilometers: source.craterDiameterKilometers,
          atmosphericShockIndex01: source.atmosphericShockIndex01!,
          atmosphericLossPotentialIndex01: source.atmosphericLossPotentialIndex01!,
          hydrosphereShockIndex01: source.hydrosphereShockIndex01,
          surfaceWaterVaporizationPotentialIndex01: source.surfaceWaterVaporizationPotentialIndex01,
          geologicalShockIndex01: source.geologicalShockIndex01,
          ejectaGenerationIndex01: source.ejectaGenerationIndex01,
          radiativeEffect: 'NOT_QUANTIFIED', radiativeForcingWattsPerSquareMeter: null,
          temperatureChangeKelvin: null, atmosphericMassLossKilograms: null,
          historicalDating: 'DEFERRED_TO_32_8',
        }));
      }
      effects.sort((a, b) => compare(a.sourceEventId, b.sourceEventId));
    }
    return Object.freeze({
      contractVersion: '32.5-CT0', layer: 'SIMULATED_REALITY', bodyKey: key,
      volcanism, undatedProcesses: processes,
      realizedImpactEffects: Object.freeze(effects), impactCoverage,
      sourceEpisodes: Object.freeze([...episodes]), chronology,
      historicalCompleteness: 'NOT_ESTABLISHED', lifePresence: 'NOT_EVALUATED',
    });
  }
}
function bodyKey(l: BodyLocator): string {
  return `G${l.galaxyIndex}/S${l.sectorKey}/O${l.galacticObjectIndex}/B${l.bodyIndex}`;
}
function sameLocator(a: BodyLocator, b: BodyLocator): boolean {
  return !!a && !!b && a.galaxyIndex === b.galaxyIndex && a.sectorKey === b.sectorKey &&
    a.galacticObjectIndex === b.galacticObjectIndex && a.bodyIndex === b.bodyIndex;
}
function approx(a: number, b: number): boolean {
  return Number.isFinite(a) && Number.isFinite(b) &&
    Math.abs(a - b) <= TOL * Math.max(1, Math.abs(a), Math.abs(b));
}
function approxNullable(a: number | null, b: number | null): boolean {
  return a === null || b === null ? a === b : approx(a, b);
}
function normalized(v: number | null): boolean { return v !== null && Number.isFinite(v) && v >= 0 && v <= 1; }
function positive(v: number | null): boolean { return v !== null && Number.isFinite(v) && v > 0; }
function compare(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }
