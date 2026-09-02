export type SystemSceneRenderBackend =
  'WEBGL2';

export type SystemSceneShaderPipeline =
  'GLSL_WEBGL2_V1';

export type SystemSceneWebGpuEvaluation =
  | 'API_AVAILABLE_NOT_SELECTED'
  | 'API_UNAVAILABLE';

export interface SystemSceneRenderBackendAssessmentV1 {
  readonly version:
    1;

  readonly selectedBackend:
    SystemSceneRenderBackend;

  readonly shaderPipeline:
    SystemSceneShaderPipeline;

  readonly webGpuEvaluation:
    SystemSceneWebGpuEvaluation;

  readonly webGpuApiAvailable:
    boolean;

  readonly webGpuSelected:
    false;

  readonly compatibilityBaseline:
    'WEBGL2_REQUIRED';
}

export interface SystemSceneRenderBackendAssessmentInput {
  readonly webGl2Available:
    boolean;

  readonly webGpuApiAvailable:
    boolean;
}

/**
 * Point 25.5 renderer-backend decision.
 *
 * WebGL2 remains the mandatory compatibility baseline. WebGPU is deliberately
 * evaluated only as an optional capability signal in V1; it is never selected
 * implicitly because the current material path is Three.js WebGL + GLSL and
 * must remain available on every browser already supported by the renderer.
 */
export function buildSystemSceneRenderBackendAssessmentV1(
  input:
    SystemSceneRenderBackendAssessmentInput,
): SystemSceneRenderBackendAssessmentV1 {

  if (
    input.webGl2Available !==
      true
  ) {
    throw new RangeError(
      'Point-25.5 requires the WebGL2 compatibility baseline before optional WebGPU evaluation.',
    );
  }

  return Object.freeze({
    version:
      1 as const,
    selectedBackend:
      'WEBGL2' as const,
    shaderPipeline:
      'GLSL_WEBGL2_V1' as const,
    webGpuEvaluation:
      input.webGpuApiAvailable
        ? 'API_AVAILABLE_NOT_SELECTED' as const
        : 'API_UNAVAILABLE' as const,
    webGpuApiAvailable:
      input.webGpuApiAvailable,
    webGpuSelected:
      false as const,
    compatibilityBaseline:
      'WEBGL2_REQUIRED' as const,
  });
}

/**
 * Browser-safe feature probe without importing WebGPU DOM types. This keeps
 * compilation compatible with TypeScript/lib.dom versions where navigator.gpu
 * is not declared yet.
 */
export function systemSceneWebGpuApiAvailable(
  navigatorLike:
    unknown,
): boolean {

  if (
    navigatorLike ===
      null ||
    typeof navigatorLike !==
      'object'
  ) {
    return false;
  }

  const record =
    navigatorLike as Readonly<Record<string, unknown>>;

  const gpu =
    record['gpu'];

  return (
    gpu !==
      null &&
    (
      typeof gpu ===
        'object' ||
      typeof gpu ===
        'function'
    )
  );
}
