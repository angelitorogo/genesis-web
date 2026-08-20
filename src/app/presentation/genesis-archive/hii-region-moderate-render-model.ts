import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  ArchiveGalacticObjectRenderProfile,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

export type HiiRegionModerateMorphologyFamily =
  | 'BUBBLE'
  | 'BLISTER'
  | 'CLUMPY'
  | 'COMPACT'
  | 'PILLARS'
  | 'FILAMENTARY'
  | 'DOUBLE'
  | 'BROKEN_SHELL';

export type HiiRegionModeratePaletteFamily =
  | 'ROSE_CYAN'
  | 'AMBER_TEAL'
  | 'VIOLET_BLUE'
  | 'MINT_GOLD'
  | 'CRIMSON_LILAC'
  | 'AQUA_WHITE';

export interface HiiRegionModerateIonizingSource {
  readonly x:
    number;

  readonly y:
    number;

  readonly strength:
    number;
}

export interface HiiRegionModerateRenderModel {
  readonly structureSeedX:
    number;

  readonly structureSeedY:
    number;

  readonly morphologyIndex:
    number;

  readonly morphologyFamily:
    HiiRegionModerateMorphologyFamily;

  readonly paletteIndex:
    number;

  readonly paletteFamily:
    HiiRegionModeratePaletteFamily;

  readonly orientationRadians:
    number;

  readonly structureAspect:
    number;

  readonly apparentExtent:
    number;

  readonly volumeDepth:
    number;

  readonly turbulenceStrength:
    number;

  readonly cavityStrength:
    number;

  readonly pillarStrength:
    number;

  readonly dustLaneStrength:
    number;

  readonly sourceSpread:
    number;

  readonly dominantIonizingSourceCount:
    number;

  readonly ionizingSources:
    readonly HiiRegionModerateIonizingSource[];

  readonly shellStrength:
    number;

  readonly asymmetryStrength:
    number;

  readonly lobeStrength:
    number;

  readonly filamentDirection:
    number;

  readonly cavityRadius:
    number;

  readonly edgeSharpness:
    number;

  readonly morphologyNoiseScale:
    number;

  readonly warmEmissionBias:
    number;

  readonly cyanEmissionBias:
    number;

  readonly greenEmissionBias:
    number;

  readonly paletteAccent:
    number;

  readonly coolCoreBias:
    number;

  readonly warmEdgeBias:
    number;

  readonly detailFactor:
    number;

  readonly signalGain:
    number;

  readonly chromaGain:
    number;

  readonly microDetailGain:
    number;

  readonly starVisibility:
    number;

  readonly physicalScale:
    number;

  readonly density:
    number;

  readonly energy:
    number;

  readonly concentration:
    number;
}

const MORPHOLOGY_FAMILIES =
  Object.freeze([
    'BUBBLE',
    'BLISTER',
    'CLUMPY',
    'COMPACT',
    'PILLARS',
    'FILAMENTARY',
    'DOUBLE',
    'BROKEN_SHELL',
  ] as const);

const PALETTE_FAMILIES =
  Object.freeze([
    'ROSE_CYAN',
    'AMBER_TEAL',
    'VIOLET_BLUE',
    'MINT_GOLD',
    'CRIMSON_LILAC',
    'AQUA_WHITE',
  ] as const);

/**
 * Renderer-only V1 model for MODERATE-activity H II regions, derived from the frozen LOW V2.2 visual grammar.
 *
 * Goals of the V2 refinement:
 *
 * - preserve the same seed-fixed object across SIGNAL/IDENTIFIED/CATALOGUED/
 *   CONFIRMED;
 * - keep MODERATE activity clearly above LOW with 3..6 dominant ionizing
 *   sources, wider source spacing and stronger internal excitation;
 * - preserve the frozen LOW morphology language while increasing volumetric
 *   complexity, shell/cavity contrast and turbulence rather than creating a
 *   second unrelated visual grammar;
 * - use the same palette families but with a stronger chromatic/energetic
 *   response, still below the later HIGH and INTENSE renderers;
 * - keep all visible structure renderer-only before scientific confirmation.
 */
export class HiiRegionModerateRenderModelBuilder {

  private constructor() {}

