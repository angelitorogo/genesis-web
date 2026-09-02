export type SystemSceneGiantAtmosphereRegime =
  | 'MINI_NEPTUNE'
  | 'GAS_GIANT'
  | 'ICE_GIANT';

export interface SystemSceneGiantAtmosphereGasComponentInput {
  readonly gas: string;
  readonly moleFraction01: number;
}

export interface SystemSceneGiantAtmospherePresentationInput {
  readonly planetType: string;
  readonly massEarth: number;
  readonly radiusEarth: number;
  readonly densityGramsPerCubicCentimeter: number;
  readonly envelopeMassFraction01: number;
  readonly iceBearingFractionOfSolids01: number;
  readonly rotationPeriodHours: number;
  readonly equilibriumTemperatureKelvin: number;
  readonly referenceBondAlbedo01: number;
  readonly retainedMeanMolarMassGramsPerMole: number | null;
  readonly retainedGasComposition:
    readonly SystemSceneGiantAtmosphereGasComponentInput[];
}

/**
 * Point-25.4 read-only visual handoff for envelope-dominated planets.
 *
 * Source fields are direct phase-19/20 values. Fields prefixed with
 * `presentation` are bounded visual proxies used only to shape cloud-top bands,
 * jets, vortices and polar haze. They are not atmospheric circulation Ground
 * Truth and are never written back into the simulation/domain.
 */
export interface SystemSceneGiantAtmospherePresentationSnapshot {
  readonly source: 'PHASE_19_20_DEEP_ENVELOPE';
  readonly regime: SystemSceneGiantAtmosphereRegime;

  readonly massEarth: number;
  readonly radiusEarth: number;
  readonly densityGramsPerCubicCentimeter: number;
  readonly envelopeMassFraction01: number;
  readonly iceBearingFractionOfSolids01: number;
  readonly rotationPeriodHours: number;
  readonly equilibriumTemperatureKelvin: number;
  readonly referenceBondAlbedo01: number;
  readonly retainedMeanMolarMassGramsPerMole: number | null;

  readonly hydrogenMoleFraction01: number;
  readonly heliumMoleFraction01: number;
  readonly methaneMoleFraction01: number;
  readonly ammoniaMoleFraction01: number;
  readonly waterVaporMoleFraction01: number;
  readonly lightGasMoleFraction01: number;
  readonly condensableMoleFraction01: number;

  readonly presentationBandCount: number;
  readonly presentationJetSharpness01: number;
  readonly presentationTurbulence01: number;
  readonly presentationStormCoverage01: number;
  readonly presentationPolarHaze01: number;
  readonly presentationMethaneBlueing01: number;
  readonly presentationWarmChromophore01: number;
  readonly presentationUpperHaze01: number;
}

