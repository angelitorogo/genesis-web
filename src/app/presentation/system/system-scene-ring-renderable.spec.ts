import * as THREE from 'three';

import {
  buildSystemScenePlanetSpecialPresentationV1,
} from './system-scene-planet-special-presentation';

import {
  buildSystemSceneRingBandSpecsV1,
  createSystemSceneRingRenderableV1,
} from './system-scene-ring-renderable';

describe(
  'SystemScene ring renderable point 25.9',
  () => {
    const rings = buildSystemScenePlanetSpecialPresentationV1({
      planetId: 'planet-6',
      planetType: 'ICE_GIANT',
      radiusEarth: 4.1,
      densityGramsPerCubicCentimeter: 1.3,
      envelopeMassFraction01: 0.25,
      iceBearingFractionOfSolids01: 0.62,
      rotationPeriodHours: 11,
      axialTiltDegrees: 97,
      referenceBondAlbedo01: 0.48,
      rarityTraits: ['EXTREME_OBLIQUITY'],
      giantMoonProfile: {
        sourceMoonCount: 31,
        sourceSatelliteCapacityIndex01: 0.82,
        richnessIndex01: 0.58,
        architectureRegime: 'DEVELOPED_GIANT_SYSTEM',
      },
    }).rings!;

    it(
      'should create deterministic separated radial bands and explicit gaps',
      () => {
        const first = buildSystemSceneRingBandSpecsV1(rings);
        const second = buildSystemSceneRingBandSpecsV1(rings);

        expect(first).toEqual(second);
        expect(first).toHaveLength(rings.bandCount);
        expect(Object.isFrozen(first)).toBe(true);
        expect(first[0]!.opacity01).toBeGreaterThanOrEqual(0.10);

        for (let index = 1; index < first.length; index += 1) {
          expect(first[index]!.innerRadiusPlanetRadii).toBeGreaterThan(
            first[index - 1]!.outerRadiusPlanetRadii,
          );
        }
      },
    );

    it(
      'should materialize double-sided transparent Three.js ring meshes in the equatorial plane',
      () => {
        const renderable = createSystemSceneRingRenderableV1(0.05, rings);

        expect(renderable.group.children).toHaveLength(rings.bandCount);
        expect(renderable.group.rotation.x).toBeCloseTo(-Math.PI / 2, 12);
        expect(renderable.resources).toHaveLength(rings.bandCount * 2);

        const firstMesh = renderable.group.children[0] as THREE.Mesh<
          THREE.RingGeometry,
          THREE.MeshStandardMaterial
        >;
        expect(firstMesh.geometry).toBeInstanceOf(THREE.RingGeometry);
        expect(firstMesh.material.side).toBe(THREE.DoubleSide);
        expect(firstMesh.material.transparent).toBe(true);
        expect(firstMesh.material.depthWrite).toBe(false);
        expect(firstMesh.material.emissiveIntensity).toBeGreaterThan(0.04);
        expect(firstMesh.material.roughness).toBeLessThan(0.7);

        for (const resource of renderable.resources) {
          resource.dispose();
        }
      },
    );

    it(
      'should reject invalid scene radii',
      () => {
        expect(() => createSystemSceneRingRenderableV1(0, rings)).toThrow(
          RangeError,
        );
      },
    );
  },
);
