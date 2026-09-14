import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  type PlanetScientificResolvedTarget,
} from '../../simulation/planetary/planet-scientific-target-resolver';

import {
  type MoonScientificResolvedTarget,
} from '../../simulation/planetary/moon-scientific-target-resolver';

import {
  systemSceneGiantAtmosphereTextureSeedV1,
} from '../system/system-scene-giant-atmosphere-texture';

import {
  systemScenePlanetSurfaceTextureSeedV1,
} from '../system/system-scene-planet-surface-texture';

import {
  systemScenePlanetTextureSeed,
} from '../system/system-scene-planet-texture';

import {
  type SystemSceneSnapshot,
} from '../system/system-scene-snapshot';

import {
  ScientificBodyPreviewAssembler,
  ScientificBodyPreviewKind,
} from './scientific-body-preview';

describe(
  'ScientificBodyPreview absolute SystemScene visual parity',
  () => {

    it(
      'should project the exact giant-atmosphere, rings, shape and texture identities used by SystemScene without leaking raw route seeds',
      () => {
        const scene =
          systemSceneFixture();

        const result =
          ScientificBodyPreviewAssembler
            .planet(
              planetTarget(),
              scene,
            );

        expect(result.kind).toBe(
          ScientificBodyPreviewKind.PLANET,
        );

        if (
          result.kind !==
            ScientificBodyPreviewKind.PLANET
        ) {
          throw new Error(
            'Expected planet preview.',
          );
        }

        const source =
          scene.planets[0];
        const identity =
          `${scene.universeSeed}|v${scene.generatorVersionCode}|${scene.proceduralIdentity}`;

        expect(result.primary.surface).toBe(
          source.surfaceEnvironment,
        );
        expect(result.primary.giantAtmosphere).toBe(
          source.giantAtmosphere,
        );
        expect(result.primary.equatorialScale).toBe(
          1.07,
        );
        expect(result.primary.polarScale).toBe(
          0.93,
        );
        expect(result.primary.ring).toMatchObject({
          innerRadiusPlanetRadii: 1.45,
          outerRadiusPlanetRadii: 2.48,
          opticalDepth01: 0.58,
          bandCount: 7,
          gapCount: 2,
          presentationBaseColorHex: '#D8C7A4',
          presentationAccentColorHex: '#96866B',
        });

        expect(
          result.primary.albedoVisualVariantUint32,
        ).toBe(
          systemScenePlanetTextureSeed({
            systemIdentity:
              identity,
            planetId:
              source.id,
            surfaceStyle:
              source.surfaceStyle,
          }),
        );
        expect(
          result.primary.surfaceVisualVariantUint32,
        ).toBe(
          systemScenePlanetSurfaceTextureSeedV1(
            identity,
            source.id,
          ),
        );
        expect(
          result.primary.giantAtmosphereVisualVariantUint32,
        ).toBe(
          systemSceneGiantAtmosphereTextureSeedV1(
            identity,
            source.id,
            source.giantAtmosphere!.regime,
          ),
        );

        expect(result.moons).toHaveLength(1);
        expect(result.moons[0].visualVariantUint32).toBe(
          scene.moons[0].visualPresentation.presentationSeedUint32,
        );
        expect(result.moons[0].spin).toBe(
          scene.moons[0].spin,
        );
        expect(result.moons[0].orbit).toMatchObject({
          semiMajorAxisPlanetRadii:
            8.7,
          eccentricity:
            0.17,
          inclinationDegrees:
            11.5,
          rotationDegrees:
            42,
          epochMeanAnomalyDegrees:
            123,
          orbitalPeriodDays:
            5.75,
        });
        expect(
          result.moons[0].orbit.periapsisPlanetRadii,
        ).toBeCloseTo(
          7.221,
          9,
        );
        expect(
          result.moons[0].orbit.apoapsisPlanetRadii,
        ).toBeCloseTo(
          10.179,
          9,
        );
        expect(result.epochSimulationDay).toBe(
          73.25,
        );
        expect(
          result.spinPlaybackDaysPerRealSecond,
        ).toBe(0.5);

        const serialized =
          JSON.stringify(result);

        expect(serialized).not.toContain(
          scene.universeSeed,
        );
        expect(serialized).not.toContain(
          'presentationSeedUint32',
        );
        expect(serialized).not.toContain(
          'shapeSeedUint32',
        );
        expect(serialized).not.toContain(
          'generationKey',
        );
      },
    );

    it(
      'should give planet and moon fiches the same local planetary architecture without a fiche-only selection geometry contract',
      () => {
        const scene =
          systemSceneFixture();

        const planet =
          ScientificBodyPreviewAssembler
            .planet(
              planetTarget(),
              scene,
            );

        const moon =
          ScientificBodyPreviewAssembler
            .moon(
              moonTarget(),
              planetTarget(),
              scene,
            );

        expect(planet.kind).toBe(
          ScientificBodyPreviewKind.PLANET,
        );
        expect(moon.kind).toBe(
          ScientificBodyPreviewKind.MOON,
        );

        if (
          planet.kind !==
            ScientificBodyPreviewKind.PLANET ||
          moon.kind !==
            ScientificBodyPreviewKind.MOON
        ) {
          throw new Error(
            'Expected planet/moon scientific preview pair.',
          );
        }

        expect(moon.hostPlanet).toEqual(
          planet.primary,
        );
        expect(moon.moons).toEqual(
          planet.moons,
        );
        expect(moon.epochSimulationDay).toBe(
          planet.epochSimulationDay,
        );
        expect(
          moon.spinPlaybackDaysPerRealSecond,
        ).toBe(
          planet.spinPlaybackDaysPerRealSecond,
        );
      },
    );
  },
);