  static build(
    descriptor:
      ArchiveGalacticObjectRenderDescriptor,
  ): HiiRegionModerateRenderModel {

    requireSupportedDescriptor(
      descriptor,
    );

    const structure =
      hashWords(
        `${descriptor.seed}/HII-MODERATE-STRUCTURE-V2`,
      );

    const volume =
      hashWords(
        `${descriptor.seed}/HII-MODERATE-VOLUME-V2`,
      );

    const morphology =
      hashWords(
        `${descriptor.seed}/HII-MODERATE-MORPHOLOGY-V2`,
      );

    const palette =
      hashWords(
        `${descriptor.seed}/HII-MODERATE-PALETTE-V2`,
      );

    const sources =
      hashWords(
        `${descriptor.seed}/HII-MODERATE-SOURCES-V2`,
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
      moderateMorphologyProfileFor(
        morphologyProfileFor(
          morphologyFamily,
        unitFromUint32(
          structure[3],
        ),
        unitFromUint32(
          structure[4],
        ),
        unitFromUint32(
          volume[1],
        ),
        unitFromUint32(
          volume[2],
        ),
        unitFromUint32(
          volume[3],
        ),
        unitFromUint32(
          morphology[1],
        ),
        unitFromUint32(
          morphology[2],
        ),
        unitFromUint32(
          morphology[3],
        ),
          unitFromUint32(
            morphology[4],
          ),
        ),
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
      moderatePaletteProfileFor(
        paletteProfileFor(
          paletteFamily,
        unitFromUint32(
          palette[1],
        ),
        unitFromUint32(
          palette[2],
        ),
        unitFromUint32(
          palette[3],
        ),
          unitFromUint32(
            palette[4],
          ),
        ),
      );

    const dominantIonizingSourceCount =
      3 +
      Math.floor(
        unitFromUint32(
          sources[0],
        ) *
        4,
      );

    const sourceSpread =
      clampRange(
        morphologyProfile.sourceSpreadBase +
          0.05 +
          unitFromUint32(
            sources[1],
          ) *
          (
            morphologyProfile.sourceSpreadRange +
            0.05
          ),
        0.16,
        0.48,
      );

    const ionizingSources =
      buildIonizingSources(
        descriptor.seed,
        dominantIonizingSourceCount,
        sourceSpread,
      );

    const knowledge =
      knowledgeProfileFor(
        descriptor
          .knowledgeLevel,
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
            structure[2],
          ) -
          0.5
        ) *
        Math.PI *
        morphologyProfile.orientationRange,
      structureAspect:
        morphologyProfile.structureAspect,
      apparentExtent:
        morphologyProfile.apparentExtent,
      volumeDepth:
        morphologyProfile.volumeDepth,
      turbulenceStrength:
        morphologyProfile.turbulenceStrength,
      cavityStrength:
        morphologyProfile.cavityStrength,
      pillarStrength:
        morphologyProfile.pillarStrength,
      dustLaneStrength:
        morphologyProfile.dustLaneStrength,
      sourceSpread,
      dominantIonizingSourceCount,
      ionizingSources,
      shellStrength:
        morphologyProfile.shellStrength,
      asymmetryStrength:
        morphologyProfile.asymmetryStrength,
      lobeStrength:
        morphologyProfile.lobeStrength,
      filamentDirection:
        morphologyProfile.filamentDirection,
      cavityRadius:
        morphologyProfile.cavityRadius,
      edgeSharpness:
        morphologyProfile.edgeSharpness,
      morphologyNoiseScale:
        morphologyProfile.morphologyNoiseScale,
      warmEmissionBias:
        paletteProfile.warmEmissionBias,
      cyanEmissionBias:
        paletteProfile.cyanEmissionBias,
      greenEmissionBias:
        paletteProfile.greenEmissionBias,
      paletteAccent:
        paletteProfile.paletteAccent,
      coolCoreBias:
        paletteProfile.coolCoreBias,
      warmEdgeBias:
        paletteProfile.warmEdgeBias,
      detailFactor:
        knowledge.detailFactor,
      signalGain:
        knowledge.signalGain,
      chromaGain:
        knowledge.chromaGain,
      microDetailGain:
        knowledge.microDetailGain,
      starVisibility:
        knowledge.starVisibility,
      physicalScale:
        descriptor.scale,
      density:
        descriptor.density,
      energy:
        descriptor.energy,
      concentration:
        descriptor.concentration,
    });
  }
}

interface MorphologyProfile {
  readonly structureAspect:
    number;

  readonly apparentExtent:
    number;

  readonly volumeDepth:
    number;

  readonly turbulenceStrength:
    number;

  readonly cavityStrength:
    number;

