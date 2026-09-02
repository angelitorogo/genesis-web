import {
  MinorBodyKind,
} from '../../domain/planetary/minor-body-kind';

import {
  SYSTEM_SCENE_PROJECTION_AUTHORITY,
  assertSystemSceneProjectionSnapshot,
} from './system-scene-projection-contract';

import {
  type SystemSceneSnapshot,
} from './system-scene-snapshot';

describe(
  'SystemScene projection authority through point 25.11',
  () => {

    it(
      'should freeze the architectural contract as domain snapshot in and read-only visual projection out',
      () => {

        expect(
          SYSTEM_SCENE_PROJECTION_AUTHORITY,
        ).toEqual({
          authoritativePhysicsSource:
            'DOMAIN_SNAPSHOT',
          sceneRole:
            'READ_ONLY_VISUAL_PROJECTION',
          allowsPhysicsWriteBack:
            false,
          allowsGroundTruthMutation:
            false,
        });

        expect(
          Object.isFrozen(
            SYSTEM_SCENE_PROJECTION_AUTHORITY,
          ),
        ).toBe(true);
      },
    );

    it(
      'should accept a fully immutable presentation snapshot',
      () => {

        const snapshot =
          projectionSnapshot();

        expect(
          () =>
            assertSystemSceneProjectionSnapshot(
              snapshot,
            ),
        ).not.toThrow();
      },
    );

    it(
      'should reject a mutable point-25.11 asteroid-belt projection before it enters Three.js',
      () => {
        const base =
          projectionSnapshot();

        const mutableBelt = {
          id:
            'asteroid-belt-outer',
          label:
            'Cinturón exterior',
          region:
            'OUTER' as const,
          innerEdgeAu:
            8.4,
          outerEdgeAu:
            46,
          peakAu:
            20.55572634155551,
          populationIndex01:
            0.72,
          innerRadiusScene:
            3.2,
          outerRadiusScene:
            5.8,
          peakRadiusScene:
            4.65,
          colorHex:
            '#8EA5C8',
          opacity:
            0.081,
          peakOpacity:
            0.128,
          boundaryOpacity:
            0.178,
          anchorMotionContributions:
            Object.freeze([]),
        };

        const snapshot =
          Object.freeze({
            ...base,
            asteroidBelts:
              Object.freeze([
                mutableBelt,
              ]),
          }) as SystemSceneSnapshot;

        expect(
          () =>
            assertSystemSceneProjectionSnapshot(
              snapshot,
            ),
        ).toThrowError(
          /snapshot\.asteroidBelts\[0\] is mutable/,
        );
      },
    );

    it(
      'should reject a mutable root before Three.js can treat it as renderer state',
      () => {

        const frozen =
          projectionSnapshot();

        const mutable = {
          ...frozen,
        } as SystemSceneSnapshot;

        expect(
          () =>
            assertSystemSceneProjectionSnapshot(
              mutable,
            ),
        ).toThrowError(
          /snapshot is mutable/,
        );
      },
    );



    it(
      'should reject mutable point-25.1 spin projection before it enters Three.js',
      () => {

        const mutableSpin = {
          source:
            'PLANET_19_3' as const,
          rotationPeriodHours:
            24,
          axialTiltDegrees:
            23.44,
          isRetrograde:
            false,
          isSynchronized:
            false,
          epochPhaseDegrees:
            0,
        };

        const planet =
          Object.freeze({
            id:
              'planet-1',
            kind:
              'planet' as const,
            label:
              'Fixture b',
            title:
              'Fixture b',
            colorHex:
              '#5577AA',
            radiusScene:
              0.08,
            position:
              Object.freeze({
                x: 1,
                y: 0,
                z: 0,
              }),
            orbitId:
              'orbit-planet-1',
            motionContributions:
              Object.freeze([]),
            surfaceStyle:
              'rocky' as const,
            lightIntensity:
              0,
            sourceLuminositySolar:
              null,
            surfaceEnvironment:
              null,
            giantAtmosphere:
              null,
          specialPresentation:
            null,
            spin:
              mutableSpin,
          });

        const base =
          projectionSnapshot();

        const snapshot =
          Object.freeze({
            ...base,
            planets:
              Object.freeze([
                planet,
              ]),
          }) as SystemSceneSnapshot;

        expect(
          () =>
            assertSystemSceneProjectionSnapshot(
              snapshot,
            ),
        ).toThrowError(
          /snapshot\.planets\[0\]\.spin is mutable/,
        );
      },
    );

    it(
      'should reject mutable point-25.10 moon visual presentation before it enters Three.js',
      () => {
        const visualPresentation = {
          version: 1 as const,
          sourceMoonIdentity: 'MOON-MUTABLE',
          sourceHostPlanetType: 'GAS_GIANT',
          sourceRadiusEarth: 0.3,
          sourceMassEarth: 0.02,
          sourceMeanDensityGramsPerCubicCentimeter: 3.1,
          sourceSurfaceGravityEarth: 0.2,
          sourceAtmosphereRetentionIndex01: 0.5,
          sourceAtmosphereRegime: 'SUBSTANTIAL',
          sourceWaterInventoryIndex01: 0.6,
          sourceInferredIceRichnessIndex01: 0.4,
          sourceSubsurfaceOceanPotentialIndex01: 0.7,
          sourceSurfaceLiquidWaterPotentialIndex01: 0.4,
          sourceWaterRegime: 'MIXED',
          sourceEstimatedSurfaceTemperatureKelvin: 280,
          sourceGeologicalActivityIndex01: 0.4,
          sourceTidalHeatingIndex01: 0.3,
          sourceGeologyRegime: 'ACTIVE',
          sourceOverallHabitabilityIndex01: 0.5,
          sourceIsPotentiallyHabitable: true,
          sourceGiantHostSpecialization: true,
          sourceGiantCompositionRegime: 'MIXED_ROCK_ICE',
          sourceIsLargeGiantMoon: true,
          sourceIsTidallyActiveGiantMoon: false,
          sourceIsOceanBearingGiantMoonCandidate: true,
          shapeClass: 'MAJOR_PLANETARY' as const,
          surfaceStyle: 'OCEANIC' as const,
          presentationRadiusScene: 0.03,
          presentationIrregularity01: 0.02,
          presentationLiquidCoverage01: 0.4,
          presentationIceCoverage01: 0.3,
          presentationVolcanicCoverage01: 0.1,
          presentationCloudCoverage01: 0.3,
          presentationAtmospherePresent: true,
          presentationAtmosphereStrength01: 0.5,
          presentationAtmosphereShellScale: 1.035,
          presentationBaseColorHex: '#386F91',
          presentationAccentColorHex: '#A8BBA8',
          presentationAtmosphereColorHex: '#9FC9DF',
          presentationSeedUint32: 1,
        };
        const moon = Object.freeze({
          id: 'moon-1-1',
          kind: 'moon' as const,
          label: 'I',
          title: 'Fixture b I',
          hostPlanetId: 'planet-1',
          hostPlanetOrdinal: 1,
          colorHex: '#386F91',
          radiusScene: 0.03,
          position: Object.freeze({ x: 1, y: 0, z: 0 }),
          orbitId: 'orbit-moon-1-1',
          motionContributions: Object.freeze([]),
          spin: Object.freeze({
            source: 'MOON_21_4' as const,
            rotationPeriodHours: 72,
            axialTiltDegrees: null,
            isRetrograde: null,
            isSynchronized: true,
            epochPhaseDegrees: 0,
          }),
          visualPresentation,
        });
        const base = projectionSnapshot();
        const snapshot = Object.freeze({
          ...base,
          moons: Object.freeze([moon]),
        }) as SystemSceneSnapshot;

        expect(() =>
          assertSystemSceneProjectionSnapshot(snapshot),
        ).toThrowError(/snapshot\.moons\[0\]\.visualPresentation is mutable/);
      },
    );

    it(
      'should reject mutable point-25.3 surface environment before it enters Three.js',
      () => {

        const mutableSurfaceEnvironment = {
          source:
            'PHASE_20_SURFACE_ENVIRONMENT' as const,
          solidSurfaceAvailable:
            true,
          waterInventoryIndex01:
            0.7,
          surfaceLiquidWaterCoverageFraction01:
            0.55,
          surfaceIceCoverageFraction01:
            0.08,
          waterVaporFraction01:
            0.12,
          retainedAtmosphericWaterVaporMoleFraction01:
            0.018,
          meanSurfaceTemperatureKelvin:
            288,
          climateStabilityIndex01:
            0.8,
          retainedSurfacePressurePascal:
            101_325,
          geologicalActivityIndex01:
            0.45,
          volcanismIndex01:
            0.22,
          surfaceWaterRegime:
            'OCEANS',
          volcanismRegime:
            'LOW',
          exposedLandCoverageFraction01:
            0.37,
          presentationDesertCoverageFraction01:
            0.08,
          presentationVolcanicCoverageFraction01:
            0.015,
          presentationCloudCoverageFraction01:
            0.32,
        };

        const planet =
          Object.freeze({
            id:
              'planet-1',
            kind:
              'planet' as const,
            label:
              'Fixture b',
            title:
              'Fixture b',
            colorHex:
              '#5577AA',
            radiusScene:
              0.08,
            position:
              Object.freeze({
                x: 1,
                y: 0,
                z: 0,
              }),
            orbitId:
              'orbit-planet-1',
            motionContributions:
              Object.freeze([]),
            surfaceStyle:
              'rocky' as const,
            lightIntensity:
              0,
            sourceLuminositySolar:
              null,
            surfaceEnvironment:
              mutableSurfaceEnvironment,
            giantAtmosphere:
              null,
          specialPresentation:
            null,
            spin:
              Object.freeze({
                source:
                  'PLANET_19_3' as const,
                rotationPeriodHours:
                  24,
                axialTiltDegrees:
                  23.44,
                isRetrograde:
                  false,
                isSynchronized:
                  false,
                epochPhaseDegrees:
                  0,
              }),
          });

        const base =
          projectionSnapshot();

        const snapshot =
          Object.freeze({
            ...base,
            planets:
              Object.freeze([
                planet,
              ]),
          }) as SystemSceneSnapshot;

        expect(
          () =>
            assertSystemSceneProjectionSnapshot(
              snapshot,
            ),
        ).toThrowError(
          /snapshot\.planets\[0\]\.surfaceEnvironment is mutable/,
        );
      },
    );

    it(
      'should reject mutable point-25.7 asteroid presentation before it enters Three.js',
      () => {

        const mutableAsteroidPresentation = {
          version: 1 as const,
          source: 'PHASE_22_4_ASTEROID_TAXONOMY' as const,
          proceduralId: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          sourceDiameterKilometers: 220,
          compositionRegime: 'CARBONACEOUS' as const,
          structureRegime: 'RUBBLE_PILE' as const,
          multiplicityRegime: 'SINGLE' as const,
          carbonaceousFraction01: 0.6,
          silicateFraction01: 0.25,
          metalFraction01: 0.05,
          iceFraction01: 0.1,
          porosityIndex01: 0.45,
          bulkDensityGramsPerCubicCentimeter: 1.5,
          geometricAlbedo01: 0.06,
          binaryMassRatio01: null,
          binarySeparationPrimaryRadii: null,
          shapeSeedUint32: 123,
          presentationColorHex: '#51483F',
          presentationRoughness01: 0.95,
          presentationMetalness01: 0.03,
          presentationIrregularity01: 0.44,
          presentationFacetContrast01: 0.48,
          presentationAxisScaleX: 1.1,
          presentationAxisScaleY: 0.95,
          presentationAxisScaleZ: 0.95,
          presentationOrientationXRadians: 0.2,
          presentationOrientationYRadians: 1.1,
          presentationOrientationZRadians: -0.3,
          presentationContactSecondaryRadiusScale01: null,
          presentationDetachedSecondaryRadiusScale01: null,
          presentationDetachedSeparation01: null,
          presentationSeparationAdjusted: false,
        };

        const minorBody =
          Object.freeze({
            id: 'minor-1-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            kind: 'minor-body' as const,
            minorBodyKind: MinorBodyKind.ASTEROID,
            label: 'AST-IN-001',
            title: 'Asteroide AST-IN-001',
            colorHex: '#B59A78',
            radiusScene: 0.014,
            position: Object.freeze({ x: 1, y: 0, z: 0 }),
            orbitId: 'orbit-minor-1',
            motionContributions: Object.freeze([]),
            asteroidPresentation: mutableAsteroidPresentation,
            cometPresentation: null,
          });

        const base = projectionSnapshot();
        const snapshot = Object.freeze({
          ...base,
          minorBodies: Object.freeze([minorBody]),
        }) as SystemSceneSnapshot;

        expect(
          () => assertSystemSceneProjectionSnapshot(snapshot),
        ).toThrowError(
          /snapshot\.minorBodies\[0\]\.asteroidPresentation is mutable/,
        );
      },
    );

    it(
      'should reject mutable point-25.8 comet presentation before it enters Three.js',
      () => {
        const mutableCometPresentation = {
          version: 1 as const,
          source: 'PHASE_22_6_COMET_ACTIVITY' as const,
          proceduralId: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
          sourceDiameterKilometers: 12,
          iceFraction01: 0.65,
          dustFraction01: 0.35,
          porosityIndex01: 0.55,
          bulkDensityGramsPerCubicCentimeter: 0.62,
          geometricAlbedo01: 0.04,
          volatileRichnessIndex01: 0.8,
          periodRegime: 'SHORT_PERIOD' as const,
          referenceLuminositySolar: 1,
          semiMajorAxisAu: 4,
          eccentricity: 0.75,
          periapsisAu: 1,
          apoapsisAu: 7,
          orbitalPeriodYears: 8,
          epochMeanAnomalyDegrees: 0,
          presentationTimeScale: 1,
          shapeSeedUint32: 321,
          presentationNucleusColorHex: '#34373A',
          presentationComaColorHex: '#D6F4F7',
          presentationDustTailColorHex: '#D9C3A1',
          presentationIonTailColorHex: '#73CFFF',
          presentationNucleusRoughness01: 0.9,
          presentationNucleusAxisScaleX: 1.1,
          presentationNucleusAxisScaleY: 0.9,
          presentationNucleusAxisScaleZ: 1.0,
          presentationNucleusIrregularity01: 0.42,
        };

        const minorBody = Object.freeze({
          id: 'minor-2-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
          kind: 'minor-body' as const,
          minorBodyKind: MinorBodyKind.COMET,
          label: 'COM-001',
          title: 'Cometa COM-001',
          colorHex: '#34373A',
          radiusScene: 0.014,
          position: Object.freeze({ x: 1, y: 0, z: 0 }),
          orbitId: 'orbit-minor-2',
          motionContributions: Object.freeze([]),
          asteroidPresentation: null,
          cometPresentation: mutableCometPresentation,
        });

        const base = projectionSnapshot();
        const snapshot = Object.freeze({
          ...base,
          minorBodies: Object.freeze([minorBody]),
        }) as SystemSceneSnapshot;

        expect(
          () => assertSystemSceneProjectionSnapshot(snapshot),
        ).toThrowError(
          /snapshot\.minorBodies\[0\]\.cometPresentation is mutable/,
        );
      },
    );

    it(
      'should reject mutable point-25.4 deep-envelope atmosphere before it enters Three.js',
      () => {

        const mutableGiantAtmosphere = {
          source:
            'PHASE_19_20_DEEP_ENVELOPE' as const,
          regime:
            'GAS_GIANT' as const,
          massEarth:
            220,
          radiusEarth:
            10.4,
          densityGramsPerCubicCentimeter:
            1.08,
          envelopeMassFraction01:
            0.72,
          iceBearingFractionOfSolids01:
            0.12,
          rotationPeriodHours:
            10,
          equilibriumTemperatureKelvin:
            160,
          referenceBondAlbedo01:
            0.45,
          retainedMeanMolarMassGramsPerMole:
            2.4,
          hydrogenMoleFraction01:
            0.84,
          heliumMoleFraction01:
            0.14,
          methaneMoleFraction01:
            0.02,
          ammoniaMoleFraction01:
            0,
          waterVaporMoleFraction01:
            0,
          lightGasMoleFraction01:
            0.98,
          condensableMoleFraction01:
            0.02,
          presentationBandCount:
            16,
          presentationJetSharpness01:
            0.7,
          presentationTurbulence01:
            0.6,
          presentationStormCoverage01:
            0.2,
          presentationPolarHaze01:
            0.3,
          presentationMethaneBlueing01:
            0.08,
          presentationWarmChromophore01:
            0.45,
          presentationUpperHaze01:
            0.25,
        };

        const planet =
          Object.freeze({
            id:
              'planet-1',
            kind:
              'planet' as const,
            label:
              'Fixture b',
            title:
              'Fixture b',
            colorHex:
              '#D1A16C',
            radiusScene:
              0.12,
            position:
              Object.freeze({
                x: 1,
                y: 0,
                z: 0,
              }),
            orbitId:
              'orbit-planet-1',
            motionContributions:
              Object.freeze([]),
            surfaceStyle:
              'gaseous' as const,
            lightIntensity:
              0,
            sourceLuminositySolar:
              null,
            surfaceEnvironment:
              null,
            giantAtmosphere:
              mutableGiantAtmosphere,
            specialPresentation:
              null,
            spin:
              Object.freeze({
                source:
                  'PLANET_19_3' as const,
                rotationPeriodHours:
                  10,
                axialTiltDegrees:
                  3,
                isRetrograde:
                  false,
                isSynchronized:
                  false,
                epochPhaseDegrees:
                  0,
              }),
          });

        const base =
          projectionSnapshot();

        const snapshot =
          Object.freeze({
            ...base,
            planets:
              Object.freeze([
                planet,
              ]),
          }) as SystemSceneSnapshot;

        expect(
          () =>
            assertSystemSceneProjectionSnapshot(
              snapshot,
            ),
        ).toThrowError(
          /snapshot\.planets\[0\]\.giantAtmosphere is mutable/,
        );
      },
    );

    it(
      'should reject mutable nested scene coordinates even when the containing snapshot is frozen',
      () => {

        const mutablePosition = {
          x: 1,
          y: 0,
          z: 0,
        };

        const star =
          Object.freeze({
            id:
              'star-a',
            kind:
              'star' as const,
            label:
              'A',
            title:
              'Jotheria A',
            colorHex:
              '#FFFFFF',
            radiusScene:
              0.3,
            position:
              mutablePosition,
            orbitId:
              null,
            motionContributions:
              Object.freeze([]),
            surfaceStyle:
              'emissive' as const,
            lightIntensity:
              5,
            sourceLuminositySolar:
              1,
            surfaceEnvironment:
              null,
            giantAtmosphere:
              null,
          specialPresentation:
            null,
            spin:
              Object.freeze({
                source:
                  'UNAVAILABLE' as const,
                rotationPeriodHours:
                  null,
                axialTiltDegrees:
                  null,
                isRetrograde:
                  null,
                isSynchronized:
                  false,
                epochPhaseDegrees:
                  0,
              }),
          });

        const base =
          projectionSnapshot();

        const snapshot =
          Object.freeze({
            ...base,
            stars:
              Object.freeze([
                star,
              ]),
          }) as SystemSceneSnapshot;

        expect(
          () =>
            assertSystemSceneProjectionSnapshot(
              snapshot,
            ),
        ).toThrowError(
          /snapshot\.stars\[0\]\.position is mutable/,
        );
      },
    );
  },
);

