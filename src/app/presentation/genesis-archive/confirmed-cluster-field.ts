import {
  ArchiveGalacticObjectKnowledgeLevel,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';
import {
  GlobularClusterRenderModelBuilder,
  type GlobularClusterRenderModel,
} from './globular-cluster-render-model';
import {
  OpenClusterRenderModelBuilder,
  type OpenClusterRenderModel,
} from './open-cluster-render-model';

export type ConfirmedClusterKind = 'OPEN' | 'GLOBULAR';

export interface ConfirmedClusterField {
  readonly kind: ConfirmedClusterKind;
  readonly sampleCount: number;
  readonly positions: Float32Array;
  readonly projectedPositions: Float32Array;
  readonly colors: Float32Array;
  readonly sizes: Float32Array;
  readonly xExtent: number;
  readonly yExtent: number;
  readonly zExtent: number;
  readonly initialZoom: number;
}

const GLOBULAR_SAMPLES = 3900;
const OPEN_SAMPLES = 1750;

const TEMPERATURE_COLORS = Object.freeze([
  [1.00, 0.44, 0.28],
  [1.00, 0.70, 0.45],
  [1.00, 0.90, 0.72],
  [0.93, 0.96, 1.00],
  [0.58, 0.78, 1.00],
] as const);

interface ClusterPoint {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly size: number;
  readonly temperatureBand: number;
  readonly luminosity: number;
}

interface OpenAnchor {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly prominence: number;
}

export function buildConfirmedClusterField(
  descriptor: ArchiveGalacticObjectRenderDescriptor,
  kind: ConfirmedClusterKind,
): ConfirmedClusterField {
  if (descriptor.knowledgeLevel !== ArchiveGalacticObjectKnowledgeLevel.CONFIRMED) {
    throw new RangeError('The interactive 3D cluster viewer is restricted to CONFIRMED knowledge.');
  }

  const globular = kind === 'GLOBULAR'
    ? GlobularClusterRenderModelBuilder.build(descriptor)
    : null;

  const open = kind === 'OPEN'
    ? OpenClusterRenderModelBuilder.build(descriptor)
    : null;

  const count = globular === null ? OPEN_SAMPLES : GLOBULAR_SAMPLES;
  const positions = new Float32Array(count * 3);
  const projectedPositions = new Float32Array(count * 2);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  const random = seededRandom(`${descriptor.seed}/CONFIRMED-CLUSTER-3D-V2.3/${kind}`);
  const openAnchors = open === null ? [] : buildOpenAnchors(open, random);

  let maxAbsX = 0;
  let maxAbsY = 0;
  let maxAbsZ = 0;

  for (let index = 0; index < count; index += 1) {
    const point = globular !== null
      ? buildGlobularPoint(globular, random)
      : buildOpenPoint(open!, openAnchors, random, index);

    projectedPositions[index * 2] = point.x;
    projectedPositions[index * 2 + 1] = point.y;
    positions[index * 3] = point.x;
    positions[index * 3 + 1] = point.y;
    positions[index * 3 + 2] = point.z;

    maxAbsX = Math.max(maxAbsX, Math.abs(point.x));
    maxAbsY = Math.max(maxAbsY, Math.abs(point.y));
    maxAbsZ = Math.max(maxAbsZ, Math.abs(point.z));

    const baseColor = TEMPERATURE_COLORS[point.temperatureBand]!;
    const luminosity = point.luminosity;
    colors[index * 3] = baseColor[0] * luminosity;
    colors[index * 3 + 1] = baseColor[1] * luminosity;
    colors[index * 3 + 2] = baseColor[2] * luminosity;
    sizes[index] = point.size;
  }

  const xExtent = Math.max(0.9, maxAbsX * 1.08);
  const yExtent = Math.max(0.54, maxAbsY * 1.08);
  const zExtent = Math.max(0.18, maxAbsZ * 1.06);
  const initialZoom = 6.0;

  return Object.freeze({
    kind,
    sampleCount: count,
    positions,
    projectedPositions,
    colors,
    sizes,
    xExtent,
    yExtent,
    zExtent,
    initialZoom,
  });
}

function buildGlobularPoint(
  model: GlobularClusterRenderModel,
  random: () => number,
): ClusterPoint {
  const coreChance = 0.68 + model.centralConcentration * 0.22;
  const inCore = random() < coreChance;
  const radialExponent = inCore
    ? 1.9 + model.centralConcentration * 1.8
    : 0.58 + (1 - model.centralConcentration) * 0.50;
  const radius = Math.pow(random(), radialExponent) * model.tidalExtent;

  const phi = random() * Math.PI * 2;
  const cosTheta = 1 - random() * 2;
  const sinTheta = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta));

  let x = radius * sinTheta * Math.cos(phi);
  let y = radius * sinTheta * Math.sin(phi);
  let z = radius * cosTheta;

  const xyEllipticity = model.ellipticity * 0.18;
  x *= 1 + xyEllipticity;
  y *= 1 - xyEllipticity * 0.7;
  z *= 1 - xyEllipticity * 0.25;

  const tidalBias = model.tidalStretch * 0.08;
  x += Math.sign(x || 1) * radius * radius * tidalBias * 0.08;
  y += (random() - 0.5) * model.granularCoreStrength * 0.015;
  z += (random() - 0.5) * model.granularCoreStrength * 0.015;

  const rotated = rotate2d(x, y, model.orientationRadians);
  x = rotated.x;
  y = rotated.y;

  const colorSample = random();
  const blueBias = model.blueHorizontalBranchBias * 0.22;
  const redBias = model.brightGiantBias * 0.30;
  const temperatureBand = colorSample < redBias ? 0
    : colorSample < redBias + 0.24 ? 1
      : colorSample < redBias + 0.55 ? 2
        : colorSample < 1 - blueBias ? 3 : 4;

  const prominentChance = 0.018 + model.brightGiantBias * 0.11;
  const coreBoost = inCore ? 0.22 : 0.0;
  const size = random() < prominentChance
    ? 3.9 + random() * 3.1 + coreBoost * 1.8
    : 0.42 + Math.pow(random(), 1.38) * (1.28 + coreBoost * 1.22);

  const luminosity = clamp(0.58 + random() * 0.32 + coreBoost * 0.08, 0.50, 0.96);

  return Object.freeze({ x, y, z, size, temperatureBand, luminosity });
}

