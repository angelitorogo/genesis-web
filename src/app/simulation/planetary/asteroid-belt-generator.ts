import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
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
  AsteroidBeltPopulationProfile,
} from '../../domain/planetary/asteroid-belt-population-profile';

import {
  AsteroidBeltRegion,
} from '../../domain/planetary/asteroid-belt-region';

import {
  AsteroidBeltSystem,
} from '../../domain/planetary/asteroid-belt-system';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  AsteroidGenerator,
} from './asteroid-generator';

const V1_DOMAIN =
  utf8ToBytes(
    'GENESIS-ASTEROID-BELT-POPULATION-V1',
  );

const V1_MIN_RADIAL_RATIO =
  1.18;

const V1_INNER_PLANET_CLEARANCE_FACTOR =
  1.18;

const V1_OUTER_PLANET_CLEARANCE_FACTOR =
  0.82;

const V1_OUTER_BELT_INNER_CLEARANCE_FACTOR =
  1.22;

const V1_ENVELOPE_MARGIN_FACTOR =
  0.92;

const V1_REFERENCE_POPULATION_MASS_EARTH =
  0.2;

interface RadialInterval {
  readonly innerAu:
    number;
  readonly outerAu:
    number;
}

interface BeltDrawsV1 {
  readonly innerPresence:
    number;
  readonly outerPresence:
    number;
  readonly retainedFraction:
    number;
  readonly massSplit:
    number;
  readonly innerPeak:
    number;
  readonly outerPeak:
    number;
}

/**
 * Point-22.2/22.3 deterministic asteroid-belt and relevant-object materializer.
 *
 * V1 consumes the frozen point-17.7 residual-dust reservoir and the mature
 * point-18.3 radial architecture. It creates at most one INNER and one OUTER
 * statistical belt profile. Point 22.3 then materializes only a bounded set of
 * individually relevant/discoverable asteroids from those frozen profiles.
 *
 * Random-looking diversity is derived directly from the canonical SystemSeed
 * through SHA-256 domain separation. This consumes zero PRNG draws and derives
 * zero new hierarchical seeds.
 */
export class AsteroidBeltGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,
  ): AsteroidBeltSystem {

    assertSupportedGenerationKey(
      generationKey,
    );

    if (
      !generationKey.equals(
        planetarySystem
          .generationKey,
      )
    ) {
      throw new RangeError(
        'AsteroidBeltGenerator requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
      );
    }

    const draws =
      beltDrawsV1(
        planetarySystem
          .seed
          .normalizedValue,
      );

    const residualDustMassEarth =
      planetarySystem
        .formationBlueprint
        .residualDustMassEarth;

    const innerInterval =
      resolveInnerIntervalV1(
        planetarySystem,
      );

    const outerInterval =
      resolveOuterIntervalV1(
        planetarySystem,
      );

    const dustSupport =
      clamp01(
        Math.log1p(
          residualDustMassEarth,
        ) /
        Math.log1p(
          10,
        ),
      );

    const dynamicReworking =
      dynamicReworkingIndex01V1(
        planetarySystem,
      );

    const innerExistenceProbability =
      clamp01(
        0.20 +
        0.48 *
          dustSupport +
        0.18 *
          dynamicReworking,
      );

    const outerExistenceProbability =
      clamp01(
        0.34 +
        0.46 *
          dustSupport -
        0.08 *
          dynamicReworking,
      );

    const innerExists =
      innerInterval !==
        null &&
      residualDustMassEarth >
        0 &&
      draws.innerPresence <
        innerExistenceProbability;

    const outerExists =
      outerInterval !==
        null &&
      residualDustMassEarth >
        0 &&
      draws.outerPresence <
        outerExistenceProbability;

    const retainedFraction =
      clamp(
        0.003 +
          0.022 *
            dustSupport +
          0.010 *
            dynamicReworking +
          0.010 *
            draws.retainedFraction,
        0,
        0.05,
      );

    const retainedMassEarth =
      residualDustMassEarth *
      retainedFraction;

    const {
      innerMassEarth,
      outerMassEarth,
    } =
      splitRetainedMassV1(
        retainedMassEarth,
        innerExists,
        outerExists,
        draws.massSplit,
      );

    const innerBelt =
      materializeProfileV1(
        AsteroidBeltRegion.INNER,
        residualDustMassEarth,
        innerExists,
        innerInterval,
        innerMassEarth,
        draws.innerPeak,
      );

    const outerBelt =
      materializeProfileV1(
        AsteroidBeltRegion.OUTER,
        residualDustMassEarth,
        outerExists,
        outerInterval,
        outerMassEarth,
        draws.outerPeak,
      );

    const populationProfiles =
      Object.freeze([
        innerBelt,
        outerBelt,
      ]);

    const relevantAsteroids =
      AsteroidGenerator
        .generate(
          generationKey,
          planetarySystem,
          populationProfiles,
        );

    return new AsteroidBeltSystem(
      planetarySystem,
      innerBelt,
      outerBelt,
      relevantAsteroids,
    );
  }
}

