import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  ArchiveGalacticObjectRenderProfile,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

export type OpenClusterMorphologyFamily =
  | 'LOOSE'
  | 'COMPACT'
  | 'ELONGATED'
  | 'SUBCLUSTERED'
  | 'CHAIN'
  | 'ASYMMETRIC'
  | 'HALO'
  | 'MULTI_CORE';

export type OpenClusterPaletteFamily =
  | 'BLUE_WHITE'
  | 'CYAN_SILVER'
  | 'MIXED_YOUNG'
  | 'BLUE_GOLD'
  | 'ICE_VIOLET'
  | 'MIXED_MATURE';

export interface OpenClusterRenderModel {
  readonly structureSeedX: number;
  readonly structureSeedY: number;
  readonly morphologyIndex: number;
  readonly morphologyFamily: OpenClusterMorphologyFamily;
  readonly paletteIndex: number;
  readonly paletteFamily: OpenClusterPaletteFamily;
  readonly orientationRadians: number;
  readonly structureAspect: number;
  readonly apparentExtent: number;
  readonly concentrationBias: number;
  readonly subclusterStrength: number;
  readonly asymmetryStrength: number;
  readonly elongationStrength: number;
  readonly haloStrength: number;
  readonly chainStrength: number;
  readonly memberRichness: number;
  readonly brightMemberBias: number;
  readonly binaryHint: number;
  readonly hazeStrength: number;
  readonly hotStarBias: number;
  readonly warmStarBias: number;
  readonly colorVariance: number;
  readonly memberVisibility: number;
  readonly faintMemberVisibility: number;
  readonly chromaGain: number;
  readonly detailFactor: number;
  readonly hazeVisibility: number;
  readonly physicalScale: number;
  readonly physicalDensity: number;
  readonly physicalEnergy: number;
  readonly physicalConcentration: number;
}

const MORPHOLOGY_FAMILIES =
  Object.freeze([
    'LOOSE',
    'COMPACT',
    'ELONGATED',
    'SUBCLUSTERED',
    'CHAIN',
    'ASYMMETRIC',
    'HALO',
    'MULTI_CORE',
  ] as const);

const PALETTE_FAMILIES =
  Object.freeze([
    'BLUE_WHITE',
    'CYAN_SILVER',
    'MIXED_YOUNG',
    'BLUE_GOLD',
    'ICE_VIOLET',
    'MIXED_MATURE',
  ] as const);

/**
 * Renderer-only open-cluster model.
 *
 * V1.2 keeps V1.1 structural hashes intact while tightening the apparent
 * cluster packing, reducing galaxy-band-like haze, and leaving more emphasis
 * on resolved stellar members plus mild optical sparkle.
 *
 * The seed fixes morphology, star-field layout tendencies and palette. The
 * knowledge level only changes how many of those already-existing members are
 * resolved and how much colour/detail the instrument can recover. Aggregate
 * physical properties may modulate brightness after cataloguing, but they never
 * move the seed-fixed geometry or choose a different morphology family.
 */
export class OpenClusterRenderModelBuilder {

  private constructor() {}

