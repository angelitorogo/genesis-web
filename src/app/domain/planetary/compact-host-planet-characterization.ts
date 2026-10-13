import { type AtmosphereGas } from './atmosphere-gas';
import { type AtmospherePressureRegime } from './atmosphere-pressure-regime';

/** 31.4f: intrinsic SNAPSHOT assumptions versus conditional environmental solutions.
 * No source field is an observation or a stellar-evolution survivor history. */
export interface CompactHostPlanetCharacterization {
  readonly modelVersion: 'COMPACT_PLANET_CHARACTERIZATION_31_4F_V1';
  readonly planetOrdinal: number;
  readonly intrinsicSource: 'DETERMINISTIC_SNAPSHOT_PRIOR';
  readonly environmentalSource: 'CONDITIONAL_COMPACT_RADIATION';
  readonly coreFraction01: number;
  readonly silicateFraction01: number;
  readonly iceInteriorFraction01: number;
  readonly volatileInteriorFraction01: number;
  readonly albedoBond01: number;
  readonly rotationPeriodHours: number;
  readonly axialTiltDegrees: number;
  readonly retrograde: boolean;
  readonly roughnessIndex01: number;
  readonly waterInventoryIndex01: number;
  readonly initialPressurePa: number;
  readonly retainedPressureBeforeCondensationPa: number;
  readonly gasRetentionFraction01: number;
  readonly atmosphericPressurePa: number | null;
  readonly atmosphericGasMoleFractions: readonly Readonly<{ gas: AtmosphereGas; fraction01: number }>[] | null;
  readonly meanMolarMassGramsPerMole: number | null;
  readonly atmosphereRegime: AtmospherePressureRegime | 'UNRESOLVED';
  readonly equilibriumTemperatureK: number | null;
  readonly surfaceTemperatureScenarioK: number | null;
  readonly greenhouseWarmingScenarioK: number | null;
  readonly greenhouseTrappingFraction01: number | null;
  readonly heatRedistributionIndex01: number | null;
  readonly diurnalTemperatureRangeK: number | null;
  readonly seasonalAmplitudeK: number | null;
  readonly surfaceMinimumScenarioK: number | null;
  readonly surfaceMaximumScenarioK: number | null;
  readonly climateStabilityIndex01: number | null;
  readonly waterIceFraction01: number | null;
  readonly waterLiquidFraction01: number | null;
  readonly waterVaporFraction01: number | null;
  readonly surfaceIceCoverageFraction01: number | null;
  readonly surfaceLiquidWaterCoverageFraction01: number | null;
  readonly internalHeatRetentionIndex01: number;
  readonly internalHeatFluxReferenceWm2: number;
  readonly tidalHeatingIndex01: number;
  readonly geologyActivityIndex01: number;
  readonly volcanismIndex01: number;
  readonly tectonicMobilityIndex01: number;
  readonly outgassingIndex01: number;
  readonly surfaceRenewalIndex01: number;
  readonly dynamoIndex01: number;
  readonly magneticFieldIndex01: number;
  readonly magneticProtectionIndex01: number | null;
  readonly radiationExposureIndex01: number | null;
  readonly radiationAssessment: 'MODELED_ENERGETIC_COMPONENT_ONLY' | 'ENERGETIC_CHANNEL_UNRESOLVED';
  readonly climateAssessment: 'CONDITIONAL_REFERENCE' | 'HOST_RADIATION_UNRESOLVED';
  readonly atmosphereAssessment: 'CONDENSATION_AND_ESCAPE_SCENARIO' | 'GAS_PHASE_UNRESOLVED';
}