function resolveInnerIntervalV1(
  planetarySystem:
    PlanetarySystem,
): RadialInterval | null {

  const envelope =
    generationEnvelopeV1(
      planetarySystem,
    );

  if (
    envelope ===
    null
  ) {
    return null;
  }

  const orbits =
    planetarySystem
      .orbits;

  if (
    orbits.length ===
    0
  ) {
    const logInner =
      Math.log(
        envelope.innerAu,
      );

    const logOuter =
      Math.log(
        envelope.outerAu,
      );

    return validIntervalOrNull(
      Math.exp(
        logInner +
          0.18 *
            (
              logOuter -
              logInner
            ),
      ),
      Math.exp(
        logInner +
          0.52 *
            (
              logOuter -
              logInner
            ),
      ),
    );
  }

  let best:
    RadialInterval | null =
    validIntervalOrNull(
      envelope.innerAu *
        1.08,
      orbits[0]
        .semiMajorAxisAu *
        V1_OUTER_PLANET_CLEARANCE_FACTOR,
    );

  for (
    let index = 0;
    index <
      orbits.length -
        1;
    index += 1
  ) {
    const candidate =
      validIntervalOrNull(
        orbits[index]
          .semiMajorAxisAu *
          V1_INNER_PLANET_CLEARANCE_FACTOR,
        orbits[index + 1]
          .semiMajorAxisAu *
          V1_OUTER_PLANET_CLEARANCE_FACTOR,
      );

    if (
      candidate !==
        null &&
      (
        best ===
          null ||
        radialRatio(
          candidate,
        ) >
        radialRatio(
          best,
        )
      )
    ) {
      best =
        candidate;
    }
  }

  return best;
}

function resolveOuterIntervalV1(
  planetarySystem:
    PlanetarySystem,
): RadialInterval | null {

  const envelope =
    generationEnvelopeV1(
      planetarySystem,
    );

  if (
    envelope ===
    null
  ) {
    return null;
  }

  const orbits =
    planetarySystem
      .orbits;

  if (
    orbits.length ===
    0
  ) {
    const logInner =
      Math.log(
        envelope.innerAu,
      );

    const logOuter =
      Math.log(
        envelope.outerAu,
      );

    return validIntervalOrNull(
      Math.exp(
        logInner +
          0.62 *
            (
              logOuter -
              logInner
            ),
      ),
      envelope.outerAu *
        V1_ENVELOPE_MARGIN_FACTOR,
    );
  }

  const outermost =
    orbits[
      orbits.length -
        1
    ];

  return validIntervalOrNull(
    outermost
      .semiMajorAxisAu *
      V1_OUTER_BELT_INNER_CLEARANCE_FACTOR,
    envelope.outerAu *
      V1_ENVELOPE_MARGIN_FACTOR,
  );
}

function generationEnvelopeV1(
  planetarySystem:
    PlanetarySystem,
): RadialInterval | null {

  const layout =
    planetarySystem
      .orbitalLayout;

  const inner =
    layout
      .generationInnerLimitAu ??
    planetarySystem
      .formationBlueprint
      .sourceInnerRadiusAu;

  const outer =
    layout
      .generationOuterLimitAu ??
    planetarySystem
      .formationBlueprint
      .sourceOuterRadiusAu;

  return validIntervalOrNull(
    inner,
    outer,
  );
}

function validIntervalOrNull(
  innerAu:
    number,

  outerAu:
    number,
): RadialInterval | null {

  if (
    !Number.isFinite(
      innerAu,
    ) ||
    !Number.isFinite(
      outerAu,
    ) ||
    innerAu <=
      0 ||
    outerAu <=
      innerAu ||
    outerAu /
      innerAu <
    V1_MIN_RADIAL_RATIO
  ) {
    return null;
  }

  return Object.freeze({
    innerAu,
    outerAu,
  });
}

