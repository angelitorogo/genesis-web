/**
 * 29.1E-H4d — one read-only scientific decision for H3, H4, H4b and H4c.
 *
 * Existence in a regenerated canonical aggregate is NOT the same question as
 * whether our deliberately incomplete RGB/AGB histories can explain it.
 * A WD-only cryogenic ceiling and a bolometric escape sensitivity cannot
 * determine a present atmosphere: XUV/wind, evolving orbital hierarchy,
 * post-AGB volatile supply and spectral radiative transfer are missing.
 *
 * This module does not choose an arbitrary escape efficiency. It reconciles
 * only the explicit modelled scenarios, rejects incompatible/missing inputs,
 * exposes the missing prerequisites, and NEVER generates actual atmosphere,
 * surface temperature, water or new Ground Truth.
 */
import type { PostAgbAtmosphereScenario } from './white-dwarf-post-agb-atmosphere-projection';
import type { WhiteDwarfPostAgbAtmosphereHistory } from './white-dwarf-post-agb-atmosphere-history';
import type { PostAgbPlanetarySurvivalAssessment } from './white-dwarf-post-agb-planetary-survival';

export type PostAgbMissingConstraint =
  | 'GIANT_RADIUS_TIME_TRACK'
  | 'XUV_WIND_AND_ESCAPE_EFFICIENCY'
  | 'ORBITAL_EVOLUTION_AND_STABILITY'
  | 'MULTIHOST_ORBIT_AND_STABILITY'
  | 'POST_AGB_VOLATILE_SUPPLY'
  | 'CURRENT_ATMOSPHERIC_RADIATIVE_TRANSFER';

export interface PostAgbConditionalPressureCase {
  readonly effectiveBolometricEscapeCoupling: number;
  /** ONLY for this named no-resupply/WD-only scenario; not a present-day interval. */
  readonly scenarioGasPressureMinimumPascal: number;
  readonly scenarioGasPressureMaximumPascal: number;
}

export interface WhiteDwarfPostAgbEnvironmentalResolution {
  readonly kind: 'CANONICAL_POST_AGB_ENVIRONMENTAL_AUDIT_V1';
  readonly planetCanonicalStatus: 'PRESENT_IN_GENERATED_GROUND_TRUTH';
  readonly evolutionarySurvivalExplanation: 'NOT_RECONSTRUCTED';
  readonly assumedEnvelopeCrossing:
    PostAgbPlanetarySurvivalAssessment['directEnvelopeIntersection'];
  /** A clash with an assumed giant-envelope model flags model insufficiency,
   * NOT nonexistence of an already generated canonical planet. */
  readonly conditionalEnvelopeHypothesisInTensionWithCanonicalPresence: boolean;
  readonly presentOrbitStatus: 'NOT_VALIDATED_ADIABATIC_HYPOTHESIS_ONLY';
  readonly presentAtmosphereStatus: 'UNRESOLVED_CONDITIONAL_SCENARIOS_ONLY';
  readonly presentClimateStatus: 'UNRESOLVED_CONDITIONAL_THERMAL_FLOOR_ONLY';
  readonly presentWaterStatus: 'UNRESOLVED';
  readonly pressureByEscapeHypothesis: readonly PostAgbConditionalPressureCase[];
  /** Across explicitly tested hypotheses only. NOT a physical present-day bound. */
  readonly combinedScenarioPressureRangePascal: readonly [number, number];
  readonly scenariosDisagreeOnAtmosphericPresence: boolean;
  readonly escapeSusceptibleGasSpeciesAtHypotheticalHotExobase: readonly string[];
  readonly missingConstraints: readonly PostAgbMissingConstraint[];
  readonly atmosphericFieldsMayBePromotedToCurrent: false;
  readonly canonicalAggregateWasMutated: false;
}

export interface WhiteDwarfPostAgbEnvironmentalResolutionInput {
  readonly canonicalPlanetExists: boolean;
  readonly isWhiteDwarfCircumstellar: boolean;
  readonly orbitIsHypotheticalNotValidated: boolean;
  readonly actualCurrentAtmosphereReassessmentApplied: boolean;
  readonly scenario: PostAgbAtmosphereScenario | null;
  readonly history: WhiteDwarfPostAgbAtmosphereHistory | null;
  readonly survival: PostAgbPlanetarySurvivalAssessment | null;
  readonly currentTotalIrradiationUpperEarth: number | null;
}

