import {
  type MinorBodyCloseEncounterAssessment,
} from '../../domain/planetary/minor-body-close-encounter-assessment';

import {
  type MinorBodyCloseEncounterCatalog,
} from '../../domain/planetary/minor-body-close-encounter-catalog';

import {
  type MinorBodyImpactRiskCatalog,
} from '../../domain/planetary/minor-body-impact-risk-catalog';

import {
  type MinorBodyOrbitProximityCatalog,
} from '../../domain/planetary/minor-body-orbit-proximity-catalog';

import {
  type MinorBodyTemporalImpactProbabilityCatalog,
} from '../../domain/planetary/minor-body-temporal-impact-probability-catalog';

export const MINOR_BODY_SCIENTIFIC_RISK_WINDOW_YEARS =
  100;

export interface MinorBodyScientificEncounterSource {
  readonly targetKind:
    string;

  readonly targetName:
    string;

  readonly outcomeRegime:
    string;

  readonly closestApproachAu:
    number;

  readonly relativeSpeedKmPerSecond:
    number;

  readonly encounterStrengthIndex01:
    number;

  readonly orbitalChangeOccurred:
    boolean;

  readonly outgoingConicRegime:
    string;

  readonly outgoingSemiMajorAxisAu:
    number;

  readonly outgoingEccentricity:
    number;

  readonly outgoingInclinationDegrees:
    number;
}

export interface MinorBodyScientificRiskTargetSource {
  readonly targetKind:
    string;

  readonly targetName:
    string;

  readonly regime:
    string;

  readonly radialRangesOverlap:
    boolean;

  readonly riskCandidate:
    boolean;

  readonly directCollisionGeometryCandidate:
    boolean;

  readonly orbitalRiskIndex01:
    number;

  readonly orbitalExposureIndex01:
    number;

  readonly minimumNodalSeparationAu:
    number | null;

  readonly targetCorridorRadiusAu:
    number;

  readonly gravitationalFocusingFactor:
    number;

  readonly characteristicRelativeSpeedKmPerSecond:
    number;

  readonly temporalRegime:
    string;

  readonly temporalImpactProbability01:
    number;

  readonly expectedImpactCount:
    number;

  readonly isSinglePassage:
    boolean;
}

export interface MinorBodyScientificDynamicsSource {
  readonly timeWindowYears:
    number;

  readonly assessedTargetCount:
    number;

  readonly radialCrossingTargetCount:
    number;

  readonly approachCorridorTargetCount:
    number;

  readonly resolvedEncounterCount:
    number;

  readonly riskCandidateCount:
    number;

  readonly directCollisionGeometryTargetCount:
    number;

  readonly highestOrbitalRiskIndex01:
    number;

  readonly highestTemporalImpactProbability01:
    number;

  readonly encounter:
    MinorBodyScientificEncounterSource | null;

  readonly relevantTargets:
    readonly MinorBodyScientificRiskTargetSource[];
}

/**
 * Point-26.8 knowledge-safe projection of the already-frozen phase-23
 * dynamics products for one individually addressed minor body.
 *
 * It does not reclassify risk, invent encounters or materialize impacts. The
 * finite-horizon probability remains the exact point-23.8 analytical result
 * supplied by the caller.
 */
export class MinorBodyScientificDynamicsProjectionAssembler {

  private constructor() {}

