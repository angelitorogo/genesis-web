import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';

import { DiscoveryState, type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import {
  ExtremeType,
  extremeTypeDefinition,
  type ExtremeType as ExtremeTypeValue,
} from '../../domain/galactic-object/extreme-object-type';
import { frozenPhysicalSourceKey } from '../../domain/generation/frozen-physical-source-key';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { GalacticObjectLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { ProceduralTargetResolver } from '../regeneration/procedural-target-resolver';
import { ExtremeObjectTypeResolver } from './extreme-object-type-resolver';

export interface GalacticPulsarTimingProfile {
  readonly extremeType: ExtremeTypeValue;
  readonly pulsePeriodSeconds: number;
  readonly pulseFrequencyHz: number;
  readonly pulseWidthSeconds: number;
  readonly dutyCycle01: number;
  readonly referencePhase01: number;
  readonly synchronizationWindowSeconds: number;
  readonly synchronizedPulseCount: number;
}

const DOMAIN = 'GENESIS-GALACTIC-PULSAR-TIMING-28.3-V1';
const UINT32_SCALE = 4_294_967_296;

/**
 * 28.3 — deterministic intrinsic pulse-timing reference for distributed V2
 * extreme objects whose canonical taxonomy explicitly declares pulseTiming.
 *
 * Boundaries:
 * - it never mutates generation or discovery state;
 * - it is hidden until the target is CONFIRMED;
 * - A-H laboratory presets are NOT scientific Ground Truth and are not read;
 * - visual renderer cadence remains independent from this physical period;
 * - no magnetic field, burst energy, jet or binary mass is inferred here.
 */
export class GalacticPulsarTimingProfileEngine {
  private constructor() {}

  static resolveConfirmed(
    generationKey: UniverseGenerationKey,
    locator: GalacticObjectLocator,
    knowledgeState: DiscoveryStateValue,
  ): GalacticPulsarTimingProfile | null {
    if (!(locator instanceof GalacticObjectLocator)) {
      throw new TypeError('28.3 requires a GalacticObjectLocator.');
    }
    if (generationKey.generatorVersion !== GeneratorVersion.V2) {
      return null;
    }
    if (DiscoveryState.fromCode(knowledgeState.code).code < DiscoveryState.CONFIRMED.code) {
      return null;
    }

    const extremeType = ExtremeObjectTypeResolver.resolve(generationKey, locator);
    if (extremeType === null || !extremeTypeDefinition(extremeType).capabilities.pulseTiming) {
      return null;
    }

    const draws = independentDraws(generationKey, locator, extremeType);
    const [minPeriod, maxPeriod] = periodEnvelope(extremeType);
    const pulsePeriodSeconds = roundScientific(logLerp(minPeriod, maxPeriod, draws[0]!));
    const dutyCycle01 = round(0.025 + draws[1]! * dutyCycleSpan(extremeType), 6);
    const pulseWidthSeconds = roundScientific(pulsePeriodSeconds * dutyCycle01);
    const synchronizationWindowSeconds = synchronizationWindow(extremeType);
    const synchronizedPulseCount = Math.max(1, Math.floor(synchronizationWindowSeconds / pulsePeriodSeconds));

    return Object.freeze({
      extremeType,
      pulsePeriodSeconds,
      pulseFrequencyHz: roundScientific(1 / pulsePeriodSeconds),
      pulseWidthSeconds,
      dutyCycle01,
      referencePhase01: round(draws[2]!, 9),
      synchronizationWindowSeconds,
      synchronizedPulseCount,
    });
  }
}

function periodEnvelope(type: ExtremeTypeValue): readonly [number, number] {
  switch (type) {
    case ExtremeType.PULSAR:
      // Mirrors the already-established 27.5 ordinary-pulsar domain envelope.
      return [0.04, 30];
    case ExtremeType.MILLISECOND_PULSAR:
      // Mirrors the already-established 27.5 recycled-pulsar envelope.
      return [0.002, 0.03];
    case ExtremeType.MAGNETAR:
      // Slow high-field rotator reference; magnetic/burst physics stays in 28.4.
      return [1.2, 14];
    case ExtremeType.X_RAY_BINARY_NS:
      // Broad accreting-NS pulse-timing reference without inferring binary masses.
      return [0.01, 300];
    default:
      throw new RangeError(`28.3 does not support pulse timing for ${type}.`);
  }
}

function dutyCycleSpan(type: ExtremeTypeValue): number {
  return type === ExtremeType.MILLISECOND_PULSAR ? 0.15 : 0.10;
}

function synchronizationWindow(type: ExtremeTypeValue): number {
  switch (type) {
    case ExtremeType.MILLISECOND_PULSAR:
      return 30;
    case ExtremeType.X_RAY_BINARY_NS:
      return 600;
    case ExtremeType.MAGNETAR:
      return 300;
    default:
      return 180;
  }
}

function independentDraws(
  generationKey: UniverseGenerationKey,
  locator: GalacticObjectLocator,
  extremeType: ExtremeTypeValue,
): readonly number[] {
  const targetSeed = ProceduralTargetResolver.resolveTargetSeed(
    frozenPhysicalSourceKey(generationKey),
    locator,
  );
  const bytes = sha256(utf8ToBytes([
    DOMAIN,
    targetSeed.normalizedValue,
    extremeType,
  ].join(':')));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return Object.freeze(Array.from({ length: 4 }, (_, index) =>
    view.getUint32(index * 4, false) / UINT32_SCALE));
}

function logLerp(minimum: number, maximum: number, fraction: number): number {
  return Math.exp(Math.log(minimum) + (Math.log(maximum) - Math.log(minimum)) * fraction);
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function roundScientific(value: number): number {
  return Number(value.toPrecision(12));
}
