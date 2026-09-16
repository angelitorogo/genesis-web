import {
  SystemOrbitalMotionEngine,
} from '../../simulation/orbital/system-orbital-motion-engine';

import {
  projectSystemSceneMotionContributions,
  sampleSystemSceneOrbitLocalAu,
} from './system-scene-motion-projection';

import {
  type SystemSceneMotionContributionSnapshot,
  type SystemSceneOrbitalMotionSnapshot,
} from './system-scene-snapshot';

import {
  buildMultipleAdaptiveSystemScaleV3,
  systemSceneProjectAuVector,
  type SystemSceneScaleSnapshot,
} from './system-scene-scale-projection';

describe(
  'SystemScene motion projection point 24.10',
  () => {

    const motion =
      Object.freeze({
        id:
          'planet-1-motion',
        semiMajorAxisAu:
          2,
        eccentricity:
          0.12,
        periodDays:
          400,
        rotationDegrees:
          17,
        inclinationDegrees:
          4,
        epochMeanAnomalyDegrees:
          31,
      } satisfies SystemSceneOrbitalMotionSnapshot);

    const contribution =
      Object.freeze({
        motionId:
          motion.id,
        scale:
          0.75,
      } satisfies SystemSceneMotionContributionSnapshot);

    const contributions =
      Object.freeze([
        contribution,
      ]);

    const scale =
      Object.freeze({
        outerRadiusAu:
          10,
        orbitScaleScenePerAu:
          2,
        targetOuterRadiusScene:
          20,
      } satisfies SystemSceneScaleSnapshot);

    it(
      'should project authoritative orbital definitions into frozen scene coordinates without mutating its inputs',
      () => {

        const beforeMotion =
          JSON.stringify(
            motion,
          );

        const beforeContribution =
          JSON.stringify(
            contribution,
          );

        const simulationDay =
          73.25;

        const physicalPosition =
          SystemOrbitalMotionEngine
            .positionAtSimulationDay(
              motion,
              simulationDay,
            );

        const projected =
          projectSystemSceneMotionContributions(
            contributions,
            motionId =>
              motionId ===
                motion.id
                ? motion
                : undefined,
            simulationDay,
            scale,
          );

        expect(
          projected.x,
        ).toBeCloseTo(
          physicalPosition.xAu *
            contribution.scale *
            scale.orbitScaleScenePerAu,
          12,
        );

        expect(
          projected.y,
        ).toBeCloseTo(
          physicalPosition.yAu *
            contribution.scale *
            scale.orbitScaleScenePerAu,
          12,
        );

        expect(
          projected.z,
        ).toBeCloseTo(
          physicalPosition.zAu *
            contribution.scale *
            scale.orbitScaleScenePerAu,
          12,
        );

        expect(
          Object.isFrozen(
            projected,
          ),
        ).toBe(true);

        expect(
          JSON.stringify(
            motion,
          ),
        ).toBe(
          beforeMotion,
        );

        expect(
          JSON.stringify(
            contribution,
          ),
        ).toBe(
          beforeContribution,
        );
      },
    );


    it(
      'should apply V5.2 post-projection compaction after GLOBAL projection instead of folding it into AU',
      () => {

        const postProjectionContribution =
          Object.freeze({
            motionId:
              motion.id,
            scale:
              0.75,
            postProjectionScale:
              0.30,
          } satisfies SystemSceneMotionContributionSnapshot);

        const simulationDay =
          73.25;

        const physicalPosition =
          SystemOrbitalMotionEngine
            .positionAtSimulationDay(
              motion,
              simulationDay,
            );

        const nonLinearScale =
          buildMultipleAdaptiveSystemScaleV3({
            architecture:
              'BINARY',
            outerRadiusAu:
              20,
            targetOuterRadiusScene:
              6,
            innerBinaryPeriapsisAu:
              1.2,
            primaryStarRadiusScene:
              0.22,
            secondaryStarRadiusScene:
              0.18,
            habitableZoneInnerAu:
              2.0,
            habitableZoneOuterAu:
              3.2,
          });

        const physicalBarycentricProjection =
          systemSceneProjectAuVector(
            {
              x:
                physicalPosition.xAu *
                postProjectionContribution.scale,
              y:
                physicalPosition.yAu *
                postProjectionContribution.scale,
              z:
                physicalPosition.zAu *
                postProjectionContribution.scale,
            },
            nonLinearScale,
          );

        const incorrectlyPreScaledProjection =
          systemSceneProjectAuVector(
            {
              x:
                physicalPosition.xAu *
                postProjectionContribution.scale *
                postProjectionContribution.postProjectionScale,
              y:
                physicalPosition.yAu *
                postProjectionContribution.scale *
                postProjectionContribution.postProjectionScale,
              z:
                physicalPosition.zAu *
                postProjectionContribution.scale *
                postProjectionContribution.postProjectionScale,
            },
            nonLinearScale,
          );

        const projected =
          projectSystemSceneMotionContributions(
            [
              postProjectionContribution,
            ],
            motionId =>
              motionId ===
                motion.id
                ? motion
                : undefined,
            simulationDay,
            nonLinearScale,
          );

        expect(projected.x).toBeCloseTo(
          physicalBarycentricProjection.x * 0.30,
          12,
        );
        expect(projected.y).toBeCloseTo(
          physicalBarycentricProjection.y * 0.30,
          12,
        );
        expect(projected.z).toBeCloseTo(
          physicalBarycentricProjection.z * 0.30,
          12,
        );
        expect(
          Math.hypot(
            projected.x,
            projected.y,
            projected.z,
          ),
        ).not.toBeCloseTo(
          Math.hypot(
            incorrectlyPreScaledProjection.x,
            incorrectlyPreScaledProjection.y,
            incorrectlyPreScaledProjection.z,
          ),
          8,
        );
      },
    );

    it(
      'should fail instead of inventing motion when the snapshot references an unknown orbital definition',
      () => {

        expect(
          () =>
            projectSystemSceneMotionContributions(
              contributions,
              () =>
                undefined,
              0,
              scale,
            ),
        ).toThrowError(
          /Unknown SystemScene orbital motion/,
        );
      },
    );

    it(
      'should expose orbit-guide samples only as frozen ephemeral presentation data',
      () => {

        const samples =
          sampleSystemSceneOrbitLocalAu(
            motion,
            'planetary',
            32,
          );

        expect(
          samples,
        ).toHaveLength(
          32,
        );

        expect(
          Object.isFrozen(
            samples,
          ),
        ).toBe(true);

        expect(
          samples.every(
            sample =>
              Object.isFrozen(
                sample,
              ),
          ),
        ).toBe(true);
      },
    );
  },
);
