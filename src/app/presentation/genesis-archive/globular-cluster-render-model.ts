import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  ArchiveGalacticObjectRenderProfile,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

export type GlobularClusterMorphologyFamily =
  | 'CLASSIC'
  | 'CORE_COLLAPSED'
  | 'EXTENDED_HALO'
  | 'ELLIPTICAL'
  | 'TIDAL_STRETCHED'
  | 'ASYMMETRIC_HALO'
  | 'GRANULAR_CORE'
  | 'RICH_HALO';

export type GlobularClusterPaletteFamily =
  | 'ANCIENT_GOLD'
  | 'IVORY_AMBER'
  | 'SILVER_GOLD'
  | 'RED_GIANT_RICH'
  | 'BLUE_HB_MIX'
  | 'METAL_POOR_COOL';

export interface GlobularClusterRenderModel {
  readonly structureSeedX: number;
  readonly structureSeedY: number;
  readonly morphologyIndex: number;
  readonly morphologyFamily: GlobularClusterMorphologyFamily;
  readonly paletteIndex: number;
  readonly paletteFamily: GlobularClusterPaletteFamily;
  readonly orientationRadians: number;
  readonly structureAspect: number;
  readonly apparentExtent: number;
  readonly coreRadius: number;
  readonly halfLightRadius: number;
  readonly tidalExtent: number;
  readonly centralConcentration: number;
  readonly haloFalloff: number;
  readonly ellipticity: number;
  readonly asymmetryStrength: number;
  readonly tidalStretch: number;
  readonly granularCoreStrength: number;
  readonly memberRichness: number;
  readonly brightGiantBias: number;
  readonly blueHorizontalBranchBias: number;
  readonly colorVariance: number;
  readonly memberVisibility: number;
  readonly faintMemberVisibility: number;
  readonly unresolvedGlowVisibility: number;
  readonly chromaGain: number;
  readonly detailFactor: number;
  readonly opticalGain: number;
  readonly physicalScale: number;
  readonly physicalDensity: number;
  readonly physicalEnergy: number;
  readonly physicalConcentration: number;
}

const MORPHOLOGY_FAMILIES =
  Object.freeze([
    'CLASSIC',
    'CORE_COLLAPSED',
    'EXTENDED_HALO',
    'ELLIPTICAL',
    'TIDAL_STRETCHED',
    'ASYMMETRIC_HALO',
    'GRANULAR_CORE',
    'RICH_HALO',
  ] as const);

const PALETTE_FAMILIES =
  Object.freeze([
    'ANCIENT_GOLD',
    'IVORY_AMBER',
    'SILVER_GOLD',
    'RED_GIANT_RICH',
    'BLUE_HB_MIX',
    'METAL_POOR_COOL',
  ] as const);

/**
 * Renderer-only globular-cluster model.
 *
 * V1.1 keeps the V1 structural hashes stable, but broadens apparent scale and
 * population-colour contrast so real procedural globulars no longer converge
 * on one beige/white visual result. Knowledge only controls how much of that
 * same object the instrument resolves. Physical descriptor values can modulate
 * brightness/density after cataloguing but never move seed-fixed members or
 * change visual family identity.
 */
export class GlobularClusterRenderModelBuilder {

  private constructor() {}

