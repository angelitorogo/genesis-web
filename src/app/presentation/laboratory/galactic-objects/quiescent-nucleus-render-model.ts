import {
  type Galaxy,
} from '../../../domain/universe/galaxy';

export const QuiescentNucleusVisualFamily =
  Object.freeze({
    COMPACT_CUSP:
      'COMPACT_CUSP',
    DUST_VEILED:
      'DUST_VEILED',
    ELLIPTICAL_BULGE:
      'ELLIPTICAL_BULGE',
    GRANULAR_CLUSTER:
      'GRANULAR_CLUSTER',
    WARM_EXTENDED:
      'WARM_EXTENDED',
    DENSE_NUCLEAR_CLUSTER:
      'DENSE_NUCLEAR_CLUSTER',
    ASYMMETRIC_DUST:
      'ASYMMETRIC_DUST',
    OLD_STELLAR_CUSP:
      'OLD_STELLAR_CUSP',
  } as const);

export type QuiescentNucleusVisualFamily =
  typeof QuiescentNucleusVisualFamily[
    keyof typeof QuiescentNucleusVisualFamily
  ];

export const QUIESCENT_NUCLEUS_VISUAL_FAMILIES:
  readonly QuiescentNucleusVisualFamily[] =
  Object.freeze([
    QuiescentNucleusVisualFamily
      .COMPACT_CUSP,
    QuiescentNucleusVisualFamily
      .DUST_VEILED,
    QuiescentNucleusVisualFamily
      .ELLIPTICAL_BULGE,
    QuiescentNucleusVisualFamily
      .GRANULAR_CLUSTER,
    QuiescentNucleusVisualFamily
      .WARM_EXTENDED,
    QuiescentNucleusVisualFamily
      .DENSE_NUCLEAR_CLUSTER,
    QuiescentNucleusVisualFamily
      .ASYMMETRIC_DUST,
    QuiescentNucleusVisualFamily
      .OLD_STELLAR_CUSP,
  ]);

export interface QuiescentNucleusPalette {
  readonly core:
    readonly [number, number, number];

  readonly oldStars:
    readonly [number, number, number];

  readonly redGiants:
    readonly [number, number, number];

  readonly envelope:
    readonly [number, number, number];
}

export interface QuiescentNucleusRenderModel {
  readonly seed:
    string;

  readonly family:
    QuiescentNucleusVisualFamily;

  readonly familyIndex:
    number;

  readonly orientationRadians:
    number;

  readonly axisRatio:
    number;

  readonly coreRadius:
    number;

  readonly envelopeRadius:
    number;

  readonly cuspExponent:
    number;

  readonly centralIntensity:
    number;

  readonly stellarDensity:
    number;

  readonly granularity:
    number;

  readonly dustOpacity:
    number;

  readonly dustWidth:
    number;

  readonly dustAngleRadians:
    number;

  readonly dustWarp:
    number;

  readonly secondaryDustLane:
    number;

  readonly asymmetry:
    number;

  readonly palette:
    QuiescentNucleusPalette;
}

interface FamilyProfile {
  readonly axisRatio:
    readonly [number, number];

  readonly coreRadius:
    readonly [number, number];

  readonly envelopeRadius:
    readonly [number, number];

  readonly cuspExponent:
    readonly [number, number];

  readonly centralIntensity:
    readonly [number, number];

  readonly stellarDensity:
    readonly [number, number];

  readonly granularity:
    readonly [number, number];

  readonly dustOpacity:
    readonly [number, number];

  readonly dustWidth:
    readonly [number, number];

  readonly dustWarp:
    readonly [number, number];

  readonly secondaryDustLane:
    readonly [number, number];

  readonly asymmetry:
    readonly [number, number];
}

