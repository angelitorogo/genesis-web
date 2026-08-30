import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
  bytesToHex,
  hexToBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type BodySeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  ATMOSPHERE_V1_DEEP_ENVELOPE_REFERENCE_PRESSURE_PASCAL,
  ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
  AtmosphereBulkProperties,
  idealGasDensityKilogramsPerCubicMeter,
} from '../../domain/planetary/atmosphere-bulk-properties';

import {
  AtmosphereGas,
  atmosphereGasMolarMassGramsPerMole,
} from '../../domain/planetary/atmosphere-gas';

import {
  AtmosphereGasComponent,
} from '../../domain/planetary/atmosphere-gas-component';

import {
  AtmospherePressureRegime,
  atmospherePressureRegimeForSurfacePressurePascal,
} from '../../domain/planetary/atmosphere-pressure-regime';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  Sfc64Random,
} from '../random/sfc64-random';

const V1_ATMOSPHERE_PRESSURE_BRANCH =
  utf8ToBytes(
    'GENESIS-ATMOSPHERE-BULK-PRESSURE-V1',
  );

const V1_ATMOSPHERE_CHEMISTRY_BRANCH =
  utf8ToBytes(
    'GENESIS-ATMOSPHERE-BULK-CHEMISTRY-V1',
  );

const V1_VACUUM_MAX_ENVELOPE_FRACTION =
  1e-8;

const V1_VACUUM_MAX_ICE_BEARING_INTERIOR_FRACTION =
  0.002;

interface PressureRangeV1 {
  readonly minimumPascal:
    number;

  readonly maximumPascal:
    number;
}

interface GasWeightV1 {
  readonly gas:
    AtmosphereGas;

  readonly weight:
    number;
}

/**
 * Point-20.2 deterministic baseline pressure/density/gas generator.
 *
 * V1 uses two independent branches of the already-existing BodySeed: one for
 * baseline pressure scatter and one for chemistry scatter. No AtmosphereSeed is
 * introduced. Solid-world pressure is a pre-point-20.3 source state; later
 * retention/loss may reduce or reshape it without rewriting this frozen input.
 *
 * Density is an ideal-gas reference value at an explicit fixed temperature, not
 * a climate prediction. Point 20.5 remains the owner of equilibrium/surface
 * temperature. Deep-envelope worlds expose no solid surface pressure and use a
 * fixed 1-atm reference level solely for their reference density.
 */
export class AtmosphereBulkPropertiesGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    planet:
      Planet,
  ): AtmosphereBulkProperties {

    assertGenerationContext(
      generationKey,
      planet,
    );

    return generateBulkPropertiesV1(
      planet,
    );
  }

  static generateAll(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    planets:
      readonly Planet[],
  ): readonly AtmosphereBulkProperties[] {

    if (
      !generationKey.equals(
        planetarySystem.generationKey,
      )
    ) {
      throw new RangeError(
        'AtmosphereBulkPropertiesGenerator requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
      );
    }

    if (
      planets.length !==
      planetarySystem.planetCount
    ) {
      throw new RangeError(
        'AtmosphereBulkPropertiesGenerator.generateAll requires exactly one Planet for every mature planet in the supplied PlanetarySystem.',
      );
    }

    for (
      let index = 0;
      index <
        planets.length;
      index += 1
    ) {
      const planet =
        planets[index];

      assertGenerationContext(
        generationKey,
        planet,
      );

      if (
        planet.hostPlanetarySystem !==
        planetarySystem
      ) {
        throw new RangeError(
          'AtmosphereBulkPropertiesGenerator.generateAll requires every Planet to retain the exact supplied PlanetarySystem aggregate.',
        );
      }

      if (
        planet.planetOrdinal !==
        index +
          1
      ) {
        throw new RangeError(
          'AtmosphereBulkPropertiesGenerator.generateAll requires Planets in frozen contiguous planetOrdinal order.',
        );
      }
    }

    return Object.freeze(
      planets.map(
        planet =>
          generateBulkPropertiesV1(
            planet,
          ),
      ),
    );
  }
}

