import * as THREE from 'three';

import {
  buildSystemSceneAtmosphereOpticsV1,
} from './system-scene-atmosphere-optics';

import {
  ATMOSPHERE_FRAGMENT_SHADER_V1,
  buildSystemSceneDayNightMaterialProfileV1,
  createSystemSceneAtmosphereShellMaterialV1,
  installSystemSceneDayNightMaterialV1,
  patchSystemSceneDayNightFragmentShaderV1,
} from './system-scene-atmosphere-material';

import {
  buildSystemSceneGlslMaterialProfileV1,
  installSystemSceneGlslMaterialV1,
} from './system-scene-glsl-material';

describe(
  'SystemScene atmosphere/day-night GLSL point 25.6',
  () => {
    const atmosphericOptics = buildSystemSceneAtmosphereOpticsV1({
      baseColorHex: '#4B7FCB',
      surfaceStyle: 'oceanic',
      surfaceEnvironment: {
        solidSurfaceAvailable: true,
        retainedSurfacePressurePascal: 101_325,
        retainedAtmosphericWaterVaporMoleFraction01: 0.02,
        presentationCloudCoverageFraction01: 0.4,
        surfaceIceCoverageFraction01: 0.08,
      },
      giantAtmosphere: null,
    });

    it(
      'should patch the standard material after point-25.5 without replacing Three lighting',
      () => {
        const source = [
          '#include <common>',
          '#include <map_fragment>',
          'vec3 outgoingLight = vec3(1.0);',
          'vec3 normal = vec3(0.0, 0.0, 1.0);',
          '#include <opaque_fragment>',
        ].join('\n');
        const patched = patchSystemSceneDayNightFragmentShaderV1(source);

        expect(patched).toContain('uGenesisLightDirectionsView[3]');
        expect(patched).toContain('genesisDayFactor');
        expect(patched).toContain('genesisTwilightEnergy');
        expect(patched).toContain('#include <opaque_fragment>');
      },
    );

    it(
      'should compose after point-25.5 and retain both GLSL refinements in one standard material',
      () => {
        const material = new THREE.MeshStandardMaterial();
        const binding = {
          lightDirectionsView: [
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, 1, 0),
          ] as const,
          lightWeightsView: new THREE.Vector3(0.7, 0.2, 0.1),
        };
        const profile = buildSystemSceneDayNightMaterialProfileV1(
          atmosphericOptics,
        );

        installSystemSceneGlslMaterialV1(
          material,
          buildSystemSceneGlslMaterialProfileV1({
            kind: 'SOLID_SURFACE',
            liquidCoverageFraction01: 0.45,
            iceCoverageFraction01: 0.08,
            desertCoverageFraction01: 0.12,
            volcanismIndex01: 0.04,
          }),
        );
        installSystemSceneDayNightMaterialV1(material, profile, binding);

        const shader = {
          uniforms: {},
          fragmentShader: [
            '#include <common>',
            '#include <map_fragment>',
            'vec3 normal = vec3(0.0, 0.0, 1.0);',
            'vec3 outgoingLight = vec3(1.0);',
            '#include <opaque_fragment>',
          ].join('\n'),
        } as unknown as Parameters<typeof material.onBeforeCompile>[0];

        material.onBeforeCompile(
          shader,
          {} as THREE.WebGLRenderer,
        );

        expect(material.customProgramCacheKey()).toContain(
          'GENESIS-25.5-GLSL-V1-SOLID_SURFACE',
        );
        expect(material.customProgramCacheKey()).toContain(
          'GENESIS-25.6-DAY-NIGHT-V1-ATM',
        );
        expect(shader.fragmentShader).toContain('genesisRefinedAlbedo');
        expect(shader.fragmentShader).toContain('genesisDayFactor');
        expect(shader.uniforms['uGenesisAlbedoContrast']).toBeTruthy();
        expect(shader.uniforms['uGenesisLightDirectionsView']).toBeTruthy();
        expect(shader.uniforms['uGenesisLightWeights']).toBeTruthy();
        expect(material.userData['genesisDayNightPipeline']).toEqual({
          version: 1,
          pipeline: 'GLSL_WEBGL2_DAY_NIGHT_V1',
          atmospherePresent: true,
        });
      },
    );

    it(
      'should create an additive back-side atmosphere shell only when atmosphere is present',
      () => {
        const binding = {
          lightDirectionsView: [
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, 1, 0),
          ] as const,
          lightWeightsView: new THREE.Vector3(0.7, 0.2, 0.1),
        };
        const material = createSystemSceneAtmosphereShellMaterialV1(
          atmosphericOptics,
          binding,
        );

        expect(material).not.toBeNull();
        expect(material!.side).toBe(THREE.BackSide);
        expect(material!.transparent).toBe(true);
        expect(material!.depthWrite).toBe(false);
        expect(material!.fragmentShader).toBe(ATMOSPHERE_FRAGMENT_SHADER_V1);
        expect(material!.uniforms['uGenesisLightDirectionsView'].value).toBe(
          binding.lightDirectionsView,
        );
        expect(material!.uniforms['uGenesisLightWeights'].value).toBe(
          binding.lightWeightsView,
        );
        material!.dispose();

        const vacuum = buildSystemSceneAtmosphereOpticsV1({
          baseColorHex: '#8F7964',
          surfaceStyle: 'rocky',
          surfaceEnvironment: {
            solidSurfaceAvailable: true,
            retainedSurfacePressurePascal: 0,
            retainedAtmosphericWaterVaporMoleFraction01: 0,
            presentationCloudCoverageFraction01: 0,
            surfaceIceCoverageFraction01: 0,
          },
          giantAtmosphere: null,
        });

        expect(
          createSystemSceneAtmosphereShellMaterialV1(vacuum, binding),
        ).toBeNull();
      },
    );

    it(
      'should reject shader sources that do not expose the required standard chunks',
      () => {
        expect(() =>
          patchSystemSceneDayNightFragmentShaderV1('void main() {}'),
        ).toThrow(RangeError);
      },
    );
  },
);
