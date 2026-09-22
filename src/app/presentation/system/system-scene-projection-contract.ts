import {
  type SystemSceneBodySnapshot,
  type SystemSceneMinorBodySnapshot,
  type SystemSceneMoonSnapshot,
  type SystemSceneMotionContributionSnapshot,
  type SystemSceneSnapshot,
} from './system-scene-snapshot';

import {
  systemSceneProjectedRadiusAuInSpace,
} from './system-scene-scale-projection';

export const SYSTEM_SCENE_PROJECTION_AUTHORITY =
  Object.freeze({
    authoritativePhysicsSource:
      'DOMAIN_SNAPSHOT' as const,
    sceneRole:
      'READ_ONLY_VISUAL_PROJECTION' as const,
    allowsPhysicsWriteBack:
      false as const,
    allowsGroundTruthMutation:
      false as const,
  });

type SystemSceneBodyProjectionSnapshot =
  | SystemSceneBodySnapshot
  | SystemSceneMoonSnapshot
  | SystemSceneMinorBodySnapshot;

/**
 * Point-24.10 runtime boundary for the real Three.js renderer.
 *
 * SystemScene accepts only the immutable projection assembled before Three.js
 * is entered. This deliberately fails fast if a future caller tries to hand
 * the renderer a mutable physics/state object and therefore makes accidental
 * scene -> domain authority creep observable in tests instead of silently
 * permitting it.
 */