function planetTarget():
  PlanetScientificResolvedTarget {

  return {
    identity: {
      designation:
        'Ciothae e',
      planetOrdinal:
        4,
    },
    detail: {
      general: {
        radiusEarth:
          7.8,
      },
      moons: {
        relevantMoons: [
          {
            moonOrdinal:
              1,
            semiMajorAxisPlanetRadii:
              8.7,
          },
        ],
      },
    },
  } as unknown as PlanetScientificResolvedTarget;
}

function moonTarget():
  MoonScientificResolvedTarget {

  return {
    identity: {
      designation:
        'Ciothae e I',
      hostPlanetDesignation:
        'Ciothae e',
      hostPlanetOrdinal:
        4,
      moonOrdinal:
        1,
    },
    detail: {
      orbit: {
        semiMajorAxisPlanetRadii:
          8.7,
      },
    },
  } as unknown as MoonScientificResolvedTarget;
}

function systemSceneFixture():
  SystemSceneSnapshot {

  const surface =
    Object.freeze({
      solidSurfaceAvailable:
        false,
      retainedSurfacePressurePascal:
        null,
      retainedAtmosphericWaterVaporMoleFraction01:
        null,
      presentationCloudCoverageFraction01:
        0.81,
      surfaceIceCoverageFraction01:
        null,
      surfaceLiquidWaterCoverageFraction01:
        null,
      presentationDesertCoverageFraction01:
        null,
      volcanismIndex01:
        null,
    });

  const giantAtmosphere =
    Object.freeze({
      regime:
        'DEEP_ENVELOPE',
      methaneMoleFraction01:
        0.024,
      waterVaporMoleFraction01:
        0.006,
      presentationMethaneBlueing01:
        0.12,
      presentationWarmChromophore01:
        0.77,
      presentationPolarHaze01:
        0.28,
      presentationUpperHaze01:
        0.43,
      presentationJetSharpness01:
        0.69,
      presentationTurbulence01:
        0.36,
    });

  return {
    universeSeed:
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    generatorVersionCode:
      1,
    proceduralIdentity:
      'G0/S17179869160/O12',
    planets: [
      {
        id:
          'planet-4',
        kind:
          'planet',
        label:
          'Ciothae e',
        title:
          'Ciothae e',
        colorHex:
          '#A9865F',
        radiusScene:
          0.34,
        position:
          { x: 0, y: 0, z: 0 },
        orbitId:
          'planet-orbit-4',
        motionContributions:
          [],
        surfaceStyle:
          'gaseous',
        lightIntensity:
          0,
        sourceLuminositySolar:
          null,
        spin:
          {
            source:
              'PLANET_19_3',
            rotationPeriodHours:
              9.7,
            axialTiltDegrees:
              5.1,
            epochPhaseDegrees:
              117,
            isSynchronized:
              false,
          },
        surfaceEnvironment:
          surface,
        giantAtmosphere,
        specialPresentation:
          {
            version:
              1,
            sourcePlanetType:
              'GAS_GIANT',
            sourceAxialTiltDegrees:
              5.1,
            sourceRarityTraits:
              [],
            rings:
              {
                source:
                  'GIANT_RING_PRESENTATION_PROXY_25_9',
                presenceAuthoritative:
                  false,
                sourceMoonCount:
                  10,
                sourceSatelliteCapacityIndex01:
                  0.76,
                sourceMoonRichnessIndex01:
                  0.72,
                sourceMoonArchitectureRegime:
                  'RICH',
                sourceIceBearingFractionOfSolids01:
                  0.61,
                sourceReferenceBondAlbedo01:
                  0.34,
                innerRadiusPlanetRadii:
                  1.45,
                outerRadiusPlanetRadii:
                  2.48,
                opticalDepth01:
                  0.58,
                iceFraction01:
                  0.61,
                dustFraction01:
                  0.39,
                bandCount:
                  7,
                gapCount:
                  2,
                presentationSeedUint32:
                  0x8af04c31,
                presentationBaseColorHex:
                  '#D8C7A4',
                presentationAccentColorHex:
                  '#96866B',
              },
            oblateness:
              {
                source:
                  'ROTATION_SHAPE_PROXY_25_9',
                sourceRotationPeriodHours:
                  9.7,
                sourceDensityGramsPerCubicCentimeter:
                  1.2,
                presentationFlattening01:
                  0.07,
                presentationEquatorialScale:
                  1.07,
                presentationPolarScale:
                  0.93,
                presentationAdjusted:
                  true,
              },
            extremeObliquity:
              false,
            stronglyRetrogradeRotation:
              false,
            rapidRotator:
              true,
            puffyLowDensity:
              false,
          },
      },
    ],
    moons: [
      {
        id:
          'moon-4-1',
        kind:
          'moon',
        label:
          'Ciothae e I',
        title:
          'Ciothae e I',
        hostPlanetId:
          'planet-4',
        hostPlanetOrdinal:
          4,
        colorHex:
          '#B7B3AB',
        radiusScene:
          0.048,
        position:
          { x: 0, y: 0, z: 0 },
        orbitId:
          'moon-orbit-4-1',
        motionContributions:
          [],
        spin:
          {
            source:
              'MOON_21_4',
            rotationPeriodHours:
              86,
            axialTiltDegrees:
              1.8,
            epochPhaseDegrees:
              44,
            isSynchronized:
              true,
          },
        visualPresentation:
          {
            version:
              1,
            sourceMoonIdentity:
              'Ciothae e I',
            sourceHostPlanetType:
              'GAS_GIANT',
            sourceRadiusEarth:
              0.31,
            sourceMassEarth:
              0.018,
            sourceMeanDensityGramsPerCubicCentimeter:
              3.1,
            sourceSurfaceGravityEarth:
              0.19,
            sourceAtmosphereRetentionIndex01:
              0.08,
            sourceAtmosphereRegime:
              'EXOSPHERE',
            sourceWaterInventoryIndex01:
              0.52,
            sourceInferredIceRichnessIndex01:
              0.41,
            sourceSubsurfaceOceanPotentialIndex01:
              0.28,
            sourceSurfaceLiquidWaterPotentialIndex01:
              0,
            sourceWaterRegime:
              'SURFACE_ICE',
            sourceEstimatedSurfaceTemperatureKelvin:
              145,
            sourceGeologicalActivityIndex01:
              0.18,
            sourceTidalHeatingIndex01:
              0.22,
            sourceGeologyRegime:
              'LOW_ACTIVITY',
            sourceOverallHabitabilityIndex01:
              0.08,
            sourceIsPotentiallyHabitable:
              false,
            sourceGiantHostSpecialization:
              true,
            sourceGiantCompositionRegime:
              'ICE_RICH',
            sourceIsLargeGiantMoon:
              true,
            sourceIsTidallyActiveGiantMoon:
              false,
            sourceIsOceanBearingGiantMoonCandidate:
              false,
            shapeClass:
              'MAJOR_PLANETARY',
            surfaceStyle:
              'ICY',
            presentationRadiusScene:
              0.048,
            presentationIrregularity01:
              0.014,
            presentationLiquidCoverage01:
              0,
            presentationIceCoverage01:
              0.48,
            presentationVolcanicCoverage01:
              0,
            presentationCloudCoverage01:
              0,
            presentationAtmospherePresent:
              false,
            presentationAtmosphereStrength01:
              0,
            presentationAtmosphereShellScale:
              1,
            presentationBaseColorHex:
              '#B7B3AB',
            presentationAccentColorHex:
              '#DCE4E8',
            presentationAtmosphereColorHex:
              '#9FC7E6',
            presentationSeedUint32:
              0x3175e4a2,
          },
      },
    ],
    orbits: [
      {
        id:
          'moon-orbit-4-1',
        kind:
          'moon',
        label:
          'Ciothae e I',
        colorHex:
          '#7EAFC6',
        opacity:
          0.32,
        semiMajorScene:
          0.42,
        semiMinorScene:
          0.414,
        focusOffsetScene:
          0.0714,
        rotationDegrees:
          42,
        inclinationDegrees:
          11.5,
        motionId:
          'moon-4-1-motion',
        motionScale:
          1,
        anchorMotionContributions:
          [],
      },
    ],
    motions: [
      {
        id:
          'moon-4-1-motion',
        semiMajorAxisAu:
          0.001,
        eccentricity:
          0.17,
        periodDays:
          5.75,
        rotationDegrees:
          42,
        inclinationDegrees:
          11.5,
        epochMeanAnomalyDegrees:
          123,
      },
    ],
    simulation: {
      epochSimulationDay:
        73.25,
      playbackDaysPerRealSecond:
        0.5,
    },
    minorBodies:
      [],
  } as unknown as SystemSceneSnapshot;
}