function materializeProfileV1(
  region:
    AsteroidBeltRegion,

  sourceResidualDustMassEarth:
    number,

  exists:
    boolean,

  interval:
    RadialInterval | null,

  retainedMassEarth:
    number,

  peakDraw:
    number,
): AsteroidBeltPopulationProfile {

  if (
    !exists ||
    interval ===
      null ||
    retainedMassEarth <=
      0
  ) {
    return new AsteroidBeltPopulationProfile(
      region,
      sourceResidualDustMassEarth,
      false,
      null,
      null,
      null,
      null,
      0,
      0,
    );
  }

  const logInner =
    Math.log(
      interval.innerAu,
    );

  const logOuter =
    Math.log(
      interval.outerAu,
    );

  const peakFraction =
    0.35 +
    0.30 *
      peakDraw;

  const peakAu =
    Math.exp(
      logInner +
        peakFraction *
          (
            logOuter -
            logInner
          ),
    );

  return new AsteroidBeltPopulationProfile(
    region,
    sourceResidualDustMassEarth,
    true,
    interval.innerAu,
    interval.outerAu,
    peakAu,
    interval.outerAu -
      interval.innerAu,
    retainedMassEarth,
    populationIndex01V1(
      retainedMassEarth,
    ),
  );
}

function splitRetainedMassV1(
  totalMassEarth:
    number,

  innerExists:
    boolean,

  outerExists:
    boolean,

  splitDraw:
    number,
): {
  readonly innerMassEarth:
    number;
  readonly outerMassEarth:
    number;
} {

  if (
    !innerExists &&
    !outerExists
  ) {
    return Object.freeze({
      innerMassEarth:
        0,
      outerMassEarth:
        0,
    });
  }

  if (
    innerExists &&
    !outerExists
  ) {
    return Object.freeze({
      innerMassEarth:
        totalMassEarth,
      outerMassEarth:
        0,
    });
  }

  if (
    !innerExists &&
    outerExists
  ) {
    return Object.freeze({
      innerMassEarth:
        0,
      outerMassEarth:
        totalMassEarth,
    });
  }

  const innerFraction =
    0.35 +
    0.30 *
      splitDraw;

  const innerMassEarth =
    totalMassEarth *
    innerFraction;

  return Object.freeze({
    innerMassEarth,
    outerMassEarth:
      totalMassEarth -
      innerMassEarth,
  });
}

function populationIndex01V1(
  retainedMassEarth:
    number,
): number {

  if (
    retainedMassEarth <=
    0
  ) {
    return 0;
  }

  return clamp01(
    Math.log1p(
      retainedMassEarth /
        1e-5,
    ) /
      Math.log1p(
        V1_REFERENCE_POPULATION_MASS_EARTH /
          1e-5,
      ),
  );
}

function dynamicReworkingIndex01V1(
  planetarySystem:
    PlanetarySystem,
): number {

  const blueprint =
    planetarySystem
      .formationBlueprint;

  const eventCount =
    blueprint
      .sourceCollisionCount +
    blueprint
      .sourceMigratedBodyCount;

  return clamp01(
    eventCount /
      Math.max(
        1,
        blueprint
          .sourceCandidateCount,
      ),
  );
}

function radialRatio(
  interval:
    RadialInterval,
): number {

  return (
    interval.outerAu /
    interval.innerAu
  );
}

function beltDrawsV1(
  normalizedSystemSeed:
    string,
): BeltDrawsV1 {

  const digest =
    sha256
      .create()
      .update(
        V1_DOMAIN,
      )
      .update(
        hexToBytes(
          normalizedSystemSeed,
        ),
      )
      .digest();

  return Object.freeze({
    innerPresence:
      uint32UnitV1(
        digest,
        0,
      ),
    outerPresence:
      uint32UnitV1(
        digest,
        4,
      ),
    retainedFraction:
      uint32UnitV1(
        digest,
        8,
      ),
    massSplit:
      uint32UnitV1(
        digest,
        12,
      ),
    innerPeak:
      uint32UnitV1(
        digest,
        16,
      ),
    outerPeak:
      uint32UnitV1(
        digest,
        20,
      ),
  });
}

function uint32UnitV1(
  bytes:
    Uint8Array,

  offset:
    number,
): number {

  const value =
    (
      bytes[offset] *
        0x1000000 +
      bytes[offset + 1] *
        0x10000 +
      bytes[offset + 2] *
        0x100 +
      bytes[offset + 3]
    ) >>>
    0;

  return value /
    0x100000000;
}

function assertSupportedGenerationKey(
  generationKey:
    UniverseGenerationKey,
): void {

  if (
    generationKey
      .generatorVersion !==
    GeneratorVersion.V1
  ) {
    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }
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
