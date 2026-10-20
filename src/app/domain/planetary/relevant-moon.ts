import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

import {
  type GiantMoonState,
} from './giant-moon-state';

import {
  type MoonEnvironmentState,
} from './moon-environment-state';

import {
  type MoonHabitabilityState,
} from './moon-habitability-state';

import {
  type MoonIdentity,
} from './moon-identity';

import {
  type MoonOrbitalElements,
} from './moon-orbital-elements';

import {
  type MoonPhysicalProperties,
} from './moon-physical-properties';

import type { MoonFormationInventory32F1d } from './moon-formation-inventory-32-f-1d';
import type { MoonWaterPhaseInventory32F2a } from './moon-water-phase-inventory-32-f-2a';
import type { MoonInteriorStructure32F2b } from './moon-interior-structure-32-f-2b';
import type { MoonOceanReality32F2c } from './moon-ocean-reality-32-f-2c';
import type { MoonRadiationProtection32F3 } from './moon-radiation-protection-32-f-3';
import type { MoonGeochemicalEnergy32F4 } from './moon-geochemical-energy-32-f-4';

import {
  type MoonTidalState,
} from './moon-tidal-state';

/**
 * Point-21.3 individually materialized relevant natural satellite.
 *
 * `moonOrdinal` is a stable local ordinal under the host Planet and is sufficient
 * for deterministic point-21.3 property derivation. It is deliberately not a
 * MoonLocator or MoonSeed. Point 21.4 now attaches a deterministic tidal/spin
 * state without changing the frozen point-21.3 physical/orbital values. Point
 * 21.5 adds a first-order atmosphere/water/geology environment state and point
 * 21.6 attaches a potential-habitability projection with independent surface and
 * subsurface routes. Point 21.7 adds a giant-host specialization without changing
 * any frozen 21.3-21.6 source. Point 21.8 now attaches the canonical MoonLocator,
 * MoonSeed and designation without changing any frozen scientific result.
 */
export class RelevantMoon {

