import {
  buildSystemSceneCometPresentationV1,
  systemSceneCometActivityAtSimulationDayV1,
} from './system-scene-comet-presentation';

describe(
  'SystemScene comet presentation point 25.8',
  () => {
    const fixture = buildSystemSceneCometPresentationV1({
      proceduralId: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
      diameterKilometers: 18,
      iceFraction01: 0.68,
      dustFraction01: 0.32,
      porosityIndex01: 0.62,
      bulkDensityGramsPerCubicCentimeter: 0.62,
      geometricAlbedo01: 0.04,
      volatileRichnessIndex01: 0.82,
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
      'should preserve frozen point-22.5/22.6 sources and derive stable nucleus identity without invented spin',
      () => {
        const again = buildSystemSceneCometPresentationV1({
          proceduralId: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
          diameterKilometers: 18,
          iceFraction01: 0.68,
          dustFraction01: 0.32,
          porosityIndex01: 0.62,
          bulkDensityGramsPerCubicCentimeter: 0.62,
          geometricAlbedo01: 0.04,
          volatileRichnessIndex01: 0.82,
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

        expect(fixture.source).toBe('PHASE_22_6_COMET_ACTIVITY');
        expect(fixture.periapsisAu).toBe(1);
        expect(fixture.apoapsisAu).toBe(7);
        expect(fixture.shapeSeedUint32).toBe(again.shapeSeedUint32);
        expect(fixture.presentationNucleusColorHex).toBe(
          again.presentationNucleusColorHex,
        );
        expect('rotationPeriodHours' in fixture).toBe(false);
        expect('spin' in fixture).toBe(false);
        expect(Object.isFrozen(fixture)).toBe(true);
      },
    );

    it(
      'should strengthen coma/tails toward periapsis according to the frozen point-22.6 activity law',
      () => {
        const periapsis = systemSceneCometActivityAtSimulationDayV1(
          fixture,
          0,
        );
        const apoapsis = systemSceneCometActivityAtSimulationDayV1(
          fixture,
          fixture.orbitalPeriodYears * 365.25 / 2,
        );

        expect(periapsis.sourceDistanceAu).toBeCloseTo(1, 10);
        expect(apoapsis.sourceDistanceAu).toBeCloseTo(7, 10);
        expect(periapsis.activityIndex01).toBeGreaterThan(
          apoapsis.activityIndex01,
        );
        expect(periapsis.hasComa).toBe(true);
        expect(periapsis.hasDustTail).toBe(true);
        expect(periapsis.hasIonTail).toBe(true);
        expect(periapsis.presentationIonTailLengthRadii).toBeGreaterThan(
          periapsis.presentationDustTailLengthRadii,
        );
      },
    );

    it(
      'should respect the point-24.6 presentation time scale while remaining periodic',
      () => {
        const accelerated = buildSystemSceneCometPresentationV1({
          proceduralId: fixture.proceduralId,
          diameterKilometers: fixture.sourceDiameterKilometers,
          iceFraction01: fixture.iceFraction01,
          dustFraction01: fixture.dustFraction01,
          porosityIndex01: fixture.porosityIndex01,
          bulkDensityGramsPerCubicCentimeter:
            fixture.bulkDensityGramsPerCubicCentimeter,
          geometricAlbedo01: fixture.geometricAlbedo01,
          volatileRichnessIndex01: fixture.volatileRichnessIndex01,
          periodRegime: fixture.periodRegime,
          referenceLuminositySolar: fixture.referenceLuminositySolar,
          semiMajorAxisAu: fixture.semiMajorAxisAu,
          eccentricity: fixture.eccentricity,
          periapsisAu: fixture.periapsisAu,
          apoapsisAu: fixture.apoapsisAu,
          orbitalPeriodYears: fixture.orbitalPeriodYears,
          epochMeanAnomalyDegrees: fixture.epochMeanAnomalyDegrees,
          presentationTimeScale: 8,
        });
        const displayedPeriodDays =
          accelerated.orbitalPeriodYears * 365.25 /
          accelerated.presentationTimeScale;
        const start = systemSceneCometActivityAtSimulationDayV1(
          accelerated,
          0,
        );
        const cycle = systemSceneCometActivityAtSimulationDayV1(
          accelerated,
          displayedPeriodDays,
        );

        expect(cycle.sourceDistanceAu).toBeCloseTo(start.sourceDistanceAu, 9);
        expect(cycle.activityIndex01).toBeCloseTo(start.activityIndex01, 9);
      },
    );

    it(
      'should hide coma and both tails for a sufficiently distant dormant comet',
      () => {
        const dormant = buildSystemSceneCometPresentationV1({
          proceduralId: 'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
          diameterKilometers: 12,
          iceFraction01: 0.6,
          dustFraction01: 0.4,
          porosityIndex01: 0.5,
          bulkDensityGramsPerCubicCentimeter: 0.7,
          geometricAlbedo01: 0.04,
          volatileRichnessIndex01: 0.4,
          periodRegime: 'LONG_PERIOD',
          referenceLuminositySolar: 0.25,
          semiMajorAxisAu: 80,
          eccentricity: 0,
          periapsisAu: 80,
          apoapsisAu: 80,
          orbitalPeriodYears: 720,
          epochMeanAnomalyDegrees: 90,
          presentationTimeScale: 1,
        });
        const state = systemSceneCometActivityAtSimulationDayV1(dormant, 0);

        expect(state.activityRegime).toBe('DORMANT');
        expect(state.hasComa).toBe(false);
        expect(state.hasDustTail).toBe(false);
        expect(state.hasIonTail).toBe(false);
        expect(state.presentationComaOpacity01).toBe(0);
      },
    );

    it(
      'should respond monotonically to a more luminous frozen host reference at the same orbital geometry',
      () => {
        const apoapsisSimulationDay =
          fixture.orbitalPeriodYears * 365.25 / 2;
        const solar = systemSceneCometActivityAtSimulationDayV1(
          fixture,
          apoapsisSimulationDay,
        );
        const luminousComet = buildSystemSceneCometPresentationV1({
          proceduralId: fixture.proceduralId,
          diameterKilometers: fixture.sourceDiameterKilometers,
          iceFraction01: fixture.iceFraction01,
          dustFraction01: fixture.dustFraction01,
          porosityIndex01: fixture.porosityIndex01,
          bulkDensityGramsPerCubicCentimeter:
            fixture.bulkDensityGramsPerCubicCentimeter,
          geometricAlbedo01: fixture.geometricAlbedo01,
          volatileRichnessIndex01: fixture.volatileRichnessIndex01,
          periodRegime: fixture.periodRegime,
          referenceLuminositySolar: 4,
          semiMajorAxisAu: fixture.semiMajorAxisAu,
          eccentricity: fixture.eccentricity,
          periapsisAu: fixture.periapsisAu,
          apoapsisAu: fixture.apoapsisAu,
          orbitalPeriodYears: fixture.orbitalPeriodYears,
          epochMeanAnomalyDegrees: fixture.epochMeanAnomalyDegrees,
          presentationTimeScale: fixture.presentationTimeScale,
        });
        const luminous = systemSceneCometActivityAtSimulationDayV1(
          luminousComet,
          apoapsisSimulationDay,
        );

        expect(solar.sourceDistanceAu).toBeCloseTo(7, 10);
        expect(luminous.sourceDistanceAu).toBeCloseTo(
          solar.sourceDistanceAu,
          10,
        );
        expect(luminous.solarEquivalentDistanceAu).toBeLessThan(
          solar.solarEquivalentDistanceAu,
        );
        expect(luminous.activityIndex01).toBeGreaterThan(
          solar.activityIndex01,
        );
      },
    );

    it(
      'should reject malformed physical source inputs rather than inventing comet activity',
      () => {
        expect(() =>
          buildSystemSceneCometPresentationV1({
            proceduralId: 'EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
            diameterKilometers: 18,
            iceFraction01: 0.9,
            dustFraction01: 0.4,
            porosityIndex01: 0.62,
            bulkDensityGramsPerCubicCentimeter: 0.62,
            geometricAlbedo01: 0.04,
            volatileRichnessIndex01: 0.82,
            periodRegime: 'SHORT_PERIOD',
            referenceLuminositySolar: 1,
            semiMajorAxisAu: 4,
            eccentricity: 0.75,
            periapsisAu: 1,
            apoapsisAu: 7,
            orbitalPeriodYears: 8,
            epochMeanAnomalyDegrees: 0,
            presentationTimeScale: 1,
          }),
        ).toThrow(RangeError);
      },
    );
  },
);
