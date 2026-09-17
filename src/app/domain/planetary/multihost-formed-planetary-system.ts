import {
  type MultihostOrbitalHostId,
  type MultihostOrbitFamily,
  type MultihostStableWindow,
} from './multihost-planetary-catalog';

/** V2.2's own deterministic formation namespace. NEVER a V1 BodyLocator/BodySeed. */
export interface MultihostFormedPlanetV22 {
  readonly id: string;
  readonly formationSeedHex: string;
  readonly origin: 'V2_2_FORMED';
  readonly hostId: MultihostOrbitalHostId;
  readonly family: MultihostOrbitFamily;
  readonly ordinal: number;
  readonly designation: string;
  readonly gravitatingMassSolar: number;
  readonly semiMajorAxisAu: number;
  readonly eccentricity: number;
  readonly periapsisAu: number;
  readonly apoapsisAu: number;
  readonly periodDays: number;
  readonly inclinationDegrees: number;
  readonly rotationDegrees: number;
  readonly epochMeanAnomalyDegrees: number;
  readonly coreMassEarth: number;
  readonly envelopeMassEarth: number;
  readonly massEarth: number;
  readonly radiusEarth: number;
  readonly bulkType: 'ROCKY' | 'ICY' | 'GAS_ENVELOPE';
  /** Optional V2.4.1 binary-laboratory formation provenance; never a saved V1 identity. */
  readonly formationPathV241?: Readonly<{
    regime: 'IN_SITU' | 'MIGRATION_SCENARIO' | 'UNRESOLVED';
    estimatedBirthAxisAu: number | null;
    sourceSnowLineAu: number | null;
    explanation: string;
  }>;
  readonly rotationPeriodHours: number;
}

/** Disk inventory is conserved PER HOST and cannot be reused across A/B/AB. */
export interface MultihostFormationDiskV22 {
  readonly hostId: MultihostOrbitalHostId;
  readonly family: MultihostOrbitFamily;
  readonly status: 'NO_FORMATION' | 'FORMED' | 'NO_USABLE_WINDOW';
  readonly window: MultihostStableWindow;
  readonly diskMassEarth: number;
  readonly initialSolidsEarth: number;
  readonly initialGasEarth: number;
  readonly accretedSolidsEarth: number;
  readonly accretedGasEarth: number;
  readonly remainingSolidsEarth: number;
  readonly remainingGasEarth: number;
  readonly planets: readonly MultihostFormedPlanetV22[];
}

/**
 * Standalone V2.2 formation aggregate (new scientific bodies, not test particles).
 * It is deliberately NOT a persisted V1 PlanetarySystem or a claim that the
 * unfinished V2 planet/climate/moon/HZ pipelines already support multihost.
 */
export interface MultihostFormedPlanetarySystemV22 {
  readonly version: 'V2_2_FORMATION_V1';
  readonly sourceSystemSeed: string;
  readonly disks: readonly MultihostFormationDiskV22[];
  readonly planets: readonly MultihostFormedPlanetV22[];
  readonly limitations: readonly string[];
}
