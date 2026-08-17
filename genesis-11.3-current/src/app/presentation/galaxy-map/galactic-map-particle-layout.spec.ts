import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ExternalGalaxyPreliminaryInformationGenerator,
} from '../../simulation/observation/galaxy/external-galaxy-preliminary-information-generator';

import {
  GalaxyGenerator,
} from '../../simulation/universe/galaxy-generator';

import {
  GalaxyVisualStructureGenerator,
} from '../../simulation/universe/galaxy-visual-structure-generator';

import {
  GalacticMapModel,
} from './galactic-map-model';

import {
  GalacticMapParticleLayoutGenerator,
  type GalacticMapParticleLayout,
} from './galactic-map-particle-layout';

import {
  createGalacticMapParticleRenderInput,
} from './galactic-map-particle-render-input';

const CORE_PARTICLE_COUNT =
  20_000;

const BODY_PARTICLE_COUNT =
  92_000;

const DWARF_STELLAR_BODY_REINFORCEMENT_PARTICLE_COUNT =
  320_000;

const IRREGULAR_STELLAR_BODY_REINFORCEMENT_PARTICLE_COUNT =
  350_000;

const ELLIPTICAL_PARTICLE_COUNT =
  124_000;

const SPIRAL_PARTICLE_COUNT =
  182_000;

const BARRED_SPIRAL_PARTICLE_COUNT =
  186_000;

const BARRED_SPIRAL_ARM_REINFORCEMENT_PARTICLE_COUNT =
  54_000;

const BAR_PARTICLE_COUNT =
  8_000;

const SPIRAL_ARM_REINFORCEMENT_PARTICLE_COUNT =
  58_000;

const DWARF_PARTICLE_COUNT =
  444_000;

const IRREGULAR_PARTICLE_COUNT =
  474_000;