export function assertSystemSceneProjectionSnapshot(
  snapshot:
    SystemSceneSnapshot,
): void {

  assertFrozen(
    snapshot,
    'snapshot',
  );
  assertFrozen(
    snapshot.address,
    'snapshot.address',
  );

  assertFrozenArray(
    snapshot.stars,
    'snapshot.stars',
    assertBodyProjection,
  );
  assertFrozenArray(
    snapshot.planets,
    'snapshot.planets',
    assertBodyProjection,
  );
  if (snapshot.pulsarPlanetVisuals !== undefined) {
    assertFrozenArray(snapshot.pulsarPlanetVisuals, 'snapshot.pulsarPlanetVisuals', assertBodyProjection);
  }
  assertFrozenArray(
    snapshot.moons,
    'snapshot.moons',
    assertBodyProjection,
  );
  assertFrozenArray(
    snapshot.minorBodies,
    'snapshot.minorBodies',
    assertBodyProjection,
  );

  if (
    snapshot.asteroidBelts !==
      undefined
  ) {
    assertFrozenArray(
      snapshot.asteroidBelts,
      'snapshot.asteroidBelts',
      (
        belt,
        label,
      ) => {
        assertFrozen(
          belt,
          label,
        );
        assertMotionContributions(
          belt.anchorMotionContributions,
          `${label}.anchorMotionContributions`,
        );
      },
    );
  }

  if (snapshot.habitableZones !== undefined) {
    assertFrozenArray(
      snapshot.habitableZones,
      'snapshot.habitableZones',
      (zone, label) => {
        assertFrozen(zone, label);
        assertMotionContributions(
          zone.anchorMotionContributions,
          `${label}.anchorMotionContributions`,
        );
      },
    );
  }

  assertFrozenArray(
    snapshot.orbits,
    'snapshot.orbits',
    (
      orbit,
      label,
    ) => {
      assertFrozen(
        orbit,
        label,
      );
      assertMotionContributions(
        orbit.anchorMotionContributions,
        `${label}.anchorMotionContributions`,
      );

      if (
        orbit.postProjectionScale !==
          undefined &&
        (
          !Number.isFinite(
            orbit.postProjectionScale,
          ) ||
          orbit.postProjectionScale <=
            0 ||
          orbit.postProjectionScale >
            1 +
              1e-9
        )
      ) {
        throw new RangeError(
          `${label}.postProjectionScale must be finite in (0, 1].`,
        );
      }
    },
  );

  assertFrozenArray(
    snapshot.motions,
    'snapshot.motions',
    (
      motion,
      label,
    ) => {
      assertFrozen(
        motion,
        label,
      );
    },
  );

  assertFrozenArray(
    snapshot.orbitalRiskTargets,
    'snapshot.orbitalRiskTargets',
    (
      target,
      label,
    ) => {
      assertFrozen(
        target,
        label,
      );
    },
  );

  assertFrozen(
    snapshot.layers,
    'snapshot.layers',
  );
  assertFrozen(
    snapshot.simulation,
    'snapshot.simulation',
  );
  assertFrozen(
    snapshot.scale,
    'snapshot.scale',
  );

  if (
    snapshot.hostVisualEnvelope !==
      undefined &&
    snapshot.hostVisualEnvelope !==
      null
  ) {
    assertFrozen(
      snapshot.hostVisualEnvelope,
      'snapshot.hostVisualEnvelope',
    );
    assertFrozenArray(
      snapshot.hostVisualEnvelope.stars,
      'snapshot.hostVisualEnvelope.stars',
      (
        star,
        label,
      ) => {
        assertFrozen(
          star,
          label,
        );
      },
    );
  }

  if (
    snapshot.multistellarPresentation !==
      undefined &&
    snapshot.multistellarPresentation !==
      null
  ) {
    assertFrozen(
      snapshot.multistellarPresentation,
      'snapshot.multistellarPresentation',
    );
    assertFrozenArray(
      snapshot.multistellarPresentation.stars,
      'snapshot.multistellarPresentation.stars',
      (
        star,
        label,
      ) => {
        assertFrozen(
          star,
          label,
        );
      },
    );

    const primary =
      snapshot.multistellarPresentation.stars.find(
        star =>
          star.label ===
          'A',
      );
    const secondary =
      snapshot.multistellarPresentation.stars.find(
        star =>
          star.label ===
          'B',
      );

    if (
      primary ===
        undefined ||
      secondary ===
        undefined ||
      primary.radiusScene +
        secondary.radiusScene >
        snapshot.multistellarPresentation
          .innerPairMinimumCenterSeparationScene +
          1e-9
    ) {
      throw new RangeError(
        'SystemScene V4 multistellar photospheres must remain separated at the inner-pair periapsis.',
      );
    }

    if (
      snapshot.multistellarPresentation
        .architecture ===
        'TRIPLE'
    ) {
      const tertiary =
        snapshot.multistellarPresentation.stars.find(
          star =>
            star.label ===
            'C',
        );

      const tertiaryMinimumSeparation =
        snapshot.multistellarPresentation
          .tertiaryMinimumCenterSeparationToInnerStarScene;

      if (
        tertiary ===
          undefined ||
        tertiaryMinimumSeparation ===
          null ||
        Math.max(
          primary.radiusScene,
          secondary.radiusScene,
        ) +
          tertiary.radiusScene >
          tertiaryMinimumSeparation +
            1e-9
      ) {
        throw new RangeError(
          'SystemScene V4 tertiary photosphere must remain separated from the inner stellar pair.',
        );
      }
    }
  }

  if (
    snapshot.multistellarPTypeClearance !==
      undefined &&
    snapshot.multistellarPTypeClearance !==
      null
  ) {
    const pTypeClearance =
      snapshot.multistellarPTypeClearance;

    assertFrozen(
      pTypeClearance,
      'snapshot.multistellarPTypeClearance',
    );

    if (
      !Number.isFinite(
        pTypeClearance.innerPairPresentationScale,
      ) ||
      pTypeClearance.innerPairPresentationScale <=
        0 ||
      pTypeClearance.innerPairPresentationScale >
        1 +
          1e-9
    ) {
      throw new RangeError(
        'SystemScene V5.1 inner-pair presentation scale must be finite in (0, 1].',
      );
    }

    if (
      pTypeClearance.presentationCompressed !==
      (
        pTypeClearance.innerPairPresentationScale <
        1 -
          1e-9
      )
    ) {
      throw new RangeError(
        'SystemScene V5.1 compression flag must match its inner-pair presentation scale.',
      );
    }

    if (
      pTypeClearance.targetStellarCenterEnvelopeScene !==
        null &&
      pTypeClearance.uncompressedStellarCenterEnvelopeScene *
        pTypeClearance.innerPairPresentationScale >
        pTypeClearance.targetStellarCenterEnvelopeScene +
          1e-8
    ) {
      throw new RangeError(
        'SystemScene V5.1 compressed stellar-centre envelope must remain inside its reserved P-type presentation core.',
      );
    }

    if (
      pTypeClearance.consistencyRegime ===
        'CONSISTENT' &&
      (
        pTypeClearance.circumbinaryStabilityInnerEdgeAu ===
          null ||
        pTypeClearance.stellarOuterExcursionAu >=
          pTypeClearance.circumbinaryStabilityInnerEdgeAu -
            1e-9 ||
        (
          pTypeClearance.nearestPlanetPeriapsisAu !==
            null &&
          pTypeClearance.nearestPlanetPeriapsisAu <
            pTypeClearance.circumbinaryStabilityInnerEdgeAu -
              1e-9
        )
      )
    ) {
      throw new RangeError(
        'SystemScene V5.1 CONSISTENT P-type diagnostics must preserve the authoritative AU ordering before presentation compaction.',
      );
    }
  }

  if (
    snapshot.multistellarCoreCompaction !==
      undefined &&
    snapshot.multistellarCoreCompaction !==
      null
  ) {
    const coreCompaction =
      snapshot.multistellarCoreCompaction;

    assertFrozen(
      coreCompaction,
      'snapshot.multistellarCoreCompaction',
    );

    if (
      !Number.isFinite(
        coreCompaction.postProjectionScale,
      ) ||
      coreCompaction.postProjectionScale <=
        0 ||
      coreCompaction.postProjectionScale >
        1 +
          1e-9
    ) {
      throw new RangeError(
        'SystemScene V5.2 post-projection core scale must be finite in (0, 1].',
      );
    }

    if (
      coreCompaction.compressedStellarCenterEnvelopeScene >
        coreCompaction.uncompressedStellarCenterEnvelopeScene +
          1e-9
    ) {
      throw new RangeError(
        'SystemScene V5.2 compressed stellar-centre envelope cannot exceed its uncompressed envelope.',
      );
    }

    if (
      coreCompaction.targetStellarCenterEnvelopeScene !==
        null &&
      (
        !coreCompaction.targetSatisfied ||
        coreCompaction.compressedStellarCenterEnvelopeScene >
          coreCompaction.targetStellarCenterEnvelopeScene +
            1e-8
      )
    ) {
      throw new RangeError(
        'SystemScene V5.2 post-projection stellar core must satisfy the reserved P-type presentation target.',
      );
    }

    if (
      snapshot.multistellarPTypeClearance !==
        undefined &&
      snapshot.multistellarPTypeClearance !==
        null &&
      Math.abs(
        coreCompaction.postProjectionScale -
          snapshot.multistellarPTypeClearance
            .innerPairPresentationScale,
      ) >
        1e-9
    ) {
      throw new RangeError(
        'SystemScene V5.2 post-projection scale must match the V5.1 requested scene-space compaction ratio.',
      );
    }
  }

  // V5.3: validate the immutable *final* projection, not merely a proposed
  // scale factor. The same first-periapsis anchor must reach the actual radial
  // projector used by orbital guides, planet motion, HZ and asteroid belts.
  const firstOrbitAnchor = snapshot.firstOrbitAnchor;
  if (firstOrbitAnchor !== undefined && firstOrbitAnchor !== null) {
    assertFrozen(firstOrbitAnchor, 'snapshot.firstOrbitAnchor');
    if (
      firstOrbitAnchor.applied &&
      firstOrbitAnchor.anchoredPeriapsisScene <=
        firstOrbitAnchor.originalPeriapsisScene
    ) {
      throw new RangeError('SystemScene V5.3 must expand an applied first-orbit anchor.');
    }
    const projectedFirst = systemSceneProjectedRadiusAuInSpace(
      firstOrbitAnchor.nearestPeriapsisAu,
      snapshot.scale,
      firstOrbitAnchor.projectionSpace,
    );
    if (Math.abs(projectedFirst - firstOrbitAnchor.anchoredPeriapsisScene) > 1e-8) {
      throw new RangeError('SystemScene V5.3 first-orbit anchor is not applied to the final radial projector.');
    }
    const v5 = snapshot.stellarOrbitClearance;
    if (v5 !== undefined && v5 !== null &&
      v5.clearanceMode === 'ENFORCED' &&
      v5.actualOpticalClearanceScene !== null &&
      v5.actualOpticalClearanceScene + 1e-9 <
        firstOrbitAnchor.minimumBodyToHaloGapScene +
        firstOrbitAnchor.firstPlanetRadiusScene
    ) {
      throw new RangeError('SystemScene V5.3 first planetary body must clear the host optical envelope by its fixed minimum gap.');
    }
  }

  if (
    snapshot.stellarOrbitClearance !==
      undefined &&
    snapshot.stellarOrbitClearance !==
      null
  ) {
    assertFrozen(
      snapshot.stellarOrbitClearance,
      'snapshot.stellarOrbitClearance',
    );
    assertFrozenArray(
      snapshot.stellarOrbitClearance.stars,
      'snapshot.stellarOrbitClearance.stars',
      (
        star,
        label,
      ) => {
        assertFrozen(
          star,
          label,
        );

        if (
          star.opticalRadiusScene +
            1e-9 <
          star.radiusScene
        ) {
          throw new RangeError(
            'SystemScene V5 optical radius cannot be smaller than its photosphere radius.',
          );
        }
      },
    );

    const clearance =
      snapshot.stellarOrbitClearance;

    if (
      clearance.nearestPlanetPeriapsisRadiusScene !==
        null
    ) {
      if (
        clearance.requestedMinimumClearanceScene ===
          null ||
        clearance.actualOpticalClearanceScene ===
          null
      ) {
        throw new RangeError(
          'SystemScene V5 planetary-periapsis clearance metadata must be complete when a nearest planetary periapsis exists.',
        );
      }

      if (
        clearance.clearanceSatisfied
      ) {
        if (
          clearance.clearanceMode !==
            'ENFORCED' ||
          clearance.geometricOverlapDetected ||
          clearance.hostOpticalEnvelopeRadiusScene +
            clearance.requestedMinimumClearanceScene >
            clearance.nearestPlanetPeriapsisRadiusScene +
              1e-9
        ) {
          throw new RangeError(
            'SystemScene V5 enforced optical clearance must remain outside the nearest visible planetary periapsis.',
          );
        }
      } else if (
        clearance.clearanceMode !==
          'BEST_EFFORT_GEOMETRIC_OVERLAP' ||
        !clearance.geometricOverlapDetected ||
        !clearance.limited
      ) {
        throw new RangeError(
          'SystemScene V5 unresolved radial-envelope overlap must be explicit, best-effort and visually limited instead of aborting the scene.',
        );
      }

      if (
        clearance.hostPhotosphereEnvelopeRadiusScene >
          clearance.hostOpticalEnvelopeRadiusScene +
            1e-9
      ) {
        throw new RangeError(
          'SystemScene V5 photosphere envelope cannot extend beyond its optical envelope.',
        );
      }
    }
  }

  if (
    snapshot.habitableZone !==
      null
  ) {
    assertFrozen(
      snapshot.habitableZone,
      'snapshot.habitableZone',
    );
    assertMotionContributions(
      snapshot.habitableZone
        .anchorMotionContributions,
      'snapshot.habitableZone.anchorMotionContributions',
    );
  }
}

