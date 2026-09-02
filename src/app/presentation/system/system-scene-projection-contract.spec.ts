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
  'SystemScene projection authority through point 25.7',
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
