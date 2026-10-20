import { DiscoveryState, type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import type { HabitabilityConstraint, HabitabilityEvidence, HabitabilityMultiplicity, HabitabilityRoute, HabitabilityScenarioAssessment } from '../../domain/habitability/habitability-scenario';
import type { HabitabilityObservedAssessment31_12 } from '../../domain/habitability/habitability-knowledge-31-12';
import type { PlanetScientificResolvedTarget } from '../../simulation/planetary/planet-scientific-target-resolver';
import type { MoonScientificResolvedTarget } from '../../simulation/planetary/moon-scientific-target-resolver';
import {
  HabitabilityEnvironmentResolver31_2,
  type HabitabilityEnvironmentContext31_2,
} from '../../simulation/habitability/habitability-environment-resolver-31-2';
import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import { HabitabilityKnowledgeResolver31_12 } from '../../simulation/habitability/habitability-knowledge-resolver-31-12';
import { HabitabilityMoonIntegration32F6b } from '../../simulation/habitability/habitability-moon-integration-32-f-6b';

export interface ObservedHabitabilityCriterion31Fe {
  readonly label: string;
  readonly status: 'Compatible' | 'Incompatible' | 'Desconocido';
  readonly origin: 'Modelo físico' | 'Inferencia del modelo' | 'Observación directa' | 'Sin evidencia';
  /** Explanation of the evidence limit; never an additional physical finding. */
  readonly explanation?: string;
}

export interface ObservedHabitabilityFact31Fe {
  readonly label: string;
  readonly value: string;
  readonly origin: 'Modelo físico CT-0' | 'Inferencia condicional CT-0';
}

export interface ObservedHabitabilityRoute31Fe {
  readonly label: string;
  readonly status: string;
  readonly evidence: string;
  readonly criteria: readonly ObservedHabitabilityCriterion31Fe[];
  /** Only fields already visible in this SAME authorized scientific fiche. */
  readonly facts: readonly ObservedHabitabilityFact31Fe[];
}

/** Public presentation projection only. Neither evidence source keys nor internal reports survive. */
export interface ObservedHabitabilityFiche31Fe {
  readonly title: 'Compatibilidad ambiental · conocimiento observado';
  readonly routes: readonly ObservedHabitabilityRoute31Fe[];
  readonly note: 'Evaluación del estado actual (CT-0), no de continuidad histórica ni detección de vida.';
}

const CURRENT = Object.freeze({ kind: 'CURRENT_SNAPSHOT' as const, systemAgeBillionYears: null });
const NOTE = 'Evaluación del estado actual (CT-0), no de continuidad histórica ni detección de vida.' as const;
const CRITERION_LABELS: Readonly<Record<HabitabilityConstraint, string>> = Object.freeze({
  TEMPERATURE: 'Temperatura',
  LIQUID_RESERVOIR: 'Reservorio líquido',
  PRESSURE_OR_CONFINEMENT: 'Presión o confinamiento',
  CHEMICAL_FEASIBILITY: 'Viabilidad química',
  ENERGY_GRADIENT: 'Gradiente energético',
  RADIATION_EXPOSURE: 'Exposición radiativa',
  DYNAMICAL_STABILITY: 'Estabilidad dinámica',
  GRAVITY_AND_RETENTION: 'Gravedad y retención',
  RESERVOIR_GEOMETRY: 'Geometría del reservorio',
});
/** Reasons deliberately refer to what is missing, not generic habitability limits.
 * Surface-radiation/gravity indices and lunar potential indices are NOT
 * organism-specific biological thresholds or measured doses.
 */
const UNKNOWN_REASONS: Readonly<Record<HabitabilityConstraint, string>> = Object.freeze({
  TEMPERATURE: 'No hay una ventana térmica y de presión suficiente para resolver el criterio; una media no describe todos los nichos.',
  LIQUID_RESERVOIR: 'Un índice hídrico o una candidatura no demuestra agua líquida estable ni la existencia física del reservorio.',
  PRESSURE_OR_CONFINEMENT: 'La presión o el confinamiento no están resueltos; los índices de retención no equivalen a una columna de presión.',
  CHEMICAL_FEASIBILITY: 'No existe evaluación química específica del solvente y de los procesos requeridos por una posible bioquímica.',
  ENERGY_GRADIENT: 'No se ha determinado un gradiente aprovechable para una química biológica concreta.',
  RADIATION_EXPOSURE: 'Los índices radiativos no son dosis físicas ni establecen límites de tolerancia válidos para toda posible biología.',
  DYNAMICAL_STABILITY: 'Falta una serie histórica independiente que determine la persistencia de estas condiciones.',
  GRAVITY_AND_RETENTION: 'La gravedad calculada no permite deducir compatibilidad biológica universal ni retención ambiental histórica.',
  RESERVOIR_GEOMETRY: 'No están determinados la geometría, el espesor real ni la continuidad de un reservorio interior.',
});

interface LunarInterpretation31Fe {
  /** Temperature alone is within the conditional liquid-water domain; pressure remains unknown. */
  readonly surfaceThermalOpportunity: boolean;
  readonly iceShellRegime: string | null;
}

const LABELS: Readonly<Record<HabitabilityRoute, string>> = Object.freeze({
  SURFACE_AQUEOUS: 'Agua líquida superficial',
  SUBSURFACE_AQUEOUS: 'Agua líquida subsuperficial',
  ALTERNATIVE_CHEMISTRY: 'Otras rutas químicas',
});

/**
 * 31.F.e: observer boundary for ALREADY AUTHORIZED scientific fiches.
 *
 * We DO NOT publish or redact the private 31.F.b assessment. Evidence is
 * freshly resolved in OBSERVED_KNOWLEDGE from a narrow allowlist of 26.x fiche
 * fields that the player can already consult, with explicit per-criterion
 * access. Fields not present in the fiche (20.7 effective water-column pressure,
 * radiation, unseen liquid reservoirs, transient history, alternative solvents)
 * stay unresolved. Model projections are NOT direct measurements.
 */
export class ObservedHabitabilityFiche31Fe {
  private constructor() {}

  static planet(
    target: PlanetScientificResolvedTarget,
    discoveryState: DiscoveryStateValue,
    scientificFicheAccessible: boolean,
    bodyKey: string,
    multiplicity: HabitabilityMultiplicity,
  ): ObservedHabitabilityFiche31Fe | null {
    if (!authorized(discoveryState, scientificFicheAccessible)) return null;
    const a = target.detail.atmosphere;
    const c = target.detail.climate;
    const hasSurface = target.detail.surface.hasDefinedSolidSurfaceBase && !a.isDeepEnvelope;
    const pressure = hasSurface && a.retainedSurfacePressurePascal !== null &&
      Number.isFinite(a.retainedSurfacePressurePascal) && a.retainedSurfacePressurePascal >= 0
      ? a.retainedSurfacePressurePascal : null;
    const mean = hasSurface && c.meanSurfaceTemperatureKelvin !== null &&
      Number.isFinite(c.meanSurfaceTemperatureKelvin) && c.meanSurfaceTemperatureKelvin > 0
      ? c.meanSurfaceTemperatureKelvin : null;
    const surface = target.detail.surface;
    const waterCoverage = hasSurface && finiteFraction(surface.surfaceLiquidWaterCoverageFraction01)
      ? surface.surfaceLiquidWaterCoverageFraction01 : null;
    const waterIndex = hasSurface && finiteFraction(surface.waterInventoryIndex01)
      ? surface.waterInventoryIndex01 : null;
    // Reconstruct the 31.2 READ-ONLY source solely from published 26.x fields.
    // This is NOT the hidden 20.7 water inventory or an observed ocean.
    const validWater = waterCoverage !== null && waterIndex !== null;
    const vapor = a.retainedGasComposition?.find(g => g.gas === AtmosphereGas.WATER_VAPOR);
    const vaporFraction = vapor && finiteFraction(vapor.moleFraction01) ? vapor.moleFraction01 : 0;
    const context = observerContext(bodyKey, multiplicity, [
      ...(pressure === null ? [] : [{ route: 'SURFACE_AQUEOUS' as const, constraint: 'PRESSURE_OR_CONFINEMENT' as const }]),
      ...(mean === null ? [] : [{ route: 'SURFACE_AQUEOUS' as const, constraint: 'TEMPERATURE' as const }]),
      ...(validWater ? [{ route: 'SURFACE_AQUEOUS' as const, constraint: 'LIQUID_RESERVOIR' as const }] : []),
    ]);
    const observed = HabitabilityEnvironmentResolver31_2.assessPlanet(context, {
      water: !validWater ? null : {
        planetOrdinal: target.identity.planetOrdinal,
        sourceRetainedSurfacePressurePascal: pressure,
        sourceRetainedAtmosphericWaterVaporMoleFraction01: vaporFraction,
        sourceMeanSurfaceTemperatureKelvin: mean,
        sourceMinimumSurfaceTemperatureKelvin: finitePositive(c.minimumSurfaceTemperatureKelvin)
          ? c.minimumSurfaceTemperatureKelvin : null,
        sourceMaximumSurfaceTemperatureKelvin: finitePositive(c.maximumSurfaceTemperatureKelvin)
          ? c.maximumSurfaceTemperatureKelvin : null,
        surfaceLiquidWaterCoverageFraction01: waterCoverage,
        hasPersistentSurfaceLiquidWater: surface.hasPersistentSurfaceLiquidWater,
        waterInventoryIndex01: waterIndex,
      },
      atmosphere: pressure === null ? null : {
        planetOrdinal: target.identity.planetOrdinal,
        retainedSurfacePressurePascal: pressure,
        retainedGasComponents: [],
      },
      climate: mean === null ? null : {
        planetOrdinal: target.identity.planetOrdinal,
        meanSurfaceTemperatureKelvin: mean,
      },
    });
    const facts: ObservedHabitabilityFact31Fe[] = [];
    if (mean !== null) facts.push(fact('Temperatura media modelada', `${round(mean, 1)} K`));
    if (pressure !== null) facts.push(fact('Presión superficial modelada', `${round(pressure, 0)} Pa`));
    if (waterCoverage !== null) facts.push(fact('Cobertura líquida superficial modelada', `${round(waterCoverage * 100, 1)} %`));
    if (waterIndex !== null) facts.push(fact('Índice de inventario hídrico (no masa oceánica)', round(waterIndex, 3)));
    if (hasSurface && finiteFraction(surface.surfaceRadiationExposureIndex01)) {
      facts.push(fact('Índice radiativo superficial (no dosis medida)',
        round(surface.surfaceRadiationExposureIndex01, 3)));
    }
    if (hasSurface && finiteFraction(surface.surfaceRadiationProtectionIndex01)) {
      facts.push(fact('Índice de protección radiativa (no certifica seguridad)',
        round(surface.surfaceRadiationProtectionIndex01, 3)));
    }
    if (!hasSurface) facts.push(fact('Superficie sólida expuesta', 'No definida por el modelo'));
    return project(bodyKey, multiplicity, 'PLANET', observed, discoveryState,
      scientificFicheAccessible, { SURFACE_AQUEOUS: facts });
  }

  static moon(
    target: MoonScientificResolvedTarget,
    discoveryState: DiscoveryStateValue,
    scientificFicheAccessible: boolean,
    bodyKey: string,
    multiplicity: HabitabilityMultiplicity,
  ): ObservedHabitabilityFiche31Fe | null {
    if (!authorized(discoveryState, scientificFicheAccessible)) return null;
    const e = target.detail.environment;
    // 31.2 itself distinguishes a conditional lunar pressure / ice-shell
    // hypothesis from a confirmed reservoir. Here we grant only those model
    // inputs already present in the individually authorized lunar fiche.
    // Authorized 32.F.6b bridge: 31.2 -> 31.10 -> physically resolved CT-0.
    // Explicit constraint grants apply only to this already-confirmed fiche.
    // The observer does NOT receive the simulated-reality diagnostics, model
    // provenance keys, historical events, hidden reactants or unobserved data.
    const context = observerContext(bodyKey, multiplicity, [
      // Only a real 32.F.1 independent gas mass/flux balance grants a
      // favorable (or unfavorable) surface-pressure verdict to 31.12.
      // Kophara-like CONDITIONAL_SCENARIO pressure is display-only.
      ...(HabitabilityMoonIntegration32F6b.hasPhysicalSurfacePressure32F1(target)
        ? [{ route: 'SURFACE_AQUEOUS' as const, constraint: 'PRESSURE_OR_CONFINEMENT' as const }]
        : []),
      { route: 'SURFACE_AQUEOUS', constraint: 'TEMPERATURE' },
      { route: 'SUBSURFACE_AQUEOUS', constraint: 'TEMPERATURE' },
      ...HabitabilityMoonIntegration32F6b.ct0ObserverGrants(target),
    ]);
    const bridge = HabitabilityMoonIntegration32F6b.assess(context, target);
    const observed = bridge.assessment;
    const surfaceFacts: ObservedHabitabilityFact31Fe[] = [];
    const subsurfaceFacts: ObservedHabitabilityFact31Fe[] = [];
    if (finitePositive(e.estimatedSurfaceTemperatureKelvin)) {
      surfaceFacts.push(fact('Temperatura superficial estimada',
        `${round(e.estimatedSurfaceTemperatureKelvin, 1)} K`, true));
    }
    if (e.atmosphereAssessment?.pressureBasis === 'CONDITIONAL_SCENARIO' &&
        finiteNonNegative(e.atmosphereAssessment.estimatedSurfacePressurePascal)) {
      surfaceFacts.push(fact('Presión del escenario atmosférico',
        `${round(e.atmosphereAssessment.estimatedSurfacePressurePascal, 0)} Pa`, true));
    }
    // 32.F.1 pressure is a separate, mass-backed model, never a direct
    // observation and never a biologically sufficient condition by itself.
    if (e.atmosphereAssessment?.pressureBasis === 'PHYSICAL_BALANCE' &&
        e.atmosphereAssessment.physicalBalance32F1?.sourceKind === 'INDEPENDENT_MASS_AND_FLUXES') {
      const balance = e.atmosphereAssessment.physicalBalance32F1;
      if (finiteNonNegative(balance.surfacePressurePascal)) {
        surfaceFacts.push(fact('Presión del balance físico lunar 32.F.1',
          `${round(balance.surfacePressurePascal, 2)} Pa`));
      }
      surfaceFacts.push(fact('Masa gaseosa del intervalo 32.F.1',
        `${round(balance.remainingGasMassKilograms, 1)} kg`));
      surfaceFacts.push(fact('Régimen atmosférico (solo intervalo evaluado)',
        balance.regime.replaceAll('_', ' ').toLowerCase()));
      // No sourceId, rates or independent forcing object enter the observed DTO.
    }
    // 32.F.1c: these are independently computable bulk/thermal constraints,
    // not a column-pressure estimate, an atmosphere or biological evidence.
    const automatic = e.atmosphereAssessment?.automaticConstraints32F1c;
    if (automatic?.basis === 'V2_MATERIALIZED_GRAVITY_RADIUS_AND_TEMPERATURE') {
      if (finitePositive(automatic.escapeVelocityMetersPerSecond)) {
        surfaceFacts.push(fact('Velocidad de escape lunar (gravedad V2)',
          `${round(automatic.escapeVelocityMetersPerSecond, 1)} m/s`));
      }
      if (finiteNonNegative(automatic.waterVaporSaturationPascalIfEquilibrated)) {
        surfaceFacts.push(fact('Saturación de vapor H₂O (solo equilibrio hipotético)',
          `${round(automatic.waterVaporSaturationPascalIfEquilibrated, 2)} Pa`, true));
      }
      // Pressure remains UNKNOWN absent independently quantified gas mass.
    }
    // 32.F.1e endmember is a sensitivity experiment, not actual lunar pressure.
    const formationEvolution = e.atmosphereAssessment?.formationEvolution32F1e;
    if (formationEvolution?.provenance === 'CONDITIONAL_FORMATION_ENDMEMBER_NOT_OBSERVATION' &&
        finiteNonNegative(formationEvolution.conditionalInitialWaterVaporPressurePascal)) {
      surfaceFacts.push(fact('Vapor H₂O 32.F.1e al inicio (solo escenario)',
        `${round(formationEvolution.conditionalInitialWaterVaporPressurePascal, 2)} Pa`, true));
    }
    // 32.F.3: quantitative TOTAL stellar irradiance and conditional photon
    // shielding are not ionising dose or biological exposure. Only publish
    // this model when system CONFIRMED and fiche access were already checked.
    const radiation = e.radiationProtection32F3;
    if (radiation?.provenance === 'V2_BOLOMETRIC_AND_CT0_GEOMETRY_WITH_NIST_PHOTON_REFERENCE') {
      if (finiteNonNegative(radiation.referenceBolometricWattsPerSquareMeter)) {
        surfaceFacts.push(fact('Irradiancia bolométrica lunar CT-0 (no es flujo ionizante)',
          `${round(radiation.referenceBolometricWattsPerSquareMeter, 2)} W/m²`, true));
      }
      if (radiation.waterCoveringState === 'ICE_COVER_OVER_MODELLED_OCEAN' &&
        finiteNonNegative(radiation.iceCoverThicknessMeters) &&
        finiteNonNegative(radiation.referenceOneMeVGammaIceOpticalDepth)) {
        subsurfaceFacts.push(fact('Cubierta de hielo CT-0 para transporte fotónico',
          `${round(radiation.iceCoverThicknessMeters, 2)} m`));
        subsurfaceFacts.push(fact('Profundidad óptica de referencia γ 1 MeV (no dosis)',
          round(radiation.referenceOneMeVGammaIceOpticalDepth, 2), true));
      }
    }
    // 32.F.4: geometric/thermal constraints may be shown for a CONFIRMED
    // moon, but they do NOT elevate chemical viability or energy criteria.
    const chemistry = e.geochemicalEnergy32F4;
    if (chemistry?.provenance === 'CT0_PHASE_AND_THERMAL_MODEL_WITH_UNIDENTIFIED_REACTANTS') {
      if (finiteNonNegative(chemistry.generatedHeatFluxWattsPerSquareMeter)) {
        subsurfaceFacts.push(fact('Flujo térmico interior CT-0 (no energía química)',
          `${round(chemistry.generatedHeatFluxWattsPerSquareMeter, 5)} W/m²`, true));
      }
      if (chemistry.solventState === 'MODELLED_LIQUID_H2O_CT0') {
        subsurfaceFacts.push(fact('Contacto agua-roca CT-0 — estado geométrico',
          chemistry.modeledWaterRockContact === 'DIRECT_LIQUID_SILICATE_INTERFACE_IN_MODEL'
            ? 'Interfaz directa en el modelo, reacción química no demostrada'
            : 'Contacto directo con silicatos no demostrado', true));
      }
      // No evidence for chemical feasibility, oxidant inventory or actual
      // free-energy gradients is submitted to the 31.12 resolver.
    }
    // 32.F.5/5a: report ONLY modelled dated irradiance coverage. These
    // slices neither certify dynamical stability nor historic ocean continuity.
    const history = e.environmentalHistory32F5;
    if (history?.provenance === 'RETAINED_V2_DATED_IRRADIANCE_AND_INDEPENDENT_LUNAR_SOURCES' &&
        Number.isInteger(history.datedIrradianceIntervalCount) &&
        history.datedIrradianceIntervalCount > 0) {
      subsurfaceFacts.push(fact('Cobertura de irradiación histórica (no habitabilidad)',
        `${history.datedIrradianceIntervalCount} intervalos de modelo condicional`, true));
    }
    // A one-orbit pressure cannot be inferred from bulk T and an H2O
    // inventory: exobase state and replenishment are unknown. Never publish
    // the historical surface-Jeans proxy as a future pressure.
    if (finiteFraction(e.waterInventoryIndex01)) {
      surfaceFacts.push(fact('Índice de inventario hídrico (no océano)',
        round(e.waterInventoryIndex01, 3), true));
    }
    if (finiteFraction(e.subsurfaceOceanPotentialIndex01)) {
      subsurfaceFacts.push(fact('Índice potencial subsuperficial (no detección)',
        round(e.subsurfaceOceanPotentialIndex01, 3), true));
    }
    // 32.F.2c: in a FULLY CONFIRMED system every relevant moon and the
    // procedural physical model describing it are already accessible. No
    // second lunar discovery is needed. The model is NOT direct observation,
    // however, and does not certify biochemistry, radiation or life.
    const ocean = e.oceanReality32F2c;
    const modelledOcean = bridge.ct0OceanState !== 'NOT_AVAILABLE' &&
      ocean?.provenance === 'SIMULATED_CT0_CONSTITUTIVE_MODEL_NOT_DIRECT_OBSERVATION'
      ? ocean : null;
    if (modelledOcean !== null) {
      const outcome = modelledOcean.state === 'PRESENT_IN_SIMULATED_MODEL'
        ? 'Presente en el universo simulado (modelo constitutivo)'
        : modelledOcean.state === 'ABSENT_IN_SIMULATED_MODEL'
          ? 'Ausente en el universo simulado (modelo constitutivo)'
          : 'No resuelto en el dominio del modelo';
      subsurfaceFacts.push(fact('Océano subsuperficial CT-0 — realidad simulada', outcome));
      if (modelledOcean.state === 'PRESENT_IN_SIMULATED_MODEL') {
        subsurfaceFacts.push(fact('Cubierta de hielo CT-0 — modelo',
          `${round(modelledOcean.iceCoverThicknessKilometers!, 2)} km`));
        subsurfaceFacts.push(fact('Espesor oceánico CT-0 — modelo',
          `${round(modelledOcean.liquidLayerThicknessKilometers!, 2)} km`));
        subsurfaceFacts.push(fact('Masa líquida CT-0 — modelo',
          `${round(modelledOcean.simulatedLiquidWaterMassKilograms!, 0)} kg`));
      }
    }
    const regime = e.internalWaterAssessment?.iceShellThermalRegime;
    if (regime !== undefined) {
      subsurfaceFacts.push(fact('Escenario térmico de capa helada',
        ICE_REGIMES[regime] ?? 'No resuelto', true));
    }
    // This is presentation-only: a favorable modeled temperature does not
    // add a 31.2 physical constraint nor claim pressure, water or habitability.
    const thermal = e.estimatedSurfaceTemperatureKelvin;
    const presentation: LunarInterpretation31Fe = {
      surfaceThermalOpportunity: finitePositive(thermal) && thermal >= 273.15 && thermal < 647.096,
      iceShellRegime: regime ?? null,
    };
    const projected = project(bodyKey, multiplicity, 'MOON', observed, discoveryState,
      scientificFicheAccessible, { SURFACE_AQUEOUS: surfaceFacts, SUBSURFACE_AQUEOUS: subsurfaceFacts },
      presentation);
    if (modelledOcean === null || modelledOcean.state === 'UNRESOLVED_IN_SIMULATED_MODEL') {
      return projected;
    }
    // Labels and explanatory prose are a projection of the assessed verdicts.
    // The CT-0 constraints themselves have already been resolved in 31.10's
    // integration and passed through the 31.12 observer boundary — NO
    // presentation-time replacement of scientific verdicts or evidence basis.
    const present = modelledOcean.state === 'PRESENT_IN_SIMULATED_MODEL';
    return Object.freeze({
      ...projected,
      routes: Object.freeze(projected.routes.map(route => route.label !== 'Agua líquida subsuperficial'
        ? route : Object.freeze({
          ...route,
          status: present
            ? 'Océano presente en el modelo CT-0; otros criterios por evaluar'
            : 'Sin océano de H₂O en el modelo CT-0',
          evidence: 'Realidad generada del sistema CONFIRMED; modelo físico constitutivo, no observación directa',
          criteria: Object.freeze(route.criteria.map(criterion => {
            if (present && criterion.label === 'Temperatura') return Object.freeze({
              ...criterion,
              explanation: 'Compatibilidad térmica del escenario conductivo C. La presencia del océano proviene del modelo constitutivo CT-0 de 32.F.2c y no de este criterio aislado; no demuestra habitabilidad.',
            });
            if (criterion.label === 'Reservorio líquido' ||
                present && (criterion.label === 'Presión o confinamiento' ||
                            criterion.label === 'Geometría del reservorio')) {
              return Object.freeze({ ...criterion, explanation: present
                ? 'Reservorio y confinamiento calculados en el mundo simulado CT-0 mediante modelo constitutivo de presión y fases. No equivale a observación directa ni demuestra viabilidad biológica.'
                : 'El escenario generado CT-0 no contiene océano subsuperficial bajo sus parámetros físicos. No demuestra ausencia de cualquier solvente alternativo.' });
            }
            return criterion;
          })),
        }))),
    });

  }

  /** Compact hosts have no 31.F.b-equivalent aqueous environment: never borrow proxies. */
  static unresolved(
    bodyKind: 'PLANET' | 'MOON',
    discoveryState: DiscoveryStateValue,
    scientificFicheAccessible: boolean,
    bodyKey: string,
    multiplicity: HabitabilityMultiplicity = 'SINGLE',
  ): ObservedHabitabilityFiche31Fe | null {
    if (!authorized(discoveryState, scientificFicheAccessible)) return null;
    return project(bodyKey, multiplicity, bodyKind, null, discoveryState, scientificFicheAccessible);
  }
}

function authorized(state: DiscoveryStateValue, granted: boolean): boolean {
  return state.code === DiscoveryState.CONFIRMED.code && granted === true;
}

function observerContext(
  bodyKey: string,
  multiplicity: HabitabilityMultiplicity,
  grants: HabitabilityEnvironmentContext31_2['observerAccessibleEvidence'],
): HabitabilityEnvironmentContext31_2 {
  return Object.freeze({ bodyKey, multiplicity, perspective: 'OBSERVED_KNOWLEDGE',
    time: CURRENT, observerAccessibleEvidence: Object.freeze(grants) });
}

function evidenceFromObserverScenario(scenario: HabitabilityScenarioAssessment | null): readonly HabitabilityEvidence[] {
  if (scenario === null) return Object.freeze([]);
  return Object.freeze(scenario.routes.flatMap(route => route.route === 'ALTERNATIVE_CHEMISTRY'
    ? [] : route.constraints.flatMap(c => c.sourceKey === null ? [] : [{
      route: route.route, constraint: c.constraint,
      verdict: c.verdict, basis: c.basis, sourceKey: c.sourceKey,
      accessibleToObserver: true as const,
    }])));
}

function project(
  bodyKey: string,
  multiplicity: HabitabilityMultiplicity,
  bodyKind: 'PLANET' | 'MOON',
  scenario: HabitabilityScenarioAssessment | null,
  discoveryState: DiscoveryStateValue,
  scientificFicheAccessible: boolean,
  facts: Partial<Record<HabitabilityRoute, readonly ObservedHabitabilityFact31Fe[]>> = {},
  lunar: LunarInterpretation31Fe | null = null,
): ObservedHabitabilityFiche31Fe {
  // The only invocation allowed to produce player-facing 31.12 information.
  // No 31.F.b private WeakMap, historical 31.F.d result, or implicit grants.
  const observed = HabitabilityKnowledgeResolver31_12.projectObserved({
    bodyKind, bodyKey, multiplicity, time: CURRENT,
    aqueousEvidence: evidenceFromObserverScenario(scenario),
    alternativeEvidence: Object.freeze([]),
  }, { discoveryState, scientificFicheAccessible });
  return summarizeObserved(observed, facts, lunar);
}

function summarizeObserved(
  observed: HabitabilityObservedAssessment31_12,
  facts: Partial<Record<HabitabilityRoute, readonly ObservedHabitabilityFact31Fe[]>>,
  lunar: LunarInterpretation31Fe | null,
): ObservedHabitabilityFiche31Fe {
  if (observed.access !== 'SCIENTIFIC_FICHE_AVAILABLE' || !observed.aqueousIndices ||
      !observed.alternativeRoutes) {
    throw new RangeError('31.F.e refuses a locked 31.12 report in a scientific fiche.');
  }
  const routes: ObservedHabitabilityRoute31Fe[] = observed.aqueousIndices.routes
    .filter(route => route.route !== 'ALTERNATIVE_CHEMISTRY')
    .map(route => Object.freeze({
      label: LABELS[route.route],
      status: route.status === 'CONSTRAINTS_INCOMPATIBLE'
        ? 'Restricción incompatible en la evidencia disponible'
        : route.status === 'CONSTRAINTS_COMPATIBLE'
          ? 'Restricciones compatibles (no implica presencia de vida)'
          : 'Evidencia insuficiente',
      evidence: route.evidenceBases.directObservations > 0
        ? 'Incluye observaciones directas autorizadas'
        : route.evidenceBases.physicalModels > 0 || route.evidenceBases.inferredModels > 0
          ? 'Solo modelos o inferencias, no mediciones directas'
          : 'Sin criterios suficientes autorizados',
      criteria: Object.freeze(route.criteria.map(criterion => {
        // Lunar surface temperature without resolved pressure: thermal-only
        // compatibility is displayed as an *inference*, never injected as an
        // independently certified source into the 31.12 observer resolver.
        const conditionalLunarThermal = lunar !== null &&
          route.route === 'SURFACE_AQUEOUS' && criterion.constraint === 'TEMPERATURE' &&
          criterion.verdict === 'UNRESOLVED' && lunar.surfaceThermalOpportunity;
        const status: ObservedHabitabilityCriterion31Fe['status'] = conditionalLunarThermal
          ? 'Compatible' : criterion.verdict === 'SUPPORTS' ? 'Compatible'
            : criterion.verdict === 'CONTRADICTS' ? 'Incompatible' : 'Desconocido';
        const origin: ObservedHabitabilityCriterion31Fe['origin'] = conditionalLunarThermal
          ? 'Inferencia del modelo' : criterion.basis === 'DIRECT_OBSERVATION' ? 'Observación directa'
            : criterion.basis === 'PHYSICAL_MODEL' ? 'Modelo físico'
              : criterion.basis === 'INFERRED_MODEL' ? 'Inferencia del modelo' : 'Sin evidencia';
        const explanation = conditionalLunarThermal
          ? 'Solo compatibilidad térmica condicional: temperatura estimada dentro del dominio físico del agua líquida si existiera presión adecuada. No hay presión ni reservorio líquido resueltos.'
          : criterion.verdict === 'UNRESOLVED'
            ? lunar !== null && route.route === 'SUBSURFACE_AQUEOUS' &&
                lunar.iceShellRegime === 'NO_STABLE_SURFACE_ICE' &&
                (criterion.constraint === 'TEMPERATURE' || criterion.constraint === 'RESERVOIR_GEOMETRY')
              ? 'El escenario térmico no sostiene una corteza global estable de hielo: limita la hipótesis de océano bajo hielo, pero no descarta otros reservorios interiores.'
              : lunar !== null && route.route === 'SURFACE_AQUEOUS' &&
                  criterion.constraint === 'TEMPERATURE'
                ? 'La temperatura media estimada no demuestra líquido superficial: falta presión resuelta y pueden existir condiciones locales distintas.'
                : UNKNOWN_REASONS[criterion.constraint]
            : lunar !== null && route.route === 'SUBSURFACE_AQUEOUS' &&
                criterion.constraint === 'TEMPERATURE' && lunar.iceShellRegime === 'CONDITIONAL_ICE_OCEAN'
              ? 'Solo hipótesis conductiva admisible bajo supuestos: no confirma océano, geometría ni presión interior.'
              : undefined;
        return Object.freeze({ label: CRITERION_LABELS[criterion.constraint], status, origin, explanation });
      })),
      facts: Object.freeze([...(facts[route.route] ?? [])]),
    }));
  routes.push(Object.freeze({
    label: LABELS.ALTERNATIVE_CHEMISTRY,
    status: 'Sin evidencia específica autorizada',
    evidence: 'No se presume bioquímica terrestre ni se infiere un solvente alternativo',
    criteria: Object.freeze([]),
    facts: Object.freeze([]),
  }));
  return Object.freeze({
    title: 'Compatibilidad ambiental · conocimiento observado',
    routes: Object.freeze(routes), note: NOTE,
  });
}

// Only existing player-facing data. Provenance never claims a direct observation.
function fact(label: string, value: string, conditional = false): ObservedHabitabilityFact31Fe {
  return Object.freeze({ label, value,
    origin: conditional ? 'Inferencia condicional CT-0' as const : 'Modelo físico CT-0' as const });
}
function round(value: number, digits: number): string {
  return value.toLocaleString('es-ES', { maximumFractionDigits: digits, useGrouping: false });
}
function finiteFraction(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && Number.isFinite(value) && value >= 0 && value <= 1;
}
function finitePositive(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && Number.isFinite(value) && value > 0;
}
function finiteNonNegative(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && Number.isFinite(value) && value >= 0;
}
const ICE_REGIMES: Readonly<Record<string, string>> = Object.freeze({
  CONDITIONAL_ICE_OCEAN: 'Hipótesis térmica de agua bajo hielo (no confirmada)',
  TIDAL_HEAT_INSUFFICIENT_IN_SCENARIO: 'Calentamiento mareal insuficiente en el escenario',
  ICE_INVENTORY_LIMITED: 'Inventario de hielo limitado',
  HIGH_TIDAL_FLUX_SCENARIO: 'Flujo mareal alto en el escenario',
  NO_STABLE_SURFACE_ICE: 'Sin cubierta de hielo superficial estable',
  NOT_EVALUABLE_HIGH_ECCENTRICITY: 'No evaluable: excentricidad elevada',
  NOT_EVALUABLE_NON_SYNCHRONOUS: 'No evaluable: rotación no síncrona',
});
