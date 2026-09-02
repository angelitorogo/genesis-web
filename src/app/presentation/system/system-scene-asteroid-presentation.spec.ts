import {
  buildSystemSceneAsteroidPresentationV1,
  systemSceneAsteroidPresentationSeed,
  type SystemSceneAsteroidPresentationInputV1,
} from './system-scene-asteroid-presentation';

describe(
  'SystemScene asteroid presentation point 25.7',
  () => {
    const rocky = {
      proceduralId: '0123456789ABCDEFFEDCBA9876543210',
      diameterKilometers: 320,
      compositionRegime: 'SILICACEOUS',
      structureRegime: 'FRACTURED',
      multiplicityRegime: 'SINGLE',
      carbonaceousFraction01: 0.10,
      silicateFraction01: 0.70,
      metalFraction01: 0.18,
      iceFraction01: 0.02,
      porosityIndex01: 0.22,
      bulkDensityGramsPerCubicCentimeter: 3.1,
      geometricAlbedo01: 0.18,
      binaryMassRatio01: null,
      binarySeparationPrimaryRadii: null,
    } satisfies SystemSceneAsteroidPresentationInputV1;

    it(
      'should deterministically project point-22.4 taxonomy into an irregular read-only visual identity',
      () => {
        const first = buildSystemSceneAsteroidPresentationV1(rocky);
        const second = buildSystemSceneAsteroidPresentationV1(rocky);

        expect(first).toEqual(second);
        expect(Object.isFrozen(first)).toBe(true);
        expect(first.source).toBe('PHASE_22_4_ASTEROID_TAXONOMY');
        expect(first.shapeSeedUint32).toBe(
          systemSceneAsteroidPresentationSeed(rocky.proceduralId),
        );
        expect(first.presentationIrregularity01).toBeGreaterThan(0.2);
        expect(first.presentationAxisScaleX + first.presentationAxisScaleY + first.presentationAxisScaleZ)
          .toBeCloseTo(3, 10);
      },
    );

    it(
      'should make rubble piles more irregular than coherent bodies without changing taxonomy',
      () => {
        const coherent = buildSystemSceneAsteroidPresentationV1({
          ...rocky,
          structureRegime: 'COHERENT',
          porosityIndex01: 0.06,
        });
        const rubble = buildSystemSceneAsteroidPresentationV1({
          ...rocky,
          structureRegime: 'RUBBLE_PILE',
          porosityIndex01: 0.52,
        });

        expect(rubble.presentationIrregularity01).toBeGreaterThan(
          coherent.presentationIrregularity01,
        );
        expect(rubble.presentationFacetContrast01).toBeGreaterThan(
          coherent.presentationFacetContrast01,
        );
      },
    );

    it(
      'should preserve detached-binary Ground Truth while deriving bounded companion presentation scales',
      () => {
        const binary = buildSystemSceneAsteroidPresentationV1({
          ...rocky,
          multiplicityRegime: 'BINARY',
          binaryMassRatio01: 0.216,
          binarySeparationPrimaryRadii: 7.5,
        });

        expect(binary.binaryMassRatio01).toBe(0.216);
        expect(binary.binarySeparationPrimaryRadii).toBe(7.5);
        expect(binary.presentationDetachedSecondaryRadiusScale01).toBeCloseTo(0.6, 10);
        expect(binary.presentationDetachedSeparation01).toBeGreaterThanOrEqual(0.62);
        expect(binary.presentationDetachedSeparation01).toBeLessThanOrEqual(0.94);
        expect(binary.presentationSeparationAdjusted).toBe(true);
      },
    );

    it(
      'should derive a contact-binary lobe ratio without inventing detached-orbit parameters',
      () => {
        const contact = buildSystemSceneAsteroidPresentationV1({
          ...rocky,
          multiplicityRegime: 'CONTACT_BINARY',
        });

        expect(contact.presentationContactSecondaryRadiusScale01).toBeGreaterThanOrEqual(0.5);
        expect(contact.presentationContactSecondaryRadiusScale01).toBeLessThanOrEqual(0.9);
        expect(contact.binaryMassRatio01).toBeNull();
        expect(contact.presentationDetachedSeparation01).toBeNull();
      },
    );

    it(
      'should give composition families visibly separated base palettes',
      () => {
        const colors = new Set(
          [
            'CARBONACEOUS',
            'SILICACEOUS',
            'METALLIC',
            'ICE_RICH',
            'MIXED_ROCK_ICE',
          ].map(compositionRegime =>
            buildSystemSceneAsteroidPresentationV1({
              ...rocky,
              compositionRegime:
                compositionRegime as SystemSceneAsteroidPresentationInputV1['compositionRegime'],
            }).presentationColorHex,
          ),
        );

        expect(colors.size).toBe(5);
      },
    );

    it(
      'should reject malformed detached-binary presentation sources',
      () => {
        expect(() =>
          buildSystemSceneAsteroidPresentationV1({
            ...rocky,
            multiplicityRegime: 'BINARY',
            binaryMassRatio01: null,
            binarySeparationPrimaryRadii: null,
          }),
        ).toThrow(RangeError);
      },
    );
  },
);
