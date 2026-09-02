import {
  buildSystemScenePlanetSpecialPresentationV1,
} from './system-scene-planet-special-presentation';

describe(
  'SystemScene planet rings/special presentation point 25.9',
  () => {
    const giant = {
      planetId: 'planet-4',
      planetType: 'GAS_GIANT',
      radiusEarth: 9.8,
      densityGramsPerCubicCentimeter: 1.1,
      envelopeMassFraction01: 0.72,
      iceBearingFractionOfSolids01: 0.31,
      rotationPeriodHours: 8.6,
      axialTiltDegrees: 26,
      referenceBondAlbedo01: 0.42,
      rarityTraits: ['RAPID_ROTATOR'] as const,
      giantMoonProfile: {
        sourceMoonCount: 84,
        sourceSatelliteCapacityIndex01: 0.93,
        richnessIndex01: 0.81,
        architectureRegime: 'RICH_GIANT_SYSTEM',
      },
    };

    it(
      'should create deterministic giant-ring presentation while explicitly keeping ring presence non-authoritative',
      () => {
        const first = buildSystemScenePlanetSpecialPresentationV1(giant);
        const second = buildSystemScenePlanetSpecialPresentationV1(giant);

        expect(first).toEqual(second);
        expect(Object.isFrozen(first)).toBe(true);
        expect(Object.isFrozen(first.rings!)).toBe(true);
        expect(first.rings!.source).toBe(
          'GIANT_RING_PRESENTATION_PROXY_25_9',
        );
        expect(first.rings!.presenceAuthoritative).toBe(false);
        expect(first.rings!.innerRadiusPlanetRadii).toBeGreaterThan(1);
        expect(first.rings!.outerRadiusPlanetRadii).toBeGreaterThan(
          first.rings!.innerRadiusPlanetRadii,
        );
        expect(first.rings!.bandCount).toBeGreaterThanOrEqual(4);
        expect(first.rings!.opticalDepth01).toBeGreaterThan(0);
        expect(
          first.rings!.iceFraction01 + first.rings!.dustFraction01,
        ).toBeCloseTo(1, 12);
      },
    );

    it(
      'should not invent rocky-world rings before the domain actually materializes them',
      () => {
        const rocky = buildSystemScenePlanetSpecialPresentationV1({
          ...giant,
          planetId: 'planet-1',
          planetType: 'ROCKY',
          radiusEarth: 1.1,
          densityGramsPerCubicCentimeter: 5.3,
          envelopeMassFraction01: 0.01,
          rotationPeriodHours: 22,
          giantMoonProfile: null,
          rarityTraits: [] as const,
        });

        expect(rocky.rings).toBeNull();
      },
    );


    it(
      'should allow a modest non-authoritative fallback ring proxy for some giants without a frozen giant-moon profile',
      () => {
        const fallback = buildSystemScenePlanetSpecialPresentationV1({
          ...giant,
          planetId: 'planet-7',
          planetType: 'ICE_GIANT',
          giantMoonProfile: null,
          envelopeMassFraction01: 0.72,
          iceBearingFractionOfSolids01: 0.82,
          referenceBondAlbedo01: 0.62,
        });

        expect(fallback.rings).not.toBeNull();
        expect(fallback.rings!.presenceAuthoritative).toBe(false);
        expect(fallback.rings!.sourceMoonCount).toBe(0);
        expect(fallback.rings!.sourceMoonArchitectureRegime).toBe(
          'PRESENTATION_PROXY_GIANT_RING_CANDIDATE',
        );
      },
    );

    it(
      'should keep ring occurrence reduced for weak giant candidates while preserving deterministic fallback hits for stronger ones',
      () => {
        const weakFallback = buildSystemScenePlanetSpecialPresentationV1({
          ...giant,
          planetId: 'planet-8',
          planetType: 'MINI_NEPTUNE',
          giantMoonProfile: null,
          envelopeMassFraction01: 0.14,
          iceBearingFractionOfSolids01: 0.12,
          referenceBondAlbedo01: 0.09,
        });

        expect(weakFallback.rings).toBeNull();
      },
    );

    it(
      'should create visibly varied ring families across deterministic giant identities',
      () => {
        const first = buildSystemScenePlanetSpecialPresentationV1({
          ...giant,
          planetId: 'planet-11',
          planetType: 'GAS_GIANT',
        }).rings!;
        const second = buildSystemScenePlanetSpecialPresentationV1({
          ...giant,
          planetId: 'planet-18',
          planetType: 'ICE_GIANT',
          iceBearingFractionOfSolids01: 0.67,
          giantMoonProfile: {
            sourceMoonCount: 18,
            sourceSatelliteCapacityIndex01: 0.77,
            richnessIndex01: 0.69,
            architectureRegime: 'DEVELOPED_GIANT_SYSTEM',
          },
        }).rings!;

        expect(first.outerRadiusPlanetRadii).not.toBeCloseTo(
          second.outerRadiusPlanetRadii,
          6,
        );
        expect(first.opticalDepth01).not.toBeCloseTo(
          second.opticalDepth01,
          6,
        );
        expect(first.presentationBaseColorHex).not.toBe(
          second.presentationBaseColorHex,
        );
      },
    );

    it(
      'should keep deterministic giant-ring occurrence in a moderate range instead of all-or-none behavior',
      () => {
        let ringCount = 0;

        for (let ordinal = 1; ordinal <= 64; ordinal += 1) {
          const sample = buildSystemScenePlanetSpecialPresentationV1({
            ...giant,
            planetId: `frequency-sample-${ordinal}`,
          });

          if (sample.rings !== null) {
            ringCount += 1;
          }
        }

        expect(ringCount).toBeGreaterThanOrEqual(12);
        expect(ringCount).toBeLessThanOrEqual(30);
      },
    );

    it(
      'should expose stronger bounded oblateness for a rapid low-density giant than for a slow rocky world',
      () => {
        const rapid = buildSystemScenePlanetSpecialPresentationV1(giant);
        const slow = buildSystemScenePlanetSpecialPresentationV1({
          ...giant,
          planetId: 'planet-1',
          planetType: 'ROCKY',
          radiusEarth: 1,
          densityGramsPerCubicCentimeter: 5.5,
          envelopeMassFraction01: 0,
          rotationPeriodHours: 24,
          giantMoonProfile: null,
          rarityTraits: [] as const,
        });

        expect(rapid.oblateness.presentationFlattening01).toBeGreaterThan(
          slow.oblateness.presentationFlattening01,
        );
        expect(rapid.oblateness.presentationPolarScale).toBeLessThan(
          rapid.oblateness.presentationEquatorialScale,
        );
        expect(rapid.oblateness.presentationFlattening01).toBeLessThanOrEqual(
          0.085,
        );
        expect(slow.oblateness.presentationAdjusted).toBe(false);
      },
    );

    it(
      'should preserve already-frozen rarity diagnostics only as explicit special flags',
      () => {
        const special = buildSystemScenePlanetSpecialPresentationV1({
          ...giant,
          rarityTraits: [
            'RAPID_ROTATOR',
            'EXTREME_OBLIQUITY',
            'STRONGLY_RETROGRADE_ROTATION',
            'PUFFY_LOW_DENSITY',
          ],
          axialTiltDegrees: 151,
        });

        expect(special.rapidRotator).toBe(true);
        expect(special.extremeObliquity).toBe(true);
        expect(special.stronglyRetrogradeRotation).toBe(true);
        expect(special.puffyLowDensity).toBe(true);
        expect(Object.isFrozen(special.sourceRarityTraits)).toBe(true);
      },
    );

    it(
      'should reject malformed physical sources rather than inventing a special presentation',
      () => {
        expect(() =>
          buildSystemScenePlanetSpecialPresentationV1({
            ...giant,
            rotationPeriodHours: 0,
          }),
        ).toThrow(RangeError);

        expect(() =>
          buildSystemScenePlanetSpecialPresentationV1({
            ...giant,
            giantMoonProfile: {
              ...giant.giantMoonProfile,
              richnessIndex01: 2,
            },
          }),
        ).toThrow(RangeError);
      },
    );
  },
);
