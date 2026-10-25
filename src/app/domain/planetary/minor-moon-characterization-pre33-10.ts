/** PRE-33.10: a moon identity exists independently of physical characterization. */
export interface MinorMoonCharacterizationPRE3310 {
  readonly contract: 'PRE-33.10/V3-DEFERRED-MINOR-MOON/v1';
  readonly identitySeed: string;
  readonly moonOrdinal: number;
  readonly epochYears: number;
  readonly status: 'CONDITIONAL_BOUNDS' | 'OUTSIDE_ORBITAL_DOMAIN';
  /** Hypothetical materialization, not a measured or CT0-certified moon. */
  readonly scenarioMassEarth: number | null;
  readonly scenarioRadiusEarth: number | null;
  readonly scenarioDensityGramsPerCm3: number | null;
  readonly scenarioSemiMajorAxisPlanetRadii: number | null;
  readonly scenarioOrbitalPeriodDays: number | null;
  readonly physicalScenarioBasis: 'CONDITIONAL_SATELLITE_ACCRETION_PRIOR';
  /** @deprecated v1 alias for the scenario's *assumed* mass-prior ceiling, NOT a real upper mass bound. */
  readonly massUpperBoundEarth: number | null;
  /** @deprecated v1 alias for the lower edge of the sampled scenario interval, NOT proven stability. */
  readonly stableOrbitInnerPlanetRadii: number | null;
  /** @deprecated v1 alias for the upper edge of the sampled scenario interval, NOT proven stability. */
  readonly stableOrbitOuterPlanetRadii: number | null;
  /** Conditional allocation prior, not an observational/formation-derived mass constraint. */
  readonly massPriorCeilingEarth: number | null;
  /** Fluid Roche reference using *hypothetical* lunar density: not a measured satellite limit. */
  readonly rocheFluidReferenceInnerPlanetRadii: number | null;
  /** 0.49 times the host Hill radius at periapsis; approximate prograde/circular reference. */
  readonly hillProgradeReferenceOuterPlanetRadii: number | null;
  /** Limits used for the hypothetical orbit draw: no orbital stability certification. */
  readonly samplingInnerPlanetRadii: number | null;
  readonly samplingOuterPlanetRadii: number | null;
  /** Whether 1000 host radii, an algorithmic-only ceiling, clipped that draw. */
  readonly samplingCeilingIsNumerical: boolean | null;
  readonly bulkComposition: 'UNKNOWN';
  readonly atmosphere: 'UNKNOWN';
  readonly water: 'UNKNOWN';
  readonly radiation: 'UNKNOWN';
  readonly geoChemicalPower: 'UNKNOWN';
  readonly historicalContinuity: 'UNKNOWN';
  readonly life: 'NOT_EVALUATED';
  readonly physicalModelResolved: false;
  readonly provenance: 'CANONICAL_MOON_IDENTITY_AND_HOST_BOUNDS';
}