  static build(
    descriptor:
      ArchiveGalacticObjectRenderDescriptor,
  ): OpenClusterRenderModel {

    requireSupportedDescriptor(
      descriptor,
    );

    const structure =
      hashWords(
        `${descriptor.seed}/OPEN-CLUSTER-STRUCTURE-V1`,
      );

    const morphology =
      hashWords(
        `${descriptor.seed}/OPEN-CLUSTER-MORPHOLOGY-V1`,
      );

    const palette =
      hashWords(
        `${descriptor.seed}/OPEN-CLUSTER-PALETTE-V1`,
      );

    const membership =
      hashWords(
        `${descriptor.seed}/OPEN-CLUSTER-MEMBERS-V1`,
      );

    const morphologyIndex =
      selectStableIndex(
        morphology[0],
        MORPHOLOGY_FAMILIES.length,
      );

    const morphologyFamily =
      MORPHOLOGY_FAMILIES[
        morphologyIndex
      ];

    const morphologyProfile =
      morphologyProfileFor(
        morphologyFamily,
        unitFromUint32(structure[2]),
        unitFromUint32(structure[3]),
        unitFromUint32(structure[4]),
        unitFromUint32(morphology[1]),
        unitFromUint32(morphology[2]),
        unitFromUint32(morphology[3]),
        unitFromUint32(morphology[4]),
      );

    const paletteIndex =
      selectStableIndex(
        palette[0],
        PALETTE_FAMILIES.length,
      );

    const paletteFamily =
      PALETTE_FAMILIES[
        paletteIndex
      ];

    const paletteProfile =
      paletteProfileFor(
        paletteFamily,
        unitFromUint32(palette[1]),
        unitFromUint32(palette[2]),
        unitFromUint32(palette[3]),
      );

    const knowledge =
      knowledgeProfileFor(
        descriptor.knowledgeLevel,
      );

    return Object.freeze({
      structureSeedX:
        unitFromUint32(
          structure[0],
        ),
      structureSeedY:
        unitFromUint32(
          structure[1],
        ),
      morphologyIndex,
      morphologyFamily,
      paletteIndex,
      paletteFamily,
      orientationRadians:
        (
          unitFromUint32(
            membership[0],
          ) -
          0.5
        ) *
        Math.PI *
        morphologyProfile.orientationRange,
      structureAspect:
        morphologyProfile.structureAspect,
      apparentExtent:
        morphologyProfile.apparentExtent,
      concentrationBias:
        morphologyProfile.concentrationBias,
      subclusterStrength:
        morphologyProfile.subclusterStrength,
      asymmetryStrength:
        morphologyProfile.asymmetryStrength,
      elongationStrength:
        morphologyProfile.elongationStrength,
      haloStrength:
        morphologyProfile.haloStrength,
      chainStrength:
        morphologyProfile.chainStrength,
      memberRichness:
        0.64 +
        unitFromUint32(
          membership[1],
        ) *
        0.36,
      brightMemberBias:
        0.18 +
        unitFromUint32(
          membership[2],
        ) *
        0.38,
      binaryHint:
        unitFromUint32(
          membership[3],
        ),
      hazeStrength:
        morphologyProfile.hazeBase +
        unitFromUint32(
          membership[4],
        ) *
        morphologyProfile.hazeRange,
      hotStarBias:
        paletteProfile.hotStarBias,
      warmStarBias:
        paletteProfile.warmStarBias,
      colorVariance:
        paletteProfile.colorVariance,
      memberVisibility:
        knowledge.memberVisibility,
      faintMemberVisibility:
        knowledge.faintMemberVisibility,
      chromaGain:
        knowledge.chromaGain,
      detailFactor:
        knowledge.detailFactor,
      hazeVisibility:
        knowledge.hazeVisibility,
      physicalScale:
        descriptor.scale,
      physicalDensity:
        descriptor.density,
      physicalEnergy:
        descriptor.energy,
      physicalConcentration:
        descriptor.concentration,
    });
  }
}

interface MorphologyProfile {
  readonly structureAspect: number;
  readonly apparentExtent: number;
  readonly concentrationBias: number;
  readonly subclusterStrength: number;
  readonly asymmetryStrength: number;
  readonly elongationStrength: number;
  readonly haloStrength: number;
  readonly chainStrength: number;
  readonly hazeBase: number;
  readonly hazeRange: number;
  readonly orientationRange: number;
}

interface PaletteProfile {
  readonly hotStarBias: number;
  readonly warmStarBias: number;
  readonly colorVariance: number;
}

interface KnowledgeProfile {
  readonly memberVisibility: number;
  readonly faintMemberVisibility: number;
  readonly chromaGain: number;
  readonly detailFactor: number;
  readonly hazeVisibility: number;
}

