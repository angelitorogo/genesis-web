import {
  buildSystemSceneAtmosphereOpticsV1,
} from './system-scene-atmosphere-optics';

describe(
  'SystemScene atmosphere optics point 25.6',
  () => {
    it(
      'should keep a vacuum world sharply terminated without inventing an atmosphere shell',
      () => {
        const optics = buildSystemSceneAtmosphereOpticsV1({
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

        expect(optics.atmospherePresent).toBe(false);
        expect(optics.deepEnvelope).toBe(false);
        expect(optics.presentationShellScale).toBe(1);
        expect(optics.presentationRimStrength01).toBe(0);
        expect(optics.presentationTerminatorSoftness01).toBeLessThan(0.03);
        expect(optics.presentationNightFloor01).toBeLessThan(0.02);
      },
    );

    it(
      'should give a retained humid solid atmosphere a visible shell and softer terminator',
      () => {
        const optics = buildSystemSceneAtmosphereOpticsV1({
          baseColorHex: '#4B7FCB',
          surfaceStyle: 'oceanic',
          surfaceEnvironment: {
            solidSurfaceAvailable: true,
            retainedSurfacePressurePascal: 101_325,
            retainedAtmosphericWaterVaporMoleFraction01: 0.025,
            presentationCloudCoverageFraction01: 0.48,
            surfaceIceCoverageFraction01: 0.12,
          },
          giantAtmosphere: null,
        });

        expect(optics.atmospherePresent).toBe(true);
        expect(optics.presentationShellScale).toBeGreaterThan(1.02);
        expect(optics.presentationRimStrength01).toBeGreaterThan(0.25);
        expect(optics.presentationTerminatorSoftness01).toBeGreaterThan(0.12);
        expect(optics.presentationTwilightGlow01).toBeGreaterThan(0.2);
      },
    );

    it('D.4c: differentiates the supplied reference planets by final pressure without atmosphere invention', () => {
      const check = (pressure: number | null) => buildSystemSceneAtmosphereOpticsV1({
        baseColorHex: '#A2B6C0', surfaceStyle: 'rocky', giantAtmosphere: null,
        surfaceEnvironment: {
          solidSurfaceAvailable: true,
          retainedSurfacePressurePascal: pressure,
          retainedAtmosphericWaterVaporMoleFraction01: 0.01,
          presentationCloudCoverageFraction01: 0.12,
          surfaceIceCoverageFraction01: 0.20,
        },
      });
      const vacuum = check(null);
      const stolen = check(94.5);
      const rumor = check(265.14);
      const sianum = check(45_901.89);
      const nika = check(241_456.1);
      expect(vacuum.atmospherePresent).toBe(false);
      expect(vacuum.presentationShellScale).toBe(1);
      expect(stolen.presentationRimStrength01).toBeLessThan(0.06);
      expect(rumor.presentationRimStrength01).toBeLessThan(0.06);
      expect(sianum.presentationFrontHaze01).toBeGreaterThan(0.20);
      expect(nika.presentationFrontHaze01).toBeGreaterThan(sianum.presentationFrontHaze01);
      expect(nika.presentationTerminatorSoftness01).toBeGreaterThan(sianum.presentationTerminatorSoftness01);
      expect(check(0).atmospherePresent).toBe(false);
    });

    it('D.4d: separates real pressure regimes visually without thickening near-vacuum worlds', () => {
      const sample = (pressure: number | null) => buildSystemSceneAtmosphereOpticsV1({
        baseColorHex: '#889AAB', surfaceStyle: 'rocky', giantAtmosphere: null,
        surfaceEnvironment: {
          solidSurfaceAvailable: true, retainedSurfacePressurePascal: pressure,
          retainedAtmosphericWaterVaporMoleFraction01: 0.01,
          presentationCloudCoverageFraction01: 0.12,
          surfaceIceCoverageFraction01: 0.2,
        },
      });
      const vacuum = sample(null);
      const stony = sample(94.5);
      const ice = sample(265.14);
      const moderate = sample(45_901.89);
      const dense = sample(241_456.1);
      expect(vacuum.atmospherePresent).toBe(false);
      expect(stony.presentationRimStrength01).toBeLessThan(0.06);
      expect(ice.presentationFrontHaze01).toBeLessThan(0.03);
      expect(moderate.presentationFrontHaze01).toBeGreaterThan(0.25);
      expect(dense.presentationFrontHaze01).toBeGreaterThan(moderate.presentationFrontHaze01 * 1.45);
      expect(dense.presentationShellScale).toBeGreaterThan(moderate.presentationShellScale);
      expect(dense.presentationTerminatorSoftness01).toBeGreaterThan(moderate.presentationTerminatorSoftness01);
      expect(sample(0)).toEqual(vacuum);
    });

    it(
      'should keep methane-rich deep envelopes optically distinct from warm chromophore giants',
      () => {
        const methane = buildSystemSceneAtmosphereOpticsV1({
          baseColorHex: '#7BC3DC',
          surfaceStyle: 'gaseous',
          surfaceEnvironment: null,
          giantAtmosphere: {
            methaneMoleFraction01: 0.10,
            waterVaporMoleFraction01: 0.01,
            presentationMethaneBlueing01: 0.92,
            presentationWarmChromophore01: 0.08,
            presentationPolarHaze01: 0.74,
            presentationUpperHaze01: 0.62,
          },
        });
        const warm = buildSystemSceneAtmosphereOpticsV1({
          baseColorHex: '#D1A16C',
          surfaceStyle: 'gaseous',
          surfaceEnvironment: null,
          giantAtmosphere: {
            methaneMoleFraction01: 0.01,
            waterVaporMoleFraction01: 0.03,
            presentationMethaneBlueing01: 0.08,
            presentationWarmChromophore01: 0.88,
            presentationPolarHaze01: 0.24,
            presentationUpperHaze01: 0.38,
          },
        });

        expect(methane.deepEnvelope).toBe(true);
        expect(warm.deepEnvelope).toBe(true);
        expect(methane.presentationDayTintHex).not.toBe(
          warm.presentationDayTintHex,
        );
        expect(methane.presentationRimStrength01).toBeGreaterThan(
          warm.presentationRimStrength01,
        );
      },
    );

    it('D.4 visual closure: renders a pressure ladder without inventing a dense atmosphere from traces', () => {
      const sample = (pressure: number | null) => buildSystemSceneAtmosphereOpticsV1({
        baseColorHex: '#99A5B0', surfaceStyle: 'rocky', giantAtmosphere: null,
        surfaceEnvironment: {
          solidSurfaceAvailable: true,
          retainedSurfacePressurePascal: pressure,
          retainedAtmosphericWaterVaporMoleFraction01: 0,
          presentationCloudCoverageFraction01: 0,
          surfaceIceCoverageFraction01: 0,
        },
      });
      const vacuum = sample(null);
      const traces = sample(94.5);
      const tenuous = sample(265.14);
      const moderate = sample(45901.89);
      const dense = sample(241456.1);
      expect(vacuum.atmospherePresent).toBe(false);
      expect(vacuum.presentationFrontHaze01).toBe(0);
      expect(traces.presentationFrontHaze01).toBeLessThan(0.02);
      expect(tenuous.presentationFrontHaze01).toBeLessThan(0.03);
      expect(moderate.presentationFrontHaze01).toBeGreaterThan(tenuous.presentationFrontHaze01 * 4);
      expect(dense.presentationFrontHaze01).toBeGreaterThan(moderate.presentationFrontHaze01);
      expect(dense.presentationRimStrength01).toBeGreaterThan(moderate.presentationRimStrength01);
    });

    it('D.4 visual closure: retained CO2/SO2 and methane alter appearance without changing pressure', () => {
      const sample = (gas: string) => buildSystemSceneAtmosphereOpticsV1({
        baseColorHex: '#7C8992', surfaceStyle: 'rocky', giantAtmosphere: null,
        surfaceEnvironment: {
          solidSurfaceAvailable: true, retainedSurfacePressurePascal: 100000,
          retainedAtmosphericWaterVaporMoleFraction01: 0.01,
          presentationCloudCoverageFraction01: 0.1,
          surfaceIceCoverageFraction01: 0,
          retainedGasComposition: [{ gas, moleFraction01: 0.70 }],
        },
      });
      expect(sample('CARBON_DIOXIDE').presentationDayTintHex).not.toBe(sample('NITROGEN').presentationDayTintHex);
      expect(sample('METHANE').presentationDayTintHex).not.toBe(sample('CARBON_DIOXIDE').presentationDayTintHex);
      expect(sample('CARBON_DIOXIDE').presentationFrontHaze01).toBe(sample('NITROGEN').presentationFrontHaze01);
    });

    it(
      'should be deterministic and reject malformed bounded inputs',
      () => {
        const input = {
          baseColorHex: '#8FA292',
          surfaceStyle: 'rocky' as const,
          surfaceEnvironment: {
            solidSurfaceAvailable: true,
            retainedSurfacePressurePascal: 80_000,
            retainedAtmosphericWaterVaporMoleFraction01: 0.01,
            presentationCloudCoverageFraction01: 0.2,
            surfaceIceCoverageFraction01: 0.05,
          },
          giantAtmosphere: null,
        };

        expect(buildSystemSceneAtmosphereOpticsV1(input)).toEqual(
          buildSystemSceneAtmosphereOpticsV1(input),
        );

        expect(() =>
          buildSystemSceneAtmosphereOpticsV1({
            ...input,
            surfaceEnvironment: {
              ...input.surfaceEnvironment,
              presentationCloudCoverageFraction01: 1.2,
            },
          }),
        ).toThrow(RangeError);
      },
    );
  },
);

describe('D.4b — intensified planetary atmosphere and composition palette', () => {
  const solid = (
    pressure: number | null,
    gas: string = 'NITROGEN',
    clouds = 0.25,
  ) => buildSystemSceneAtmosphereOpticsV1({
    baseColorHex: '#82939B',
    surfaceStyle: 'rocky',
    giantAtmosphere: null,
    surfaceEnvironment: {
      solidSurfaceAvailable: true,
      retainedSurfacePressurePascal: pressure,
      retainedAtmosphericWaterVaporMoleFraction01: 0.01,
      presentationCloudCoverageFraction01: clouds,
      surfaceIceCoverageFraction01: 0.1,
      retainedGasComposition: [{ gas, moleFraction01: 0.80 }],
    },
  });

  it('respects the resolved pressure ladder, with a much stronger 0.46 and 2.4 bar envelope', () => {
    const vacuum = solid(null);
    const trace = solid(94.5);
    const thin = solid(265.14);
    const halfBar = solid(45_901.89);
    const dense = solid(241_456.1);

    expect(vacuum.atmospherePresent).toBe(false);
    expect(vacuum.presentationShellScale).toBe(1);
    expect(trace.presentationRimStrength01).toBeLessThan(0.04);
    expect(thin.presentationFrontHaze01).toBeLessThan(0.02);
    expect(halfBar.presentationShellScale).toBeGreaterThan(1.04);
    expect(halfBar.presentationRimStrength01).toBeGreaterThan(0.55);
    expect(halfBar.presentationFrontHaze01).toBeGreaterThan(0.27);
    expect(dense.presentationShellScale).toBeGreaterThan(halfBar.presentationShellScale);
    expect(dense.presentationFrontHaze01).toBeGreaterThan(halfBar.presentationFrontHaze01);
  });

  it('derives blue/cyan, warm, jade and violet haze *variants* from input, never seed', () => {
    const nitrogen = solid(150_000, 'NITROGEN');
    const sulfur = solid(150_000, 'SULFUR_DIOXIDE');
    const methane = solid(150_000, 'METHANE', 0.75);
    const ammonia = solid(150_000, 'AMMONIA', 0.75);
    expect(nitrogen.presentationDayTintHex).not.toBe(sulfur.presentationDayTintHex);
    expect(methane.presentationDayTintHex).not.toBe(ammonia.presentationDayTintHex);
    expect(ammonia.presentationDayTintHex).not.toBe(nitrogen.presentationDayTintHex);
    expect(sulfur.presentationRimStrength01).toBe(nitrogen.presentationRimStrength01);
    // An illustrative mixed photochemical haze can lean violet without making
    // any claim of spectroscopically detected aerosols.
    const mixedHaze = buildSystemSceneAtmosphereOpticsV1({
      baseColorHex: '#82939B', surfaceStyle: 'rocky', giantAtmosphere: null,
      surfaceEnvironment: {
        solidSurfaceAvailable: true, retainedSurfacePressurePascal: 150_000,
        retainedAtmosphericWaterVaporMoleFraction01: 0.01,
        presentationCloudCoverageFraction01: 0.90, surfaceIceCoverageFraction01: 0,
        retainedGasComposition: [
          { gas: 'METHANE', moleFraction01: 0.35 },
          { gas: 'SULFUR_DIOXIDE', moleFraction01: 0.25 },
          { gas: 'NITROGEN', moleFraction01: 0.40 },
        ],
      },
    });
    expect(mixedHaze.presentationDayTintHex).not.toBe(methane.presentationDayTintHex);
    expect(mixedHaze.presentationDayTintHex).not.toBe(sulfur.presentationDayTintHex);
    expect(solid(150_000, 'AMMONIA', 0.75)).toEqual(ammonia);
  });

  it('keeps giant deep-envelope profiles visible while allowing chemical cloud-top diversity', () => {
    const sample = (methane: number, warm: number, polar: number, haze: number) =>
      buildSystemSceneAtmosphereOpticsV1({
        baseColorHex: '#B1B2BA', surfaceStyle: 'gaseous', surfaceEnvironment: null,
        giantAtmosphere: {
          methaneMoleFraction01: 0.08,
          waterVaporMoleFraction01: 0.01,
          presentationMethaneBlueing01: methane,
          presentationWarmChromophore01: warm,
          presentationPolarHaze01: polar,
          presentationUpperHaze01: haze,
        },
      });
    const cream = sample(0.04, 0.90, 0.25, 0.40);
    const cyan = sample(0.92, 0.06, 0.70, 0.60);
    const illustrativeVioletHaze = sample(0.88, 0.85, 0.90, 0.90);
    expect(cream.atmospherePresent).toBe(true);
    expect(cream.presentationShellScale).toBeGreaterThan(1.06);
    expect(cream.presentationFrontHaze01).toBeGreaterThan(0.35);
    expect(cyan.presentationDayTintHex).not.toBe(cream.presentationDayTintHex);
    expect(illustrativeVioletHaze.presentationDayTintHex).not.toBe(cyan.presentationDayTintHex);
    expect(illustrativeVioletHaze.presentationDayTintHex).not.toBe(cream.presentationDayTintHex);
  });

  it('rejects nonphysical malformed gas inputs without changing the atmosphere model', () => {
    expect(() => buildSystemSceneAtmosphereOpticsV1({
      baseColorHex: '#899BA7', surfaceStyle: 'rocky', giantAtmosphere: null,
      surfaceEnvironment: {
        solidSurfaceAvailable: true,
        retainedSurfacePressurePascal: 101325,
        retainedAtmosphericWaterVaporMoleFraction01: 0,
        presentationCloudCoverageFraction01: 0,
        surfaceIceCoverageFraction01: 0,
        retainedGasComposition: [{ gas: 'NITROGEN', moleFraction01: 1.01 }],
      },
    })).toThrow(RangeError);
  });
});
