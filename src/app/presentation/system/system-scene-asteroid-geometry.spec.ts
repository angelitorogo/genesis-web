import {
  buildSystemSceneAsteroidLobeLayoutV1,
  createIrregularAsteroidGeometryV1,
} from './system-scene-asteroid-geometry';

import {
  buildSystemSceneAsteroidPresentationV1,
  type SystemSceneAsteroidPresentationInputV1,
} from './system-scene-asteroid-presentation';

describe(
  'SystemScene irregular asteroid geometry point 25.7',
  () => {
    const source = {
      proceduralId: '89ABCDEF0123456776543210FEDCBA98',
      diameterKilometers: 180,
      compositionRegime: 'CARBONACEOUS',
      structureRegime: 'RUBBLE_PILE',
      multiplicityRegime: 'SINGLE',
      carbonaceousFraction01: 0.62,
      silicateFraction01: 0.22,
      metalFraction01: 0.06,
      iceFraction01: 0.10,
      porosityIndex01: 0.48,
      bulkDensityGramsPerCubicCentimeter: 1.45,
      geometricAlbedo01: 0.06,
      binaryMassRatio01: null,
      binarySeparationPrimaryRadii: null,
    } satisfies SystemSceneAsteroidPresentationInputV1;

    it(
      'should build one irregular lobe for a single asteroid',
      () => {
        const presentation = buildSystemSceneAsteroidPresentationV1(source);
        const layout = buildSystemSceneAsteroidLobeLayoutV1(presentation);
        expect(layout).toHaveLength(1);
        expect(Object.isFrozen(layout)).toBe(true);

        const geometry = createIrregularAsteroidGeometryV1(0.02, presentation);
        const position = geometry.getAttribute('position');
        const color = geometry.getAttribute('color');
        expect(position.count).toBeGreaterThan(100);
        expect(color.count).toBe(position.count);
        expect(geometry.boundingSphere).not.toBeNull();
        geometry.dispose();
      },
    );

    it(
      'should expose two touching lobes for contact binaries and two detached lobes for binaries',
      () => {
        const contact = buildSystemSceneAsteroidPresentationV1({
          ...source,
          multiplicityRegime: 'CONTACT_BINARY',
        });
        const binary = buildSystemSceneAsteroidPresentationV1({
          ...source,
          multiplicityRegime: 'BINARY',
          binaryMassRatio01: 0.4,
          binarySeparationPrimaryRadii: 5,
        });

        expect(buildSystemSceneAsteroidLobeLayoutV1(contact)).toHaveLength(2);
        const detached = buildSystemSceneAsteroidLobeLayoutV1(binary);
        expect(detached).toHaveLength(2);
        expect(detached[0]!.offsetXScale).toBeLessThan(0);
        expect(detached[1]!.offsetXScale).toBeGreaterThan(0);
      },
    );

    it(
      'should produce deterministic vertex deformation for the same asteroid identity',
      () => {
        const presentation = buildSystemSceneAsteroidPresentationV1(source);
        const first = createIrregularAsteroidGeometryV1(0.02, presentation, 41);
        const second = createIrregularAsteroidGeometryV1(0.02, presentation, 41);
        const firstPosition = first.getAttribute('position');
        const secondPosition = second.getAttribute('position');

        expect(firstPosition.count).toBe(secondPosition.count);
        for (let index = 0; index < Math.min(firstPosition.count, 24); index += 1) {
          expect(firstPosition.getX(index)).toBeCloseTo(secondPosition.getX(index), 12);
          expect(firstPosition.getY(index)).toBeCloseTo(secondPosition.getY(index), 12);
          expect(firstPosition.getZ(index)).toBeCloseTo(secondPosition.getZ(index), 12);
        }

        first.dispose();
        second.dispose();
      },
    );
  },
);
