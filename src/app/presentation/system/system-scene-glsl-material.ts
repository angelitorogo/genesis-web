import * as THREE from 'three';

export type SystemSceneGlslMaterialKind =
  | 'SOLID_SURFACE'
  | 'DEEP_ENVELOPE';

export interface SystemSceneGlslMaterialProfileInput {
  readonly kind:
    SystemSceneGlslMaterialKind;

  readonly liquidCoverageFraction01?:
    number;

  readonly iceCoverageFraction01?:
    number;

  readonly desertCoverageFraction01?:
    number;

  readonly volcanismIndex01?:
    number;

  readonly giantJetSharpness01?:
    number;

  readonly giantTurbulence01?:
    number;

  readonly giantMethaneBlueing01?:
    number;

  readonly giantWarmChromophore01?:
    number;

  readonly giantPolarHaze01?:
    number;

  readonly giantUpperHaze01?:
    number;
}

export interface SystemSceneGlslMaterialProfileV1 {
  readonly version:
    1;

  readonly kind:
    SystemSceneGlslMaterialKind;

  /** Bounded pre-lighting albedo contrast. */
  readonly albedoContrast:
    number;

  /** Bounded chroma preservation before Three.js lighting/tone mapping. */
  readonly albedoSaturation:
    number;

  /** Small latitude-only lift used for already-authoritative giant polar haze. */
  readonly polarAlbedoLift:
    number;

  /** Overall blend of the GLSL albedo refinement with the original texture. */
  readonly refinementStrength01:
    number;
}

export const SYSTEM_SCENE_GLSL_MATERIAL_VERSION =
  1 as const;

const GLSL_COMMON_MARKER =
  '#include <common>';

const GLSL_MAP_MARKER =
  '#include <map_fragment>';

/**
 * Point-25.5 GLSL profile.
 *
 * This does not invent new terrain, clouds, bands or atmospheric circulation.
 * It only preserves texture contrast/chroma through the WebGL2 lighting path,
 * using already-frozen 25.3/25.4 presentation signals to choose bounded shader
 * parameters. Point 25.6 still owns atmosphere/terminator/night-side effects.
 */
export function buildSystemSceneGlslMaterialProfileV1(
  input:
    SystemSceneGlslMaterialProfileInput,
): SystemSceneGlslMaterialProfileV1 {

  if (
    input.kind ===
      'SOLID_SURFACE'
  ) {
    const liquid =
      optionalIndex01(
        input.liquidCoverageFraction01,
        'liquidCoverageFraction01',
      );
    const ice =
      optionalIndex01(
        input.iceCoverageFraction01,
        'iceCoverageFraction01',
      );
    const desert =
      optionalIndex01(
        input.desertCoverageFraction01,
        'desertCoverageFraction01',
      );
    const volcanism =
      optionalIndex01(
        input.volcanismIndex01,
        'volcanismIndex01',
      );

    return Object.freeze({
      version:
        SYSTEM_SCENE_GLSL_MATERIAL_VERSION,
      kind:
        input.kind,
      albedoContrast:
        clamp(
          1.055 +
            0.055 * desert +
            0.035 * volcanism -
            0.025 * liquid +
            0.018 * ice,
          1.03,
          1.16,
        ),
      albedoSaturation:
        clamp(
          1.018 +
            0.055 * liquid +
            0.035 * desert +
            0.020 * volcanism -
            0.018 * ice,
          1.0,
          1.13,
        ),
      polarAlbedoLift:
        0,
      refinementStrength01:
        0.72,
    });
  }

  const jet =
    optionalIndex01(
      input.giantJetSharpness01,
      'giantJetSharpness01',
    );
  const turbulence =
    optionalIndex01(
      input.giantTurbulence01,
      'giantTurbulence01',
    );
  const methane =
    optionalIndex01(
      input.giantMethaneBlueing01,
      'giantMethaneBlueing01',
    );
  const warm =
    optionalIndex01(
      input.giantWarmChromophore01,
      'giantWarmChromophore01',
    );
  const polarHaze =
    optionalIndex01(
      input.giantPolarHaze01,
      'giantPolarHaze01',
    );
  const upperHaze =
    optionalIndex01(
      input.giantUpperHaze01,
      'giantUpperHaze01',
    );

  return Object.freeze({
    version:
      SYSTEM_SCENE_GLSL_MATERIAL_VERSION,
    kind:
      input.kind,
    albedoContrast:
      clamp(
        1.09 +
          0.18 * jet +
          0.07 * turbulence -
          0.035 * upperHaze,
        1.08,
        1.30,
      ),
    albedoSaturation:
      clamp(
        1.03 +
          0.12 * Math.max(
            methane,
            warm,
          ) +
          0.035 * turbulence,
        1.02,
        1.18,
      ),
    polarAlbedoLift:
      clamp(
        0.008 +
          0.035 * polarHaze +
          0.015 * upperHaze,
        0,
        0.055,
      ),
    refinementStrength01:
      clamp(
        0.72 +
          0.12 * jet +
          0.08 * turbulence,
        0.72,
        0.90,
      ),
  });
}