  static build(
    proximityCatalog:
      MinorBodyOrbitProximityCatalog,

    closeEncounterCatalog:
      MinorBodyCloseEncounterCatalog,

    impactRiskCatalog:
      MinorBodyImpactRiskCatalog,

    temporalImpactCatalog:
      MinorBodyTemporalImpactProbabilityCatalog,

    proceduralId:
      string,
  ): MinorBodyScientificDynamicsSource {

    const proximities =
      proximityCatalog
        .forMinorBody(
          proceduralId,
        );

    const encounters =
      closeEncounterCatalog
        .forMinorBody(
          proceduralId,
        );

    const risks =
      impactRiskCatalog
        .forMinorBody(
          proceduralId,
        );

    const temporal =
      temporalImpactCatalog
        .forMinorBody(
          proceduralId,
        );

    if (
      risks.length !==
      temporal.length
    ) {
      throw new RangeError(
        'Point-26.8 requires one temporal assessment for every risk assessment of the selected minor body.',
      );
    }

    const resolvedEncounter =
      encounters.find(
        assessment =>
          assessment.encounterOccurred,
      ) ??
      null;

    const relevantTargets =
      risks
        .map(
          assessment => {
            const temporalAssessment =
              temporal.find(
                candidate =>
                  candidate.impactRiskAssessment ===
                  assessment,
              );

            if (
              temporalAssessment ===
              undefined
            ) {
              throw new RangeError(
                'Point-26.8 temporal-risk projection lost the exact point-23.7 assessment reference.',
              );
            }

            return Object.freeze({
              targetKind:
                assessment.targetKind.name,
              targetName:
                assessment.targetName,
              regime:
                assessment.regime.name,
              radialRangesOverlap:
                assessment.radialRangesOverlap,
              riskCandidate:
                assessment.riskCandidate,
              directCollisionGeometryCandidate:
                assessment.directCollisionGeometryCandidate,
              orbitalRiskIndex01:
                assessment.orbitalRiskIndex01,
              orbitalExposureIndex01:
                assessment.orbitalExposureIndex01,
              minimumNodalSeparationAu:
                assessment.minimumNodalSeparationAu,
              targetCorridorRadiusAu:
                assessment.targetCorridorRadiusAu,
              gravitationalFocusingFactor:
                assessment.gravitationalFocusingFactor,
              characteristicRelativeSpeedKmPerSecond:
                assessment.characteristicRelativeSpeedKmPerSecond,
              temporalRegime:
                temporalAssessment.regime.name,
              temporalImpactProbability01:
                temporalAssessment.temporalImpactProbability01,
              expectedImpactCount:
                temporalAssessment.expectedImpactCount,
              isSinglePassage:
                temporalAssessment.isSinglePassage,
            } satisfies MinorBodyScientificRiskTargetSource);
          },
        )
        .filter(
          assessment =>
            assessment.radialRangesOverlap ||
            assessment.riskCandidate,
        )
        .sort(
          (
            left,
            right,
          ) =>
            Number(
              right.directCollisionGeometryCandidate,
            ) -
              Number(
                left.directCollisionGeometryCandidate,
              ) ||
            right.temporalImpactProbability01 -
              left.temporalImpactProbability01 ||
            right.orbitalRiskIndex01 -
              left.orbitalRiskIndex01,
        );

    return Object.freeze({
      timeWindowYears:
        temporalImpactCatalog.timeWindowYears,
      assessedTargetCount:
        risks.length,
      radialCrossingTargetCount:
        proximities.filter(
          assessment =>
            assessment.radialRangesOverlap,
        ).length,
      approachCorridorTargetCount:
        proximities.filter(
          assessment =>
            assessment.approachPossible,
        ).length,
      resolvedEncounterCount:
        encounters.filter(
          assessment =>
            assessment.encounterOccurred,
        ).length,
      riskCandidateCount:
        risks.filter(
          assessment =>
            assessment.riskCandidate,
        ).length,
      directCollisionGeometryTargetCount:
        risks.filter(
          assessment =>
            assessment.directCollisionGeometryCandidate,
        ).length,
      highestOrbitalRiskIndex01:
        risks.reduce(
          (
            highest,
            assessment,
          ) =>
            Math.max(
              highest,
              assessment.orbitalRiskIndex01,
            ),
          0,
        ),
      highestTemporalImpactProbability01:
        temporal.reduce(
          (
            highest,
            assessment,
          ) =>
            Math.max(
              highest,
              assessment.temporalImpactProbability01,
            ),
          0,
        ),
      encounter:
        resolvedEncounter ===
          null
          ? null
          : encounterSource(
              resolvedEncounter,
            ),
      relevantTargets:
        Object.freeze([
          ...relevantTargets,
        ]),
    });
  }
}

function encounterSource(
  assessment:
    MinorBodyCloseEncounterAssessment,
): MinorBodyScientificEncounterSource {

  if (
    assessment.closestApproachAu ===
      null ||
    assessment.relativeSpeedKmPerSecond ===
      null
  ) {
    throw new RangeError(
      'Point-26.8 resolved encounters require the frozen point-23.6 closest-approach and relative-speed diagnostics.',
    );
  }

  const targetName =
    assessment.targetMoon
      ?.name ??
    assessment.targetPlanet.name;

  return Object.freeze({
    targetKind:
      assessment.targetKind.name,
    targetName,
    outcomeRegime:
      assessment.outcomeRegime.name,
    closestApproachAu:
      assessment.closestApproachAu,
    relativeSpeedKmPerSecond:
      assessment.relativeSpeedKmPerSecond,
    encounterStrengthIndex01:
      assessment.encounterStrengthIndex01,
    orbitalChangeOccurred:
      assessment.orbitalChangeOccurred,
    outgoingConicRegime:
      assessment.outgoingOrbitalElements.conicRegime.name,
    outgoingSemiMajorAxisAu:
      assessment.outgoingOrbitalElements.semiMajorAxisAu,
    outgoingEccentricity:
      assessment.outgoingOrbitalElements.eccentricity,
    outgoingInclinationDegrees:
      assessment.outgoingOrbitalElements.inclinationDegrees,
  });
}
