import type { GeochemistryPRE3307 } from '../../domain/planetary/geochemistry-pre33-07';
import type { RadiationWorldPRE3308 } from '../../domain/planetary/radiation-transport-pre33-08';
import { RadiationTransportEnginePRE3308 } from './radiation-transport-engine-pre33-08';
import { GeochemistryWorldPRE3307 } from './geochemistry-world-pre33-07';
import type { AtmosphereClosurePRE3306 } from '../../domain/planetary/atmosphere-causal-closure-pre33-06';
import { AtmosphereCausalClosureEnginePRE3306 } from './atmosphere-causal-closure-engine-pre33-06';
import { AtmosphereV3FormationEvolutionPRE3306 } from './atmosphere-v3-formation-evolution-pre33-06';
import { PlanetH2OCT0InventoryEnginePRE3303A3 } from './planet-h2o-ct0-inventory-pre33-03a3';
import { PlanetH2OForwardCT0EnginePRE3303A3 } from './planet-h2o-forward-ct0-pre33-03a3';
import { PlanetH2OV3FormationOrigin } from './planet-h2o-v3-formation-origin';
import { PlanetDeepOceanEnvelopeEnginePRE3303B } from './planet-deep-ocean-envelope-pre33-03b';
import type { MaterializedPrimary31Fi3 } from '../planetary-history/planetary-v2-dated-physics-31-f-i-3';
import { PlanetaryHistoricalRuntime31Fi1 } from '../planetary-history/planetary-historical-runtime-31-f-i-1';
import { HabitabilityPhysicalIntegration31Fb,
  type InternalPhysicalHabitability31Fb,
} from './habitability-physical-integration-31-f-b';
import { type MoonInternalWaterAssessment } from '../../domain/planetary/moon-internal-water-assessment';
import type { MoonWaterPhaseInventory32F2a } from '../../domain/planetary/moon-water-phase-inventory-32-f-2a';
import type { MoonInteriorStructure32F2b } from '../../domain/planetary/moon-interior-structure-32-f-2b';
import type { MoonEnergyConfinementPRE3305 } from '../../domain/planetary/moon-energy-confinement-pre33-05';
import type { MoonAtmosphereBalancePRE3306 } from '../../domain/planetary/moon-atmosphere-balance-pre33-06';
import { MoonAtmosphereBalanceEnginePRE3306 } from './moon-atmosphere-balance-engine-pre33-06';
import { MoonEnergyConfinementEnginePRE3305 } from './moon-energy-confinement-engine-pre33-05';
import type { MoonSubsurfaceDomainPRE3304 } from '../../domain/planetary/moon-subsurface-domain-pre33-04';
import { MoonSubsurfaceDomainEnginePRE3304 } from './moon-subsurface-domain-engine-pre33-04';
import type { MoonOceanReality32F2c } from '../../domain/planetary/moon-ocean-reality-32-f-2c';
import type { MoonRadiationProtection32F3 } from '../../domain/planetary/moon-radiation-protection-32-f-3';
import type { MoonGeochemicalEnergy32F4 } from '../../domain/planetary/moon-geochemical-energy-32-f-4';
import { type MoonAtmosphereAssessment } from '../../domain/planetary/moon-atmosphere-assessment';
import {
  BodyLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

import {
  GalaxySectorKeyCodec,
} from '../../domain/sector/galaxy-sector-key-codec';

import {
  GalaxySectorGridGenerator,
} from '../sector/galaxy-sector-grid-generator';

import {
  GalaxySectorStellarDensityGenerator,
} from '../sector/galaxy-sector-stellar-density-generator';

import {
  GalaxySectorStellarPopulationPropertiesGenerator,
} from '../sector/galaxy-sector-stellar-population-properties-generator';

import {
  StellarPopulationProfileGenerator,
} from '../stellar/stellar-population-profile-generator';

import {
  StellarSystemGenerator,
} from '../stellar/stellar-system-generator';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  AtmosphereGenerator,
} from './atmosphere-generator';

import {
  MoonGenerator,
} from './moon-generator';

import {
  PlanetGenerator,
} from './planet-generator';

import {
  PlanetaryFormationMaturationGenerator,
} from './planetary-formation-maturation-generator';

import {
  PlanetarySystemGenerator,
} from './planetary-system-generator';

import {
  ProtoplanetaryFormationSnapshotGenerator,
} from './protoplanetary-formation-snapshot-generator';

export interface PlanetScientificIdentitySource {
  readonly locator:
    BodyLocator;

  readonly planetOrdinal:
    number;

  readonly designation:
    string;

  readonly hostSystemDesignation:
    string;

  readonly orbitTopology:
    PlanetarySystemOrbitTopology;

  readonly hostPlanetCount:
    number;
}

export interface PlanetScientificGasSource {
  readonly gas:
    string;

  readonly moleFraction01:
    number;
}

export interface PlanetScientificRelevantMoonSource {
  readonly designation:
    string;

  readonly moonOrdinal:
    number;

  readonly moonIndex:
    number;

  readonly massEarth:
    number;

  readonly radiusEarth:
    number;

  readonly meanDensityGramsPerCubicCentimeter:
    number;

  readonly surfaceGravityEarth:
    number;

  readonly semiMajorAxisPlanetRadii:
    number;

  readonly semiMajorAxisKilometers:
    number;

  readonly eccentricity:
    number;

  readonly inclinationDegrees:
    number;

  readonly orbitalPeriodDays:
    number;

  readonly rocheLimitPlanetRadii:
    number;

  readonly hillSphereRadiusPlanetRadii:
    number;

  readonly synchronousOrbitPlanetRadii:
    number;

  readonly tidalForcingIndex01:
    number;

  readonly tidalHeatingIndex01:
    number;

  readonly tidalRegime:
    string;

  readonly tidalLockingIndex01:
    number;

  readonly tidalLockingRegime:
    string;

  readonly rotationPeriodHours:
    number;

  readonly migrationRegime:
    string;

  readonly isTidallyLocked:
    boolean;

  readonly referenceMeanInsolationEarth:
    number;

