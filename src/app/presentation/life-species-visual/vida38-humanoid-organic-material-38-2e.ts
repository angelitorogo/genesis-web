/**
 * GENESIS 38.2g.a — estabilización del material biológico humanoide.
 * Corrige shimmering/pixelado: pigmentación en coordenadas anatómicas estables,
 * manchas de baja/mediana frecuencia con antialias procedural y microrelieve
 * suavizado. Nunca altera la geometría/anatomía certificada ni el fenotipo VIDA.
 */
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import type { Vida38HumanoidAnatomy, Vida38HumanoidRawMesh } from './vida38-humanoid-organic-field-38-2e';
import { measureVida38HumanoidMeshV1 } from './vida38-humanoid-organic-field-38-2e';

export const VIDA38_HUMANOID_PBR_REVISION = 'VIDA.38.2g.a/organic-integument-stable/v1' as const;

const VERTEX_DECLARATIONS = `
varying vec3 vVida38OrganicPosition;
`;
const VERTEX_BODY = `
vVida38OrganicPosition = position;
`;

/**
 * Las coordenadas procedurales se evalúan en espacio local escalado a metros,
 * por lo que el patrón queda “pegado” al cuerpo y no vibra con la cámara.
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
float vida38Pigment(vec3 point) {
  vec3 p = vida38StableCoord(point) + vec3(uVida38OrganicSeed * 0.061, uVida38OrganicSeed * 0.027, uVida38OrganicSeed * 0.019);
  vec3 macroWarp = vec3(
    vida38Fbm(p * 0.85 + vec3(12.0, 4.0, 8.0)),
    vida38Fbm(p * 0.85 + vec3(20.0, 7.0, 2.0)),
    vida38Fbm(p * 0.85 + vec3(31.0, 9.0, 4.0))) - vec3(0.5);
  vec3 q = p + macroWarp * 0.34;
  float macro = vida38Fbm(q * 1.15 + vec3(1.0, 4.0, 8.0));
  float regional = vida38Fbm(q * 2.35 + vec3(9.0, 2.0, 5.0));
  float detail = vida38Fbm(q * 4.25 + vec3(2.0, 11.0, 3.0));
  float pattern = 0.07;
  if (uVida38Pattern < 0.5) {
    pattern = 0.03 + macro * 0.16 + regional * 0.05;
  } else if (uVida38Pattern < 1.5) {
    float wave = sin(q.y * 5.8 + q.x * 2.4 + macroWarp.z * 3.2 + regional * 3.4);
    float bandMask = 1.0 - vida38AA(abs(wave), 0.54, 1.65);
    pattern = 0.05 + bandMask * 0.42 + macro * 0.08;
  } else if (uVida38Pattern < 2.5) {
    float spots = 1.0 - vida38Worley(q * 2.15 + vec3(2.1, 6.4, 8.2));
    float spotMask = vida38AABand(spots, 0.30, 0.63, 1.8);
    pattern = 0.04 + spotMask * 0.48 + regional * 0.10;
  } else {
    float fluid = macro * 0.62 + regional * 0.28 + detail * 0.10;
    float cloudMask = vida38AA(fluid, 0.53, 1.55);
    pattern = 0.04 + cloudMask * 0.46;
  }
  float dorsal = vida38AA(-point.z, 0.02, 1.4) * 0.07;
  float face = point.y > uVida38EyeHeight - 0.34 ? 0.018 : 0.0;
  return clamp(pattern + dorsal + face, 0.0, 0.72);
}
float vida38BiologicalRelief(vec3 point) {
  vec3 p = vida38StableCoord(point);
  float microskin = vida38Fbm(p * 11.0 + vec3(uVida38OrganicSeed * 0.013));
  if (uVida38Covering < 0.5) {
    float pores = 1.0 - vida38Worley(p * 7.0 + vec3(5.0, 2.0, 7.0));
    return microskin * 0.32 + vida38AABand(pores, 0.30, 0.62, 1.25) * 0.18;
  }
  if (uVida38Covering < 1.5) {
    vec3 scales = p * 4.6;
    scales.x += fract(floor(scales.y) * 0.5) * 0.32;
    float scaleCells = 1.0 - vida38Worley(scales + vec3(2.0, 5.0, 1.0));
    return microskin * 0.22 + vida38AABand(scaleCells, 0.28, 0.67, 1.3) * 0.22;
  }
  if (uVida38Covering < 2.5) {
    float strand = 0.5 + 0.5 * sin(p.y * 36.0 + p.x * 9.5 + vida38Fbm(p * 3.0) * 1.8);
    return microskin * 0.25 + vida38AA(strand, 0.64, 1.2) * 0.16;
  }
  if (uVida38Covering < 3.5) {
    float vane = 0.5 + 0.5 * sin(p.y * 26.0 + p.x * 7.0 + p.z * 3.5);
    return microskin * 0.24 + vida38AA(vane, 0.66, 1.2) * 0.15;
  }
  return microskin * 0.24;
}
`;

export const VIDA38_HUMANOID_PBR_COLOR_FRAGMENT = `
#include <color_fragment>
float vida38Coverage = vida38Pigment(vVida38OrganicPosition);
float vida38LargeDetail = vida38Fbm(vida38StableCoord(vVida38OrganicPosition) * 1.45 + vec3(uVida38OrganicSeed * 0.009));
float vida38Warmth = 0.97 + (vida38LargeDetail - 0.5) * 0.07;
diffuseColor.rgb *= mix(uVida38PigmentPrimary, uVida38PigmentSecondary, vida38Coverage) * vida38Warmth;
`;

export const VIDA38_HUMANOID_PBR_ROUGHNESS_FRAGMENT = `
#include <roughnessmap_fragment>
float vida38RoughNoise = vida38Fbm(vida38StableCoord(vVida38OrganicPosition) * 2.8 + vec3(2.3, 1.7, uVida38OrganicSeed * 0.017));
roughnessFactor=clamp(roughnessFactor + (vida38RoughNoise - 0.5) * 0.08, 0.58, 0.96);
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
 * Fragment shader: pigmentación y microrelieve totalmente en fragmento; sin
 * depender de coordenadas de pantalla, sin color por vértice y con detalle más estable.
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
  const mat = new THREE.MeshPhysicalMaterial({
    color:0xffffff,
    roughness:contract.morphology.covering==='SCALES'?0.84:contract.morphology.covering==='FUR'?0.96:0.89,
    metalness:0,
    clearcoat:0.006,
    clearcoatRoughness:0.98,
    sheen:contract.morphology.covering==='FUR'?0.08:0.018,
    sheenRoughness:0.95,
    specularIntensity:0.28,
    side:THREE.FrontSide,
  });
  mat.onBeforeCompile = shader => {
    shader.uniforms['uVida38PigmentPrimary'] = {value:new THREE.Color(contract.pigmentation.primaryColorHex)};
    shader.uniforms['uVida38PigmentSecondary'] = {value:new THREE.Color(contract.pigmentation.secondaryColorHex)};
    shader.uniforms['uVida38OrganicSeed'] = {value:(raw.anatomy.visualSeed % 65521)/1127};
    shader.uniforms['uVida38Pattern'] = {value:patternIndex(contract)};
    shader.uniforms['uVida38Covering'] = {value:coveringIndex(contract)};
    shader.uniforms['uVida38EyeHeight'] = {value:raw.anatomy.legLength+(1.18+(raw.anatomy.neckLength-1)*0.14)*raw.anatomy.torsoLength};
    shader.uniforms['uVida38SkinDetail'] = {value:contract.morphology.covering==='SCALES'?0.0026:0.0016};
    shader.uniforms['uVida38MetersPerUnit'] = {value:metrics.metersPerUnit};
    shader.uniforms['uVida38BodyLengthMeters'] = {value:contract.bodyLengthMeters};
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
 * VISTA OCULAR 38.2g. Una esfera hundida en la órbita con iris, esclerótica,
 * pupila y limbo integrados en COLOR DE VÉRTICE. No apilar tres esferas.
 */
