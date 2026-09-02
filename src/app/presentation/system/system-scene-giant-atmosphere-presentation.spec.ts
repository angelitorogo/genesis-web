import {
  buildSystemSceneGiantAtmospherePresentationV1,
} from './system-scene-giant-atmosphere-presentation';

describe(
  'SystemScene giant-atmosphere presentation point 25.4',
  () => {
    const gasGiant = () =>
      buildSystemSceneGiantAtmospherePresentationV1({
        planetType: 'GAS_GIANT',
        massEarth: 240,
        radiusEarth: 10.6,
        densityGramsPerCubicCentimeter: 1.05,
        envelopeMassFraction01: 0.72,
        iceBearingFractionOfSolids01: 0.16,
        rotationPeriodHours: 10.2,
        equilibriumTemperatureKelvin: 165,
        referenceBondAlbedo01: 0.46,
        retainedMeanMolarMassGramsPerMole: 2.35,
        retainedGasComposition: [
          { gas: 'HYDROGEN', moleFraction01: 0.84 },
          { gas: 'HELIUM', moleFraction01: 0.14 },
          { gas: 'METHANE', moleFraction01: 0.015 },
          { gas: 'AMMONIA', moleFraction01: 0.005 },
        ],
      });

    it(
      'should project a frozen gas-giant cloud-top identity from phase-19/20 sources',
      () => {
        const state = gasGiant();

        expect(state).not.toBeNull();
        expect(state!.source).toBe('PHASE_19_20_DEEP_ENVELOPE');
        expect(state!.regime).toBe('GAS_GIANT');
        expect(state!.lightGasMoleFraction01).toBeCloseTo(0.98, 12);
        expect(state!.presentationBandCount).toBeGreaterThanOrEqual(10);
        expect(state!.presentationJetSharpness01).toBeGreaterThan(0.4);
        expect(Object.isFrozen(state)).toBe(true);
      },
    );

    it(
      'should visually separate methane-rich ice giants from warmer gas giants without changing source chemistry',
      () => {
        const warm = gasGiant()!;
        const ice = buildSystemSceneGiantAtmospherePresentationV1({
          planetType: 'ICE_GIANT',
          massEarth: 18,
          radiusEarth: 4.1,
          densityGramsPerCubicCentimeter: 1.55,
          envelopeMassFraction01: 0.24,
          iceBearingFractionOfSolids01: 0.76,
          rotationPeriodHours: 16.4,
          equilibriumTemperatureKelvin: 72,
          referenceBondAlbedo01: 0.53,
          retainedMeanMolarMassGramsPerMole: 3.2,
          retainedGasComposition: [
            { gas: 'HYDROGEN', moleFraction01: 0.72 },
            { gas: 'HELIUM', moleFraction01: 0.18 },
            { gas: 'METHANE', moleFraction01: 0.10 },
          ],
        })!;

        expect(ice.regime).toBe('ICE_GIANT');
        expect(ice.presentationMethaneBlueing01)
          .toBeGreaterThan(warm.presentationMethaneBlueing01);
        expect(ice.presentationPolarHaze01)
          .toBeGreaterThan(warm.presentationPolarHaze01);
        expect(warm.presentationWarmChromophore01)
          .toBeGreaterThan(ice.presentationWarmChromophore01);
      },
    );

    it(
      'should include mini-Neptunes in the deep-envelope renderer without pretending they are solid worlds',
      () => {
        const state = buildSystemSceneGiantAtmospherePresentationV1({
          planetType: 'MINI_NEPTUNE',
          massEarth: 9,
          radiusEarth: 3.1,
          densityGramsPerCubicCentimeter: 1.65,
          envelopeMassFraction01: 0.12,
          iceBearingFractionOfSolids01: 0.42,
          rotationPeriodHours: 22,
          equilibriumTemperatureKelvin: 310,
          referenceBondAlbedo01: 0.34,
          retainedMeanMolarMassGramsPerMole: 4.1,
          retainedGasComposition: [
            { gas: 'HYDROGEN', moleFraction01: 0.70 },
            { gas: 'HELIUM', moleFraction01: 0.18 },
            { gas: 'METHANE', moleFraction01: 0.07 },
            { gas: 'WATER_VAPOR', moleFraction01: 0.05 },
          ],
        });

        expect(state?.regime).toBe('MINI_NEPTUNE');
        expect(state?.presentationUpperHaze01).toBeGreaterThan(0);
      },
    );

    it(
      'should return null for solid planet types and reject malformed deep-envelope chemistry',
      () => {
        expect(buildSystemSceneGiantAtmospherePresentationV1({
          planetType: 'ROCKY',
          massEarth: 1,
          radiusEarth: 1,
          densityGramsPerCubicCentimeter: 5.5,
          envelopeMassFraction01: 0,
          iceBearingFractionOfSolids01: 0.05,
          rotationPeriodHours: 24,
          equilibriumTemperatureKelvin: 255,
          referenceBondAlbedo01: 0.3,
          retainedMeanMolarMassGramsPerMole: 29,
          retainedGasComposition: [
            { gas: 'NITROGEN', moleFraction01: 1 },
          ],
        })).toBeNull();

        expect(() => buildSystemSceneGiantAtmospherePresentationV1({
          planetType: 'GAS_GIANT',
          massEarth: 200,
          radiusEarth: 10,
          densityGramsPerCubicCentimeter: 1,
          envelopeMassFraction01: 0.7,
          iceBearingFractionOfSolids01: 0.1,
          rotationPeriodHours: 10,
          equilibriumTemperatureKelvin: 150,
          referenceBondAlbedo01: 0.4,
          retainedMeanMolarMassGramsPerMole: 2.4,
          retainedGasComposition: [
            { gas: 'HYDROGEN', moleFraction01: 0.8 },
            { gas: 'HELIUM', moleFraction01: 0.1 },
          ],
        })).toThrow(RangeError);
      },
    );
  },
);