describe(
  'GalacticMapParticleLayoutGenerator',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    function model(
      galaxyIndex:
        bigint,
    ): GalacticMapModel {

      const galaxy =
        GalaxyGenerator.generate(
          generationKey,
          galaxyIndex,
        );

      return new GalacticMapModel(
        generationKey,
        galaxyIndex,
        ExternalGalaxyPreliminaryInformationGenerator
          .generate(
            generationKey,
            galaxyIndex,
            DiscoveryState.DISCOVERED,
          ),
        GalaxyVisualStructureGenerator
          .generate(
            galaxy,
          ),
        galaxy.type,
      );
    }

    it(
      'should generate exactly the same GPU buffers for the same galactic map model',
      () => {
        const target =
          model(
            0n,
          );

        const first =
          GalacticMapParticleLayoutGenerator
            .generate(
              target,
            );

        const second =
          GalacticMapParticleLayoutGenerator
            .generate(
              target,
            );

        expect(
          second.count,
        ).toBe(
          first.count,
        );

        expect(
          second.positions,
        ).toEqual(
          first.positions,
        );

        expect(
          second.colors,
        ).toEqual(
          first.colors,
        );

        expect(
          second.sizes,
        ).toEqual(
          first.sizes,
        );

        expect(
          second.opacities,
        ).toEqual(
          first.opacities,
        );
      },15_000,
    );

    it(
      'should preserve exact frozen GPU buffers when the same render input is structured-clone safe for point-10.9',
      () => {
        const target =
          model(
            0n,
          );

        const synchronous =
          GalacticMapParticleLayoutGenerator
            .generate(
              target,
            );

        const workerInput =
          structuredClone(
            createGalacticMapParticleRenderInput(
              target,
            ),
          );

        const workerEquivalent =
          GalacticMapParticleLayoutGenerator
            .generateFromRenderInput(
              workerInput,
            );

        expect(
          workerEquivalent.count,
        ).toBe(
          synchronous.count,
        );

        expect(
          workerEquivalent.positions,
        ).toEqual(
          synchronous.positions,
        );

        expect(
          workerEquivalent.colors,
        ).toEqual(
          synchronous.colors,
        );

        expect(
          workerEquivalent.sizes,
        ).toEqual(
          synchronous.sizes,
        );

        expect(
          workerEquivalent.opacities,
        ).toEqual(
          synchronous.opacities,
        );
      },
      15_000,
    );

    it(
      'should create the denser point-10.1 visual field without materializing star entities',
      () => {
        const layout =
          GalacticMapParticleLayoutGenerator
            .generate(
              model(
                0n,
              ),
            );

        expect(
          layout.count,
        ).toBe(
          ELLIPTICAL_PARTICLE_COUNT,
        );

        expect(
          layout.positions,
        ).toHaveLength(
          layout.count *
          3,
        );

        expect(
          layout.colors,
        ).toHaveLength(
          layout.count *
          3,
        );

        expect(
          layout.sizes,
        ).toHaveLength(
          layout.count,
        );

        expect(
          layout.opacities,
        ).toHaveLength(
          layout.count,
        );
      },
    );

    it(
      'should keep the final spiral-family visual budgets dense while preserving their distinct central structures',
      () => {
        const ellipticalModel =
          model(
            0n,
          );

        const barredModel =
          model(
            1n,
          );

        const spiralModel =
          model(
            3n,
          );

        const elliptical =
          GalacticMapParticleLayoutGenerator
            .generate(
              ellipticalModel,
            );

        const barred =
          GalacticMapParticleLayoutGenerator
            .generate(
              barredModel,
            );

        const spiral =
          GalacticMapParticleLayoutGenerator
            .generate(
              spiralModel,
            );

        expect(
          elliptical.count,
        ).toBe(
          ELLIPTICAL_PARTICLE_COUNT,
        );

        expect(
          barred.count,
        ).toBe(
          BARRED_SPIRAL_PARTICLE_COUNT,
        );

        expect(
          spiral.count,
        ).toBe(
          SPIRAL_PARTICLE_COUNT,
        );

        expect(
          barred.count,
        ).toBeGreaterThan(
          spiral.count,
        );

        expect(
          barredModel
            .visualStructure
            ?.bar,
        ).not.toBeNull();

        expect(
          spiralModel
            .visualStructure
            ?.bar,
        ).toBeNull();
      },
    );

    it(
      'should make barred-spiral arms begin inside the canonical gap while tapering the outer arm',
      () => {
        const target =
          model(
            1n,
          );

        const layout =
          GalacticMapParticleLayoutGenerator
            .generate(
              target,
            );

        const profile =
          spiralReinforcementRadialProfile(
            layout,
            target,
            CORE_PARTICLE_COUNT +
              BODY_PARTICLE_COUNT,
            CORE_PARTICLE_COUNT +
              BODY_PARTICLE_COUNT +
              BARRED_SPIRAL_ARM_REINFORCEMENT_PARTICLE_COUNT,
          );

        expect(
          profile.insideCanonicalStartFraction,
        ).toBeGreaterThan(
          0.05,
        );

        expect(
          profile.innerFraction,
        ).toBeGreaterThan(
          0.52,
        );

        expect(
          profile.outerFraction,
        ).toBeLessThan(
          0.22,
        );

        expect(
          profile.innerFraction,
        ).toBeGreaterThan(
          profile.outerFraction *
          2.4,
        );
      },
    );

    it(
      'should visibly populate both barred-spiral bar ends through the arm-root transition',
      () => {
        const target =
          model(
            1n,
          );

        const layout =
          GalacticMapParticleLayoutGenerator
            .generate(
              target,
            );

        const bar =
          target
            .visualStructure
            ?.bar;

        if (
          bar ===
            null ||
          bar ===
            undefined
        ) {
          throw new Error(
            'Bar-end coverage test requires a discovered barred spiral.',
          );
        }

        const start =
          layout.count -
          BAR_PARTICLE_COUNT;

        let positiveEnd =
          0;

        let negativeEnd =
          0;

        const cosine =
          Math.cos(
            bar
              .angleRadians,
          );

        const sine =
          Math.sin(
            bar
              .angleRadians,
          );

        for (
          let particle =
            start;
          particle <
            layout.count;
          particle +=
            1
        ) {
          const x =
            layout.positions[
              particle *
              3
            ];

          const y =
            layout.positions[
              particle *
                3 +
              1
            ];

          const along =
            x *
              cosine +
            y *
              sine;

          if (
            Math.abs(
              along,
            ) >=
            bar
              .halfLengthNormalized *
              0.62
          ) {
            if (
              along <
              0
            ) {
              negativeEnd +=
                1;
            } else {
              positiveEnd +=
                1;
            }
          }
        }

        expect(
          (
            positiveEnd +
            negativeEnd
          ) /
          BAR_PARTICLE_COUNT,
        ).toBeGreaterThan(
          0.28,
        );

        expect(
          positiveEnd /
          BAR_PARTICLE_COUNT,
        ).toBeGreaterThan(
          0.12,
        );

        expect(
          negativeEnd /
          BAR_PARTICLE_COUNT,
        ).toBeGreaterThan(
          0.12,
        );
      },
    );

    it(
      'should curve both barred-spiral bar ends into the arm roots instead of keeping a ruler-straight centerline',
      () => {
        const target =
          model(
            1n,
          );

        const layout =
          GalacticMapParticleLayoutGenerator
            .generate(
              target,
            );

        const bar =
          target
            .visualStructure
            ?.bar;

        if (
          bar ===
            null ||
          bar ===
            undefined
        ) {
          throw new Error(
            'Curved bar-transition test requires a discovered barred spiral.',
          );
        }

        const start =
          layout.count -
          BAR_PARTICLE_COUNT;

        const cosine =
          Math.cos(
            bar
              .angleRadians,
          );

        const sine =
          Math.sin(
            bar
              .angleRadians,
          );

        let positiveCount =
          0;

        let negativeCount =
          0;

        let positiveAcross =
          0;

        let negativeAcross =
          0;

        for (
          let particle =
            start;
          particle <
            layout.count;
          particle +=
            1
        ) {
          const x =
            layout.positions[
              particle *
              3
            ];

          const y =
            layout.positions[
              particle *
                3 +
              1
            ];

          const along =
            x *
              cosine +
            y *
              sine;

          if (
            Math.abs(
              along,
            ) <
            bar
              .halfLengthNormalized *
              0.68
          ) {
            continue;
          }

          const across =
            -x *
              sine +
            y *
              cosine;

          if (
            along <
            0
          ) {
            negativeCount +=
              1;

            negativeAcross +=
              across;
          } else {
            positiveCount +=
              1;

            positiveAcross +=
              across;
          }
        }

        expect(
          positiveCount,
        ).toBeGreaterThan(
          400,
        );

        expect(
          negativeCount,
        ).toBeGreaterThan(
          400,
        );

        const positiveMeanAcross =
          positiveAcross /
          positiveCount;

        const negativeMeanAcross =
          negativeAcross /
          negativeCount;

        expect(
          Math.abs(
            positiveMeanAcross,
          ),
        ).toBeGreaterThan(
          bar
            .widthNormalized *
            0.08,
        );

        expect(
          Math.abs(
            negativeMeanAcross,
          ),
        ).toBeGreaterThan(
          bar
            .widthNormalized *
            0.08,
        );
      },
    );

    it(
      'should extend normal-spiral arms into the bulge overlap while preserving a softer outer taper',
      () => {
        const target =
          model(
            3n,
          );

        const layout =
          GalacticMapParticleLayoutGenerator
            .generate(
              target,
            );

        const profile =
          spiralReinforcementRadialProfile(
            layout,
            target,
            CORE_PARTICLE_COUNT +
              BODY_PARTICLE_COUNT,
            CORE_PARTICLE_COUNT +
              BODY_PARTICLE_COUNT +
              SPIRAL_ARM_REINFORCEMENT_PARTICLE_COUNT,
          );

        expect(
          profile.insideCanonicalStartFraction,
        ).toBeGreaterThan(
          0.08,
        );

        expect(
          profile.innerFraction,
        ).toBeGreaterThan(
          0.48,
        );

        expect(
          profile.outerFraction,
        ).toBeLessThan(
          0.24,
        );

        expect(
          profile.innerFraction,
        ).toBeGreaterThan(
          profile.outerFraction *
          2.0,
        );
      },
    );

    it(
      'should keep every generated attribute finite and bounded',
      () => {
        const layout =
          GalacticMapParticleLayoutGenerator
            .generate(
              model(
                1n,
              ),
            );

        const positionRange =
          inspectFiniteRange(
            layout.positions,
          );

        const colorRange =
          inspectFiniteRange(
            layout.colors,
          );

        const opacityRange =
          inspectFiniteRange(
            layout.opacities,
          );

        const sizeRange =
          inspectFiniteRange(
            layout.sizes,
          );

        expect(
          positionRange.allFinite,
        ).toBe(
          true,
        );

        expect(
          positionRange.minimum,
        ).toBeGreaterThan(
          -2,
        );

        expect(
          positionRange.maximum,
        ).toBeLessThan(
          2,
        );

        expect(
          colorRange.allFinite,
        ).toBe(
          true,
        );

        expect(
          colorRange.minimum,
        ).toBeGreaterThanOrEqual(
          0,
        );

        expect(
          colorRange.maximum,
        ).toBeLessThanOrEqual(
          1,
        );

        expect(
          opacityRange.allFinite,
        ).toBe(
          true,
        );

        expect(
          opacityRange.minimum,
        ).toBeGreaterThanOrEqual(
          0,
        );

        expect(
          opacityRange.maximum,
        ).toBeLessThanOrEqual(
          1,
        );

        expect(
          sizeRange.allFinite,
        ).toBe(
          true,
        );

        expect(
          sizeRange.minimum,
        ).toBeGreaterThan(
          0,
        );

        expect(
          sizeRange.maximum,
        ).toBeLessThan(
          10,
        );
      },
    );

    it(
      'should render Caeloria as an expanded volumetric spheroidal cloud instead of a correlated curve',
      () => {
        const layout =
          GalacticMapParticleLayoutGenerator
            .generate(
              model(
                0n,
              ),
            );

        const bodyStart =
          CORE_PARTICLE_COUNT;

        const bodyEnd =
          CORE_PARTICLE_COUNT +
          BODY_PARTICLE_COUNT;

        const occupiedCells =
          projectedOccupancy(
            layout,
            bodyStart,
            bodyEnd,
            32,
          );

        expect(
          occupiedCells,
        ).toBeGreaterThan(
          0.46,
        );

        const radialReach =
          projectedRadialReach(
            layout,
            bodyStart,
            bodyEnd,
          );

        expect(
          radialReach,
        ).toBeGreaterThan(
          1.02,
        );

        let positiveDepth =
          0;

        let negativeDepth =
          0;

        for (
          let particle =
            bodyStart;
          particle <
            bodyEnd;
          particle +=
            1
        ) {
          const z =
            layout.positions[
              particle *
                3 +
              2
            ];

          if (
            z >
            0.03
          ) {
            positiveDepth +=
              1;
          }

          if (
            z <
            -0.03
          ) {
            negativeDepth +=
              1;
          }
        }

        expect(
          positiveDepth,
        ).toBeGreaterThan(
          BODY_PARTICLE_COUNT *
          0.25,
        );

        expect(
          negativeDepth,
        ).toBeGreaterThan(
          BODY_PARTICLE_COUNT *
          0.25,
        );
      },
    );

    it(
      'should render the dwarf family as one continuous asymmetric stellar body instead of isolated clusters',
      () => {
        const dwarf =
          GalacticMapParticleLayoutGenerator
            .generate(
              model(
                4n,
              ),
            );

        expect(
          dwarf.count,
        ).toBe(
          DWARF_PARTICLE_COUNT,
        );

        const bodyStart =
          CORE_PARTICLE_COUNT;

        const reinforcedBodyEnd =
          CORE_PARTICLE_COUNT +
          BODY_PARTICLE_COUNT +
          DWARF_STELLAR_BODY_REINFORCEMENT_PARTICLE_COUNT;

        const occupiedCells =
          projectedOccupancy(
            dwarf,
            bodyStart,
            reinforcedBodyEnd,
            32,
          );

        expect(
          occupiedCells,
        ).toBeGreaterThan(
          0.34,
        );

        const innerFraction =
          projectedFractionWithinRadius(
            dwarf,
            bodyStart,
            reinforcedBodyEnd,
            0.78,
          );

        expect(
          innerFraction,
        ).toBeGreaterThan(
          0.48,
        );

        const reach =
          projectedRadialReach(
            dwarf,
            bodyStart,
            reinforcedBodyEnd,
          );

        expect(
          reach,
        ).toBeGreaterThan(
          0.95,
        );

        const brightCentralFraction =
          projectedFractionWithinRadius(
            dwarf,
            0,
            CORE_PARTICLE_COUNT,
            0.45,
          );

        expect(
          brightCentralFraction,
        ).toBeGreaterThan(
          0.70,
        );
      },
    );

    it(
      'should render the irregular family as one continuous lopsided stellar body with embedded regions',
      () => {
        const irregular =
          GalacticMapParticleLayoutGenerator
            .generate(
              model(
                10n,
              ),
            );

        expect(
          irregular.count,
        ).toBe(
          IRREGULAR_PARTICLE_COUNT,
        );

        const bodyStart =
          CORE_PARTICLE_COUNT;

        const reinforcedBodyEnd =
          CORE_PARTICLE_COUNT +
          BODY_PARTICLE_COUNT +
          IRREGULAR_STELLAR_BODY_REINFORCEMENT_PARTICLE_COUNT;

        const occupiedCells =
          projectedOccupancy(
            irregular,
            bodyStart,
            reinforcedBodyEnd,
            32,
          );

        expect(
          occupiedCells,
        ).toBeGreaterThan(
          0.28,
        );

        const innerFraction =
          projectedFractionWithinRadius(
            irregular,
            bodyStart,
            reinforcedBodyEnd,
            0.92,
          );

        expect(
          innerFraction,
        ).toBeGreaterThan(
          0.36,
        );

        const reach =
          projectedRadialReach(
            irregular,
            bodyStart,
            reinforcedBodyEnd,
          );

        expect(
          reach,
        ).toBeGreaterThan(
          1.05,
        );
      },
    );

    it(
      'should keep a discovered spiral disk substantially thinner than the spheroidal body',
      () => {
        const spheroidal =
          GalacticMapParticleLayoutGenerator
            .generate(
              model(
                0n,
              ),
            );

        const spiral =
          GalacticMapParticleLayoutGenerator
            .generate(
              model(
                3n,
              ),
            );

        const spheroidalDepth =
          bodyDepthRms(
            spheroidal,
          );

        const spiralDepth =
          bodyDepthRms(
            spiral,
          );

        expect(
          spiralDepth,
        ).toBeLessThan(
          spheroidalDepth *
          0.45,
        );
      },
    );
  },
);

