import {
  DiscoveryState,
} from '../../../domain/discovery/discovery-state';

import {
  type SystemSceneBodySnapshot,
  type SystemSceneSnapshot,
  SystemSceneSnapshotBuilder,
} from '../../system/system-scene-snapshot';

import {
  SystemSceneProjectionSpace,
  SystemSceneScaleProjectionMode,
  systemSceneProjectedRadiusAu,
  systemSceneProjectedRadiusAuInSpace,
} from '../../system/system-scene-scale-projection';

import {
  projectSystemSceneMotionContributions,
} from '../../system/system-scene-motion-projection';

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
              .SINGLE_PRESENTATION_V3,
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
              `SINGLE family ${familyId} planet ${planet.label} orbit centreline must remain outside the rendered stellar photosphere plus the planet body`,
            ).toBeGreaterThan(
              star.radiusScene +
              planet.radiusScene,
            );

            const stellarClearance =
              snapshot.stellarOrbitClearance;

            expect(
              stellarClearance,
              `SINGLE family ${familyId} must expose the V5 stellar/orbit clearance diagnostic`,
            ).not.toBeNull();

            expect(
              stellarClearance?.clearanceMode,
              `SINGLE family ${familyId} must satisfy the V5 renderer clearance without best-effort fallback`,
            ).toBe(
              'ENFORCED',
            );

            expect(
              stellarClearance?.clearanceSatisfied,
              `SINGLE family ${familyId} must keep the nearest planetary orbit outside the useful optical envelope`,
            ).toBe(
              true,
            );

            if (
              stellarClearance
                ?.nearestPlanetPeriapsisRadiusScene !==
                  null &&
              stellarClearance
                ?.nearestPlanetPeriapsisRadiusScene !==
                  undefined
            ) {
              expect(
                stellarClearance
                  .nearestPlanetPeriapsisRadiusScene,
                `SINGLE family ${familyId} nearest orbit must remain outside the V5 optical host envelope`,
              ).toBeGreaterThan(
                stellarClearance
                  .hostOpticalEnvelopeRadiusScene,
              );

              expect(
                stellarClearance
                  .actualOpticalClearanceScene,
                `SINGLE family ${familyId} must honour the V5 adaptive optical clearance`,
              ).toBeGreaterThanOrEqual(
                stellarClearance
                  .requestedMinimumClearanceScene ??
                  0,
              );
            }

            // V5 deliberately presents the stellar photosphere and the
            // planet with different, non-authoritative visual scales. A
            // close-in giant may therefore have a larger rendered radius
            // than a strongly clearance-limited star: their size ratio is
            // not a physical or a renderer contract. The useful optical
            // halo must, however, stay clear of the entire planet body at
            // periapsis, not just of its orbit centreline.
            expect(
              Number.isFinite(planet.radiusScene) &&
                planet.radiusScene > 0,
              `SINGLE family ${familyId} planet ${planet.label} must retain a finite, positive presentation radius`,
            ).toBe(true);

            expect(
              periapsisScene - planet.radiusScene,
              `SINGLE family ${familyId} planet ${planet.label} must keep its body outside the V5 useful optical halo at periapsis`,
            ).toBeGreaterThan(
              stellarClearance
                ?.hostOpticalEnvelopeRadiusScene ??
                Number.POSITIVE_INFINITY,
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
                    .TRIPLE_PRESENTATION_V3
                : SystemSceneScaleProjectionMode
                    .BINARY_PRESENTATION_V3,
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

              expect(
                planetaryContribution.linearScenePerAu,
                `${caseId} family ${familyId} must preserve the shared nonlinear V3 radial projection instead of a per-orbit linear override`,
              ).toBeUndefined();

              expect(
                planetaryContribution.projectionSpace,
                `${caseId} family ${familyId} must select the correct V3 projection space`,
              ).toBe(
                caseId ===
                  StellarSystemLaboratoryCaseId.TRIPLE
                  ? SystemSceneProjectionSpace.TRIPLE_LOCAL
                  : undefined,
              );

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
              .TRIPLE_PRESENTATION_V3,
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
      'should preserve dense TRIPLE A-H planetary radial ordering without per-orbit presentation distortion',
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
                    `TRIPLE family ${familyId} ${orbit.label} must not bypass the V3 shared local radial projection with a per-orbit linear override`,
                  ).toBeUndefined();

                  expect(
                    orbit.projectionSpace,
                    `TRIPLE family ${familyId} ${orbit.label} must remain in the V3 triple-local projection space`,
                  ).toBe(
                    SystemSceneProjectionSpace.TRIPLE_LOCAL,
                  );

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

                  return {
                    orbit,
                    body,
                    motion,
                    periapsisScene:
                      systemSceneProjectedRadiusAuInSpace(
                        motion.semiMajorAxisAu *
                        (
                          1 -
                          motion.eccentricity
                        ),
                        snapshot.scale,
                        SystemSceneProjectionSpace.TRIPLE_LOCAL,
                      ),
                    apoapsisScene:
                      systemSceneProjectedRadiusAuInSpace(
                        motion.semiMajorAxisAu *
                        (
                          1 +
                          motion.eccentricity
                        ),
                        snapshot.scale,
                        SystemSceneProjectionSpace.TRIPLE_LOCAL,
                      ),
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
              current.orbit.semiMajorScene,
              `TRIPLE family ${familyId} neighbouring ${previous.orbit.label}/${current.orbit.label} must preserve strict radial ordering under the shared V3 projection`,
            ).toBeGreaterThan(
              previous.orbit.semiMajorScene,
            );

            expect(
              previous.orbit.semiMajorScene,
              `TRIPLE family ${familyId} ${previous.orbit.label} must use the exact shared triple-local V3 projection`,
            ).toBeCloseTo(
              systemSceneProjectedRadiusAuInSpace(
                previous.motion.semiMajorAxisAu,
                snapshot.scale,
                SystemSceneProjectionSpace.TRIPLE_LOCAL,
              ),
              10,
            );

            expect(
              current.orbit.semiMajorScene,
              `TRIPLE family ${familyId} ${current.orbit.label} must use the exact shared triple-local V3 projection`,
            ).toBeCloseTo(
              systemSceneProjectedRadiusAuInSpace(
                current.motion.semiMajorAxisAu,
                snapshot.scale,
                SystemSceneProjectionSpace.TRIPLE_LOCAL,
              ),
              10,
            );

            expect(
              current.motion.semiMajorAxisAu,
              `TRIPLE family ${familyId} ${current.orbit.label} physical semimajor axis must remain unchanged and ordered`,
            ).toBeGreaterThan(
              previous.motion.semiMajorAxisAu,
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

  return projectSystemSceneMotionContributions(
    body.motionContributions,
    motionId =>
      snapshot.motions.find(
        motion =>
          motion.id ===
          motionId,
      ),
    simulationDay,
    snapshot.scale,
  );
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