  readonly pillarStrength:
    number;

  readonly dustLaneStrength:
    number;

  readonly shellStrength:
    number;

  readonly asymmetryStrength:
    number;

  readonly lobeStrength:
    number;

  readonly filamentDirection:
    number;

  readonly cavityRadius:
    number;

  readonly edgeSharpness:
    number;

  readonly morphologyNoiseScale:
    number;

  readonly sourceSpreadBase:
    number;

  readonly sourceSpreadRange:
    number;

  readonly orientationRange:
    number;
}

interface PaletteProfile {
  readonly warmEmissionBias:
    number;

  readonly cyanEmissionBias:
    number;

  readonly greenEmissionBias:
    number;

  readonly paletteAccent:
    number;

  readonly coolCoreBias:
    number;

  readonly warmEdgeBias:
    number;
}

interface KnowledgeProfile {
  readonly detailFactor:
    number;

  readonly signalGain:
    number;

  readonly chromaGain:
    number;

  readonly microDetailGain:
    number;

  readonly starVisibility:
    number;
}

function moderateMorphologyProfileFor(
  base:
    MorphologyProfile,
): MorphologyProfile {

  return Object.freeze({
    structureAspect:
      base.structureAspect,
    apparentExtent:
      clampRange(
        base.apparentExtent *
          1.06 +
          0.02,
        0.72,
        1.20,
      ),
    volumeDepth:
      clampRange(
        base.volumeDepth *
          1.08 +
          0.03,
        0.86,
        1.40,
      ),
    turbulenceStrength:
      clampRange(
        base.turbulenceStrength +
          0.14,
        0.86,
        1.42,
      ),
    cavityStrength:
      clampRange(
        base.cavityStrength +
          0.08,
        0.24,
        0.96,
      ),
    pillarStrength:
      clampRange(
        base.pillarStrength +
          0.08,
        0.10,
        0.86,
      ),
    dustLaneStrength:
      clampRange(
        base.dustLaneStrength +
          0.03,
        0.10,
        0.62,
      ),
    shellStrength:
      clampRange(
        base.shellStrength +
          0.06,
        0.16,
        1.06,
      ),
    asymmetryStrength:
      clampRange(
        base.asymmetryStrength +
          0.05,
        0.12,
        0.86,
      ),
    lobeStrength:
      clampRange(
        base.lobeStrength +
          0.08,
        0.10,
        0.90,
      ),
    filamentDirection:
      base.filamentDirection,
    cavityRadius:
      clampRange(
        base.cavityRadius +
          0.04,
        0.18,
        0.68,
      ),
    edgeSharpness:
      clampRange(
        base.edgeSharpness +
          0.04,
        0.40,
        0.98,
      ),
    morphologyNoiseScale:
      clampRange(
        base.morphologyNoiseScale +
          0.10,
        0.32,
        1.12,
      ),
    sourceSpreadBase:
      base.sourceSpreadBase,
    sourceSpreadRange:
      base.sourceSpreadRange,
    orientationRange:
      base.orientationRange,
  });
}

function moderatePaletteProfileFor(
  base:
    PaletteProfile,
): PaletteProfile {

  return Object.freeze({
    warmEmissionBias:
      clampRange(
        base.warmEmissionBias +
          0.08,
        0,
        1.10,
      ),
    cyanEmissionBias:
      clampRange(
        base.cyanEmissionBias +
          0.08,
        0,
        1.10,
      ),
    greenEmissionBias:
      clampRange(
        base.greenEmissionBias +
          0.05,
        0,
        1.00,
      ),
    paletteAccent:
      clampRange(
        base.paletteAccent +
          0.08,
        0.28,
        0.76,
      ),
    coolCoreBias:
      clampRange(
        base.coolCoreBias +
          0.06,
        0,
        1.08,
      ),
    warmEdgeBias:
      clampRange(
        base.warmEdgeBias +
          0.07,
        0,
        1.08,
      ),
  });
}

