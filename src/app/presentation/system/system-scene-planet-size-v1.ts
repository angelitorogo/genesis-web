import { PlanetType } from '../../domain/planetary/planet-type';
import { adaptiveSystemPlanetRadiusScene } from './system-scene-scale-projection';

/** Exact phase-25.10 V1 physical-radius -> screen-radius formula. Both SINGLE
 * and BINARY call this function; it changes no physical radius or orbit. */
export function presentationPlanetRadiusFromPhysicsV1(input: Readonly<{
  radiusEarth: number;
  planetType: PlanetType;
  densityGramsPerCubicCentimeter: number;
  envelopeMassFraction01: number;
  isDeepEnvelopeSurface: boolean;
}>): number {
  const radiusEarth = Math.max(input.radiusEarth, 0.12);
  const type = input.planetType;
  const baseline = adaptiveSystemPlanetRadiusScene(radiusEarth);
  const deepEnvelope = input.isDeepEnvelopeSurface || type === PlanetType.MINI_NEPTUNE ||
    type === PlanetType.GAS_GIANT || type === PlanetType.ICE_GIANT;
  const familyRadius = deepEnvelope
    ? scaledRadius(radiusEarth, 1.8, 16, 0.050, 0.122)
    : scaledRadius(radiusEarth, 0.30, 2.8, 0.013, 0.036);
  const subtypeScale = type === PlanetType.GAS_GIANT ? 1.20 :
    type === PlanetType.ICE_GIANT ? 1.06 :
    type === PlanetType.MINI_NEPTUNE ? 0.88 :
    type === PlanetType.SUPER_EARTH ? 1.10 :
    type === PlanetType.OCEAN ? 1.02 :
    type === PlanetType.DESERT ? 0.97 :
    type === PlanetType.ICE ? 0.98 :
    type === PlanetType.VOLCANIC ? 0.92 : 0.88;
  const density = input.densityGramsPerCubicCentimeter;
  const densityScale = deepEnvelope
    ? clamp(1.07 - 0.040 * (density - 1.4), 0.94, 1.12)
    : clamp(1.00 - 0.022 * (density - 4.1), 0.92, 1.05);
  const envelopeScale = deepEnvelope
    ? clamp(0.94 + 0.18 * input.envelopeMassFraction01, 0.94, 1.12) : 1;
  const blendedRadius = (deepEnvelope
    ? 0.16 * baseline + 0.84 * familyRadius
    : 0.22 * baseline + 0.78 * familyRadius) *
    subtypeScale * densityScale * envelopeScale;
  return clamp(blendedRadius, deepEnvelope ? 0.048 : 0.012,
    deepEnvelope ? 0.138 : 0.040);
}
function scaledRadius(value: number, minInput: number, maxInput: number,
  minRadius: number, maxRadius: number): number {
  if (maxInput <= minInput) return (minRadius + maxRadius) / 2;
  const normalized = clamp((Math.sqrt(value) - Math.sqrt(minInput)) /
    (Math.sqrt(maxInput) - Math.sqrt(minInput)), 0, 1);
  return minRadius + (maxRadius - minRadius) * normalized;
}
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