export function buildSystemSceneGiantAtmospherePresentationV1(
  input: SystemSceneGiantAtmospherePresentationInput,
): SystemSceneGiantAtmospherePresentationSnapshot | null {
  const regime = giantRegimeForPlanetType(input.planetType);

  if (regime === null) {
    return null;
  }

  assertPositiveFinite(input.massEarth, 'massEarth');
  assertPositiveFinite(input.radiusEarth, 'radiusEarth');
  assertPositiveFinite(
    input.densityGramsPerCubicCentimeter,
    'densityGramsPerCubicCentimeter',
  );
  assertIndex01(input.envelopeMassFraction01, 'envelopeMassFraction01');
  assertIndex01(
    input.iceBearingFractionOfSolids01,
    'iceBearingFractionOfSolids01',
  );
  assertPositiveFinite(input.rotationPeriodHours, 'rotationPeriodHours');
  assertPositiveFinite(
    input.equilibriumTemperatureKelvin,
    'equilibriumTemperatureKelvin',
  );
  assertIndex01(input.referenceBondAlbedo01, 'referenceBondAlbedo01');

  if (
    input.retainedMeanMolarMassGramsPerMole !== null &&
    (
      !Number.isFinite(input.retainedMeanMolarMassGramsPerMole) ||
      input.retainedMeanMolarMassGramsPerMole <= 0
    )
  ) {
    throw new RangeError(
      'retainedMeanMolarMassGramsPerMole must be null or positive and finite.',
    );
  }

  const composition = normalizedGasComposition(input.retainedGasComposition);
  const hydrogenMoleFraction01 = gasFraction(composition, 'HYDROGEN');
  const heliumMoleFraction01 = gasFraction(composition, 'HELIUM');
  const methaneMoleFraction01 = gasFraction(composition, 'METHANE');
  const ammoniaMoleFraction01 = gasFraction(composition, 'AMMONIA');
  const waterVaporMoleFraction01 = gasFraction(composition, 'WATER_VAPOR');
  const lightGasMoleFraction01 = clamp01(
    hydrogenMoleFraction01 + heliumMoleFraction01,
  );
  const condensableMoleFraction01 = clamp01(
    methaneMoleFraction01 +
      ammoniaMoleFraction01 +
      waterVaporMoleFraction01,
  );

  const rapidRotation01 = clamp01(
    (28 - input.rotationPeriodHours) / 24,
  );
  const gravityCompactness01 = clamp01(
    input.massEarth /
      Math.max(input.radiusEarth * input.radiusEarth * 120, 1),
  );
  const thermal01 = clamp01(
    (input.equilibriumTemperatureKelvin - 55) / 650,
  );
  const cold01 = 1 - thermal01;
  const methaneSupport01 = clamp01(methaneMoleFraction01 / 0.12);
  const condensableSupport01 = clamp01(condensableMoleFraction01 / 0.18);
  const envelopeSupport01 = clamp01(input.envelopeMassFraction01 / 0.75);

  const regimeBandBase =
    regime === 'GAS_GIANT'
      ? 13
      : regime === 'ICE_GIANT'
        ? 9
        : 7;
  const presentationBandCount = Math.max(
    5,
    Math.min(
      22,
      Math.round(
        regimeBandBase +
          6 * rapidRotation01 +
          2 * envelopeSupport01 -
          (regime === 'ICE_GIANT' ? 1.5 * cold01 : 0),
      ),
    ),
  );

  const presentationJetSharpness01 = clamp01(
    0.28 +
      0.42 * rapidRotation01 +
      0.18 * gravityCompactness01 +
      (regime === 'GAS_GIANT' ? 0.12 : 0),
  );
  const presentationTurbulence01 = clamp01(
    0.18 +
      0.28 * rapidRotation01 +
      0.20 * thermal01 +
      0.18 * condensableSupport01 +
      (regime === 'GAS_GIANT' ? 0.12 : 0.04),
  );
  const presentationStormCoverage01 = clamp01(
    0.025 +
      0.16 * presentationTurbulence01 +
      0.08 * rapidRotation01 +
      0.055 * condensableSupport01,
  );
  const presentationPolarHaze01 = clamp01(
    0.16 +
      0.30 * cold01 +
      0.20 * methaneSupport01 +
      (regime === 'ICE_GIANT' ? 0.22 : 0.06),
  );
  const presentationMethaneBlueing01 = clamp01(
    methaneSupport01 *
      (
        regime === 'ICE_GIANT'
          ? 0.95
          : regime === 'MINI_NEPTUNE'
            ? 0.72
            : 0.42
      ) +
      (regime === 'ICE_GIANT' ? 0.18 : 0),
  );
  const presentationWarmChromophore01 = clamp01(
    (
      regime === 'GAS_GIANT'
        ? 0.30
        : 0.08
    ) +
      0.42 * thermal01 +
      0.10 * ammoniaMoleFraction01 -
      0.26 * presentationMethaneBlueing01,
  );
  const presentationUpperHaze01 = clamp01(
    0.10 +
      0.26 * input.referenceBondAlbedo01 +
      0.24 * presentationPolarHaze01 +
      0.12 * condensableSupport01 +
      (regime === 'MINI_NEPTUNE' ? 0.10 : 0),
  );

  return Object.freeze({
    source: 'PHASE_19_20_DEEP_ENVELOPE' as const,
    regime,
    massEarth: input.massEarth,
    radiusEarth: input.radiusEarth,
    densityGramsPerCubicCentimeter:
      input.densityGramsPerCubicCentimeter,
    envelopeMassFraction01: input.envelopeMassFraction01,
    iceBearingFractionOfSolids01: input.iceBearingFractionOfSolids01,
    rotationPeriodHours: input.rotationPeriodHours,
    equilibriumTemperatureKelvin: input.equilibriumTemperatureKelvin,
    referenceBondAlbedo01: input.referenceBondAlbedo01,
    retainedMeanMolarMassGramsPerMole:
      input.retainedMeanMolarMassGramsPerMole,
    hydrogenMoleFraction01,
    heliumMoleFraction01,
    methaneMoleFraction01,
    ammoniaMoleFraction01,
    waterVaporMoleFraction01,
    lightGasMoleFraction01,
    condensableMoleFraction01,
    presentationBandCount,
    presentationJetSharpness01,
    presentationTurbulence01,
    presentationStormCoverage01,
    presentationPolarHaze01,
    presentationMethaneBlueing01,
    presentationWarmChromophore01,
    presentationUpperHaze01,
  });
}

function giantRegimeForPlanetType(
  planetType: string,
): SystemSceneGiantAtmosphereRegime | null {
  switch (planetType) {
    case 'MINI_NEPTUNE':
      return 'MINI_NEPTUNE';
    case 'GAS_GIANT':
      return 'GAS_GIANT';
    case 'ICE_GIANT':
      return 'ICE_GIANT';
    default:
      return null;
  }
}

function normalizedGasComposition(
  components: readonly SystemSceneGiantAtmosphereGasComponentInput[],
): readonly SystemSceneGiantAtmosphereGasComponentInput[] {
  let total = 0;
  const seen = new Set<string>();

  for (const component of components) {
    if (component.gas.trim().length === 0) {
      throw new RangeError('retained gas names must not be blank.');
    }
    assertIndex01(component.moleFraction01, 'retained gas moleFraction01');
    if (component.moleFraction01 <= 0) {
      throw new RangeError('retained gas moleFraction01 must be positive.');
    }
    if (seen.has(component.gas)) {
      throw new RangeError(`duplicate retained gas component: ${component.gas}.`);
    }
    seen.add(component.gas);
    total += component.moleFraction01;
  }

  if (components.length > 0 && Math.abs(total - 1) > 1e-8) {
    throw new RangeError(
      'retained gas composition must sum to 1 for a deep-envelope visual handoff.',
    );
  }

  return components;
}

function gasFraction(
  components: readonly SystemSceneGiantAtmosphereGasComponentInput[],
  gas: string,
): number {
  return components.find(component => component.gas === gas)?.moleFraction01 ?? 0;
}

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be positive and finite.`);
  }
}

function assertIndex01(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${label} must be finite in [0, 1].`);
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
