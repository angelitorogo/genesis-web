export type StellarNeutronStarFormationChannelName =
  | 'IRON_CORE_COLLAPSE'
  | 'ELECTRON_CAPTURE_COLLAPSE';

/**
 * Point-14.6 coarse evolutionary origin for a NEUTRON_STAR remnant.
 *
 * The contract deliberately models formation origin rather than observational
 * phenotype. Pulsar/magnetar behaviour depends on rotation, magnetic activity
 * and later physical properties, so it remains outside point 14.6 and can be
 * derived by the point-15.4/15.5 contracts without changing this model.
 *
 * Important roadmap boundaries:
 * - no progenitor-mass threshold is encoded here (14.8-14.9 / 15.1);
 * - no radius, temperature, spin period or magnetic field is encoded here;
 * - no pulsar, magnetar or transient-activity classification is encoded here;
 * - binary-only formation channels may be added later if phase 16 requires
 *   them, without changing these V1 codes.
 *
 * Codes are stable GENESIS Web V1 serialization values. Consumers must compare
 * name/code rather than relying on singleton identity across structuredClone
 * boundaries.
 */
export class StellarNeutronStarFormationChannel {

  static readonly IRON_CORE_COLLAPSE =
    new StellarNeutronStarFormationChannel(
      'IRON_CORE_COLLAPSE',
      1,
    );

  static readonly ELECTRON_CAPTURE_COLLAPSE =
    new StellarNeutronStarFormationChannel(
      'ELECTRON_CAPTURE_COLLAPSE',
      2,
    );

  static readonly values:
    readonly StellarNeutronStarFormationChannel[] =
      Object.freeze([
        StellarNeutronStarFormationChannel.IRON_CORE_COLLAPSE,
        StellarNeutronStarFormationChannel.ELECTRON_CAPTURE_COLLAPSE,
      ]);

  private constructor(
    readonly name:
      StellarNeutronStarFormationChannelName,

    readonly code:
      number,
  ) {}

  static fromCodeOrNull(
    code:
      number,
  ): StellarNeutronStarFormationChannel | null {

    return (
      StellarNeutronStarFormationChannel.values
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
  ): StellarNeutronStarFormationChannel {

    const value =
      StellarNeutronStarFormationChannel
        .fromCodeOrNull(
          code,
        );

    if (
      value ===
        null
    ) {
      throw new RangeError(
        `Unknown StellarNeutronStarFormationChannel code: ${code}.`,
      );
    }

    return value;
  }
}
