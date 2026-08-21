import {
  GalacticNucleusState,
} from '../../../domain/universe/galactic-nucleus-state';

import {
  type Galaxy,
} from '../../../domain/universe/galaxy';

export const AgnNucleusVisualFamily =
  Object.freeze({
    THIN_LUMINOUS_DISK:
      'THIN_LUMINOUS_DISK',
    EDGE_ON_LENSED_DISK:
      'EDGE_ON_LENSED_DISK',
    THICK_HOT_TORUS:
      'THICK_HOT_TORUS',
    PHOTON_RING_DOMINANT:
      'PHOTON_RING_DOMINANT',
    WARPED_ACCRETION_FLOW:
      'WARPED_ACCRETION_FLOW',
    DOPPLER_BRIGHT_CRESCENT:
      'DOPPLER_BRIGHT_CRESCENT',
    CLUMPY_FEEDING_DISK:
      'CLUMPY_FEEDING_DISK',
    LOW_LUMINOSITY_AGN:
      'LOW_LUMINOSITY_AGN',
  } as const);

export type AgnNucleusVisualFamily =
  typeof AgnNucleusVisualFamily[
    keyof typeof AgnNucleusVisualFamily
  ];

export const AGN_NUCLEUS_VISUAL_FAMILIES:
  readonly AgnNucleusVisualFamily[] =
  Object.freeze([
    AgnNucleusVisualFamily
      .THIN_LUMINOUS_DISK,
    AgnNucleusVisualFamily
      .EDGE_ON_LENSED_DISK,
    AgnNucleusVisualFamily
      .THICK_HOT_TORUS,
    AgnNucleusVisualFamily
      .PHOTON_RING_DOMINANT,
    AgnNucleusVisualFamily
      .WARPED_ACCRETION_FLOW,
    AgnNucleusVisualFamily
      .DOPPLER_BRIGHT_CRESCENT,
    AgnNucleusVisualFamily
      .CLUMPY_FEEDING_DISK,
    AgnNucleusVisualFamily
      .LOW_LUMINOSITY_AGN,
  ]);

export interface AgnNucleusPalette {
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
}

export interface AgnNucleusRenderModel {
  readonly seed:
    string;

  readonly family:
    AgnNucleusVisualFamily;

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

  readonly dustOpacity:
    number;

  readonly temperatureBias:
    number;

  readonly backgroundStarDensity:
    number;

  readonly palette:
    AgnNucleusPalette;
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

  readonly dustOpacity:
    readonly [number, number];

  readonly temperatureBias:
    readonly [number, number];
}

