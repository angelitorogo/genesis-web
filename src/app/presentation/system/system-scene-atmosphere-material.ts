import * as THREE from 'three';

import {
  type SystemSceneAtmosphereOpticsV1,
} from './system-scene-atmosphere-optics';

export interface SystemSceneDayNightMaterialProfileV1 {
  readonly version: 1;
  readonly terminatorSoftness01: number;
  readonly nightFloor01: number;
  readonly twilightGlow01: number;
  readonly atmospherePresent: boolean;
  readonly dayTintHex: string;
  readonly nightTintHex: string;
}

export interface SystemScenePlanetLightBindingV1 {
  readonly lightDirectionsView: readonly [
    THREE.Vector3,
    THREE.Vector3,
    THREE.Vector3,
  ];
  readonly lightWeightsView: THREE.Vector3;
}

export const SYSTEM_SCENE_DAY_NIGHT_MATERIAL_VERSION =
  1 as const;

const GLSL_COMMON_MARKER =
  '#include <common>';
const GLSL_OPAQUE_MARKER =
  '#include <opaque_fragment>';

export function buildSystemSceneDayNightMaterialProfileV1(
  optics: SystemSceneAtmosphereOpticsV1,
): SystemSceneDayNightMaterialProfileV1 {
  if (optics.version !== 1) {
    throw new RangeError(
      `Unsupported atmosphere optics version: ${optics.version}.`,
    );
  }

  return Object.freeze({
    version: SYSTEM_SCENE_DAY_NIGHT_MATERIAL_VERSION,
    terminatorSoftness01: optics.presentationTerminatorSoftness01,
    nightFloor01: optics.presentationNightFloor01,
    twilightGlow01: optics.presentationTwilightGlow01,
    atmospherePresent: optics.atmospherePresent,
    dayTintHex: optics.presentationDayTintHex,
    nightTintHex: optics.presentationNightTintHex,
  });
}

/**
 * Point-25.6 composes with the point-25.5 GLSL hook. The standard Three.js
 * lighting remains authoritative for rendered illumination; this patch only
 * suppresses ambient light on the night side and softens the visible terminator
 * according to the bounded atmosphere presentation profile.
 */
export function installSystemSceneDayNightMaterialV1(
  material: THREE.MeshStandardMaterial,
  profile: SystemSceneDayNightMaterialProfileV1,
  binding: SystemScenePlanetLightBindingV1,
): void {
  validateProfile(profile);

  const upstreamOnBeforeCompile =
    material.onBeforeCompile;
  const upstreamProgramKey =
    material.customProgramCacheKey();
  const dayTint =
    new THREE.Color(profile.dayTintHex);
  const nightTint =
    new THREE.Color(profile.nightTintHex);

  material.onBeforeCompile =
    (shader, renderer) => {
      upstreamOnBeforeCompile.call(
        material,
        shader,
        renderer,
      );

      shader.uniforms['uGenesisLightDirectionsView'] = {
        value: binding.lightDirectionsView,
      };
      shader.uniforms['uGenesisLightWeights'] = {
        value: binding.lightWeightsView,
      };
      shader.uniforms['uGenesisTerminatorSoftness'] = {
        value: profile.terminatorSoftness01,
      };
      shader.uniforms['uGenesisNightFloor'] = {
        value: profile.nightFloor01,
      };
      shader.uniforms['uGenesisTwilightGlow'] = {
        value: profile.twilightGlow01,
      };
      shader.uniforms['uGenesisAtmospherePresent'] = {
        value: profile.atmospherePresent ? 1 : 0,
      };
      shader.uniforms['uGenesisAtmosphereDayTint'] = {
        value: dayTint,
      };
      shader.uniforms['uGenesisAtmosphereNightTint'] = {
        value: nightTint,
      };

      shader.fragmentShader =
        patchSystemSceneDayNightFragmentShaderV1(
          shader.fragmentShader,
        );
    };

  material.customProgramCacheKey =
    () =>
      `${upstreamProgramKey}|GENESIS-25.6-DAY-NIGHT-V1-${profile.atmospherePresent ? 'ATM' : 'VAC'}`;

  material.userData['genesisDayNightPipeline'] =
    Object.freeze({
      version: SYSTEM_SCENE_DAY_NIGHT_MATERIAL_VERSION,
      pipeline: 'GLSL_WEBGL2_DAY_NIGHT_V1',
      atmospherePresent: profile.atmospherePresent,
    });

  material.needsUpdate = true;
}