function assertBodyProjection(
  body:
    SystemSceneBodyProjectionSnapshot,

  label:
    string,
): void {

  assertFrozen(
    body,
    label,
  );
  assertFrozen(
    body.position,
    `${label}.position`,
  );

  if (
    body.kind ===
      'minor-body' &&
    body.asteroidPresentation !==
      null
  ) {
    assertFrozen(
      body.asteroidPresentation,
      `${label}.asteroidPresentation`,
    );
  }

  if (
    body.kind ===
      'minor-body' &&
    body.cometPresentation !==
      null
  ) {
    assertFrozen(
      body.cometPresentation,
      `${label}.cometPresentation`,
    );
  }

  if (
    body.kind ===
      'moon'
  ) {
    assertFrozen(
      body.visualPresentation,
      `${label}.visualPresentation`,
    );
  }

  if (
    body.kind !==
      'minor-body'
  ) {
    assertFrozen(
      body.spin,
      `${label}.spin`,
    );

    if (
      body.kind ===
        'planet' &&
      body.surfaceEnvironment !==
        null
    ) {
      assertFrozen(
        body.surfaceEnvironment,
        `${label}.surfaceEnvironment`,
      );
    }


    if (
      body.kind ===
        'planet' &&
      body.giantAtmosphere !==
        null
    ) {
      assertFrozen(
        body.giantAtmosphere,
        `${label}.giantAtmosphere`,
      );
    }

    if (
      body.kind ===
        'planet' &&
      body.specialPresentation !==
        null
    ) {
      assertFrozen(
        body.specialPresentation,
        `${label}.specialPresentation`,
      );
      assertFrozen(
        body.specialPresentation.oblateness,
        `${label}.specialPresentation.oblateness`,
      );
      assertFrozen(
        body.specialPresentation.sourceRarityTraits,
        `${label}.specialPresentation.sourceRarityTraits`,
      );

      if (
        body.specialPresentation.rings !==
          null
      ) {
        assertFrozen(
          body.specialPresentation.rings,
          `${label}.specialPresentation.rings`,
        );
      }
    }
  }

  assertMotionContributions(
    body.motionContributions,
    `${label}.motionContributions`,
  );
}

