/**
 * GENESIS 38.2g.c — anatomía facial y piel biológica con LOD de microdetalle.
 * Mantiene la estabilidad 38.2g.a/b y añade ojo hundido en su cavidad SDF,
 * pigmentación facial integrada, microrelieve filtrado y variación cutánea.
 * Reconstrucción hipotética, NO imagen observada.
 */
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import type { Vida38HumanoidAnatomy, Vida38HumanoidRawMesh } from './vida38-humanoid-organic-field-38-2e';
import { deriveVida38HumanoidFaceLandmarks38GC, measureVida38HumanoidMeshV1 } from './vida38-humanoid-organic-field-38-2e';

export const VIDA38_HUMANOID_PBR_REVISION = 'VIDA.38.2g.c/organic-integument-facial-anatomy/v1' as const;

const VERTEX_DECLARATIONS = `
varying vec3 vVida38OrganicPosition;
`;
const VERTEX_BODY = `
vVida38OrganicPosition = position;
`;

/**
 * Coordenadas procedurales estables en espacio anatómico local, con máscaras
 * regionales derivadas de hitos anatómicos para evitar shimmering y enriquecer
 * rostro, torso y extremidades sin depender de la cámara.
 */
export const VIDA38_HUMANOID_PBR_FRAGMENT_DECLARATIONS = `
varying vec3 vVida38OrganicPosition;
uniform vec3 uVida38PigmentPrimary;
uniform vec3 uVida38PigmentSecondary;
uniform float uVida38OrganicSeed;
uniform float uVida38Pattern;
uniform float uVida38Covering;
uniform float uVida38EyeHeight;
uniform float uVida38SkinDetail;
uniform float uVida38MetersPerUnit;
uniform float uVida38BodyLengthMeters;
uniform float uVida38HeadCenterY;
uniform float uVida38HeadRadius;
uniform float uVida38ShoulderWidth;
uniform float uVida38HipWidth;
uniform float uVida38TorsoLength;
uniform float uVida38ArmReach;
uniform float uVida38LegLength;
uniform float uVida38JawWidth;
uniform float uVida38FaceProjection;

float vida38Hash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}
float vida38Noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(vida38Hash(i), vida38Hash(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(vida38Hash(i + vec3(0.0, 1.0, 0.0)), vida38Hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(vida38Hash(i + vec3(0.0, 0.0, 1.0)), vida38Hash(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(vida38Hash(i + vec3(0.0, 1.0, 1.0)), vida38Hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}
float vida38Fbm(vec3 p) {
  float v = 0.0;
  float w = 0.5;
  for (int i = 0; i < 5; i++) {
    v += w * vida38Noise(p);
    p = p * 1.97 + vec3(9.4, 4.1, 7.6);
    w *= 0.5;
  }
  return v;
}
float vida38Worley(vec3 p) {
  vec3 cell = floor(p);
  vec3 f = fract(p);
  float nearest = 4.0;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    vec3 off = vec3(float(x), float(y), float(z));
    vec3 candidate = off + vec3(
      vida38Hash(cell + off + vec3(11.0)),
      vida38Hash(cell + off + vec3(23.0)),
      vida38Hash(cell + off + vec3(37.0))) - f;
    nearest = min(nearest, dot(candidate, candidate));
  }
  return sqrt(nearest);
}
float vida38AA(float value, float threshold, float softness) {
  float width = max(fwidth(value) * softness, 0.0035);
  return smoothstep(threshold - width, threshold + width, value);
}
float vida38AABand(float value, float low, float high, float softness) {
  return vida38AA(value, low, softness) * (1.0 - vida38AA(value, high, softness));
}
vec3 vida38StableCoord(vec3 point) {
  float meterScale = max(uVida38MetersPerUnit, 0.000001);
  vec3 meters = point * meterScale;
  float bodyScale = max(uVida38BodyLengthMeters, 0.25);
  vec3 anisotropy = vec3(0.84, 1.0, 0.92 + clamp(bodyScale * 0.04, 0.0, 0.09));
  return meters * anisotropy;
}
float vida38FaceRegion(vec3 point) {
  float headBottom = uVida38HeadCenterY - uVida38HeadRadius * 1.06;
  float vertical = vida38AA(point.y, headBottom, 1.2);
  float frontal = vida38AA(point.z, -0.03, 1.15);
  vec2 ellipse = vec2(point.x / max(0.001, uVida38HeadRadius * 0.96), (point.y - uVida38HeadCenterY) / max(0.001, uVida38HeadRadius * 1.12));
  float radial = 1.0 - smoothstep(0.72, 1.26, length(ellipse));
  return clamp(vertical * frontal * radial, 0.0, 1.0);
}
float vida38TorsoRegion(vec3 point) {
  float shoulderY = uVida38LegLength + uVida38TorsoLength * 1.03;
  float hipY = uVida38LegLength + uVida38TorsoLength * 0.14;
  float vertical = vida38AABand(point.y, hipY - 0.08, shoulderY + 0.02, 1.15);
  float widthProfile = 1.0 - smoothstep(uVida38ShoulderWidth * 0.86, uVida38ShoulderWidth * 1.48, abs(point.x));
  float depthProfile = 1.0 - smoothstep(0.15, 0.42, abs(point.z));
  return clamp(vertical * widthProfile * depthProfile, 0.0, 1.0);
}
float vida38LimbRegion(vec3 point) {
  float legMask = (1.0 - smoothstep(uVida38HipWidth * 0.40, uVida38HipWidth * 1.25, abs(point.x)))
    * (1.0 - vida38AA(point.y, uVida38LegLength + 0.08, 1.0));
  float armBand = vida38AABand(point.y, uVida38LegLength + uVida38TorsoLength * 0.28, uVida38LegLength + uVida38TorsoLength * 0.98, 1.0);
  float armMask = armBand * vida38AA(abs(point.x), uVida38ShoulderWidth * 0.76, 1.0);
  return clamp(max(legMask, armMask), 0.0, 1.0);
}
float vida38ExtremityRegion(vec3 point) {
  float footMask = (1.0 - vida38AA(point.y, 0.26, 1.2)) * (1.0 - smoothstep(uVida38HipWidth * 0.32, uVida38HipWidth * 1.05, abs(point.x)));
  float handYBand = vida38AABand(point.y, uVida38LegLength + uVida38TorsoLength * 0.18, uVida38LegLength + uVida38TorsoLength * 0.90, 1.1);
  float handMask = handYBand * vida38AA(abs(point.x), uVida38ShoulderWidth * 1.08, 1.0);
  return clamp(max(footMask, handMask), 0.0, 1.0);
}
float vida38FacialPigmentContribution(vec3 point) {
  float face = vida38FaceRegion(point);
  float browBand = vida38AABand(point.y, uVida38HeadCenterY + uVida38HeadRadius * 0.04, uVida38HeadCenterY + uVida38HeadRadius * 0.33, 1.4)
    * vida38AA(point.z, 0.02, 1.1);
  float cheekMask = face * vida38AABand(abs(point.x), uVida38JawWidth * 0.30, uVida38JawWidth * 0.78, 1.4)
    * vida38AABand(point.y, uVida38HeadCenterY - uVida38HeadRadius * 0.40, uVida38HeadCenterY + uVida38HeadRadius * 0.03, 1.2);
  float muzzleMask = face * vida38AABand(point.y, uVida38HeadCenterY - uVida38HeadRadius * 0.58, uVida38HeadCenterY - uVida38HeadRadius * 0.08, 1.3)
    * vida38AA(point.z, uVida38FaceProjection * 0.28 - 0.02, 1.1);
  float noseRidge = face * (1.0 - smoothstep(0.0, uVida38JawWidth * 0.26, abs(point.x)))
    * vida38AABand(point.y, uVida38HeadCenterY - uVida38HeadRadius * 0.14, uVida38HeadCenterY + uVida38HeadRadius * 0.34, 1.2)
    * vida38AA(point.z, uVida38FaceProjection * 0.18 - 0.03, 1.2);
  return clamp(browBand * 0.18 + cheekMask * 0.15 + muzzleMask * 0.22 + noseRidge * 0.12, 0.0, 0.44);
}
vec3 vida38RegionalChromaticVariation(vec3 point, float coverage) {
  float face = vida38FaceRegion(point);
  float torso = vida38TorsoRegion(point);
  float limbs = vida38LimbRegion(point);
  float extremities = vida38ExtremityRegion(point);
  float warmNoise = vida38Fbm(vida38StableCoord(point) * 2.2 + vec3(7.1, 3.5, uVida38OrganicSeed * 0.009));
  vec3 base = mix(uVida38PigmentPrimary, uVida38PigmentSecondary, coverage);
  vec3 faceTint = mix(base, uVida38PigmentSecondary, 0.22 + 0.08 * warmNoise);
  vec3 torsoTint = mix(base, uVida38PigmentPrimary, 0.10 + 0.06 * warmNoise);
  vec3 limbTint = mix(base, uVida38PigmentSecondary, 0.10);
  vec3 extremityTint = mix(base * 0.98, uVida38PigmentSecondary * 0.92, 0.18);
  vec3 tinted = base;
  tinted = mix(tinted, torsoTint, torso * 0.26);
  tinted = mix(tinted, limbTint, limbs * 0.20);
  tinted = mix(tinted, extremityTint, extremities * 0.18);
  tinted = mix(tinted, faceTint, face * 0.36);
  return tinted;
}
float vida38RegionalRoughness(vec3 point) {
  float face = vida38FaceRegion(point);
  float torso = vida38TorsoRegion(point);
  float limbs = vida38LimbRegion(point);
  float extremities = vida38ExtremityRegion(point);
  return face * -0.05 + torso * 0.02 + limbs * 0.03 + extremities * 0.04;
}

float vida38Pigment(vec3 point) {
  vec3 p = vida38StableCoord(point) + vec3(uVida38OrganicSeed * 0.061, uVida38OrganicSeed * 0.027, uVida38OrganicSeed * 0.019);
  vec3 macroWarp = vec3(
    vida38Fbm(p * 0.85 + vec3(12.0, 4.0, 8.0)),
    vida38Fbm(p * 0.85 + vec3(20.0, 7.0, 2.0)),
    vida38Fbm(p * 0.85 + vec3(31.0, 9.0, 4.0))) - vec3(0.5);
  vec3 q = p + macroWarp * 0.34;
  float macro = vida38Fbm(q * 1.10 + vec3(1.0, 4.0, 8.0));
  float regional = vida38Fbm(q * 2.20 + vec3(9.0, 2.0, 5.0));
  float detail = vida38Fbm(q * 3.90 + vec3(2.0, 11.0, 3.0));
  float pattern = 0.07;
  if (uVida38Pattern < 0.5) {
    pattern = 0.03 + macro * 0.14 + regional * 0.05;
  } else if (uVida38Pattern < 1.5) {
    float wave = sin(q.y * 5.6 + q.x * 2.1 + macroWarp.z * 3.1 + regional * 3.2);
    float bandWidth = max(fwidth(wave) * 1.5, 0.055);
    float bandMask = 1.0 - smoothstep(0.56 - bandWidth, 0.56 + bandWidth, abs(wave));
    pattern = 0.05 + bandMask * 0.38 + macro * 0.08;
  } else if (uVida38Pattern < 2.5) {
    float spots = 1.0 - vida38Worley(q * 2.00 + vec3(2.1, 6.4, 8.2));
    float spotWidth = max(fwidth(spots) * 1.6, 0.044);
    float spotMask = smoothstep(0.31 - spotWidth, 0.31 + spotWidth, spots)
      * (1.0 - smoothstep(0.63 - spotWidth, 0.63 + spotWidth, spots));
    pattern = 0.04 + spotMask * 0.44 + regional * 0.10;
  } else {
    float fluid = macro * 0.58 + regional * 0.30 + detail * 0.12;
    // La cobertura es una mezcla de melanina, no una mancha de pintura plana.
    float macroFootprint = max(fwidth(fluid) * 1.6, 0.035);
    float cloudMask = smoothstep(0.53 - macroFootprint, 0.53 + macroFootprint, fluid);
    pattern = 0.04 + cloudMask * 0.42;
  }
  float dorsal = vida38AA(-point.z, 0.02, 1.4) * 0.06;
  float facialIntegration = vida38FacialPigmentContribution(point) * 0.18;
  float regionalBias = vida38TorsoRegion(point) * 0.04 + vida38LimbRegion(point) * 0.03;
  return clamp(pattern + dorsal + facialIntegration + regionalBias, 0.0, 0.76);
}
float vida38MicroscopicLod(vec3 point) {
  vec3 stable = vida38StableCoord(point);
  // Derivadas en unidades métricas: detalle cercano, filtrado a distancia.
  float footprint = max(length(dFdx(stable)), length(dFdy(stable)));
  return 1.0 - smoothstep(0.004, 0.029, footprint);
}
float vida38CutaneousMottle(vec3 point) {
  vec3 p = vida38StableCoord(point);
  vec3 warp = vec3(vida38Noise(p * 2.3 + vec3(4.1, 1.7, 3.2)),
                   vida38Noise(p * 2.4 + vec3(3.3, 8.1, 2.7)),
                   vida38Noise(p * 2.1 + vec3(7.4, 4.3, 1.8)));
  return vida38Fbm(p * 5.4 + (warp - vec3(0.5)) * 0.30 + vec3(uVida38OrganicSeed * 0.01));
}
float vida38BiologicalRelief(vec3 point) {
  vec3 p = vida38StableCoord(point);
  float face = vida38FaceRegion(point);
  float torso = vida38TorsoRegion(point);
  float limbs = vida38LimbRegion(point);
  float extremities = vida38ExtremityRegion(point);
  float microskin = vida38Fbm(p * 8.4 + vec3(uVida38OrganicSeed * 0.013));
  float relief = 0.0;
  if (uVida38Covering < 0.5) {
    float pores = 1.0 - vida38Worley(p * 5.6 + vec3(5.0, 2.0, 7.0));
    float poreMask = vida38AABand(pores, 0.34, 0.61, 1.15);
    float facialWrinkleWave = 0.5 + 0.5 * sin(p.y * 15.0 + p.x * 6.2 + vida38Fbm(p * 2.2) * 1.8);
    float facialWrinkles = face * vida38AA(facialWrinkleWave, 0.70, 1.15) * 0.10;
    float torsoGrain = torso * (vida38Fbm(p * 3.2 + vec3(1.0, 7.0, 2.0)) - 0.5) * 0.10;
    float limbStriation = limbs * vida38AA(0.5 + 0.5 * sin(p.y * 19.0 + p.z * 6.0 + p.x * 2.4), 0.67, 1.05) * 0.08;
    relief = microskin * 0.18 + poreMask * mix(0.10, 0.17, face + torso * 0.4) + facialWrinkles + torsoGrain + limbStriation;
  } else if (uVida38Covering < 1.5) {
    vec3 scaleField = p * 4.0;
    scaleField.x += fract(floor(scaleField.y * 1.6) * 0.5) * 0.34;
    float scaleCells = 1.0 - vida38Worley(scaleField + vec3(2.0, 5.0, 1.0));
    float plateMask = vida38AABand(scaleCells, 0.31, 0.70, 1.25);
    float plateBias = torso * 0.06 + limbs * 0.10 + face * 0.05;
    float plateRidge = torso * vida38AA(0.5 + 0.5 * sin(p.y * 9.2 + p.x * 3.4), 0.71, 1.05) * 0.07;
    relief = microskin * 0.12 + plateMask * (0.13 + plateBias) + plateRidge;
  } else if (uVida38Covering < 2.5) {
    float fiberFlow = 0.5 + 0.5 * sin(p.y * 28.0 + p.x * 7.0 + vida38Fbm(p * 2.6) * 2.1);
    float undercoat = vida38Fbm(p * 5.2 + vec3(3.0, 2.0, 9.0));
    float mane = face * vida38AA(0.5 + 0.5 * sin(p.y * 18.0 + p.z * 10.0), 0.69, 1.15) * 0.07;
    relief = microskin * 0.14 + vida38AA(fiberFlow, 0.66, 1.1) * 0.13 + (undercoat - 0.5) * (torso * 0.08 + limbs * 0.06) + mane;
  } else if (uVida38Covering < 3.5) {
    float vane = 0.5 + 0.5 * sin(p.y * 24.0 + p.x * 5.6 + p.z * 4.0);
    float rib = 0.5 + 0.5 * sin(p.y * 43.0 + p.x * 1.8);
    float contour = torso * 0.08 + limbs * 0.11;
    relief = microskin * 0.12 + vida38AA(vane, 0.69, 1.1) * 0.09 + vida38AA(rib, 0.73, 1.0) * contour;
  } else {
    float membrane = vida38Fbm(p * 4.2 + vec3(9.0, 3.0, 2.0));
    float vein = 0.5 + 0.5 * sin(p.y * 11.0 + p.x * 9.0 + membrane * 2.2);
    relief = microskin * 0.14 + torso * (membrane - 0.5) * 0.09 + limbs * vida38AA(vein, 0.70, 1.05) * 0.08;
  }
  // El microrelieve desaparece por encima de la frecuencia de Nyquist.
  // La forma anatómica macro continúa en la malla SDF independientemente del LOD.
  return relief * vida38MicroscopicLod(point);
}
`;

