import {
  ArchiveStellarSystemKnowledgeLevel,
  type ArchiveStellarSystemRenderDescriptor,
} from './archive-stellar-system-card';

import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

export interface StellarSystemRenderStarLightProfileModel {
  readonly coronaRadius:
    number;

  readonly bloomRadius:
    number;

  readonly aureoleRadius:
    number;

  readonly diffractionSoftLength:
    number;

  readonly diffractionPrimaryLength:
    number;

  readonly diffractionShoulderLength:
    number;

  readonly diffractionSecondaryLength:
    number;

  readonly diffractionMicroLength:
    number;

  readonly coronaOpacity:
    number;

  readonly bloomOpacity:
    number;

  readonly aureoleOpacity:
    number;

  readonly diffractionSoftOpacity:
    number;

  readonly diffractionPrimaryOpacity:
    number;

  readonly diffractionShoulderOpacity:
    number;

  readonly diffractionSecondaryOpacity:
    number;

  readonly diffractionMicroOpacity:
    number;

  readonly hasMicroDiffraction:
    boolean;

  readonly diffractionColorHex:
    string;
}

export interface StellarSystemRenderPointModel {
  readonly label:
    'A' | 'B' | 'C';

  readonly x:
    number;

  readonly y:
    number;

  readonly radius:
    number;

  readonly colorHex:
    string;

  readonly lightProfile:
    StellarSystemRenderStarLightProfileModel;
}

export interface StellarSystemRenderOrbitModel {
  readonly kind:
    'inner' | 'outer';

  readonly cx:
    number;

  readonly cy:
    number;

  readonly rx:
    number;

  readonly ry:
    number;
}

export interface StellarSystemRenderHabitableBandModel {
  readonly cx:
    number;

  readonly cy:
    number;

  readonly radius:
    number;

  readonly strokeWidth:
    number;
}

export interface StellarSystemProceduralRenderModel {
  readonly unresolved:
    boolean;

  readonly barycentreX:
    number;

  readonly barycentreY:
    number;

  readonly components:
    readonly StellarSystemRenderPointModel[];

  readonly orbits:
    readonly StellarSystemRenderOrbitModel[];

  readonly habitableBand:
    StellarSystemRenderHabitableBandModel | null;
}

const VIEWBOX_CENTER =
  50;

const BINARY_OPTICAL_SPATIAL_SCALE =
  0.62;

const BINARY_OPTICAL_OPACITY_SCALE =
  0.86;

const TRIPLE_INNER_OPTICAL_SPATIAL_SCALE =
  0.48;

const TRIPLE_INNER_OPTICAL_OPACITY_SCALE =
  0.78;

const TRIPLE_TERTIARY_OPTICAL_SPATIAL_SCALE =
  0.56;

const TRIPLE_TERTIARY_OPTICAL_OPACITY_SCALE =
  0.82;

/**
 * Presentation-only point-16.7 schematic layout.
 *
 * Distances are intentionally normalized: the SVG communicates architecture,
 * barycentric relationships and the existence of a stable circumbinary HZ,
 * never a literal AU-to-pixel scale. No simulation value is written back.
 */
export class StellarSystemProceduralRenderModelBuilder {

  private constructor() {}

  static build(
    descriptor:
      ArchiveStellarSystemRenderDescriptor,
  ): StellarSystemProceduralRenderModel {

    if (
      descriptor.knowledgeLevel ===
        ArchiveStellarSystemKnowledgeLevel.DETECTED ||
      descriptor.multiplicity ===
        null
    ) {
      return Object.freeze({
        unresolved:
          true,
        barycentreX:
          VIEWBOX_CENTER,
        barycentreY:
          VIEWBOX_CENTER,
        components:
          Object.freeze([
            unresolvedRenderPoint(
              descriptor.components[0]?.colorHex ??
                '#68808D',
            ),
          ]),
        orbits:
          Object.freeze([]),
        habitableBand:
          null,
      });
    }

    if (
      descriptor.multiplicity ===
      StellarSystemMultiplicity.SINGLE
    ) {
      return singleModel(
        descriptor,
      );
    }

    if (
      descriptor.multiplicity ===
      StellarSystemMultiplicity.BINARY
    ) {
      return binaryModel(
        descriptor,
      );
    }

    return tripleModel(
      descriptor,
    );
  }
}

