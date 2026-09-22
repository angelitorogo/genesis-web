import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';

import { StellarNeutronStar } from '../../domain/stellar/stellar-neutron-star';
import {
  StellarPulsar,
  type StellarPulsarRecyclingEvidence,
} from '../../domain/stellar/stellar-pulsar';

const NORMAL_ACTIVITY_FRACTION = 0.78;
const ORDINARY_MIN_B_GAUSS_PER_PERIOD_SQUARED = 1e11;

/**
 * 27.5 — opt-in deterministic, read-only projection of an EXISTING 27.4 star.
 * Independent SHA-256 domain: zero PRNG draws and no GeneratorVersion changes.
 * The component's ACTUAL private source key distinguishes V2 A/B/C hosts;
 * do not regenerate V2 from a public parent SystemLocator.
 *
 * No recycling evidence => no millisecond pulsar. 27.8 may later supply an
 * independently verified mass-transfer history; we do not synthesize one.
 */
export class StellarPulsarEngine {
  private constructor() {}

  static fromExistingNeutronStar(
    neutronStar: StellarNeutronStar,
    recyclingEvidence: StellarPulsarRecyclingEvidence | null = null,
  ): StellarPulsar | null {
    if (!(neutronStar instanceof StellarNeutronStar)) {
      throw new TypeError('27.5 requires an existing 27.4 neutron-star profile.');
    }
    // Validate evidence BEFORE deriving entropy, even if an ordinary branch
    // would otherwise fail the activity selection.
    if (recyclingEvidence !== null) {
      if (recyclingEvidence.massTransferConfirmed !== true ||
          typeof recyclingEvidence.companionIdentity !== 'string' ||
          !/^[A-Za-z0-9:_-]{1,128}$/.test(recyclingEvidence.companionIdentity) ||
          !Number.isFinite(recyclingEvidence.recyclingAgeBillionYears) ||
          recyclingEvidence.recyclingAgeBillionYears < neutronStar.formationAgeBillionYears ||
          recyclingEvidence.recyclingAgeBillionYears > neutronStar.formationAgeBillionYears +
            neutronStar.ageSinceFormationBillionYears) {
        throw new RangeError('27.5 cannot invent or accept incoherent binary-recycling evidence.');
      }
    }
    const isRecycled = recyclingEvidence !== null;
    const draws = independentDraws(neutronStar, isRecycled ?
      `RECYCLING:${recyclingEvidence.companionIdentity}` : 'ORDINARY');
    if (!isRecycled && draws[0]! >= NORMAL_ACTIVITY_FRACTION) return null;

    const initialPeriod = isRecycled
      ? 0.0025 + draws[1]! * 0.0125
      : 0.045 + draws[1]! * 0.22;
    const fieldTesla = isRecycled
      ? 1e4 * 10 ** draws[2]! // 10^8–10^9 G: recycled, not magnetar
      : 1e7 * 10 ** (draws[2]! * 1.4); // 10^11–~2.5x10^12 G
    const elapsedGyr = isRecycled
      ? neutronStar.formationAgeBillionYears + neutronStar.ageSinceFormationBillionYears -
        recyclingEvidence.recyclingAgeBillionYears
      : neutronStar.ageSinceFormationBillionYears;
    const fieldGauss = fieldTesla * 10_000;
    const dipoleCoefficient = (fieldGauss / 3.2e19) ** 2;
    // Integrate Pdot = K/P at constant B, without pretending to simulate
    // accretion, magnetic evolution, pulse profiles or relativistic plasma.
    const period = Math.sqrt(initialPeriod ** 2 + 2 * dipoleCoefficient *
      elapsedGyr * StellarPulsar.SECONDS_PER_GYR);
    if (!Number.isFinite(period)) return null;
    if (!isRecycled && (period > 30 || fieldGauss / period ** 2 <
      ORDINARY_MIN_B_GAUSS_PER_PERIOD_SQUARED)) return null;
    if (isRecycled && period >= 0.03) return null;

    const magneticInclination = 8 + draws[3]! * 74;
    const lineOfSightInclination = draws[4]! * 180;
    const beamHalfOpening = (isRecycled ? 15 : 5) + draws[5]! * (isRecycled ? 20 : 17);
    return new StellarPulsar(
      neutronStar, isRecycled ? 'MILLISECOND' : 'ORDINARY',
      initialPeriod, period, fieldTesla, magneticInclination,
      lineOfSightInclination, beamHalfOpening, recyclingEvidence,
    );
  }
}

/** Domain-separated bytes of the actual canonical component; no PRNG state. */
function independentDraws(neutronStar: StellarNeutronStar, kind: string): readonly number[] {
  const star = neutronStar.star;
  const seed = [
    'GENESIS-STELLAR-PULSAR-27.5-V1',
    star.generationKey.universeSeed.normalizedValue,
    star.generationKey.generatorVersion.code.toString(10),
    star.locator.galaxyIndex.toString(10),
    star.locator.sectorKey.toString(10),
    star.locator.galacticObjectIndex.toString(10),
    kind,
  ].join(':');
  const bytes = sha256(utf8ToBytes(seed));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return Object.freeze(Array.from({ length: 6 }, (_, i) =>
    view.getUint32(i * 4, false) / 0x1_0000_0000));
}