  static build(
    descriptor:
      ArchiveGalacticObjectRenderDescriptor,
  ): GlobularClusterRenderModel {

    requireSupportedDescriptor(
      descriptor,
    );

    const structure =
      hashWords(
        `${descriptor.seed}/GLOBULAR-CLUSTER-STRUCTURE-V1`,
      );

    const morphology =
      hashWords(
        `${descriptor.seed}/GLOBULAR-CLUSTER-MORPHOLOGY-V1`,
      );

    const palette =
      hashWords(
        `${descriptor.seed}/GLOBULAR-CLUSTER-PALETTE-V1`,
      );

    const population =
      hashWords(
        `${descriptor.seed}/GLOBULAR-CLUSTER-POPULATION-V1`,
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
            population[0],
          ) -
          0.5
        ) *
        Math.PI *
        morphologyProfile.orientationRange,
      structureAspect:
        morphologyProfile.structureAspect,
      apparentExtent:
        morphologyProfile.apparentExtent,
      coreRadius:
        morphologyProfile.coreRadius,
      halfLightRadius:
        morphologyProfile.halfLightRadius,
      tidalExtent:
        morphologyProfile.tidalExtent,
      centralConcentration:
        morphologyProfile.centralConcentration,
      haloFalloff:
        morphologyProfile.haloFalloff,
      ellipticity:
        morphologyProfile.ellipticity,
      asymmetryStrength:
        morphologyProfile.asymmetryStrength,
      tidalStretch:
        morphologyProfile.tidalStretch,
      granularCoreStrength:
        morphologyProfile.granularCoreStrength,
      memberRichness:
        0.72 +
        unitFromUint32(
          population[1],
        ) *
        0.28,
      brightGiantBias:
        paletteProfile.brightGiantBias,
      blueHorizontalBranchBias:
        paletteProfile.blueHorizontalBranchBias,
      colorVariance:
        paletteProfile.colorVariance,
      memberVisibility:
        knowledge.memberVisibility,
      faintMemberVisibility:
        knowledge.faintMemberVisibility,
      unresolvedGlowVisibility:
        knowledge.unresolvedGlowVisibility,
      chromaGain:
        knowledge.chromaGain,
      detailFactor:
        knowledge.detailFactor,
      opticalGain:
        knowledge.opticalGain,
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
  readonly coreRadius: number;
  readonly halfLightRadius: number;
  readonly tidalExtent: number;
  readonly centralConcentration: number;
  readonly haloFalloff: number;
  readonly ellipticity: number;
  readonly asymmetryStrength: number;
  readonly tidalStretch: number;
  readonly granularCoreStrength: number;
  readonly orientationRange: number;
}

interface PaletteProfile {
  readonly brightGiantBias: number;
  readonly blueHorizontalBranchBias: number;
  readonly colorVariance: number;
}

interface KnowledgeProfile {
  readonly memberVisibility: number;
  readonly faintMemberVisibility: number;
  readonly unresolvedGlowVisibility: number;
  readonly chromaGain: number;
  readonly detailFactor: number;
  readonly opticalGain: number;
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
          0.22,
        faintMemberVisibility:
          0.06,
        unresolvedGlowVisibility:
          0.42,
        chromaGain:
          0.08,
        detailFactor:
          0.14,
        opticalGain:
          0.36,
      });

    case ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED:
      return Object.freeze({
        memberVisibility:
          0.44,
        faintMemberVisibility:
          0.22,
        unresolvedGlowVisibility:
          0.58,
        chromaGain:
          0.28,
        detailFactor:
          0.38,
        opticalGain:
          0.54,
      });

    case ArchiveGalacticObjectKnowledgeLevel.CATALOGUED:
      return Object.freeze({
        memberVisibility:
          0.78,
        faintMemberVisibility:
          0.70,
        unresolvedGlowVisibility:
          0.78,
        chromaGain:
          0.80,
        detailFactor:
          0.76,
        opticalGain:
          0.82,
      });

    case ArchiveGalacticObjectKnowledgeLevel.CONFIRMED:
      return Object.freeze({
        memberVisibility:
          1,
        faintMemberVisibility:
          1,
        unresolvedGlowVisibility:
          0.92,
        chromaGain:
          1,
        detailFactor:
          1,
        opticalGain:
          1,
      });
  }

  throw new RangeError(
    `Unsupported ArchiveGalacticObjectKnowledgeLevel: ${String(knowledgeLevel)}.`,
  );
}