/**
 * Installs the WebGL2/GLSL refinement on Three.js MeshStandardMaterial while
 * preserving Three's own lighting, emissive, tone-mapping and map pipeline.
 */
export function installSystemSceneGlslMaterialV1(
  material:
    THREE.MeshStandardMaterial,

  profile:
    SystemSceneGlslMaterialProfileV1,
): void {

  if (
    profile.version !==
      SYSTEM_SCENE_GLSL_MATERIAL_VERSION
  ) {
    throw new RangeError(
      `Unsupported SystemScene GLSL material profile version: ${profile.version}.`,
    );
  }

  const programKey =
    `GENESIS-25.5-GLSL-V1-${profile.kind}`;

  material.onBeforeCompile =
    shader => {
      shader.uniforms['uGenesisAlbedoContrast'] = {
        value:
          profile.albedoContrast,
      };
      shader.uniforms['uGenesisAlbedoSaturation'] = {
        value:
          profile.albedoSaturation,
      };
      shader.uniforms['uGenesisPolarAlbedoLift'] = {
        value:
          profile.polarAlbedoLift,
      };
      shader.uniforms['uGenesisRefinementStrength'] = {
        value:
          profile.refinementStrength01,
      };

      shader.fragmentShader =
        patchSystemSceneStandardFragmentShaderV1(
          shader.fragmentShader,
        );
    };

  material.customProgramCacheKey =
    () =>
      programKey;

  material.userData['genesisShaderPipeline'] =
    Object.freeze({
      version:
        SYSTEM_SCENE_GLSL_MATERIAL_VERSION,
      pipeline:
        'GLSL_WEBGL2_V1',
      kind:
        profile.kind,
    });

  material.needsUpdate =
    true;
}

/** Pure source transform kept exported so tests can validate the exact GLSL contract. */
export function patchSystemSceneStandardFragmentShaderV1(
  fragmentShader:
    string,
): string {

  if (
    !fragmentShader.includes(
      GLSL_COMMON_MARKER,
    ) ||
    !fragmentShader.includes(
      GLSL_MAP_MARKER,
    )
  ) {
    throw new RangeError(
      'Point-25.5 GLSL patch requires Three.js standard <common> and <map_fragment> shader chunks.',
    );
  }

  const withUniforms =
    fragmentShader.replace(
      GLSL_COMMON_MARKER,
      `${GLSL_COMMON_MARKER}\nuniform float uGenesisAlbedoContrast;\nuniform float uGenesisAlbedoSaturation;\nuniform float uGenesisPolarAlbedoLift;\nuniform float uGenesisRefinementStrength;`,
    );

  return withUniforms.replace(
    GLSL_MAP_MARKER,
    `${GLSL_MAP_MARKER}\n#ifdef USE_MAP\n  float genesisAlbedoLuma = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));\n  vec3 genesisChromaPreserved = mix(vec3(genesisAlbedoLuma), diffuseColor.rgb, uGenesisAlbedoSaturation);\n  vec3 genesisContrasted = (genesisChromaPreserved - vec3(0.5)) * uGenesisAlbedoContrast + vec3(0.5);\n  float genesisAbsoluteLatitude = abs(vMapUv.y * 2.0 - 1.0);\n  float genesisPolarLift = smoothstep(0.60, 0.98, genesisAbsoluteLatitude) * uGenesisPolarAlbedoLift;\n  vec3 genesisRefinedAlbedo = clamp(genesisContrasted + vec3(genesisPolarLift), vec3(0.0), vec3(1.0));\n  diffuseColor.rgb = mix(diffuseColor.rgb, genesisRefinedAlbedo, uGenesisRefinementStrength);\n#endif`,
  );
}

function optionalIndex01(
  value:
    number | undefined,

  label:
    string,
): number {

  if (
    value ===
      undefined
  ) {
    return 0;
  }

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0 ||
    value >
      1
  ) {
    throw new RangeError(
      `${label} must be finite in [0, 1] when supplied.`,
    );
  }

  return value;
}

function clamp(
  value:
    number,

  minimum:
    number,

  maximum:
    number,
): number {

  return Math.max(
    minimum,
    Math.min(
      maximum,
      value,
    ),
  );
}