function assertMotionContributions(
  contributions:
    readonly SystemSceneMotionContributionSnapshot[],

  label:
    string,
): void {

  assertFrozenArray(
    contributions,
    label,
    (
      contribution,
      contributionLabel,
    ) => {
      assertFrozen(
        contribution,
        contributionLabel,
      );

      if (
        contribution.postProjectionScale !==
          undefined &&
        (
          !Number.isFinite(
            contribution.postProjectionScale,
          ) ||
          contribution.postProjectionScale <=
            0 ||
          contribution.postProjectionScale >
            1 +
              1e-9
        )
      ) {
        throw new RangeError(
          `${contributionLabel}.postProjectionScale must be finite in (0, 1].`,
        );
      }
    },
  );
}

function assertFrozenArray<T>(
  values:
    readonly T[],

  label:
    string,

  assertEntry:
    (
      value:
        T,
      entryLabel:
        string,
    ) => void,
): void {

  assertFrozen(
    values,
    label,
  );

  values.forEach(
    (
      value,
      index,
    ) => {
      assertEntry(
        value,
        `${label}[${index}]`,
      );
    },
  );
}

function assertFrozen(
  value:
    object,

  label:
    string,
): void {

  if (
    !Object.isFrozen(
      value,
    )
  ) {
    throw new TypeError(
      `SystemScene point 24.10 requires immutable presentation data: ${label} is mutable.`,
    );
  }
}