function knowledgeProfileFor(
  knowledgeLevel:
    ArchiveGalacticObjectKnowledgeLevel,
): KnowledgeProfile {

  switch (
    knowledgeLevel
  ) {
    case ArchiveGalacticObjectKnowledgeLevel
      .SIGNAL:
      return Object.freeze({
        detailFactor:
          0.18,
        signalGain:
          0.34,
        chromaGain:
          0.10,
        microDetailGain:
          0.02,
        starVisibility:
          0.32,
      });

    case ArchiveGalacticObjectKnowledgeLevel
      .IDENTIFIED:
      return Object.freeze({
        detailFactor:
          0.42,
        signalGain:
          0.54,
        chromaGain:
          0.32,
        microDetailGain:
          0.15,
        starVisibility:
          0.55,
      });

    case ArchiveGalacticObjectKnowledgeLevel
      .CATALOGUED:
      return Object.freeze({
        detailFactor:
          0.78,
        signalGain:
          0.86,
        chromaGain:
          0.82,
        microDetailGain:
          0.48,
        starVisibility:
          0.84,
      });

    case ArchiveGalacticObjectKnowledgeLevel
      .CONFIRMED:
      return Object.freeze({
        detailFactor:
          1,
        signalGain:
          1.08,
        chromaGain:
          1,
        microDetailGain:
          1,
        starVisibility:
          1,
      });
  }

  throw new RangeError(
    `Unsupported ArchiveGalacticObjectKnowledgeLevel: ${String(knowledgeLevel)}.`,
  );
}