function knowledgeProfileFor(
  knowledgeLevel:
    ArchiveGalacticObjectKnowledgeLevel,
): KnowledgeProfile {

  switch (
    knowledgeLevel
  ) {
    case ArchiveGalacticObjectKnowledgeLevel.SIGNAL:
      return Object.freeze({
        memberVisibility:
          0.24,
        faintMemberVisibility:
          0.08,
        chromaGain:
          0.08,
        detailFactor:
          0.14,
        hazeVisibility:
          0.18,
      });

    case ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED:
      return Object.freeze({
        memberVisibility:
          0.44,
        faintMemberVisibility:
          0.24,
        chromaGain:
          0.28,
        detailFactor:
          0.38,
        hazeVisibility:
          0.38,
      });

    case ArchiveGalacticObjectKnowledgeLevel.CATALOGUED:
      return Object.freeze({
        memberVisibility:
          0.76,
        faintMemberVisibility:
          0.68,
        chromaGain:
          0.78,
        detailFactor:
          0.74,
        hazeVisibility:
          0.76,
      });

    case ArchiveGalacticObjectKnowledgeLevel.CONFIRMED:
      return Object.freeze({
        memberVisibility:
          1,
        faintMemberVisibility:
          1,
        chromaGain:
          1,
        detailFactor:
          1,
        hazeVisibility:
          1,
      });
  }

  throw new RangeError(
    `Unsupported ArchiveGalacticObjectKnowledgeLevel: ${String(knowledgeLevel)}.`,
  );
}