const FAMILY_PROFILES:
  Readonly<Record<
    QuiescentNucleusVisualFamily,
    FamilyProfile
  >> =
  Object.freeze({
    [QuiescentNucleusVisualFamily.COMPACT_CUSP]:
      profile(
        [0.86, 0.98],
        [0.065, 0.095],
        [0.58, 0.72],
        [1.85, 2.35],
        [0.72, 0.88],
        [0.78, 0.96],
        [0.40, 0.58],
        [0.05, 0.12],
        [0.035, 0.055],
        [0.03, 0.08],
        [0.00, 0.10],
        [0.02, 0.08],
      ),

    [QuiescentNucleusVisualFamily.DUST_VEILED]:
      profile(
        [0.70, 0.88],
        [0.075, 0.115],
        [0.66, 0.82],
        [1.55, 2.05],
        [0.64, 0.80],
        [0.68, 0.86],
        [0.46, 0.66],
        [0.32, 0.50],
        [0.045, 0.075],
        [0.09, 0.17],
        [0.16, 0.34],
        [0.05, 0.12],
      ),

    [QuiescentNucleusVisualFamily.ELLIPTICAL_BULGE]:
      profile(
        [0.54, 0.72],
        [0.095, 0.145],
        [0.72, 0.90],
        [1.45, 1.90],
        [0.60, 0.76],
        [0.64, 0.82],
        [0.34, 0.52],
        [0.04, 0.12],
        [0.030, 0.050],
        [0.03, 0.08],
        [0.00, 0.08],
        [0.02, 0.07],
      ),

    [QuiescentNucleusVisualFamily.GRANULAR_CLUSTER]:
      profile(
        [0.78, 0.95],
        [0.055, 0.090],
        [0.54, 0.68],
        [1.95, 2.55],
        [0.66, 0.82],
        [0.88, 1.00],
        [0.72, 0.94],
        [0.08, 0.18],
        [0.030, 0.055],
        [0.04, 0.10],
        [0.00, 0.12],
        [0.03, 0.10],
      ),

    [QuiescentNucleusVisualFamily.WARM_EXTENDED]:
      profile(
        [0.76, 0.94],
        [0.115, 0.165],
        [0.82, 0.98],
        [1.25, 1.65],
        [0.52, 0.68],
        [0.58, 0.76],
        [0.38, 0.58],
        [0.07, 0.16],
        [0.045, 0.070],
        [0.05, 0.11],
        [0.00, 0.10],
        [0.04, 0.11],
      ),

    [QuiescentNucleusVisualFamily.DENSE_NUCLEAR_CLUSTER]:
      profile(
        [0.82, 0.98],
        [0.045, 0.075],
        [0.48, 0.62],
        [2.15, 2.75],
        [0.76, 0.90],
        [0.94, 1.00],
        [0.62, 0.84],
        [0.04, 0.10],
        [0.025, 0.045],
        [0.03, 0.07],
        [0.00, 0.06],
        [0.01, 0.06],
      ),

    [QuiescentNucleusVisualFamily.ASYMMETRIC_DUST]:
      profile(
        [0.62, 0.82],
        [0.080, 0.125],
        [0.67, 0.84],
        [1.45, 1.95],
        [0.58, 0.74],
        [0.66, 0.84],
        [0.48, 0.68],
        [0.38, 0.58],
        [0.050, 0.085],
        [0.14, 0.24],
        [0.34, 0.56],
        [0.12, 0.22],
      ),

    [QuiescentNucleusVisualFamily.OLD_STELLAR_CUSP]:
      profile(
        [0.74, 0.92],
        [0.060, 0.100],
        [0.60, 0.76],
        [2.20, 2.90],
        [0.68, 0.84],
        [0.82, 0.98],
        [0.54, 0.74],
        [0.10, 0.22],
        [0.035, 0.060],
        [0.05, 0.12],
        [0.06, 0.18],
        [0.04, 0.11],
      ),
  });

