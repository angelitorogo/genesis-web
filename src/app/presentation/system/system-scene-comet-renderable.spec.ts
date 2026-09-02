import * as THREE from 'three';

import {
  buildSystemSceneCometPresentationV1,
  systemSceneCometActivityAtDistanceV1,
} from './system-scene-comet-presentation';

import {
  applySystemSceneCometActivityVisualV1,
  cometDirectionalRadiusFactorV1,
  createSystemSceneCometRenderableV1,
} from './system-scene-comet-renderable';

describe(
  'SystemScene comet renderable point 25.8',
  () => {
    const presentation = buildSystemSceneCometPresentationV1({
      proceduralId: 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
      diameterKilometers: 14,
      iceFraction01: 0.7,
      dustFraction01: 0.3,
      porosityIndex01: 0.66,
      bulkDensityGramsPerCubicCentimeter: 0.58,
      geometricAlbedo01: 0.04,
      volatileRichnessIndex01: 0.84,
      periodRegime: 'SHORT_PERIOD',
      referenceLuminositySolar: 1,
      semiMajorAxisAu: 4,
      eccentricity: 0.75,
      periapsisAu: 1,
      apoapsisAu: 7,
      orbitalPeriodYears: 8,
      epochMeanAnomalyDegrees: 0,
      presentationTimeScale: 1,
    });

    it(
      'should create one irregular nucleus with initially hidden coma and tails',
      () => {
        const renderable = createSystemSceneCometRenderableV1(0.014, presentation);

        expect(renderable.object.children.length).toBe(5);
        expect(renderable.binding.comaInner.visible).toBe(false);
        expect(renderable.binding.comaOuter.visible).toBe(false);
        expect(renderable.binding.dustTail.visible).toBe(false);
        expect(renderable.binding.ionTail.visible).toBe(false);
        expect(renderable.resources.length).toBe(10);

        renderable.resources.forEach(resource => resource.dispose());
      },
    );

    it(
      'should deterministically deform the comet nucleus away from a perfect sphere',
      () => {
        const samples = [
          cometDirectionalRadiusFactorV1(1, 0, 0, presentation.shapeSeedUint32, 0.6),
          cometDirectionalRadiusFactorV1(0, 1, 0, presentation.shapeSeedUint32, 0.6),
          cometDirectionalRadiusFactorV1(0, 0, 1, presentation.shapeSeedUint32, 0.6),
        ];

        expect(new Set(samples.map(value => value.toFixed(8))).size).toBeGreaterThan(1);
        expect(samples.every(value => value >= 0.70 && value <= 1.30)).toBe(true);
      },
    );

    it(
      'should reveal and orient coma/dust/ion tails away from stellar illumination',
      () => {
        const radiusScene = 0.014;
        const renderable = createSystemSceneCometRenderableV1(radiusScene, presentation);
        const active = systemSceneCometActivityAtDistanceV1(
          presentation,
          1,
          radiusScene,
        );
        const antiStellar = new THREE.Vector3(-1, 0.25, 0).normalize();

        applySystemSceneCometActivityVisualV1(
          renderable.binding,
          active,
          antiStellar,
        );

        expect(renderable.binding.comaOuter.visible).toBe(true);
        expect(renderable.binding.dustTail.visible).toBe(true);
        expect(renderable.binding.ionTail.visible).toBe(true);
        expect(renderable.binding.ionTail.scale.x).toBeGreaterThan(
          renderable.binding.dustTail.scale.x,
        );

        const tailAxis = new THREE.Vector3(1, 0, 0)
          .applyQuaternion(renderable.binding.ionTail.quaternion)
          .normalize();
        expect(tailAxis.dot(antiStellar)).toBeGreaterThan(0.999);

        renderable.resources.forEach(resource => resource.dispose());
      },
    );
  },
);
