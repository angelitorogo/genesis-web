import {
  type HistoricalPhotonGeometry,
  type HistoricalTransientEvent,
} from '../../domain/transient/transient-historical-effects-profile';
import {
  GreatStellarFlareEventState,
  type GreatStellarFlareSourceProfile,
} from '../../domain/transient/great-stellar-flare-source-profile';

/**
 * Read-only adapter from the REAL 29.9 model. Even when the flare is explicit,
 * 29.9 does not resolve viewing geometry, event age or a target distance.
 * Callers MUST supply those data; no automatic planetary history is added.
 */
export function historicalEventFromStellarFlare(
  source: GreatStellarFlareSourceProfile,
  context: {
    readonly id: string;
    readonly yearsBeforeReference: number | null;
    readonly emissionGeometry: HistoricalPhotonGeometry;
  },
): HistoricalTransientEvent {
  const explicit = source.eventState === GreatStellarFlareEventState.EXPLICIT_LARGE_FLARE;
  const state = !explicit ? 'STATISTICAL_ONLY' as const :
    context.yearsBeforeReference === null ? 'INTRINSIC_REFERENCE_ONLY' as const :
    'PAST_INTRINSIC_EXPLICIT' as const;
  return {
    id: context.id,
    label: source.sourceLabel,
    family: 'STELLAR_FLARE',
    state,
    yearsBeforeReference: state === 'PAST_INTRINSIC_EXPLICIT' ? context.yearsBeforeReference : null,
    photonEnergyJoules: explicit ? source.flareEnergyJoules : null,
    band: explicit ? 'BOLOMETRIC' : null,
    geometry: context.emissionGeometry,
    sourceDurationSeconds: explicit ? source.sourceFrameDurationSeconds : null,
  };
}
