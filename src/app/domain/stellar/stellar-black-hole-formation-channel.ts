export type StellarBlackHoleFormationChannelName =
  | 'FALLBACK_CORE_COLLAPSE'
  | 'DIRECT_COLLAPSE';

/**
 * Point-14.7 coarse evolutionary origin for a STELLAR_BLACK_HOLE remnant.
 *
 * This contract models the remnant-formation branch only. It deliberately does
 * not describe an accretion state, event-horizon radius, spin, jet activity or
 * observational black-hole phenotype. Those depend on later stellar physical
 * properties and, where applicable, system/binary context.
 *
 * Important roadmap boundaries:
 * - no progenitor-mass threshold is encoded here (14.8-14.9 / 15.1);
 * - no black-hole mass, radius, spin or temperature is encoded here;
 * - no accretion disk, jet or X-ray activity state is encoded here;
 * - binary-merger formation channels may be added later if phase 16 requires
 *   them, without changing these isolated-star V1 codes;
 * - this is a stellar remnant and is distinct from the galactic-nucleus
 *   SupermassiveBlackHole model.
 *
 * Codes are stable GENESIS Web V1 serialization values. Consumers must compare
 * name/code rather than relying on singleton identity across structuredClone
 * boundaries.
 */
export class StellarBlackHoleFormationChannel {

  static readonly FALLBACK_CORE_COLLAPSE =
    new StellarBlackHoleFormationChannel(
      'FALLBACK_CORE_COLLAPSE',
      1,
    );

  static readonly DIRECT_COLLAPSE =
    new StellarBlackHoleFormationChannel(
      'DIRECT_COLLAPSE',
      2,
    );

  static readonly values:
    readonly StellarBlackHoleFormationChannel[] =
      Object.freeze([
        StellarBlackHoleFormationChannel.FALLBACK_CORE_COLLAPSE,
        StellarBlackHoleFormationChannel.DIRECT_COLLAPSE,
      ]);

  private constructor(
    readonly name:
      StellarBlackHoleFormationChannelName,

    readonly code:
      number,
  ) {}

  static fromCodeOrNull(
    code:
      number,
  ): StellarBlackHoleFormationChannel | null {

    return (
      StellarBlackHoleFormationChannel.values
        .find(
          value =>
            value.code ===
            code,
        ) ??
      null
    );
  }

  static fromCode(
    code:
      number,
  ): StellarBlackHoleFormationChannel {

    const value =
      StellarBlackHoleFormationChannel
        .fromCodeOrNull(
          code,
        );

    if (
      value ===
        null
    ) {
      throw new RangeError(
        `Unknown StellarBlackHoleFormationChannel code: ${code}.`,
      );
    }

    return value;
  }
}
