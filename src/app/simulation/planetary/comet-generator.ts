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
  CometIdentity,
} from '../../domain/planetary/comet-identity';

import {
  CometNucleusProperties,
} from '../../domain/planetary/comet-nucleus-properties';

import {
  CometOrbitalElements,
} from '../../domain/planetary/comet-orbital-elements';

import {
  CometPeriodRegime,
  cometPeriodRegimeV1,
} from '../../domain/planetary/comet-period-regime';

import {
  CometSystem,
} from '../../domain/planetary/comet-system';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

import {
  RelevantComet,
} from '../../domain/planetary/relevant-comet';

const V1_ID_DOMAIN =
  utf8ToBytes(
    'GENESIS-RELEVANT-COMET-ID-V1',
  );

const V1_PROPERTY_DOMAIN =
  utf8ToBytes(
    'GENESIS-RELEVANT-COMET-NUCLEUS-V1',
  );

const V1_RESERVOIR_DOMAIN =
  utf8ToBytes(
    'GENESIS-COMET-RESERVOIR-V1',
  );

const V1_ORBIT_DOMAIN =
  utf8ToBytes(
    'GENESIS-COMET-ORBIT-V1',
  );

const V1_MAX_RELEVANT_COMETS =
  8;

const V1_REFERENCE_RESIDUAL_DUST_MASS_EARTH =
  10;

const V1_REFERENCE_RADIAL_SPAN_RATIO =
  1_000;

const V1_MIN_RELEVANT_DIAMETER_KILOMETERS =
  1.5;

const V1_SHORT_PERIOD_MIN_YEARS =
  3;

const V1_SHORT_PERIOD_MAX_YEARS =
  199.5;

const V1_LONG_PERIOD_MIN_YEARS =
  200;

const V1_LONG_PERIOD_MAX_YEARS =
  5_000_000;

/**
 * Point-22.6 deterministic relevant-comet materializer.
 *
 * Point 22.5 identity/nucleus derivation remains bit-for-bit unchanged. Point
 * 22.6 adds one bound Keplerian-style orbit per relevant comet and classifies
 * it through the conventional 200-year short/long-period boundary. Orbital
 * entropy is SHA-256 domain-separated from the same frozen proceduralId: zero
 * PRNG draws and zero new hierarchical seeds. Distance-dependent activity is
 * deliberately evaluated separately by CometActivityEngine.
 */
export class CometGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,
  ): CometSystem {

    assertContext(
      generationKey,
      planetarySystem,
    );

    const residualDustMassEarth =
      planetarySystem
        .formationBlueprint
        .residualDustMassEarth;

    if (
      residualDustMassEarth ===
      0
    ) {
      return new CometSystem(
        planetarySystem,
        0,
        0,
        [],
      );
    }

    const reservoirSupportIndex01 =
      reservoirSupportIndex01V1(
        planetarySystem,
      );

    const presenceProbability =
      clamp01(
        0.12 +
        0.76 *
          reservoirSupportIndex01,
      );

    const presenceSample =
      systemSample01V1(
        planetarySystem,
        'PRESENCE',
      );

    if (
      presenceSample >=
      presenceProbability
    ) {
      return new CometSystem(
        planetarySystem,
        residualDustMassEarth,
        reservoirSupportIndex01,
        [],
      );
    }

    const relevantCount =
      clampInteger(
        1 +
          Math.floor(
            (
              V1_MAX_RELEVANT_COMETS -
              1
            ) *
              reservoirSupportIndex01,
          ),
        1,
        V1_MAX_RELEVANT_COMETS,
      );

    const comets:
      RelevantComet[] =
      [];

    for (
      let cometOrdinal = 1;
      cometOrdinal <=
        relevantCount;
      cometOrdinal += 1
    ) {
      comets.push(
        materializeCometV1(
          planetarySystem,
          reservoirSupportIndex01,
          cometOrdinal,
        ),
      );
    }

    return new CometSystem(
      planetarySystem,
      residualDustMassEarth,
      reservoirSupportIndex01,
      comets,
    );
  }
}

