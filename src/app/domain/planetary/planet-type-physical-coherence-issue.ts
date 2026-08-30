/**
 * Point-19.7 diagnostics emitted when one frozen planet-type label no longer
 * agrees with its point-19.2 bulk physics and point-19.5 internal composition.
 *
 * These are Ground Truth validation issues, not player-visible discovery states.
 */
export enum PlanetTypePhysicalCoherenceIssue {
  BULK_MASS_RADIUS_DENSITY_MISMATCH =
    'BULK_MASS_RADIUS_DENSITY_MISMATCH',

  ENVELOPE_MASS_FRACTION_MISMATCH =
    'ENVELOPE_MASS_FRACTION_MISMATCH',

  ICE_BEARING_COMPOSITION_MISMATCH =
    'ICE_BEARING_COMPOSITION_MISMATCH',

  TYPE_RULE_MISMATCH =
    'TYPE_RULE_MISMATCH',
}