  constructor(
    readonly hostPlanetOrdinal:
      number,

    readonly hostPlanetLocator:
      BodyLocator,

    readonly hostPlanetSeed:
      BodySeed,

    readonly moonOrdinal:
      number,

    readonly identity:
      MoonIdentity,

    readonly physicalProperties:
      MoonPhysicalProperties,

    readonly orbit:
      MoonOrbitalElements,

    readonly tidalState:
      MoonTidalState,

    readonly environmentState:
      MoonEnvironmentState,

    readonly habitabilityState:
      MoonHabitabilityState,

    readonly giantMoonState:
      GiantMoonState,

    /** Private simulation-domain formation scenario, NOT an observed DTO. */
    readonly formationInventory32F1d:
      MoonFormationInventory32F1d | null = null,

    /** 32.F.2a conditional H2O phase endpoints, not a current ocean or atmosphere. */
    readonly waterPhaseInventory32F2a: MoonWaterPhaseInventory32F2a | null = null,

    /** Differentiated interior scenario; never evidence of a present ocean. */
    readonly interiorStructure32F2b: MoonInteriorStructure32F2b | null = null,

    /** Modelled CT-0 ocean truth of the procedurally generated moon. */
    readonly oceanReality32F2c: MoonOceanReality32F2c | null = null,

    /** 32.F.3: source-separated irradiation and conditional photon transfer. */
    readonly radiationProtection32F3: MoonRadiationProtection32F3 | null = null,

    /** 32.F.4 physical/chemical interface constraints; no invented reactants. */
    readonly geochemicalEnergy32F4: MoonGeochemicalEnergy32F4 | null = null,
  ) {
    if (geochemicalEnergy32F4 !== null && (
      geochemicalEnergy32F4.hostPlanetOrdinal !== hostPlanetOrdinal ||
      geochemicalEnergy32F4.moonOrdinal !== moonOrdinal ||
      geochemicalEnergy32F4.provenance !== 'CT0_PHASE_AND_THERMAL_MODEL_WITH_UNIDENTIFIED_REACTANTS' ||
      geochemicalEnergy32F4.actualChemicalPowerWatts !== null ||
      geochemicalEnergy32F4.actualChemicalDisequilibriumJoulesPerMole !== null
    )) throw new RangeError('32.F.4 must preserve lunar identity and unknown chemistry.');
    if (radiationProtection32F3 !== null && (
      radiationProtection32F3.hostPlanetOrdinal !== hostPlanetOrdinal ||
      radiationProtection32F3.moonOrdinal !== moonOrdinal ||
      radiationProtection32F3.provenance !== 'V2_BOLOMETRIC_AND_CT0_GEOMETRY_WITH_NIST_PHOTON_REFERENCE' ||
      radiationProtection32F3.surfaceIonisingDoseGrayPerYear !== null ||
      radiationProtection32F3.subsurfaceIonisingDoseGrayPerYear !== null
    )) throw new RangeError('32.F.3 radiation protection must preserve lunar identity and unknown dose.');
    if (oceanReality32F2c !== null && (
      oceanReality32F2c.hostPlanetOrdinal !== hostPlanetOrdinal ||
      oceanReality32F2c.moonOrdinal !== moonOrdinal ||
      oceanReality32F2c.provenance !== 'SIMULATED_CT0_CONSTITUTIVE_MODEL_NOT_DIRECT_OBSERVATION' ||
      Math.abs(oceanReality32F2c.waterInventoryKilograms - (formationInventory32F1d?.waterIceMassKilograms ?? 0)) /
        Math.max(1, oceanReality32F2c.waterInventoryKilograms) > 1e-10
    )) throw new RangeError('32.F.2c modelled ocean must preserve canonical moon inventory and identity.');
    if (interiorStructure32F2b !== null && (
      interiorStructure32F2b.hostPlanetOrdinal !== hostPlanetOrdinal ||
      interiorStructure32F2b.moonOrdinal !== moonOrdinal ||
      interiorStructure32F2b.actualOceanPresence !== 'UNKNOWN' ||
      Math.abs(interiorStructure32F2b.totalMassKilograms - physicalProperties.massEarth * 5.9722e24) /
        (physicalProperties.massEarth * 5.9722e24) > 1e-12
    )) throw new RangeError('32.F.2b interior scenario must preserve moon identity, mass and uncertainty.');
    if (formationInventory32F1d !== null && (
      formationInventory32F1d.hostPlanetOrdinal !== hostPlanetOrdinal ||
      formationInventory32F1d.moonOrdinal !== moonOrdinal ||
      Math.abs(formationInventory32F1d.totalMassKilograms - physicalProperties.massEarth * 5.9722e24) /
        (physicalProperties.massEarth * 5.9722e24) > 1e-12
    )) {
      throw new RangeError('32.F.1d formation inventory must preserve canonical moon identity and mass.');
    }

    if (
      !Number.isInteger(
        hostPlanetOrdinal,
      ) ||
      hostPlanetOrdinal <=
        0
    ) {
      throw new RangeError(
        'RelevantMoon hostPlanetOrdinal must be a positive integer.',
      );
    }

    if (
      hostPlanetLocator
        .bodyIndex !==
      BigInt(
        hostPlanetOrdinal -
          1,
      )
    ) {
      throw new RangeError(
        'RelevantMoon must preserve the canonical host Planet BodyLocator.',
      );
    }

    if (
      hostPlanetSeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'RelevantMoon requires the canonical host Planet BodySeed as parent context.',
      );
    }

    if (
      !Number.isInteger(
        moonOrdinal,
      ) ||
      moonOrdinal <=
        0
    ) {
      throw new RangeError(
        'RelevantMoon moonOrdinal must be a positive integer.',
      );
    }

    if (
      identity.hostPlanetOrdinal !==
        hostPlanetOrdinal ||
      identity.hostPlanetLocator !==
        hostPlanetLocator ||
      identity.hostPlanetSeed !==
        hostPlanetSeed ||
      identity.moonOrdinal !==
        moonOrdinal
    ) {
      throw new RangeError(
        'RelevantMoon point-21.8 identity must preserve the exact host/moon identity.',
      );
    }

    if (
      physicalProperties
        .hostPlanetOrdinal !==
        hostPlanetOrdinal ||
      physicalProperties
        .moonOrdinal !==
        moonOrdinal ||
      orbit
        .hostPlanetOrdinal !==
        hostPlanetOrdinal ||
      orbit
        .moonOrdinal !==
        moonOrdinal ||
      tidalState
        .hostPlanetOrdinal !==
        hostPlanetOrdinal ||
      tidalState
        .moonOrdinal !==
        moonOrdinal ||
      environmentState
        .hostPlanetOrdinal !==
        hostPlanetOrdinal ||
      environmentState
        .moonOrdinal !==
        moonOrdinal ||
      habitabilityState
        .hostPlanetOrdinal !==
        hostPlanetOrdinal ||
      habitabilityState
        .moonOrdinal !==
        moonOrdinal ||
      giantMoonState
        .hostPlanetOrdinal !==
        hostPlanetOrdinal ||
      giantMoonState
        .moonOrdinal !==
        moonOrdinal
    ) {
      throw new RangeError(
        'RelevantMoon physical/orbital/tidal/environment/habitability/giant-specialization products must preserve the exact host/moon ordinals.',
      );
    }


