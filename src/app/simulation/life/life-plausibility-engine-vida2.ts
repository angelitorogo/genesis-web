/** VIDA.2 — regla lúdica de plausibilidad, no un diagnóstico de vida ni habitabilidad científica. */
export type Vida2Route = 'SURFACE' | 'SUBSURFACE';
export type Vida2Verdict = 'PLAUSIBLE' | 'NOT_PLAUSIBLE' | 'INDETERMINATE';
export type Vida2Support = 'FAVORABLE' | 'MARGINAL' | 'UNFAVORABLE' | 'UNKNOWN';
export type Vida2Water = 'PRESENT' | 'POTENTIAL' | 'ABSENT' | 'UNKNOWN';
export type Vida2FactorName = 'water' | 'temperature' | 'protection' | 'energy';

/** All values are immutable projections of existing physical data; no generator is called here. */
export interface Vida2PhysicalRoute {
  readonly route: Vida2Route;
  readonly water: Vida2Water;
  readonly temperatureKelvin: number | null;
  /** Interior temperature is not inferred from the surface temperature. */
  readonly interiorLiquidModeled: boolean;
  readonly interiorPotential: boolean;
  /** Independent physical pressure where supported; not a legacy index. */
  readonly pressurePascal: number | null;
  readonly hasIceOrRockCover: boolean | null;
  readonly coverPotential: boolean;
  readonly stellarInsolationEarth: number | null;
  readonly internalHeatFluxWattsPerSquareMeter: number | null;
  readonly internalEnergyPotential: boolean | null;
  readonly solidSurface: boolean | null;
  /** Lunar surface: favorable gas retention is a conditional shield, NOT pressure in Pa. */
  readonly surfaceProtectionPotential?: boolean;
  /** Planetary porewater/aquifer niche: inferred from existing water and rock evidence. */
  readonly interiorRockAquiferPotential?: boolean;
  /** Distinct quantified geological activity / heat retention indices; NOT a measured W/m². */
  readonly interiorGeothermalEvidence?: boolean;
  /** Sheltered shallow seepages are microbial-only, not open-air animal habitat. */
  readonly surfaceMicrohabitatKind?: 'OPEN_SURFACE' | 'PROTECTED_SEEP';
  readonly provenance: string;
}

export interface Vida2RouteAssessment {
  readonly route: Vida2Route;
  readonly classification: Vida2Verdict;
  /** null when a required factor is unknown. Not a probability of life. */
  readonly score: number | null;
  readonly factors: Readonly<Record<Vida2FactorName, Vida2Support>>;
  readonly explanation: string;
  readonly surfaceMicrohabitatKind?: 'OPEN_SURFACE' | 'PROTECTED_SEEP';
  readonly provenance: string;
}

export interface Vida2WorldAssessment {
  readonly contract: 'VIDA.2/plausibility/v2';
  readonly classification: Vida2Verdict;
  readonly selectedRoute: Vida2Route | null;
  readonly routes: readonly Vida2RouteAssessment[];
  /** Does NOT imply any life or biosphere exists. */
  readonly lifeGenerated: false;
}

const WEIGHTS: Readonly<Record<Vida2FactorName, number>> = Object.freeze({
  water: 35, temperature: 25, protection: 20, energy: 20,
});
const FACTORS: readonly Vida2FactorName[] = ['water', 'temperature', 'protection', 'energy'];
const POINTS: Readonly<Record<Exclude<Vida2Support, 'UNKNOWN'>, number>> = {
  FAVORABLE: 1, MARGINAL: 0.65, UNFAVORABLE: 0,
};
const known = (v: number | null): v is number => v !== null && Number.isFinite(v);
const waterSupport = (water: Vida2Water): Vida2Support => ({
  PRESENT: 'FAVORABLE', POTENTIAL: 'MARGINAL', ABSENT: 'UNFAVORABLE', UNKNOWN: 'UNKNOWN',
} as const)[water];

