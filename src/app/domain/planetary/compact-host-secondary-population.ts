import { type MinorBodyKindValue } from './minor-body-kind';

/** 31.4g: intrinsic current-time populations, not a reconstructed SN lineage. */
export interface CompactHostMoon {
  readonly parentPlanetOrdinal: number;
  readonly ordinal: number;
  readonly massEarth: number;
  readonly radiusEarth: number;
  readonly densityGramsCm3: number;
  readonly semiMajorAxisAu: number;
  readonly semiMajorAxisPlanetRadii: number;
  readonly eccentricity: number;
  readonly inclinationDegrees: number;
  readonly orbitalPeriodDays: number;
  readonly rocheLimitAu: number;
  readonly hillLimitAu: number;
  readonly waterInventoryIndex01: number;
  readonly iceRichnessIndex01: number;
  readonly tidalHeatingIndex01: number;
  /** Reference estimate, never an observed temperature or known-water evidence. */
  readonly temperatureScenarioK: number | null;
}

export interface CompactHostMinorBody {
  /** Stable 128-bit address compatible with existing minor-body routes. */
  readonly proceduralId: string;
  readonly kind: MinorBodyKindValue;
  readonly ordinal: number;
  readonly diameterKilometers: number;
  readonly bulkDensityGramsCm3: number;
  readonly iceFraction01: number;
  readonly geometricAlbedo01: number;
  readonly semiMajorAxisAu: number;
  readonly eccentricity: number;
  readonly inclinationDegrees: number;
  readonly longitudeNodeDegrees: number;
  readonly orbitalPeriodDays: number;
  readonly periapsisAu: number;
  readonly apoapsisAu: number;
  /** These are population descriptors, not a historical origin claim. */
  readonly orbitFamily: 'INNER_DEBRIS' | 'OUTER_DEBRIS' | 'HIGH_ECCENTRICITY' | 'CAPTURED_CANDIDATE';
}

export interface CompactHostDebrisBelt {
  readonly region: 'INNER' | 'OUTER';
  readonly innerEdgeAu: number;
  readonly outerEdgeAu: number;
  readonly populationIndex01: number;
}

export interface CompactHostSecondaryPopulation {
  readonly version: 'COMPACT_SECONDARIES_31_4G_V1';
  readonly moons: readonly CompactHostMoon[];
  readonly minorBodies: readonly CompactHostMinorBody[];
  readonly debrisBelts: readonly CompactHostDebrisBelt[];
  readonly assessment: 'ROCHE_HILL_AND_PLANET_CLEARANCE_SCREEN_NOT_N_BODY';
}