export function patchSystemSceneDayNightFragmentShaderV1(
  fragmentShader: string,
): string {
  if (
    !fragmentShader.includes(GLSL_COMMON_MARKER) ||
    !fragmentShader.includes(GLSL_OPAQUE_MARKER)
  ) {
    throw new RangeError(
      'Point-25.6 day/night GLSL patch requires Three.js standard <common> and <opaque_fragment> chunks.',
    );
  }

  const withUniforms =
    fragmentShader.replace(
      GLSL_COMMON_MARKER,
      `${GLSL_COMMON_MARKER}\nuniform vec3 uGenesisLightDirectionsView[3];\nuniform vec3 uGenesisLightWeights;\nuniform float uGenesisTerminatorSoftness;\nuniform float uGenesisNightFloor;\nuniform float uGenesisTwilightGlow;\nuniform float uGenesisAtmospherePresent;\nuniform vec3 uGenesisAtmosphereDayTint;\nuniform vec3 uGenesisAtmosphereNightTint;`,
    );

  return withUniforms.replace(
    GLSL_OPAQUE_MARKER,
    `float genesisTerminatorWidth = max(0.008, uGenesisTerminatorSoftness);\nfloat genesisWeight0 = max(uGenesisLightWeights.x, 0.0);\nfloat genesisWeight1 = max(uGenesisLightWeights.y, 0.0);\nfloat genesisWeight2 = max(uGenesisLightWeights.z, 0.0);\nfloat genesisDayFactor0 = smoothstep(-genesisTerminatorWidth, genesisTerminatorWidth, dot(normalize(normal), normalize(uGenesisLightDirectionsView[0])));\nfloat genesisDayFactor1 = smoothstep(-genesisTerminatorWidth, genesisTerminatorWidth, dot(normalize(normal), normalize(uGenesisLightDirectionsView[1])));\nfloat genesisDayFactor2 = smoothstep(-genesisTerminatorWidth, genesisTerminatorWidth, dot(normalize(normal), normalize(uGenesisLightDirectionsView[2])));\nfloat genesisDayFactor = clamp(genesisDayFactor0 * genesisWeight0 + genesisDayFactor1 * genesisWeight1 + genesisDayFactor2 * genesisWeight2, 0.0, 1.0);\nfloat genesisNightVisibility = mix(uGenesisNightFloor, 1.0, genesisDayFactor);\nvec3 genesisNightTint = mix(vec3(1.0), uGenesisAtmosphereNightTint, 0.12 * (1.0 - genesisDayFactor));\noutgoingLight *= genesisNightVisibility * genesisNightTint;\nfloat genesisTwilight0 = exp(-abs(dot(normalize(normal), normalize(uGenesisLightDirectionsView[0]))) / max(0.02, genesisTerminatorWidth * 1.35));\nfloat genesisTwilight1 = exp(-abs(dot(normalize(normal), normalize(uGenesisLightDirectionsView[1]))) / max(0.02, genesisTerminatorWidth * 1.35));\nfloat genesisTwilight2 = exp(-abs(dot(normalize(normal), normalize(uGenesisLightDirectionsView[2]))) / max(0.02, genesisTerminatorWidth * 1.35));\nfloat genesisTwilightBand = clamp(genesisTwilight0 * genesisWeight0 + genesisTwilight1 * genesisWeight1 + genesisTwilight2 * genesisWeight2, 0.0, 1.0);\nfloat genesisTwilightEnergy = genesisTwilightBand * uGenesisTwilightGlow * uGenesisAtmospherePresent * 0.055;\noutgoingLight += uGenesisAtmosphereDayTint * genesisTwilightEnergy;\n${GLSL_OPAQUE_MARKER}`,
  );
}

/** Creates the subtle limb/twilight shell; null means a genuine vacuum. */
export function createSystemSceneAtmosphereShellMaterialV1(
  optics: SystemSceneAtmosphereOpticsV1,
  binding: SystemScenePlanetLightBindingV1,
): THREE.ShaderMaterial | null {
  if (!optics.atmospherePresent) {
    return null;
  }

  const material =
    new THREE.ShaderMaterial({
      uniforms: {
        uGenesisLightDirectionsView: {
          value: binding.lightDirectionsView,
        },
        uGenesisLightWeights: {
          value: binding.lightWeightsView,
        },
        uGenesisDayTint: {
          value: new THREE.Color(optics.presentationDayTintHex),
        },
        uGenesisNightTint: {
          value: new THREE.Color(optics.presentationNightTintHex),
        },
        uGenesisRimStrength: {
          value: optics.presentationRimStrength01,
        },
        uGenesisTerminatorSoftness: {
          value: optics.presentationTerminatorSoftness01,
        },
        uGenesisTwilightGlow: {
          value: optics.presentationTwilightGlow01,
        },
      },
      vertexShader: ATMOSPHERE_VERTEX_SHADER_V1,
      fragmentShader: ATMOSPHERE_FRAGMENT_SHADER_V1,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });

  material.name =
    'GENESIS atmosphere limb 25.6';
  material.userData['genesisAtmospherePipeline'] =
    Object.freeze({
      version: 1,
      pipeline: 'GLSL_WEBGL2_ATMOSPHERE_V1',
      deepEnvelope: optics.deepEnvelope,
    });

  return material;
}