function singleModel(
  descriptor:
    ArchiveStellarSystemRenderDescriptor,
): StellarSystemProceduralRenderModel {

  const component =
    descriptor.components[0]!;

  const systemRadiusScales =
    descriptor.components.map(
      candidate =>
        candidate.radiusScale,
    );

  return Object.freeze({
    unresolved:
      false,
    barycentreX:
      VIEWBOX_CENTER,
    barycentreY:
      VIEWBOX_CENTER,
    components:
      Object.freeze([
        renderPoint(
          component,
          VIEWBOX_CENTER,
          VIEWBOX_CENTER,
          1,
          1,
          systemRadiusScales,
        ),
      ]),
    orbits:
      Object.freeze([]),
    habitableBand:
      null,
  });
}

function binaryModel(
  descriptor:
    ArchiveStellarSystemRenderDescriptor,
): StellarSystemProceduralRenderModel {

  const primary =
    descriptor.components[0]!;

  const secondary =
    descriptor.components[1]!;

  const centerX =
    VIEWBOX_CENTER;

  const centerY =
    VIEWBOX_CENTER;

  const innerSeparation =
    30;

  const shares =
    barycentricShares(
      primary.massSolar,
      secondary.massSolar,
    );

  const primaryX =
    centerX -
    innerSeparation *
      shares.secondary;

  const secondaryX =
    centerX +
    innerSeparation *
      shares.primary;

  const systemRadiusScales =
    descriptor.components.map(
      component =>
        component.radiusScale,
    );

  const orbits =
    descriptor.innerOrbitEccentricity ===
      null
      ? Object.freeze([])
      : Object.freeze([
          orbitModel(
            'inner',
            centerX,
            centerY,
            21,
            descriptor.innerOrbitEccentricity,
          ),
        ]);

  return Object.freeze({
    unresolved:
      false,
    barycentreX:
      centerX,
    barycentreY:
      centerY,
    components:
      Object.freeze([
        renderPoint(
          primary,
          primaryX,
          centerY,
          BINARY_OPTICAL_SPATIAL_SCALE,
          BINARY_OPTICAL_OPACITY_SCALE,
          systemRadiusScales,
        ),
        renderPoint(
          secondary,
          secondaryX,
          centerY,
          BINARY_OPTICAL_SPATIAL_SCALE,
          BINARY_OPTICAL_OPACITY_SCALE,
          systemRadiusScales,
        ),
      ]),
    orbits,
    habitableBand:
      habitableBand(
        descriptor,
        centerX,
        centerY,
      ),
  });
}

function tripleModel(
  descriptor:
    ArchiveStellarSystemRenderDescriptor,
): StellarSystemProceduralRenderModel {

  const primary =
    descriptor.components[0]!;

  const secondary =
    descriptor.components[1]!;

  const tertiary =
    descriptor.components[2]!;

  const innerPairMass =
    finitePositiveOrNull(
      primary.massSolar,
    ) !==
      null &&
    finitePositiveOrNull(
      secondary.massSolar,
    ) !==
      null
      ? primary.massSolar! +
        secondary.massSolar!
      : null;

  const outerShares =
    barycentricShares(
      innerPairMass,
      tertiary.massSolar,
    );

  const outerSeparation =
    54;

  const innerCenterX =
    VIEWBOX_CENTER -
    outerSeparation *
      outerShares.secondary;

  const tertiaryX =
    VIEWBOX_CENTER +
    outerSeparation *
      outerShares.primary;

  const innerShares =
    barycentricShares(
      primary.massSolar,
      secondary.massSolar,
    );

  const innerSeparation =
    18;

  const primaryX =
    innerCenterX -
    innerSeparation *
      innerShares.secondary;

  const secondaryX =
    innerCenterX +
    innerSeparation *
      innerShares.primary;

  const systemRadiusScales =
    descriptor.components.map(
      component =>
        component.radiusScale,
    );

  const orbits:
    StellarSystemRenderOrbitModel[] =
    [];

  if (
    descriptor.outerOrbitEccentricity !==
      null
  ) {
    orbits.push(
      orbitModel(
        'outer',
        VIEWBOX_CENTER,
        VIEWBOX_CENTER,
        40,
        descriptor.outerOrbitEccentricity,
      ),
    );
  }

  if (
    descriptor.innerOrbitEccentricity !==
      null
  ) {
    orbits.push(
      orbitModel(
        'inner',
        innerCenterX,
        VIEWBOX_CENTER,
        13,
        descriptor.innerOrbitEccentricity,
      ),
    );
  }

  return Object.freeze({
    unresolved:
      false,
    barycentreX:
      innerCenterX,
    barycentreY:
      VIEWBOX_CENTER,
    components:
      Object.freeze([
        renderPoint(
          primary,
          clampCoordinate(
            primaryX,
          ),
          VIEWBOX_CENTER,
          TRIPLE_INNER_OPTICAL_SPATIAL_SCALE,
          TRIPLE_INNER_OPTICAL_OPACITY_SCALE,
          systemRadiusScales,
        ),
        renderPoint(
          secondary,
          clampCoordinate(
            secondaryX,
          ),
          VIEWBOX_CENTER,
          TRIPLE_INNER_OPTICAL_SPATIAL_SCALE,
          TRIPLE_INNER_OPTICAL_OPACITY_SCALE,
          systemRadiusScales,
        ),
        renderPoint(
          tertiary,
          clampCoordinate(
            tertiaryX,
          ),
          VIEWBOX_CENTER,
          TRIPLE_TERTIARY_OPTICAL_SPATIAL_SCALE,
          TRIPLE_TERTIARY_OPTICAL_OPACITY_SCALE,
          systemRadiusScales,
        ),
      ]),
    orbits:
      Object.freeze(
        orbits,
      ),
    habitableBand:
      habitableBand(
        descriptor,
        innerCenterX,
        VIEWBOX_CENTER,
      ),
  });
}

