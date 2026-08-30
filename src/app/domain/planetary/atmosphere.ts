import {
  type BodyLocator,
  type SystemLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

import {
  type AtmosphereBulkProperties,
} from './atmosphere-bulk-properties';

import {
  AtmosphereGas,
} from './atmosphere-gas';

import {
  type AtmosphereGasComponent,
} from './atmosphere-gas-component';

import {
  type AtmosphereGreenhouseEffect,
} from './atmosphere-greenhouse-effect';

import {
  type AtmosphereGreenhouseRegime,
} from './atmosphere-greenhouse-regime';

import {
  type AtmospherePressureRegime,
} from './atmosphere-pressure-regime';

import {
  type PlanetClimateState,
} from './planet-climate-state';

import {
  type PlanetClimateStabilityRegime,
} from './planet-climate-stability-regime';

import {
  type PlanetClimateVariabilityState,
} from './planet-climate-variability-state';

import {
  type PlanetGeologyRegime,
} from './planet-geology-regime';

import {
  type PlanetGeologyState,
} from './planet-geology-state';

import {
  type PlanetMagneticFieldRegime,
} from './planet-magnetic-field-regime';

import {
  type PlanetMagnetosphereRegime,
} from './planet-magnetosphere-regime';

import {
  type PlanetMagnetosphereState,
} from './planet-magnetosphere-state';

import {
  type PlanetRadiationProtectionRegime,
} from './planet-radiation-protection-regime';

import {
  type PlanetSurfaceRadiationRegime,
} from './planet-surface-radiation-regime';

import {
  type PlanetSurfaceRadiationState,
} from './planet-surface-radiation-state';

import {
  type PlanetTectonicRegime,
} from './planet-tectonic-regime';

import {
  type PlanetVolcanismRegime,
} from './planet-volcanism-regime';

import {
  type PlanetSurfaceWaterRegime,
} from './planet-surface-water-regime';

import {
  type PlanetWaterInventory,
} from './planet-water-inventory';

import {
  type PlanetWaterPhaseRegime,
} from './planet-water-phase-regime';

import {
  type AtmosphereRetentionRegime,
} from './atmosphere-retention-regime';

import {
  type AtmosphereRetentionState,
} from './atmosphere-retention-state';

import {
  type Planet,
} from './planet';

import {
  type PlanetType,
} from './planet-type';

import {
  type PlanetaryDesignation,
} from './planetary-designation';

import {
  type PlanetarySystem,
} from './planetary-system';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Phase-20 atmosphere aggregate for one mature Planet.
 *
 * Point 20.1 establishes the aggregate identity, point 20.2 supplies the frozen
 * source pressure/density/gas inventory, point 20.3 adds a non-mutating
 * atmospheric retention/loss state and point 20.4 adds an approximate retained-
 * atmosphere greenhouse/longwave blanketing state, point 20.5 adds a global-
 * mean thermal climate baseline, point 20.6 adds seasons, coarse thermal
 * extrema and a stability assessment, point 20.7 adds the deterministic
 * water/hydrosphere state, point 20.8 adds approximate geology, volcanism and
 * tectonic mobility, point 20.9 adds intrinsic/induced magnetic-field and
 * magnetosphere state and point 20.10 closes phase 20 with normalized surface-
 * radiation exposure and protection. BodyLocator/BodySeed remain the canonical
 * identity; no AtmosphereSeed exists.
 */
export class Atmosphere {

  constructor(
    readonly hostPlanet:
      Planet,

    readonly bulkProperties:
      AtmosphereBulkProperties,

    readonly retentionState:
      AtmosphereRetentionState,

    readonly greenhouseEffect:
      AtmosphereGreenhouseEffect,

    readonly climateState:
      PlanetClimateState,

    readonly climateVariabilityState:
      PlanetClimateVariabilityState,

    readonly waterInventory:
      PlanetWaterInventory,

    readonly geologyState:
      PlanetGeologyState,

    readonly magnetosphereState:
      PlanetMagnetosphereState,

    readonly surfaceRadiationState:
      PlanetSurfaceRadiationState,
  ) {
    if (
      !hostPlanet
        .isTypePhysicallyCoherent
    ) {
      throw new RangeError(
        'Atmosphere requires a point-19.7 physically coherent Planet.',
      );
    }

    if (
      !Number.isInteger(
        hostPlanet
          .planetOrdinal,
      ) ||
      hostPlanet
        .planetOrdinal <=
        0
    ) {
      throw new RangeError(
        'Atmosphere requires a positive integer planetOrdinal.',
      );
    }

    if (
      hostPlanet
        .locator
        .bodyIndex !==
      BigInt(
        hostPlanet
          .planetOrdinal -
          1,
      )
    ) {
      throw new RangeError(
        'Atmosphere must preserve the canonical BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      hostPlanet
        .seed
        .kind !==
      'body'
    ) {
      throw new RangeError(
        'Atmosphere requires the canonical BodySeed of its host Planet.',
      );
    }

    assertBulkIdentity(
      hostPlanet,
      bulkProperties,
    );

    assertRetentionIdentity(
      hostPlanet,
      bulkProperties,
      retentionState,
    );

    assertGreenhouseIdentity(
      hostPlanet,
      retentionState,
      greenhouseEffect,
    );

    assertClimateIdentity(
      hostPlanet,
      greenhouseEffect,
      climateState,
    );

    assertClimateVariabilityIdentity(
      hostPlanet,
      climateState,
      climateVariabilityState,
    );

    assertWaterIdentity(
      hostPlanet,
      climateVariabilityState,
      waterInventory,
    );

    assertGeologyIdentity(
      hostPlanet,
      waterInventory,
      geologyState,
    );

    assertMagnetosphereIdentity(
      hostPlanet,
      retentionState,
      geologyState,
      magnetosphereState,
    );

    assertSurfaceRadiationIdentity(
      hostPlanet,
      retentionState,
      magnetosphereState,
      surfaceRadiationState,
    );

    if (
      bulkProperties.sourcePlanetType !==
        hostPlanet.planetType ||
      !approximatelyEqual(
        bulkProperties.sourceMassEarth,
        hostPlanet.massEarth,
      ) ||
      !approximatelyEqual(
        bulkProperties.sourceRadiusEarth,
        hostPlanet.radiusEarth,
      ) ||
      !approximatelyEqual(
        bulkProperties.sourceSurfaceGravityEarth,
        hostPlanet.surfaceGravityEarth,
      ) ||
      !approximatelyEqual(
        bulkProperties.sourceEnvelopeMassFraction01,
        hostPlanet.physicalProperties
          .envelopeMassFraction01,
      ) ||
      !approximatelyEqual(
        bulkProperties.sourceIceBearingInteriorFraction01,
        hostPlanet.internalComposition
          .iceBearingFractionOfSolids01,
      ) ||
      !approximatelyEqual(
        bulkProperties.sourceReferenceMeanInsolationEarth,
        hostPlanet.typeClassification
          .referenceMeanInsolationEarth,
      ) ||
      !approximatelyEqual(
        bulkProperties.sourceReferenceBondAlbedo01,
        hostPlanet.referenceBondAlbedo01,
      )
    ) {
      throw new RangeError(
        'Point-20.2 atmosphere bulk properties must preserve the exact phase-19 host-Planet source state.',
      );
    }

    if (
      retentionState.sourcePressureRegime !==
        bulkProperties.pressureRegime ||
      retentionState.sourceSurfacePressurePascal !==
        bulkProperties.surfacePressurePascal ||
      !approximatelyEqual(
        retentionState.sourceReferenceMeanInsolationEarth,
        bulkProperties.sourceReferenceMeanInsolationEarth,
      ) ||
      !approximatelyEqual(
        retentionState.sourceReferenceBondAlbedo01,
        bulkProperties.sourceReferenceBondAlbedo01,
      )
    ) {
      throw new RangeError(
        'Point-20.3 retention state must preserve the exact point-20.2 source pressure and irradiation state.',
      );
    }


    if (
      greenhouseEffect.sourceRetentionRegime !==
        retentionState.retentionRegime ||
      greenhouseEffect.sourceRetainedPressureRegime !==
        retentionState.retainedPressureRegime ||
      greenhouseEffect.sourceRetainedSurfacePressurePascal !==
        retentionState.retainedSurfacePressurePascal ||
      !approximatelyEqual(
        greenhouseEffect.sourceRetainedMoleInventoryFraction01,
        retentionState.retainedMoleInventoryFraction01,
      ) ||
      !approximatelyEqual(
        greenhouseEffect.sourceReferenceMeanInsolationEarth,
        retentionState.sourceReferenceMeanInsolationEarth,
      ) ||
      !approximatelyEqual(
        greenhouseEffect.sourceReferenceBondAlbedo01,
        retentionState.sourceReferenceBondAlbedo01,
      )
    ) {
      throw new RangeError(
        'Point-20.4 greenhouse effect must preserve the exact point-20.3 retained atmosphere source state.',
      );
    }

    if (
      climateState.sourceGreenhouseRegime !==
        greenhouseEffect.regime ||
      !approximatelyEqual(
        climateState.sourceInfraredOpticalDepthProxy,
        greenhouseEffect.infraredOpticalDepthProxy,
      ) ||
      !nullableApproximatelyEqual(
        climateState.sourceGreenhouseTemperatureAmplificationFactor,
        greenhouseEffect.temperatureAmplificationFactor,
      ) ||
      !approximatelyEqual(
        climateState.sourceReferenceMeanInsolationEarth,
        greenhouseEffect.sourceReferenceMeanInsolationEarth,
      ) ||
      !approximatelyEqual(
        climateState.sourceReferenceBondAlbedo01,
        greenhouseEffect.sourceReferenceBondAlbedo01,
      )
    ) {
      throw new RangeError(
        'Point-20.5 climate state must preserve the exact point-20.4 greenhouse and phase-19 irradiation/albedo handoff.',
      );
    }

    if (
      !approximatelyEqual(
        climateVariabilityState.sourceEquilibriumTemperatureKelvin,
        climateState.equilibriumTemperatureKelvin,
      ) ||
      !nullableApproximatelyEqual(
        climateVariabilityState.sourceMeanSurfaceTemperatureKelvin,
        climateState.meanSurfaceTemperatureKelvin,
      ) ||
      !approximatelyEqual(
        climateVariabilityState.sourceOrbitalEccentricity,
        hostPlanet.orbit.eccentricity,
      ) ||
      !approximatelyEqual(
        climateVariabilityState.sourceAxialTiltDegrees,
        hostPlanet.axialTiltDegrees,
      ) ||
      !approximatelyEqual(
        climateVariabilityState.sourceRotationPeriodHours,
        hostPlanet.rotationPeriodHours,
      ) ||
      !nullableApproximatelyEqual(
        climateVariabilityState.sourceDayLengthHours,
        hostPlanet.dayLengthHours,
      ) ||
      climateVariabilityState.sourceRetainedSurfacePressurePascal !==
        retentionState.retainedSurfacePressurePascal ||
      !approximatelyEqual(
        climateVariabilityState.sourceLongwaveTrappingFraction01,
        greenhouseEffect.longwaveTrappingFraction01,
      )
    ) {
      throw new RangeError(
        'Point-20.6 climate variability must preserve the exact point-18/19 orbital-spin and point-20.3/20.4/20.5 climate handoff.',
      );
    }

    if (
      waterInventory.sourcePlanetType !==
        hostPlanet.planetType ||
      !approximatelyEqual(
        waterInventory.sourceIceBearingInteriorFraction01,
        hostPlanet.internalComposition
          .iceBearingFractionOfSolids01,
      ) ||
      waterInventory.sourceRetainedSurfacePressurePascal !==
        retentionState.retainedSurfacePressurePascal ||
      !approximatelyEqual(
        waterInventory.sourceRetainedAtmosphericWaterVaporMoleFraction01,
        retainedWaterVaporMoleFraction01(
          retentionState,
        ),
      ) ||
      !nullableApproximatelyEqual(
        waterInventory.sourceMeanSurfaceTemperatureKelvin,
        climateState.meanSurfaceTemperatureKelvin,
      ) ||
      !nullableApproximatelyEqual(
        waterInventory.sourceMinimumSurfaceTemperatureKelvin,
        climateVariabilityState.minimumSurfaceTemperatureKelvin,
      ) ||
      !nullableApproximatelyEqual(
        waterInventory.sourceMaximumSurfaceTemperatureKelvin,
        climateVariabilityState.maximumSurfaceTemperatureKelvin,
      ) ||
      !nullableApproximatelyEqual(
        waterInventory.sourceClimateStabilityIndex01,
        climateVariabilityState.stabilityIndex01,
      )
    ) {
      throw new RangeError(
        'Point-20.7 water inventory must preserve the exact phase-19 water/type and point-20.3/20.5/20.6 atmosphere-climate handoff.',
      );
    }

    if (
      geologyState.sourcePlanetType !==
        hostPlanet.planetType ||
      !approximatelyEqual(
        geologyState.sourceMassEarth,
        hostPlanet.massEarth,
      ) ||
      !approximatelyEqual(
        geologyState.sourceRadiusEarth,
        hostPlanet.radiusEarth,
      ) ||
      !approximatelyEqual(
        geologyState.sourceSurfaceGravityEarth,
        hostPlanet.surfaceGravityEarth,
      ) ||
      !approximatelyEqual(
        geologyState.sourceMetallicCoreMassFraction01,
        hostPlanet.internalComposition
          .metallicCoreMassFraction01,
      ) ||
      !approximatelyEqual(
        geologyState.sourceSilicateInteriorMassFraction01,
        hostPlanet.internalComposition
          .silicateInteriorMassFraction01,
      ) ||
      !approximatelyEqual(
        geologyState.sourceVolatileRichInteriorMassFraction01,
        hostPlanet.internalComposition
          .volatileRichInteriorMassFraction01,
      ) ||
      !approximatelyEqual(
        geologyState.sourceCondensedIceMassFraction01,
        hostPlanet.internalComposition
          .condensedIceMassFraction01,
      ) ||
      !approximatelyEqual(
        geologyState.sourceIceBearingInteriorFraction01,
        hostPlanet.internalComposition
          .iceBearingFractionOfSolids01,
      ) ||
      !approximatelyEqual(
        geologyState.sourceTidalHeatingProxy,
        hostPlanet.typeClassification
          .tidalHeatingProxy,
      ) ||
      !approximatelyEqual(
        geologyState.sourceWaterInventoryIndex01,
        waterInventory.waterInventoryIndex01,
      ) ||
      !nullableApproximatelyEqual(
        geologyState.sourceSurfaceLiquidWaterCoverageFraction01,
        waterInventory.surfaceLiquidWaterCoverageFraction01,
      )
    ) {
      throw new RangeError(
        'Point-20.8 geology state must preserve the exact phase-19 bulk/interior/tidal and point-20.7 water handoff.',
      );
    }

    if (
      magnetosphereState.sourcePlanetType !==
        hostPlanet.planetType ||
      !approximatelyEqual(
        magnetosphereState.sourceMassEarth,
        hostPlanet.massEarth,
      ) ||
      !approximatelyEqual(
        magnetosphereState.sourceRadiusEarth,
        hostPlanet.radiusEarth,
      ) ||
      !approximatelyEqual(
        magnetosphereState.sourceRotationPeriodHours,
        hostPlanet.rotationPeriodHours,
      ) ||
      magnetosphereState.sourceIsTidallySynchronized !==
        hostPlanet.isTidallySynchronized ||
      !approximatelyEqual(
        magnetosphereState.sourceMetallicCoreMassFraction01,
        hostPlanet.internalComposition
          .metallicCoreMassFraction01,
      ) ||
      !approximatelyEqual(
        magnetosphereState.sourceGaseousEnvelopeMassFraction01,
        hostPlanet.internalComposition
          .gaseousEnvelopeMassFraction01,
      ) ||
      !approximatelyEqual(
        magnetosphereState.sourceIceBearingInteriorFraction01,
        hostPlanet.internalComposition
          .iceBearingFractionOfSolids01,
      ) ||
      !approximatelyEqual(
        magnetosphereState.sourceReferenceMeanInsolationEarth,
        hostPlanet.typeClassification
          .referenceMeanInsolationEarth,
      ) ||
      magnetosphereState.sourceRetainedSurfacePressurePascal !==
        retentionState.retainedSurfacePressurePascal ||
      magnetosphereState.sourceGeologyRegime !==
        geologyState.geologyRegime ||
      !nullableApproximatelyEqual(
        magnetosphereState.sourceInternalHeatRetentionIndex01,
        geologyState.internalHeatRetentionIndex01,
      ) ||
      !nullableApproximatelyEqual(
        magnetosphereState.sourceGeologicalActivityIndex01,
        geologyState.geologicalActivityIndex01,
      ) ||
      !nullableApproximatelyEqual(
        magnetosphereState.sourceTidalHeatingIndex01,
        geologyState.tidalHeatingIndex01,
      )
    ) {
      throw new RangeError(
        'Point-20.9 magnetosphere state must preserve the exact phase-19 spin/interior, point-20.3 retained-atmosphere and point-20.8 geology handoff.',
      );
    }

    if (
      surfaceRadiationState.sourcePlanetType !==
        hostPlanet.planetType ||
      !approximatelyEqual(
        surfaceRadiationState.sourceSurfaceGravityEarth,
        hostPlanet.surfaceGravityEarth,
      ) ||
      !approximatelyEqual(
        surfaceRadiationState.sourceReferenceMeanInsolationEarth,
        hostPlanet.typeClassification
          .referenceMeanInsolationEarth,
      ) ||
      surfaceRadiationState.sourceRetainedSurfacePressurePascal !==
        retentionState.retainedSurfacePressurePascal ||
      !approximatelyEqual(
        surfaceRadiationState.sourceStellarWindPressureProxyEarth,
        magnetosphereState.stellarWindPressureProxyEarth,
      ) ||
      !approximatelyEqual(
        surfaceRadiationState.sourceMagnetosphericProtectionIndex01,
        magnetosphereState.magnetosphericProtectionIndex01,
      ) ||
      surfaceRadiationState.sourceMagneticFieldRegime !==
        magnetosphereState.magneticFieldRegime ||
      surfaceRadiationState.sourceMagnetosphereRegime !==
        magnetosphereState.magnetosphereRegime
    ) {
      throw new RangeError(
        'Point-20.10 surface-radiation state must preserve the exact phase-19 gravity/irradiation, point-20.3 atmosphere and point-20.9 magnetosphere handoff.',
      );
    }
  }

  get generationKey():
    UniverseGenerationKey {

    return this
      .hostPlanet
      .generationKey;
  }

  get hostPlanetarySystem():
    PlanetarySystem {

    return this
      .hostPlanet
      .hostPlanetarySystem;
  }

  get systemLocator():
    SystemLocator {

    return this
      .hostPlanet
      .systemLocator;
  }

  get planetOrdinal():
    number {

    return this
      .hostPlanet
      .planetOrdinal;
  }

  get locator():
    BodyLocator {

    return this
      .hostPlanet
      .locator;
  }

  get seed():
    BodySeed {

    return this
      .hostPlanet
      .seed;
  }

  get designation():
    PlanetaryDesignation {

    return this
      .hostPlanet
      .designation;
  }

  get name():
    string {

    return this
      .hostPlanet
      .name;
  }

  get planetType():
    PlanetType {

    return this
      .hostPlanet
      .planetType;
  }

  get sourceMassEarth():
    number {

    return this
      .hostPlanet
      .massEarth;
  }

  get sourceRadiusEarth():
    number {

    return this
      .hostPlanet
      .radiusEarth;
  }

  get sourceSurfaceGravityEarth():
    number {

    return this
      .hostPlanet
      .surfaceGravityEarth;
  }

  get sourceEnvelopeMassFraction01():
    number {

    return this
      .hostPlanet
      .physicalProperties
      .envelopeMassFraction01;
  }

  get sourceReferenceMeanInsolationEarth():
    number {

    return this
      .hostPlanet
      .typeClassification
      .referenceMeanInsolationEarth;
  }

  get sourceReferenceBondAlbedo01():
    number {

    return this
      .hostPlanet
      .referenceBondAlbedo01;
  }

  get pressureRegime():
    AtmospherePressureRegime {

    return this
      .bulkProperties
      .pressureRegime;
  }

  get surfacePressurePascal():
    number | null {

    return this
      .bulkProperties
      .surfacePressurePascal;
  }

  get referenceDensityKilogramsPerCubicMeter():
    number {

    return this
      .bulkProperties
      .referenceDensityKilogramsPerCubicMeter;
  }

  get meanMolarMassGramsPerMole():
    number | null {

    return this
      .bulkProperties
      .meanMolarMassGramsPerMole;
  }

  get gasComposition():
    readonly AtmosphereGasComponent[] {

    return this
      .bulkProperties
      .gasComponents;
  }

  get retentionRegime():
    AtmosphereRetentionRegime {

    return this
      .retentionState
      .retentionRegime;
  }

  get atmosphericInventoryRetentionFraction01():
    number {

    return this
      .retentionState
      .retainedMoleInventoryFraction01;
  }

  get atmosphericInventoryLossFraction01():
    number {

    return this
      .retentionState
      .lostMoleInventoryFraction01;
  }

  get retainedPressureRegime():
    AtmospherePressureRegime {

    return this
      .retentionState
      .retainedPressureRegime;
  }

  get retainedSurfacePressurePascal():
    number | null {

    return this
      .retentionState
      .retainedSurfacePressurePascal;
  }

  get retainedReferenceDensityKilogramsPerCubicMeter():
    number {

    return this
      .retentionState
      .retainedReferenceDensityKilogramsPerCubicMeter;
  }

  get retainedMeanMolarMassGramsPerMole():
    number | null {

    return this
      .retentionState
      .retainedMeanMolarMassGramsPerMole;
  }

  get retainedGasComposition():
    readonly AtmosphereGasComponent[] {

    return this
      .retentionState
      .retainedGasComponents;
  }

  get escapeVelocityKilometersPerSecond():
    number {

    return this
      .retentionState
      .escapeVelocityKilometersPerSecond;
  }

  get greenhouseRegime():
    AtmosphereGreenhouseRegime {

    return this
      .greenhouseEffect
      .regime;
  }

  get infraredOpticalDepthProxy():
    number {

    return this
      .greenhouseEffect
      .infraredOpticalDepthProxy;
  }

  get longwaveTrappingFraction01():
    number {

    return this
      .greenhouseEffect
      .longwaveTrappingFraction01;
  }

  get greenhouseTemperatureAmplificationFactor():
    number | null {

    return this
      .greenhouseEffect
      .temperatureAmplificationFactor;
  }

  get equilibriumTemperatureKelvin():
    number {

    return this
      .climateState
      .equilibriumTemperatureKelvin;
  }

  get meanSurfaceTemperatureKelvin():
    number | null {

    return this
      .climateState
      .meanSurfaceTemperatureKelvin;
  }

  get greenhouseSurfaceWarmingKelvin():
    number | null {

    return this
      .climateState
      .greenhouseSurfaceWarmingKelvin;
  }

  get hasDefinedSolidSurfaceTemperature():
    boolean {

    return this
      .climateState
      .hasDefinedSolidSurfaceTemperature;
  }

  get climateStabilityRegime():
    PlanetClimateStabilityRegime {

    return this
      .climateVariabilityState
      .stabilityRegime;
  }

  get climateStabilityIndex01():
    number | null {

    return this
      .climateVariabilityState
      .stabilityIndex01;
  }

  get seasonalTemperatureAmplitudeKelvin():
    number | null {

    return this
      .climateVariabilityState
      .seasonalTemperatureAmplitudeKelvin;
  }

  get diurnalTemperatureRangeKelvin():
    number | null {

    return this
      .climateVariabilityState
      .diurnalTemperatureRangeKelvin;
  }

  get minimumSurfaceTemperatureKelvin():
    number | null {

    return this
      .climateVariabilityState
      .minimumSurfaceTemperatureKelvin;
  }

  get maximumSurfaceTemperatureKelvin():
    number | null {

    return this
      .climateVariabilityState
      .maximumSurfaceTemperatureKelvin;
  }

  get heatRedistributionEfficiency01():
    number {

    return this
      .climateVariabilityState
      .heatRedistributionEfficiency01;
  }

  get waterInventoryIndex01():
    number {

    return this
      .waterInventory
      .waterInventoryIndex01;
  }

  get waterPhaseRegime():
    PlanetWaterPhaseRegime {

    return this
      .waterInventory
      .phaseRegime;
  }

  get surfaceWaterRegime():
    PlanetSurfaceWaterRegime {

    return this
      .waterInventory
      .surfaceWaterRegime;
  }

  get waterIceFraction01():
    number | null {

    return this
      .waterInventory
      .iceFraction01;
  }

  get waterLiquidFraction01():
    number | null {

    return this
      .waterInventory
      .liquidFraction01;
  }

  get waterVaporFraction01():
    number | null {

    return this
      .waterInventory
      .vaporFraction01;
  }

  get surfaceIceCoverageFraction01():
    number | null {

    return this
      .waterInventory
      .surfaceIceCoverageFraction01;
  }

  get surfaceLiquidWaterCoverageFraction01():
    number | null {

    return this
      .waterInventory
      .surfaceLiquidWaterCoverageFraction01;
  }

  get hasPersistentSurfaceLiquidWater():
    boolean {

    return this
      .waterInventory
      .hasPersistentSurfaceLiquidWater;
  }

  get geologyRegime():
    PlanetGeologyRegime {

    return this
      .geologyState
      .geologyRegime;
  }

  get volcanismRegime():
    PlanetVolcanismRegime {

    return this
      .geologyState
      .volcanismRegime;
  }

  get tectonicRegime():
    PlanetTectonicRegime {

    return this
      .geologyState
      .tectonicRegime;
  }

  get internalHeatRetentionIndex01():
    number | null {

    return this
      .geologyState
      .internalHeatRetentionIndex01;
  }

  get tidalHeatingIndex01():
    number | null {

    return this
      .geologyState
      .tidalHeatingIndex01;
  }

  get mantleConvectionIndex01():
    number | null {

    return this
      .geologyState
      .mantleConvectionIndex01;
  }

  get geologicalActivityIndex01():
    number | null {

    return this
      .geologyState
      .geologicalActivityIndex01;
  }

  get volcanismIndex01():
    number | null {

    return this
      .geologyState
      .volcanismIndex01;
  }

  get tectonicMobilityIndex01():
    number | null {

    return this
      .geologyState
      .tectonicMobilityIndex01;
  }

  get volatileOutgassingPotential01():
    number | null {

    return this
      .geologyState
      .volatileOutgassingPotential01;
  }

  get surfaceRenewalPotential01():
    number | null {

    return this
      .geologyState
      .surfaceRenewalPotential01;
  }

  get isGeologicallyActive():
    boolean {

    return this
      .geologyState
      .isGeologicallyActive;
  }

  get hasActiveVolcanism():
    boolean {

    return this
      .geologyState
      .hasActiveVolcanism;
  }

  get supportsMobileLithosphere():
    boolean {

    return this
      .geologyState
      .supportsMobileLithosphere;
  }

  get magneticFieldRegime():
    PlanetMagneticFieldRegime {

    return this
      .magnetosphereState
      .magneticFieldRegime;
  }

  get magnetosphereRegime():
    PlanetMagnetosphereRegime {

    return this
      .magnetosphereState
      .magnetosphereRegime;
  }

  get dynamoPotentialIndex01():
    number {

    return this
      .magnetosphereState
      .dynamoPotentialIndex01;
  }

  get intrinsicMagneticFieldIndex01():
    number {

    return this
      .magnetosphereState
      .intrinsicMagneticFieldIndex01;
  }

  get magnetosphericProtectionIndex01():
    number {

    return this
      .magnetosphereState
      .magnetosphericProtectionIndex01;
  }

  get hasSustainedDynamo():
    boolean {

    return this
      .magnetosphereState
      .hasSustainedDynamo;
  }

  get hasIntrinsicMagnetosphere():
    boolean {

    return this
      .magnetosphereState
      .hasIntrinsicMagnetosphere;
  }

  get hasInducedMagnetosphere():
    boolean {

    return this
      .magnetosphereState
      .hasInducedMagnetosphere;
  }

  get surfaceRadiationRegime():
    PlanetSurfaceRadiationRegime {

    return this
      .surfaceRadiationState
      .radiationRegime;
  }

  get surfaceRadiationProtectionRegime():
    PlanetRadiationProtectionRegime {

    return this
      .surfaceRadiationState
      .protectionRegime;
  }

  get atmosphericRadiationShieldingIndex01():
    number | null {

    return this
      .surfaceRadiationState
      .atmosphericRadiationShieldingIndex01;
  }

  get surfaceRadiationProtectionIndex01():
    number | null {

    return this
      .surfaceRadiationState
      .surfaceRadiationProtectionIndex01;
  }

  get surfaceRadiationExposureIndex01():
    number | null {

    return this
      .surfaceRadiationState
      .surfaceRadiationExposureIndex01;
  }

  get surfaceParticleRadiationExposureIndex01():
    number | null {

    return this
      .surfaceRadiationState
      .surfaceParticleRadiationExposureIndex01;
  }

  get surfaceElectromagneticRadiationExposureIndex01():
    number | null {

    return this
      .surfaceRadiationState
      .surfaceElectromagneticRadiationExposureIndex01;
  }

  get hasEffectiveSurfaceRadiationProtection():
    boolean {

    return this
      .surfaceRadiationState
      .hasEffectiveSurfaceRadiationProtection;
  }

  get isVacuum():
    boolean {

    return this
      .bulkProperties
      .isVacuum;
  }

  get isDeepEnvelope():
    boolean {

    return this
      .bulkProperties
      .isDeepEnvelope;
  }
}

function assertBulkIdentity(
  hostPlanet:
    Planet,

  bulkProperties:
    AtmosphereBulkProperties,
): void {

  if (
    bulkProperties.planetOrdinal !==
      hostPlanet.planetOrdinal ||
    bulkProperties.bodyLocator.galaxyIndex !==
      hostPlanet.locator.galaxyIndex ||
    bulkProperties.bodyLocator.sectorKey !==
      hostPlanet.locator.sectorKey ||
    bulkProperties.bodyLocator.galacticObjectIndex !==
      hostPlanet.locator.galacticObjectIndex ||
    bulkProperties.bodyLocator.bodyIndex !==
      hostPlanet.locator.bodyIndex ||
    bulkProperties.bodySeed.normalizedValue !==
      hostPlanet.seed.normalizedValue
  ) {
    throw new RangeError(
      'Point-20.2 atmosphere bulk properties must preserve the exact host Planet ordinal, BodyLocator and BodySeed.',
    );
  }
}

function assertRetentionIdentity(
  hostPlanet:
    Planet,

  bulkProperties:
    AtmosphereBulkProperties,

  retentionState:
    AtmosphereRetentionState,
): void {

  if (
    retentionState.planetOrdinal !==
      hostPlanet.planetOrdinal ||
    retentionState.bodyLocator.galaxyIndex !==
      hostPlanet.locator.galaxyIndex ||
    retentionState.bodyLocator.sectorKey !==
      hostPlanet.locator.sectorKey ||
    retentionState.bodyLocator.galacticObjectIndex !==
      hostPlanet.locator.galacticObjectIndex ||
    retentionState.bodyLocator.bodyIndex !==
      hostPlanet.locator.bodyIndex ||
    retentionState.bodySeed.normalizedValue !==
      hostPlanet.seed.normalizedValue ||
    retentionState.sourcePressureRegime !==
      bulkProperties.pressureRegime
  ) {
    throw new RangeError(
      'Point-20.3 retention state must preserve the exact host Planet and point-20.2 atmosphere identity.',
    );
  }
}

function assertGreenhouseIdentity(
  hostPlanet:
    Planet,

  retentionState:
    AtmosphereRetentionState,

  greenhouseEffect:
    AtmosphereGreenhouseEffect,
): void {

  if (
    greenhouseEffect.planetOrdinal !==
      hostPlanet.planetOrdinal ||
    greenhouseEffect.bodyLocator.galaxyIndex !==
      hostPlanet.locator.galaxyIndex ||
    greenhouseEffect.bodyLocator.sectorKey !==
      hostPlanet.locator.sectorKey ||
    greenhouseEffect.bodyLocator.galacticObjectIndex !==
      hostPlanet.locator.galacticObjectIndex ||
    greenhouseEffect.bodyLocator.bodyIndex !==
      hostPlanet.locator.bodyIndex ||
    greenhouseEffect.bodySeed.normalizedValue !==
      hostPlanet.seed.normalizedValue ||
    greenhouseEffect.sourceRetentionRegime !==
      retentionState.retentionRegime
  ) {
    throw new RangeError(
      'Point-20.4 greenhouse effect must preserve the exact host Planet and point-20.3 atmosphere identity.',
    );
  }
}

function assertClimateIdentity(
  hostPlanet:
    Planet,

  greenhouseEffect:
    AtmosphereGreenhouseEffect,

  climateState:
    PlanetClimateState,
): void {

  if (
    climateState.planetOrdinal !==
      hostPlanet.planetOrdinal ||
    climateState.bodyLocator.galaxyIndex !==
      hostPlanet.locator.galaxyIndex ||
    climateState.bodyLocator.sectorKey !==
      hostPlanet.locator.sectorKey ||
    climateState.bodyLocator.galacticObjectIndex !==
      hostPlanet.locator.galacticObjectIndex ||
    climateState.bodyLocator.bodyIndex !==
      hostPlanet.locator.bodyIndex ||
    climateState.bodySeed.normalizedValue !==
      hostPlanet.seed.normalizedValue ||
    climateState.sourceGreenhouseRegime !==
      greenhouseEffect.regime
  ) {
    throw new RangeError(
      'Point-20.5 climate state must preserve the exact host Planet and point-20.4 greenhouse identity.',
    );
  }
}

function assertClimateVariabilityIdentity(
  hostPlanet:
    Planet,

  climateState:
    PlanetClimateState,

  climateVariabilityState:
    PlanetClimateVariabilityState,
): void {

  if (
    climateVariabilityState.planetOrdinal !==
      hostPlanet.planetOrdinal ||
    climateVariabilityState.bodyLocator.galaxyIndex !==
      hostPlanet.locator.galaxyIndex ||
    climateVariabilityState.bodyLocator.sectorKey !==
      hostPlanet.locator.sectorKey ||
    climateVariabilityState.bodyLocator.galacticObjectIndex !==
      hostPlanet.locator.galacticObjectIndex ||
    climateVariabilityState.bodyLocator.bodyIndex !==
      hostPlanet.locator.bodyIndex ||
    climateVariabilityState.bodySeed.normalizedValue !==
      hostPlanet.seed.normalizedValue ||
    !approximatelyEqual(
      climateVariabilityState.sourceEquilibriumTemperatureKelvin,
      climateState.equilibriumTemperatureKelvin,
    )
  ) {
    throw new RangeError(
      'Point-20.6 climate variability must preserve the exact host Planet and point-20.5 climate identity.',
    );
  }
}

function assertWaterIdentity(
  hostPlanet:
    Planet,

  climateVariabilityState:
    PlanetClimateVariabilityState,

  waterInventory:
    PlanetWaterInventory,
): void {

  if (
    waterInventory.planetOrdinal !==
      hostPlanet.planetOrdinal ||
    waterInventory.bodyLocator.galaxyIndex !==
      hostPlanet.locator.galaxyIndex ||
    waterInventory.bodyLocator.sectorKey !==
      hostPlanet.locator.sectorKey ||
    waterInventory.bodyLocator.galacticObjectIndex !==
      hostPlanet.locator.galacticObjectIndex ||
    waterInventory.bodyLocator.bodyIndex !==
      hostPlanet.locator.bodyIndex ||
    waterInventory.bodySeed.normalizedValue !==
      hostPlanet.seed.normalizedValue ||
    !nullableApproximatelyEqual(
      waterInventory.sourceMinimumSurfaceTemperatureKelvin,
      climateVariabilityState.minimumSurfaceTemperatureKelvin,
    )
  ) {
    throw new RangeError(
      'Point-20.7 water inventory must preserve the exact host Planet and point-20.6 climate-variability identity.',
    );
  }
}

function assertGeologyIdentity(
  hostPlanet:
    Planet,

  waterInventory:
    PlanetWaterInventory,

  geologyState:
    PlanetGeologyState,
): void {

  if (
    geologyState.planetOrdinal !==
      hostPlanet.planetOrdinal ||
    geologyState.bodyLocator.galaxyIndex !==
      hostPlanet.locator.galaxyIndex ||
    geologyState.bodyLocator.sectorKey !==
      hostPlanet.locator.sectorKey ||
    geologyState.bodyLocator.galacticObjectIndex !==
      hostPlanet.locator.galacticObjectIndex ||
    geologyState.bodyLocator.bodyIndex !==
      hostPlanet.locator.bodyIndex ||
    geologyState.bodySeed.normalizedValue !==
      hostPlanet.seed.normalizedValue ||
    !approximatelyEqual(
      geologyState.sourceWaterInventoryIndex01,
      waterInventory.waterInventoryIndex01,
    ) ||
    !nullableApproximatelyEqual(
      geologyState.sourceSurfaceLiquidWaterCoverageFraction01,
      waterInventory.surfaceLiquidWaterCoverageFraction01,
    )
  ) {
    throw new RangeError(
      'Point-20.8 geology state must preserve the exact host Planet and point-20.7 water identity.',
    );
  }
}

function assertMagnetosphereIdentity(
  hostPlanet:
    Planet,

  retentionState:
    AtmosphereRetentionState,

  geologyState:
    PlanetGeologyState,

  magnetosphereState:
    PlanetMagnetosphereState,
): void {

  if (
    magnetosphereState.planetOrdinal !==
      hostPlanet.planetOrdinal ||
    magnetosphereState.bodyLocator.galaxyIndex !==
      hostPlanet.locator.galaxyIndex ||
    magnetosphereState.bodyLocator.sectorKey !==
      hostPlanet.locator.sectorKey ||
    magnetosphereState.bodyLocator.galacticObjectIndex !==
      hostPlanet.locator.galacticObjectIndex ||
    magnetosphereState.bodyLocator.bodyIndex !==
      hostPlanet.locator.bodyIndex ||
    magnetosphereState.bodySeed.normalizedValue !==
      hostPlanet.seed.normalizedValue ||
    magnetosphereState.sourceRetainedSurfacePressurePascal !==
      retentionState.retainedSurfacePressurePascal ||
    magnetosphereState.sourceGeologyRegime !==
      geologyState.geologyRegime ||
    !nullableApproximatelyEqual(
      magnetosphereState.sourceGeologicalActivityIndex01,
      geologyState.geologicalActivityIndex01,
    )
  ) {
    throw new RangeError(
      'Point-20.9 magnetosphere state must preserve the exact host Planet and point-20.3/20.8 source identity.',
    );
  }
}

function assertSurfaceRadiationIdentity(
  hostPlanet:
    Planet,

  retentionState:
    AtmosphereRetentionState,

  magnetosphereState:
    PlanetMagnetosphereState,

  surfaceRadiationState:
    PlanetSurfaceRadiationState,
): void {

  if (
    surfaceRadiationState.planetOrdinal !==
      hostPlanet.planetOrdinal ||
    surfaceRadiationState.bodyLocator.galaxyIndex !==
      hostPlanet.locator.galaxyIndex ||
    surfaceRadiationState.bodyLocator.sectorKey !==
      hostPlanet.locator.sectorKey ||
    surfaceRadiationState.bodyLocator.galacticObjectIndex !==
      hostPlanet.locator.galacticObjectIndex ||
    surfaceRadiationState.bodyLocator.bodyIndex !==
      hostPlanet.locator.bodyIndex ||
    surfaceRadiationState.bodySeed.normalizedValue !==
      hostPlanet.seed.normalizedValue ||
    surfaceRadiationState.sourceRetainedSurfacePressurePascal !==
      retentionState.retainedSurfacePressurePascal ||
    !approximatelyEqual(
      surfaceRadiationState.sourceStellarWindPressureProxyEarth,
      magnetosphereState.stellarWindPressureProxyEarth,
    ) ||
    !approximatelyEqual(
      surfaceRadiationState.sourceMagnetosphericProtectionIndex01,
      magnetosphereState.magnetosphericProtectionIndex01,
    )
  ) {
    throw new RangeError(
      'Point-20.10 surface-radiation state must preserve the exact host Planet and point-20.3/20.9 source identity.',
    );
  }
}

function retainedWaterVaporMoleFraction01(
  retentionState:
    AtmosphereRetentionState,
): number {

  return retentionState
    .retainedGasComponents
    .find(
      (component: AtmosphereGasComponent) =>
        component.gas ===
        AtmosphereGas.WATER_VAPOR,
    )
    ?.moleFraction01 ??
    0;
}

function nullableApproximatelyEqual(
  left:
    number | null,

  right:
    number | null,
): boolean {

  if (
    left ===
      null ||
    right ===
      null
  ) {
    return left ===
      right;
  }

  return approximatelyEqual(
    left,
    right,
  );
}

function approximatelyEqual(
  left:
    number,

  right:
    number,
): boolean {

  const scale =
    Math.max(
      1,
      Math.abs(
        left,
      ),
      Math.abs(
        right,
      ),
    );

  return (
    Math.abs(
      left -
      right,
    ) <=
    CONSISTENCY_TOLERANCE *
      scale
  );
}
