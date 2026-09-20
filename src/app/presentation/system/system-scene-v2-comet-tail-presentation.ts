import {
  type SystemSceneCometActivityPresentationV1,
  type SystemSceneCometPresentationV1,
} from './system-scene-comet-presentation';

const REFERENCE_TEMPERATURE_K = 278.33;
const COMA_START_K = 140;
const DUST_START_K = 170;
const FULL_ACTIVITY_K = 240;

function smoothstep(value: number): number {
  const x = Math.max(0, Math.min(1, value));
  return x * x * (3 - 2 * x);
}

/**
 * V2 only. Actual bolometric stellar irradiation, never the drawn star size,
 * determines a renderer-only equilibrium-temperature approximation. The
 * scientific activity, recorded flux, elements and physical orbital time in
 * `physical` remain completely unchanged. A very distant periapsis can remain
 * dark throughout an entire revolution.
 *
 * `incidentFluxEarth` is the instantaneous sum of all actual stellar sources
 * at the comet's physical AU position; callers without a multihost scene may
 * use the original frozen single-star flux.
 */
export function v2CometReadableActivity(
  comet: SystemSceneCometPresentationV1,
  physical: SystemSceneCometActivityPresentationV1,
  nucleusRadiusScene: number,
  incidentFluxEarth: number = physical.incidentFluxEarth,
): SystemSceneCometActivityPresentationV1 {
  if (!Number.isFinite(incidentFluxEarth) || incidentFluxEarth < 0 ||
      !Number.isFinite(nucleusRadiusScene) || nucleusRadiusScene <= 0) {
    throw new RangeError('V2 comet activity requires nonnegative stellar flux and positive scene radius.');
  }
  const temperature = REFERENCE_TEMPERATURE_K *
    Math.pow(incidentFluxEarth * (1 - comet.geometricAlbedo01), 0.25);
  // No fictitious long-range activity based on proximity to an arbitrary
  // periapsis. Composition controls strength, not whether the star is hot.
  const volatile = Math.max(0, Math.min(1, comet.volatileRichnessIndex01));
  const coma = smoothstep((temperature - COMA_START_K) / (210 - COMA_START_K)) * volatile;
  const tail = smoothstep((temperature - DUST_START_K) /
    (FULL_ACTIVITY_K - DUST_START_K)) * volatile;
  const ion = tail * smoothstep((volatile - 0.28) / 0.3);
  const hasComa = coma > 1e-5;
  const hasDustTail = tail > 1e-5;
  const hasIonTail = ion > 1e-5;
  const length = Math.max(0.19, Math.min(0.92, nucleusRadiusScene * 22));
  const dustLength = length * tail;
  const dustWidth = Math.max(0.025, nucleusRadiusScene * 2.4) * tail;
  const ionLength = length * 1.35 * ion;
  const ionWidth = Math.max(0.013, nucleusRadiusScene * 1.2) * ion;
  const comaScale = 2 + 2.5 * coma;
  return Object.freeze({
    ...physical,
    // The temperature/flux recorded by the domain remains the authoritative
    // original single-host science; the multistar estimate is presentation only.
    hasComa,
    hasDustTail,
    hasIonTail,
    presentationComaRadiusScale: hasComa ? comaScale : 0,
    presentationComaOpacity01: hasComa ? 0.36 * coma : 0,
    presentationComaRadiusScene: hasComa ? nucleusRadiusScene * comaScale : nucleusRadiusScene,
    presentationDustTailLengthRadii: hasDustTail ? dustLength / nucleusRadiusScene : 0,
    presentationDustTailWidthRadii: hasDustTail ? dustWidth / nucleusRadiusScene : 0,
    presentationDustTailOpacity01: hasDustTail ? 0.55 * tail : 0,
    presentationIonTailLengthRadii: hasIonTail ? ionLength / nucleusRadiusScene : 0,
    presentationIonTailWidthRadii: hasIonTail ? ionWidth / nucleusRadiusScene : 0,
    presentationIonTailOpacity01: hasIonTail ? 0.52 * ion : 0,
    presentationDustTailLengthScene: hasDustTail ? dustLength : 0,
    presentationDustTailWidthScene: hasDustTail ? dustWidth : 0,
    presentationIonTailLengthScene: hasIonTail ? ionLength : 0,
    presentationIonTailWidthScene: hasIonTail ? ionWidth : 0,
  });
}
