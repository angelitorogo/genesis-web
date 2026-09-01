import {
  DiscoveryState,
} from '../../../domain/discovery/discovery-state';

import {
  SystemOrbitalMotionEngine,
} from '../../../simulation/orbital/system-orbital-motion-engine';

import {
  type SystemSceneBodySnapshot,
  type SystemSceneSnapshot,
  SystemSceneSnapshotBuilder,
} from '../../system/system-scene-snapshot';

import {
  SystemSceneProjectionSpace,
  SystemSceneScaleProjectionMode,
  systemSceneProjectAuVector,
  systemSceneProjectAuVectorInSpace,
  systemSceneProjectedRadiusAu,
} from '../../system/system-scene-scale-projection';

import {
  STELLAR_SYSTEM_LABORATORY_FAMILY_IDS,
  StellarSystemLaboratoryCaseId,
  StellarSystemLaboratoryFixtures,
} from './stellar-system-laboratory-fixtures';

describe(
  'StellarSystemLaboratory point 24.5 adaptive A-H scale validation',
  () => {
    it(
      'should keep all eight SINGLE families readable with the established adaptive scale',
      () => {
        for (
          const familyId
          of STELLAR_SYSTEM_LABORATORY_FAMILY_IDS
        ) {
          const snapshot =
            cataloguedSnapshot(
              StellarSystemLaboratoryCaseId.SINGLE,
              familyId,
            );

          expect(
            snapshot.stars,
            `SINGLE family ${familyId} must expose one stellar primary`,
          ).toHaveLength(
            1,
          );

          expect(
            snapshot.scale.projectionMode,
            `SINGLE family ${familyId} must use the 24.5 adaptive scale`,
          ).toBe(
            SystemSceneScaleProjectionMode
              .SINGLE_ADAPTIVE_LOG_V1,
          );

          const star =
            snapshot.stars[0]!;

          for (
            const planet
            of snapshot.planets
          ) {
            const motionContribution =
              planet.motionContributions
                .find(
                  contribution =>
                    contribution.motionId.startsWith(
                      'planet-',
                    ),
                );

            expect(
              motionContribution,
              `SINGLE family ${familyId} planet ${planet.label} must retain its physical orbital motion`,
            ).toBeDefined();

            const motion =
              snapshot.motions.find(
                candidate =>
                  candidate.id ===
                  motionContribution!
                    .motionId,
              )!;

            const periapsisAu =
              motion.semiMajorAxisAu *
              (
                1 -
                motion.eccentricity
              );

            const periapsisScene =
              systemSceneProjectedRadiusAu(
                periapsisAu,
                snapshot.scale,
              );

            expect(
              periapsisScene,
              `SINGLE family ${familyId} planet ${planet.label} orbit must not intersect the visual stellar body`,
            ).toBeGreaterThan(
              star.radiusScene +
              planet.radiusScene +
              0.18,
            );

            expect(
              planet.radiusScene /
              star.radiusScene,
              `SINGLE family ${familyId} planet ${planet.label} must remain visually subordinate to the star`,
            ).toBeLessThan(
              0.3,
            );
          }
        }
      },
      60_000,
    );

    it(
      'should extend adaptive scaling to all BINARY and TRIPLE A-H families without visual stellar collisions',
      () => {
        for (
          const caseId
          of [
            StellarSystemLaboratoryCaseId.BINARY,
            StellarSystemLaboratoryCaseId.TRIPLE,
          ] as const
        ) {
          for (
            const familyId
            of STELLAR_SYSTEM_LABORATORY_FAMILY_IDS
          ) {
            const snapshot =
              cataloguedSnapshot(
                caseId,
                familyId,
              );

            expect(
              snapshot.scale.projectionMode,
              `${caseId} family ${familyId} must use its 24.5 adaptive scale`,
            ).toBe(
              caseId ===
                StellarSystemLaboratoryCaseId.TRIPLE
                ? SystemSceneScaleProjectionMode
                    .TRIPLE_HIERARCHICAL_V1
                : SystemSceneScaleProjectionMode
                    .BINARY_ADAPTIVE_LOG_V1,
            );

            expect(
              snapshot.stars.length,
            ).toBe(
              caseId ===
                StellarSystemLaboratoryCaseId.TRIPLE
                ? 3
                : 2,
            );

            const innerMotion =
              snapshot.motions.find(
                motion =>
                  motion.id ===
                  'stellar-inner-relative',
              )!;

            const sampleCount =
              32;

            for (
              let sampleIndex = 0;
              sampleIndex <
                sampleCount;
              sampleIndex += 1
            ) {
              const simulationDay =
                innerMotion.periodDays *
                sampleIndex /
                sampleCount;

              const primary =
                snapshot.stars.find(
                  star =>
                    star.label ===
                    'A',
                )!;

              const secondary =
                snapshot.stars.find(
                  star =>
                    star.label ===
                    'B',
                )!;

              const primaryPosition =
                scenePositionAt(
                  snapshot,
                  primary,
                  simulationDay,
                );

              const secondaryPosition =
                scenePositionAt(
                  snapshot,
                  secondary,
                  simulationDay,
                );

              expect(
                distance(
                  primaryPosition,
                  secondaryPosition,
                ),
                `${caseId} family ${familyId} A-B must remain visually separated across the inner orbit`,
              ).toBeGreaterThan(
                primary.radiusScene +
                secondary.radiusScene +
                0.08,
              );
            }

            const smallestStarRadius =
              Math.min(
                ...snapshot.stars.map(
                  star =>
                    star.radiusScene,
                ),
              );

            for (
              const planet
              of snapshot.planets
            ) {
              const planetaryContribution =
                planet.motionContributions.find(
                  contribution =>
                    contribution.motionId.startsWith(
                      'planet-',
                    ),
                )!;

              if (
                caseId ===
                StellarSystemLaboratoryCaseId.BINARY
              ) {
                expect(
                  planetaryContribution.linearScenePerAu,
                  `BINARY family ${familyId} must preserve the already-validated V2 projection contract`,
                ).toBeUndefined();
              } else {
                expect(
                  planetaryContribution.linearScenePerAu,
                  `TRIPLE family ${familyId} must use the V4 local deconfliction projection`,
                ).toBeDefined();
              }

              expect(
                planet.radiusScene /
                smallestStarRadius,
                `${caseId} family ${familyId} planet ${planet.label} must remain visually subordinate to every stellar component`,
              ).toBeLessThan(
                0.4,
              );
            }
          }
        }
      },
      120_000,
    );
    it(
      'should keep every TRIPLE A-H inner subsystem rigid while the outer hierarchy moves',
      () => {
        for (
          const familyId
          of STELLAR_SYSTEM_LABORATORY_FAMILY_IDS
        ) {
          const snapshot =
            cataloguedSnapshot(
              StellarSystemLaboratoryCaseId.TRIPLE,
              familyId,
            );

          expect(
            snapshot.scale.projectionMode,
          ).toBe(
            SystemSceneScaleProjectionMode
              .TRIPLE_HIERARCHICAL_V1,
          );

          const primary =
            snapshot.stars.find(
              star =>
                star.label ===
                'A',
            )!;
          const secondary =
            snapshot.stars.find(
              star =>
                star.label ===
                'B',
            )!;
          const tertiary =
            snapshot.stars.find(
              star =>
                star.label ===
                'C',
            )!;

          const outerMotion =
            snapshot.motions.find(
              motion =>
                motion.id ===
                'stellar-outer-relative',
            )!;

          for (
            let sampleIndex = 0;
            sampleIndex <
              24;
            sampleIndex += 1
          ) {
            const day =
              outerMotion.periodDays *
              sampleIndex /
              24;

            const a =
              scenePositionAt(
                snapshot,
                primary,
                day,
              );
            const b =
              scenePositionAt(
                snapshot,
                secondary,
                day,
              );
            const c =
              scenePositionAt(
                snapshot,
                tertiary,
                day,
              );

            expect(
              distance(
                a,
                b,
              ),
              `TRIPLE family ${familyId} A-B must not be compressed by the outer projection`,
            ).toBeGreaterThan(
              primary.radiusScene +
              secondary.radiusScene +
              0.08,
            );

            const abMid = {
              x:
                (a.x + b.x) / 2,
              y:
                (a.y + b.y) / 2,
              z:
                (a.z + b.z) / 2,
            };

            expect(
              distance(
                abMid,
                c,
              ),
              `TRIPLE family ${familyId} C must remain visibly exterior to the A-B subsystem`,
            ).toBeGreaterThan(
              0.9,
            );
          }
        }
      },
      120_000,
    );

    it(
      'should deconflict dense TRIPLE A-H planetary envelopes without changing their physical motions',
      () => {
        for (
          const familyId
          of STELLAR_SYSTEM_LABORATORY_FAMILY_IDS
        ) {
          const snapshot =
            cataloguedSnapshot(
              StellarSystemLaboratoryCaseId.TRIPLE,
              familyId,
            );

          const planetaryOrbits =
            snapshot.orbits
              .filter(
                orbit =>
                  orbit.kind ===
                  'planetary',
              )
              .map(
                orbit => {
                  expect(
                    orbit.linearScenePerAu,
                    `TRIPLE family ${familyId} ${orbit.label} must use the V4 per-orbit local presentation scale`,
                  ).toBeDefined();

                  const motion =
                    snapshot.motions.find(
                      candidate =>
                        candidate.id ===
                        orbit.motionId,
                    )!;

                  const body =
                    snapshot.planets.find(
                      planet =>
                        planet.orbitId ===
                        orbit.id,
                    )!;

                  const scenePerAu =
                    orbit.linearScenePerAu!;

                  return {
                    orbit,
                    body,
                    motion,
                    periapsisScene:
                      motion.semiMajorAxisAu *
                      (
                        1 -
                        motion.eccentricity
                      ) *
                      scenePerAu,
                    apoapsisScene:
                      motion.semiMajorAxisAu *
                      (
                        1 +
                        motion.eccentricity
                      ) *
                      scenePerAu,
                  };
                },
              )
              .sort(
                (
                  first,
                  second,
                ) =>
                  first.motion.semiMajorAxisAu -
                  second.motion.semiMajorAxisAu,
              );

          for (
            let index = 1;
            index <
              planetaryOrbits.length;
            index += 1
          ) {
            const previous =
              planetaryOrbits[
                index -
                1
              ]!;
            const current =
              planetaryOrbits[
                index
              ]!;

            expect(
              current.orbit.semiMajorScene -
                previous.orbit.semiMajorScene,
              `TRIPLE family ${familyId} neighbouring ${previous.orbit.label}/${current.orbit.label} visual tracks must leave body clearance`,
            ).toBeGreaterThanOrEqual(
              previous.body.radiusScene +
              current.body.radiusScene +
              0.02,
            );
          }
        }
      },
      120_000,
    );

  },
);