function morphologyProfileFor(
  family:
    OpenClusterMorphologyFamily,

  a:
    number,

  b:
    number,

  c:
    number,

  d:
    number,

  e:
    number,

  f:
    number,

  g:
    number,
): MorphologyProfile {

  switch (
    family
  ) {
    case 'LOOSE':
      return Object.freeze({
        structureAspect:
          0.84 +
          a *
          0.24,
        apparentExtent:
          0.80 +
          b *
          0.14,
        concentrationBias:
          0.28 +
          c *
          0.18,
        subclusterStrength:
          0.20 +
          d *
          0.18,
        asymmetryStrength:
          0.16 +
          e *
          0.16,
        elongationStrength:
          0.10 +
          f *
          0.14,
        haloStrength:
          0.54 +
          g *
          0.18,
        chainStrength:
          0.08 +
          d *
          0.10,
        hazeBase:
          0.006,
        hazeRange:
          0.050,
        orientationRange:
          1.04,
      });

    case 'COMPACT':
      return Object.freeze({
        structureAspect:
          0.90 +
          a *
          0.16,
        apparentExtent:
          0.58 +
          b *
          0.12,
        concentrationBias:
          0.76 +
          c *
          0.18,
        subclusterStrength:
          0.10 +
          d *
          0.12,
        asymmetryStrength:
          0.06 +
          e *
          0.08,
        elongationStrength:
          0.04 +
          f *
          0.08,
        haloStrength:
          0.18 +
          g *
          0.14,
        chainStrength:
          0.04 +
          d *
          0.06,
        hazeBase:
          0.010,
        hazeRange:
          0.045,
        orientationRange:
          0.62,
      });

    case 'ELONGATED':
      return Object.freeze({
        structureAspect:
          1.18 +
          a *
          0.26,
        apparentExtent:
          0.74 +
          b *
          0.16,
        concentrationBias:
          0.40 +
          c *
          0.18,
        subclusterStrength:
          0.18 +
          d *
          0.14,
        asymmetryStrength:
          0.18 +
          e *
          0.16,
        elongationStrength:
          0.78 +
          f *
          0.18,
        haloStrength:
          0.28 +
          g *
          0.16,
        chainStrength:
          0.18 +
          d *
          0.14,
        hazeBase:
          0.006,
        hazeRange:
          0.050,
        orientationRange:
          1.18,
      });

    case 'SUBCLUSTERED':
      return Object.freeze({
        structureAspect:
          0.88 +
          a *
          0.24,
        apparentExtent:
          0.76 +
          b *
          0.16,
        concentrationBias:
          0.42 +
          c *
          0.20,
        subclusterStrength:
          0.76 +
          d *
          0.20,
        asymmetryStrength:
          0.22 +
          e *
          0.20,
        elongationStrength:
          0.14 +
          f *
          0.12,
        haloStrength:
          0.26 +
          g *
          0.16,
        chainStrength:
          0.10 +
          d *
          0.10,
        hazeBase:
          0.010,
        hazeRange:
          0.060,
        orientationRange:
          0.96,
      });

    case 'CHAIN':
      return Object.freeze({
        structureAspect:
          1.10 +
          a *
          0.22,
        apparentExtent:
          0.76 +
          b *
          0.18,
        concentrationBias:
          0.34 +
          c *
          0.16,
        subclusterStrength:
          0.26 +
          d *
          0.16,
        asymmetryStrength:
          0.18 +
          e *
          0.16,
        elongationStrength:
          0.70 +
          f *
          0.18,
        haloStrength:
          0.18 +
          g *
          0.14,
        chainStrength:
          0.82 +
          d *
          0.16,
        hazeBase:
          0.004,
        hazeRange:
          0.040,
        orientationRange:
          1.18,
      });

    case 'ASYMMETRIC':
      return Object.freeze({
        structureAspect:
          0.92 +
          a *
          0.24,
        apparentExtent:
          0.78 +
          b *
          0.16,
        concentrationBias:
          0.38 +
          c *
          0.16,
        subclusterStrength:
          0.26 +
          d *
          0.16,
        asymmetryStrength:
          0.74 +
          e *
          0.18,
        elongationStrength:
          0.20 +
          f *
          0.14,
        haloStrength:
          0.26 +
          g *
          0.16,
        chainStrength:
          0.12 +
          d *
          0.10,
        hazeBase:
          0.006,
        hazeRange:
          0.050,
        orientationRange:
          1.08,
      });

    case 'HALO':
      return Object.freeze({
        structureAspect:
          0.88 +
          a *
          0.18,
        apparentExtent:
          0.84 +
          b *
          0.14,
        concentrationBias:
          0.50 +
          c *
          0.16,
        subclusterStrength:
          0.12 +
          d *
          0.10,
        asymmetryStrength:
          0.10 +
          e *
          0.10,
        elongationStrength:
          0.06 +
          f *
          0.08,
        haloStrength:
          0.82 +
          g *
          0.10,
        chainStrength:
          0.06 +
          d *
          0.06,
        hazeBase:
          0.008,
        hazeRange:
          0.050,
        orientationRange:
          0.78,
      });

    case 'MULTI_CORE':
      return Object.freeze({
        structureAspect:
          0.92 +
          a *
          0.22,
        apparentExtent:
          0.76 +
          b *
          0.16,
        concentrationBias:
          0.58 +
          c *
          0.18,
        subclusterStrength:
          0.66 +
          d *
          0.20,
        asymmetryStrength:
          0.26 +
          e *
          0.16,
        elongationStrength:
          0.20 +
          f *
          0.14,
        haloStrength:
          0.24 +
          g *
          0.14,
        chainStrength:
          0.12 +
          d *
          0.10,
        hazeBase:
          0.010,
        hazeRange:
          0.055,
        orientationRange:
          0.96,
      });
  }
}

function paletteProfileFor(
  family:
    OpenClusterPaletteFamily,

  a:
    number,

  b:
    number,

  c:
    number,
): PaletteProfile {

  switch (
    family
  ) {
    case 'BLUE_WHITE':
      return Object.freeze({
        hotStarBias:
          0.76 +
          a *
          0.20,
        warmStarBias:
          0.08 +
          b *
          0.10,
        colorVariance:
          0.42 +
          c *
          0.20,
      });

    case 'CYAN_SILVER':
      return Object.freeze({
        hotStarBias:
          0.68 +
          a *
          0.20,
        warmStarBias:
          0.10 +
          b *
          0.10,
        colorVariance:
          0.38 +
          c *
          0.20,
      });

    case 'MIXED_YOUNG':
      return Object.freeze({
        hotStarBias:
          0.60 +
          a *
          0.22,
        warmStarBias:
          0.14 +
          b *
          0.16,
        colorVariance:
          0.52 +
          c *
          0.20,
      });

    case 'BLUE_GOLD':
      return Object.freeze({
        hotStarBias:
          0.54 +
          a *
          0.22,
        warmStarBias:
          0.24 +
          b *
          0.20,
        colorVariance:
          0.58 +
          c *
          0.20,
      });

    case 'ICE_VIOLET':
      return Object.freeze({
        hotStarBias:
          0.72 +
          a *
          0.18,
        warmStarBias:
          0.08 +
          b *
          0.08,
        colorVariance:
          0.46 +
          c *
          0.20,
      });

    case 'MIXED_MATURE':
      return Object.freeze({
        hotStarBias:
          0.38 +
          a *
          0.22,
        warmStarBias:
          0.34 +
          b *
          0.24,
        colorVariance:
          0.64 +
          c *
          0.20,
      });
  }
}

