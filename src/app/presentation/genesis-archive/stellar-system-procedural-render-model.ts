import {
  ArchiveStellarSystemKnowledgeLevel,
  type ArchiveStellarSystemRenderDescriptor,
} from './archive-stellar-system-card';

import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

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
            Object.freeze({
              label:
                'A' as const,
              x:
                VIEWBOX_CENTER,
              y:
                VIEWBOX_CENTER,
              radius:
                5,
              colorHex:
                descriptor.components[0]?.colorHex ??
                '#68808D',
            }),
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
        ),
        renderPoint(
          secondary,
          secondaryX,
          centerY,
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
        ),
        renderPoint(
          secondary,
          clampCoordinate(
            secondaryX,
          ),
          VIEWBOX_CENTER,
        ),
        renderPoint(
          tertiary,
          clampCoordinate(
            tertiaryX,
          ),
          VIEWBOX_CENTER,
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
): StellarSystemRenderPointModel {

  return Object.freeze({
    label:
      component.label,
    x,
    y,
    radius:
      4.25 *
      component.radiusScale,
    colorHex:
      component.colorHex,
  });
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