export const VIDA38_HUMANOID_PBR_COLOR_FRAGMENT = `
#include <color_fragment>
float vida38Coverage = vida38Pigment(vVida38OrganicPosition);
float vida38LargeDetail = vida38Fbm(vida38StableCoord(vVida38OrganicPosition) * 1.45 + vec3(uVida38OrganicSeed * 0.009));
float vida38Warmth = 0.97 + (vida38LargeDetail - 0.5) * 0.07;
vec3 vida38BasePigment = vida38RegionalChromaticVariation(vVida38OrganicPosition, vida38Coverage);
float vida38FacialPigment = vida38FacialPigmentContribution(vVida38OrganicPosition);
vec3 vida38FacialAccent = mix(vida38BasePigment, uVida38PigmentSecondary * 0.92, vida38FacialPigment);
float vida38Subsurface = 0.96
  + vida38FaceRegion(vVida38OrganicPosition) * 0.035
  + vida38TorsoRegion(vVida38OrganicPosition) * 0.020
  - vida38ExtremityRegion(vVida38OrganicPosition) * 0.015;
// Microvariaciones cutáneas suaves y ancladas al cuerpo: incluso en SOLID.
float vida38Cutaneous = vida38CutaneousMottle(vVida38OrganicPosition);
float vida38MicroWeight = vida38MicroscopicLod(vVida38OrganicPosition);
float vida38RegionalTint = (vida38Cutaneous - 0.5) * (0.115 + 0.025 * vida38MicroWeight);
float vida38Capillary = vida38FaceRegion(vVida38OrganicPosition) *
  (vida38Cutaneous - 0.5) * 0.055;
vec3 vida38Epidermal = mix(vida38BasePigment, vida38FacialAccent, vida38FacialPigment * 0.85);
vida38Epidermal *= vec3(1.0 + vida38RegionalTint + vida38Capillary * 0.55,
                        1.0 + vida38RegionalTint + vida38Capillary * 0.22,
                        1.0 + vida38RegionalTint - vida38Capillary * 0.19);
diffuseColor.rgb *= vida38Epidermal * vida38Warmth * vida38Subsurface;
`;

