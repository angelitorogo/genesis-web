export type StellarEvolutionStateName =
  | 'BROWN_DWARF'
  | 'MAIN_SEQUENCE'
  | 'GIANT'
  | 'SUPERGIANT'
  | 'WHITE_DWARF'
  | 'NEUTRON_STAR'
  | 'STELLAR_BLACK_HOLE';

/**
 * Point-14.1 canonical evolutionary state of the single V1 stellar primary
 * associated with a SystemLocator.
 *
 * Important roadmap boundaries:
 * - this is an evolutionary state, not a spectral class;
 * - M/K/G/F/A/B/O classification belongs to point 14.2;
 * - stellar physical properties and temperature remain outside this model;
 * - the transition rules between states belong to points 14.8-14.9.
 *
 * Numeric codes are a stable GENESIS Web V1 serialization boundary so future
 * generators, persistence adapters and Worker rehydration do not depend on
 * singleton object identity.
 */
export class StellarEvolutionState {

  static readonly BROWN_DWARF =
    new StellarEvolutionState(
      'BROWN_DWARF',
      1,
    );

  static readonly MAIN_SEQUENCE =
    new StellarEvolutionState(
      'MAIN_SEQUENCE',
      2,
    );

  static readonly GIANT =
    new StellarEvolutionState(
      'GIANT',
      3,
    );

  static readonly SUPERGIANT =
    new StellarEvolutionState(
      'SUPERGIANT',
      4,
    );

  static readonly WHITE_DWARF =
    new StellarEvolutionState(
      'WHITE_DWARF',
      5,
    );

  static readonly NEUTRON_STAR =
    new StellarEvolutionState(
      'NEUTRON_STAR',
      6,
    );

  static readonly STELLAR_BLACK_HOLE =
    new StellarEvolutionState(
      'STELLAR_BLACK_HOLE',
      7,
    );

  static readonly values:
    readonly StellarEvolutionState[] =
      Object.freeze([
        StellarEvolutionState.BROWN_DWARF,
        StellarEvolutionState.MAIN_SEQUENCE,
        StellarEvolutionState.GIANT,
        StellarEvolutionState.SUPERGIANT,
        StellarEvolutionState.WHITE_DWARF,
        StellarEvolutionState.NEUTRON_STAR,
        StellarEvolutionState.STELLAR_BLACK_HOLE,
      ]);

  private constructor(
    readonly name:
      StellarEvolutionStateName,

    readonly code:
      number,
  ) {}

  static fromCodeOrNull(
    code:
      number,
  ): StellarEvolutionState | null {

    return (
      StellarEvolutionState.values
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
  ): StellarEvolutionState {

    const value =
      StellarEvolutionState
        .fromCodeOrNull(
          code,
        );

    if (
      value ===
        null
    ) {
      throw new RangeError(
        `Unknown StellarEvolutionState code: ${code}.`,
      );
    }

    return value;
  }
}