function buildOpenAnchors(
  model: OpenClusterRenderModel,
  random: () => number,
): readonly OpenAnchor[] {
  const anchorCount = Math.max(18, Math.min(60, Math.round(18 + model.memberRichness * 40)));
  const anchors: OpenAnchor[] = [];
  const branchCount = model.morphologyFamily === 'MULTI_CORE'
    ? 3
    : model.chainStrength > 0.42 || model.subclusterStrength > 0.46
      ? 2
      : 1;

  for (let index = 0; index < anchorCount; index += 1) {
    const t = (index + random() * 0.25) / Math.max(1, anchorCount - 1);
    const branchIndex = branchCount === 1 ? 0 : Math.floor(random() * branchCount);
    const branchOffset = branchCount === 1
      ? 0
      : branchCount === 2
        ? (branchIndex === 0 ? -0.20 : 0.20)
        : (branchIndex - 1) * 0.22;

    const majorExtent = model.apparentExtent * (0.46 + model.elongationStrength * 0.68);
    const minorExtent = model.apparentExtent * (0.10 + (1 - model.elongationStrength) * 0.20);

    let x: number;
    let y: number;

    if (model.chainStrength > 0.40) {
      x = (t - 0.5) * 2 * majorExtent;
      y = branchOffset * model.apparentExtent * 0.82
        + Math.sin((t * 2.35 + branchIndex * 0.44 + model.structureSeedY * 0.35) * Math.PI)
          * minorExtent * (0.42 + model.chainStrength * 0.40);
    } else {
      const theta = random() * Math.PI * 2;
      const radius = Math.pow(random(), 0.72 + model.concentrationBias * 0.34) * model.apparentExtent * 0.55;
      x = Math.cos(theta) * radius * (1.16 + model.elongationStrength * 0.55);
      y = Math.sin(theta) * radius * (0.82 - model.elongationStrength * 0.24) + branchOffset * model.apparentExtent * 0.24;
    }

    x += (random() - 0.5) * model.asymmetryStrength * model.apparentExtent * 0.22;
    y += (random() - 0.5) * model.asymmetryStrength * model.apparentExtent * 0.14;

    const layerPhase = branchCount === 1 ? (t - 0.5) : branchIndex - (branchCount - 1) / 2;
    const zBase = layerPhase * model.apparentExtent * (0.36 + model.subclusterStrength * 0.22);
    const zRibbon = Math.sin((t * 1.9 + branchIndex * 0.7 + model.structureSeedX * 0.25) * Math.PI)
      * model.apparentExtent * (0.22 + model.chainStrength * 0.16);
    const z = zBase + zRibbon + (random() - 0.5) * model.apparentExtent * 0.08;

    const rotated = rotate2d(x * model.structureAspect, y, model.orientationRadians);
    anchors.push(Object.freeze({
      x: rotated.x,
      y: rotated.y,
      z,
      prominence: 0.58 + random() * 0.42,
    }));
  }

  return anchors;
}