export const VIDA38_HUMANOID_PBR_ROUGHNESS_FRAGMENT = `
#include <roughnessmap_fragment>
float vida38RoughNoise = vida38Fbm(vida38StableCoord(vVida38OrganicPosition) * 2.45 + vec3(2.3, 1.7, uVida38OrganicSeed * 0.017));
float vida38RegionalRough = vida38RegionalRoughness(vVida38OrganicPosition);
float vida38SkinLod = vida38MicroscopicLod(vVida38OrganicPosition);
float vida38CutaneousRough = vida38CutaneousMottle(vVida38OrganicPosition);
roughnessFactor=clamp(roughnessFactor + vida38RegionalRough +
  (vida38RoughNoise - 0.5) * 0.055 +
  (vida38CutaneousRough - 0.5) * 0.07 * vida38SkinLod, 0.59, 0.96);
`;

export const VIDA38_HUMANOID_PBR_NORMAL_FRAGMENT = `
#include <normal_fragment_maps>
float vida38FineHeight = vida38BiologicalRelief(vVida38OrganicPosition);
vec3 vida38Dpdx = dFdx(-vViewPosition);
vec3 vida38Dpdy = dFdy(-vViewPosition);
vec3 vida38R1 = cross(vida38Dpdy, normal);
vec3 vida38R2 = cross(normal, vida38Dpdx);
float vida38Det = dot(vida38Dpdx, vida38R1);
vec3 vida38Gradient = (dFdx(vida38FineHeight) * vida38R1 + dFdy(vida38FineHeight) * vida38R2);
normal = normalize(normal - sign(vida38Det) * vida38Gradient * uVida38SkinDetail / max(abs(vida38Det), 0.000001));
`;

