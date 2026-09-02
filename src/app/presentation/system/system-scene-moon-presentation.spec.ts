import {
  buildSystemSceneMoonPresentationV1,
} from './system-scene-moon-presentation';

describe(
  'SystemScene moon presentation point 25.10',
  () => {
    const base = {
      moonIdentity: 'MOON-25-10-A',
      hostPlanetType: 'ROCKY',
      radiusEarth: 0.035,
      massEarth: 0.0004,
      meanDensityGramsPerCubicCentimeter: 3.2,
      surfaceGravityEarth: 0.025,
      atmosphereRetentionIndex01: 0.02,
      atmosphereRegime: 'NONE',
      waterInventoryIndex01: 0.04,
      inferredIceRichnessIndex01: 0.08,
      subsurfaceOceanPotentialIndex01: 0.02,
      surfaceLiquidWaterPotentialIndex01: 0,
      waterRegime: 'NONE',
      estimatedSurfaceTemperatureKelvin: 250,
      geologicalActivityIndex01: 0.04,
      tidalHeatingIndex01: 0.01,
      geologyRegime: 'INERT',
      overallHabitabilityIndex01: 0,
      isPotentiallyHabitable: false,
      giantHostSpecialization: false,
      giantCompositionRegime: 'NOT_APPLICABLE',
      isLargeGiantMoon: false,
      isTidallyActiveGiantMoon: false,
      isOceanBearingGiantMoonCandidate: false,
    } as const;

    it(
      'should keep small non-giant moons rounded while still giving them irregular relief',
      () => {
        const moon = buildSystemSceneMoonPresentationV1(base);

        expect(moon.shapeClass).toBe('MINOR_IRREGULAR');
        expect(moon.surfaceStyle).toBe('ROCKY');
        expect(moon.presentationRadiusScene).toBeLessThan(0.02);
        expect(moon.presentationIrregularity01).toBeGreaterThan(0.08);
        expect(moon.presentationIrregularity01).toBeLessThan(0.24);
        expect(moon.presentationAtmospherePresent).toBe(false);
      },
    );

    it(
      'should make a large ocean-bearing giant moon visibly larger and planet-like without inventing life',
      () => {
        const moon = buildSystemSceneMoonPresentationV1({
          ...base,
          moonIdentity: 'MOON-25-10-B',
          hostPlanetType: 'GAS_GIANT',
          radiusEarth: 0.42,
          massEarth: 0.045,
          meanDensityGramsPerCubicCentimeter: 3.0,
          surfaceGravityEarth: 0.26,
          atmosphereRetentionIndex01: 0.58,
          atmosphereRegime: 'SUBSTANTIAL',
          waterInventoryIndex01: 0.72,
          inferredIceRichnessIndex01: 0.42,
          subsurfaceOceanPotentialIndex01: 0.82,
          surfaceLiquidWaterPotentialIndex01: 0.61,
          waterRegime: 'MIXED',
          estimatedSurfaceTemperatureKelvin: 282,
          geologicalActivityIndex01: 0.42,
          tidalHeatingIndex01: 0.31,
          geologyRegime: 'ACTIVE',
          overallHabitabilityIndex01: 0.64,
          isPotentiallyHabitable: true,
          giantHostSpecialization: true,
          giantCompositionRegime: 'MIXED_ROCK_ICE',
          isLargeGiantMoon: true,
          isOceanBearingGiantMoonCandidate: true,
        });

        expect(moon.shapeClass).toBe('MAJOR_PLANETARY');
        expect(moon.surfaceStyle).toBe('OCEANIC');
        expect(moon.presentationRadiusScene).toBeGreaterThan(0.03);
        expect(moon.presentationLiquidCoverage01).toBeGreaterThan(0.3);
        expect(moon.presentationCloudCoverage01).toBeGreaterThan(0.1);
        expect(moon.presentationAtmospherePresent).toBe(true);
        expect(moon.sourceIsPotentiallyHabitable).toBe(true);
        expect('life' in moon).toBe(false);
        expect('biosphere' in moon).toBe(false);
      },
    );

    it(
      'should expose icy and volcanic visual routes directly from frozen phase-21 environment states',
      () => {
        const icy = buildSystemSceneMoonPresentationV1({
          ...base,
          moonIdentity: 'MOON-25-10-C',
          hostPlanetType: 'ICE_GIANT',
          radiusEarth: 0.18,
          massEarth: 0.012,
          inferredIceRichnessIndex01: 0.84,
          waterInventoryIndex01: 0.76,
          subsurfaceOceanPotentialIndex01: 0.72,
          waterRegime: 'ICE_AND_SUBSURFACE_OCEAN',
          giantHostSpecialization: true,
          giantCompositionRegime: 'ICE_RICH',
          isLargeGiantMoon: true,
          isOceanBearingGiantMoonCandidate: true,
        });
        const volcanic = buildSystemSceneMoonPresentationV1({
          ...base,
          moonIdentity: 'MOON-25-10-D',
          hostPlanetType: 'GAS_GIANT',
          radiusEarth: 0.21,
          massEarth: 0.018,
          geologicalActivityIndex01: 0.92,
          tidalHeatingIndex01: 0.94,
          geologyRegime: 'EXTREME',
          giantHostSpecialization: true,
          giantCompositionRegime: 'ROCK_RICH',
          isLargeGiantMoon: true,
          isTidallyActiveGiantMoon: true,
        });

        expect(icy.surfaceStyle).toBe('ICY');
        expect(icy.presentationIceCoverage01).toBeGreaterThan(0.5);
        expect(volcanic.surfaceStyle).toBe('VOLCANIC');
        expect(volcanic.presentationVolcanicCoverage01).toBeGreaterThan(0.5);
      },
    );

    it(
      'should be exactly deterministic for the same frozen moon identity and sources',
      () => {
        expect(
          buildSystemSceneMoonPresentationV1(base),
        ).toEqual(
          buildSystemSceneMoonPresentationV1(base),
        );
      },
    );

    it(
      'should reject malformed physical sources',
      () => {
        expect(() =>
          buildSystemSceneMoonPresentationV1({
            ...base,
            radiusEarth: 0,
          }),
        ).toThrow(RangeError);

        expect(() =>
          buildSystemSceneMoonPresentationV1({
            ...base,
            atmosphereRegime: 'MAGICAL',
          }),
        ).toThrow(RangeError);
      },
    );
  },
);