  readonly inferredIceRichnessIndex01:
    number;

  readonly inferredBondAlbedo01:
    number;

  readonly equilibriumTemperatureKelvin:
    number;

  readonly estimatedSurfaceTemperatureKelvin:
    number;

  readonly atmosphereRetentionIndex01:
    number;

  readonly atmosphereRegime:
    string;
  readonly atmosphereAssessment?: MoonAtmosphereAssessment | null;
  readonly internalWaterAssessment?: MoonInternalWaterAssessment | null;
  readonly waterPhaseInventory32F2a?: MoonWaterPhaseInventory32F2a | null;
  readonly interiorStructure32F2b?: MoonInteriorStructure32F2b | null;
  readonly oceanReality32F2c?: MoonOceanReality32F2c | null;
  readonly subsurfaceDomainPRE3304?: MoonSubsurfaceDomainPRE3304 | null;
  readonly energyConfinementPRE3305?: MoonEnergyConfinementPRE3305 | null;
  readonly atmosphereBalancePRE3306?: MoonAtmosphereBalancePRE3306 | null;
  readonly atmosphereClosurePRE3306?: AtmosphereClosurePRE3306 | null;
  readonly geochemistryPRE3307?: GeochemistryPRE3307 | null;
  readonly radiationPRE3308?: RadiationWorldPRE3308 | null;
  readonly radiationProtection32F3?: MoonRadiationProtection32F3 | null;
  readonly geochemicalEnergy32F4?: MoonGeochemicalEnergy32F4 | null;

  readonly waterInventoryIndex01:
    number;

  readonly subsurfaceOceanPotentialIndex01:
    number;

  readonly surfaceLiquidWaterPotentialIndex01:
    number;

  readonly waterRegime:
    string;

  readonly internalHeatRetentionIndex01:
    number;

  readonly geologicalActivityIndex01:
    number;

  readonly geologyRegime:
    string;

  readonly hasAtmosphere:
    boolean;

  readonly hasWater:
    boolean;

  readonly hasSubsurfaceOcean:
    boolean;

  readonly hasSurfaceLiquidWater:
    boolean;

  readonly isGeologicallyActive:
    boolean;

  readonly surfaceTemperatureSupportIndex01:
    number;

  readonly surfaceAtmosphereSupportIndex01:
    number;

  readonly surfaceGravitySupportIndex01:
    number;

  readonly tidalModerationIndex01:
    number;

  readonly subsurfaceEnergySupportIndex01:
    number;

  readonly surfaceHabitabilityIndex01:
    number;

  readonly subsurfaceHabitabilityIndex01:
    number;

  readonly overallHabitabilityIndex01:
    number;

  readonly surfaceHabitabilityCandidate:
    boolean;

  readonly subsurfaceHabitabilityCandidate:
    boolean;

  readonly habitabilityRegime:
    string;

  readonly isPotentiallyHabitable:
    boolean;

  readonly giantHostSpecialization:
    boolean;

  readonly giantMoonOrbitalFamily:
    string;

  readonly giantMoonCompositionRegime:
    string;

  readonly isLargeGiantMoon:
    boolean;

  readonly isTidallyActiveGiantMoon:
    boolean;

  readonly isOceanBearingGiantMoonCandidate:
    boolean;
}

export interface PlanetScientificDetailSource {
  readonly geochemistryPRE3307?: GeochemistryPRE3307 | null;
  readonly radiationPRE3308?: RadiationWorldPRE3308 | null;
  readonly general:
    Readonly<{
      planetType: string;
      massEarth: number;
      radiusEarth: number;
      densityGramsPerCubicCentimeter: number;
      surfaceGravityEarth: number;
      surfaceGravityMetersPerSecondSquared: number;
      rotationPeriodHours: number;
      dayLengthHours: number | null;
      axialTiltDegrees: number;
      isRetrogradeRotation: boolean;
      isTidallySynchronized: boolean;
      referenceBondAlbedo01: number;
      isTypePhysicallyCoherent: boolean;
      metallicCoreMassFraction01: number;
      silicateInteriorMassFraction01: number;
      condensedIceMassFraction01: number;
      volatileRichInteriorMassFraction01: number;
      gaseousEnvelopeMassFraction01: number;
    }>;

  readonly orbit:
    Readonly<{
      semiMajorAxisAu: number;
      eccentricity: number;
      inclinationDegrees: number;
      periastronAu: number;
      apoastronAu: number;
      periodDays: number;
      periodYears: number;
      radiativeHabitableZoneRelation: string;
      dynamicallyAvailableHabitableZoneRelation: string | null;
      referenceMeanInsolationEarth: number;
      tidalHeatingProxy: number;
    }>;

  readonly surface:
    Readonly<{
      surfaceBaseRegime: string;
      hasDefinedSolidSurfaceBase: boolean;
      baseSolidSurfaceRoughness01: number | null;
      waterInventoryIndex01: number;
      waterPhaseRegime: string;
      surfaceWaterRegime: string;
      waterIceFraction01: number | null;
      waterLiquidFraction01: number | null;
      waterVaporFraction01: number | null;
      surfaceIceCoverageFraction01: number | null;
      surfaceLiquidWaterCoverageFraction01: number | null;
      hasPersistentSurfaceLiquidWater: boolean;
      surfaceRadiationRegime: string;
      surfaceRadiationProtectionRegime: string;
      surfaceRadiationExposureIndex01: number | null;
      surfaceRadiationProtectionIndex01: number | null;
      hasEffectiveSurfaceRadiationProtection: boolean;
      /** Diagnostic for a non-converged legacy PRE-33.02 phase, never a certified absence of H2O. */
      pre33WaterPhaseLimitation?: 'NON_CONVERGED_PHASE_MODEL' | null;
      h2oCT0Ledger?: Readonly<{
        status: 'UNRESOLVED_NO_DATED_HISTORY' | 'MODELED_CT0_BALANCE_CONDITIONAL';
        modeledCarrierH2OKilograms: number;
        retainedConditionalKilograms: number | null;
        escapedConditionalKilograms: number | null;
        forwardFormationKilograms: number | null;
        forwardRetainedCT0Kilograms: number | null;
        forwardStatus: string;
        forwardDiskTemperatureKelvin: number | null;
        forwardOriginModel: boolean;
        forwardModelClosed: boolean;
        forwardExternalDeliveryKilograms: number | null;
        forwardEscapedKilograms: number | null;
        forwardBasePressurePascal: number | null;
        forwardDeepShellThicknessMeters: number | null;
        forwardHighPressureIcePossible: boolean | null;
        forwardLiquidLayerThicknessMeters: number | null;
        forwardHistorySource: string | null;
        physicalInventoryCertified: false;
        oceanCertified: false;
      }>;
      deepStructureScenario?: Readonly<{
        status: string;
        layerMinMeters: number | null;
        layerMaxMeters: number | null;
        basePressureMaximumPascal: number | null;
        highPressureIcePossible: boolean | null;
        gaseousEnvelopeMassEarth: number;
        exposedSolidSurface: boolean;
      }>;
    }>;