export function createVida38HumanoidOcularDetailsV1(a: Vida38HumanoidAnatomy,contract: Vida38SpeciesVisualContract):THREE.Object3D[] {
  const eyes:THREE.Object3D[]=[];
  const irisColor=new THREE.Color(contract.pigmentation.secondaryColorHex)
    .lerp(new THREE.Color('#536970'),0.42);
  const scleraColor=new THREE.Color('#9aa6a6').lerp(new THREE.Color(contract.pigmentation.primaryColorHex),0.18);
  const pupilColor=new THREE.Color('#0a0d0e');
  const limbusColor=new THREE.Color('#263238');
  for(const side of [-1,1]) {
    const radius=a.eyeRadius*0.93;
    const geometry=new THREE.SphereGeometry(radius,64,40);
    const positions=geometry.getAttribute('position');
    const colors=new Float32Array(positions.count*3);
    for(let i=0;i<positions.count;i++) {
      const x=positions.getX(i)/radius;
      const y=positions.getY(i)/radius;
      const z=positions.getZ(i)/radius;
      const radial=Math.hypot(x+side*0.018,y*1.02);
      let pigment=scleraColor.clone();
      if(z>0.18){
        const irisEdge=THREE.MathUtils.smoothstep(radial,0.53,0.66);
        const irisBlend=1-irisEdge;
        const noise=Math.sin((Math.atan2(y,x)+Math.PI)*29.0+a.visualSeed*0.001)*0.08;
        const iris=irisColor.clone().multiplyScalar(0.85+noise);
        pigment.lerp(iris,irisBlend);
        pigment.lerp(limbusColor,(1-THREE.MathUtils.smoothstep(radial,0.58,0.66))*THREE.MathUtils.smoothstep(radial,0.49,0.58)*0.72);
        pigment.lerp(pupilColor,1-THREE.MathUtils.smoothstep(radial,0.21,0.31));
      }
      colors[i*3]=pigment.r;
      colors[i*3+1]=pigment.g;
      colors[i*3+2]=pigment.b;
    }
    geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
    const mat=new THREE.MeshPhysicalMaterial({
      color:0xffffff,vertexColors:true,metalness:0,roughness:0.17,
      clearcoat:0.48,clearcoatRoughness:0.16,
    });
    const eye=new THREE.Mesh(geometry,mat);
    const cx=side*a.eyeSpacing;
    const cy=a.legLength+(1.18+(a.neckLength-1)*0.14)*a.torsoLength;
    const socketZ=0.248+a.faceProjection*0.12;
    eye.position.set(cx,cy,socketZ+radius*0.26+a.postureLean*Math.max(0,cy-a.legLength));
    eye.scale.set(1.0,0.86,0.96);
    eye.name=`VIDA38_2G_OCULAR_INTEGRATED_${side}`;
    eye.userData['reconstructionHypothesis']=true;
    eyes.push(eye);
  }
  return eyes;
}