function reservoirSupportIndex01V1(
  planetarySystem:
    PlanetarySystem,
): number {

  const blueprint =
    planetarySystem
      .formationBlueprint;

  const dustSupport =
    clamp01(
      Math.log1p(
        blueprint
          .residualDustMassEarth,
      ) /
      Math.log1p(
        V1_REFERENCE_RESIDUAL_DUST_MASS_EARTH,
      ),
    );

  const radialRatio =
    Math.max(
      1,
      blueprint
        .sourceOuterRadiusAu /
      blueprint
        .sourceInnerRadiusAu,
    );

  const radialSupport =
    clamp01(
      Math.log(
        radialRatio,
      ) /
      Math.log(
        V1_REFERENCE_RADIAL_SPAN_RATIO,
      ),
    );

  const dynamicallyReworkedCount =
    blueprint
      .sourceMigratedBodyCount +
    blueprint
      .sourceCollisionCount;

  const dynamicSupport =
    clamp01(
      dynamicallyReworkedCount /
      Math.max(
        1,
        blueprint
          .sourceCandidateCount,
      ),
    );

  return clamp01(
    0.50 *
      dustSupport +
    0.25 *
      radialSupport +
    0.15 *
      dynamicSupport +
    0.10 *
      systemSample01V1(
        planetarySystem,
        'RESERVOIR',
      ),
  );
}

function materializeCometV1(
  planetarySystem:
    PlanetarySystem,

  reservoirSupportIndex01:
    number,

  cometOrdinal:
    number,
): RelevantComet {

  const identity =
    cometIdentityV1(
      planetarySystem,
      cometOrdinal,
    );

  const diameterCeilingKilometers =
    16 +
    54 *
      reservoirSupportIndex01;

  const diameterKilometers =
    Math.max(
      V1_MIN_RELEVANT_DIAMETER_KILOMETERS,
      diameterCeilingKilometers *
        cometOrdinal **
          -0.62 *
        (
          0.68 +
          0.32 *
            cometSample01V1(
              identity.proceduralId,
              'DIAMETER',
            )
        ),
    );

  const iceFraction01 =
    clamp(
      0.44 +
        0.36 *
          cometSample01V1(
            identity.proceduralId,
            'ICE',
          ) +
        0.08 *
          reservoirSupportIndex01,
      0.35,
      0.90,
    );

  const dustFraction01 =
    1 -
    iceFraction01;

  const porosityIndex01 =
    clamp(
      0.46 +
        0.34 *
          cometSample01V1(
            identity.proceduralId,
            'POROSITY',
          ),
      0.35,
      0.88,
    );

  const solidMixtureDensity =
    iceFraction01 *
      0.93 +
    dustFraction01 *
      2.20;

  const bulkDensityGramsPerCubicCentimeter =
    clamp(
      solidMixtureDensity *
        (
          1 -
          0.58 *
            porosityIndex01
        ),
      0.25,
      1.25,
    );

  const geometricAlbedo =
    clamp(
      0.025 +
        0.045 *
          cometSample01V1(
            identity.proceduralId,
            'ALBEDO',
          ),
      0.02,
      0.09,
    );

  const volatileRichnessIndex01 =
    clamp01(
      0.38 +
        0.48 *
          iceFraction01 +
        0.14 *
          cometSample01V1(
            identity.proceduralId,
            'VOLATILES',
          ),
    );

  const properties =
    new CometNucleusProperties(
      cometOrdinal,
      diameterKilometers,
      iceFraction01,
      dustFraction01,
      porosityIndex01,
      bulkDensityGramsPerCubicCentimeter,
      geometricAlbedo,
      volatileRichnessIndex01,
    );

  const orbit =
    cometOrbitV1(
      planetarySystem,
      identity.proceduralId,
      cometOrdinal,
    );

  return new RelevantComet(
    identity,
    properties,
    orbit,
  );
}