function morphologyProfileFor(
  family:
    HiiRegionModerateMorphologyFamily,

  structure0:
    number,

  structure1:
    number,

  volume0:
    number,

  volume1:
    number,

  volume2:
    number,

  morphology0:
    number,

  morphology1:
    number,

  morphology2:
    number,

  morphology3:
    number,
): MorphologyProfile {

  switch (
    family
  ) {
    case 'BUBBLE':
      return Object.freeze({
        structureAspect:
          0.86 +
          structure0 *
          0.28,
        apparentExtent:
          0.78 +
          structure1 *
          0.20,
        volumeDepth:
          0.78 +
          volume0 *
          0.40,
        turbulenceStrength:
          0.74 +
          volume1 *
          0.34,
        cavityStrength:
          0.62 +
          volume2 *
          0.18,
        pillarStrength:
          0.08 +
          morphology0 *
          0.12,
        dustLaneStrength:
          0.10 +
          structure0 *
          0.12,
        shellStrength:
          0.80 +
          morphology1 *
          0.16,
        asymmetryStrength:
          0.10 +
          morphology2 *
          0.16,
        lobeStrength:
          0.08 +
          structure0 *
          0.10,
        filamentDirection:
          morphology3,
        cavityRadius:
          0.46 +
          structure1 *
          0.14,
        edgeSharpness:
          0.64 +
          morphology1 *
          0.20,
        morphologyNoiseScale:
          0.28 +
          morphology0 *
          0.18,
        sourceSpreadBase:
          0.12,
        sourceSpreadRange:
          0.12,
        orientationRange:
          0.82,
      });

    case 'BLISTER':
      return Object.freeze({
        structureAspect:
          0.98 +
          structure0 *
          0.34,
        apparentExtent:
          0.82 +
          structure1 *
          0.22,
        volumeDepth:
          0.82 +
          volume0 *
          0.36,
        turbulenceStrength:
          0.82 +
          volume1 *
          0.36,
        cavityStrength:
          0.40 +
          volume2 *
          0.18,
        pillarStrength:
          0.16 +
          morphology0 *
          0.16,
        dustLaneStrength:
          0.14 +
          structure0 *
          0.18,
        shellStrength:
          0.34 +
          morphology1 *
          0.18,
        asymmetryStrength:
          0.48 +
          morphology2 *
          0.24,
        lobeStrength:
          0.10 +
          structure0 *
          0.10,
        filamentDirection:
          morphology3,
        cavityRadius:
          0.26 +
          structure1 *
          0.12,
        edgeSharpness:
          0.48 +
          morphology1 *
          0.18,
        morphologyNoiseScale:
          0.38 +
          morphology0 *
          0.22,
        sourceSpreadBase:
          0.16,
        sourceSpreadRange:
          0.18,
        orientationRange:
          1.04,
      });

    case 'CLUMPY':
      return Object.freeze({
        structureAspect:
          0.86 +
          structure0 *
          0.40,
        apparentExtent:
          0.88 +
          structure1 *
          0.20,
        volumeDepth:
          0.88 +
          volume0 *
          0.34,
        turbulenceStrength:
          0.98 +
          volume1 *
          0.28,
        cavityStrength:
          0.32 +
          volume2 *
          0.16,
        pillarStrength:
          0.24 +
          morphology0 *
          0.20,
        dustLaneStrength:
          0.18 +
          structure0 *
          0.20,
        shellStrength:
          0.20 +
          morphology1 *
          0.12,
        asymmetryStrength:
          0.22 +
          morphology2 *
          0.18,
        lobeStrength:
          0.20 +
          structure0 *
          0.16,
        filamentDirection:
          morphology3,
        cavityRadius:
          0.18 +
          structure1 *
          0.10,
        edgeSharpness:
          0.34 +
          morphology1 *
          0.18,
        morphologyNoiseScale:
          0.66 +
          morphology0 *
          0.26,
        sourceSpreadBase:
          0.18,
        sourceSpreadRange:
          0.16,
        orientationRange:
          0.96,
      });

    case 'COMPACT':
      return Object.freeze({
        structureAspect:
          0.82 +
          structure0 *
          0.26,
        apparentExtent:
          0.66 +
          structure1 *
          0.16,
        volumeDepth:
          0.76 +
          volume0 *
          0.24,
        turbulenceStrength:
          0.72 +
          volume1 *
          0.24,
        cavityStrength:
          0.24 +
          volume2 *
          0.12,
        pillarStrength:
          0.08 +
          morphology0 *
          0.10,
        dustLaneStrength:
          0.10 +
          structure0 *
          0.14,
        shellStrength:
          0.16 +
          morphology1 *
          0.10,
        asymmetryStrength:
          0.12 +
          morphology2 *
          0.12,
        lobeStrength:
          0.06 +
          structure0 *
          0.08,
        filamentDirection:
          morphology3,
        cavityRadius:
          0.14 +
          structure1 *
          0.08,
        edgeSharpness:
          0.58 +
          morphology1 *
          0.18,
        morphologyNoiseScale:
          0.22 +
          morphology0 *
          0.12,
        sourceSpreadBase:
          0.10,
        sourceSpreadRange:
          0.08,
        orientationRange:
          0.72,
      });

    case 'PILLARS':
      return Object.freeze({
        structureAspect:
          0.94 +
          structure0 *
          0.28,
        apparentExtent:
          0.84 +
          structure1 *
          0.26,
        volumeDepth:
          0.84 +
          volume0 *
          0.30,
        turbulenceStrength:
          0.92 +
          volume1 *
          0.30,
        cavityStrength:
          0.30 +
          volume2 *
          0.18,
        pillarStrength:
          0.46 +
          morphology0 *
          0.24,
        dustLaneStrength:
          0.30 +
          structure0 *
          0.20,
        shellStrength:
          0.22 +
          morphology1 *
          0.14,
        asymmetryStrength:
          0.28 +
          morphology2 *
          0.18,
        lobeStrength:
          0.12 +
          structure0 *
          0.12,
        filamentDirection:
          morphology3,
        cavityRadius:
          0.20 +
          structure1 *
          0.12,
        edgeSharpness:
          0.46 +
          morphology1 *
          0.14,
        morphologyNoiseScale:
          0.58 +
          morphology0 *
          0.24,
        sourceSpreadBase:
          0.14,
        sourceSpreadRange:
          0.14,
        orientationRange:
          1.02,
      });

    case 'FILAMENTARY':
      return Object.freeze({
        structureAspect:
          1.08 +
          structure0 *
          0.34,
        apparentExtent:
          0.92 +
          structure1 *
          0.18,
        volumeDepth:
          0.96 +
          volume0 *
          0.30,
        turbulenceStrength:
          1.02 +
          volume1 *
          0.26,
        cavityStrength:
          0.24 +
          volume2 *
          0.14,
        pillarStrength:
          0.18 +
          morphology0 *
          0.16,
        dustLaneStrength:
          0.18 +
          structure0 *
          0.18,
        shellStrength:
          0.10 +
          morphology1 *
          0.08,
        asymmetryStrength:
          0.34 +
          morphology2 *
          0.20,
        lobeStrength:
          0.10 +
          structure0 *
          0.10,
        filamentDirection:
          morphology3,
        cavityRadius:
          0.16 +
          structure1 *
          0.08,
        edgeSharpness:
          0.62 +
          morphology1 *
          0.14,
        morphologyNoiseScale:
          0.72 +
          morphology0 *
          0.22,
        sourceSpreadBase:
          0.12,
        sourceSpreadRange:
          0.12,
        orientationRange:
          1.18,
      });

    case 'DOUBLE':
      return Object.freeze({
        structureAspect:
          1.04 +
          structure0 *
          0.28,
        apparentExtent:
          0.90 +
          structure1 *
          0.18,
        volumeDepth:
          0.90 +
          volume0 *
          0.28,
        turbulenceStrength:
          0.90 +
          volume1 *
          0.28,
        cavityStrength:
          0.36 +
          volume2 *
          0.16,
        pillarStrength:
          0.14 +
          morphology0 *
          0.12,
        dustLaneStrength:
          0.14 +
          structure0 *
          0.16,
        shellStrength:
          0.24 +
          morphology1 *
          0.14,
        asymmetryStrength:
          0.22 +
          morphology2 *
          0.18,
        lobeStrength:
          0.52 +
          structure0 *
          0.22,
        filamentDirection:
          morphology3,
        cavityRadius:
          0.22 +
          structure1 *
          0.10,
        edgeSharpness:
          0.54 +
          morphology1 *
          0.18,
        morphologyNoiseScale:
          0.48 +
          morphology0 *
          0.16,
        sourceSpreadBase:
          0.18,
        sourceSpreadRange:
          0.18,
        orientationRange:
          1.12,
      });

    case 'BROKEN_SHELL':
      return Object.freeze({
        structureAspect:
          0.90 +
          structure0 *
          0.28,
        apparentExtent:
          0.84 +
          structure1 *
          0.18,
        volumeDepth:
          0.84 +
          volume0 *
          0.30,
        turbulenceStrength:
          0.86 +
          volume1 *
          0.28,
        cavityStrength:
          0.48 +
          volume2 *
          0.18,
        pillarStrength:
          0.12 +
          morphology0 *
          0.12,
        dustLaneStrength:
          0.16 +
          structure0 *
          0.16,
        shellStrength:
          0.72 +
          morphology1 *
          0.18,
        asymmetryStrength:
          0.52 +
          morphology2 *
          0.18,
        lobeStrength:
          0.18 +
          structure0 *
          0.10,
        filamentDirection:
          morphology3,
        cavityRadius:
          0.40 +
          structure1 *
          0.12,
        edgeSharpness:
          0.72 +
          morphology1 *
          0.16,
        morphologyNoiseScale:
          0.44 +
          morphology0 *
          0.20,
        sourceSpreadBase:
          0.12,
        sourceSpreadRange:
          0.12,
        orientationRange:
          0.90,
      });
  }
}