interface FiniteRange {
  readonly allFinite:
    boolean;

  readonly minimum:
    number;

  readonly maximum:
    number;
}

function inspectFiniteRange(
  values:
    Float32Array,
): FiniteRange {

  let allFinite =
    true;

  let minimum =
    Number.POSITIVE_INFINITY;

  let maximum =
    Number.NEGATIVE_INFINITY;

  for (
    let index =
      0;
    index <
      values.length;
    index +=
      1
  ) {
    const value =
      values[
        index
      ];

    if (
      !Number.isFinite(
        value,
      )
    ) {
      allFinite =
        false;

      continue;
    }

    if (
      value <
      minimum
    ) {
      minimum =
        value;
    }

    if (
      value >
      maximum
    ) {
      maximum =
        value;
    }
  }

  return {
    allFinite,
    minimum,
    maximum,
  };
}

function projectedOccupancy(
  layout:
    GalacticMapParticleLayout,

  start:
    number,

  end:
    number,

  bins:
    number,
): number {

  const occupied =
    new Set<string>();

  for (
    let particle =
      start;
    particle <
      end;
    particle +=
      1
  ) {
    const x =
      layout.positions[
        particle *
        3
      ];

    const y =
      layout.positions[
        particle *
          3 +
        1
      ];

    const xBin =
      Math.floor(
        (
          x +
          1.2
        ) /
        2.4 *
        bins,
      );

    const yBin =
      Math.floor(
        (
          y +
          1.2
        ) /
        2.4 *
        bins,
      );

    if (
      xBin >=
        0 &&
      xBin <
        bins &&
      yBin >=
        0 &&
      yBin <
        bins
    ) {
      occupied.add(
        `${xBin}:${yBin}`,
      );
    }
  }

  return occupied.size /
    (
      bins *
      bins
    );
}