function renderPoint(
  component:
    ArchiveStellarSystemRenderDescriptor[
      'components'
    ][number],

  x:
    number,

  y:
    number,

  lightSpatialScale =
    1,

  lightOpacityScale =
    1,

  systemRadiusScales:
    readonly number[] = [],
): StellarSystemRenderPointModel {

  const radius =
    visualPhotosphereRadius(
      component.radiusScale,
      systemRadiusScales,
    );

  return Object.freeze({
    label:
      component.label,
    x,
    y,
    radius,
    colorHex:
      component.colorHex,
    lightProfile:
      starLightProfile(
        component.colorHex,
        radius,
        component.radiusScale,
        component.massSolar,
        lightSpatialScale,
        lightOpacityScale,
      ),
  });
}

function unresolvedRenderPoint(
  colorHex:
    string,
): StellarSystemRenderPointModel {

  const radius =
    5;

  return Object.freeze({
    label:
      'A',
    x:
      VIEWBOX_CENTER,
    y:
      VIEWBOX_CENTER,
    radius,
    colorHex,
    lightProfile:
      starLightProfile(
        colorHex,
        radius,
        1,
        null,
      ),
  });
}

/**
 * Optical presentation profile for the point-16.7 SVG renderer.
 *
 * This is deliberately presentation-only: it derives bloom/corona/diffraction
 * from values already authorized by the archive card and never writes a
 * simulation property back. DISCOVERED therefore receives a neutral profile,
 * while CATALOGUED/CONFIRMED can express the frozen spectral colour and size.
 */
