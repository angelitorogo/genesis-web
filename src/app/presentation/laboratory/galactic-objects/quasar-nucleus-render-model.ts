import {
  GalacticNucleusState,
} from '../../../domain/universe/galactic-nucleus-state';

import {
  type Galaxy,
} from '../../../domain/universe/galaxy';

export const QuasarNucleusVisualFamily =
  Object.freeze({
    RADIANT_FACE_ON_DISK:
      'RADIANT_FACE_ON_DISK',
    EDGE_ON_DUST_TORUS:
      'EDGE_ON_DUST_TORUS',
    TWIN_RELATIVISTIC_JETS:
      'TWIN_RELATIVISTIC_JETS',
    DOPPLER_ONE_SIDED_JET:
      'DOPPLER_ONE_SIDED_JET',
    BROAD_POLAR_WIND:
      'BROAD_POLAR_WIND',
    WARPED_PRECESSING_JET:
      'WARPED_PRECESSING_JET',
    KNOTTED_EXTENDED_JET:
      'KNOTTED_EXTENDED_JET',
    HYPERLUMINOUS_CORONA:
      'HYPERLUMINOUS_CORONA',
  } as const);

export type QuasarNucleusVisualFamily =
  typeof QuasarNucleusVisualFamily[
    keyof typeof QuasarNucleusVisualFamily
  ];

export const QUASAR_NUCLEUS_VISUAL_FAMILIES:
  readonly QuasarNucleusVisualFamily[] =
  Object.freeze([
    QuasarNucleusVisualFamily
      .RADIANT_FACE_ON_DISK,
    QuasarNucleusVisualFamily
      .EDGE_ON_DUST_TORUS,
    QuasarNucleusVisualFamily
      .TWIN_RELATIVISTIC_JETS,
    QuasarNucleusVisualFamily
      .DOPPLER_ONE_SIDED_JET,
    QuasarNucleusVisualFamily
      .BROAD_POLAR_WIND,
    QuasarNucleusVisualFamily
      .WARPED_PRECESSING_JET,
    QuasarNucleusVisualFamily
      .KNOTTED_EXTENDED_JET,
    QuasarNucleusVisualFamily
      .HYPERLUMINOUS_CORONA,
  ]);

export interface QuasarNucleusPalette {
  readonly innerDisk:
    readonly [number, number, number];

  readonly midDisk:
    readonly [number, number, number];

  readonly outerDisk:
    readonly [number, number, number];

  readonly photonRing:
    readonly [number, number, number];

  readonly corona:
    readonly [number, number, number];

  readonly jetCore:
    readonly [number, number, number];

  readonly jetSheath:
    readonly [number, number, number];

  readonly wind:
    readonly [number, number, number];
}

export interface QuasarNucleusRenderModel {
  readonly seed:
    string;

  readonly family:
    QuasarNucleusVisualFamily;

  readonly familyIndex:
    number;

  readonly blackHoleMassSolarMasses:
    number;

  readonly normalizedMass:
    number;

  readonly orientationRadians:
    number;

  readonly inclination:
    number;

  readonly shadowRadius:
    number;

  readonly diskInnerRadius:
    number;

  readonly diskOuterRadius:
    number;

  readonly diskThickness:
    number;

  readonly accretionBrightness:
    number;

  readonly photonRingStrength:
    number;

  readonly lensingStrength:
    number;

  readonly dopplerAsymmetry:
    number;

  readonly turbulence:
    number;

  readonly clumpiness:
    number;

  readonly warp:
    number;

  readonly coronaStrength:
    number;

  readonly dustTorusOpacity:
    number;

  readonly jetStrength:
    number;

  readonly jetLength:
    number;

  readonly jetOpening:
    number;

  readonly jetCollimation:
    number;

  readonly counterJetRatio:
    number;

  readonly jetKnotStrength:
    number;

  readonly jetPrecession:
    number;

  readonly windStrength:
    number;

  readonly windOpening:
    number;

  readonly scatteringHaloStrength:
    number;

  readonly backgroundStarDensity:
    number;

  readonly palette:
    QuasarNucleusPalette;
}

interface FamilyProfile {
  readonly inclination:
    readonly [number, number];

  readonly shadowRadius:
    readonly [number, number];

  readonly diskInnerRatio:
    readonly [number, number];

  readonly diskOuterRadius:
    readonly [number, number];

  readonly diskThickness:
    readonly [number, number];

  readonly accretionBrightness:
    readonly [number, number];

  readonly photonRingStrength:
    readonly [number, number];

  readonly lensingStrength:
    readonly [number, number];

  readonly dopplerAsymmetry:
    readonly [number, number];