export function buildVida38HumanoidPbrShader38G(): Readonly<{
  vertexCommon:string;vertexBody:string;fragmentCommon:string;
  colorFragment:string;roughnessFragment:string;normalFragment:string;
}> {
  return {
    vertexCommon: VERTEX_DECLARATIONS,
    vertexBody: VERTEX_BODY,
    fragmentCommon: VIDA38_HUMANOID_PBR_FRAGMENT_DECLARATIONS,
    colorFragment: VIDA38_HUMANOID_PBR_COLOR_FRAGMENT,
    roughnessFragment: VIDA38_HUMANOID_PBR_ROUGHNESS_FRAGMENT,
    normalFragment: VIDA38_HUMANOID_PBR_NORMAL_FRAGMENT,
  };
}

function patternIndex(contract: Vida38SpeciesVisualContract): number {
  switch (contract.pigmentation.pattern) {
    case 'SOLID': return 0;
    case 'BANDS': return 1;
    case 'SPOTS': return 2;
    case 'MOTTLED': return 3;
    default: return 0;
  }
}
function coveringIndex(contract: Vida38SpeciesVisualContract): number {
  switch (contract.morphology.covering) {
    case 'SCALES': return 1;
    case 'FUR': return 2;
    case 'FEATHERS': return 3;
    case 'MEMBRANE': return 4;
    default: return 0;
  }
}

