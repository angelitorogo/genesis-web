/** PRE-33.07b — chemically conservative bounds for the FeO–water redox route.
 * These are physically dimensioned *endmember sensitivities*, not identification
 * of lunar mineralogy, permeability or a proven global chemical power supply.
 */
export const GEOCHEMICAL_FORMATION_SENSITIVITY_PRE3307 =
  'PRE-33.07/V3-FORMATION-MINERAL-TRANSPORT-SENSITIVITY/v1' as const;
export interface GeochemicalFormationSensitivityPRE3307 {
  readonly contract: typeof GEOCHEMICAL_FORMATION_SENSITIVITY_PRE3307;
  readonly route: 'WATER_SILICATE_ALTERATION';
  readonly status: 'NO_LIQUID_SOLVENT'|'NO_REACTIVE_ROCK'|'MISSING_FORMATION_OR_GEOMETRY'|
    'THERMODYNAMIC_DOMAIN_UNRESOLVED'|'CONDITIONAL_CONTACT_UPPER_BOUND'|'DIRECT_CONTACT_ENDMEMBER';
  readonly physicalContact: 'DIRECT'|'ISOLATED_BY_ICE'|'UNIDENTIFIED_SEPARATOR'|'UNKNOWN';
  readonly liquidWaterKilograms: number|null;
  readonly silicateRockKilograms: number|null;
  readonly reactiveFeOAssumedKilograms: number|null;
  readonly possibleReactionExtentMoles: number|null;
  readonly modeledDeltaGJoulesPerMole: number|null;
  readonly assumedUpperReactionRateMolesPerSecond: number|null;
  /** A positive upper scenario is NEVER a resolved chemical source or biologically usable power. */
  readonly conditionalUpperPowerWatts: number|null;
  readonly physicallyResolvedPowerWatts: null;
  readonly lowerBoundPowerWatts: 0;
  readonly assumedTransportFactor01: number|null;
  readonly conservationResidual01: number|null;
  readonly assumptions: readonly string[];
  readonly sourceIds: readonly string[];
}
