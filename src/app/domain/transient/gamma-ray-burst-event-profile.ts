import { type GammaRayBurstSourceProfile } from './gamma-ray-burst-source-profile';

export const GammaRayBurstFamily = Object.freeze({
  SHORT_MERGER: 'SHORT_MERGER',
  LONG_COLLAPSAR: 'LONG_COLLAPSAR',
  NO_CLASSICAL_GRB: 'NO_CLASSICAL_GRB',
  UNRESOLVED: 'UNRESOLVED',
} as const);
export type GammaRayBurstFamily =
  typeof GammaRayBurstFamily[keyof typeof GammaRayBurstFamily];

export const GammaRayBurstOutcome = Object.freeze({
  SUCCESSFUL_SHORT_GRB_ENGINE: 'SUCCESSFUL_SHORT_GRB_ENGINE',
  SUCCESSFUL_LONG_GRB_ENGINE: 'SUCCESSFUL_LONG_GRB_ENGINE',
  JET_LAUNCH_UNRESOLVED: 'JET_LAUNCH_UNRESOLVED',
  CHOKED_COLLAPSAR_NO_CLASSICAL_GRB: 'CHOKED_COLLAPSAR_NO_CLASSICAL_GRB',
} as const);
export type GammaRayBurstOutcome =
  typeof GammaRayBurstOutcome[keyof typeof GammaRayBurstOutcome];

export const GammaRayBurstObserverPromptStatus = Object.freeze({
  ON_AXIS_PROMPT_GEOMETRY: 'ON_AXIS_PROMPT_GEOMETRY',
  OFF_AXIS_PROMPT_SUPPRESSED: 'OFF_AXIS_PROMPT_SUPPRESSED',
  ORIENTATION_UNRESOLVED: 'ORIENTATION_UNRESOLVED',
  ENGINE_UNRESOLVED: 'ENGINE_UNRESOLVED',
  NO_CLASSICAL_PROMPT: 'NO_CLASSICAL_PROMPT',
} as const);
export type GammaRayBurstObserverPromptStatus =
  typeof GammaRayBurstObserverPromptStatus[
    keyof typeof GammaRayBurstObserverPromptStatus
  ];

/**
 * 29.7 intrinsic GRB characterization.
 *
 * The class intentionally does not contain an observed T90, E_iso, fluence or
 * flux. Those quantities require redshift/distance plus a radiative model and
 * (for prompt visibility) observer geometry. The laboratory may supply an
 * explicit observer angle only to demonstrate the geometry contract.
 */
export class GammaRayBurstEventProfile {
  constructor(
    readonly source: GammaRayBurstSourceProfile,
    readonly family: GammaRayBurstFamily,
    readonly outcome: GammaRayBurstOutcome,
    readonly stellarBreakoutTimeSeconds: number | null,
    readonly sourceFrameExternalJetActivitySeconds: number | null,
    readonly oneJetSolidAngleSteradians: number | null,
    readonly twoSidedJetSkyFraction: number | null,
    readonly relativisticBeamingHalfAngleDegrees: number | null,
    readonly observerPromptStatus: GammaRayBurstObserverPromptStatus,
    readonly luminosityDistanceParsec: null,
    readonly sourceRedshift: null,
    readonly observedT90Seconds: null,
    readonly isotropicEquivalentGammaEnergyJoules: null,
    readonly observedFluenceJoulesPerSquareMeter: null,
    readonly observedPeakFluxWattsPerSquareMeter: null,
    readonly circumburstDensityPerCubicMeter: null,
    readonly afterglowFluxResolved: null,
  ) {
    for (const [name, value] of Object.entries({
      stellarBreakoutTimeSeconds,
      sourceFrameExternalJetActivitySeconds,
      oneJetSolidAngleSteradians,
      twoSidedJetSkyFraction,
      relativisticBeamingHalfAngleDegrees,
    })) {
      if (value !== null && (!Number.isFinite(value) || value <= 0)) {
        throw new RangeError(`${name} must be finite and > 0 when resolved.`);
      }
    }

    const successful =
      outcome === GammaRayBurstOutcome.SUCCESSFUL_SHORT_GRB_ENGINE ||
      outcome === GammaRayBurstOutcome.SUCCESSFUL_LONG_GRB_ENGINE;

    if (successful) {
      if (
        sourceFrameExternalJetActivitySeconds === null ||
        oneJetSolidAngleSteradians === null ||
        twoSidedJetSkyFraction === null ||
        relativisticBeamingHalfAngleDegrees === null
      ) {
        throw new RangeError(
          'A successful 29.7 GRB engine requires resolved intrinsic jet geometry.',
        );
      }
      if (twoSidedJetSkyFraction > 1) {
        throw new RangeError('twoSidedJetSkyFraction cannot exceed 1.');
      }
    } else if (
      sourceFrameExternalJetActivitySeconds !== null ||
      oneJetSolidAngleSteradians !== null ||
      twoSidedJetSkyFraction !== null ||
      relativisticBeamingHalfAngleDegrees !== null
    ) {
      throw new RangeError(
        '29.7 cannot expose external relativistic-jet observables without a successful jet.',
      );
    }

    if (
      outcome === GammaRayBurstOutcome.SUCCESSFUL_SHORT_GRB_ENGINE &&
      family !== GammaRayBurstFamily.SHORT_MERGER
    ) {
      throw new RangeError('A successful compact-merger GRB must use the short-family channel.');
    }
    if (
      outcome === GammaRayBurstOutcome.SUCCESSFUL_LONG_GRB_ENGINE &&
      family !== GammaRayBurstFamily.LONG_COLLAPSAR
    ) {
      throw new RangeError('A successful collapsar GRB must use the long-family channel.');
    }
    if (
      outcome === GammaRayBurstOutcome.JET_LAUNCH_UNRESOLVED &&
      (family !== GammaRayBurstFamily.UNRESOLVED ||
        observerPromptStatus !== GammaRayBurstObserverPromptStatus.ENGINE_UNRESOLVED)
    ) {
      throw new RangeError('An unresolved jet must keep both GRB family and prompt status unresolved.');
    }
    if (
      outcome === GammaRayBurstOutcome.CHOKED_COLLAPSAR_NO_CLASSICAL_GRB &&
      (family !== GammaRayBurstFamily.NO_CLASSICAL_GRB ||
        observerPromptStatus !== GammaRayBurstObserverPromptStatus.NO_CLASSICAL_PROMPT)
    ) {
      throw new RangeError('A choked collapsar cannot claim a classical prompt GRB.');
    }

    if (
      luminosityDistanceParsec !== null ||
      sourceRedshift !== null ||
      observedT90Seconds !== null ||
      isotropicEquivalentGammaEnergyJoules !== null ||
      observedFluenceJoulesPerSquareMeter !== null ||
      observedPeakFluxWattsPerSquareMeter !== null ||
      circumburstDensityPerCubicMeter !== null ||
      afterglowFluxResolved !== null
    ) {
      throw new RangeError(
        '29.7 cannot synthesize observer-frame energetics, distance/redshift or afterglow microphysics.',
      );
    }
  }

  get progenitorKind() { return this.source.progenitorKind; }
  get engineActivityDurationSeconds() { return this.source.engineActivityDurationSeconds; }
  get jetHalfOpeningAngleDegrees() { return this.source.jetHalfOpeningAngleDegrees; }
  get bulkLorentzFactor() { return this.source.bulkLorentzFactor; }
  get observerAngleToNearestJetAxisDegrees() {
    return this.source.observerAngleToNearestJetAxisDegrees;
  }
}
