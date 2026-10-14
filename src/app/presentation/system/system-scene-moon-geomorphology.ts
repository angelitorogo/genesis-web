import type { SystemSceneMoonPresentationV1 } from './system-scene-moon-presentation';
import { buildMoonVisualProfileD3 } from './system-scene-moon-visual-profile';

export interface MoonSurfaceMorphologyD {
  readonly craterRetention01: number;
  readonly iceTectonics01: number;
  readonly silicateActivity01: number;
  readonly crustRenewal01: number;
  readonly iceRichness01: number;
  readonly impactCenters: readonly ImpactD[];
  readonly visualProfile: ReturnType<typeof buildMoonVisualProfileD3>;
  readonly fractureArcs: readonly FractureArcD[];
}

interface Vec3D { readonly x: number; readonly y: number; readonly z: number }
interface ImpactD { readonly center: Vec3D; readonly angularRadius: number; readonly thresholdCos: number; readonly depth: number }
interface FractureArcD {
  readonly center: Vec3D;
  readonly tangent: Vec3D;
  readonly normal: Vec3D;
  readonly halfLength: number;
  readonly thresholdCos: number;
  readonly width: number;
  readonly phase: number;
  readonly phaseSecondary: number;
  readonly bendAmplitude: number;
  readonly intensity: number;
  readonly branchBias: number;
}

/** Visual-only geology: frozen phase-21 inputs, never a claim of observed terrain. */
export function buildMoonSurfaceMorphologyD(moon: SystemSceneMoonPresentationV1): MoonSurfaceMorphologyD {
  const profile = buildMoonVisualProfileD3(moon);
  const ice = profile.ice01;
  const activity = clamp01(moon.sourceGeologicalActivityIndex01);
  const tides = clamp01(moon.sourceTidalHeatingIndex01);
  const cold = moon.sourceEstimatedSurfaceTemperatureKelvin < 240;
  const iceTectonics = profile.cryotectonics01;
  // A high tidal index alone cannot paint a frozen ice-rich body incandescent.
  const silicate = profile.silicateVolcanism01;
  const renewal = profile.resurfacing01;
  const craterRetention = profile.craterRetention01;

  const seed = moon.presentationSeedUint32;
  const impacts: ImpactD[] = [];
  const count = Math.round((moon.shapeClass === 'MINOR_IRREGULAR' ? 94 : 72) * (0.50 + 0.50 * craterRetention));
  for (let i = 0; i < count; i += 1) {
    const center = randomSphere(seed, 0x0100 + 5 * i);
    const size = rand(seed, 0x0101 + 5 * i);
    const angularRadius = (0.018 + (0.14 + 0.13 * profile.basinScale01) * Math.pow(size, 2.6)) *
      (0.82 + 0.3 * (1 - profile.basinScale01));
    impacts.push({ center, angularRadius, thresholdCos: Math.cos(angularRadius * 1.24), depth: 0.48 + 0.52 * rand(seed, 0x0102 + 5 * i) });
  }

  const arcs: FractureArcD[] = [];
  const fractureCount = Math.round(2 + 34 * profile.tectonics01);
  for (let i = 0; i < fractureCount; i += 1) {
    const center = randomSphere(seed ^ 0x9e3779b9, i * 7 + 11);
    const helper = randomSphere(seed ^ 0x85ebca6b, i * 7 + 12);
    const tangent = normalize(cross(center, helper));
    const normal = normalize(cross(center, tangent));
    const halfLength = 0.12 + 0.61 * rand(seed, i * 7 + 13);
    arcs.push({
      center, tangent, normal,
      halfLength,
      thresholdCos: Math.cos(halfLength + 0.09),
      width: 0.008 + 0.012 * rand(seed, i * 7 + 14),
      phase: rand(seed, i * 7 + 15) * 2 * Math.PI,
      phaseSecondary: rand(seed, i * 7 + 16) * 2 * Math.PI,
      bendAmplitude: 0.023 + 0.026 * rand(seed, i * 7 + 17),
      intensity: 0.62 + 0.34 * rand(seed, i * 7 + 18),
      branchBias: -0.16 + 0.32 * rand(seed, i * 7 + 19),
    });
  }
  return Object.freeze({
    visualProfile: profile,
    craterRetention01: craterRetention,
    iceTectonics01: iceTectonics,
    silicateActivity01: silicate,
    crustRenewal01: renewal,
    iceRichness01: ice,
    impactCenters: Object.freeze(impacts),
    fractureArcs: Object.freeze(arcs),
  });
}