/**
 * Shader fragmentario estable con riqueza regional: el patrón sigue anclado al
 * cuerpo, pero añade materiales biológicos más plausibles y variación facial.
 */
export function createVida38HumanoidSkinV1(raw: Vida38HumanoidRawMesh, contract: Vida38SpeciesVisualContract): THREE.Mesh {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(raw.positions,3));
  geometry.setAttribute('normal',new THREE.BufferAttribute(raw.normals,3));
  geometry.setAttribute('uv',new THREE.BufferAttribute(raw.uvs,2));
  geometry.setIndex(new THREE.BufferAttribute(raw.indices,1));
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
  const metrics = measureVida38HumanoidMeshV1(raw);
  const source = buildVida38HumanoidPbrShader38G();
  const headCenterY = raw.anatomy.legLength + raw.anatomy.torsoLength * (1.22 + (raw.anatomy.neckLength - 1) * 0.14);
  const headRadius = Math.max(raw.anatomy.headWidth * 0.50, raw.anatomy.headHeight * 0.47);
  const mat = new THREE.MeshPhysicalMaterial({
    color:0xffffff,
    roughness:contract.morphology.covering==='SCALES'?0.82:contract.morphology.covering==='FUR'?0.94:0.87,
    metalness:0,
    clearcoat:0.004,
    clearcoatRoughness:0.99,
    sheen:contract.morphology.covering==='FUR'?0.06:0.015,
    sheenRoughness:0.97,
    specularIntensity:0.24,
    side:THREE.FrontSide,
  });
  mat.onBeforeCompile = shader => {
    shader.uniforms['uVida38PigmentPrimary'] = {value:new THREE.Color(contract.pigmentation.primaryColorHex)};
    shader.uniforms['uVida38PigmentSecondary'] = {value:new THREE.Color(contract.pigmentation.secondaryColorHex)};
    shader.uniforms['uVida38OrganicSeed'] = {value:(raw.anatomy.visualSeed % 65521)/1127};
    shader.uniforms['uVida38Pattern'] = {value:patternIndex(contract)};
    shader.uniforms['uVida38Covering'] = {value:coveringIndex(contract)};
    shader.uniforms['uVida38EyeHeight'] = {value:raw.anatomy.legLength+(1.18+(raw.anatomy.neckLength-1)*0.14)*raw.anatomy.torsoLength};
    shader.uniforms['uVida38SkinDetail'] = {value:contract.morphology.covering==='SCALES'?0.0024:0.0018};
    shader.uniforms['uVida38MetersPerUnit'] = {value:metrics.metersPerUnit};
    shader.uniforms['uVida38BodyLengthMeters'] = {value:contract.bodyLengthMeters};
    shader.uniforms['uVida38HeadCenterY'] = {value:headCenterY};
    shader.uniforms['uVida38HeadRadius'] = {value:headRadius};
    shader.uniforms['uVida38ShoulderWidth'] = {value:raw.anatomy.shoulderWidth};
    shader.uniforms['uVida38HipWidth'] = {value:raw.anatomy.hipWidth};
    shader.uniforms['uVida38TorsoLength'] = {value:raw.anatomy.torsoLength};
    shader.uniforms['uVida38ArmReach'] = {value:raw.anatomy.armReach};
    shader.uniforms['uVida38LegLength'] = {value:raw.anatomy.legLength};
    shader.uniforms['uVida38JawWidth'] = {value:raw.anatomy.jawWidth};
    shader.uniforms['uVida38FaceProjection'] = {value:raw.anatomy.faceProjection};
    shader.vertexShader=shader.vertexShader.replace('#include <common>', `#include <common>\n${source.vertexCommon}`);
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n${source.vertexBody}`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>', `#include <common>\n${source.fragmentCommon}`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',source.colorFragment);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',source.roughnessFragment);
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',source.normalFragment);
  };
  mat.customProgramCacheKey = () => `${VIDA38_HUMANOID_PBR_REVISION}|${patternIndex(contract)}|${coveringIndex(contract)}`;
  const mesh=new THREE.Mesh(geometry,mat);
  mesh.name='VIDA38_2E_ORGANIC_SKIN';
  mesh.castShadow=true;mesh.receiveShadow=true;
  mesh.userData['revision']='VIDA.38.2e/humanoid-implicit-mesh/v1';
  mesh.userData['pbrRevision']=VIDA38_HUMANOID_PBR_REVISION;
  mesh.userData['meterLengthOriginal']=contract.bodyLengthMeters;
  mesh.userData['morphologyRevision']=raw.anatomy.morphology.revision;
  mesh.userData['anatomyFingerprint']=raw.anatomy.morphology.anatomyFingerprint;
  mesh.userData['metersPerUnit']=metrics.metersPerUnit;
  mesh.userData['reconstructionHypothesis']=true;
  return mesh;
}