  readonly turbulence:
    readonly [number, number];

  readonly clumpiness:
    readonly [number, number];

  readonly warp:
    readonly [number, number];

  readonly coronaStrength:
    readonly [number, number];

  readonly dustTorusOpacity:
    readonly [number, number];

  readonly jetStrength:
    readonly [number, number];

  readonly jetLength:
    readonly [number, number];

  readonly jetOpening:
    readonly [number, number];

  readonly jetCollimation:
    readonly [number, number];

  readonly counterJetRatio:
    readonly [number, number];

  readonly jetKnotStrength:
    readonly [number, number];

  readonly jetPrecession:
    readonly [number, number];

  readonly windStrength:
    readonly [number, number];

  readonly windOpening:
    readonly [number, number];

  readonly scatteringHaloStrength:
    readonly [number, number];
}

const FAMILY_PROFILES:
  Readonly<Record<
    QuasarNucleusVisualFamily,
    FamilyProfile
  >> =
  Object.freeze({
    [QuasarNucleusVisualFamily.RADIANT_FACE_ON_DISK]:
      profile(
        [0.10, 0.34],
        [0.064, 0.090],
        [1.25, 1.42],
        [0.56, 0.70],
        [0.040, 0.065],
        [1.05, 1.30],
        [0.78, 1.00],
        [0.70, 0.90],
        [0.30, 0.52],
        [0.34, 0.56],
        [0.12, 0.28],
        [0.00, 0.06],
        [0.90, 1.16],
        [0.04, 0.12],
        [0.12, 0.30],
        [0.62, 0.82],
        [0.030, 0.055],
        [0.78, 0.94],
        [0.68, 0.88],
        [0.12, 0.26],
        [0.00, 0.05],
        [0.46, 0.70],
        [0.34, 0.54],
        [0.72, 0.96],
      ),

    [QuasarNucleusVisualFamily.EDGE_ON_DUST_TORUS]:
      profile(
        [0.78, 0.94],
        [0.070, 0.098],
        [1.30, 1.52],
        [0.66, 0.82],
        [0.024, 0.045],
        [0.94, 1.18],
        [0.86, 1.08],
        [0.90, 1.12],
        [0.42, 0.68],
        [0.30, 0.50],
        [0.16, 0.30],
        [0.00, 0.05],
        [0.76, 1.02],
        [0.62, 0.88],
        [0.28, 0.52],
        [0.74, 0.94],
        [0.028, 0.050],
        [0.82, 0.96],
        [0.58, 0.82],
        [0.16, 0.32],
        [0.00, 0.06],
        [0.74, 0.98],
        [0.24, 0.42],
        [0.56, 0.78],
      ),

    [QuasarNucleusVisualFamily.TWIN_RELATIVISTIC_JETS]:
      profile(
        [0.38, 0.68],
        [0.064, 0.090],
        [1.25, 1.44],
        [0.58, 0.72],
        [0.034, 0.058],
        [1.02, 1.26],
        [0.74, 0.96],
        [0.72, 0.94],
        [0.42, 0.64],
        [0.34, 0.54],
        [0.10, 0.24],
        [0.00, 0.05],
        [0.86, 1.10],
        [0.04, 0.14],
        [0.92, 1.20],
        [0.90, 1.15],
        [0.024, 0.044],
        [0.90, 1.00],
        [0.72, 0.92],
        [0.42, 0.64],
        [0.00, 0.05],
        [0.26, 0.44],
        [0.20, 0.36],
        [0.66, 0.90],
      ),

    [QuasarNucleusVisualFamily.DOPPLER_ONE_SIDED_JET]:
      profile(
        [0.30, 0.58],
        [0.062, 0.088],
        [1.24, 1.44],
        [0.56, 0.70],
        [0.032, 0.054],
        [1.04, 1.30],
        [0.76, 0.98],
        [0.72, 0.96],
        [0.72, 0.96],
        [0.32, 0.52],
        [0.10, 0.24],
        [0.00, 0.05],
        [0.88, 1.12],
        [0.04, 0.12],
        [0.96, 1.24],
        [0.92, 1.18],
        [0.022, 0.040],
        [0.92, 1.00],
        [0.18, 0.38],
        [0.46, 0.70],
        [0.00, 0.06],
        [0.24, 0.42],
        [0.18, 0.34],
        [0.68, 0.92],
      ),

    [QuasarNucleusVisualFamily.BROAD_POLAR_WIND]:
      profile(
        [0.28, 0.62],
        [0.066, 0.094],
        [1.26, 1.48],
        [0.60, 0.76],
        [0.040, 0.070],
        [1.00, 1.24],
        [0.72, 0.92],
        [0.66, 0.88],
        [0.34, 0.56],
        [0.44, 0.66],
        [0.18, 0.34],
        [0.02, 0.10],
        [0.88, 1.16],
        [0.12, 0.28],
        [0.36, 0.62],
        [0.72, 0.96],
        [0.045, 0.080],
        [0.64, 0.82],
        [0.54, 0.76],
        [0.22, 0.38],
        [0.02, 0.10],
        [0.90, 1.18],
        [0.54, 0.78],
        [0.84, 1.08],
      ),

    [QuasarNucleusVisualFamily.WARPED_PRECESSING_JET]:
      profile(
        [0.44, 0.74],
        [0.064, 0.092],
        [1.26, 1.48],
        [0.60, 0.76],
        [0.038, 0.064],
        [1.00, 1.24],
        [0.74, 0.96],
        [0.72, 0.94],
        [0.44, 0.68],
        [0.40, 0.62],
        [0.14, 0.30],
        [0.14, 0.28],
        [0.86, 1.10],
        [0.08, 0.18],
        [0.76, 1.02],
        [0.86, 1.10],
        [0.026, 0.050],
        [0.80, 0.94],
        [0.50, 0.74],
        [0.34, 0.56],
        [0.14, 0.26],
        [0.44, 0.68],
        [0.26, 0.44],
        [0.72, 0.98],
      ),

    [QuasarNucleusVisualFamily.KNOTTED_EXTENDED_JET]:
      profile(
        [0.34, 0.66],
        [0.062, 0.088],
        [1.24, 1.44],
        [0.56, 0.70],
        [0.032, 0.056],
        [1.02, 1.28],
        [0.72, 0.94],
        [0.70, 0.92],
        [0.42, 0.64],
        [0.50, 0.72],
        [0.18, 0.36],
        [0.02, 0.10],
        [0.84, 1.08],
        [0.06, 0.16],
        [0.82, 1.08],
        [1.04, 1.28],
        [0.034, 0.064],
        [0.74, 0.90],
        [0.46, 0.68],
        [0.72, 0.96],
        [0.04, 0.12],
        [0.36, 0.58],
        [0.24, 0.42],
        [0.70, 0.96],
      ),

    [QuasarNucleusVisualFamily.HYPERLUMINOUS_CORONA]:
      profile(
        [0.18, 0.54],
        [0.060, 0.084],
        [1.22, 1.40],
        [0.52, 0.66],
        [0.044, 0.074],
        [1.18, 1.44],
        [0.88, 1.12],
        [0.78, 1.00],
        [0.40, 0.66],
        [0.40, 0.62],
        [0.10, 0.24],
        [0.00, 0.06],
        [1.12, 1.38],
        [0.02, 0.10],
        [0.22, 0.46],
        [0.66, 0.88],
        [0.032, 0.058],
        [0.66, 0.84],
        [0.54, 0.76],
        [0.18, 0.34],
        [0.00, 0.06],
        [0.58, 0.82],
        [0.36, 0.56],
        [1.04, 1.32],
      ),
  });

