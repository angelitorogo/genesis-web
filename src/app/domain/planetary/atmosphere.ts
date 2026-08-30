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
 * atmosphere greenhouse/longwave blanketing state. BodyLocator/BodySeed remain
 * the canonical identity; no AtmosphereSeed exists.
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