  readonly atmosphere:
    Readonly<{
      pressureRegime: string;
      retainedPressureRegime: string;
      retainedSurfacePressurePascal: number | null;
      retentionRegime: string;
      atmosphericInventoryRetentionFraction01: number;
      retainedReferenceDensityKilogramsPerCubicMeter: number;
      retainedMeanMolarMassGramsPerMole: number | null;
      greenhouseRegime: string;
      longwaveTrappingFraction01: number;
      isVacuum: boolean;
      isDeepEnvelope: boolean;
      retainedGasComposition: readonly PlanetScientificGasSource[];
      closurePRE3306?: AtmosphereClosurePRE3306 | null;
    }>;

  readonly climate:
    Readonly<{
      equilibriumTemperatureKelvin: number;
      meanSurfaceTemperatureKelvin: number | null;
      greenhouseSurfaceWarmingKelvin: number | null;
      climateStabilityRegime: string;
      climateStabilityIndex01: number | null;
      seasonalTemperatureAmplitudeKelvin: number | null;
      diurnalTemperatureRangeKelvin: number | null;
      minimumSurfaceTemperatureKelvin: number | null;
      maximumSurfaceTemperatureKelvin: number | null;
      heatRedistributionEfficiency01: number;
    }>;

  readonly geology:
    Readonly<{
      geologyRegime: string;
      volcanismRegime: string;
      tectonicRegime: string;
      internalHeatRetentionIndex01: number | null;
      tidalHeatingIndex01: number | null;
      geologicalActivityIndex01: number | null;
      volcanismIndex01: number | null;
      tectonicMobilityIndex01: number | null;
      volatileOutgassingPotential01: number | null;
      surfaceRenewalPotential01: number | null;
      isGeologicallyActive: boolean;
      magneticFieldRegime: string;
      magnetosphereRegime: string;
      dynamoPotentialIndex01: number;
      intrinsicMagneticFieldIndex01: number;
      magnetosphericProtectionIndex01: number;
      hasSustainedDynamo: boolean;
    }>;

  readonly moons:
    Readonly<{
      moonCount: number;
      relevantMoonCount: number;
      unmaterializedMinorMoonCount: number;
      potentiallyHabitableMoonCount: number;
      surfaceHabitabilityCandidateCount: number;
      subsurfaceHabitabilityCandidateCount: number;
      relevantMoons: readonly PlanetScientificRelevantMoonSource[];
      /** PRE-33.10b: V3 canonical identity-only moons, no physical materialization. */
      minorMoonIdentities?: readonly Readonly<{
        designation: string;
        moonIndex: number;
        moonOrdinal: number;
      }>[];
    }>;
}

export interface PlanetScientificResolvedTarget {
  readonly identity:
    PlanetScientificIdentitySource;

  readonly detail:
    PlanetScientificDetailSource;
}

interface Phase18PlanetTarget {
  readonly retainedStellarHistory: MaterializedPrimary31Fi3;
  readonly identity:
    PlanetScientificIdentitySource;

  readonly planetarySystem:
    ReturnType<typeof PlanetarySystemGenerator.generate>;
}

/**
 * Point-26.3/26.4 deterministic resolver for one mature planet.
 *
 * `resolve(...)` preserves the point-26.3 identity-only contract and stops at
 * the frozen phase-18 planetary-system boundary. `resolveDetailed(...)` is the
 * point-26.4 extension: after the caller has enforced the CONFIRMED host-system
 * boundary, it materializes the already-frozen phase-19 Planet plus the phase-20
 * atmosphere/environment aggregate and phase-21 moon system exactly once.
 *
 * The returned detail payload is a safe primitive projection. Domain objects,
 * generation keys and procedural seeds are deliberately not returned to the UI.
 */
export class PlanetScientificTargetResolver {

  // Internal-only memo: attached to an authorized, already-materialized fiche
  // target. A WeakMap never becomes a serializable property of the UI result.
  // No observed evidence or permission is inferred from this CT-0 read model.
  private static readonly internalPhysical31Fb =
    new WeakMap<PlanetScientificResolvedTarget, InternalPhysicalHabitability31Fb>();

  private constructor() {}

  static resolve(
    generationKey:
      UniverseGenerationKey,

    locator:
      BodyLocator,
  ): PlanetScientificIdentitySource | null {

    return resolvePhase18Target(
      generationKey,
      locator,
    )?.identity ??
      null;
  }

  static resolveDetailed(
    generationKey:
      UniverseGenerationKey,

    locator:
      BodyLocator,
  ): PlanetScientificResolvedTarget | null {

    const target =
      resolvePhase18Target(
        generationKey,
        locator,
      );

    if (
      target ===
        null
    ) {
      return null;
    }

    const planet =
      PlanetGenerator
        .generate(
          generationKey,
          target.planetarySystem,
          target.identity.locator,
        );

    const atmosphere =
      AtmosphereGenerator
        .generate(
          generationKey,
          planet,
        );

    const moonSystem =
      MoonGenerator
        .generate(
          generationKey,
          planet,
        );

    return this.projectGenerated(target.identity, planet, atmosphere, moonSystem, target.retainedStellarHistory);
  }