function projectedRadialReach(
  layout:
    GalacticMapParticleLayout,

  start:
    number,

  end:
    number,
): number {

  let maximum =
    0;

  for (
    let particle =
      start;
    particle <
      end;
    particle +=
      1
  ) {
    const x =
      layout.positions[
        particle *
        3
      ];

    const y =
      layout.positions[
        particle *
          3 +
        1
      ];

    maximum =
      Math.max(
        maximum,
        Math.hypot(
          x,
          y,
        ),
      );
  }

  return maximum;
}

function projectedFractionWithinRadius(
  layout:
    GalacticMapParticleLayout,

  start:
    number,

  end:
    number,

  radius:
    number,
): number {

  let inside =
    0;

  for (
    let particle =
      start;
    particle <
      end;
    particle +=
      1
  ) {
    const x =
      layout.positions[
        particle *
        3
      ];

    const y =
      layout.positions[
        particle *
          3 +
        1
      ];

    if (
      Math.hypot(
        x,
        y,
      ) <=
      radius
    ) {
      inside +=
        1;
    }
  }

  return inside /
    Math.max(
      1,
      end -
        start,
    );
}

interface SpiralReinforcementRadialProfile {
  readonly insideCanonicalStartFraction:
    number;

  readonly innerFraction:
    number;