const FAMILY_PROFILES:
  Readonly<Record<
    AgnNucleusVisualFamily,
    FamilyProfile
  >> =
  Object.freeze({
    [AgnNucleusVisualFamily.THIN_LUMINOUS_DISK]:
      profile(
        [0.18, 0.45],
        [0.090, 0.122],
        [1.34, 1.55],
        [0.62, 0.76],
        [0.032, 0.055],
        [0.72, 0.90],
        [0.58, 0.78],
        [0.48, 0.68],
        [0.18, 0.34],
        [0.20, 0.38],
        [0.10, 0.24],
        [0.00, 0.06],
        [0.18, 0.32],
        [0.02, 0.10],
        [0.62, 0.86],
      ),

    [AgnNucleusVisualFamily.EDGE_ON_LENSED_DISK]:
      profile(
        [0.78, 0.92],
        [0.096, 0.132],
        [1.38, 1.62],
        [0.68, 0.84],
        [0.020, 0.040],
        [0.68, 0.86],
        [0.70, 0.92],
        [0.82, 1.00],
        [0.28, 0.52],
        [0.22, 0.42],
        [0.10, 0.22],
        [0.00, 0.05],
        [0.18, 0.34],
        [0.10, 0.24],
        [0.58, 0.82],
      ),

    [AgnNucleusVisualFamily.THICK_HOT_TORUS]:
      profile(
        [0.38, 0.64],
        [0.086, 0.120],
        [1.28, 1.48],
        [0.66, 0.82],
        [0.075, 0.120],
        [0.78, 0.96],
        [0.52, 0.72],
        [0.46, 0.66],
        [0.16, 0.32],
        [0.36, 0.58],
        [0.20, 0.38],
        [0.02, 0.09],
        [0.34, 0.54],
        [0.04, 0.14],
        [0.76, 0.98],
      ),

    [AgnNucleusVisualFamily.PHOTON_RING_DOMINANT]:
      profile(
        [0.48, 0.76],
        [0.104, 0.142],
        [1.30, 1.48],
        [0.56, 0.70],
        [0.028, 0.052],
        [0.62, 0.78],
        [0.90, 1.00],
        [0.84, 1.00],
        [0.20, 0.42],
        [0.16, 0.30],
        [0.08, 0.18],
        [0.00, 0.04],
        [0.22, 0.38],
        [0.02, 0.08],
        [0.74, 0.96],
      ),

    [AgnNucleusVisualFamily.WARPED_ACCRETION_FLOW]:
      profile(
        [0.46, 0.72],
        [0.090, 0.126],
        [1.34, 1.58],
        [0.68, 0.84],
        [0.044, 0.076],
        [0.70, 0.88],
        [0.58, 0.78],
        [0.60, 0.80],
        [0.22, 0.42],
        [0.30, 0.52],
        [0.16, 0.32],
        [0.12, 0.24],
        [0.22, 0.40],
        [0.05, 0.15],
        [0.58, 0.84],
      ),

    [AgnNucleusVisualFamily.DOPPLER_BRIGHT_CRESCENT]:
      profile(
        [0.58, 0.82],
        [0.096, 0.132],
        [1.32, 1.54],
        [0.62, 0.78],
        [0.032, 0.056],
        [0.74, 0.92],
        [0.66, 0.86],
        [0.66, 0.86],
        [0.62, 0.88],
        [0.20, 0.38],
        [0.10, 0.24],
        [0.00, 0.05],
        [0.24, 0.42],
        [0.02, 0.10],
        [0.68, 0.92],
      ),

    [AgnNucleusVisualFamily.CLUMPY_FEEDING_DISK]:
      profile(
        [0.34, 0.66],
        [0.088, 0.124],
        [1.38, 1.62],
        [0.72, 0.90],
        [0.050, 0.090],
        [0.68, 0.86],
        [0.48, 0.68],
        [0.44, 0.66],
        [0.18, 0.36],
        [0.46, 0.68],
        [0.58, 0.84],
        [0.04, 0.12],
        [0.18, 0.34],
        [0.20, 0.42],
        [0.46, 0.72],
      ),

    [AgnNucleusVisualFamily.LOW_LUMINOSITY_AGN]:
      profile(
        [0.30, 0.68],
        [0.108, 0.150],
        [1.42, 1.72],
        [0.48, 0.62],
        [0.024, 0.048],
        [0.40, 0.58],
        [0.46, 0.66],
        [0.42, 0.62],
        [0.12, 0.28],
        [0.28, 0.48],
        [0.28, 0.52],
        [0.02, 0.10],
        [0.10, 0.22],
        [0.20, 0.40],
        [0.28, 0.52],
      ),
  });

const PALETTES:
  readonly AgnNucleusPalette[] =
  Object.freeze([
    palette(
      [1.00, 0.95, 0.78],
      [1.00, 0.56, 0.12],
      [0.62, 0.11, 0.025],
      [1.00, 0.80, 0.42],
      [1.00, 0.72, 0.28],
    ),
    palette(
      [1.00, 0.88, 0.62],
      [1.00, 0.43, 0.07],
      [0.74, 0.15, 0.025],
      [1.00, 0.70, 0.30],
      [1.00, 0.58, 0.16],
    ),
    palette(
      [1.00, 0.98, 0.90],
      [1.00, 0.68, 0.24],
      [0.52, 0.07, 0.02],
      [1.00, 0.90, 0.62],
      [1.00, 0.76, 0.36],
    ),
    palette(
      [1.00, 0.82, 0.56],
      [0.96, 0.35, 0.05],
      [0.48, 0.055, 0.018],
      [1.00, 0.62, 0.22],
      [0.94, 0.46, 0.10],
    ),
  ]);

export function resolveAgnNucleusVisualFamily(
  galaxy:
    Galaxy,
): AgnNucleusVisualFamily {
  assertAgn(
    galaxy,
  );

  return AGN_NUCLEUS_VISUAL_FAMILIES[
    Math.min(
      AGN_NUCLEUS_VISUAL_FAMILIES.length - 1,
      Math.floor(
        unit(
          galaxy,
          'agn-family',
        ) *
        AGN_NUCLEUS_VISUAL_FAMILIES.length,
      ),
    )
  ];
}