    if (
      !approximatelyEqual(
        tidalState
          .sourceMoonMassEarth,
        physicalProperties
          .massEarth,
      ) ||
      !approximatelyEqual(
        tidalState
          .sourceMoonRadiusEarth,
        physicalProperties
          .radiusEarth,
      ) ||
      !approximatelyEqual(
        tidalState
          .sourceSemiMajorAxisPlanetRadii,
        orbit
          .semiMajorAxisPlanetRadii,
      ) ||
      !approximatelyEqual(
        tidalState
          .sourceSemiMajorAxisKilometers,
        orbit
          .semiMajorAxisKilometers,
      ) ||
      !approximatelyEqual(
        tidalState
          .sourceEccentricity,
        orbit
          .eccentricity,
      ) ||
      !approximatelyEqual(
        tidalState
          .sourceOrbitalPeriodDays,
        orbit
          .orbitalPeriodDays,
      )
    ) {
      throw new RangeError(
        'RelevantMoon tidal state must preserve the exact point-21.3 moon physical/orbital sources.',
      );
    }

    if (
      !approximatelyEqual(
        environmentState
          .sourceMoonMassEarth,
        physicalProperties
          .massEarth,
      ) ||
      !approximatelyEqual(
        environmentState
          .sourceMoonRadiusEarth,
        physicalProperties
          .radiusEarth,
      ) ||
      !approximatelyEqual(
        environmentState
          .sourceMoonMeanDensityGramsPerCubicCentimeter,
        physicalProperties
          .meanDensityGramsPerCubicCentimeter,
      ) ||
      !approximatelyEqual(
        environmentState
          .sourceMoonSurfaceGravityEarth,
        physicalProperties
          .surfaceGravityEarth,
      ) ||
      !approximatelyEqual(
        environmentState
          .sourceTidalHeatingIndex01,
        tidalState
          .tidalHeatingIndex01,
      )
    ) {
      throw new RangeError(
        'RelevantMoon environment state must preserve the exact point-21.3/21.4 moon sources.',
      );
    }

    if (
      !approximatelyEqual(
        habitabilityState
          .sourceMoonSurfaceGravityEarth,
        environmentState
          .sourceMoonSurfaceGravityEarth,
      ) ||
      !approximatelyEqual(
        habitabilityState
          .sourceEstimatedSurfaceTemperatureKelvin,
        environmentState
          .estimatedSurfaceTemperatureKelvin,
      ) ||
      !approximatelyEqual(
        habitabilityState
          .sourceAtmosphereRetentionIndex01,
        environmentState
          .atmosphereRetentionIndex01,
      ) ||
      !approximatelyEqual(
        habitabilityState
          .sourceWaterInventoryIndex01,
        environmentState
          .waterInventoryIndex01,
      ) ||
      !approximatelyEqual(
        habitabilityState
          .sourceSubsurfaceOceanPotentialIndex01,
        environmentState
          .subsurfaceOceanPotentialIndex01,
      ) ||
      !approximatelyEqual(
        habitabilityState
          .sourceSurfaceLiquidWaterPotentialIndex01,
        environmentState
          .surfaceLiquidWaterPotentialIndex01,
      ) ||
      !approximatelyEqual(
        habitabilityState
          .sourceInternalHeatRetentionIndex01,
        environmentState
          .internalHeatRetentionIndex01,
      ) ||
      !approximatelyEqual(
        habitabilityState
          .sourceGeologicalActivityIndex01,
        environmentState
          .geologicalActivityIndex01,
      ) ||
      !approximatelyEqual(
        habitabilityState
          .sourceTidalHeatingIndex01,
        environmentState
          .sourceTidalHeatingIndex01,
      )
    ) {
      throw new RangeError(
        'RelevantMoon habitability state must preserve the exact frozen point-21.5 environment sources.',
      );
    }