  readonly outerFraction:
    number;
}

function spiralReinforcementRadialProfile(
  layout:
    GalacticMapParticleLayout,

  model:
    GalacticMapModel,

  start:
    number,

  end:
    number,
): SpiralReinforcementRadialProfile {

  const visual =
    model.visualStructure;

  if (
    visual ===
      null ||
    visual.arms.length ===
      0
  ) {
    throw new Error(
      'Spiral reinforcement profile requires a discovered galaxy with visual arms.',
    );
  }

  const radialStart =
    Math.min(
      ...visual.arms.map(
        arm =>
          arm.radialStartNormalized,
      ),
    );

  const radialEnd =
    Math.max(
      ...visual.arms.map(
        arm =>
          arm.radialEndNormalized,
      ),
    );

  const radialSpan =
    Math.max(
      1e-9,
      radialEnd -
        radialStart,
    );

  const innerLimit =
    radialStart +
    radialSpan *
      0.48;

  const outerLimit =
    radialStart +
    radialSpan *
      0.78;

  let insideCanonicalStart =
    0;

  let inner =
    0;

  let outer =
    0;

  for (
    let particle =
      start;
    particle <
      end;
    particle +=
      1
  ) {
    const x =
      layout.positions[
        particle *
        3
      ];

    const y =
      layout.positions[
        particle *
          3 +
        1
      ];

    const radius =
      Math.hypot(
        x,
        y,
      );

    if (
      radius <
      radialStart
    ) {
      insideCanonicalStart +=
        1;
    }

    if (
      radius <=
      innerLimit
    ) {
      inner +=
        1;
    }

    if (
      radius >=
      outerLimit
    ) {
      outer +=
        1;
    }
  }

  const count =
    Math.max(
      1,
      end -
        start,
    );

  return {
    insideCanonicalStartFraction:
      insideCanonicalStart /
      count,

    innerFraction:
      inner /
      count,

    outerFraction:
      outer /
      count,
  };
}

function bodyDepthRms(
  layout:
    GalacticMapParticleLayout,
): number {

  let squared =
    0;

  const start =
    CORE_PARTICLE_COUNT;

  const end =
    CORE_PARTICLE_COUNT +
    BODY_PARTICLE_COUNT;

  for (
    let particle =
      start;
    particle <
      end;
    particle +=
      1
  ) {
    const z =
      layout.positions[
        particle *
          3 +
        2
      ];

    squared +=
      z *
      z;
  }

  return Math.sqrt(
    squared /
    BODY_PARTICLE_COUNT,
  );
}