/** Sampling coordinates are Cartesian, hence no longitudinal seams or pole pinches. */
export function sampleMoonTerrainD(
  direction: Vec3D,
  moon: SystemSceneMoonPresentationV1,
  model: MoonSurfaceMorphologyD,
): { readonly terrain01: number; readonly iceMask01: number; readonly crater01: number;
     readonly fracture01: number; readonly molten01: number; readonly relief01: number;
     readonly province01: number; readonly renewed01: number; readonly ejecta01: number;
     readonly scarp01: number; readonly liquidMask01: number } {
  const seed = moon.presentationSeedUint32;
  const broad = noise3D(direction.x * 3.2, direction.y * 3.2, direction.z * 3.2, seed);
  const region = noise3D(direction.x * 7.1 + 7.4, direction.y * 7.1, direction.z * 7.1, seed ^ 0xa341316c);
  const detail = noise3D(direction.x * 19.0, direction.y * 19.0, direction.z * 19.0, seed ^ 0x31415926);
  const fine = noise3D(direction.x * 41.0, direction.y * 41.0, direction.z * 41.0, seed ^ 0x27182818);
  const terrain = 0.44 * broad + 0.28 * region + 0.20 * detail + 0.08 * fine;
  const profile = model.visualProfile;
  const province = noise3D(direction.x * 2.0 + 14.1, direction.y * 2.0,
    direction.z * 2.0 - 9.3, seed ^ 0x187234ad);
  const plate = noise3D(direction.x * 5.4, direction.y * 5.4 + 11.3,
    direction.z * 5.4, seed ^ 0x2291da78);
  // Broad, warped provinces have identifiable plains and a soft scarp belt.
  // The mask changes the albedo AND crater preservation rather than painting
  // a uniform tint over the old terrain.
  const provinceField = 0.61 * province + 0.39 * plate + 0.09 * (detail - 0.5);
  const renewalCore = smoothstep(0.49, 0.60, provinceField);
  const renewalMask = renewalCore * model.crustRenewal01;
  const renewalScarp = (smoothstep(0.445, 0.51, provinceField) -
    smoothstep(0.58, 0.65, provinceField)) * model.crustRenewal01;
  const provinceMask = smoothstep(0.34, 0.64, 0.61 * province + 0.39 * broad);
  const coverage = moon.presentationIceCoverage01;
  const ice = smoothstep(0.88 - coverage, 1.10 - coverage,
    0.58 * region + 0.42 * broad);

  let craterBowl = 0;
  let craterRim = 0;
  let ejecta = 0;
  for (const impact of model.impactCenters) {
    const dot = direction.x * impact.center.x + direction.y * impact.center.y + direction.z * impact.center.z;
    if (dot < impact.thresholdCos) continue;
    const normalized = Math.acos(clamp(dot, -1, 1)) / impact.angularRadius;
    const bowl = Math.max(0, 1 - normalized * normalized);
    const rim = Math.max(0, 1 - Math.abs(normalized - 1.03) / 0.20);
    const localPreservation = 1 - renewalMask * 0.91;
    craterBowl = Math.max(craterBowl, bowl * impact.depth * localPreservation);
    craterRim = Math.max(craterRim, rim * impact.depth * localPreservation);
    const ejectaRing = Math.max(0, 1 - Math.abs(normalized - 1.38) / 0.50);
    ejecta = Math.max(ejecta, ejectaRing * impact.depth * localPreservation);
  }
  const crater = (craterBowl - 0.49 * craterRim) * model.craterRetention01;

  let fissures = 0;
  for (const arc of model.fractureArcs) {
    const forward = dot3(direction, arc.center);
    if (forward < arc.thresholdCos) continue;
    const along = Math.atan2(dot3(direction, arc.tangent), forward);
    if (Math.abs(along) > arc.halfLength) continue;
    // Smooth multi-scale curvature along each great-circle arc; no abrupt
    // noise offsets, clipped terminals or ruler-straight cross-body stripes.
    const across = Math.asin(clamp(dot3(direction, arc.normal), -1, 1));
    const scaled = along / arc.halfLength;
    const curve = arc.bendAmplitude * (
      0.72 * (Math.sin(3.1 * scaled + arc.phase) - Math.sin(arc.phase)) +
      0.28 * (Math.sin(8.4 * scaled + arc.phaseSecondary) - Math.sin(arc.phaseSecondary))
    );
    const localNoise = noise3D(
      direction.x * 12.8 + arc.phase,
      direction.y * 12.8 + arc.phaseSecondary,
      direction.z * 12.8,
      seed ^ 0x73a9e51d,
    );
    const widthVariation = 0.82 + 0.24 * Math.sin(5.3 * scaled + arc.phaseSecondary) +
      0.16 * (localNoise - 0.5);
    const distance = Math.abs(across - curve);
    // Footprint-aware width: narrow subpixel faults no longer break into
    // isolated dark dashes at the existing 192x96 / 128x64 texture budgets.
    const pixelFootprint = moon.shapeClass === 'MAJOR_PLANETARY' ? 0.019 : 0.028;
    const width = Math.hypot(arc.width * widthVariation, pixelFootprint);
    const stripeCore = 1 - smoothstep(width * 0.18, width * 0.92, distance);
    const stripeShoulder = 1 - smoothstep(width * 0.92, width * 1.95, distance);
    const terminalFade = 1 - smoothstep(0.68, 0.96, Math.abs(scaled));
    const primary = clamp01((0.78 * stripeCore + 0.22 * stripeShoulder) * terminalFade * arc.intensity);
    // Nearby, shorter tributaries fade in smoothly where the host fault bends.
    const branchOrigin = 0.13 + arc.branchBias + 0.20 * Math.sin(arc.phaseSecondary);
    const branchTravel = Math.max(0, scaled - branchOrigin);
    const branchCurve = curve + 0.075 * branchTravel * branchTravel;
    const branchNoise = noise3D(
      direction.x * 15.4 - arc.phaseSecondary,
      direction.y * 15.4 + arc.phase,
      direction.z * 15.4,
      seed ^ 0x41c64e6d,
    );
    const branchWidth = width * (0.58 + 0.24 * branchNoise);
    const branch = (1 - smoothstep(branchWidth * 0.25, branchWidth * 1.18,
      Math.abs(across - branchCurve))) *
      smoothstep(branchOrigin, branchOrigin + 0.24, scaled) *
      (1 - smoothstep(0.60, 0.90, scaled)) *
      (0.30 + 0.24 * branchNoise);
    fissures = Math.max(fissures, Math.max(primary, branch));
  }
  const tectonics = clamp01(0.45 * model.iceTectonics01 + 0.55 * model.crustRenewal01);
  const fracture = fissures * tectonics;
  const scarp = clamp01(fracture * (0.30 + 0.70 * plate) +
    renewalScarp * (0.30 + 0.30 * region));
  const volcanicRegion = smoothstep(0.51, 0.70, 0.52 * province + 0.48 * region);
  const molten = volcanicRegion * model.silicateActivity01 * fissures;
  const liquidMask = profile.liquidVisual01 > 0 ?
    smoothstep(0.53 + (1 - profile.liquidVisual01) * 0.16, 0.68,
      0.65 * (1 - province) + 0.35 * (1 - terrain)) * profile.liquidVisual01 : 0;
  const relief = clamp01(0.50 + (terrain - 0.5) * 0.56 * profile.reliefContrast01 *
    (1 - 0.65 * renewalMask) - crater * 0.33 +
    craterRim * 0.19 + scarp * 0.16 - renewalMask * 0.045 - liquidMask * 0.08);
  return { terrain01: terrain, iceMask01: ice, crater01: crater,
    fracture01: fracture, molten01: molten, relief01: relief,
    province01: provinceMask, renewed01: renewalMask, ejecta01: ejecta,
    scarp01: scarp, liquidMask01: liquidMask };
}

