import { type PlanetaryOrbitHabitableZoneRelation } from './planetary-orbit-habitable-zone-relation';
import { type PlanetarySystemHabitableZoneDynamicalRegime } from './planetary-system-habitable-zone-dynamical-regime';
import { type PlanetarySystemHabitableZoneEvolutionRegime } from './planetary-system-habitable-zone-evolution-regime';

/** Phase-18.6/18.7 S-type assessment for separately formed V2 planets.
 * Geometry is exact V1 reference math. Companion bounds are independent
 * conservative geometric limits, not N-body/phase-resolved or climate claims. */
export interface MultihostHabitableHostV244 {
  readonly hostId: 'A' | 'B';
  readonly source: 'V1_18_6_FLUX_V2_1_S_WINDOW';
  readonly referenceLuminositySolar: number;
  readonly radiativeInnerEdgeAu: number;
  readonly radiativeOuterEdgeAu: number;
  readonly dynamicallyHabitableInnerEdgeAu: number | null;
  readonly dynamicallyHabitableOuterEdgeAu: number | null;
  readonly dynamicalOverlapFraction01: number;
  readonly dynamicalRegime: PlanetarySystemHabitableZoneDynamicalRegime;
  readonly stellarEvolutionRegime: PlanetarySystemHabitableZoneEvolutionRegime;
  readonly persistentReferenceCandidate: boolean;
  readonly companionIrradianceAssessment: 'BOUNDED_PER_PLANET' | 'INSUFFICIENT_ORBIT_DATA';
}

export interface MultihostHabitablePlanetV244 {
  readonly planetId: string;
  readonly formationSeedHex: string;
  readonly hostId: 'A' | 'B';
  readonly designation: string;
  readonly radiativeRelation: PlanetaryOrbitHabitableZoneRelation;
  readonly dynamicallyAvailableRelation: PlanetaryOrbitHabitableZoneRelation | null;
  readonly orbitalReferenceCandidate: boolean;
  readonly environmentalReference: 'SOLID_LIQUID_WATER_CANDIDATE' | 'NO_SURFACE' | 'NO_LIQUID_REFERENCE' | 'UNKNOWN';
  /** Strict triangle-inequality bounds across all binary orbital phases. */
  readonly irradiance: Readonly<{
    source: 'V2_4_4_CONSERVATIVE_BINARY_GEOMETRY';
    hostOnlyMinimumSolar: number;
    hostOnlyMaximumSolar: number;
    companionMinimumSolar: number | null;
    companionMaximumSolar: number | null;
    totalMinimumSolar: number | null;
    totalMaximumSolar: number | null;
    status: 'BOUNDED' | 'UNBOUNDED_CLOSE_APPROACH' | 'UNKNOWN_BINARY_ORBIT';
    /** Conservative bounds for Teq / reference greenhouse, NOT a time-resolved climate. */
    equilibriumTemperatureMinKelvin: number | null;
    equilibriumTemperatureMaxKelvin: number | null;
    estimatedSurfaceTemperatureMinKelvin: number | null;
    estimatedSurfaceTemperatureMaxKelvin: number | null;
  }>;
  readonly binaryFluxReferenceRegime: 'WITHIN_V1_FLUX_BOUNDS' | 'OUTSIDE_V1_FLUX_BOUNDS' | 'CROSSES_V1_FLUX_BOUNDS' | 'NOT_ASSESSED';
  readonly limitation: string;
}

export interface MultihostHabitabilityCatalogV244 {
  readonly version: 'V2_4_4_S_TYPE_HABITABILITY';
  readonly sourceSystemSeed: string;
  readonly hosts: readonly MultihostHabitableHostV244[];
  readonly planets: readonly MultihostHabitablePlanetV244[];
  readonly limitations: readonly string[];
}
