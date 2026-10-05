import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';

import { DiscoveryState, type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import { ExtremeType } from '../../domain/galactic-object/extreme-object-type';
import { frozenPhysicalSourceKey } from '../../domain/generation/frozen-physical-source-key';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { GalacticObjectLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { ProceduralTargetResolver } from '../regeneration/procedural-target-resolver';
import { ExtremeObjectTypeResolver } from './extreme-object-type-resolver';
import { GalacticPulsarTimingProfileEngine } from './pulsar-timing-profile-engine';

export type MagnetarBurstActivityRegime = 'QUIET' | 'INTERMITTENT' | 'ACTIVE';

export interface GalacticMagnetarActivityProfile {
  readonly extremeType: typeof ExtremeType.MAGNETAR;
  readonly dipolarMagneticFieldTesla: number;
  readonly periodDerivativeSecondsPerSecond: number;
  readonly characteristicAgeYears: number;
  readonly monitoringWindowSeconds: number;
  readonly detectedBurstCount: number;
  readonly burstActivityRegime: MagnetarBurstActivityRegime;
  readonly strongestBurstDurationSeconds: number | null;
  readonly shortestBurstSeparationSeconds: number | null;
}

const DOMAIN = 'GENESIS-GALACTIC-MAGNETAR-ACTIVITY-28.4-V1';
const UINT32_SCALE = 4_294_967_296;
const SECONDS_PER_YEAR = 31_557_600;

/**
 * 28.4 — deterministic high-field / short-burst reference for a distributed
 * V2 MAGNETAR that is already CONFIRMED.
 *
 * Scientific boundaries:
 * - the field is an exterior dipole estimate, not an interior/crust field;
 * - Pdot is made self-consistent with the 28.3 measured period through the
 *   standard vacuum-dipole B≈3.2e19 sqrt(P Pdot) G reference relation;
 * - short-burst monitoring does not fabricate a giant flare;
 * - renderer A-H parameters are never read as physical Ground Truth;
 * - no discovery state, PD, accretion, jets or hidden nuclear physics changes.
 */
export class GalacticMagnetarActivityProfileEngine {
  private constructor() {}

  static resolveConfirmed(
    generationKey: UniverseGenerationKey,
    locator: GalacticObjectLocator,
    knowledgeState: DiscoveryStateValue,
  ): GalacticMagnetarActivityProfile | null {
    if (!(locator instanceof GalacticObjectLocator)) {
      throw new TypeError('28.4 requires a GalacticObjectLocator.');
    }
    if (generationKey.generatorVersion !== GeneratorVersion.V2) return null;
    if (DiscoveryState.fromCode(knowledgeState.code).code < DiscoveryState.CONFIRMED.code) return null;
    if (ExtremeObjectTypeResolver.resolve(generationKey, locator) !== ExtremeType.MAGNETAR) return null;

    const timing = GalacticPulsarTimingProfileEngine.resolveConfirmed(
      generationKey,
      locator,
      knowledgeState,
    );
    if (timing === null || timing.extremeType !== ExtremeType.MAGNETAR) return null;

    const draws = independentDraws(generationKey, locator);

    // Active distributed magnetars use the established 27.6 high-field scale:
    // 3e9–1e11 T = 3e13–1e15 G. Log spacing avoids overpopulating the top end.
    const dipolarMagneticFieldTesla = roundScientific(logLerp(3e9, 1e11, draws[0]!));
    const fieldGauss = dipolarMagneticFieldTesla * 1e4;
    const periodDerivativeSecondsPerSecond = roundScientific(
      (fieldGauss / 3.2e19) ** 2 / timing.pulsePeriodSeconds,
    );
    const characteristicAgeYears = roundScientific(
      timing.pulsePeriodSeconds /
        (2 * periodDerivativeSecondsPerSecond) /
        SECONDS_PER_YEAR,
    );

    // A fixed six-hour campaign samples ordinary short-burst activity. The
    // rate rises smoothly with high-field strength but may still yield zero
    // detected bursts. No giant-flare event is generated here.
    const monitoringWindowSeconds = 6 * 60 * 60;
    const normalizedField = clamp01(
      (Math.log10(dipolarMagneticFieldTesla) - Math.log10(3e9)) /
        (Math.log10(1e11) - Math.log10(3e9)),
    );
    const burstRatePerHour = 0.015 + 1.35 * normalizedField ** 2.15;
    const expectedBursts = burstRatePerHour * (monitoringWindowSeconds / 3600);
    const detectedBurstCount = Math.max(0, Math.floor(expectedBursts + draws[1]! * 1.4));
    const burstActivityRegime: MagnetarBurstActivityRegime =
      detectedBurstCount === 0
        ? 'QUIET'
        : detectedBurstCount <= 2
          ? 'INTERMITTENT'
          : 'ACTIVE';

    const strongestBurstDurationSeconds = detectedBurstCount === 0
      ? null
      : roundScientific(logLerp(0.018, 0.48, draws[2]!));
    const shortestBurstSeparationSeconds = detectedBurstCount <= 1
      ? null
      : roundScientific(Math.max(
          2,
          monitoringWindowSeconds /
            (detectedBurstCount * (2.2 + draws[3]! * 5.8)),
        ));

    return Object.freeze({
      extremeType: ExtremeType.MAGNETAR,
      dipolarMagneticFieldTesla,
      periodDerivativeSecondsPerSecond,
      characteristicAgeYears,
      monitoringWindowSeconds,
      detectedBurstCount,
      burstActivityRegime,
      strongestBurstDurationSeconds,
      shortestBurstSeparationSeconds,
    });
  }
}

function independentDraws(
  generationKey: UniverseGenerationKey,
  locator: GalacticObjectLocator,
): readonly number[] {
  const targetSeed = ProceduralTargetResolver.resolveTargetSeed(
    frozenPhysicalSourceKey(generationKey),
    locator,
  );
  const bytes = sha256(utf8ToBytes([
    DOMAIN,
    targetSeed.normalizedValue,
    ExtremeType.MAGNETAR,
  ].join(':')));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return Object.freeze(Array.from({ length: 4 }, (_, index) =>
    view.getUint32(index * 4, false) / UINT32_SCALE));
}

function logLerp(minimum: number, maximum: number, fraction: number): number {
  return Math.exp(Math.log(minimum) + (Math.log(maximum) - Math.log(minimum)) * fraction);
}

function roundScientific(value: number): number {
  return Number(value.toPrecision(12));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