export function moonTextureDirectionD(x: number, y: number, width: number, height: number): Vec3D {
  const lon = (x / (width - 1)) * 2 * Math.PI;
  const lat = (0.5 - y / (height - 1)) * Math.PI;
  const cosLat = Math.cos(lat);
  return { x: cosLat * Math.cos(lon), y: Math.sin(lat), z: cosLat * Math.sin(lon) };
}

function noise3D(x: number, y: number, z: number, seed: number): number {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = fade(x - ix), fy = fade(y - iy), fz = fade(z - iz);
  const a = lerp(hash(ix, iy, iz, seed), hash(ix + 1, iy, iz, seed), fx);
  const b = lerp(hash(ix, iy + 1, iz, seed), hash(ix + 1, iy + 1, iz, seed), fx);
  const c = lerp(hash(ix, iy, iz + 1, seed), hash(ix + 1, iy, iz + 1, seed), fx);
  const d = lerp(hash(ix, iy + 1, iz + 1, seed), hash(ix + 1, iy + 1, iz + 1, seed), fx);
  return lerp(lerp(a, b, fy), lerp(c, d, fy), fz);
}
function hash(x: number, y: number, z: number, seed: number): number {
  return (mix((seed ^ Math.imul(x, 0x1f123bb5) ^ Math.imul(y, 0x5f356495) ^ Math.imul(z, 0x9e3779b9)) >>> 0) >>> 0) / 4294967295;
}
function randomSphere(seed: number, index: number): Vec3D {
  const longitude = rand(seed, index * 2) * 2 * Math.PI;
  const z = rand(seed, index * 2 + 1) * 2 - 1;
  const r = Math.sqrt(1 - z * z);
  return { x: r * Math.cos(longitude), y: z, z: r * Math.sin(longitude) };
}
function rand(seed: number, salt: number): number { return mix(seed ^ Math.imul(salt + 1, 0x85ebca6b)) / 4294967295; }
function mix(number: number): number {
  let n = number >>> 0;
  n ^= n >>> 16; n = Math.imul(n, 0x7feb352d);
  n ^= n >>> 15; n = Math.imul(n, 0x846ca68b);
  n ^= n >>> 16; return n >>> 0;
}
function cross(a: Vec3D, b: Vec3D): Vec3D {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}
function normalize(v: Vec3D): Vec3D {
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}
function dot3(a: Vec3D, b: Vec3D): number { return a.x * b.x + a.y * b.y + a.z * b.z; }
function fade(n: number): number { return n * n * (3 - 2 * n); }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function smoothstep(low: number, high: number, x: number): number {
  return 1 - fade(clamp((x - high) / (low - high), 0, 1));
}
function clamp01(n: number): number { return clamp(n, 0, 1); }
function clamp(n: number, a: number, b: number): number { return Math.max(a, Math.min(b, n)); }