function cataloguedSnapshot(
  caseId:
    typeof StellarSystemLaboratoryCaseId[
      keyof typeof StellarSystemLaboratoryCaseId
    ],

  familyId:
    typeof STELLAR_SYSTEM_LABORATORY_FAMILY_IDS[number],
): SystemSceneSnapshot {

  const generationKey =
    StellarSystemLaboratoryFixtures
      .generationKey();

  const frame =
    StellarSystemLaboratoryFixtures
      .frame(
        caseId,
        familyId,
      );

  const catalogued =
    frame.stages.find(
      stage =>
        stage.discoveryState.code ===
        DiscoveryState.CATALOGUED.code,
    )!;

  return SystemSceneSnapshotBuilder
    .buildFromSource({
      universeSeed:
        generationKey
          .universeSeed
          .serialize(),
      generatorVersionCode:
        generationKey
          .generatorVersionCode,
      locator:
        frame.family.locator,
      proceduralIdentity:
        `G${frame.family.locator.galaxyIndex.toString()} / S${frame.family.locator.sectorKey.toString()} / O${frame.family.locator.galacticObjectIndex.toString()}`,
      discoveryState:
        catalogued.discoveryState,
      discoveryStateLabel:
        catalogued.label,
      stellarSystemCard:
        catalogued.card,
    });
}