function surfaceTemperature(kelvin: number | null): Vida2Support {
  if (!known(kelvin)) return 'UNKNOWN';
  if (kelvin >= 260 && kelvin <= 335) return 'FAVORABLE';
  if (kelvin >= 240 && kelvin <= 360) return 'MARGINAL';
  return 'UNFAVORABLE';
}
function surfaceProtection(pressure: number | null, potential = false): Vida2Support {
  // Never convert lunar retention indices or pressure scenarios to physical Pa.
  if (!known(pressure)) return potential ? 'MARGINAL' : 'UNKNOWN';
  if (pressure >= 10_000 && pressure <= 10_000_000) return 'FAVORABLE';
  if (pressure >= 611 && pressure <= 30_000_000) return 'MARGINAL';
  return 'UNFAVORABLE';
}
function surfaceEnergy(stellar: number | null, heat: number | null): Vida2Support {
  if (known(stellar) && stellar >= 0.02 && stellar <= 20) return 'FAVORABLE';
  if (known(stellar) && stellar > 0 && stellar <= 60) return 'MARGINAL';
  if (known(heat) && heat >= 0.001) return 'MARGINAL';
  return known(stellar) && known(heat) && stellar <= 0 && heat <= 0
    ? 'UNFAVORABLE' : 'UNKNOWN';
}
function interiorEnergy(input: Vida2PhysicalRoute): Vida2Support {
  const flux = input.internalHeatFluxWattsPerSquareMeter;
  if (known(flux) && flux >= 0.001) return 'FAVORABLE';
  if (known(flux) && flux >= 0.00001) return 'MARGINAL';
  if (input.internalEnergyPotential === true) return 'MARGINAL';
  if (input.internalEnergyPotential === false && (flux === null || flux <= 0)) return 'UNFAVORABLE';
  return 'UNKNOWN';
}

export class LifePlausibilityEngineVIDA2 {
  private constructor() {}