export function createAgnNucleusRenderModel(
  galaxy:
    Galaxy,
): AgnNucleusRenderModel {
  assertAgn(
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
      'AGN render model requires a supermassive black hole.',
    );
  }

  const family =
    resolveAgnNucleusVisualFamily(
      galaxy,
    );

  const familyIndex =
    AGN_NUCLEUS_VISUAL_FAMILIES
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
          'agn-shadow-radius',
        ),
        normalizedMass,
        0.34,
      ),
    );

  const temperatureBias =
    lerpRange(
      profile.temperatureBias,
      mixUnit(
        unit(
          galaxy,
          'agn-temperature',
        ),
        1 -
          normalizedMass,
        0.22,
      ),
    );

  const paletteIndex =
    Math.min(
      PALETTES.length - 1,
      Math.floor(
        unit(
          galaxy,
          'agn-palette',
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
        'agn-orientation',
      ) *
      Math.PI *
      2,
    inclination:
      lerpRange(
        profile.inclination,
        unit(
          galaxy,
          'agn-inclination',
        ),
      ),
    shadowRadius,
    diskInnerRadius:
      shadowRadius *
      lerpRange(
        profile.diskInnerRatio,
        unit(
          galaxy,
          'agn-inner-disk',
        ),
      ),
    diskOuterRadius:
      lerpRange(
        profile.diskOuterRadius,
        mixUnit(
          unit(
            galaxy,
            'agn-outer-disk',
          ),
          normalizedMass,
          0.12,
        ),
      ),
    diskThickness:
      lerpRange(
        profile.diskThickness,
        unit(
          galaxy,
          'agn-thickness',
        ),
      ),
    accretionBrightness:
      lerpRange(
        profile.accretionBrightness,
        unit(
          galaxy,
          'agn-brightness',
        ),
      ),
    photonRingStrength:
      lerpRange(
        profile.photonRingStrength,
        unit(
          galaxy,
          'agn-photon-ring',
        ),
      ),
    lensingStrength:
      lerpRange(
        profile.lensingStrength,
        unit(
          galaxy,
          'agn-lensing',
        ),
      ),
    dopplerAsymmetry:
      lerpRange(
        profile.dopplerAsymmetry,
        unit(
          galaxy,
          'agn-doppler',
        ),
      ),
    turbulence:
      lerpRange(
        profile.turbulence,
        unit(
          galaxy,
          'agn-turbulence',
        ),
      ),
    clumpiness:
      lerpRange(
        profile.clumpiness,
        unit(
          galaxy,
          'agn-clumpiness',
        ),
      ),
    warp:
      lerpRange(
        profile.warp,
        unit(
          galaxy,
          'agn-warp',
        ),
      ),
    coronaStrength:
      lerpRange(
        profile.coronaStrength,
        unit(
          galaxy,
          'agn-corona',
        ),
      ),
    dustOpacity:
      lerpRange(
        profile.dustOpacity,
        unit(
          galaxy,
          'agn-dust',
        ),
      ),
    temperatureBias,
    backgroundStarDensity:
      lerp(
        0.012,
        0.032,
        unit(
          galaxy,
          'agn-background-stars',
        ),
      ),
    palette:
      temperatureAdjustedPalette(
        PALETTES[
          paletteIndex
        ],
        temperatureBias,
      ),
  });
}

function assertAgn(
  galaxy:
    Galaxy,
): void {
  if (
    galaxy.nucleus
      ?.state !==
    GalacticNucleusState
      .AGN
  ) {
    throw new RangeError(
      `AGN render model requires GalacticNucleusState.AGN: G${galaxy.index}.`,
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
  dustOpacity:
    readonly [number, number],
  temperatureBias:
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
    dustOpacity,
    temperatureBias,
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
): AgnNucleusPalette {
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
  });
}

function temperatureAdjustedPalette(
  source:
    AgnNucleusPalette,
  temperatureBias:
    number,
): AgnNucleusPalette {
  const hot =
    0.90 +
    0.10 *
    temperatureBias;

  return palette(
    scaleColor(
      source.innerDisk,
      1.00,
      hot,
    ),
    scaleColor(
      source.midDisk,
      1.00,
      0.92 + 0.08 * temperatureBias,
    ),
    scaleColor(
      source.outerDisk,
      0.90 + 0.10 * temperatureBias,
      0.92,
    ),
    scaleColor(
      source.photonRing,
      1.00,
      hot,
    ),
    scaleColor(
      source.corona,
      1.00,
      hot,
    ),
  );
}

function scaleColor(
  color:
    readonly [number, number, number],
  redScale:
    number,
  blueScale:
    number,
): readonly [number, number, number] {
  return Object.freeze([
    clamp01(
      color[0] *
      redScale,
    ),
    clamp01(
      color[1] *
      (0.96 + 0.04 * blueScale),
    ),
    clamp01(
      color[2] *
      blueScale,
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