export function assessWhiteDwarfPostAgbEnvironmentalResolution(
  input: WhiteDwarfPostAgbEnvironmentalResolutionInput,
): WhiteDwarfPostAgbEnvironmentalResolution | null {
  const {scenario, history, survival} = input;
  if (!input.canonicalPlanetExists || !input.isWhiteDwarfCircumstellar ||
      !input.orbitIsHypotheticalNotValidated || input.actualCurrentAtmosphereReassessmentApplied ||
      scenario === null || history === null || survival === null ||
      scenario.kind !== 'WD_ONLY_NO_REPLENISHMENT' ||
      history.kind !== 'PARAMETRIC_RGB_AGB_WD_EXPOSURE_SENSITIVITY_V1' ||
      survival.kind !== 'CONDITIONAL_RGB_AGB_SURVIVAL_AND_ESCAPE_V1' ||
      !scenario.currentPressureUnresolved || !history.presentAtmosphereUnresolved ||
      !survival.atmosphericCompositionCurrentUnresolved ||
      history.scenarios.length === 0 ||
      !Number.isFinite(scenario.progenitorReferencePressurePascal) ||
      !Number.isFinite(scenario.scenarioGasPressureCeilingPascal) ||
      scenario.scenarioGasPressureCeilingPascal < 0 ||
      scenario.scenarioGasPressureCeilingPascal > scenario.progenitorReferencePressurePascal ||
      !Number.isFinite(history.formationSemiMajorAxisAu) ||
      !Number.isFinite(history.hypotheticalPostAgbSemiMajorAxisAu) ||
      history.hypotheticalPostAgbSemiMajorAxisAu <= history.formationSemiMajorAxisAu ||
      (input.currentTotalIrradiationUpperEarth !== null &&
        (!Number.isFinite(input.currentTotalIrradiationUpperEarth) ||
          input.currentTotalIrradiationUpperEarth < 0))) return null;

  // H4b already intersects escape scenarios with H4's WD-only cryogenic
  // ceiling. Do not intersect a second time or imply these are credible limits
  // for companion-heated, replenished, or time-dependent atmospheres.
  const cases: PostAgbConditionalPressureCase[] = [];
  let previousCoupling = -1;
  for (const sensitivity of history.scenarios) {
    const coupling = sensitivity.effectiveBolometricToEscapeCoupling01;
    const [lower, upper] = sensitivity.afterH4CryocondensationCeilingRangePascal;
    if (!Number.isFinite(coupling) || coupling < 0 || coupling <= previousCoupling ||
        !Number.isFinite(lower) || !Number.isFinite(upper) ||
        lower < 0 || upper < lower ||
        upper > scenario.scenarioGasPressureCeilingPascal + 1e-6) return null;
    previousCoupling = coupling;
    cases.push(Object.freeze({
      effectiveBolometricEscapeCoupling: coupling,
      scenarioGasPressureMinimumPascal: lower,
      scenarioGasPressureMaximumPascal: upper,
    }));
  }
  if (cases.length === 0) return null;
  const minimum = Math.min(...cases.map(item => item.scenarioGasPressureMinimumPascal));
  const maximum = Math.max(...cases.map(item => item.scenarioGasPressureMaximumPascal));
  const crossesVacuum = cases.some(item => item.scenarioGasPressureMinimumPascal === 0) &&
    cases.some(item => item.scenarioGasPressureMaximumPascal > 0);

  const missing: PostAgbMissingConstraint[] = [
    'GIANT_RADIUS_TIME_TRACK',
    'XUV_WIND_AND_ESCAPE_EFFICIENCY',
    'ORBITAL_EVOLUTION_AND_STABILITY',
    ...(history.companionIrradiationUnresolved || scenario.companionIrradiationUnresolved
      ? ['MULTIHOST_ORBIT_AND_STABILITY' as const] : []),
    'POST_AGB_VOLATILE_SUPPLY',
    'CURRENT_ATMOSPHERIC_RADIATIVE_TRANSFER',
  ];
  // Even if a single scenario has no gas, neither that nor a cold thermal floor
  // resolves the actual composition, water, or surface temperature.
  return Object.freeze({
    kind: 'CANONICAL_POST_AGB_ENVIRONMENTAL_AUDIT_V1' as const,
    planetCanonicalStatus: 'PRESENT_IN_GENERATED_GROUND_TRUTH' as const,
    evolutionarySurvivalExplanation: 'NOT_RECONSTRUCTED' as const,
    assumedEnvelopeCrossing: survival.directEnvelopeIntersection,
    conditionalEnvelopeHypothesisInTensionWithCanonicalPresence:
      survival.directEnvelopeIntersection === 'IN_ALL_ASSUMED_GIANT_TEMPERATURE_CASES',
    presentOrbitStatus: 'NOT_VALIDATED_ADIABATIC_HYPOTHESIS_ONLY' as const,
    presentAtmosphereStatus: 'UNRESOLVED_CONDITIONAL_SCENARIOS_ONLY' as const,
    presentClimateStatus: 'UNRESOLVED_CONDITIONAL_THERMAL_FLOOR_ONLY' as const,
    presentWaterStatus: 'UNRESOLVED' as const,
    pressureByEscapeHypothesis: Object.freeze(cases),
    combinedScenarioPressureRangePascal: Object.freeze([minimum, maximum] as const),
    scenariosDisagreeOnAtmosphericPresence: crossesVacuum,
    escapeSusceptibleGasSpeciesAtHypotheticalHotExobase: Object.freeze(
      survival.speciesEscapeDiagnostics
        .filter(gas => gas.thermallyMobileUnderHotExobaseHypothesis)
        .map(gas => gas.gas),
    ),
    missingConstraints: Object.freeze(missing),
    atmosphericFieldsMayBePromotedToCurrent: false as const,
    canonicalAggregateWasMutated: false as const,
  });
}
