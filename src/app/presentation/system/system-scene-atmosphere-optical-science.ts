import {
  AtmosphereGas,
  atmosphereGasMolarMassGramsPerMole,
} from '../../domain/planetary/atmosphere-gas';

/**
 * ATM-VIS.1 — Scientific, read-only optical diagnostic; NOT the D.4d renderer.
 *
 * Approximates molecular Rayleigh scattering for a hydrostatic, well-mixed
 * gas column. It does not solve absorption bands, aerosols, clouds, multiple
 * scattering, surface reflectance, or sRGB color. Never use these values as
 * evidence for a specific pigment, haze, cloud, or observed atmosphere.
 *
 * Band centers are representative wavelengths, NOT RGB color channels.
 */
export interface AtmosphereOpticalScienceInputV1 {
  readonly columnKind: 'SOLID_SURFACE' | 'DEEP_ENVELOPE';
  /** Final post-escape/post-condensation mole fractions; null = unresolved. */
  readonly retainedGasComposition: readonly Readonly<{
    gas: AtmosphereGas;
    moleFraction01: number;
  }>[] | null;
  /** Physical column reference at solid surface. null != zero. */
  readonly retainedSurfacePressurePascal: number | null;
  readonly meanSurfaceTemperatureKelvin: number | null;
  /** Needed for hydrostatic molecular column; never silently assume Earth g. */
  readonly surfaceGravityMetersPerSecondSquared: number | null;
  /** Source radiation *at the body*, not renderer light intensity. */
  readonly referenceBolometricFluxEarth: number | null;
  /** Stellar photosphere blackbody proxy; not a measured spectrum. */
  readonly stellarEffectiveTemperatureKelvin: number | null;
}

export interface AtmosphereOpticalScienceBandsV1 {
  readonly at450Nm: number;
  readonly at550Nm: number;
  readonly at650Nm: number;
}

export interface AtmosphereOpticalScienceV1 {
  readonly version: 1;
  readonly source: 'ATM_VIS_1_DIAGNOSTIC';
  readonly columnStatus:
    | 'VACUUM'
    | 'EVALUABLE'
    | 'DEEP_ENVELOPE_NO_REFERENCE_COLUMN'
    | 'PRESSURE_UNRESOLVED'
    | 'COMPOSITION_UNRESOLVED'
    | 'COMPOSITION_INCOMPLETE'
    | 'GRAVITY_UNRESOLVED';
  /** Approximate molecular column only. Not a fully rendered limb opacity. */
  readonly estimatedRayleighOpticalDepth: AtmosphereOpticalScienceBandsV1 | null;
  readonly meanMolarMassGramsPerMole: number | null;
  /** Isothermal ideal-gas height; not a full temperature-altitude profile. */
  readonly approximateScaleHeightKilometers: number | null;
  /** 450/550/650-nm incident blackbody continuum normalized at 550 nm. */
  readonly stellarContinuumRelativeTo550Nm: AtmosphereOpticalScienceBandsV1 | null;
  readonly referenceBolometricFluxEarth: number | null;
  /** No spectral absorber inventory/cross-sections exists in phase 20. */
  readonly visibleAbsorptionResolved: false;
  readonly cloudAndAerosolOpacityResolved: false;
  readonly multipleScatteringResolved: false;
  readonly displayColorResolved: false;
}

export const ATMOSPHERE_OPTICAL_SCIENCE_VERSION = 1 as const;

/** Approximate static molecular polarizabilities in Å³. Optical baseline,
 * not wavelength-resolved absorption coefficients. Significant uncertainties
 * remain for polar and absorbing gases; these are diagnostic proxies only.
 */
const POLARIZABILITY_ANGSTROM_CUBED: Readonly<Record<AtmosphereGas, number>> =
  Object.freeze({
    [AtmosphereGas.HYDROGEN]: 0.802,
    [AtmosphereGas.HELIUM]: 0.205,
    [AtmosphereGas.NITROGEN]: 1.740,
    [AtmosphereGas.OXYGEN]: 1.581,
    [AtmosphereGas.CARBON_DIOXIDE]: 2.911,
    [AtmosphereGas.WATER_VAPOR]: 1.450,
    [AtmosphereGas.METHANE]: 2.593,
    [AtmosphereGas.ARGON]: 1.641,
    [AtmosphereGas.SULFUR_DIOXIDE]: 3.720,
    [AtmosphereGas.CARBON_MONOXIDE]: 1.950,
    [AtmosphereGas.AMMONIA]: 2.260,
  });