  /**
   * Shared scientific projection of an ALREADY materialized body. Neither the
   * multihost adapter nor this boundary regenerate physical properties.
   * The caller supplies a public identity whose locator can differ from the
   * private source planet locator; the source entities are never exposed.
   */
  static projectGenerated(
    identity: PlanetScientificIdentitySource,
    planet: ReturnType<typeof PlanetGenerator.generate>,
    atmosphere: ReturnType<typeof AtmosphereGenerator.generate>,
    moonSystem: ReturnType<typeof MoonGenerator.generate>,
    retainedStellarHistory?: MaterializedPrimary31Fi3,
    publicHost?: { readonly multiplicity: 'BINARY' | 'TRIPLE';
      readonly component: 'A' | 'B' | 'C' | 'AB' },
    publicGeneratorVersionCode: number = planet.generationKey.generatorVersion.code,
  ): PlanetScientificResolvedTarget {
    if (atmosphere.hostPlanet !== planet || moonSystem.hostPlanet !== planet) {
      throw new Error('Scientific projection must receive one consistent generated planet.');
    }
    // 31.F.b consumes the SAME frozen planet/atmosphere/moon states that
    // 26.4 projects; it does not call any generator or extend the public card.
    const internalHabitability = HabitabilityPhysicalIntegration31Fb.assessMaterialized(
      planet, atmosphere, moonSystem);
    // PRE-33.03's *conditional* water scenarios require a converged phase-20
    // mixture. A non-converged V3 atmosphere is an unresolved scientific
    // submodel, not a reason to hide the already generated planet, its orbit,
    // its moon identities or the rest of the confirmed system. The PRE-33
    // engines themselves remain strict; do not fabricate an H2O budget.
    let deepStructure: ReturnType<typeof PlanetDeepOceanEnvelopeEnginePRE3303B.project> | null = null;
    let ct0Ledger: ReturnType<typeof PlanetH2OCT0InventoryEnginePRE3303A3.project> | null = null;
    let pre33WaterPhaseLimitation: 'NON_CONVERGED_PHASE_MODEL' | null = null;
    try {
      deepStructure = PlanetDeepOceanEnvelopeEnginePRE3303B.project(planet, atmosphere);
      ct0Ledger = PlanetH2OCT0InventoryEnginePRE3303A3.project(
        planet, atmosphere, undefined, undefined, deepStructure);
    } catch (error: unknown) {
      if (publicGeneratorVersionCode !== 3 || !(error instanceof RangeError) ||
          error.message !==
            'PRE-33.03 requires PRE-33.02 coherent pressure/host: NON_CONVERGED_PHASE_MODEL') {
        throw error;
      }
      // Keep all legacy PRE-33.03 water quantities explicitly unavailable.
      deepStructure = null;
      ct0Ledger = null;
      pre33WaterPhaseLimitation = 'NON_CONVERGED_PHASE_MODEL';
    }
    // V3 sources were created at the 17.7 -> 18 handoff, before 19.5.
    // V1/V2 without a registered origin keep their previously frozen projection.
    const originDisk = PlanetH2OV3FormationOrigin.environmentForPlanet(planet, atmosphere);
    const forwardH2O = PlanetH2OForwardCT0EnginePRE3303A3.project(
      planet, atmosphere, originDisk ?? undefined);
    const atmosphereClosurePRE3306 = publicGeneratorVersionCode===3
      ? AtmosphereV3FormationEvolutionPRE3306.planet(planet,atmosphere,
          PlanetH2OV3FormationOrigin.sourceForPlanet(planet))
      : null;
    const planetRadiationPRE3308 = publicGeneratorVersionCode===3
      ? RadiationTransportEnginePRE3308.world({bodyKind:'PLANET',
          hasSolidSurface:deepStructure?.envelope.hasExposedSolidSurface ?? planet.hasDefinedSolidSurfaceBase,
          surfaceGravityEarth:planet.surfaceGravityEarth, atmosphericClosure:atmosphereClosurePRE3306}) : null;
    const planetGeochemistryPRE3307 = publicGeneratorVersionCode===3
      ? GeochemistryWorldPRE3307.planet(planet,atmosphereClosurePRE3306,forwardH2O) : null;
    const projected: PlanetScientificResolvedTarget = Object.freeze({
      identity,
      detail:
        Object.freeze({
          geochemistryPRE3307:planetGeochemistryPRE3307,
          radiationPRE3308:planetRadiationPRE3308,
          general:
            Object.freeze({
              planetType:
                planet.planetType,
              massEarth:
                planet.massEarth,
              radiusEarth:
                planet.radiusEarth,
              densityGramsPerCubicCentimeter:
                planet.densityGramsPerCubicCentimeter,
              surfaceGravityEarth:
                planet.surfaceGravityEarth,
              surfaceGravityMetersPerSecondSquared:
                planet.surfaceGravityMetersPerSecondSquared,
              rotationPeriodHours:
                planet.rotationPeriodHours,
              dayLengthHours:
                planet.dayLengthHours,
              axialTiltDegrees:
                planet.axialTiltDegrees,
              isRetrogradeRotation:
                planet.isRetrogradeRotation,
              isTidallySynchronized:
                planet.isTidallySynchronized,
              referenceBondAlbedo01:
                planet.referenceBondAlbedo01,
              isTypePhysicallyCoherent:
                planet.isTypePhysicallyCoherent,
              metallicCoreMassFraction01:
                planet.internalComposition.metallicCoreMassFraction01,
              silicateInteriorMassFraction01:
                planet.internalComposition.silicateInteriorMassFraction01,
              condensedIceMassFraction01:
                planet.internalComposition.condensedIceMassFraction01,
              volatileRichInteriorMassFraction01:
                planet.internalComposition.volatileRichInteriorMassFraction01,
              gaseousEnvelopeMassFraction01:
                planet.internalComposition.gaseousEnvelopeMassFraction01,
            }),
          orbit:
            Object.freeze({
              semiMajorAxisAu:
                planet.orbit.semiMajorAxisAu,
              eccentricity:
                planet.orbit.eccentricity,
              inclinationDegrees:
                planet.orbit.inclinationDegrees,
              periastronAu:
                planet.orbit.periastronAu,
              apoastronAu:
                planet.orbit.apoastronAu,
              periodDays:
                planet.orbitalPeriod.periodDays,
              periodYears:
                planet.orbitalPeriod.periodYears,
              radiativeHabitableZoneRelation:
                planet.habitableZoneClassification.radiativeRelation,
              dynamicallyAvailableHabitableZoneRelation:
                planet.habitableZoneClassification.dynamicallyAvailableRelation,
              referenceMeanInsolationEarth:
                planet.typeClassification.referenceMeanInsolationEarth,
              tidalHeatingProxy:
                planet.typeClassification.tidalHeatingProxy,
            }),
          surface:
            Object.freeze({
              surfaceBaseRegime:
                planet.surfaceBaseRegime,
              hasDefinedSolidSurfaceBase:
                planet.hasDefinedSolidSurfaceBase,
              baseSolidSurfaceRoughness01:
                planet.baseSolidSurfaceRoughness01,
              waterInventoryIndex01:
                atmosphere.waterInventoryIndex01,
              waterPhaseRegime:
                atmosphere.waterPhaseRegime,
              surfaceWaterRegime:
                atmosphere.surfaceWaterRegime,
              waterIceFraction01:
                atmosphere.waterIceFraction01,
              waterLiquidFraction01:
                atmosphere.waterLiquidFraction01,
              waterVaporFraction01:
                atmosphere.waterVaporFraction01,
              surfaceIceCoverageFraction01:
                atmosphere.surfaceIceCoverageFraction01,
              surfaceLiquidWaterCoverageFraction01:
                atmosphere.surfaceLiquidWaterCoverageFraction01,
              hasPersistentSurfaceLiquidWater:
                atmosphere.hasPersistentSurfaceLiquidWater,
              surfaceRadiationRegime:
                atmosphere.surfaceRadiationRegime,
              surfaceRadiationProtectionRegime:
                atmosphere.surfaceRadiationProtectionRegime,
              surfaceRadiationExposureIndex01:
                atmosphere.surfaceRadiationExposureIndex01,
              surfaceRadiationProtectionIndex01:
                atmosphere.surfaceRadiationProtectionIndex01,
              hasEffectiveSurfaceRadiationProtection:
                atmosphere.hasEffectiveSurfaceRadiationProtection,
              ...(pre33WaterPhaseLimitation === null ? {} : {pre33WaterPhaseLimitation}),
              h2oCT0Ledger: ct0Ledger === null ? undefined : Object.freeze({
                // CT0 forward V3 model supersedes the legacy 19.5-origin
                // reconciliation in the projected status only. The legacy
                // domain result is preserved as a separate reference.
                status: forwardH2O.v3ModelBalanceCertified===true
                  ? 'MODELED_CT0_BALANCE_CONDITIONAL' as const : ct0Ledger.status,
                modeledCarrierH2OKilograms: ct0Ledger.waterKilograms.formationReference,
                retainedConditionalKilograms: forwardH2O.v3ModelBalanceCertified===true
                  ? forwardH2O.waterKilograms.modeledCT0 : ct0Ledger.waterKilograms.retainedCT0,
                escapedConditionalKilograms: forwardH2O.v3ModelBalanceCertified===true
                  ? forwardH2O.waterKilograms.escaped : ct0Ledger.waterKilograms.escaped,
                forwardFormationKilograms: forwardH2O.waterKilograms.modeledFormation,
                forwardRetainedCT0Kilograms: forwardH2O.waterKilograms.modeledCT0,
                forwardStatus: forwardH2O.status,
                forwardDiskTemperatureKelvin: forwardH2O.chemistry.diskTemperatureKelvin,
                forwardOriginModel: forwardH2O.source.chemistry === 'V3_FORMATION_DISK_ELEMENTAL_MODEL',
                forwardModelClosed: forwardH2O.v3ModelBalanceCertified===true,
                forwardExternalDeliveryKilograms: forwardH2O.waterKilograms.externalDelivery,
                forwardEscapedKilograms: forwardH2O.waterKilograms.escaped,
                forwardBasePressurePascal: forwardH2O.deepWater.basePressurePascal,
                forwardDeepShellThicknessMeters: forwardH2O.deepWater.shellThicknessMeters,
                forwardHighPressureIcePossible: forwardH2O.deepWater.highPressureIceDomainPossible,
                forwardLiquidLayerThicknessMeters: forwardH2O.deepWater.liquidLayerThicknessMeters,
                forwardHistorySource: forwardH2O.source.historyId,
                physicalInventoryCertified: ct0Ledger.physicalCT0InventoryCertified,
                oceanCertified: ct0Ledger.oceanExistenceCertified,
              }),
              deepStructureScenario: deepStructure === null ? undefined : Object.freeze({
                status: deepStructure.candidateWaterShell.status,
                layerMinMeters: deepStructure.candidateWaterShell.geometryBracket.length
                  ? Math.min(...deepStructure.candidateWaterShell.geometryBracket.map(g => g.waterLayerThicknessMeters)) : null,
                layerMaxMeters: deepStructure.candidateWaterShell.geometryBracket.length
                  ? Math.max(...deepStructure.candidateWaterShell.geometryBracket.map(g => g.waterLayerThicknessMeters)) : null,
                basePressureMaximumPascal: deepStructure.candidateWaterShell.geometryBracket.length
                  ? Math.max(...deepStructure.candidateWaterShell.geometryBracket.map(g => g.baseOverburdenPascal)) : null,
                highPressureIcePossible: deepStructure.candidateWaterShell.couldReachHighPressureIceDomain,
                gaseousEnvelopeMassEarth: planet.internalComposition.gaseousEnvelopeMassEarth,
                exposedSolidSurface: deepStructure.envelope.hasExposedSolidSurface,
              }),
            }),
          atmosphere:
            Object.freeze({
              closurePRE3306: atmosphereClosurePRE3306,
              pressureRegime:
                atmosphere.pressureRegime,
              retainedPressureRegime:
                atmosphere.retainedPressureRegime,
              retainedSurfacePressurePascal:
                atmosphere.retainedSurfacePressurePascal,
              retentionRegime:
                atmosphere.retentionRegime,
              atmosphericInventoryRetentionFraction01:
                atmosphere.atmosphericInventoryRetentionFraction01,
              retainedReferenceDensityKilogramsPerCubicMeter:
                atmosphere.retainedReferenceDensityKilogramsPerCubicMeter,
              retainedMeanMolarMassGramsPerMole:
                atmosphere.retainedMeanMolarMassGramsPerMole,
              greenhouseRegime:
                atmosphere.greenhouseRegime,
              longwaveTrappingFraction01:
                atmosphere.longwaveTrappingFraction01,
              isVacuum:
                atmosphere.isVacuum,
              isDeepEnvelope:
                atmosphere.isDeepEnvelope,
              retainedGasComposition:
                Object.freeze(
                  atmosphere
                    .retainedGasComposition
                    .map(
                      component =>
                        Object.freeze({
                          gas:
                            component.gas,
                          moleFraction01:
                            component.moleFraction01,
                        }),
                    ),
                ),
            }),
          climate:
            Object.freeze({
              equilibriumTemperatureKelvin:
                atmosphere.equilibriumTemperatureKelvin,
              meanSurfaceTemperatureKelvin:
                atmosphere.meanSurfaceTemperatureKelvin,
              greenhouseSurfaceWarmingKelvin:
                atmosphere.greenhouseSurfaceWarmingKelvin,
              climateStabilityRegime:
                atmosphere.climateStabilityRegime,
              climateStabilityIndex01:
                atmosphere.climateStabilityIndex01,
              seasonalTemperatureAmplitudeKelvin:
                atmosphere.seasonalTemperatureAmplitudeKelvin,
              diurnalTemperatureRangeKelvin:
                atmosphere.diurnalTemperatureRangeKelvin,
              minimumSurfaceTemperatureKelvin:
                atmosphere.minimumSurfaceTemperatureKelvin,
              maximumSurfaceTemperatureKelvin:
                atmosphere.maximumSurfaceTemperatureKelvin,
              heatRedistributionEfficiency01:
                atmosphere.heatRedistributionEfficiency01,
            }),
          geology:
            Object.freeze({
              geologyRegime:
                atmosphere.geologyRegime,
              volcanismRegime:
                atmosphere.volcanismRegime,
              tectonicRegime:
                atmosphere.tectonicRegime,
              internalHeatRetentionIndex01:
                atmosphere.internalHeatRetentionIndex01,
              tidalHeatingIndex01:
                atmosphere.tidalHeatingIndex01,
              geologicalActivityIndex01:
                atmosphere.geologicalActivityIndex01,
              volcanismIndex01:
                atmosphere.volcanismIndex01,
              tectonicMobilityIndex01:
                atmosphere.tectonicMobilityIndex01,
              volatileOutgassingPotential01:
                atmosphere.volatileOutgassingPotential01,
              surfaceRenewalPotential01:
                atmosphere.surfaceRenewalPotential01,
              isGeologicallyActive:
                atmosphere.isGeologicallyActive,
              magneticFieldRegime:
                atmosphere.magneticFieldRegime,
              magnetosphereRegime:
                atmosphere.magnetosphereRegime,
              dynamoPotentialIndex01:
                atmosphere.dynamoPotentialIndex01,
              intrinsicMagneticFieldIndex01:
                atmosphere.intrinsicMagneticFieldIndex01,
              magnetosphericProtectionIndex01:
                atmosphere.magnetosphericProtectionIndex01,
              hasSustainedDynamo:
                atmosphere.hasSustainedDynamo,
            }),
          moons:
            Object.freeze({
              moonCount:
                moonSystem.moonCount,
              relevantMoonCount:
                moonSystem.relevantMoonCount,
              unmaterializedMinorMoonCount:
                moonSystem.unmaterializedMinorMoonCount,
              potentiallyHabitableMoonCount:
                moonSystem.potentiallyHabitableMoonCount,
              surfaceHabitabilityCandidateCount:
                moonSystem.surfaceHabitabilityCandidateCount,
              subsurfaceHabitabilityCandidateCount:
                moonSystem.subsurfaceHabitabilityCandidateCount,
              // PRE-33.10b: only the canonical names and ordinal indices are
              // projected to CONFIRMED V3 fiches. No seed, phase-21 minor
              // physical model, hypothetical orbit, or discovery promotion.
              minorMoonIdentities:
                Object.freeze(publicGeneratorVersionCode === 3
                  ? moonSystem.moonIdentities
                      .slice(moonSystem.relevantMoonCount)
                      .map(identity => Object.freeze({
                        designation: identity.designation.name,
                        moonIndex: identity.moonOrdinal - 1,
                        moonOrdinal: identity.moonOrdinal,
                      }))
                  : []),
              relevantMoons:
                Object.freeze(
                  moonSystem
                    .relevantMoons
                    .map(
                      moon =>
                        Object.freeze({
                          designation:
                            moon.name,
                          moonOrdinal:
                            moon.moonOrdinal,
                          moonIndex:
                            moon.moonOrdinal - 1,
                          massEarth:
                            moon.massEarth,
                          radiusEarth:
                            moon.radiusEarth,
                          meanDensityGramsPerCubicCentimeter:
                            moon.meanDensityGramsPerCubicCentimeter,
                          surfaceGravityEarth:
                            moon.surfaceGravityEarth,
                          semiMajorAxisPlanetRadii:
                            moon.semiMajorAxisPlanetRadii,
                          semiMajorAxisKilometers:
                            moon.orbit.semiMajorAxisKilometers,
                          eccentricity:
                            moon.orbit.eccentricity,
                          inclinationDegrees:
                            moon.orbit.inclinationDegrees,
                          orbitalPeriodDays:
                            moon.orbitalPeriodDays,
                          rocheLimitPlanetRadii:
                            moon.orbit.rocheLimitPlanetRadii,
                          hillSphereRadiusPlanetRadii:
                            moon.orbit.sourceHillSphereRadiusPlanetRadii,
                          synchronousOrbitPlanetRadii:
                            moon.tidalState.synchronousOrbitPlanetRadii,
                          tidalForcingIndex01:
                            moon.tidalState.tidalForcingIndex01,
                          tidalHeatingIndex01:
                            moon.tidalHeatingIndex01,
                          tidalRegime:
                            moon.tidalState.tidalRegime,
                          tidalLockingIndex01:
                            moon.tidalLockingIndex01,
                          tidalLockingRegime:
                            moon.tidalState.tidalLockingRegime,
                          rotationPeriodHours:
                            moon.rotationPeriodHours,
                          migrationRegime:
                            moon.tidalState.migrationRegime,
                          isTidallyLocked:
                            moon.isTidallyLocked,
                          referenceMeanInsolationEarth:
                            moon.environmentState.sourceReferenceMeanInsolationEarth,
                          inferredIceRichnessIndex01:
                            moon.environmentState.inferredIceRichnessIndex01,
                          inferredBondAlbedo01:
                            moon.environmentState.inferredBondAlbedo01,
                          equilibriumTemperatureKelvin:
                            moon.environmentState.equilibriumTemperatureKelvin,
                          estimatedSurfaceTemperatureKelvin:
                            moon.environmentState.estimatedSurfaceTemperatureKelvin,
                          atmosphereRetentionIndex01:
                            moon.environmentState.atmosphereRetentionIndex01,
                          atmosphereRegime:
                            moon.atmosphereRegime,
                          atmosphereAssessment:
                            moon.environmentState.atmosphereAssessment,
                          // PRE-33.06 V3 generates a dated, mass-conserving lunar
                          // scenario from formation volatiles. Unknown species are
                          // kept CONDITIONAL, never promoted to causal/observed.
                          atmosphereClosurePRE3306:
                            publicGeneratorVersionCode===3
                              ? AtmosphereV3FormationEvolutionPRE3306.moon(
                                  moon.physicalProperties,
                                  moon.environmentState.atmosphereAssessment,
                                  moon.formationInventory32F1d??null,planet,
                                  PlanetH2OV3FormationOrigin.sourceForPlanet(planet),
                                  moon.environmentState.equilibriumTemperatureKelvin)
                              : null,
                          atmosphereBalancePRE3306:
                            publicGeneratorVersionCode===3
                              ? MoonAtmosphereBalanceEnginePRE3306.fromMaterialized(
                                  moon.physicalProperties,
                                  moon.environmentState.atmosphereAssessment,
                                ) : null,
                          internalWaterAssessment:
                            moon.environmentState.internalWaterAssessment,
                          waterPhaseInventory32F2a:
                            moon.waterPhaseInventory32F2a,
                          interiorStructure32F2b:
                            moon.interiorStructure32F2b,
                          oceanReality32F2c:
                            moon.oceanReality32F2c,
                          // PRE-33.05 energy is sourced once from the V3 moon's
                          // immutable orbital/structural/CT-0 model, not V1 indices.
                          energyConfinementPRE3305:
                            publicGeneratorVersionCode === 3 &&
                            moon.formationInventory32F1d && moon.interiorStructure32F2b &&
                            moon.oceanReality32F2c
                              ? MoonEnergyConfinementEnginePRE3305.fromMaterialized(
                                  moon.physicalProperties,moon.tidalState,
                                  moon.formationInventory32F1d,moon.interiorStructure32F2b,
                                  moon.oceanReality32F2c,
                                ) : null,
                          // PRE-33.04: derived strictly from already-materialized
                          // lunar physical/CT-0 sources on the public V3 route.
                          // Legacy V1/V2 public fiches remain unchanged.
                          subsurfaceDomainPRE3304:
                            publicGeneratorVersionCode === 3 &&
                            moon.formationInventory32F1d && moon.interiorStructure32F2b &&
                            moon.oceanReality32F2c
                              ? MoonSubsurfaceDomainEnginePRE3304.fromMaterialized(
                                  moon.physicalProperties,
                                  moon.formationInventory32F1d,
                                  moon.interiorStructure32F2b,
                                  moon.oceanReality32F2c,
                                  moon.environmentState.internalWaterAssessment,
                                  MoonEnergyConfinementEnginePRE3305.fromMaterialized(
                                    moon.physicalProperties,moon.tidalState,
                                    moon.formationInventory32F1d,moon.interiorStructure32F2b,
                                    moon.oceanReality32F2c,
                                  ),
                                ) : null,
                          radiationProtection32F3:
                            moon.radiationProtection32F3,
                          radiationPRE3308:publicGeneratorVersionCode===3
                            ? RadiationTransportEnginePRE3308.world({bodyKind:'MOON',
                                hasSolidSurface:true,surfaceGravityEarth:moon.physicalProperties.surfaceGravityEarth,
                                atmosphericClosure:null,lunarReference:moon.radiationProtection32F3}) : null,
                          geochemicalEnergy32F4:
                            moon.geochemicalEnergy32F4,
                          geochemistryPRE3307:publicGeneratorVersionCode===3
                            ? GeochemistryWorldPRE3307.moon(moon.geochemicalEnergy32F4,null,
                                moon.formationInventory32F1d??null,moon.interiorStructure32F2b??null) : null,
                          waterInventoryIndex01:
                            moon.environmentState.waterInventoryIndex01,
                          subsurfaceOceanPotentialIndex01:
                            moon.environmentState.subsurfaceOceanPotentialIndex01,
                          surfaceLiquidWaterPotentialIndex01:
                            moon.environmentState.surfaceLiquidWaterPotentialIndex01,
                          waterRegime:
                            moon.waterRegime,
                          internalHeatRetentionIndex01:
                            moon.environmentState.internalHeatRetentionIndex01,
                          geologicalActivityIndex01:
                            moon.environmentState.geologicalActivityIndex01,
                          geologyRegime:
                            moon.geologyRegime,
                          hasAtmosphere:
                            moon.hasAtmosphere,
                          hasWater:
                            moon.hasWater,
                          hasSubsurfaceOcean:
                            moon.hasSubsurfaceOcean,
                          hasSurfaceLiquidWater:
                            moon.hasSurfaceLiquidWater,
                          isGeologicallyActive:
                            moon.isGeologicallyActive,
                          surfaceTemperatureSupportIndex01:
                            moon.habitabilityState.surfaceTemperatureSupportIndex01,
                          surfaceAtmosphereSupportIndex01:
                            moon.habitabilityState.surfaceAtmosphereSupportIndex01,
                          surfaceGravitySupportIndex01:
                            moon.habitabilityState.surfaceGravitySupportIndex01,
                          tidalModerationIndex01:
                            moon.habitabilityState.tidalModerationIndex01,
                          subsurfaceEnergySupportIndex01:
                            moon.habitabilityState.subsurfaceEnergySupportIndex01,
                          surfaceHabitabilityIndex01:
                            moon.habitabilityState.surfaceHabitabilityIndex01,
                          subsurfaceHabitabilityIndex01:
                            moon.habitabilityState.subsurfaceHabitabilityIndex01,
                          overallHabitabilityIndex01:
                            moon.overallHabitabilityIndex01,
                          surfaceHabitabilityCandidate:
                            moon.supportsPotentialSurfaceHabitability,
                          subsurfaceHabitabilityCandidate:
                            moon.supportsPotentialSubsurfaceHabitability,
                          habitabilityRegime:
                            moon.habitabilityRegime,
                          isPotentiallyHabitable:
                            moon.isPotentiallyHabitable,
                          giantHostSpecialization:
                            moon.hasGiantHostSpecialization,
                          giantMoonOrbitalFamily:
                            moon.giantMoonState.orbitalFamily,
                          giantMoonCompositionRegime:
                            moon.giantMoonState.compositionRegime,
                          isLargeGiantMoon:
                            moon.giantMoonState.isLargeMoon,
                          isTidallyActiveGiantMoon:
                            moon.giantMoonState.isTidallyActive,
                          isOceanBearingGiantMoonCandidate:
                            moon.giantMoonState.isOceanBearingCandidate,
                        }),
                    ),
                ),
            }),
        }),
    });
    this.internalPhysical31Fb.set(projected, internalHabitability);
    // 31.F.i.1: private, real 32.6 current-history handoff. No dated forcing
    // exists in this 19/20/21 materialization, so 31.7 cannot claim past climate.
    PlanetaryHistoricalRuntime31Fi1.attach(projected, planet, atmosphere, moonSystem, retainedStellarHistory, publicHost);
    return projected;
  }
}

