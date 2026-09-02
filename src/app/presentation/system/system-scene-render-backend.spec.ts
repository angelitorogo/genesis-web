import {
  buildSystemSceneRenderBackendAssessmentV1,
  systemSceneWebGpuApiAvailable,
} from './system-scene-render-backend';

describe(
  'SystemScene renderer backend point 25.5',
  () => {
    it(
      'should keep WebGL2 selected even when a WebGPU API is available',
      () => {
        const assessment =
          buildSystemSceneRenderBackendAssessmentV1({
            webGl2Available:
              true,
            webGpuApiAvailable:
              true,
          });

        expect(
          assessment,
        ).toEqual({
          version:
            1,
          selectedBackend:
            'WEBGL2',
          shaderPipeline:
            'GLSL_WEBGL2_V1',
          webGpuEvaluation:
            'API_AVAILABLE_NOT_SELECTED',
          webGpuApiAvailable:
            true,
          webGpuSelected:
            false,
          compatibilityBaseline:
            'WEBGL2_REQUIRED',
        });

        expect(
          Object.isFrozen(
            assessment,
          ),
        ).toBe(true);
      },
    );

    it(
      'should report WebGPU as optional-unavailable without changing the WebGL2 baseline',
      () => {
        const assessment =
          buildSystemSceneRenderBackendAssessmentV1({
            webGl2Available:
              true,
            webGpuApiAvailable:
              false,
          });

        expect(
          assessment.selectedBackend,
        ).toBe(
          'WEBGL2',
        );

        expect(
          assessment.shaderPipeline,
        ).toBe(
          'GLSL_WEBGL2_V1',
        );

        expect(
          assessment.webGpuEvaluation,
        ).toBe(
          'API_UNAVAILABLE',
        );

        expect(
          assessment.webGpuSelected,
        ).toBe(false);
      },
    );

    it(
      'should reject any attempt to evaluate the optional path without the required WebGL2 baseline',
      () => {
        expect(
          () =>
            buildSystemSceneRenderBackendAssessmentV1({
              webGl2Available:
                false,
              webGpuApiAvailable:
                true,
            }),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should detect navigator.gpu without depending on WebGPU DOM typings',
      () => {
        expect(
          systemSceneWebGpuApiAvailable({
            gpu: {},
          }),
        ).toBe(true);

        expect(
          systemSceneWebGpuApiAvailable({
            gpu: () => {},
          }),
        ).toBe(true);

        expect(
          systemSceneWebGpuApiAvailable({}),
        ).toBe(false);

        expect(
          systemSceneWebGpuApiAvailable(null),
        ).toBe(false);
      },
    );
  },
);
