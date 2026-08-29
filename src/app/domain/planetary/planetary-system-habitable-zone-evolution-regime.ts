/**
 * Point-18.6 strength of the stellar-evolution claim attached to a reference
 * habitable-zone geometry.
 *
 * Phase 15 stores zero-age/reference luminosities rather than fully evolved
 * current luminosities. V1 therefore treats a main-sequence host/pair as the
 * only persistent reference candidate; every other stellar state remains a
 * useful REFERENCE_ONLY geometry rather than a present-day climate claim.
 */
export enum PlanetarySystemHabitableZoneEvolutionRegime {
  MAIN_SEQUENCE_HOST =
    'MAIN_SEQUENCE_HOST',

  MAIN_SEQUENCE_INNER_PAIR =
    'MAIN_SEQUENCE_INNER_PAIR',

  REFERENCE_ONLY =
    'REFERENCE_ONLY',
}