function starLightProfile(
  colorHex:
    string,

  radius:
    number,

  radiusScale:
    number,

  massSolar:
    number | null,

  spatialScale =
    1,

  opacityScale =
    1,
): StellarSystemRenderStarLightProfileModel {

  const rgb =
    parseHexColor(
      colorHex,
    );

  const luminance =
    (
      0.2126 *
        rgb.red +
      0.7152 *
        rgb.green +
      0.0722 *
        rgb.blue
    ) /
    255;

  const blueBias =
    clamp01(
      0.5 +
      (
        rgb.blue -
        rgb.red
      ) /
        510,
    );

  const sizeEnergy =
    clamp01(
      (
        radiusScale -
        0.72
      ) /
        0.83,
    );

  const massEnergy =
    massSolar ===
        null
      ? 0.38
      : clamp01(
          Math.log10(
            1 +
            Math.max(
              0,
              massSolar,
            ),
          ) /
            1.35,
        );

  const energy =
    clamp01(
      0.14 +
      0.24 *
        luminance +
      0.18 *
        blueBias +
      0.20 *
        sizeEnergy +
      0.24 *
        massEnergy,
    );

  return Object.freeze({
    coronaRadius:
      radius *
      (
        4.9 +
        3.9 *
          energy
      ) *
      spatialScale,
    bloomRadius:
      radius *
      (
        3.05 +
        2.05 *
          energy
      ) *
      spatialScale,
    aureoleRadius:
      radius *
      (
        1.95 +
        1.05 *
          energy
      ) *
      spatialScale,
    diffractionSoftLength:
      radius *
      (
        9.2 +
        8.6 *
          energy
      ) *
      spatialScale,
    diffractionPrimaryLength:
      radius *
      (
        5.1 +
        5.8 *
          energy
      ) *
      spatialScale,
    diffractionShoulderLength:
      radius *
      (
        1.55 +
        1.35 *
          energy
      ) *
      spatialScale,
    diffractionSecondaryLength:
      radius *
      (
        2.75 +
        2.85 *
          energy
      ) *
      spatialScale,
    diffractionMicroLength:
      radius *
      (
        1.75 +
        1.45 *
          energy
      ) *
      spatialScale,
    coronaOpacity:
      (
        0.05 +
        0.095 *
          energy
      ) *
      opacityScale,
    bloomOpacity:
      (
        0.15 +
        0.21 *
          energy
      ) *
      opacityScale,
    aureoleOpacity:
      (
        0.19 +
        0.24 *
          energy
      ) *
      opacityScale,
    diffractionSoftOpacity:
      (
        0.045 +
        0.095 *
          energy
      ) *
      opacityScale,
    diffractionPrimaryOpacity:
      (
        0.12 +
        0.26 *
          energy
      ) *
      opacityScale,
    diffractionShoulderOpacity:
      (
        0.08 +
        0.17 *
          energy
      ) *
      opacityScale,
    diffractionSecondaryOpacity:
      (
        0.075 +
        0.15 *
          energy
      ) *
      opacityScale,
    diffractionMicroOpacity:
      (
        0.035 +
        0.095 *
          energy
      ) *
      opacityScale,
    hasMicroDiffraction:
      energy >=
        0.52 ||
      blueBias >=
        0.62,
    diffractionColorHex:
      mixHexColor(
        colorHex,
        '#FFFFFF',
        0.34 +
          0.18 *
            energy,
      ),
  });
}

/**
 * Converts the already compressed physical radius scale into the SVG
 * photosphere radius. For multiple systems, a second bounded relative term
 * makes A/B/C differences visible inside the same system without ever using a
 * literal solar-radius-to-pixel scale.
 */
function visualPhotosphereRadius(
  radiusScale:
    number,

  systemRadiusScales:
    readonly number[],
): number {

  const safeScale =
    Math.min(
      1.36,
      Math.max(
        0.68,
        Number.isFinite(
          radiusScale,
        )
          ? radiusScale
          : 1,
      ),
    );

  // Square-root compression keeps even very large physical differences
  // modest in the diagram while remaining monotonic.
  const absoluteRadius =
    4.25 *
    Math.sqrt(
      safeScale,
    );

  const relativeOffset =
    relativeSystemRadiusOffset(
      safeScale,
      systemRadiusScales,
    );

  return Math.min(
    5.45,
    Math.max(
      3.15,
      absoluteRadius +
        relativeOffset,
    ),
  );
}

function relativeSystemRadiusOffset(
  radiusScale:
    number,

  systemRadiusScales:
    readonly number[],
): number {

  const finiteScales =
    systemRadiusScales
      .filter(
        candidate =>
          Number.isFinite(
            candidate,
          ) &&
          candidate >
            0,
      )
      .map(
        candidate =>
          Math.min(
            1.36,
            Math.max(
              0.68,
              candidate,
            ),
          ),
      );

  if (
    finiteScales.length <=
      1
  ) {
    return 0;
  }

  const minimum =
    Math.min(
      ...finiteScales,
    );

  const maximum =
    Math.max(
      ...finiteScales,
    );

  const spread =
    maximum -
    minimum;

  if (
    spread <
      0.01
  ) {
    return 0;
  }

  const position =
    clamp01(
      (
        radiusScale -
        minimum
      ) /
        spread,
    );

  // Tiny physical differences receive almost no amplification. The relative
  // accent reaches its full ±0.32 px only for clearly different components.
  const contrastStrength =
    clamp01(
      spread /
        0.35,
    );

  return (
    position *
      2 -
    1
  ) *
    0.32 *
    contrastStrength;
}