function morphologyProfileFor(
  family:
    GlobularClusterMorphologyFamily,
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
    case 'CLASSIC':
      return Object.freeze({
        structureAspect: 0.94 + a * 0.10,
        apparentExtent: 0.80 + b * 0.14,
        coreRadius: 0.16 + c * 0.05,
        halfLightRadius: 0.38 + d * 0.08,
        tidalExtent: 0.86 + e * 0.10,
        centralConcentration: 0.66 + f * 0.16,
        haloFalloff: 2.10 + g * 0.46,
        ellipticity: 0.04 + a * 0.07,
        asymmetryStrength: 0.04 + b * 0.06,
        tidalStretch: 0.02 + c * 0.05,
        granularCoreStrength: 0.46 + d * 0.18,
        orientationRange: 0.54,
      });

    case 'CORE_COLLAPSED':
      return Object.freeze({
        structureAspect: 0.96 + a * 0.08,
        apparentExtent: 0.62 + b * 0.10,
        coreRadius: 0.075 + c * 0.035,
        halfLightRadius: 0.30 + d * 0.06,
        tidalExtent: 0.78 + e * 0.08,
        centralConcentration: 0.88 + f * 0.10,
        haloFalloff: 2.54 + g * 0.50,
        ellipticity: 0.02 + a * 0.05,
        asymmetryStrength: 0.02 + b * 0.04,
        tidalStretch: 0.01 + c * 0.03,
        granularCoreStrength: 0.72 + d * 0.22,
        orientationRange: 0.42,
      });

    case 'EXTENDED_HALO':
      return Object.freeze({
        structureAspect: 0.92 + a * 0.12,
        apparentExtent: 0.98 + b * 0.14,
        coreRadius: 0.18 + c * 0.05,
        halfLightRadius: 0.44 + d * 0.08,
        tidalExtent: 0.98 + e * 0.10,
        centralConcentration: 0.54 + f * 0.14,
        haloFalloff: 1.68 + g * 0.36,
        ellipticity: 0.05 + a * 0.08,
        asymmetryStrength: 0.06 + b * 0.08,
        tidalStretch: 0.04 + c * 0.06,
        granularCoreStrength: 0.38 + d * 0.16,
        orientationRange: 0.62,
      });

    case 'ELLIPTICAL':
      return Object.freeze({
        structureAspect: 1.10 + a * 0.18,
        apparentExtent: 0.82 + b * 0.16,
        coreRadius: 0.15 + c * 0.05,
        halfLightRadius: 0.38 + d * 0.07,
        tidalExtent: 0.86 + e * 0.09,
        centralConcentration: 0.62 + f * 0.15,
        haloFalloff: 2.02 + g * 0.42,
        ellipticity: 0.18 + a * 0.12,
        asymmetryStrength: 0.04 + b * 0.06,
        tidalStretch: 0.06 + c * 0.05,
        granularCoreStrength: 0.44 + d * 0.18,
        orientationRange: 1.20,
      });

    case 'TIDAL_STRETCHED':
      return Object.freeze({
        structureAspect: 1.06 + a * 0.16,
        apparentExtent: 0.92 + b * 0.16,
        coreRadius: 0.15 + c * 0.05,
        halfLightRadius: 0.40 + d * 0.08,
        tidalExtent: 0.98 + e * 0.08,
        centralConcentration: 0.58 + f * 0.14,
        haloFalloff: 1.82 + g * 0.38,
        ellipticity: 0.12 + a * 0.10,
        asymmetryStrength: 0.12 + b * 0.10,
        tidalStretch: 0.46 + c * 0.26,
        granularCoreStrength: 0.40 + d * 0.16,
        orientationRange: 1.30,
      });

    case 'ASYMMETRIC_HALO':
      return Object.freeze({
        structureAspect: 0.94 + a * 0.12,
        apparentExtent: 0.86 + b * 0.16,
        coreRadius: 0.16 + c * 0.05,
        halfLightRadius: 0.40 + d * 0.08,
        tidalExtent: 0.94 + e * 0.08,
        centralConcentration: 0.58 + f * 0.14,
        haloFalloff: 1.90 + g * 0.38,
        ellipticity: 0.08 + a * 0.09,
        asymmetryStrength: 0.34 + b * 0.24,
        tidalStretch: 0.12 + c * 0.10,
        granularCoreStrength: 0.42 + d * 0.18,
        orientationRange: 1.04,
      });

    case 'GRANULAR_CORE':
      return Object.freeze({
        structureAspect: 0.95 + a * 0.10,
        apparentExtent: 0.72 + b * 0.12,
        coreRadius: 0.13 + c * 0.04,
        halfLightRadius: 0.36 + d * 0.07,
        tidalExtent: 0.84 + e * 0.08,
        centralConcentration: 0.74 + f * 0.14,
        haloFalloff: 2.22 + g * 0.44,
        ellipticity: 0.05 + a * 0.07,
        asymmetryStrength: 0.05 + b * 0.07,
        tidalStretch: 0.03 + c * 0.04,
        granularCoreStrength: 0.88 + d * 0.10,
        orientationRange: 0.56,
      });

    case 'RICH_HALO':
      return Object.freeze({
        structureAspect: 0.93 + a * 0.11,
        apparentExtent: 1.02 + b * 0.12,
        coreRadius: 0.17 + c * 0.05,
        halfLightRadius: 0.42 + d * 0.08,
        tidalExtent: 0.96 + e * 0.08,
        centralConcentration: 0.62 + f * 0.14,
        haloFalloff: 1.78 + g * 0.34,
        ellipticity: 0.06 + a * 0.08,
        asymmetryStrength: 0.08 + b * 0.08,
        tidalStretch: 0.08 + c * 0.07,
        granularCoreStrength: 0.54 + d * 0.18,
        orientationRange: 0.72,
      });
  }
}