function assertGenerationContext(
  generationKey:
    UniverseGenerationKey,

  planet:
    Planet,
): void {

  if (
    generationKey.generatorVersion !==
    GeneratorVersion.V1
  ) {
    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  if (
    !generationKey.equals(
      planet.generationKey,
    )
  ) {
    throw new RangeError(
      'AtmosphereBulkPropertiesGenerator requires the Planet to share the supplied UniverseGenerationKey.',
    );
  }

  if (
    !planet.isTypePhysicallyCoherent
  ) {
    throw new RangeError(
      'AtmosphereBulkPropertiesGenerator requires a point-19.7 physically coherent Planet.',
    );
  }
}

function generateBulkPropertiesV1(
  planet:
    Planet,
): AtmosphereBulkProperties {

  const iceBearingInteriorFraction01 =
    planet.internalComposition
      .iceBearingFractionOfSolids01;

  const pressureRandom =
    randomForBodyBranchV1(
      planet.seed,
      V1_ATMOSPHERE_PRESSURE_BRANCH,
    );

  const chemistryRandom =
    randomForBodyBranchV1(
      planet.seed,
      V1_ATMOSPHERE_CHEMISTRY_BRANCH,
    );

  const deepEnvelope =
    isDeepEnvelopeType(
      planet.planetType,
    );

  const vacuum =
    !deepEnvelope &&
    planet.physicalProperties
      .envelopeMassFraction01 <=
      V1_VACUUM_MAX_ENVELOPE_FRACTION &&
    iceBearingInteriorFraction01 <=
      V1_VACUUM_MAX_ICE_BEARING_INTERIOR_FRACTION &&
    (
      planet.planetType ===
        PlanetType.ROCKY ||
      planet.planetType ===
        PlanetType.DESERT
    );

  if (
    vacuum
  ) {
    return new AtmosphereBulkProperties(
      planet.planetOrdinal,
      planet.locator,
      planet.seed,
      planet.planetType,
      planet.massEarth,
      planet.radiusEarth,
      planet.surfaceGravityEarth,
      planet.physicalProperties
        .envelopeMassFraction01,
      iceBearingInteriorFraction01,
      planet.typeClassification
        .referenceMeanInsolationEarth,
      planet.referenceBondAlbedo01,
      AtmospherePressureRegime.VACUUM,
      0,
      0,
      ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
      0,
      null,
      [],
    );
  }

  const gasComponents =
    gasComponentsV1(
      planet.planetType,
      chemistryRandom,
    );

  const meanMolarMassGramsPerMole =
    meanMolarMassV1(
      gasComponents,
    );

  if (
    deepEnvelope
  ) {
    const referenceDensity =
      idealGasDensityKilogramsPerCubicMeter(
        ATMOSPHERE_V1_DEEP_ENVELOPE_REFERENCE_PRESSURE_PASCAL,
        ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
        meanMolarMassGramsPerMole,
      );

    return new AtmosphereBulkProperties(
      planet.planetOrdinal,
      planet.locator,
      planet.seed,
      planet.planetType,
      planet.massEarth,
      planet.radiusEarth,
      planet.surfaceGravityEarth,
      planet.physicalProperties
        .envelopeMassFraction01,
      iceBearingInteriorFraction01,
      planet.typeClassification
        .referenceMeanInsolationEarth,
      planet.referenceBondAlbedo01,
      AtmospherePressureRegime.DEEP_ENVELOPE,
      null,
      ATMOSPHERE_V1_DEEP_ENVELOPE_REFERENCE_PRESSURE_PASCAL,
      ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
      referenceDensity,
      meanMolarMassGramsPerMole,
      gasComponents,
    );
  }

  const surfacePressurePascal =
    solidSurfacePressurePascalV1(
      planet,
      iceBearingInteriorFraction01,
      pressureRandom.nextDouble(),
    );

  const pressureRegime =
    atmospherePressureRegimeForSurfacePressurePascal(
      surfacePressurePascal,
    );

  const referenceDensity =
    idealGasDensityKilogramsPerCubicMeter(
      surfacePressurePascal,
      ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
      meanMolarMassGramsPerMole,
    );

  return new AtmosphereBulkProperties(
    planet.planetOrdinal,
    planet.locator,
    planet.seed,
    planet.planetType,
    planet.massEarth,
    planet.radiusEarth,
    planet.surfaceGravityEarth,
    planet.physicalProperties
      .envelopeMassFraction01,
    iceBearingInteriorFraction01,
    planet.typeClassification
      .referenceMeanInsolationEarth,
    planet.referenceBondAlbedo01,
    pressureRegime,
    surfacePressurePascal,
    surfacePressurePascal,
    ATMOSPHERE_V1_DENSITY_REFERENCE_TEMPERATURE_KELVIN,
    referenceDensity,
    meanMolarMassGramsPerMole,
    gasComponents,
  );
}

function solidSurfacePressurePascalV1(
  planet:
    Planet,

  iceBearingInteriorFraction01:
    number,

  draw:
    number,
): number {

  const range =
    pressureRangeForTypeV1(
      planet.planetType,
    );

  const logarithmicBasePressure =
    logarithmicLerp(
      range.minimumPascal,
      range.maximumPascal,
      draw,
    );

  const volatileReservoirFactor =
    clamp(
      0.25 +
        2.5 *
          iceBearingInteriorFraction01 +
        50 *
          planet.physicalProperties
            .envelopeMassFraction01,
      0.08,
      5,
    );

  const gravityFactor =
    clamp(
      planet.surfaceGravityEarth **
        0.6,
      0.35,
      2.75,
    );

  const pressure =
    logarithmicBasePressure *
    volatileReservoirFactor *
    gravityFactor;

  return clamp(
    pressure,
    1e-3,
    1e9,
  );
}

function pressureRangeForTypeV1(
  planetType:
    PlanetType,
): PressureRangeV1 {

  switch (
    planetType
  ) {
    case PlanetType.ROCKY:
      return {
        minimumPascal:
          10,
        maximumPascal:
          300_000,
      };

    case PlanetType.SUPER_EARTH:
      return {
        minimumPascal:
          2_000,
        maximumPascal:
          3_000_000,
      };

    case PlanetType.DESERT:
      return {
        minimumPascal:
          100,
        maximumPascal:
          8_000_000,
      };

    case PlanetType.OCEAN:
      return {
        minimumPascal:
          20_000,
        maximumPascal:
          5_000_000,
      };

    case PlanetType.ICE:
      return {
        minimumPascal:
          1,
        maximumPascal:
          200_000,
      };

    case PlanetType.VOLCANIC:
      return {
        minimumPascal:
          10_000,
        maximumPascal:
          10_000_000,
      };

    case PlanetType.MINI_NEPTUNE:
    case PlanetType.GAS_GIANT:
    case PlanetType.ICE_GIANT:
      throw new RangeError(
        'Deep-envelope planet types do not use a point-20.2 solid surface-pressure range.',
      );
  }
}

function gasComponentsV1(
  planetType:
    PlanetType,

  random:
    Sfc64Random,
): readonly AtmosphereGasComponent[] {

  const template =
    gasTemplateForTypeV1(
      planetType,
    );

  const scattered =
    template.map(
      component => ({
        gas:
          component.gas,
        weight:
          component.weight *
          (
            0.85 +
            random.nextDouble() *
              0.30
          ),
      }),
    );

  const totalWeight =
    scattered.reduce(
      (
        total,
        component,
      ) =>
        total +
        component.weight,
      0,
    );

  return Object.freeze(
    scattered.map(
      component =>
        new AtmosphereGasComponent(
          component.gas,
          component.weight /
            totalWeight,
        ),
    ),
  );
}

function gasTemplateForTypeV1(
  planetType:
    PlanetType,
): readonly GasWeightV1[] {

  switch (
    planetType
  ) {
    case PlanetType.ROCKY:
      return [
        gasWeight(AtmosphereGas.NITROGEN, 0.55),
        gasWeight(AtmosphereGas.CARBON_DIOXIDE, 0.25),
        gasWeight(AtmosphereGas.WATER_VAPOR, 0.08),
        gasWeight(AtmosphereGas.ARGON, 0.08),
        gasWeight(AtmosphereGas.CARBON_MONOXIDE, 0.02),
        gasWeight(AtmosphereGas.SULFUR_DIOXIDE, 0.02),
      ];

    case PlanetType.SUPER_EARTH:
      return [
        gasWeight(AtmosphereGas.NITROGEN, 0.48),
        gasWeight(AtmosphereGas.CARBON_DIOXIDE, 0.22),
        gasWeight(AtmosphereGas.WATER_VAPOR, 0.12),
        gasWeight(AtmosphereGas.ARGON, 0.06),
        gasWeight(AtmosphereGas.HYDROGEN, 0.08),
        gasWeight(AtmosphereGas.HELIUM, 0.04),
      ];

    case PlanetType.DESERT:
      return [
        gasWeight(AtmosphereGas.CARBON_DIOXIDE, 0.60),
        gasWeight(AtmosphereGas.NITROGEN, 0.25),
        gasWeight(AtmosphereGas.ARGON, 0.08),
        gasWeight(AtmosphereGas.WATER_VAPOR, 0.02),
        gasWeight(AtmosphereGas.CARBON_MONOXIDE, 0.03),
        gasWeight(AtmosphereGas.SULFUR_DIOXIDE, 0.02),
      ];

    case PlanetType.OCEAN:
      return [
        gasWeight(AtmosphereGas.NITROGEN, 0.60),
        gasWeight(AtmosphereGas.WATER_VAPOR, 0.20),
        gasWeight(AtmosphereGas.CARBON_DIOXIDE, 0.08),
        gasWeight(AtmosphereGas.ARGON, 0.05),
        gasWeight(AtmosphereGas.HYDROGEN, 0.03),
        gasWeight(AtmosphereGas.METHANE, 0.02),
        gasWeight(AtmosphereGas.OXYGEN, 0.02),
      ];

    case PlanetType.ICE:
      return [
        gasWeight(AtmosphereGas.NITROGEN, 0.35),
        gasWeight(AtmosphereGas.METHANE, 0.20),
        gasWeight(AtmosphereGas.CARBON_DIOXIDE, 0.15),
        gasWeight(AtmosphereGas.AMMONIA, 0.12),
        gasWeight(AtmosphereGas.HYDROGEN, 0.10),
        gasWeight(AtmosphereGas.HELIUM, 0.05),
        gasWeight(AtmosphereGas.WATER_VAPOR, 0.03),
      ];

    case PlanetType.VOLCANIC:
      return [
        gasWeight(AtmosphereGas.CARBON_DIOXIDE, 0.45),
        gasWeight(AtmosphereGas.SULFUR_DIOXIDE, 0.20),
        gasWeight(AtmosphereGas.WATER_VAPOR, 0.15),
        gasWeight(AtmosphereGas.NITROGEN, 0.10),
        gasWeight(AtmosphereGas.CARBON_MONOXIDE, 0.08),
        gasWeight(AtmosphereGas.ARGON, 0.02),
      ];

    case PlanetType.MINI_NEPTUNE:
      return [
        gasWeight(AtmosphereGas.HYDROGEN, 0.72),
        gasWeight(AtmosphereGas.HELIUM, 0.20),
        gasWeight(AtmosphereGas.WATER_VAPOR, 0.03),
        gasWeight(AtmosphereGas.METHANE, 0.03),
        gasWeight(AtmosphereGas.AMMONIA, 0.02),
      ];

    case PlanetType.GAS_GIANT:
      return [
        gasWeight(AtmosphereGas.HYDROGEN, 0.74),
        gasWeight(AtmosphereGas.HELIUM, 0.24),
        gasWeight(AtmosphereGas.METHANE, 0.008),
        gasWeight(AtmosphereGas.AMMONIA, 0.006),
        gasWeight(AtmosphereGas.WATER_VAPOR, 0.006),
      ];

    case PlanetType.ICE_GIANT:
      return [
        gasWeight(AtmosphereGas.HYDROGEN, 0.58),
        gasWeight(AtmosphereGas.HELIUM, 0.18),
        gasWeight(AtmosphereGas.METHANE, 0.10),
        gasWeight(AtmosphereGas.WATER_VAPOR, 0.08),
        gasWeight(AtmosphereGas.AMMONIA, 0.06),
      ];
  }
}

function gasWeight(
  gas:
    AtmosphereGas,

  weight:
    number,
): GasWeightV1 {

  return {
    gas,
    weight,
  };
}

function meanMolarMassV1(
  gasComponents:
    readonly AtmosphereGasComponent[],
): number {

  return gasComponents.reduce(
    (
      total,
      component,
    ) =>
      total +
      component.moleFraction01 *
        atmosphereGasMolarMassGramsPerMole(
          component.gas,
        ),
    0,
  );
}

function isDeepEnvelopeType(
  planetType:
    PlanetType,
): boolean {

  return (
    planetType ===
      PlanetType.MINI_NEPTUNE ||
    planetType ===
      PlanetType.GAS_GIANT ||
    planetType ===
      PlanetType.ICE_GIANT
  );
}

function logarithmicLerp(
  minimum:
    number,

  maximum:
    number,

  fraction:
    number,
): number {

  const logarithmicMinimum =
    Math.log(
      minimum,
    );

  const logarithmicMaximum =
    Math.log(
      maximum,
    );

  return Math.exp(
    logarithmicMinimum +
    (
      logarithmicMaximum -
      logarithmicMinimum
    ) *
      fraction,
  );
}

function clamp(
  value:
    number,

  minimum:
    number,

  maximum:
    number,
): number {

  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
}

function randomForBodyBranchV1(
  bodySeed:
    BodySeed,

  branch:
    Uint8Array,
): Sfc64Random {

  const digest =
    sha256
      .create()
      .update(
        branch,
      )
      .update(
        hexToBytes(
          bodySeed.normalizedValue,
        ),
      )
      .digest();

  const normalized =
    bytesToHex(
      digest.slice(
        0,
        16,
      ),
    )
      .toUpperCase();

  return new Sfc64Random(
    universeSeedFromNormalized128(
      normalized,
    ),
  );
}

function universeSeedFromNormalized128(
  normalized:
    string,
): UniverseSeed {

  const canonical =
    normalized
      .match(
        /.{4}/gu,
      )
      ?.join(
        '-',
      );

  if (
    canonical ===
    undefined
  ) {
    throw new RangeError(
      'Unable to canonicalize deterministic point-20.2 atmosphere branch seed.',
    );
  }

  return UniverseSeed.parse(
    canonical,
  );
}
