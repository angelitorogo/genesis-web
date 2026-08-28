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
  type PlanetaryArchitectureSlot,
} from '../../domain/planetary/planetary-architecture-slot';

import {
  PlanetaryOrbitalElements,
} from '../../domain/planetary/planetary-orbital-elements';

import {
  type PlanetarySystemArchitecture,
} from '../../domain/planetary/planetary-system-architecture';

import {
  PlanetarySystemArchitectureRegime,
} from '../../domain/planetary/planetary-system-architecture-regime';

import {
  type PlanetarySystemFormationBlueprint,
} from '../../domain/planetary/planetary-system-formation-blueprint';

import {
  PlanetarySystemOrbitalLayout,
} from '../../domain/planetary/planetary-system-orbital-layout';

import {
  PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

import {
  type StellarSystem,
} from '../../domain/stellar/stellar-system';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  Sfc64Random,
} from '../random/sfc64-random';

const V1_ORBIT_RADIAL_BRANCH =
  utf8ToBytes(
    'GENESIS-PLANETARY-ORBIT-RADIAL-V1',
  );

const V1_ORBIT_SHAPE_BRANCH =
  utf8ToBytes(
    'GENESIS-PLANETARY-ORBIT-SHAPE-V1',
  );

const V1_ORBIT_ORIENTATION_BRANCH =
  utf8ToBytes(
    'GENESIS-PLANETARY-ORBIT-ORIENTATION-V1',
  );

const V1_BASE_RADIAL_RELAXATION_FRACTION =
  0.02;

const V1_EXCITATION_RADIAL_RELAXATION_FRACTION =
  0.10;

const V1_CONSOLIDATION_RADIAL_RELAXATION_FRACTION =
  0.03;

const V1_BASE_ECCENTRICITY_CAP =
  0.04;

const V1_EXCITATION_ECCENTRICITY_CAP =
  0.30;

const V1_CONSOLIDATION_ECCENTRICITY_CAP =
  0.06;

const V1_ABSOLUTE_ECCENTRICITY_CAP =
  0.42;

const V1_NON_CROSSING_ECCENTRICITY_FRACTION =
  0.42;

const V1_BASE_INCLINATION_DEGREES =
  0.6;

const V1_EXCITATION_INCLINATION_DEGREES =
  12;

const V1_CONSOLIDATION_INCLINATION_DEGREES =
  3;

const V1_CIRCUMBINARY_INCLINATION_FACTOR =
  0.65;

const V1_OPEN_CIRCUMBINARY_MIN_SPAN_RATIO =
  2;

const V1_OPEN_CIRCUMBINARY_SPAN_MARGIN =
  1.25;

const V1_BOUNDARY_EPSILON_FACTOR =
  1e-10;

interface OrbitalGenerationEnvelope {
  readonly innerAu:
    number;

  readonly outerAu:
    number;
}

interface PlanetaryOrbitDrawsV1 {
  readonly radialRelaxation:
    number;

  readonly eccentricity:
    number;

  readonly inclination:
    number;

  readonly longitudeOfAscendingNode:
    number;

  readonly argumentOfPeriapsis:
    number;
}

/**
 * Point-18.3 deterministic geometric-orbit materializer.
 *
 * It consumes the mature planet identities frozen by 18.2 and the existing
 * BodySeed of each slot. The inherited formation radius remains the physical
 * reference, with only modest V1 relaxation; circumbinary systems are projected
 * into the point-16.5 P-type envelope when necessary.
 *
 * V1 guarantees ordered, non-crossing baseline ellipses, but does not claim
 * long-term dynamical stability. That verdict remains point 18.5. Periods stay
 * absent until 18.4 and no time-dependent anomaly/phase is introduced here.
 */
export class PlanetarySystemOrbitalLayoutGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    stellarSystem:
      StellarSystem,

    formationBlueprint:
      PlanetarySystemFormationBlueprint,

    architecture:
      PlanetarySystemArchitecture,
  ): PlanetarySystemOrbitalLayout {

    if (
      generationKey.generatorVersion ===
      GeneratorVersion.V1
    ) {
      if (
        !generationKey.equals(
          stellarSystem.generationKey,
        )
      ) {
        throw new RangeError(
          'PlanetarySystemOrbitalLayoutGenerator requires the host StellarSystem to share the supplied UniverseGenerationKey.',
        );
      }

      return generateOrbitalLayoutV1(
        stellarSystem,
        formationBlueprint,
        architecture,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }
}

function generateOrbitalLayoutV1(
  stellarSystem:
    StellarSystem,

  formationBlueprint:
    PlanetarySystemFormationBlueprint,

  architecture:
    PlanetarySystemArchitecture,
): PlanetarySystemOrbitalLayout {

  if (
    architecture.regime ===
      PlanetarySystemArchitectureRegime.DYNAMICALLY_EXCLUDED
  ) {
    return new PlanetarySystemOrbitalLayout(
      stellarSystem.locator,
      architecture.orbitTopology,
      null,
      null,
      [],
    );
  }

  if (
    architecture.planetCount ===
      0 &&
    architecture.orbitTopology ===
      PlanetarySystemOrbitTopology.CIRCUMBINARY &&
    (
      stellarSystem.circumbinaryPlanetCompatibility ===
        null ||
      !stellarSystem.circumbinaryPlanetCompatibility
        .isCompatible
    )
  ) {
    return new PlanetarySystemOrbitalLayout(
      stellarSystem.locator,
      architecture.orbitTopology,
      null,
      null,
      [],
    );
  }

  const envelope =
    resolveOrbitalGenerationEnvelopeV1(
      stellarSystem,
      formationBlueprint,
      architecture,
    );

  if (
    architecture.planetCount ===
    0
  ) {
    return new PlanetarySystemOrbitalLayout(
      stellarSystem.locator,
      architecture.orbitTopology,
      envelope.innerAu,
      envelope.outerAu,
      [],
    );
  }

  const baseAxes =
    projectReferenceAxesIntoEnvelopeV1(
      architecture.planetSlots,
      architecture.orbitTopology,
      envelope,
    );

  const draws =
    architecture.planetSlots.map(
      slot =>
        orbitDrawsV1(
          slot.bodySeed,
        ),
    );

  const semiMajorAxes =
    relaxSemiMajorAxesV1(
      architecture.planetSlots,
      baseAxes,
      draws,
      envelope,
    );

  const eccentricities =
    generateEccentricitiesV1(
      architecture.planetSlots,
      semiMajorAxes,
      draws,
    );

  const orbits =
    architecture.planetSlots.map(
      (
        slot,
        index,
      ) =>
        materializeOrbitV1(
          slot,
          architecture.orbitTopology,
          semiMajorAxes[index],
          eccentricities[index],
          draws[index],
        ),
    );

  return new PlanetarySystemOrbitalLayout(
    stellarSystem.locator,
    architecture.orbitTopology,
    envelope.innerAu,
    envelope.outerAu,
    orbits,
  );
}

function resolveOrbitalGenerationEnvelopeV1(
  stellarSystem:
    StellarSystem,

  formationBlueprint:
    PlanetarySystemFormationBlueprint,

  architecture:
    PlanetarySystemArchitecture,
): OrbitalGenerationEnvelope {

  if (
    architecture.orbitTopology ===
    PlanetarySystemOrbitTopology.CIRCUMSTELLAR
  ) {
    return Object.freeze({
      innerAu:
        formationBlueprint
          .sourceInnerRadiusAu,
      outerAu:
        formationBlueprint
          .sourceOuterRadiusAu,
    });
  }

  const compatibility =
    stellarSystem
      .circumbinaryPlanetCompatibility;

  if (
    compatibility ===
      null ||
    !compatibility.isCompatible
  ) {
    throw new RangeError(
      'A non-excluded CIRCUMBINARY architecture requires the frozen point-16.5 compatible annulus.',
    );
  }

  const innerAu =
    compatibility
      .minimumStableSemiMajorAxisAu;

  const finiteOuter =
    compatibility
      .maximumStableSemiMajorAxisAu;

  if (
    finiteOuter !==
    null
  ) {
    return Object.freeze({
      innerAu,
      outerAu:
        finiteOuter,
    });
  }

  const referenceSpan =
    architecture
      .referenceRadialSpanRatio ??
    1;

  const outerAu =
    Math.max(
      formationBlueprint
        .sourceOuterRadiusAu,
      innerAu *
        Math.max(
          V1_OPEN_CIRCUMBINARY_MIN_SPAN_RATIO,
          referenceSpan *
            V1_OPEN_CIRCUMBINARY_SPAN_MARGIN,
        ),
    );

  return Object.freeze({
    innerAu,
    outerAu,
  });
}

function projectReferenceAxesIntoEnvelopeV1(
  slots:
    readonly PlanetaryArchitectureSlot[],

  topology:
    PlanetarySystemOrbitTopology,

  envelope:
    OrbitalGenerationEnvelope,
): readonly number[] {

  const references =
    slots.map(
      slot =>
        slot.referenceAssemblyRadiusAu,
    );

  if (
    topology ===
    PlanetarySystemOrbitTopology.CIRCUMSTELLAR
  ) {
    return Object.freeze([
      ...references,
    ]);
  }

  if (
    references.length ===
    1
  ) {
    return Object.freeze([
      clamp(
        references[0],
        envelope.innerAu,
        envelope.outerAu,
      ),
    ]);
  }

  const shiftedScale =
    Math.max(
      1,
      envelope.innerAu /
        references[0],
    );

  const shifted =
    references.map(
      radius =>
        radius *
        shiftedScale,
    );

  if (
    shifted[
      shifted.length -
        1
    ] <=
    envelope.outerAu
  ) {
    return Object.freeze(
      shifted,
    );
  }

  const logReferenceInner =
    Math.log(
      references[0],
    );

  const logReferenceOuter =
    Math.log(
      references[
        references.length -
          1
      ],
    );

  const logEnvelopeInner =
    Math.log(
      envelope.innerAu,
    );

  const logEnvelopeOuter =
    Math.log(
      envelope.outerAu,
    );

  const referenceLogSpan =
    logReferenceOuter -
    logReferenceInner;

  if (
    referenceLogSpan <=
    0
  ) {
    return Object.freeze(
      references.map(
        (
          _radius,
          index,
        ) =>
          Math.exp(
            lerp(
              logEnvelopeInner,
              logEnvelopeOuter,
              index /
                (
                  references.length -
                  1
                ),
            ),
          ),
      ),
    );
  }

  return Object.freeze(
    references.map(
      radius => {
        const normalized =
          (
            Math.log(
              radius,
            ) -
            logReferenceInner
          ) /
          referenceLogSpan;

        return Math.exp(
          lerp(
            logEnvelopeInner,
            logEnvelopeOuter,
            normalized,
          ),
        );
      },
    ),
  );
}

function relaxSemiMajorAxesV1(
  slots:
    readonly PlanetaryArchitectureSlot[],

  baseAxes:
    readonly number[],

  draws:
    readonly PlanetaryOrbitDrawsV1[],

  envelope:
    OrbitalGenerationEnvelope,
): readonly number[] {

  return Object.freeze(
    baseAxes.map(
      (
        baseAxis,
        index,
      ) => {
        const slot =
          slots[index];

        const consolidationFactor =
          Math.min(
            1,
            slot.phase18ConsolidationCount,
          );

        const relaxationFraction =
          V1_BASE_RADIAL_RELAXATION_FRACTION +
          V1_EXCITATION_RADIAL_RELAXATION_FRACTION *
            slot.inheritedDynamicalExcitationIndex01 +
          V1_CONSOLIDATION_RADIAL_RELAXATION_FRACTION *
            consolidationFactor;

        const logAmplitude =
          Math.log(
            1 +
            relaxationFraction,
          );

        const relaxed =
          baseAxis *
          Math.exp(
            lerp(
              -logAmplitude,
              logAmplitude,
              draws[index]
                .radialRelaxation,
            ),
          );

        const lower =
          index ===
            0
            ? envelope.innerAu
            : geometricMean(
                baseAxes[index -
                  1],
                baseAxis,
              );

        const upper =
          index ===
            baseAxes.length -
              1
            ? envelope.outerAu
            : geometricMean(
                baseAxis,
                baseAxes[index +
                  1],
              );

        const epsilon =
          Math.max(
            Number.EPSILON,
            (
              upper -
              lower
            ) *
              V1_BOUNDARY_EPSILON_FACTOR,
          );

        return clamp(
          relaxed,
          lower +
            epsilon,
          upper -
            epsilon,
        );
      },
    ),
  );
}

function generateEccentricitiesV1(
  slots:
    readonly PlanetaryArchitectureSlot[],

  semiMajorAxes:
    readonly number[],

  draws:
    readonly PlanetaryOrbitDrawsV1[],
): readonly number[] {

  return Object.freeze(
    slots.map(
      (
        slot,
        index,
      ) => {
        const consolidationFactor =
          Math.min(
            1,
            slot.phase18ConsolidationCount,
          );

        const excitationCap =
          Math.min(
            V1_ABSOLUTE_ECCENTRICITY_CAP,
            V1_BASE_ECCENTRICITY_CAP +
              V1_EXCITATION_ECCENTRICITY_CAP *
                slot.inheritedDynamicalExcitationIndex01 +
              V1_CONSOLIDATION_ECCENTRICITY_CAP *
                consolidationFactor,
          );

        const geometricCap =
          nonCrossingEccentricityCapV1(
            semiMajorAxes,
            index,
          );

        const cap =
          Math.min(
            excitationCap,
            geometricCap,
          );

        return cap *
          draws[index]
            .eccentricity **
            1.5;
      },
    ),
  );
}

function nonCrossingEccentricityCapV1(
  axes:
    readonly number[],

  index:
    number,
): number {

  let cap =
    V1_ABSOLUTE_ECCENTRICITY_CAP;

  if (
    index >
    0
  ) {
    cap =
      Math.min(
        cap,
        V1_NON_CROSSING_ECCENTRICITY_FRACTION *
          normalizedAxisGap(
            axes[index -
              1],
            axes[index],
          ),
      );
  }

  if (
    index <
    axes.length -
      1
  ) {
    cap =
      Math.min(
        cap,
        V1_NON_CROSSING_ECCENTRICITY_FRACTION *
          normalizedAxisGap(
            axes[index],
            axes[index +
              1],
          ),
      );
  }

  return Math.max(
    0,
    cap,
  );
}

function materializeOrbitV1(
  slot:
    PlanetaryArchitectureSlot,

  topology:
    PlanetarySystemOrbitTopology,

  semiMajorAxisAu:
    number,

  eccentricity:
    number,

  draws:
    PlanetaryOrbitDrawsV1,
): PlanetaryOrbitalElements {

  const consolidationFactor =
    Math.min(
      1,
      slot.phase18ConsolidationCount,
    );

  let maximumInclinationDegrees =
    V1_BASE_INCLINATION_DEGREES +
    V1_EXCITATION_INCLINATION_DEGREES *
      slot.inheritedDynamicalExcitationIndex01 +
    V1_CONSOLIDATION_INCLINATION_DEGREES *
      consolidationFactor;

  if (
    topology ===
    PlanetarySystemOrbitTopology.CIRCUMBINARY
  ) {
    maximumInclinationDegrees *=
      V1_CIRCUMBINARY_INCLINATION_FACTOR;
  }

  return new PlanetaryOrbitalElements(
    slot.planetOrdinal,
    slot.bodyLocator,
    slot.bodySeed,
    semiMajorAxisAu,
    eccentricity,
    maximumInclinationDegrees *
      draws.inclination **
        1.5,
    360 *
      draws.longitudeOfAscendingNode,
    360 *
      draws.argumentOfPeriapsis,
  );
}

function orbitDrawsV1(
  bodySeed:
    BodySeed,
): PlanetaryOrbitDrawsV1 {

  const radialRandom =
    randomForBodyBranchV1(
      bodySeed,
      V1_ORBIT_RADIAL_BRANCH,
    );

  const shapeRandom =
    randomForBodyBranchV1(
      bodySeed,
      V1_ORBIT_SHAPE_BRANCH,
    );

  const orientationRandom =
    randomForBodyBranchV1(
      bodySeed,
      V1_ORBIT_ORIENTATION_BRANCH,
    );

  return Object.freeze({
    radialRelaxation:
      radialRandom.nextDouble(),
    eccentricity:
      shapeRandom.nextDouble(),
    inclination:
      shapeRandom.nextDouble(),
    longitudeOfAscendingNode:
      orientationRandom.nextDouble(),
    argumentOfPeriapsis:
      orientationRandom.nextDouble(),
  });
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
          bodySeed
            .normalizedValue,
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
      `Cannot format normalized 128-bit seed: ${normalized}.`,
    );
  }

  return UniverseSeed.parse(
    canonical,
  );
}

function normalizedAxisGap(
  inner:
    number,

  outer:
    number,
): number {

  return (
    outer -
    inner
  ) /
  (
    outer +
    inner
  );
}

function geometricMean(
  first:
    number,

  second:
    number,
): number {

  return Math.sqrt(
    first *
    second,
  );
}

function clamp(
  value:
    number,

  min:
    number,

  max:
    number,
): number {

  if (
    max <
    min
  ) {
    return (
      min +
      max
    ) /
    2;
  }

  return Math.min(
    max,
    Math.max(
      min,
      value,
    ),
  );
}

function lerp(
  min:
    number,

  max:
    number,

  value:
    number,
): number {

  return min +
    (
      max -
      min
    ) *
    value;
}
