/** V2.4.3 circumstellar inventory: distinct V2 identities, never V1 save locators.
 * Catalogues are read-only scientific reference models, not discoveries or
 * phase-22 V1 entities. Population estimates never imply individual orbits. */
export type MultihostMinorHostV243 = 'A' | 'B';
export type MultihostAsteroidCompositionV243 =
  'CARBONACEOUS' | 'SILICACEOUS' | 'METALLIC' | 'ICE_RICH' | 'MIXED_ROCK_ICE';

export interface MultihostScientificBeltV243 {
  readonly version: 'V2_4_3_S_TYPE_BELT';
  readonly id: string;
  readonly hostId: MultihostMinorHostV243;
  readonly region: 'INNER' | 'OUTER';
  readonly innerEdgeAu: number;
  readonly outerEdgeAu: number;
  readonly peakAu: number;
  readonly massEarth: number;
  readonly estimatedPopulation: number;
  readonly populationIndex01: number;
  readonly composition: MultihostAsteroidCompositionV243;
  readonly source: 'V2_4_3_RESIDUAL_SOLIDS_REFERENCE';
}

/** Only a cold annulus inside the same star's S-type stable frontier may
 * supply native comets. No independent Oort cloud or circumbinary source is
 * inferred for A or B from their circumstellar disk. */
export interface MultihostCometReservoirV243 {
  readonly id: string;
  readonly hostId: MultihostMinorHostV243;
  readonly innerEdgeAu: number;
  readonly outerEdgeAu: number;
  readonly snowLineAu: number;
  readonly source: 'V2_4_3_COLD_S_TYPE_REFERENCE';
}

export type MultihostCometOrbitClassV243 = 'RESERVOIR_BOUND' | 'INBOUND_VISITOR';

export interface MultihostScientificMinorBodyV243 {
  readonly version: 'V2_4_3_S_TYPE_MINOR_BODY';
  readonly id: string;
  readonly formationSeedHex: string;
  readonly hostId: MultihostMinorHostV243;
  readonly kind: 'ASTEROID' | 'COMET';
  readonly ordinal: number;
  readonly designation: string;
  readonly beltId: string | null;
  /** Comets ONLY: source reservoir and reference orbit class, not N-body history. */
  readonly cometReservoirId?: string;
  readonly cometOrbitClass?: MultihostCometOrbitClassV243;
  readonly crossesPlanetaryRadialEnvelope?: boolean;
  readonly semiMajorAxisAu: number;
  readonly eccentricity: number;
  readonly periapsisAu: number;
  readonly apoapsisAu: number;
  readonly periodDays: number;
  readonly inclinationDegrees: number;
  readonly rotationDegrees: number;
  /** V1 comet Ω/ω orientation; absent only on non-comet minor bodies. */
  readonly longitudeAscendingNodeDegrees?: number;
  readonly argumentOfPeriapsisDegrees?: number;
  readonly epochMeanAnomalyDegrees: number;
  readonly diameterKilometers: number;
  readonly massEarth: number;
  readonly densityGramsPerCubicCentimeter: number;
  readonly porosityIndex01: number;
  readonly geometricAlbedo01: number;
  readonly composition: MultihostAsteroidCompositionV243;
  readonly structure: 'COHERENT' | 'FRACTURED' | 'RUBBLE_PILE';
  readonly iceFraction01: number;
  readonly dustFraction01: number;
  readonly volatileRichnessIndex01: number;
  readonly source: 'V2_4_3_DETERMINISTIC_RESIDUAL_FORMATION';
}

export interface MultihostMinorHostInventoryV243 {
  readonly hostId: MultihostMinorHostV243;
  readonly remainingSolidsEarth: number;
  readonly allocatedBeltMassEarth: number;
  readonly allocatedCometReservoirEarth: number;
  /** null when the S-type stable window cannot hold a genuinely cold annulus. */
  readonly cometReservoir: MultihostCometReservoirV243 | null;
  readonly modeledAsteroidMassEarth: number;
  readonly modeledCometMassEarth: number;
  readonly estimatedAsteroidPopulation: number;
  readonly estimatedCometPopulation: number;
  readonly belts: readonly MultihostScientificBeltV243[];
  readonly bodies: readonly MultihostScientificMinorBodyV243[];
}

export interface MultihostScientificMinorBodyCatalogV243 {
  readonly version: 'V2_4_3_MINOR_BODY_SCIENCE';
  readonly sourceSystemSeed: string;
  readonly hosts: readonly MultihostMinorHostInventoryV243[];
  readonly belts: readonly MultihostScientificBeltV243[];
  readonly bodies: readonly MultihostScientificMinorBodyV243[];
  readonly limitations: readonly string[];
}