const PALETTES:
  readonly QuiescentNucleusPalette[] =
  Object.freeze([
    palette(
      [1.00, 0.90, 0.70],
      [0.93, 0.66, 0.36],
      [0.86, 0.38, 0.20],
      [0.42, 0.20, 0.10],
    ),
    palette(
      [1.00, 0.86, 0.64],
      [0.98, 0.58, 0.31],
      [0.78, 0.30, 0.18],
      [0.36, 0.16, 0.09],
    ),
    palette(
      [0.98, 0.91, 0.78],
      [0.84, 0.64, 0.43],
      [0.74, 0.36, 0.24],
      [0.32, 0.18, 0.11],
    ),
    palette(
      [1.00, 0.82, 0.60],
      [0.90, 0.52, 0.28],
      [0.93, 0.42, 0.20],
      [0.40, 0.15, 0.07],
    ),
  ]);

export function resolveQuiescentNucleusVisualFamily(
  galaxy:
    Galaxy,
): QuiescentNucleusVisualFamily {

  return QUIESCENT_NUCLEUS_VISUAL_FAMILIES[
    Math.min(
      QUIESCENT_NUCLEUS_VISUAL_FAMILIES.length - 1,
      Math.floor(
        unit(
          galaxy,
          'family',
        ) *
        QUIESCENT_NUCLEUS_VISUAL_FAMILIES.length,
      ),
    )
  ];
}

export function createQuiescentNucleusRenderModel(
  galaxy:
    Galaxy,
): QuiescentNucleusRenderModel {

  const family =
    resolveQuiescentNucleusVisualFamily(
      galaxy,
    );

  const familyIndex =
    QUIESCENT_NUCLEUS_VISUAL_FAMILIES
      .indexOf(
        family,
      );

  const profile =
    FAMILY_PROFILES[
      family
    ];

  const structure =
    galaxy
      .physicalProperties
      .structure;

  const concentration =
    clamp01(
      structure
        .centralConcentration,
    );

  const age =
    clamp01(
      (
        galaxy
          .physicalProperties
          .ageBillionYears -
        7
      ) /
      7,
    );

  const metallicity =
    clamp01(
      galaxy
        .physicalProperties
        .metallicitySolarRatio /
      1.6,
    );

  const paletteIndex =
    Math.min(
      PALETTES.length - 1,
      Math.floor(
        unit(
          galaxy,
          'palette',
        ) *
        PALETTES.length,
      ),
    );

  return Object.freeze({
    seed:
      galaxy.seed
        .normalizedValue,
    family,
    familyIndex,
    orientationRadians:
      unit(
        galaxy,
        'orientation',
      ) *
      Math.PI *
      2,
    axisRatio:
      lerpRange(
        profile.axisRatio,
        mixUnit(
          unit(
            galaxy,
            'axis-ratio',
          ),
          1 -
          structure.flattening,
          0.28,
        ),
      ),
    coreRadius:
      lerpRange(
        profile.coreRadius,
        mixUnit(
          unit(
            galaxy,
            'core-radius',
          ),
          concentration,
          0.34,
        ),
      ),
    envelopeRadius:
      lerpRange(
        profile.envelopeRadius,
        unit(
          galaxy,
          'envelope-radius',
        ),
      ),
    cuspExponent:
      lerpRange(
        profile.cuspExponent,
        mixUnit(
          unit(
            galaxy,
            'cusp-exponent',
          ),
          concentration,
          0.42,
        ),
      ),
    centralIntensity:
      lerpRange(
        profile.centralIntensity,
        mixUnit(
          unit(
            galaxy,
            'central-intensity',
          ),
          concentration,
          0.44,
        ),
      ),
    stellarDensity:
      lerpRange(
        profile.stellarDensity,
        mixUnit(
          unit(
            galaxy,
            'stellar-density',
          ),
          concentration,
          0.36,
        ),
      ),
    granularity:
      lerpRange(
        profile.granularity,
        unit(
          galaxy,
          'granularity',
        ),
      ),
    dustOpacity:
      lerpRange(
        profile.dustOpacity,
        mixUnit(
          unit(
            galaxy,
            'dust-opacity',
          ),
          1 -
          age,
          0.20,
        ),
      ),
    dustWidth:
      lerpRange(
        profile.dustWidth,
        unit(
          galaxy,
          'dust-width',
        ),
      ),
    dustAngleRadians:
      unit(
        galaxy,
        'dust-angle',
      ) *
      Math.PI *
      2,
    dustWarp:
      lerpRange(
        profile.dustWarp,
        unit(
          galaxy,
          'dust-warp',
        ),
      ),
    secondaryDustLane:
      lerpRange(
        profile.secondaryDustLane,
        unit(
          galaxy,
          'secondary-dust-lane',
        ),
      ),
    asymmetry:
      lerpRange(
        profile.asymmetry,
        mixUnit(
          unit(
            galaxy,
            'asymmetry',
          ),
          structure.asymmetry,
          0.38,
        ),
      ),
    palette:
      warmPaletteFor(
        PALETTES[
          paletteIndex
        ],
        age,
        metallicity,
      ),
  });
}