function parseHexColor(
  colorHex:
    string,
): {
  readonly red:
    number;

  readonly green:
    number;

  readonly blue:
    number;
} {

  const normalized =
    colorHex
      .trim()
      .replace(
        '#',
        '',
      );

  const expanded =
    normalized.length ===
      3
      ? normalized
          .split('')
          .map(
            value =>
              value +
              value,
          )
          .join('')
      : normalized;

  if (
    !/^[0-9A-Fa-f]{6}$/.test(
      expanded,
    )
  ) {
    return {
      red:
        168,
      green:
        192,
      blue:
        204,
    };
  }

  return {
    red:
      Number.parseInt(
        expanded.slice(
          0,
          2,
        ),
        16,
      ),
    green:
      Number.parseInt(
        expanded.slice(
          2,
          4,
        ),
        16,
      ),
    blue:
      Number.parseInt(
        expanded.slice(
          4,
          6,
        ),
        16,
      ),
  };
}

function mixHexColor(
  first:
    string,

  second:
    string,

  secondWeight:
    number,
): string {

  const from =
    parseHexColor(
      first,
    );

  const to =
    parseHexColor(
      second,
    );

  const weight =
    clamp01(
      secondWeight,
    );

  return `#${[
    mixChannel(
      from.red,
      to.red,
      weight,
    ),
    mixChannel(
      from.green,
      to.green,
      weight,
    ),
    mixChannel(
      from.blue,
      to.blue,
      weight,
    ),
  ]
    .map(
      value =>
        value
          .toString(
            16,
          )
          .padStart(
            2,
            '0',
          )
          .toUpperCase(),
    )
    .join('')}`;
}

function mixChannel(
  from:
    number,

  to:
    number,

  weight:
    number,
): number {

  return Math.round(
    from +
    (
      to -
      from
    ) *
      weight,
  );
}

function clamp01(
  value:
    number,
): number {

  return Math.max(
    0,
    Math.min(
      1,
      value,
    ),
  );
}

function orbitModel(
  kind:
    'inner' | 'outer',

  cx:
    number,

  cy:
    number,

  rx:
    number,

  eccentricity:
    number,
): StellarSystemRenderOrbitModel {

  const normalizedEccentricity =
    Math.min(
      0.92,
      Math.max(
        0,
        eccentricity,
      ),
    );

  const ry =
    Math.max(
      kind ===
        'inner'
        ? 5.5
        : 10,
      rx *
        Math.sqrt(
          1 -
          normalizedEccentricity **
            2,
        ),
    );

  return Object.freeze({
    kind,
    cx,
    cy,
    rx,
    ry,
  });
}

function habitableBand(
  descriptor:
    ArchiveStellarSystemRenderDescriptor,

  cx:
    number,

  cy:
    number,
): StellarSystemRenderHabitableBandModel | null {

  if (
    !descriptor.hasStableHabitableZone ||
    descriptor.stableHabitableZoneFraction ===
      null ||
    descriptor.stableHabitableZoneFraction <=
      0
  ) {
    return null;
  }

  const fraction =
    Math.min(
      1,
      descriptor.stableHabitableZoneFraction,
    );

  const strokeWidth =
    2.4 +
    5.6 *
      fraction;

  return Object.freeze({
    cx,
    cy,
    radius:
      25.5 +
      strokeWidth /
        2,
    strokeWidth,
  });
}

function barycentricShares(
  primaryMass:
    number | null,

  secondaryMass:
    number | null,
): {
  readonly primary:
    number;

  readonly secondary:
    number;
} {

  const primary =
    finitePositiveOrNull(
      primaryMass,
    );

  const secondary =
    finitePositiveOrNull(
      secondaryMass,
    );

  if (
    primary ===
      null ||
    secondary ===
      null
  ) {
    return {
      primary:
        0.5,
      secondary:
        0.5,
    };
  }

  const total =
    primary +
    secondary;

  return {
    primary:
      primary /
      total,
    secondary:
      secondary /
      total,
  };
}

function finitePositiveOrNull(
  value:
    number | null,
): number | null {

  return value !==
      null &&
    Number.isFinite(
      value,
    ) &&
    value >
      0
    ? value
    : null;
}

function clampCoordinate(
  value:
    number,
): number {

  return Math.max(
    8,
    Math.min(
      92,
      value,
    ),
  );
}
