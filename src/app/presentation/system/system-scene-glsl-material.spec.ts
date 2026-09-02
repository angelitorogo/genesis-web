import * as THREE from 'three';

import {
  buildSystemSceneGlslMaterialProfileV1,
  installSystemSceneGlslMaterialV1,
  patchSystemSceneStandardFragmentShaderV1,
} from './system-scene-glsl-material';

describe(
  'SystemScene GLSL material point 25.5',
  () => {
    it(
      'should derive bounded solid-surface refinement without inventing atmosphere or terrain',
      () => {
        const dry =
          buildSystemSceneGlslMaterialProfileV1({
            kind:
              'SOLID_SURFACE',
            desertCoverageFraction01:
              0.8,
            volcanismIndex01:
              0.6,
          });

        const oceanic =
          buildSystemSceneGlslMaterialProfileV1({
            kind:
              'SOLID_SURFACE',
            liquidCoverageFraction01:
              0.75,
            iceCoverageFraction01:
              0.1,
          });

        expect(
          dry.albedoContrast,
        ).toBeGreaterThan(
          oceanic.albedoContrast,
        );

        expect(
          dry.polarAlbedoLift,
        ).toBe(0);

        expect(
          dry.albedoContrast,
        ).toBeGreaterThanOrEqual(1.03);

        expect(
          dry.albedoContrast,
        ).toBeLessThanOrEqual(1.16);

        expect(
          Object.isFrozen(
            dry,
          ),
        ).toBe(true);
      },
    );

    it(
      'should let authoritative 25.4 jet/haze proxies strengthen giant texture readability within bounded limits',
      () => {
        const calm =
          buildSystemSceneGlslMaterialProfileV1({
            kind:
              'DEEP_ENVELOPE',
            giantJetSharpness01:
              0.15,
            giantTurbulence01:
              0.1,
            giantPolarHaze01:
              0.2,
          });

        const active =
          buildSystemSceneGlslMaterialProfileV1({
            kind:
              'DEEP_ENVELOPE',
            giantJetSharpness01:
              0.9,
            giantTurbulence01:
              0.8,
            giantMethaneBlueing01:
              0.65,
            giantPolarHaze01:
              0.9,
            giantUpperHaze01:
              0.7,
          });

        expect(
          active.albedoContrast,
        ).toBeGreaterThan(
          calm.albedoContrast,
        );

        expect(
          active.albedoSaturation,
        ).toBeGreaterThan(
          calm.albedoSaturation,
        );

        expect(
          active.polarAlbedoLift,
        ).toBeGreaterThan(
          calm.polarAlbedoLift,
        );

        expect(
          active.refinementStrength01,
        ).toBeLessThanOrEqual(0.90);
      },
    );

    it(
      'should inject the GLSL refinement after Three map sampling while preserving the standard shader chunks',
      () => {
        const original =
          [
            'void main() {',
            '  #include <common>',
            '  vec4 diffuseColor = vec4(1.0);',
            '  #include <map_fragment>',
            '}',
          ].join('\n');

        const patched =
          patchSystemSceneStandardFragmentShaderV1(
            original,
          );

        expect(
          patched,
        ).toContain(
          '#include <common>',
        );

        expect(
          patched,
        ).toContain(
          '#include <map_fragment>',
        );

        expect(
          patched,
        ).toContain(
          'uniform float uGenesisAlbedoContrast;',
        );

        expect(
          patched,
        ).toContain(
          'genesisChromaPreserved',
        );

        expect(
          patched,
        ).toContain(
          'vMapUv.y',
        );
      },
    );

    it(
      'should fail fast if a future Three shader no longer exposes the required chunks',
      () => {
        expect(
          () =>
            patchSystemSceneStandardFragmentShaderV1(
              'void main() {}',
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should install a stable WebGL2 shader cache key without requiring a WebGL context',
      () => {
        const material =
          new THREE.MeshStandardMaterial({
            color:
              0xffffff,
          });

        const profile =
          buildSystemSceneGlslMaterialProfileV1({
            kind:
              'DEEP_ENVELOPE',
            giantJetSharpness01:
              0.75,
          });

        installSystemSceneGlslMaterialV1(
          material,
          profile,
        );

        expect(
          material.customProgramCacheKey(),
        ).toBe(
          'GENESIS-25.5-GLSL-V1-DEEP_ENVELOPE',
        );

        expect(
          material.userData['genesisShaderPipeline'],
        ).toEqual({
          version:
            1,
          pipeline:
            'GLSL_WEBGL2_V1',
          kind:
            'DEEP_ENVELOPE',
        });

        material.dispose();
      },
    );

    it(
      'should reject out-of-range presentation inputs',
      () => {
        expect(
          () =>
            buildSystemSceneGlslMaterialProfileV1({
              kind:
                'SOLID_SURFACE',
              liquidCoverageFraction01:
                1.1,
            }),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            buildSystemSceneGlslMaterialProfileV1({
              kind:
                'DEEP_ENVELOPE',
              giantTurbulence01:
                -0.1,
            }),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