const PALETTES:
  readonly QuasarNucleusPalette[] =
  Object.freeze([
    palette(
      [0.94, 0.98, 1.00],
      [0.58, 0.80, 1.00],
      [0.18, 0.32, 0.92],
      [0.86, 0.96, 1.00],
      [0.62, 0.82, 1.00],
      [0.82, 0.96, 1.00],
      [0.16, 0.48, 1.00],
      [0.36, 0.66, 1.00],
    ),
    palette(
      [1.00, 0.98, 0.88],
      [1.00, 0.72, 0.24],
      [0.78, 0.18, 0.04],
      [1.00, 0.92, 0.68],
      [1.00, 0.70, 0.30],
      [0.88, 0.96, 1.00],
      [0.18, 0.54, 1.00],
      [0.72, 0.42, 1.00],
    ),
    palette(
      [1.00, 0.94, 1.00],
      [0.80, 0.48, 1.00],
      [0.34, 0.12, 0.74],
      [0.96, 0.84, 1.00],
      [0.78, 0.54, 1.00],
      [0.72, 0.90, 1.00],
      [0.20, 0.40, 1.00],
      [0.72, 0.38, 1.00],
    ),
    palette(
      [1.00, 0.98, 0.92],
      [1.00, 0.62, 0.20],
      [0.66, 0.10, 0.025],
      [1.00, 0.88, 0.56],
      [1.00, 0.66, 0.22],
      [0.86, 0.96, 1.00],
      [0.16, 0.46, 0.98],
      [0.36, 0.70, 1.00],
    ),
  ]);

