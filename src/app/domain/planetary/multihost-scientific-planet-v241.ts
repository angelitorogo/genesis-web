import { type MultihostOrbitalHostId } from './multihost-planetary-catalog';
import { type PlanetType } from './planet-type';
import { type MultihostPlanetEnvironmentV241 } from './multihost-planet-environment-v241';
import { type PlanetSurfaceBaseRegime } from './planet-surface-base-regime';

/** V2.4.1 scientific adapter, NOT a V1 Planet/BodyLocator or a save-schema migration.
 * Physical bulk/orbits remain frozen V2.2. Source-mixture priors are explicitly
 * estimates: V2.2 never generated individual refractory/silicate/ice fractions.
 */
export interface MultihostScientificPlanetV241 {
  readonly version: 'V2_4_1_HOST_PLANET';
  readonly id: string;
  readonly formationSeedHex: string;
  readonly hostId: MultihostOrbitalHostId;
  readonly designation: string;
  readonly source: 'V2_2_FROZEN_BULK_V1_SHARED_CLASSIFICATION';
  readonly physics: Readonly<{
    massEarth: number;
    coreMassEarth: number;
    envelopeMassEarth: number;
    radiusEarth: number;
    densityGramsPerCubicCentimeter: number;
    surfaceGravityEarth: number;
    rotationPeriodHours: number;
    semiMajorAxisAu: number;
    periapsisAu: number;
    apoapsisAu: number;
    periodDays: number;
  }>;
  readonly internalComposition: Readonly<{
    confidence: 'V2_4_1_BULK_DERIVED_PRIOR';
    refractoryRichFraction01: number;
    rockyFraction01: number;
    iceRichFraction01: number;
    volatileRichFraction01: number;
    iceBearingFractionOfSolids01: number;
    metallicCoreMassEarth: number;
    silicateInteriorMassEarth: number;
    condensedIceMassEarth: number;
    volatileRichInteriorMassEarth: number;
    gaseousEnvelopeMassEarth: number;
  }>;
  readonly type: PlanetType;
  /** V1 thermal-reference *appearance candidate*, never an ocean/water finding. */
  readonly referenceAppearanceType: PlanetType;
  readonly appearanceConfidence: 'REFERENCE_ONLY_NO_ATMOSPHERE_OR_COMPANION';
  readonly environment: MultihostPlanetEnvironmentV241;
  readonly formationPath: Readonly<{
    regime: 'IN_SITU' | 'MIGRATION_SCENARIO' | 'UNRESOLVED';
    estimatedBirthAxisAu: number | null;
    sourceSnowLineAu: number | null;
    explanation: string;
  }>;
  readonly referenceMeanInsolationEarth: number | null;
  readonly tidalHeatingProxy: number;
  readonly surface: Readonly<{
    source: 'V1_SHARED_SURFACE_BASE_FROM_V2_PRIORS';
    surfaceRegime: PlanetSurfaceBaseRegime;
    referenceBondAlbedo01: number;
    baseMineralSurfaceFraction01: number;
    baseVolatileBearingSurfaceFraction01: number;
    baseMoltenSurfaceFraction01: number;
    baseDeepEnvelopeSurfaceFraction01: number;
    baseSolidSurfaceRoughness01: number | null;
  }>;
  readonly thermal: Readonly<{
    source: 'V1_EQUILIBRIUM_APPROXIMATION_HOST_ONLY';
    equilibriumTemperatureKelvin: number | null;
    surfaceTemperatureKelvin: number | null;
    atmosphereSurfacePressurePascal: number | null;
    liquidOceanCoverageFraction01: number | null;
    surfaceIceCoverageFraction01: number | null;
    companionIrradianceIncluded: false;
  }>;
}

export interface MultihostScientificPlanetCatalogV241 {
  readonly version: 'V2_4_1_PLANET_SCIENCE';
  readonly sourceSystemSeed: string;
  readonly planets: readonly MultihostScientificPlanetV241[];
  readonly limitations: readonly string[];
}