function requireSupportedDescriptor(
  descriptor:
    ArchiveGalacticObjectRenderDescriptor,
): void {

  const hasOpenProfile =
    descriptor.renderProfile ===
      ArchiveGalacticObjectRenderProfile
        .OPEN_CLUSTER_FIELD;

  const isOpenKind =
    descriptor.kind ===
      ArchiveGalacticObjectRenderKind
        .OPEN_CLUSTER;

  if (
    !hasOpenProfile &&
    !isOpenKind
  ) {
    throw new RangeError(
      'OpenClusterRenderModelBuilder requires OPEN_CLUSTER_FIELD or an OPEN_CLUSTER render kind.',
    );
  }

  if (
    descriptor.kind !==
      ArchiveGalacticObjectRenderKind
        .STAR_CLUSTER &&
    descriptor.kind !==
      ArchiveGalacticObjectRenderKind
        .OPEN_CLUSTER
  ) {
    throw new RangeError(
      'OpenClusterRenderModelBuilder only renders STAR_CLUSTER/OPEN_CLUSTER observational descriptors.',
    );
  }

  if (
    descriptor.variant !==
      null
  ) {
    throw new RangeError(
      'OpenClusterRenderModelBuilder does not use scientific variants.',
    );
  }

  for (
    const [
      name,
      value,
    ] of [
      ['scale', descriptor.scale],
      ['density', descriptor.density],
      ['energy', descriptor.energy],
      ['concentration', descriptor.concentration],
    ] as const
  ) {
    if (
      !Number.isFinite(value) ||
      value <
        0 ||
      value >
        1
    ) {
      throw new RangeError(
        `${name} must be finite and normalized to [0, 1].`,
      );
    }
  }
}

function selectStableIndex(
  value:
    number,

  length:
    number,
): number {

  return Math.min(
    length -
      1,
    Math.floor(
      unitFromUint32(value) *
      length,
    ),
  );
}

function hashWords(
  value:
    string,
): readonly [
  number,
  number,
  number,
  number,
  number,
] {

  let first =
    2166136261;

  let second =
    2246822519;

  let third =
    3266489917;

  let fourth =
    668265263;

  let fifth =
    374761393;

  for (
    let index =
      0;
    index <
      value.length;
    index +=
      1
  ) {
    const code =
      value.charCodeAt(index);

    first =
      mixUint32(
        first ^
          code,
        16777619,
      );

    second =
      mixUint32(
        second ^
          (
            code +
            index *
              31
          ),
        2246822519,
      );

    third =
      mixUint32(
        third ^
          (
            code +
            index *
              131
          ),
        3266489917,
      );

    fourth =
      mixUint32(
        fourth ^
          (
            code +
            index *
              17
          ),
        668265263,
      );

    fifth =
      mixUint32(
        fifth ^
          (
            code +
            index *
              73
          ),
        374761393,
      );
  }

  return Object.freeze([
    first,
    second,
    third,
    fourth,
    fifth,
  ]) as readonly [
    number,
    number,
    number,
    number,
    number,
  ];
}

function mixUint32(
  value:
    number,

  multiplier:
    number,
): number {

  const multiplied =
    Math.imul(
      value,
      multiplier,
    );

  return (
    multiplied ^
    (
      multiplied >>>
      13
    )
  ) >>>
    0;
}

function unitFromUint32(
  value:
    number,
): number {

  return (
    value >>>
    0
  ) /
  4294967296;
}