/**
 * 38.2g.c: ojos anatómicamente hundidos, con iris/pupila en UNA esfera ocular.
 * La cavidad y párpados están tallados dentro del SDF principal (sin anillos
 * flotantes ni pestañas geométricas). Las mallas oculares son objetos legítimos
 * independientes, alojados dentro de la cara, con pigmento ocular determinista.
 */
export function createVida38HumanoidOcularDetailsV1(a: Vida38HumanoidAnatomy, contract: Vida38SpeciesVisualContract): THREE.Object3D[] {
  const landmarks = deriveVida38HumanoidFaceLandmarks38GC(a);
  const eyes: THREE.Object3D[] = [];
  const iris = new THREE.Color(contract.pigmentation.secondaryColorHex).lerp(new THREE.Color('#455e66'), 0.55);
  const sclera = new THREE.Color('#9daba8').lerp(new THREE.Color(contract.pigmentation.primaryColorHex), 0.17);
  const pupil = new THREE.Color('#0b1013');
  const limbus = iris.clone().multiplyScalar(0.45);
  for (const side of [-1, 1]) {
    const radius = landmarks.globeRadius;
    const geometry = new THREE.SphereGeometry(radius, 48, 32);
    const position = geometry.getAttribute('position');
    const colors = new Float32Array(position.count * 3);
    const irisRadius = 0.47 + (a.morphology.eyeSize - 1) * 0.065;
    const pupilRadius = 0.20 + (a.morphology.eyeSize - 1) * 0.018;
    for (let i = 0; i < position.count; i++) {
      const px = position.getX(i) / radius;
      const py = position.getY(i) / radius;
      const pz = position.getZ(i) / radius;
      const radial = Math.hypot(px, py * 1.02);
      let c = sclera.clone();
      if (pz > 0.0) {
        const irisMix = 1 - THREE.MathUtils.smoothstep(radial, irisRadius, irisRadius + 0.06);
        const radialFibers = Math.sin(Math.atan2(py, px) * 27 + a.visualSeed * 0.00012) * 0.055;
        c.lerp(iris.clone().multiplyScalar(0.93 + radialFibers), irisMix);
        const limbalBand = THREE.MathUtils.smoothstep(radial, irisRadius - 0.07, irisRadius - 0.025)
          * (1 - THREE.MathUtils.smoothstep(radial, irisRadius + 0.01, irisRadius + 0.065));
        c.lerp(limbus, limbalBand * 0.45);
        c.lerp(pupil, 1 - THREE.MathUtils.smoothstep(radial, pupilRadius, pupilRadius + 0.045));
      }
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      vertexColors: true,
      metalness: 0,
      roughness: 0.23,
      clearcoat: 0.32,
      clearcoatRoughness: 0.17,
    });
    const eye = new THREE.Mesh(geometry, material);
    eye.position.set(
      side * a.eyeSpacing,
      landmarks.eyeY,
      landmarks.eyeCenterZ + a.postureLean * (landmarks.eyeY - a.legLength),
    );
    eye.scale.set(1, 0.94, 1);
    eye.name = `VIDA38_2GC_OCULAR_INTEGRATED_${side}`;
    eye.userData['reconstructionHypothesis'] = true;
    eye.userData['orbitallyRecessed'] = true;
    eye.userData['eyelidsFromSdf'] = true;
    eyes.push(eye);
  }
  return eyes;
}