function paletteProfileFor(
  family:
    GlobularClusterPaletteFamily,
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
    case 'ANCIENT_GOLD':
      return Object.freeze({
        brightGiantBias: 0.64 + a * 0.20,
        blueHorizontalBranchBias: 0.05 + b * 0.07,
        colorVariance: 0.56 + c * 0.18,
      });

    case 'IVORY_AMBER':
      return Object.freeze({
        brightGiantBias: 0.48 + a * 0.18,
        blueHorizontalBranchBias: 0.08 + b * 0.08,
        colorVariance: 0.40 + c * 0.16,
      });

    case 'SILVER_GOLD':
      return Object.freeze({
        brightGiantBias: 0.38 + a * 0.16,
        blueHorizontalBranchBias: 0.28 + b * 0.18,
        colorVariance: 0.54 + c * 0.18,
      });

    case 'RED_GIANT_RICH':
      return Object.freeze({
        brightGiantBias: 0.78 + a * 0.18,
        blueHorizontalBranchBias: 0.03 + b * 0.04,
        colorVariance: 0.72 + c * 0.18,
      });

    case 'BLUE_HB_MIX':
      return Object.freeze({
        brightGiantBias: 0.38 + a * 0.14,
        blueHorizontalBranchBias: 0.72 + b * 0.24,
        colorVariance: 0.74 + c * 0.18,
      });

    case 'METAL_POOR_COOL':
      return Object.freeze({
        brightGiantBias: 0.30 + a * 0.12,
        blueHorizontalBranchBias: 0.56 + b * 0.24,
        colorVariance: 0.60 + c * 0.18,
      });
  }
}

function requireSupportedDescriptor(
  descriptor:
    ArchiveGalacticObjectRenderDescriptor,
): void {

  const hasGlobularProfile =
    descriptor.renderProfile ===
      ArchiveGalacticObjectRenderProfile
        .GLOBULAR_CLUSTER_FIELD;

  const isGlobularKind =
    descriptor.kind ===
      ArchiveGalacticObjectRenderKind
        .GLOBULAR_CLUSTER;

  if (
    !hasGlobularProfile &&
    !isGlobularKind
  ) {
    throw new RangeError(
      'GlobularClusterRenderModelBuilder requires GLOBULAR_CLUSTER_FIELD or a GLOBULAR_CLUSTER render kind.',
    );
  }

  if (
    descriptor.kind !==
      ArchiveGalacticObjectRenderKind
        .STAR_CLUSTER &&
    descriptor.kind !==
      ArchiveGalacticObjectRenderKind
        .GLOBULAR_CLUSTER
  ) {
    throw new RangeError(
      'GlobularClusterRenderModelBuilder only renders STAR_CLUSTER/GLOBULAR_CLUSTER observational descriptors.',
    );
  }

  if (
    descriptor.variant !==
      null
  ) {
    throw new RangeError(
      'GlobularClusterRenderModelBuilder does not use scientific variants.',
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
