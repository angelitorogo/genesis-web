/** V2.4.2: planetocentric science for laboratory S-type planets A and B.
 * These are distinct V2 identities, never phase-21 MoonLocator or V1 save data.
 */
export interface MultihostScientificMoonV242 {
  readonly version: 'V2_4_2_S_TYPE_MOON';
  readonly id: string;
  readonly hostId: 'A' | 'B';
  readonly hostPlanetId: string;
  readonly hostPlanetOrdinal: number;
  readonly ordinal: number;
  readonly designation: string;
  readonly formationSeedHex: string;
  readonly origin: 'V2_4_2_DETERMINISTIC_SATELLITE_MODEL';
  readonly massEarth: number;
  readonly radiusEarth: number;
  readonly densityGramsPerCubicCentimeter: number;
  readonly surfaceGravityEarth: number;
  readonly semiMajorAxisAu: number;
  readonly semiMajorAxisPlanetRadii: number;
  readonly eccentricity: number;
  readonly inclinationDegrees: number;
  readonly rotationDegrees: number;
  readonly epochMeanAnomalyDegrees: number;
  readonly periodDays: number;
  readonly rocheLimitPlanetRadii: number;
  readonly hillRadiusPlanetRadii: number;
  readonly progradeOuterLimitPlanetRadii: number;
  readonly tidalHeatingIndex01: number;
  readonly locking: 'LIKELY_SYNCHRONOUS' | 'UNDETERMINED';
  readonly environment: Readonly<{
    provenance: 'V2_4_2_REFERENCE_ESTIMATE';
    inferredIceRichnessIndex01: number;
    waterInventoryPotentialIndex01: number;
    subsurfaceOceanPotentialIndex01: number;
    surfaceLiquidWaterPotentialIndex01: number;
    estimatedSurfaceTemperatureKelvin: number | null;
    atmosphereRetentionIndex01: number;
    atmosphereRegime: 'NONE' | 'TRACE' | 'THIN';
    geologyRegime: 'INERT' | 'LOW_ACTIVITY' | 'TIDALLY_ACTIVE';
    waterRegime: 'NONE' | 'SURFACE_ICE' | 'SUBSURFACE_OCEAN' | 'SURFACE_LIQUID';
  }>;
}

export interface MultihostMoonSystemV242 {
  readonly hostPlanetId: string;
  readonly hostId: 'A' | 'B';
  readonly hillRadiusPlanetRadii: number;
  readonly satelliteCapacityIndex01: number;
  /** Estimated entire natural-satellite population, including unresolved minor
   * moons; no identity, mass or orbit is fabricated for the unmaterialized part. */
  readonly estimatedTotalMoonCount: number;
  /** Physically modeled, individually identified relevant moons only. */
  readonly modeledMoonCount: number;
  readonly modeledMoonMassEarth: number;
  readonly moons: readonly MultihostScientificMoonV242[];
}

export interface MultihostScientificMoonCatalogV242 {
  readonly version: 'V2_4_2_MOON_SCIENCE';
  readonly sourceSystemSeed: string;
  readonly systems: readonly MultihostMoonSystemV242[];
  readonly moons: readonly MultihostScientificMoonV242[];
  readonly limitations: readonly string[];
}
