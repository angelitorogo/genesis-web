import { greenhouseTemperatureAmplificationFactor } from '../../domain/planetary/atmosphere-greenhouse-effect';
import { planetaryEquilibriumTemperatureKelvin } from '../../domain/planetary/planet-climate-state';
import { PlanetType } from '../../domain/planetary/planet-type';
import { type MultihostPlanetEnvironmentV241 } from '../../domain/planetary/multihost-planet-environment-v241';
import {
  WATER_V1_FREEZING_TEMPERATURE_KELVIN,
  WATER_V1_TRIPLE_POINT_PRESSURE_PASCAL,
  waterBoilingTemperatureKelvinForPressurePascal,
  waterInventoryIndexForPlanetV1,
} from './planet-water-engine';

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const clamp01 = (value: number): number => clamp(value, 0, 1);

/** This estimator must not assert a surface for gas/ice giants or when the
 * reference luminosity is missing. Water is a candidate inventory, not a
 * fabricated ocean detection; no companion flux or secular climate is modeled. */
export function generateMultihostPlanetEnvironmentV241(input: Readonly<{
  planetType: PlanetType;
  formationSeedHex: string;
  massEarth: number;
  radiusEarth: number;
  envelopeMassFraction01: number;
  iceBearingFractionOfSolids01: number;
  volatileRichFraction01: number;
  referenceMeanInsolationEarth: number | null;
  referenceBondAlbedo01: number;
}>): MultihostPlanetEnvironmentV241 {
  const {planetType: type, referenceMeanInsolationEarth: flux} = input;
  if (!(input.massEarth > 0 && input.radiusEarth > 0) ||
      !/^[0-9A-F]{32}$/.test(input.formationSeedHex) ||
      !Number.isFinite(input.massEarth) || !Number.isFinite(input.radiusEarth) ||
      [input.envelopeMassFraction01, input.iceBearingFractionOfSolids01,
        input.volatileRichFraction01, input.referenceBondAlbedo01].some(n => !Number.isFinite(n) || n < 0 || n >= 1) ||
      (flux !== null && !(Number.isFinite(flux) && flux > 0))) {
    throw new RangeError('V2.4.1 environment requires valid frozen bulk, seed and host reference flux.');
  }
  const giant = type === PlanetType.GAS_GIANT || type === PlanetType.ICE_GIANT ||
    type === PlanetType.MINI_NEPTUNE;
  const teq = flux === null ? null : planetaryEquilibriumTemperatureKelvin(
    flux, input.referenceBondAlbedo01,
  );
  // Independently seeded volatile/atmosphere prior; it never changes mass or
  // consumes the V2.2 formation stream. Higher gravity and volatile supply
  // favour retention; extreme irradiation decreases it.
  // V1 20.7 inventory weighting is shared exactly; the atmospheric-vapor
  // argument is a V2 composition prior, never a measured mole fraction.
  const inventory = waterInventoryIndexForPlanetV1(type,
    input.iceBearingFractionOfSolids01,
    clamp01(input.volatileRichFraction01 * 0.06));
  const retention = flux === null ? null : clamp01(
    0.20 + 0.23 * Math.log1p(input.massEarth / input.radiusEarth ** 2) +
    0.37 * input.volatileRichFraction01 - 0.12 * Math.log1p(flux),
  );
  const draw = deterministicUnit(input.formationSeedHex, 'atmosphere-v241');
  const noAir = !giant && retention !== null &&
    (retention < 0.14 || (inventory < 0.19 && draw > retention));
  const pressure = giant || retention === null ? null : noAir ? 0 : clamp(
    101_325 * (0.012 + 3.4 * inventory) * (0.35 + 1.4 * retention) *
      Math.exp((draw - 0.5) * 1.3),
    100, 8_000_000,
  );
  const opticalDepth = pressure === null ? null : pressure <= 0 ? 0 : clamp(
    0.7 * Math.pow(pressure / 101_325, 0.35) *
      (0.15 + 1.5 * input.volatileRichFraction01 + 0.4 * inventory),
    0, 12,
  );
  const amplification = opticalDepth === null || giant ? null :
    greenhouseTemperatureAmplificationFactor(opticalDepth);
  const surfaceTemperature = teq === null || amplification === null ? null :
    teq * amplification;
  const vapor = pressure === null || pressure <= 0 || surfaceTemperature === null ? null :
    clamp01(inventory * clamp01((surfaceTemperature - 230) / 240) * 0.12);
  let liquid: number | null = null;
  let ice: number | null = null;
  let waterRegime: MultihostPlanetEnvironmentV241['water']['regime'] = 'UNKNOWN';
  if (giant) {
    waterRegime = 'DEEP_ENVELOPE';
  } else if (surfaceTemperature !== null && pressure !== null) {
    const boiling = waterBoilingTemperatureKelvinForPressurePascal(pressure);
    if (inventory < 0.09) {
      liquid = 0; ice = 0; waterRegime = 'DRY';
    } else if (surfaceTemperature < WATER_V1_FREEZING_TEMPERATURE_KELVIN) {
      liquid = 0; ice = clamp01(inventory * 0.8);
      waterRegime = 'ICE';
    } else if (boiling !== null && pressure >= WATER_V1_TRIPLE_POINT_PRESSURE_PASCAL &&
      surfaceTemperature < boiling) {
      liquid = clamp01(inventory * clamp01((boiling - surfaceTemperature) / 30) *
        (0.4 + 0.4 * retention!));
      ice = clamp01((inventory - liquid) * clamp01((285 - surfaceTemperature) / 25));
      waterRegime = liquid > 0 ? 'LIQUID_CANDIDATE' : 'DRY';
    } else {
      liquid = 0; ice = 0; waterRegime = 'VAPOR';
    }
  }
  const regime = giant ? 'DEEP_ENVELOPE' : pressure === null ? 'UNKNOWN' : pressure === 0 ?
    'VACUUM' : pressure < 20_000 ? 'THIN' : 'RETAINED';
  return Object.freeze({
    source: 'V2_4_1_ESTIMATED_ENVIRONMENT' as const,
    referenceOnly: true as const,
    referenceMeanInsolationEarth: flux,
    equilibriumTemperatureKelvin: teq,
    atmosphere: Object.freeze({regime, pressurePascal: pressure,
      infraredOpticalDepthProxy: opticalDepth, greenhouseAmplificationFactor: amplification,
      vaporMoleFraction01: vapor}),
    climate: Object.freeze({meanSurfaceTemperatureKelvin: surfaceTemperature,
      stabilityIndex01: null, companionIrradianceIncluded: false as const}),
    water: Object.freeze({inventoryIndex01: inventory,
      surfaceLiquidWaterCoverageFraction01: liquid,
      surfaceIceCoverageFraction01: ice,
      vaporFraction01: vapor, regime: waterRegime}),
  });
}
function deterministicUnit(seed: string, domain: string): number {
  let hash = 0x811c9dc5;
  for (const c of `${seed}:${domain}`) hash = Math.imul(hash ^ c.charCodeAt(0), 0x01000193);
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15;
  return ((Math.imul(hash, 0x846ca68b) ^ (hash >>> 16)) >>> 0) / 0x1_0000_0000;
}
