import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';

import { StellarMagnetar } from '../../domain/stellar/stellar-magnetar';
import { StellarNeutronStar } from '../../domain/stellar/stellar-neutron-star';
import { StellarPulsarEngine } from './stellar-pulsar-engine';

/**
 * 27.6 — optional rare magnetar birth channel of an ALREADY formed remnant.
 * Domain-separated SHA-256 on the real component's private identity: zero
 * PRNG draws, no new objects, no alteration of previous generator versions.
 *
 * The mutually exclusive classification avoids giving the same remnant the
 * low-field ordinary-pulsar profile from 27.5 and a high-field magnetar profile
 * at once. It does not claim that real magnetars cannot emit radio pulses.
 */
export class StellarMagnetarEngine {
  static readonly BIRTH_ELIGIBILITY_FRACTION = 0.012;

  private constructor() {}

  static fromExistingNeutronStar(neutronStar: StellarNeutronStar): StellarMagnetar | null {
    if (!(neutronStar instanceof StellarNeutronStar)) {
      throw new TypeError('27.6 requires an existing 27.4 neutron-star profile.');
    }
    const draws = independentDraws(neutronStar);
    if (draws[0]! >= StellarMagnetarEngine.BIRTH_ELIGIBILITY_FRACTION) return null;
    // Do not contradict the frozen 27.5 low-field classification. Magnetars
    // are selected as an independent, exceptionally rare alternate channel.
    if (StellarPulsarEngine.fromExistingNeutronStar(neutronStar) !== null) return null;

    const birthField = 1e10 * 10 ** draws[1]!; // 10^14–10^15 G
    // High-field magnetars lose their strong dipole faster. Empirical-inspired,
    // not a fitted or measured evolutionary prescription.
    const decayYears = Math.max(1_500, Math.min(12_000,
      12_000 / (birthField / 1e10) ** 1.3));
    const birthPeriod = 0.012 + draws[2]! * 0.065;
    return new StellarMagnetar(neutronStar, birthField, decayYears, birthPeriod);
  }
}

function independentDraws(neutronStar: StellarNeutronStar): readonly number[] {
  const star = neutronStar.star;
  const identity = [
    'GENESIS-STELLAR-MAGNETAR-27.6-V1',
    star.generationKey.universeSeed.normalizedValue,
    star.generationKey.generatorVersion.code.toString(10),
    star.locator.galaxyIndex.toString(10),
    star.locator.sectorKey.toString(10),
    star.locator.galacticObjectIndex.toString(10),
  ].join(':');
  const bytes = sha256(utf8ToBytes(identity));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return Object.freeze(Array.from({ length: 3 }, (_, index) =>
    view.getUint32(index * 4, false) / 0x1_0000_0000));
}