function resolvePhase18Target(
  generationKey:
    UniverseGenerationKey,

  locator:
    BodyLocator,
): Phase18PlanetTarget | null {

  const systemLocator =
    new SystemLocator(
      locator.galaxyIndex,
      locator.sectorKey,
      locator.galacticObjectIndex,
    );

  const galaxy =
    GalaxyGenerator.generate(
      generationKey,
      systemLocator.galaxyIndex,
    );

  const grid =
    GalaxySectorGridGenerator
      .generate(
        galaxy,
      );

  const stellarDensity =
    GalaxySectorStellarDensityGenerator
      .generate(
        galaxy,
        grid,
        GalaxySectorKeyCodec
          .decode(
            systemLocator.sectorKey,
          ),
      );

  const stellarPopulation =
    GalaxySectorStellarPopulationPropertiesGenerator
      .generate(
        galaxy,
        stellarDensity,
      );

  const stellarPopulationProfile =
    StellarPopulationProfileGenerator
      .generate(
        generationKey,
        galaxy.physicalProperties,
        stellarPopulation,
      );

  const stellarSystem =
    StellarSystemGenerator
      .generate(
        generationKey,
        systemLocator,
        stellarPopulation,
        stellarPopulationProfile,
      );

  const formationSnapshot =
    ProtoplanetaryFormationSnapshotGenerator
      .generateMaturationReferenceOrNull(
        generationKey,
        systemLocator,
      );

  if (
    formationSnapshot ===
      null
  ) {
    return null;
  }

  const formationBlueprint =
    PlanetaryFormationMaturationGenerator
      .generate(
        generationKey,
        formationSnapshot.systemSeed,
        formationSnapshot.diskProfile,
        formationSnapshot.diskStructure,
        formationSnapshot.planetFormationProfile,
        formationSnapshot.candidatePopulation,
        formationSnapshot.earlyDynamics,
      );

  const planetarySystem =
    PlanetarySystemGenerator
      .generate(
        generationKey,
        stellarSystem,
        formationBlueprint,
      );

  if (
    locator.bodyIndex <
      0n ||
    locator.bodyIndex >=
      BigInt(
        planetarySystem
          .planetCount,
      )
  ) {
    return null;
  }

  const index =
    Number(
      locator.bodyIndex,
    );

  const slot =
    planetarySystem
      .planetSlots[index];

  const designation =
    planetarySystem
      .planetDesignations[index];

  if (
    slot ===
      undefined ||
    designation ===
      undefined ||
    slot.bodyLocator.bodyIndex !==
      locator.bodyIndex
  ) {
    return null;
  }

  return Object.freeze({
    identity:
      Object.freeze({
        locator:
          slot.bodyLocator,
        planetOrdinal:
          slot.planetOrdinal,
        designation:
          designation.name,
        hostSystemDesignation:
          stellarSystem.designation.name,
        orbitTopology:
          planetarySystem
            .architecture
            .orbitTopology,
        hostPlanetCount:
          planetarySystem
            .planetCount,
      }),
    planetarySystem,
    retainedStellarHistory: Object.freeze({
      physical: formationSnapshot.stellarPhysicalProperties,
      lifetime: formationSnapshot.stellarLifetimeProfile,
    }),
  });
}