function scenePositionAt(
  snapshot:
    SystemSceneSnapshot,

  body:
    SystemSceneBodySnapshot,

  simulationDay:
    number,
): {
  readonly x:
    number;

  readonly y:
    number;

  readonly z:
    number;
} {

  let globalXAu = 0;
  let globalYAu = 0;
  let globalZAu = 0;
  let sceneX = 0;
  let sceneY = 0;
  let sceneZ = 0;

  for (
    const contribution
    of body.motionContributions
  ) {
    const motion =
      snapshot.motions.find(
        candidate =>
          candidate.id ===
          contribution.motionId,
      )!;

    const position =
      SystemOrbitalMotionEngine
        .positionAtSimulationDay(
          motion,
          simulationDay,
        );

    const linearScenePerAu =
      contribution.linearScenePerAu ??
      null;

    if (
      linearScenePerAu !==
        null
    ) {
      sceneX +=
        position.xAu *
        contribution.scale *
        linearScenePerAu;
      sceneY +=
        position.yAu *
        contribution.scale *
        linearScenePerAu;
      sceneZ +=
        position.zAu *
        contribution.scale *
        linearScenePerAu;
      continue;
    }

    const space =
      contribution.projectionSpace ??
      SystemSceneProjectionSpace.GLOBAL;

    if (
      space ===
      SystemSceneProjectionSpace.GLOBAL
    ) {
      globalXAu +=
        position.xAu *
        contribution.scale;
      globalYAu +=
        position.yAu *
        contribution.scale;
      globalZAu +=
        position.zAu *
        contribution.scale;
      continue;
    }

    const projected =
      systemSceneProjectAuVectorInSpace(
        {
          x:
            position.xAu,
          y:
            position.yAu,
          z:
            position.zAu,
        },
        snapshot.scale,
        space,
      );

    sceneX +=
      projected.x *
      contribution.scale;
    sceneY +=
      projected.y *
      contribution.scale;
    sceneZ +=
      projected.z *
      contribution.scale;
  }

  const global =
    systemSceneProjectAuVector(
      {
        x:
          globalXAu,
        y:
          globalYAu,
        z:
          globalZAu,
      },
      snapshot.scale,
    );

  return {
    x:
      sceneX +
      global.x,
    y:
      sceneY +
      global.y,
    z:
      sceneZ +
      global.z,
  };
}

function distance(
  first:
    {
      readonly x:
        number;
      readonly y:
        number;
      readonly z:
        number;
    },

  second:
    {
      readonly x:
        number;
      readonly y:
        number;
      readonly z:
        number;
    },
): number {

  return Math.hypot(
    first.x -
      second.x,
    first.y -
      second.y,
    first.z -
      second.z,
  );
}
