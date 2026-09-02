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