function cometOrbitV1(
  planetarySystem:
    PlanetarySystem,

  proceduralId:
    string,

  cometOrdinal:
    number,
): CometOrbitalElements {

  const gravitatingMassSolar =
    gravitatingMassSolarV1(
      planetarySystem,
    );

  const familySample =
    cometOrbitSample01V1(
      proceduralId,
      'PERIOD_FAMILY',
    );

  const requestedRegime =
    familySample <
      0.65
      ? CometPeriodRegime
          .SHORT_PERIOD
      : CometPeriodRegime
          .LONG_PERIOD;

  const orbitalPeriodYears =
    requestedRegime ===
      CometPeriodRegime
        .SHORT_PERIOD
      ? logRangeV1(
          V1_SHORT_PERIOD_MIN_YEARS,
          V1_SHORT_PERIOD_MAX_YEARS,
          cometOrbitSample01V1(
            proceduralId,
            'PERIOD',
          ),
        )
      : logRangeV1(
          V1_LONG_PERIOD_MIN_YEARS,
          V1_LONG_PERIOD_MAX_YEARS,
          cometOrbitSample01V1(
            proceduralId,
            'PERIOD',
          ),
        );

  const semiMajorAxisAu =
    (
      gravitatingMassSolar *
      orbitalPeriodYears **
        2
    ) **
      (1 / 3);

  const maximumPeriapsisAu =
    requestedRegime ===
      CometPeriodRegime
        .SHORT_PERIOD
      ? Math.min(
          5,
          0.72 *
            semiMajorAxisAu,
        )
      : Math.min(
          8,
          0.08 *
            semiMajorAxisAu,
        );

  const minimumPeriapsisAu =
    0.20;

  const periapsisAu =
    logRangeV1(
      minimumPeriapsisAu,
      Math.max(
        minimumPeriapsisAu,
        maximumPeriapsisAu,
      ),
      cometOrbitSample01V1(
        proceduralId,
        'PERIAPSIS',
      ),
    );

  const eccentricity =
    clamp(
      1 -
        periapsisAu /
          semiMajorAxisAu,
      0,
      0.999999999999,
    );

  const inclinationSample =
    cometOrbitSample01V1(
      proceduralId,
      'INCLINATION',
    );

  const inclinationDegrees =
    requestedRegime ===
      CometPeriodRegime
        .SHORT_PERIOD
      ? 85 *
        inclinationSample **
          1.6
      : Math.acos(
          1 -
            2 *
              inclinationSample,
        ) *
        180 /
        Math.PI;

  const periodRegime =
    cometPeriodRegimeV1(
      orbitalPeriodYears,
    );

  return new CometOrbitalElements(
    cometOrdinal,
    gravitatingMassSolar,
    semiMajorAxisAu,
    eccentricity,
    inclinationDegrees,
    360 *
      cometOrbitSample01V1(
        proceduralId,
        'NODE',
      ),
    360 *
      cometOrbitSample01V1(
        proceduralId,
        'ARG_PERIAPSIS',
      ),
    360 *
      cometOrbitSample01V1(
        proceduralId,
        'MEAN_ANOMALY',
      ),
    orbitalPeriodYears,
    periodRegime,
  );
}

function gravitatingMassSolarV1(
  planetarySystem:
    PlanetarySystem,
): number {

  const cachedMass =
    planetarySystem
      .orbitalPeriodLayout
      .gravitatingMassSolar;

  if (
    cachedMass !==
      null &&
    Number.isFinite(
      cachedMass,
    ) &&
    cachedMass >
      0
  ) {
    return cachedMass;
  }

  const primaryMassSolar =
    planetarySystem
      .formationBlueprint
      .centralMassSolar;

  if (
    !Number.isFinite(
      primaryMassSolar,
    ) ||
    primaryMassSolar <=
      0
  ) {
    throw new RangeError(
      'Point-22.6 comet orbits require the frozen positive central host mass.',
    );
  }

  if (
    planetarySystem
      .orbitalLayout
      .orbitTopology ===
    PlanetarySystemOrbitTopology
      .CIRCUMSTELLAR
  ) {
    return primaryMassSolar;
  }

  const secondaryMassSolar =
    planetarySystem
      .hostStellarSystem
      .secondaryCompanion
      ?.physicalProperties
      .initialMassSolar;

  if (
    secondaryMassSolar ===
      undefined ||
    !Number.isFinite(
      secondaryMassSolar,
    ) ||
    secondaryMassSolar <=
      0
  ) {
    throw new RangeError(
      'Point-22.6 circumbinary comet periods require the frozen secondary-component mass.',
    );
  }

  return (
    primaryMassSolar +
    secondaryMassSolar
  );
}