function profile(
  axisRatio:
    readonly [number, number],
  coreRadius:
    readonly [number, number],
  envelopeRadius:
    readonly [number, number],
  cuspExponent:
    readonly [number, number],
  centralIntensity:
    readonly [number, number],
  stellarDensity:
    readonly [number, number],
  granularity:
    readonly [number, number],
  dustOpacity:
    readonly [number, number],
  dustWidth:
    readonly [number, number],
  dustWarp:
    readonly [number, number],
  secondaryDustLane:
    readonly [number, number],
  asymmetry:
    readonly [number, number],
): FamilyProfile {
  return Object.freeze({
    axisRatio,
    coreRadius,
    envelopeRadius,
    cuspExponent,
    centralIntensity,
    stellarDensity,
    granularity,
    dustOpacity,
    dustWidth,
    dustWarp,
    secondaryDustLane,
    asymmetry,
  });
}

function palette(
  core:
    readonly [number, number, number],
  oldStars:
    readonly [number, number, number],
  redGiants:
    readonly [number, number, number],
  envelope:
    readonly [number, number, number],
): QuiescentNucleusPalette {
  return Object.freeze({
    core:
      Object.freeze(core),
    oldStars:
      Object.freeze(oldStars),
    redGiants:
      Object.freeze(redGiants),
    envelope:
      Object.freeze(envelope),
  });
}

function warmPaletteFor(
  source:
    QuiescentNucleusPalette,
  age:
    number,
  metallicity:
    number,
): QuiescentNucleusPalette {

  const warmth =
    0.92 +
    0.08 *
    age;

  const richness =
    0.90 +
    0.10 *
    metallicity;

  return palette(
    scaleColor(
      source.core,
      warmth,
      1,
    ),
    scaleColor(
      source.oldStars,
      warmth,
      richness,
    ),
    scaleColor(
      source.redGiants,
      1,
      richness,
    ),
    scaleColor(
      source.envelope,
      warmth,
      richness,
    ),
  );
}

function scaleColor(
  color:
    readonly [number, number, number],
  warmth:
    number,
  richness:
    number,
): readonly [number, number, number] {
  return Object.freeze([
    clamp01(
      color[0] *
      warmth *
      richness,
    ),
    clamp01(
      color[1] *
      richness,
    ),
    clamp01(
      color[2] /
      warmth,
    ),
  ]);
}

function unit(
  galaxy:
    Galaxy,
  label:
    string,
): number {

  const value =
    `${galaxy.seed.normalizedValue}:${label}`;

  let hash =
    2166136261;

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    hash ^=
      value.charCodeAt(
        index,
      );

    hash =
      Math.imul(
        hash,
        16777619,
      ) >>> 0;
  }

  return hash /
    4294967296;
}

function mixUnit(
  procedural:
    number,
  physical:
    number,
  physicalWeight:
    number,
): number {
  return clamp01(
    procedural *
      (1 - physicalWeight) +
    clamp01(
      physical,
    ) *
      physicalWeight,
  );
}

function lerpRange(
  range:
    readonly [number, number],
  t:
    number,
): number {
  return range[0] +
    (
      range[1] -
      range[0]
    ) *
    clamp01(
      t,
    );
}

function clamp01(
  value:
    number,
): number {
  return Math.min(
    1,
    Math.max(
      0,
      value,
    ),
  );
}