function paletteProfileFor(
  family:
    HiiRegionModeratePaletteFamily,

  palette0:
    number,

  palette1:
    number,

  palette2:
    number,

  palette3:
    number,
): PaletteProfile {

  switch (
    family
  ) {
    case 'ROSE_CYAN':
      return Object.freeze({
        warmEmissionBias:
          0.68 +
          palette0 *
          0.28,
        cyanEmissionBias:
          0.70 +
          palette1 *
          0.26,
        greenEmissionBias:
          0.14 +
          palette2 *
          0.20,
        paletteAccent:
          0.26 +
          palette3 *
          0.26,
        coolCoreBias:
          0.78 +
          palette1 *
          0.18,
        warmEdgeBias:
          0.68 +
          palette0 *
          0.20,
      });

    case 'AMBER_TEAL':
      return Object.freeze({
        warmEmissionBias:
          0.78 +
          palette0 *
          0.18,
        cyanEmissionBias:
          0.42 +
          palette1 *
          0.20,
        greenEmissionBias:
          0.48 +
          palette2 *
          0.22,
        paletteAccent:
          0.34 +
          palette3 *
          0.26,
        coolCoreBias:
          0.54 +
          palette1 *
          0.18,
        warmEdgeBias:
          0.80 +
          palette0 *
          0.14,
      });

    case 'VIOLET_BLUE':
      return Object.freeze({
        warmEmissionBias:
          0.34 +
          palette0 *
          0.20,
        cyanEmissionBias:
          0.78 +
          palette1 *
          0.18,
        greenEmissionBias:
          0.16 +
          palette2 *
          0.16,
        paletteAccent:
          0.22 +
          palette3 *
          0.24,
        coolCoreBias:
          0.82 +
          palette1 *
          0.12,
        warmEdgeBias:
          0.38 +
          palette0 *
          0.16,
      });

    case 'MINT_GOLD':
      return Object.freeze({
        warmEmissionBias:
          0.58 +
          palette0 *
          0.20,
        cyanEmissionBias:
          0.42 +
          palette1 *
          0.18,
        greenEmissionBias:
          0.66 +
          palette2 *
          0.22,
        paletteAccent:
          0.30 +
          palette3 *
          0.28,
        coolCoreBias:
          0.60 +
          palette1 *
          0.16,
        warmEdgeBias:
          0.66 +
          palette0 *
          0.18,
      });

    case 'CRIMSON_LILAC':
      return Object.freeze({
        warmEmissionBias:
          0.84 +
          palette0 *
          0.12,
        cyanEmissionBias:
          0.54 +
          palette1 *
          0.18,
        greenEmissionBias:
          0.08 +
          palette2 *
          0.10,
        paletteAccent:
          0.38 +
          palette3 *
          0.20,
        coolCoreBias:
          0.62 +
          palette1 *
          0.16,
        warmEdgeBias:
          0.86 +
          palette0 *
          0.10,
      });

    case 'AQUA_WHITE':
      return Object.freeze({
        warmEmissionBias:
          0.30 +
          palette0 *
          0.16,
        cyanEmissionBias:
          0.86 +
          palette1 *
          0.10,
        greenEmissionBias:
          0.22 +
          palette2 *
          0.16,
        paletteAccent:
          0.24 +
          palette3 *
          0.24,
        coolCoreBias:
          0.88 +
          palette1 *
          0.08,
        warmEdgeBias:
          0.34 +
          palette0 *
          0.12,
      });
  }
}