export function resolveQuasarNucleusVisualFamily(
  galaxy:
    Galaxy,
): QuasarNucleusVisualFamily {
  assertQuasar(
    galaxy,
  );

  return QUASAR_NUCLEUS_VISUAL_FAMILIES[
    Math.min(
      QUASAR_NUCLEUS_VISUAL_FAMILIES.length - 1,
      Math.floor(
        unit(
          galaxy,
          'quasar-family',
        ) *
        QUASAR_NUCLEUS_VISUAL_FAMILIES.length,
      ),
    )
  ];
}

export function createQuasarNucleusRenderModel(
  galaxy:
    Galaxy,
): QuasarNucleusRenderModel {
  assertQuasar(
    galaxy,
  );

  const blackHole =
    galaxy.nucleus
      ?.supermassiveBlackHole;

  if (
    blackHole ===
      null ||
    blackHole ===
      undefined
  ) {
    throw new RangeError(
      'QUASAR render model requires a supermassive black hole.',
    );
  }

  const family =
    resolveQuasarNucleusVisualFamily(
      galaxy,
    );

  const familyIndex =
    QUASAR_NUCLEUS_VISUAL_FAMILIES
      .indexOf(
        family,
      );

  const profile =
    FAMILY_PROFILES[
      family
    ];

  const mass =
    blackHole
      .massSolarMasses;

  const normalizedMass =
    clamp01(
      (
        Math.log10(
          mass,
        ) -
        5.5
      ) /
      5.0,
    );

  const shadowRadius =
    lerpRange(
      profile.shadowRadius,
      mixUnit(
        unit(
          galaxy,
          'quasar-shadow-radius',
        ),
        normalizedMass,
        0.28,
      ),
    );

  const paletteIndex =
    Math.min(
      PALETTES.length - 1,
      Math.floor(
        unit(
          galaxy,
          'quasar-palette',
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
    blackHoleMassSolarMasses:
      mass,
    normalizedMass,
    orientationRadians:
      unit(
        galaxy,
        'quasar-orientation',
      ) *
      Math.PI *
      2,
    inclination:
      lerpRange(
        profile.inclination,
        unit(
          galaxy,
          'quasar-inclination',
        ),
      ),
    shadowRadius,
    diskInnerRadius:
      shadowRadius *
      lerpRange(
        profile.diskInnerRatio,
        unit(
          galaxy,
          'quasar-inner-disk',
        ),
      ),
    diskOuterRadius:
      lerpRange(
        profile.diskOuterRadius,
        mixUnit(
          unit(
            galaxy,
            'quasar-outer-disk',
          ),
          normalizedMass,
          0.10,
        ),
      ),
    diskThickness:
      lerpRange(
        profile.diskThickness,
        unit(
          galaxy,
          'quasar-disk-thickness',
        ),
      ),
    accretionBrightness:
      lerpRange(
        profile.accretionBrightness,
        unit(
          galaxy,
          'quasar-accretion-brightness',
        ),
      ),
    photonRingStrength:
      lerpRange(
        profile.photonRingStrength,
        unit(
          galaxy,
          'quasar-photon-ring',
        ),
      ),
    lensingStrength:
      lerpRange(
        profile.lensingStrength,
        unit(
          galaxy,
          'quasar-lensing',
        ),
      ),
    dopplerAsymmetry:
      lerpRange(
        profile.dopplerAsymmetry,
        unit(
          galaxy,
          'quasar-doppler',
        ),
      ),
    turbulence:
      lerpRange(
        profile.turbulence,
        unit(
          galaxy,
          'quasar-turbulence',
        ),
      ),
    clumpiness:
      lerpRange(
        profile.clumpiness,
        unit(
          galaxy,
          'quasar-clumpiness',
        ),
      ),
    warp:
      lerpRange(
        profile.warp,
        unit(
          galaxy,
          'quasar-warp',
        ),
      ),
    coronaStrength:
      lerpRange(
        profile.coronaStrength,
        mixUnit(
          unit(
            galaxy,
            'quasar-corona',
          ),
          normalizedMass,
          0.14,
        ),
      ),
    dustTorusOpacity:
      lerpRange(
        profile.dustTorusOpacity,
        unit(
          galaxy,
          'quasar-dust-torus',
        ),
      ),
    jetStrength:
      lerpRange(
        profile.jetStrength,
        unit(
          galaxy,
          'quasar-jet-strength',
        ),
      ),
    jetLength:
      lerpRange(
        profile.jetLength,
        unit(
          galaxy,
          'quasar-jet-length',
        ),
      ),
    jetOpening:
      lerpRange(
        profile.jetOpening,
        unit(
          galaxy,
          'quasar-jet-opening',
        ),
      ),
    jetCollimation:
      lerpRange(
        profile.jetCollimation,
        unit(
          galaxy,
          'quasar-jet-collimation',
        ),
      ),
    counterJetRatio:
      lerpRange(
        profile.counterJetRatio,
        unit(
          galaxy,
          'quasar-counter-jet',
        ),
      ),
    jetKnotStrength:
      lerpRange(
        profile.jetKnotStrength,
        unit(
          galaxy,
          'quasar-jet-knots',
        ),
      ),
    jetPrecession:
      lerpRange(
        profile.jetPrecession,
        unit(
          galaxy,
          'quasar-jet-precession',
        ),
      ),
    windStrength:
      lerpRange(
        profile.windStrength,
        unit(
          galaxy,
          'quasar-wind-strength',
        ),
      ),
    windOpening:
      lerpRange(
        profile.windOpening,
        unit(
          galaxy,
          'quasar-wind-opening',
        ),
      ),
    scatteringHaloStrength:
      lerpRange(
        profile.scatteringHaloStrength,
        unit(
          galaxy,
          'quasar-scattering-halo',
        ),
      ),
    backgroundStarDensity:
      lerp(
        0.006,
        0.020,
        unit(
          galaxy,
          'quasar-background-stars',
        ),
      ),
    palette:
      PALETTES[
        paletteIndex
      ],
  });
}

function assertQuasar(
  galaxy:
    Galaxy,
): void {
  if (
    galaxy.nucleus
      ?.state !==
    GalacticNucleusState
      .QUASAR
  ) {
    throw new RangeError(
      `QUASAR render model requires GalacticNucleusState.QUASAR: G${galaxy.index}.`,
    );
  }
}

function profile(
  inclination:
    readonly [number, number],
  shadowRadius:
    readonly [number, number],
  diskInnerRatio:
    readonly [number, number],
  diskOuterRadius:
    readonly [number, number],
  diskThickness:
    readonly [number, number],
  accretionBrightness:
    readonly [number, number],
  photonRingStrength:
    readonly [number, number],
  lensingStrength:
    readonly [number, number],
  dopplerAsymmetry:
    readonly [number, number],
  turbulence:
    readonly [number, number],
  clumpiness:
    readonly [number, number],
  warp:
    readonly [number, number],
  coronaStrength:
    readonly [number, number],
  dustTorusOpacity:
    readonly [number, number],
  jetStrength:
    readonly [number, number],
  jetLength:
    readonly [number, number],
  jetOpening:
    readonly [number, number],
  jetCollimation:
    readonly [number, number],
  counterJetRatio:
    readonly [number, number],
  jetKnotStrength:
    readonly [number, number],
  jetPrecession:
    readonly [number, number],
  windStrength:
    readonly [number, number],
  windOpening:
    readonly [number, number],
  scatteringHaloStrength:
    readonly [number, number],
): FamilyProfile {
  return Object.freeze({
    inclination,
    shadowRadius,
    diskInnerRatio,
    diskOuterRadius,
    diskThickness,
    accretionBrightness,
    photonRingStrength,
    lensingStrength,
    dopplerAsymmetry,
    turbulence,
    clumpiness,
    warp,
    coronaStrength,
    dustTorusOpacity,
    jetStrength,
    jetLength,
    jetOpening,
    jetCollimation,
    counterJetRatio,
    jetKnotStrength,
    jetPrecession,
    windStrength,
    windOpening,
    scatteringHaloStrength,
  });
}

function palette(
  innerDisk:
    readonly [number, number, number],
  midDisk:
    readonly [number, number, number],
  outerDisk:
    readonly [number, number, number],
  photonRing:
    readonly [number, number, number],
  corona:
    readonly [number, number, number],
  jetCore:
    readonly [number, number, number],
  jetSheath:
    readonly [number, number, number],
  wind:
    readonly [number, number, number],
): QuasarNucleusPalette {
  return Object.freeze({
    innerDisk:
      Object.freeze(innerDisk),
    midDisk:
      Object.freeze(midDisk),
    outerDisk:
      Object.freeze(outerDisk),
    photonRing:
      Object.freeze(photonRing),
    corona:
      Object.freeze(corona),
    jetCore:
      Object.freeze(jetCore),
    jetSheath:
      Object.freeze(jetSheath),
    wind:
      Object.freeze(wind),
  });
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
  return lerp(
    range[0],
    range[1],
    clamp01(
      t,
    ),
  );
}

function lerp(
  from:
    number,
  to:
    number,
  t:
    number,
): number {
  return from +
    (to - from) *
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