  static route(input: Vida2PhysicalRoute): Vida2RouteAssessment {
    const factors: Record<Vida2FactorName, Vida2Support> = {
      water: waterSupport(input.water),
      temperature: input.route === 'SURFACE'
        ? surfaceTemperature(input.temperatureKelvin)
        : input.interiorLiquidModeled ? 'FAVORABLE' : input.interiorPotential ? 'MARGINAL' : 'UNKNOWN',
      protection: input.route === 'SURFACE'
        ? input.solidSurface === false ? 'UNFAVORABLE'
          : surfaceProtection(input.pressurePascal, input.surfaceProtectionPotential === true)
        : input.hasIceOrRockCover === true ? 'FAVORABLE'
          : input.hasIceOrRockCover === false ? 'UNFAVORABLE' : input.coverPotential ? 'MARGINAL' : 'UNKNOWN',
      energy: input.route === 'SURFACE'
        ? surfaceEnergy(input.stellarInsolationEarth, input.internalHeatFluxWattsPerSquareMeter)
        : input.interiorRockAquiferPotential === true && input.interiorGeothermalEvidence === true
          && input.internalEnergyPotential !== false
          ? 'MARGINAL' : interiorEnergy(input),
    };
    const values = Object.values(factors);
    const missing = values.includes('UNKNOWN');
    // VIDA.2/v2: four merely conditional subsurface factors must NOT certify a candidate.
    // A modeled liquid reservoir is independent positive water evidence. Otherwise a
    // conditional reservoir needs both an actual modeled heat flux (FAVORABLE) and
    // no explicit negative geological/tidal activity indication. No surface value is
    // promoted to an interior ocean, and a missing fact remains UNKNOWN.
    const rockAquifer = input.route === 'SUBSURFACE'
      && input.water === 'POTENTIAL' && input.interiorPotential
      && input.interiorRockAquiferPotential === true
      && input.interiorGeothermalEvidence === true
      && input.hasIceOrRockCover === true
      && input.internalEnergyPotential === true;
    const interiorEvidence = input.route !== 'SUBSURFACE'
      || (input.water === 'PRESENT' && input.interiorLiquidModeled)
      || (input.water === 'POTENTIAL' && input.interiorPotential
        && factors.energy === 'FAVORABLE' && input.internalEnergyPotential !== false)
      || rockAquifer;
    const insufficientInteriorEvidence = input.route === 'SUBSURFACE' && !interiorEvidence;
    const score = missing || insufficientInteriorEvidence ? null : Math.round(FACTORS.reduce(
      (sum, f) => sum + WEIGHTS[f] * POINTS[factors[f] as Exclude<Vida2Support, 'UNKNOWN'>], 0,
    ));
    // Explicitly adverse physical factors still rule out a route; lack of a positive
    // interior-water/heat indication does not prove sterility.
    const decisiveFailure = factors.water === 'UNFAVORABLE' || factors.temperature === 'UNFAVORABLE'
      || factors.protection === 'UNFAVORABLE' || factors.energy === 'UNFAVORABLE';
    const classification: Vida2Verdict = decisiveFailure ? 'NOT_PLAUSIBLE'
      : missing || insufficientInteriorEvidence ? 'INDETERMINATE'
        : score !== null && score >= 60 ? 'PLAUSIBLE' : 'NOT_PLAUSIBLE';
    const explanation = insufficientInteriorEvidence && !decisiveFailure
      ? 'Subsuelo no acreditado: se requiere líquido interior modelado, agua con flujo térmico físico o acuífero agua-roca con calor geológico suficiente; los factores solo condicionales no bastan.'
      : classification === 'PLAUSIBLE'
        ? 'Condiciones compatibles según los cuatro criterios simplificados.'
        : classification === 'INDETERMINATE'
          ? 'Faltan datos suficientes para evaluar esta ruta; desconocido no significa ausente.'
          : 'Esta ruta no supera los criterios simplificados disponibles; no descarta toda forma de vida.';
    return Object.freeze({
      route: input.route, classification, score, factors: Object.freeze(factors),
      explanation, surfaceMicrohabitatKind: input.route === 'SURFACE'
        ? input.surfaceMicrohabitatKind ?? 'OPEN_SURFACE' : undefined,
      provenance: input.provenance,
    });
  }

  static evaluate(surface: Vida2PhysicalRoute, subsurface: Vida2PhysicalRoute): Vida2WorldAssessment {
    if (surface.route !== 'SURFACE' || subsurface.route !== 'SUBSURFACE') {
      throw new Error('VIDA.2 requires separate SURFACE and SUBSURFACE inputs.');
    }
    const routes = Object.freeze([this.route(surface), this.route(subsurface)]);
    const preferred = routes.find(r => r.classification === 'PLAUSIBLE')
      ?? routes.find(r => r.classification === 'INDETERMINATE') ?? null;
    return Object.freeze({
      contract: 'VIDA.2/plausibility/v2' as const,
      classification: preferred?.classification ?? 'NOT_PLAUSIBLE',
      selectedRoute: preferred?.route ?? null,
      routes,
      lifeGenerated: false as const,
    });
  }

  static audit(items: readonly Readonly<{kind: 'PLANET' | 'MOON'; assessment: Vida2WorldAssessment}>[]) {
    const count = (kind: 'PLANET' | 'MOON', classification: Vida2Verdict) => items.filter(
      item => item.kind === kind && item.assessment.classification === classification,
    ).length;
    return Object.freeze((['PLANET', 'MOON'] as const).map(kind => Object.freeze({
      kind, total: items.filter(item => item.kind === kind).length,
      plausible: count(kind, 'PLAUSIBLE'),
      notPlausible: count(kind, 'NOT_PLAUSIBLE'),
      indeterminate: count(kind, 'INDETERMINATE'),
      surfacePlausible: items.filter(item => item.kind === kind &&
        item.assessment.routes[0].classification === 'PLAUSIBLE').length,
      subsurfacePlausible: items.filter(item => item.kind === kind &&
        item.assessment.routes[1].classification === 'PLAUSIBLE').length,
    })));
  }
}