function buildIonizingSources(
  seed:
    string,

  count:
    number,

  spread:
    number,
): readonly HiiRegionModerateIonizingSource[] {

  const result:
    HiiRegionModerateIonizingSource[] =
    [];

  for (
    let index =
      0;
    index <
      count;
    index +=
      1
  ) {
    const words =
      hashWords(
        `${seed}/HII-MODERATE-IONIZER-${index}-V2`,
      );

    const angle =
      unitFromUint32(
        words[0],
      ) *
      Math.PI *
      2;

    const radialFraction =
      index ===
        0
        ? 0.14 +
          unitFromUint32(
            words[1],
          ) *
          0.14
        : 0.30 +
          unitFromUint32(
            words[1],
          ) *
          0.42;

    result.push(
      Object.freeze({
        x:
          Math.cos(
            angle,
          ) *
          spread *
          radialFraction,
        y:
          Math.sin(
            angle,
          ) *
          spread *
          radialFraction,
        strength:
          0.66 +
          unitFromUint32(
            words[2],
          ) *
          0.34,
      }),
    );
  }

  return Object.freeze([
    ...result,
  ]);
}

function requireSupportedDescriptor(
  descriptor:
    ArchiveGalacticObjectRenderDescriptor,
): void {

  const hasModerateProfile =
    descriptor.renderProfile ===
    ArchiveGalacticObjectRenderProfile
      .HII_MODERATE_VOLUME;

  const isConfirmedModerate =
    descriptor.kind ===
      ArchiveGalacticObjectRenderKind
        .HII_REGION &&
    descriptor.variant ===
      'MODERATE';

  if (
    !hasModerateProfile &&
    !isConfirmedModerate
  ) {
    throw new RangeError(
      'HiiRegionModerateRenderModelBuilder requires the opaque HII_MODERATE_VOLUME profile or a confirmed MODERATE H II descriptor.',
    );
  }

  if (
    descriptor.kind !==
      ArchiveGalacticObjectRenderKind
        .NEBULA &&
    descriptor.kind !==
      ArchiveGalacticObjectRenderKind
        .HII_REGION
  ) {
    throw new RangeError(
      'HiiRegionModerateRenderModelBuilder only renders NEBULA/HII_REGION observational descriptors.',
    );
  }

  if (
    descriptor.variant !==
      null &&
    descriptor.variant !==
      'MODERATE'
  ) {
    throw new RangeError(
      `HiiRegionModerateRenderModelBuilder does not render variant ${descriptor.variant}.`,
    );
  }

  for (
    const [
      name,
      value,
    ]
    of [
      [
        'scale',
        descriptor.scale,
      ],
      [
        'density',
        descriptor.density,
      ],
      [
        'energy',
        descriptor.energy,
      ],
      [
        'concentration',
        descriptor.concentration,
      ],
    ] as const
  ) {
    if (
      !Number.isFinite(
        value,
      ) ||
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

function clampRange(
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
      unitFromUint32(
        value,
      ) *
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
      value.charCodeAt(
        index,
      );

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