function buildOpenPoint(
  model: OpenClusterRenderModel,
  anchors: readonly OpenAnchor[],
  random: () => number,
  index: number,
): ClusterPoint {
  const anchor = anchors[index % Math.max(1, anchors.length)] ?? anchors[0]!;
  const brightAnchorChance = 0.05 + model.brightMemberBias * 0.10;
  const isBrightAnchor = index < anchors.length || random() < brightAnchorChance;
  const isHalo = !isBrightAnchor && random() < model.haloStrength * 0.08;

  let x = anchor.x;
  let y = anchor.y;
  let z = anchor.z;

  if (isHalo) {
    const angle = random() * Math.PI * 2;
    const radius = model.apparentExtent * (0.78 + random() * 0.42);
    x = Math.cos(angle) * radius * (0.92 + model.elongationStrength * 0.28);
    y = Math.sin(angle) * radius * 0.52;
    const rotated = rotate2d(x, y, model.orientationRadians);
    x = rotated.x;
    y = rotated.y;
    z = (random() - 0.5) * model.apparentExtent * 0.32;
  } else if (!isBrightAnchor) {
    const siblingSpread = model.apparentExtent * (0.018 + anchor.prominence * 0.035);
    x += gaussian(random) * siblingSpread * (1.18 + model.elongationStrength * 0.16);
    y += gaussian(random) * siblingSpread * (0.92 - model.elongationStrength * 0.14);
    z += gaussian(random) * model.apparentExtent * (0.11 + model.subclusterStrength * 0.07);
  } else {
    x += gaussian(random) * model.apparentExtent * 0.010;
    y += gaussian(random) * model.apparentExtent * 0.010;
    z += gaussian(random) * model.apparentExtent * 0.050;
  }

  const colorSample = random();
  const hotBias = model.hotStarBias * 0.60;
  const warmBias = model.warmStarBias * 0.42;
  const temperatureBand = colorSample < hotBias ? 4
    : colorSample < hotBias + 0.28 ? 3
      : colorSample < hotBias + 0.28 + warmBias ? 2
        : colorSample < 0.94 ? 1 : 0;

  const size = isBrightAnchor
    ? 3.0 + random() * 3.5
    : isHalo
      ? 0.28 + Math.pow(random(), 1.30) * 0.44
      : 0.26 + Math.pow(random(), 1.42) * 0.40;

  const luminosity = isBrightAnchor
    ? clamp(0.78 + random() * 0.18 + model.hotStarBias * 0.05, 0.70, 0.98)
    : isHalo
      ? clamp(0.22 + random() * 0.10, 0.18, 0.34)
      : clamp(0.24 + random() * 0.12, 0.20, 0.36);

  return Object.freeze({ x, y, z, size, temperatureBand, luminosity });
}

function rotate2d(x: number, y: number, radians: number): { readonly x: number; readonly y: number } {
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return Object.freeze({
    x: x * cosine - y * sine,
    y: x * sine + y * cosine,
  });
}

function gaussian(random: () => number): number {
  const u = Math.max(1e-6, random());
  const v = Math.max(1e-6, random());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function seededRandom(seed: string): () => number {
  const hash = hashWords(seed);
  let a = hash[0] || 0x9e3779b9;
  let b = hash[1] || 0x243f6a88;
  let c = hash[2] || 0xb7e15162;
  let d = hash[3] || 0x8aed2a6b;
  return () => {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    const t = (a + b + d) >>> 0;
    d = (d + 1) >>> 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) >>> 0;
    c = ((c << 21) | (c >>> 11)) >>> 0;
    c = (c + t) >>> 0;
    return (t >>> 0) / 0x100000000;
  };
}

function hashWords(seed: string): Uint32Array {
  const output = new Uint32Array(4);
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  let h3 = 0x243f6a88;
  let h4 = 0xb7e15162;
  for (let index = 0; index < seed.length; index += 1) {
    const code = seed.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 16777619);
    h2 = Math.imul(h2 ^ code, 2246822519);
    h3 = Math.imul(h3 ^ code, 3266489917);
    h4 = Math.imul(h4 ^ code, 668265263);
  }
  output[0] = h1 >>> 0;
  output[1] = h2 >>> 0;
  output[2] = h3 >>> 0;
  output[3] = h4 >>> 0;
  return output;
}