const EARTH_DRY_FRACTIONS: readonly Readonly<{
  gas: AtmosphereGas;
  moleFraction01: number;
}>[] = Object.freeze([
  { gas: AtmosphereGas.NITROGEN, moleFraction01: 0.78084 },
  { gas: AtmosphereGas.OXYGEN, moleFraction01: 0.20946 },
  { gas: AtmosphereGas.ARGON, moleFraction01: 0.00934 },
  { gas: AtmosphereGas.CARBON_DIOXIDE, moleFraction01: 0.00042 },
].map(item => Object.freeze(item)));

const EARTH_PRESSURE_PASCAL = 101_325;
const EARTH_GRAVITY_METERS_PER_SECOND_SQUARED = 9.80665;
const EARTH_RAYLEIGH_TAU_550_NM = 0.0987; // Approximate clear-sky sea-level molecular reference.
const UNIVERSAL_GAS_CONSTANT = 8.314462618;
const PLANCK_CONSTANT = 6.62607015e-34;
const SPEED_OF_LIGHT = 299_792_458;
const BOLTZMANN_CONSTANT = 1.380649e-23;

const earthReference = compositionMoments(EARTH_DRY_FRACTIONS);

export function buildAtmosphereOpticalScienceV1(
  input: AtmosphereOpticalScienceInputV1,
): AtmosphereOpticalScienceV1 {
  validateNullableNonnegative(input.retainedSurfacePressurePascal, 'pressure');
  validateNullablePositive(input.meanSurfaceTemperatureKelvin, 'surface temperature');
  validateNullablePositive(input.surfaceGravityMetersPerSecondSquared, 'surface gravity');
  validateNullableNonnegative(input.referenceBolometricFluxEarth, 'bolometric flux');
  validateNullablePositive(input.stellarEffectiveTemperatureKelvin, 'stellar effective temperature');

  const gasFractions = input.retainedGasComposition;
  let moments: ReturnType<typeof compositionMoments> | null = null;
  let total = 0;
  if (gasFractions !== null) {
    const seen = new Set<AtmosphereGas>();
    for (const item of gasFractions) {
      if (!Object.values(AtmosphereGas).includes(item.gas) ||
          seen.has(item.gas) ||
          !Number.isFinite(item.moleFraction01) ||
          item.moleFraction01 < 0 || item.moleFraction01 > 1) {
        throw new RangeError('Invalid or duplicated atmospheric component');
      }
      seen.add(item.gas);
      total += item.moleFraction01;
    }
    if (total > 1.001) {
      throw new RangeError('Atmospheric mole fractions exceed unity');
    }
    if (total >= 0.999 && total <= 1.001) {
      moments = compositionMoments(gasFractions);
    }
  }

  const pressure = input.retainedSurfacePressurePascal;
  const gravity = input.surfaceGravityMetersPerSecondSquared;
  const temperature = input.meanSurfaceTemperatureKelvin;
  const columnStatus: AtmosphereOpticalScienceV1['columnStatus'] =
    input.columnKind === 'DEEP_ENVELOPE'
      ? 'DEEP_ENVELOPE_NO_REFERENCE_COLUMN'
      : pressure === null
        ? 'PRESSURE_UNRESOLVED'
        : pressure === 0
          ? 'VACUUM'
          : gasFractions === null
            ? 'COMPOSITION_UNRESOLVED'
            : moments === null
              ? 'COMPOSITION_INCOMPLETE'
              : gravity === null
                ? 'GRAVITY_UNRESOLVED'
                : 'EVALUABLE';

  const column = columnStatus === 'EVALUABLE' && moments !== null && pressure !== null && gravity !== null
    ? EARTH_RAYLEIGH_TAU_550_NM *
      ((pressure / gravity) / (EARTH_PRESSURE_PASCAL / EARTH_GRAVITY_METERS_PER_SECOND_SQUARED)) *
      ((moments.polarizabilitySquared / moments.meanMolarMass) /
        (earthReference.polarizabilitySquared / earthReference.meanMolarMass))
    : null;

  const estimatedRayleighOpticalDepth = column === null
    ? null
    : bands(
      column * (550 / 450) ** 4,
      column,
      column * (550 / 650) ** 4,
    );

  const approximateScaleHeightKilometers = moments !== null && gravity !== null && temperature !== null &&
      input.columnKind === 'SOLID_SURFACE' && pressure !== null && pressure > 0
    ? UNIVERSAL_GAS_CONSTANT * temperature /
      (moments.meanMolarMass / 1000 * gravity) / 1000
    : null;

  const stellarContinuumRelativeTo550Nm = input.stellarEffectiveTemperatureKelvin === null ||
    input.referenceBolometricFluxEarth === 0
    ? null
    : (() => {
      const temperatureKelvin = input.stellarEffectiveTemperatureKelvin;
      const centerLog = planckLogSpectralRadiance(550, temperatureKelvin);
      return bands(
        Math.exp(planckLogSpectralRadiance(450, temperatureKelvin) - centerLog),
        1,
        Math.exp(planckLogSpectralRadiance(650, temperatureKelvin) - centerLog),
      );
    })();

  return Object.freeze({
    version: ATMOSPHERE_OPTICAL_SCIENCE_VERSION,
    source: 'ATM_VIS_1_DIAGNOSTIC' as const,
    columnStatus,
    estimatedRayleighOpticalDepth,
    meanMolarMassGramsPerMole: moments?.meanMolarMass ?? null,
    approximateScaleHeightKilometers,
    stellarContinuumRelativeTo550Nm,
    referenceBolometricFluxEarth: input.referenceBolometricFluxEarth,
    visibleAbsorptionResolved: false,
    cloudAndAerosolOpacityResolved: false,
    multipleScatteringResolved: false,
    displayColorResolved: false,
  });
}