function cometOrbitSample01V1(
  proceduralId:
    string,

  label:
    string,
): number {

  const digest =
    sha256
      .create()
      .update(
        V1_ORBIT_DOMAIN,
      )
      .update(
        hexToBytes(
          proceduralId,
        ),
      )
      .update(
        utf8ToBytes(
          label,
        ),
      )
      .digest();

  return firstUint32Fraction01(
    digest,
  );
}

function logRangeV1(
  minimum:
    number,

  maximum:
    number,

  unit:
    number,
): number {

  if (
    maximum <=
    minimum
  ) {
    return minimum;
  }

  return Math.exp(
    Math.log(
      minimum,
    ) +
    (
      Math.log(
        maximum,
      ) -
      Math.log(
        minimum,
      )
    ) *
      unit,
  );
}

function cometIdentityV1(
  planetarySystem:
    PlanetarySystem,

  cometOrdinal:
    number,
): CometIdentity {

  const digest =
    sha256
      .create()
      .update(
        V1_ID_DOMAIN,
      )
      .update(
        hexToBytes(
          planetarySystem
            .seed
            .normalizedValue,
        ),
      )
      .update(
        uint32BigEndianBytes(
          cometOrdinal -
            1,
        ),
      )
      .digest();

  return new CometIdentity(
    planetarySystem.locator,
    planetarySystem.seed,
    cometOrdinal,
    bytesToHex(
      digest.slice(
        0,
        16,
      ),
    ).toUpperCase(),
  );
}

function systemSample01V1(
  planetarySystem:
    PlanetarySystem,

  label:
    string,
): number {

  const digest =
    sha256
      .create()
      .update(
        V1_RESERVOIR_DOMAIN,
      )
      .update(
        hexToBytes(
          planetarySystem
            .seed
            .normalizedValue,
        ),
      )
      .update(
        utf8ToBytes(
          label,
        ),
      )
      .digest();

  return firstUint32Fraction01(
    digest,
  );
}

function cometSample01V1(
  proceduralId:
    string,

  label:
    string,
): number {

  const digest =
    sha256
      .create()
      .update(
        V1_PROPERTY_DOMAIN,
      )
      .update(
        hexToBytes(
          proceduralId,
        ),
      )
      .update(
        utf8ToBytes(
          label,
        ),
      )
      .digest();

  return firstUint32Fraction01(
    digest,
  );
}

function firstUint32Fraction01(
  digest:
    Uint8Array,
): number {

  const value =
    (
      digest[0] *
        0x1000000 +
      digest[1] *
        0x10000 +
      digest[2] *
        0x100 +
      digest[3]
    ) >>>
    0;

  return (
    value /
    0x100000000
  );
}

function assertContext(
  generationKey:
    UniverseGenerationKey,

  planetarySystem:
    PlanetarySystem,
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
      planetarySystem
        .generationKey,
    )
  ) {
    throw new RangeError(
      'CometGenerator requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
    );
  }

  const blueprint =
    planetarySystem
      .formationBlueprint;

  if (
    !Number.isFinite(
      blueprint.sourceInnerRadiusAu,
    ) ||
    !Number.isFinite(
      blueprint.sourceOuterRadiusAu,
    ) ||
    blueprint.sourceInnerRadiusAu <=
      0 ||
    blueprint.sourceOuterRadiusAu <=
      blueprint.sourceInnerRadiusAu
  ) {
    throw new RangeError(
      'CometGenerator requires the frozen positive point-17.7 source-disk radial envelope.',
    );
  }
}

function uint32BigEndianBytes(
  value:
    number,
): Uint8Array {

  if (
    !Number.isInteger(
      value,
    ) ||
    value <
      0 ||
    value >
      0xFFFFFFFF
  ) {
    throw new RangeError(
      'Comet identity index must fit an unsigned 32-bit integer.',
    );
  }

  return Uint8Array.of(
    value >>>
      24,
    value >>>
      16,
    value >>>
      8,
    value,
  );
}

function clampInteger(
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

function clamp01(
  value:
    number,
): number {

  return clamp(
    value,
    0,
    1,
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