function projectionSnapshot():
  SystemSceneSnapshot {

  return Object.freeze({
    universeSeed:
      '0000-0000-0000-0000-0000-0000-0000-0001',
    generatorVersionCode:
      1,
    address:
      Object.freeze({
        galaxyIndex:
          '0',
        sectorKey:
          '0',
        galacticObjectIndex:
          '0',
      }),
    proceduralIdentity:
      'projection-contract-fixture',
    title:
      'Projection fixture',
    discoveryStateCode:
      3,
    discoveryStateLabel:
      'Catalogado',
    knowledgeLevel:
      null,
    multiplicityName:
      'SINGLE',
    componentCount:
      1,
    accessibleLabel:
      'Projection fixture',
    stars:
      Object.freeze([]),
    planets:
      Object.freeze([]),
    moons:
      Object.freeze([]),
    minorBodies:
      Object.freeze([]),
    habitableZone:
      null,
    orbitalRiskTargets:
      Object.freeze([]),
    layers:
      Object.freeze({
        moonCount:
          0,
        minorBodyCount:
          0,
        habitableZoneAvailable:
          false,
        orbitalRiskTargetCount:
          0,
        orbitalCrossingTargetCount:
          0,
        orbitalApproachTargetCount:
          0,
        orbitalCollisionGeometryTargetCount:
          0,
      }),
    orbits:
      Object.freeze([]),
    motions:
      Object.freeze([]),
    simulation:
      Object.freeze({
        epochSimulationDay:
          0,
        playbackDaysPerRealSecond:
          1,
      }),
    scale:
      Object.freeze({
        outerRadiusAu:
          4,
        orbitScaleScenePerAu:
          1.2,
        targetOuterRadiusScene:
          4.8,
      }),
  } as unknown as SystemSceneSnapshot);
}