function compositionMoments(
  components: readonly Readonly<{ gas: AtmosphereGas; moleFraction01: number }>[],
): { meanMolarMass: number; polarizabilitySquared: number } {
  const total = components.reduce((sum, item) => sum + item.moleFraction01, 0);
  return {
    meanMolarMass: components.reduce((sum, item) =>
      sum + item.moleFraction01 * atmosphereGasMolarMassGramsPerMole(item.gas), 0) / total,
    polarizabilitySquared: components.reduce((sum, item) =>
      sum + item.moleFraction01 * POLARIZABILITY_ANGSTROM_CUBED[item.gas] ** 2, 0) / total,
  };
}

function planckLogSpectralRadiance(wavelengthNanometers: number, temperatureKelvin: number): number {
  const meters = wavelengthNanometers * 1e-9;
  const exponent = PLANCK_CONSTANT * SPEED_OF_LIGHT / (meters * BOLTZMANN_CONSTANT * temperatureKelvin);
  // Normalize with a common factor that cancels in band ratios. exmp1 avoids
  // catastrophic cancellation for very hot stars; for cool stars ratios of
  // expm1 may underflow. The log formulation remains finite for all T > 0.
  const logDenominator = exponent > 700 ? exponent : Math.log(Math.expm1(exponent));
  return -5 * Math.log(meters) - logDenominator;
}

function bands(at450Nm: number, at550Nm: number, at650Nm: number): AtmosphereOpticalScienceBandsV1 {
  return Object.freeze({ at450Nm, at550Nm, at650Nm });
}

function validateNullableNonnegative(value: number | null, label: string): void {
  if (value !== null && (!Number.isFinite(value) || value < 0)) {
    throw new RangeError(`${label} must be finite and nonnegative`);
  }
}

function validateNullablePositive(value: number | null, label: string): void {
  if (value !== null && (!Number.isFinite(value) || value <= 0)) {
    throw new RangeError(`${label} must be finite and positive`);
  }
}