    if (
      !approximatelyEqual(
        giantMoonState
          .sourceMoonMassEarth,
        physicalProperties
          .massEarth,
      ) ||
      !approximatelyEqual(
        giantMoonState
          .sourceMoonRadiusEarth,
        physicalProperties
          .radiusEarth,
      ) ||
      !approximatelyEqual(
        giantMoonState
          .sourceSemiMajorAxisPlanetRadii,
        orbit
          .semiMajorAxisPlanetRadii,
      ) ||
      !approximatelyEqual(
        giantMoonState
          .sourceEccentricity,
        orbit
          .eccentricity,
      ) ||
      !approximatelyEqual(
        giantMoonState
          .sourceInclinationDegrees,
        orbit
          .inclinationDegrees,
      ) ||
      !approximatelyEqual(
        giantMoonState
          .sourceInferredIceRichnessIndex01,
        environmentState
          .inferredIceRichnessIndex01,
      ) ||
      !approximatelyEqual(
        giantMoonState
          .sourceTidalHeatingIndex01,
        tidalState
          .tidalHeatingIndex01,
      ) ||
      !approximatelyEqual(
        giantMoonState
          .sourceSubsurfaceOceanPotentialIndex01,
        environmentState
          .subsurfaceOceanPotentialIndex01,
      ) ||
      !approximatelyEqual(
        giantMoonState
          .sourceSurfaceLiquidWaterPotentialIndex01,
        environmentState
          .surfaceLiquidWaterPotentialIndex01,
      ) ||
      !approximatelyEqual(
        giantMoonState
          .sourceOverallHabitabilityIndex01,
        habitabilityState
          .overallHabitabilityIndex01,
      ) ||
      giantMoonState
        .sourceIsPotentiallyHabitable !==
        habitabilityState
          .isPotentiallyHabitable
    ) {
      throw new RangeError(
        'RelevantMoon giant specialization must preserve the exact frozen point-21.3-21.6 moon sources.',
      );
    }
  }

  get locator() {
    return this
      .identity
      .locator;
  }

  get seed() {
    return this
      .identity
      .seed;
  }

  get designation() {
    return this
      .identity
      .designation;
  }

  get name():
    string {

    return this
      .designation
      .name;
  }

  get proceduralCode():
    string {

    return this
      .designation
      .proceduralCode;
  }

  get massEarth():
    number {

    return this
      .physicalProperties
      .massEarth;
  }

  get radiusEarth():
    number {

    return this
      .physicalProperties
      .radiusEarth;
  }

  get meanDensityGramsPerCubicCentimeter():
    number {

    return this
      .physicalProperties
      .meanDensityGramsPerCubicCentimeter;
  }

  get surfaceGravityEarth():
    number {

    return this
      .physicalProperties
      .surfaceGravityEarth;
  }

  get semiMajorAxisPlanetRadii():
    number {

    return this
      .orbit
      .semiMajorAxisPlanetRadii;
  }

  get orbitalPeriodDays():
    number {

    return this
      .orbit
      .orbitalPeriodDays;
  }

  get tidalHeatingIndex01():
    number {

    return this
      .tidalState
      .tidalHeatingIndex01;
  }

  get tidalLockingIndex01():
    number {

    return this
      .tidalState
      .tidalLockingIndex01;
  }

  get rotationPeriodHours():
    number {

    return this
      .tidalState
      .rotationPeriodHours;
  }

  get isTidallyLocked():
    boolean {

    return this
      .tidalState
      .isTidallyLocked;
  }

  get atmosphereRegime() {
    return this
      .environmentState
      .atmosphereRegime;
  }

  get waterRegime() {
    return this
      .environmentState
      .waterRegime;
  }

  get geologyRegime() {
    return this
      .environmentState
      .geologyRegime;
  }

  get hasAtmosphere():
    boolean {

    return this
      .environmentState
      .hasAtmosphere;
  }

  get hasWater():
    boolean {

    return this
      .environmentState
      .hasWater;
  }

  get hasSubsurfaceOcean():
    boolean {

    return this
      .environmentState
      .hasSubsurfaceOcean;
  }

  get hasSurfaceLiquidWater():
    boolean {

    return this
      .environmentState
      .hasSurfaceLiquidWater;
  }

  get isGeologicallyActive():
    boolean {

    return this
      .environmentState
      .isGeologicallyActive;
  }

  get habitabilityRegime() {
    return this
      .habitabilityState
      .habitabilityRegime;
  }

  get overallHabitabilityIndex01():
    number {

    return this
      .habitabilityState
      .overallHabitabilityIndex01;
  }

  get isPotentiallyHabitable():
    boolean {

    return this
      .habitabilityState
      .isPotentiallyHabitable;
  }

  get supportsPotentialSurfaceHabitability():
    boolean {

    return this
      .habitabilityState
      .supportsPotentialSurfaceHabitability;
  }

  get supportsPotentialSubsurfaceHabitability():
    boolean {

    return this
      .habitabilityState
      .supportsPotentialSubsurfaceHabitability;
  }

  get hasGiantHostSpecialization():
    boolean {

    return this
      .giantMoonState
      .isApplicable;
  }

  get giantMoonOrbitalFamily() {
    return this
      .giantMoonState
      .orbitalFamily;
  }

  get giantMoonCompositionRegime() {
    return this
      .giantMoonState
      .compositionRegime;
  }

  get isLargeGiantMoon():
    boolean {

    return this
      .giantMoonState
      .isLargeMoon;
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

  return Math.abs(
    left -
    right,
  ) <=
    1e-9 *
    scale;
}
