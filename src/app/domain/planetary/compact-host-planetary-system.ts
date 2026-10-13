import { type CompactHostSecondaryPopulation } from './compact-host-secondary-population';
import { type CompactHostPlanetCharacterization } from './compact-host-planet-characterization';
import { BodyLocator } from '../generation/procedural-locator';
import { type CompactPlanetaryHost } from '../stellar/compact-planetary-host';
import { type CompactHostPlanetEnvironment } from './compact-host-planetary-environment';

/**
 * 31.2 — Intrinsic V2 SINGLE compact-host planetary snapshot.
 * Deliberately NOT a phase-18 Planet: its source has no conventional stellar
 * photosphere, protoplanetary formation history, HZ, climate or atmosphere.
 * Planetary science and visual public routing are separate stages (31.3/31.4).
 */
export type CompactPlanetBulkKind = 'ROCKY' | 'SUPER_EARTH';

export interface CompactHostPlanet {
  readonly locator: BodyLocator;
  readonly ordinal: number;
  readonly bulkKind: CompactPlanetBulkKind;
  readonly massEarth: number;
  readonly radiusEarth: number;
  readonly meanDensityKgM3: number;
  readonly semiMajorAxisAu: number;
  readonly eccentricity: number;
  readonly periastronAu: number;
  readonly apoastronAu: number;
  readonly orbitalPeriodDays: number;
  /** Tidal disruption screen; not a claim of validated long-term stability. */
  readonly rocheLimitAu: number;
}

export interface CompactHostPlanetarySystem {
  readonly modelVersion: 'COMPACT_HOST_SNAPSHOT_31_2_V1';
  readonly host: CompactPlanetaryHost;
  readonly planets: readonly CompactHostPlanet[];
  /** Environmental projections, not new physical planet classes. */
  readonly environments: readonly CompactHostPlanetEnvironment[];
  /** 31.4f deterministic intrinsic priors and conditional climate/atmosphere. */
  readonly characterizations: readonly CompactHostPlanetCharacterization[];
  /** 31.4g: independently seeded, Roche/Hill-screened secondary population. */
  readonly secondaries: CompactHostSecondaryPopulation;
  readonly architecture: 'SINGLE';
  readonly orbitalAssessment: 'KEPLER_ROCHE_MUTUAL_HILL_SCREEN';
  /** This is intrinsic simulated data; NO historical origin is asserted. */
  readonly status: 'SNAPSHOT_MODEL_UNVALIDATED_N_BODY';
}