export const ATMOSPHERE_VERTEX_SHADER_V1 = `
varying vec3 vGenesisAtmosphereNormalView;
varying vec3 vGenesisAtmosphereViewDirection;

void main() {
  vec4 genesisViewPosition = modelViewMatrix * vec4(position, 1.0);
  vGenesisAtmosphereNormalView = normalize(normalMatrix * normal);
  vGenesisAtmosphereViewDirection = normalize(-genesisViewPosition.xyz);
  gl_Position = projectionMatrix * genesisViewPosition;
}
`;

export const ATMOSPHERE_FRAGMENT_SHADER_V1 = `
uniform vec3 uGenesisLightDirectionsView[3];
uniform vec3 uGenesisLightWeights;
uniform vec3 uGenesisDayTint;
uniform vec3 uGenesisNightTint;
uniform float uGenesisRimStrength;
uniform float uGenesisTerminatorSoftness;
uniform float uGenesisTwilightGlow;

varying vec3 vGenesisAtmosphereNormalView;
varying vec3 vGenesisAtmosphereViewDirection;

void main() {
  vec3 genesisNormal = normalize(vGenesisAtmosphereNormalView);
  vec3 genesisView = normalize(vGenesisAtmosphereViewDirection);
  float genesisViewDot = abs(dot(genesisNormal, genesisView));
  float genesisFresnel = pow(clamp(1.0 - genesisViewDot, 0.0, 1.0), 2.15);
  float genesisWidth = max(0.015, uGenesisTerminatorSoftness);
  vec3 genesisLight0 = normalize(uGenesisLightDirectionsView[0]);
  vec3 genesisLight1 = normalize(uGenesisLightDirectionsView[1]);
  vec3 genesisLight2 = normalize(uGenesisLightDirectionsView[2]);
  float genesisWeight0 = max(uGenesisLightWeights.x, 0.0);
  float genesisWeight1 = max(uGenesisLightWeights.y, 0.0);
  float genesisWeight2 = max(uGenesisLightWeights.z, 0.0);
  float genesisLightDot0 = dot(genesisNormal, genesisLight0);
  float genesisLightDot1 = dot(genesisNormal, genesisLight1);
  float genesisLightDot2 = dot(genesisNormal, genesisLight2);
  float genesisDay0 = smoothstep(-genesisWidth, genesisWidth, genesisLightDot0);
  float genesisDay1 = smoothstep(-genesisWidth, genesisWidth, genesisLightDot1);
  float genesisDay2 = smoothstep(-genesisWidth, genesisWidth, genesisLightDot2);
  float genesisDay = clamp(genesisDay0 * genesisWeight0 + genesisDay1 * genesisWeight1 + genesisDay2 * genesisWeight2, 0.0, 1.0);
  float genesisTwilight0 = exp(-abs(genesisLightDot0) / max(0.025, genesisWidth * 1.25));
  float genesisTwilight1 = exp(-abs(genesisLightDot1) / max(0.025, genesisWidth * 1.25));
  float genesisTwilight2 = exp(-abs(genesisLightDot2) / max(0.025, genesisWidth * 1.25));
  float genesisTwilight = clamp(genesisTwilight0 * genesisWeight0 + genesisTwilight1 * genesisWeight1 + genesisTwilight2 * genesisWeight2, 0.0, 1.0);

  vec3 genesisTint = mix(uGenesisNightTint, uGenesisDayTint, genesisDay);
  float genesisAlpha = genesisFresnel * uGenesisRimStrength * (0.15 + 0.85 * genesisDay);
  genesisAlpha += genesisFresnel * genesisTwilight * uGenesisTwilightGlow * 0.22;
  genesisAlpha = clamp(genesisAlpha, 0.0, 0.72);

  gl_FragColor = vec4(genesisTint, genesisAlpha);
}
`;

function validateProfile(
  profile: SystemSceneDayNightMaterialProfileV1,
): void {
  if (profile.version !== SYSTEM_SCENE_DAY_NIGHT_MATERIAL_VERSION) {
    throw new RangeError(
      `Unsupported day/night material version: ${profile.version}.`,
    );
  }

  for (const [label, value] of [
    ['terminatorSoftness01', profile.terminatorSoftness01],
    ['nightFloor01', profile.nightFloor01],
    ['twilightGlow01', profile.twilightGlow01],
  ] as const) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new RangeError(`${label} must be finite in [0, 1].`);
    }
  }
}
