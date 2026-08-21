import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  ArchiveGalacticObjectRenderProfile,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

export type SupernovaRemnantShellVisualFamily =
  | 'FRACTURED_SHELL'
  | 'FILAMENT_RING'
  | 'BILOBED_SHELL'
  | 'KNOTTY_SHELL'
  | 'WISPY_ARC'
  | 'BUBBLE_SHELL'
  | 'OFFSET_SHELL'
  | 'SHOCK_COMPLEX';

export type SupernovaRemnantPlerionVisualFamily =
  | 'FILAMENTARY_WIND_NEBULA'
  | 'PETALLED_CORE'
  | 'TORUS_JET'
  | 'ELLIPTICAL_WISPS'
  | 'KNOTTED_SYNCHROTRON'
  | 'DOUBLE_HALO'
  | 'OFFSET_PLUME'
  | 'TURBULENT_WIND_WEB';

export type SupernovaRemnantCompositeVisualFamily =
  | 'BALANCED_CORE_SHELL'
  | 'BIPOLAR_PWN_SHELL'
  | 'OFFSET_CORE_SHELL'
  | 'FILAMENT_BRIDGE'
  | 'BREAKOUT_COMPOSITE'
  | 'DOUBLE_ARC_CORE'
  | 'KNOTTED_RIM_PULSAR'
  | 'WIND_TAIL_SHELL';

export type SupernovaRemnantVisualFamily =
  | SupernovaRemnantShellVisualFamily
  | SupernovaRemnantPlerionVisualFamily
  | SupernovaRemnantCompositeVisualFamily;

export type SupernovaRemnantPaletteFamily =
  | 'CYAN_CRIMSON'
  | 'TEAL_GOLD'
  | 'AMBER_BLUE'
  | 'MAGENTA_VIOLET'
  | 'EMERALD_GOLD'
  | 'FIRE_ICE'
  | 'SPECTRAL';

export type SupernovaRemnantScientificMorphology =
  | 'SHELL'
  | 'PLERION'
  | 'COMPOSITE';

export interface SupernovaRemnantRenderModel {
  readonly structureSeedX: number;
  readonly structureSeedY: number;
  readonly morphologyIndex: number;
  readonly morphologyFamily: SupernovaRemnantVisualFamily;
  readonly paletteIndex: number;
  readonly paletteFamily: SupernovaRemnantPaletteFamily;
  readonly scientificMorphology: SupernovaRemnantScientificMorphology;
  readonly orientationRadians: number;
  readonly structureAspect: number;
  readonly apparentExtent: number;
  readonly shellRadius: number;
  readonly shellThickness: number;
  readonly shellSharpness: number;
  readonly filamentStrength: number;
  readonly clumpiness: number;
  readonly fragmentation: number;
  readonly interiorGlow: number;
  readonly haloStrength: number;
  readonly bilobedStrength: number;
  readonly asymmetryStrength: number;
  readonly jetStrength: number;
  readonly centralEngineStrength: number;
  readonly ringBreakup: number;
  readonly shockContrast: number;
  readonly coreOffsetX: number;
  readonly coreOffsetY: number;
  readonly colorVariance: number;
  readonly shellVisibility: number;
  readonly filamentVisibility: number;
  readonly interiorVisibility: number;
  readonly haloVisibility: number;
  readonly chromaGain: number;
  readonly detailFactor: number;
  readonly starVisibility: number;
  readonly physicalScale: number;
  readonly physicalDensity: number;
  readonly physicalEnergy: number;
  readonly physicalConcentration: number;
}

const SHELL_VISUAL_FAMILIES =
  Object.freeze([
    'FRACTURED_SHELL',
    'FILAMENT_RING',
    'BILOBED_SHELL',
    'KNOTTY_SHELL',
    'WISPY_ARC',
    'BUBBLE_SHELL',
    'OFFSET_SHELL',
    'SHOCK_COMPLEX',
  ] as const);

const PLERION_VISUAL_FAMILIES =
  Object.freeze([
    'FILAMENTARY_WIND_NEBULA',
    'PETALLED_CORE',
    'TORUS_JET',
    'ELLIPTICAL_WISPS',
    'KNOTTED_SYNCHROTRON',
    'DOUBLE_HALO',
    'OFFSET_PLUME',
    'TURBULENT_WIND_WEB',
  ] as const);

const COMPOSITE_VISUAL_FAMILIES =
  Object.freeze([
    'BALANCED_CORE_SHELL',
    'BIPOLAR_PWN_SHELL',
    'OFFSET_CORE_SHELL',
    'FILAMENT_BRIDGE',
    'BREAKOUT_COMPOSITE',
    'DOUBLE_ARC_CORE',
    'KNOTTED_RIM_PULSAR',
    'WIND_TAIL_SHELL',
  ] as const);

const PALETTE_FAMILIES =
  Object.freeze([
    'CYAN_CRIMSON',
    'TEAL_GOLD',
    'AMBER_BLUE',
    'MAGENTA_VIOLET',
    'EMERALD_GOLD',
    'FIRE_ICE',
    'SPECTRAL',
  ] as const);

/**
 * Renderer-only V1 model for persistent supernova remnants.
 *
 * Current visual coverage:
 * - eight deterministic SHELL families;
 * - eight deterministic PLERION families;
 * - eight deterministic COMPOSITE families combining an outer shock shell
 *   with a central pulsar-wind nebula;
 * - one seed keeps one stable identity through every knowledge level;
 * - colour variety remains independent from structural variety;
 */
export class SupernovaRemnantRenderModelBuilder {

  private constructor() {}

  static build(
    descriptor:
      ArchiveGalacticObjectRenderDescriptor,
  ): SupernovaRemnantRenderModel {

    requireSupportedDescriptor(
      descriptor,
    );

    const structure =
      hashWords(
        `${descriptor.seed}/SNR-STRUCTURE-V1`,
      );

    const morphology =
      hashWords(
        `${descriptor.seed}/SNR-MORPHOLOGY-V1`,
      );

    const palette =
      hashWords(
        `${descriptor.seed}/SNR-PALETTE-V1`,
      );

    const optics =
      hashWords(
        `${descriptor.seed}/SNR-OPTICS-V1`,
      );

    const scientificMorphology =
      scientificMorphologyFrom(
        descriptor.variant,
        descriptor.renderProfile ??
          null,
      );

    const visualFamilies =
      scientificMorphology ===
        'PLERION'
        ? PLERION_VISUAL_FAMILIES
        : scientificMorphology ===
              'COMPOSITE'
          ? COMPOSITE_VISUAL_FAMILIES
          : SHELL_VISUAL_FAMILIES;

    const morphologyIndex =
      selectStableIndex(
        morphology[1],
        visualFamilies.length,
      );

    const morphologyFamily =
      visualFamilies[
        morphologyIndex
      ];

    const morphologyProfile =
      morphologyProfileFor(
        scientificMorphology,
        morphologyFamily,
        unitFromUint32(structure[2]),
        unitFromUint32(structure[3]),
        unitFromUint32(structure[4]),
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
        scientificMorphology,
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
      scientificMorphology,
      orientationRadians:
        (
          unitFromUint32(
            optics[0],
          ) -
          0.5
        ) *
        Math.PI *
        morphologyProfile.orientationRange,
      structureAspect:
        morphologyProfile.structureAspect,
      apparentExtent:
        morphologyProfile.apparentExtent,
      shellRadius:
        morphologyProfile.shellRadius,
      shellThickness:
        morphologyProfile.shellThickness,
      shellSharpness:
        morphologyProfile.shellSharpness,
      filamentStrength:
        morphologyProfile.filamentStrength,
      clumpiness:
        morphologyProfile.clumpiness,
      fragmentation:
        morphologyProfile.fragmentation,
      interiorGlow:
        morphologyProfile.interiorGlow,
      haloStrength:
        morphologyProfile.haloStrength,
      bilobedStrength:
        morphologyProfile.bilobedStrength,
      asymmetryStrength:
        morphologyProfile.asymmetryStrength,
      jetStrength:
        morphologyProfile.jetStrength,
      centralEngineStrength:
        morphologyProfile.centralEngineStrength,
      ringBreakup:
        morphologyProfile.ringBreakup,
      shockContrast:
        0.50 +
        unitFromUint32(
          optics[1],
        ) *
        0.50,
      coreOffsetX:
        (
          unitFromUint32(
            optics[2],
          ) -
          0.5
        ) *
        morphologyProfile.coreOffsetRange,
      coreOffsetY:
        (
          unitFromUint32(
            optics[3],
          ) -
          0.5
        ) *
        morphologyProfile.coreOffsetRange,
      colorVariance:
        paletteProfile.colorVariance,
      shellVisibility:
        knowledge.shellVisibility,
      filamentVisibility:
        knowledge.filamentVisibility,
      interiorVisibility:
        knowledge.interiorVisibility,
      haloVisibility:
        knowledge.haloVisibility,
      chromaGain:
        knowledge.chromaGain,
      detailFactor:
        knowledge.detailFactor,
      starVisibility:
        knowledge.starVisibility,
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
  readonly orientationRange: number;
  readonly structureAspect: number;
  readonly apparentExtent: number;
  readonly shellRadius: number;
  readonly shellThickness: number;
  readonly shellSharpness: number;
  readonly filamentStrength: number;
  readonly clumpiness: number;
  readonly fragmentation: number;
  readonly interiorGlow: number;
  readonly haloStrength: number;
  readonly bilobedStrength: number;
  readonly asymmetryStrength: number;
  readonly jetStrength: number;
  readonly centralEngineStrength: number;
  readonly ringBreakup: number;
  readonly coreOffsetRange: number;
}

interface PaletteProfile {
  readonly colorVariance: number;
}

interface KnowledgeProfile {
  readonly shellVisibility: number;
  readonly filamentVisibility: number;
  readonly interiorVisibility: number;
  readonly haloVisibility: number;
  readonly chromaGain: number;
  readonly detailFactor: number;
  readonly starVisibility: number;
}

function scientificMorphologyFrom(
  variant:
    string | null,

  renderProfile:
    ArchiveGalacticObjectRenderProfile | null,
): SupernovaRemnantScientificMorphology {

  if (
    variant ===
      'SHELL' ||
    variant ===
      'PLERION' ||
    variant ===
      'COMPOSITE'
  ) {
    return variant;
  }

  if (
    renderProfile ===
      ArchiveGalacticObjectRenderProfile
        .SUPERNOVA_REMNANT_PLERION
  ) {
    return 'PLERION';
  }

  if (
    renderProfile ===
      ArchiveGalacticObjectRenderProfile
        .SUPERNOVA_REMNANT_COMPOSITE
  ) {
    return 'COMPOSITE';
  }

  return 'SHELL';
}

function morphologyProfileFor(
  scientificMorphology:
    SupernovaRemnantScientificMorphology,

  family:
    SupernovaRemnantVisualFamily,

  u0:
    number,

  u1:
    number,

  u2:
    number,

  u3:
    number,

  u4:
    number,

  u5:
    number,
): MorphologyProfile {

  if (
    scientificMorphology ===
      'PLERION'
  ) {
    return plerionMorphologyProfileFor(
      family as
        SupernovaRemnantPlerionVisualFamily,
      u0,
      u1,
      u2,
      u3,
      u4,
      u5,
    );
  }

  if (
    scientificMorphology ===
      'COMPOSITE'
  ) {
    return compositeMorphologyProfileFor(
      family as
        SupernovaRemnantCompositeVisualFamily,
      u0,
      u1,
      u2,
      u3,
      u4,
      u5,
    );
  }

  const base =
    {
          structureAspect: 1.00,
          apparentExtent: 0.92,
          shellRadius: 0.50,
          shellThickness: 0.060,
          shellSharpness: 0.76,
          filamentStrength: 0.58,
          clumpiness: 0.54,
          fragmentation: 0.56,
          interiorGlow: 0.22,
          haloStrength: 0.34,
          bilobedStrength: 0.10,
          asymmetryStrength: 0.22,
          jetStrength: 0.04,
          centralEngineStrength: 0.10,
          ringBreakup: 0.48,
          coreOffsetRange: 0.07,
          orientationRange: 1.10,
        };

  const tuned =
    family === 'FRACTURED_SHELL'
      ? {
          shellThickness: -0.012,
          shellSharpness: 0.16,
          filamentStrength: 0.08,
          clumpiness: 0.12,
          fragmentation: 0.24,
          interiorGlow: -0.04,
          haloStrength: 0.00,
          bilobedStrength: 0.02,
          asymmetryStrength: 0.06,
          jetStrength: -0.04,
          centralEngineStrength: -0.08,
          ringBreakup: 0.20,
          structureAspect: 0.00,
          apparentExtent: 0.00,
          coreOffsetRange: 0.01,
        }
      : family === 'FILAMENT_RING'
        ? {
            shellThickness: -0.020,
            shellSharpness: 0.16,
            filamentStrength: 0.24,
            clumpiness: 0.08,
            fragmentation: 0.10,
            interiorGlow: 0.00,
            haloStrength: 0.06,
            bilobedStrength: 0.00,
            asymmetryStrength: 0.04,
            jetStrength: 0.00,
            centralEngineStrength: 0.00,
            ringBreakup: 0.12,
            structureAspect: -0.03,
            apparentExtent: 0.04,
            coreOffsetRange: 0.00,
          }
        : family === 'BILOBED_SHELL'
          ? {
              shellThickness: 0.004,
              shellSharpness: 0.08,
              filamentStrength: 0.06,
              clumpiness: 0.06,
              fragmentation: 0.10,
              interiorGlow: 0.04,
              haloStrength: 0.04,
              bilobedStrength: 0.30,
              asymmetryStrength: 0.10,
              jetStrength: 0.00,
              centralEngineStrength: -0.02,
              ringBreakup: 0.08,
              structureAspect: 0.08,
              apparentExtent: 0.05,
              coreOffsetRange: 0.02,
            }
          : family === 'KNOTTY_SHELL'
            ? {
                shellThickness: 0.012,
                shellSharpness: 0.10,
                filamentStrength: 0.12,
                clumpiness: 0.26,
                fragmentation: 0.14,
                interiorGlow: 0.00,
                haloStrength: 0.06,
                bilobedStrength: 0.02,
                asymmetryStrength: 0.12,
                jetStrength: 0.00,
                centralEngineStrength: 0.00,
                ringBreakup: 0.12,
                structureAspect: 0.04,
                apparentExtent: 0.06,
                coreOffsetRange: 0.02,
              }
            : family === 'WISPY_ARC'
              ? {
                  shellThickness: -0.010,
                  shellSharpness: 0.02,
                  filamentStrength: 0.18,
                  clumpiness: 0.06,
                  fragmentation: 0.18,
                  interiorGlow: 0.02,
                  haloStrength: 0.10,
                  bilobedStrength: 0.00,
                  asymmetryStrength: 0.16,
                  jetStrength: 0.00,
                  centralEngineStrength: 0.00,
                  ringBreakup: 0.24,
                  structureAspect: 0.02,
                  apparentExtent: 0.02,
                  coreOffsetRange: 0.02,
                }
              : family === 'BUBBLE_SHELL'
                ? {
                    shellThickness: 0.016,
                    shellSharpness: -0.06,
                    filamentStrength: 0.08,
                    clumpiness: 0.04,
                    fragmentation: -0.02,
                    interiorGlow: 0.08,
                    haloStrength: 0.18,
                    bilobedStrength: 0.04,
                    asymmetryStrength: 0.04,
                    jetStrength: 0.00,
                    centralEngineStrength: 0.00,
                    ringBreakup: -0.04,
                    structureAspect: 0.00,
                    apparentExtent: -0.02,
                    coreOffsetRange: 0.02,
                  }
                : family === 'OFFSET_SHELL'
                  ? {
                      shellThickness: 0.008,
                      shellSharpness: 0.04,
                      filamentStrength: 0.10,
                      clumpiness: 0.10,
                      fragmentation: 0.08,
                      interiorGlow: 0.16,
                      haloStrength: 0.10,
                      bilobedStrength: 0.08,
                      asymmetryStrength: 0.16,
                      jetStrength: 0.02,
                      centralEngineStrength: 0.06,
                      ringBreakup: 0.10,
                      structureAspect: 0.04,
                      apparentExtent: 0.03,
                      coreOffsetRange: 0.06,
                    }
                  : {
                      shellThickness: 0.008,
                      shellSharpness: 0.10,
                      filamentStrength: 0.20,
                      clumpiness: 0.14,
                      fragmentation: 0.16,
                      interiorGlow: 0.10,
                      haloStrength: 0.12,
                      bilobedStrength: 0.10,
                      asymmetryStrength: 0.18,
                      jetStrength: 0.04,
                      centralEngineStrength: 0.06,
                      ringBreakup: 0.18,
                      structureAspect: 0.06,
                      apparentExtent: 0.06,
                      coreOffsetRange: 0.04,
                    };

  return Object.freeze({
    orientationRange:
      base.orientationRange,
    structureAspect:
      clamp01Range(
        base.structureAspect +
          tuned.structureAspect +
          (u0 - 0.5) * 0.18,
        0.70,
        1.35,
      ),
    apparentExtent:
      clamp01Range(
        base.apparentExtent +
          tuned.apparentExtent +
          (u1 - 0.5) * 0.12,
        0.62,
        1.10,
      ),
    shellRadius:
      clamp01Range(
        base.shellRadius +
          (u2 - 0.5) * 0.10,
        0.26,
        0.66,
      ),
    shellThickness:
      clamp01Range(
        base.shellThickness +
          tuned.shellThickness +
          (u3 - 0.5) * 0.018,
        0.024,
        0.16,
      ),
    shellSharpness:
      clamp01(
        base.shellSharpness +
          tuned.shellSharpness +
          (u4 - 0.5) * 0.20,
      ),
    filamentStrength:
      clamp01(
        base.filamentStrength +
          tuned.filamentStrength +
          (u5 - 0.5) * 0.18,
      ),
    clumpiness:
      clamp01(
        base.clumpiness +
          tuned.clumpiness +
          (u0 - 0.5) * 0.20,
      ),
    fragmentation:
      clamp01(
        base.fragmentation +
          tuned.fragmentation +
          (u1 - 0.5) * 0.16,
      ),
    interiorGlow:
      clamp01(
        base.interiorGlow +
          tuned.interiorGlow +
          (u2 - 0.5) * 0.12,
      ),
    haloStrength:
      clamp01(
        base.haloStrength +
          tuned.haloStrength +
          (u3 - 0.5) * 0.16,
      ),
    bilobedStrength:
      clamp01(
        base.bilobedStrength +
          tuned.bilobedStrength +
          (u4 - 0.5) * 0.10,
      ),
    asymmetryStrength:
      clamp01(
        base.asymmetryStrength +
          tuned.asymmetryStrength +
          (u5 - 0.5) * 0.16,
      ),
    jetStrength:
      clamp01(
        base.jetStrength +
          tuned.jetStrength +
          (u0 - 0.5) * 0.10,
      ),
    centralEngineStrength:
      clamp01(
        base.centralEngineStrength +
          tuned.centralEngineStrength +
          (u1 - 0.5) * 0.10,
      ),
    ringBreakup:
      clamp01(
        base.ringBreakup +
          tuned.ringBreakup +
          (u2 - 0.5) * 0.18,
      ),
    coreOffsetRange:
      clamp01Range(
        base.coreOffsetRange +
          tuned.coreOffsetRange,
        0,
        0.22,
      ),
  });
}


function plerionMorphologyProfileFor(
  family:
    SupernovaRemnantPlerionVisualFamily,

  u0:
    number,

  u1:
    number,

  u2:
    number,

  u3:
    number,

  u4:
    number,

  u5:
    number,
): MorphologyProfile {

  const tuned =
    family ===
      'FILAMENTARY_WIND_NEBULA'
      ? {
          structureAspect: 0.10,
          apparentExtent: 0.06,
          shellRadius: 0.06,
          shellThickness: -0.018,
          shellSharpness: 0.08,
          filamentStrength: 0.24,
          clumpiness: 0.18,
          fragmentation: 0.20,
          interiorGlow: 0.02,
          haloStrength: 0.02,
          bilobedStrength: 0.02,
          asymmetryStrength: 0.12,
          jetStrength: -0.16,
          centralEngineStrength: -0.08,
          ringBreakup: 0.20,
          coreOffsetRange: 0.02,
        }
      : family ===
          'PETALLED_CORE'
        ? {
            structureAspect: -0.03,
            apparentExtent: -0.04,
            shellRadius: -0.01,
            shellThickness: 0.018,
            shellSharpness: -0.08,
            filamentStrength: 0.06,
            clumpiness: 0.08,
            fragmentation: 0.04,
            interiorGlow: 0.12,
            haloStrength: 0.12,
            bilobedStrength: 0.30,
            asymmetryStrength: 0.06,
            jetStrength: -0.10,
            centralEngineStrength: 0.10,
            ringBreakup: 0.02,
            coreOffsetRange: 0.01,
          }
        : family ===
            'TORUS_JET'
          ? {
              structureAspect: 0.14,
              apparentExtent: -0.08,
              shellRadius: -0.04,
              shellThickness: -0.006,
              shellSharpness: 0.10,
              filamentStrength: -0.04,
              clumpiness: -0.04,
              fragmentation: -0.08,
              interiorGlow: 0.10,
              haloStrength: 0.02,
              bilobedStrength: 0.10,
              asymmetryStrength: 0.02,
              jetStrength: 0.34,
              centralEngineStrength: 0.12,
              ringBreakup: -0.06,
              coreOffsetRange: 0.00,
            }
          : family ===
              'ELLIPTICAL_WISPS'
            ? {
                structureAspect: 0.24,
                apparentExtent: 0.02,
                shellRadius: 0.02,
                shellThickness: -0.012,
                shellSharpness: 0.04,
                filamentStrength: 0.12,
                clumpiness: -0.02,
                fragmentation: 0.00,
                interiorGlow: 0.08,
                haloStrength: 0.08,
                bilobedStrength: 0.04,
                asymmetryStrength: 0.10,
                jetStrength: 0.00,
                centralEngineStrength: 0.02,
                ringBreakup: 0.24,
                coreOffsetRange: 0.02,
              }
            : family ===
                'KNOTTED_SYNCHROTRON'
              ? {
                  structureAspect: 0.04,
                  apparentExtent: 0.04,
                  shellRadius: 0.04,
                  shellThickness: 0.004,
                  shellSharpness: 0.02,
                  filamentStrength: 0.12,
                  clumpiness: 0.28,
                  fragmentation: 0.12,
                  interiorGlow: 0.04,
                  haloStrength: 0.04,
                  bilobedStrength: 0.02,
                  asymmetryStrength: 0.16,
                  jetStrength: -0.04,
                  centralEngineStrength: 0.00,
                  ringBreakup: 0.12,
                  coreOffsetRange: 0.04,
                }
              : family ===
                  'DOUBLE_HALO'
                ? {
                    structureAspect: -0.04,
                    apparentExtent: 0.08,
                    shellRadius: 0.08,
                    shellThickness: 0.020,
                    shellSharpness: -0.12,
                    filamentStrength: -0.06,
                    clumpiness: -0.08,
                    fragmentation: -0.10,
                    interiorGlow: 0.14,
                    haloStrength: 0.28,
                    bilobedStrength: 0.00,
                    asymmetryStrength: 0.02,
                    jetStrength: -0.10,
                    centralEngineStrength: 0.04,
                    ringBreakup: -0.04,
                    coreOffsetRange: 0.01,
                  }
                : family ===
                    'OFFSET_PLUME'
                  ? {
                      structureAspect: 0.18,
                      apparentExtent: 0.10,
                      shellRadius: 0.04,
                      shellThickness: 0.006,
                      shellSharpness: -0.02,
                      filamentStrength: 0.08,
                      clumpiness: 0.08,
                      fragmentation: 0.10,
                      interiorGlow: 0.08,
                      haloStrength: 0.10,
                      bilobedStrength: 0.10,
                      asymmetryStrength: 0.32,
                      jetStrength: 0.10,
                      centralEngineStrength: 0.02,
                      ringBreakup: 0.10,
                      coreOffsetRange: 0.12,
                    }
                  : {
                      structureAspect: 0.08,
                      apparentExtent: 0.08,
                      shellRadius: 0.06,
                      shellThickness: -0.006,
                      shellSharpness: 0.04,
                      filamentStrength: 0.22,
                      clumpiness: 0.18,
                      fragmentation: 0.18,
                      interiorGlow: 0.06,
                      haloStrength: 0.12,
                      bilobedStrength: 0.08,
                      asymmetryStrength: 0.20,
                      jetStrength: 0.08,
                      centralEngineStrength: 0.04,
                      ringBreakup: 0.28,
                      coreOffsetRange: 0.05,
                    };

  return Object.freeze({
    orientationRange:
      1.90,
    structureAspect:
      clamp01Range(
        0.96 +
          tuned.structureAspect +
          (u0 - 0.5) * 0.20,
        0.70,
        1.38,
      ),
    apparentExtent:
      clamp01Range(
        0.80 +
          tuned.apparentExtent +
          (u1 - 0.5) * 0.12,
        0.60,
        1.04,
      ),
    shellRadius:
      clamp01Range(
        0.42 +
          tuned.shellRadius +
          (u2 - 0.5) * 0.08,
        0.28,
        0.58,
      ),
    shellThickness:
      clamp01Range(
        0.090 +
          tuned.shellThickness +
          (u3 - 0.5) * 0.018,
        0.050,
        0.145,
      ),
    shellSharpness:
      clamp01(
        0.46 +
          tuned.shellSharpness +
          (u4 - 0.5) * 0.18,
      ),
    filamentStrength:
      clamp01(
        0.70 +
          tuned.filamentStrength +
          (u5 - 0.5) * 0.18,
      ),
    clumpiness:
      clamp01(
        0.56 +
          tuned.clumpiness +
          (u0 - 0.5) * 0.20,
      ),
    fragmentation:
      clamp01(
        0.42 +
          tuned.fragmentation +
          (u1 - 0.5) * 0.18,
      ),
    interiorGlow:
      clamp01(
        0.72 +
          tuned.interiorGlow +
          (u2 - 0.5) * 0.12,
      ),
    haloStrength:
      clamp01(
        0.48 +
          tuned.haloStrength +
          (u3 - 0.5) * 0.18,
      ),
    bilobedStrength:
      clamp01(
        0.16 +
          tuned.bilobedStrength +
          (u4 - 0.5) * 0.12,
      ),
    asymmetryStrength:
      clamp01(
        0.26 +
          tuned.asymmetryStrength +
          (u5 - 0.5) * 0.18,
      ),
    jetStrength:
      clamp01(
        0.18 +
          tuned.jetStrength +
          (u0 - 0.5) * 0.12,
      ),
    centralEngineStrength:
      clamp01(
        0.56 +
          tuned.centralEngineStrength +
          (u1 - 0.5) * 0.10,
      ),
    ringBreakup:
      clamp01(
        0.44 +
          tuned.ringBreakup +
          (u2 - 0.5) * 0.18,
      ),
    coreOffsetRange:
      clamp01Range(
        0.035 +
          tuned.coreOffsetRange,
        0,
        0.18,
      ),
  });
}

function compositeMorphologyProfileFor(
  family:
    SupernovaRemnantCompositeVisualFamily,

  u0:
    number,

  u1:
    number,

  u2:
    number,

  u3:
    number,

  u4:
    number,

  u5:
    number,
): MorphologyProfile {

  /*
   * A COMPOSITE remnant deliberately contains two independently readable
   * physical zones: the forward-shock shell and a younger pulsar-wind nebula
   * inside it.  The family only changes their relative geometry; it never
   * removes either component.
   */
  const tuned =
    family ===
      'BALANCED_CORE_SHELL'
      ? {
          structureAspect: 0.00,
          apparentExtent: 0.02,
          shellRadius: 0.04,
          shellThickness: -0.010,
          shellSharpness: 0.10,
          filamentStrength: 0.10,
          clumpiness: 0.05,
          fragmentation: 0.04,
          interiorGlow: 0.08,
          haloStrength: 0.04,
          bilobedStrength: 0.02,
          asymmetryStrength: 0.04,
          jetStrength: 0.00,
          centralEngineStrength: 0.04,
          ringBreakup: 0.04,
          coreOffsetRange: 0.00,
        }
      : family ===
          'BIPOLAR_PWN_SHELL'
        ? {
            structureAspect: 0.12,
            apparentExtent: 0.02,
            shellRadius: 0.02,
            shellThickness: -0.004,
            shellSharpness: 0.04,
            filamentStrength: 0.06,
            clumpiness: 0.02,
            fragmentation: 0.04,
            interiorGlow: 0.08,
            haloStrength: 0.02,
            bilobedStrength: 0.30,
            asymmetryStrength: 0.08,
            jetStrength: 0.30,
            centralEngineStrength: 0.08,
            ringBreakup: 0.04,
            coreOffsetRange: 0.01,
          }
        : family ===
            'OFFSET_CORE_SHELL'
          ? {
              structureAspect: 0.04,
              apparentExtent: 0.04,
              shellRadius: 0.04,
              shellThickness: 0.002,
              shellSharpness: 0.04,
              filamentStrength: 0.06,
              clumpiness: 0.08,
              fragmentation: 0.08,
              interiorGlow: 0.06,
              haloStrength: 0.06,
              bilobedStrength: 0.04,
              asymmetryStrength: 0.24,
              jetStrength: 0.06,
              centralEngineStrength: 0.04,
              ringBreakup: 0.08,
              coreOffsetRange: 0.10,
            }
          : family ===
              'FILAMENT_BRIDGE'
            ? {
                structureAspect: 0.06,
                apparentExtent: 0.06,
                shellRadius: 0.03,
                shellThickness: -0.008,
                shellSharpness: 0.12,
                filamentStrength: 0.26,
                clumpiness: 0.12,
                fragmentation: 0.12,
                interiorGlow: 0.02,
                haloStrength: 0.02,
                bilobedStrength: 0.06,
                asymmetryStrength: 0.12,
                jetStrength: 0.04,
                centralEngineStrength: 0.00,
                ringBreakup: 0.14,
                coreOffsetRange: 0.03,
              }
            : family ===
                'BREAKOUT_COMPOSITE'
              ? {
                  structureAspect: 0.18,
                  apparentExtent: 0.08,
                  shellRadius: 0.06,
                  shellThickness: 0.004,
                  shellSharpness: -0.02,
                  filamentStrength: 0.10,
                  clumpiness: 0.12,
                  fragmentation: 0.24,
                  interiorGlow: 0.06,
                  haloStrength: 0.08,
                  bilobedStrength: 0.08,
                  asymmetryStrength: 0.30,
                  jetStrength: 0.10,
                  centralEngineStrength: 0.02,
                  ringBreakup: 0.26,
                  coreOffsetRange: 0.06,
                }
              : family ===
                  'DOUBLE_ARC_CORE'
                ? {
                    structureAspect: -0.04,
                    apparentExtent: 0.00,
                    shellRadius: 0.02,
                    shellThickness: -0.014,
                    shellSharpness: 0.14,
                    filamentStrength: 0.14,
                    clumpiness: 0.02,
                    fragmentation: 0.08,
                    interiorGlow: 0.08,
                    haloStrength: 0.12,
                    bilobedStrength: 0.12,
                    asymmetryStrength: 0.06,
                    jetStrength: 0.02,
                    centralEngineStrength: 0.06,
                    ringBreakup: 0.18,
                    coreOffsetRange: 0.01,
                  }
                : family ===
                    'KNOTTED_RIM_PULSAR'
                  ? {
                      structureAspect: 0.02,
                      apparentExtent: 0.04,
                      shellRadius: 0.04,
                      shellThickness: 0.010,
                      shellSharpness: 0.08,
                      filamentStrength: 0.16,
                      clumpiness: 0.26,
                      fragmentation: 0.14,
                      interiorGlow: 0.02,
                      haloStrength: 0.02,
                      bilobedStrength: 0.04,
                      asymmetryStrength: 0.10,
                      jetStrength: 0.00,
                      centralEngineStrength: 0.08,
                      ringBreakup: 0.12,
                      coreOffsetRange: 0.03,
                    }
                  : {
                      structureAspect: 0.20,
                      apparentExtent: 0.10,
                      shellRadius: 0.04,
                      shellThickness: 0.000,
                      shellSharpness: 0.00,
                      filamentStrength: 0.12,
                      clumpiness: 0.10,
                      fragmentation: 0.16,
                      interiorGlow: 0.08,
                      haloStrength: 0.08,
                      bilobedStrength: 0.08,
                      asymmetryStrength: 0.28,
                      jetStrength: 0.20,
                      centralEngineStrength: 0.04,
                      ringBreakup: 0.18,
                      coreOffsetRange: 0.08,
                    };

  return Object.freeze({
    orientationRange:
      1.85,
    structureAspect:
      clamp01Range(
        1.00 +
          tuned.structureAspect +
          (u0 - 0.5) * 0.18,
        0.72,
        1.42,
      ),
    apparentExtent:
      clamp01Range(
        0.88 +
          tuned.apparentExtent +
          (u1 - 0.5) * 0.10,
        0.70,
        1.08,
      ),
    shellRadius:
      clamp01Range(
        0.50 +
          tuned.shellRadius +
          (u2 - 0.5) * 0.07,
        0.42,
        0.62,
      ),
    shellThickness:
      clamp01Range(
        0.062 +
          tuned.shellThickness +
          (u3 - 0.5) * 0.016,
        0.032,
        0.105,
      ),
    shellSharpness:
      clamp01(
        0.68 +
          tuned.shellSharpness +
          (u4 - 0.5) * 0.16,
      ),
    filamentStrength:
      clamp01(
        0.66 +
          tuned.filamentStrength +
          (u5 - 0.5) * 0.16,
      ),
    clumpiness:
      clamp01(
        0.52 +
          tuned.clumpiness +
          (u0 - 0.5) * 0.18,
      ),
    fragmentation:
      clamp01(
        0.50 +
          tuned.fragmentation +
          (u1 - 0.5) * 0.18,
      ),
    interiorGlow:
      clamp01(
        0.72 +
          tuned.interiorGlow +
          (u2 - 0.5) * 0.12,
      ),
    haloStrength:
      clamp01(
        0.42 +
          tuned.haloStrength +
          (u3 - 0.5) * 0.16,
      ),
    bilobedStrength:
      clamp01(
        0.14 +
          tuned.bilobedStrength +
          (u4 - 0.5) * 0.12,
      ),
    asymmetryStrength:
      clamp01(
        0.24 +
          tuned.asymmetryStrength +
          (u5 - 0.5) * 0.16,
      ),
    jetStrength:
      clamp01(
        0.16 +
          tuned.jetStrength +
          (u0 - 0.5) * 0.12,
      ),
    centralEngineStrength:
      clamp01(
        0.62 +
          tuned.centralEngineStrength +
          (u1 - 0.5) * 0.10,
      ),
    ringBreakup:
      clamp01(
        0.48 +
          tuned.ringBreakup +
          (u2 - 0.5) * 0.16,
      ),
    coreOffsetRange:
      clamp01Range(
        0.025 +
          tuned.coreOffsetRange,
        0,
        0.17,
      ),
  });
}


function paletteProfileFor(
  family:
    SupernovaRemnantPaletteFamily,

  u0:
    number,

  u1:
    number,

  u2:
    number,
): PaletteProfile {

  const base =
    family === 'CYAN_CRIMSON'
      ? 0.90
      : family === 'TEAL_GOLD'
        ? 0.62
        : family === 'AMBER_BLUE'
          ? 0.84
          : family === 'MAGENTA_VIOLET'
            ? 0.88
            : family === 'EMERALD_GOLD'
              ? 0.72
              : family === 'FIRE_ICE'
                ? 0.94
                : 1;

  return Object.freeze({
    colorVariance:
      clamp01(
        base * 0.76 +
          (u0 + u1 + u2) / 3 * 0.28,
      ),
  });
}

function knowledgeProfileFor(
  knowledgeLevel:
    ArchiveGalacticObjectKnowledgeLevel,

  scientificMorphology:
    SupernovaRemnantScientificMorphology,
): KnowledgeProfile {

  if (
    scientificMorphology ===
      'PLERION'
  ) {
    return plerionKnowledgeProfileFor(
      knowledgeLevel,
    );
  }

  if (
    scientificMorphology ===
      'COMPOSITE'
  ) {
    return compositeKnowledgeProfileFor(
      knowledgeLevel,
    );
  }

  switch (
    knowledgeLevel
  ) {
    case ArchiveGalacticObjectKnowledgeLevel.SIGNAL:
      return Object.freeze({
        shellVisibility: 0.30,
        filamentVisibility: 0.10,
        interiorVisibility: 0.14,
        haloVisibility: 0.12,
        chromaGain: 0.32,
        detailFactor: 0.18,
        starVisibility: 0.24,
      });

    case ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED:
      return Object.freeze({
        shellVisibility: 0.56,
        filamentVisibility: 0.36,
        interiorVisibility: 0.38,
        haloVisibility: 0.30,
        chromaGain: 0.56,
        detailFactor: 0.42,
        starVisibility: 0.44,
      });

    case ArchiveGalacticObjectKnowledgeLevel.CATALOGUED:
      return Object.freeze({
        shellVisibility: 0.84,
        filamentVisibility: 0.74,
        interiorVisibility: 0.72,
        haloVisibility: 0.64,
        chromaGain: 0.84,
        detailFactor: 0.78,
        starVisibility: 0.76,
      });

    case ArchiveGalacticObjectKnowledgeLevel.CONFIRMED:
      return Object.freeze({
        shellVisibility: 1,
        filamentVisibility: 1,
        interiorVisibility: 1,
        haloVisibility: 1,
        chromaGain: 1,
        detailFactor: 1,
        starVisibility: 1,
      });
  }
}


function plerionKnowledgeProfileFor(
  knowledgeLevel:
    ArchiveGalacticObjectKnowledgeLevel,
): KnowledgeProfile {

  switch (
    knowledgeLevel
  ) {
    case ArchiveGalacticObjectKnowledgeLevel.SIGNAL:
      return Object.freeze({
        shellVisibility: 0.18,
        filamentVisibility: 0.08,
        interiorVisibility: 0.20,
        haloVisibility: 0.14,
        chromaGain: 0.28,
        detailFactor: 0.16,
        starVisibility: 0.20,
      });

    case ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED:
      return Object.freeze({
        shellVisibility: 0.36,
        filamentVisibility: 0.34,
        interiorVisibility: 0.56,
        haloVisibility: 0.40,
        chromaGain: 0.58,
        detailFactor: 0.44,
        starVisibility: 0.42,
      });

    case ArchiveGalacticObjectKnowledgeLevel.CATALOGUED:
      return Object.freeze({
        shellVisibility: 0.64,
        filamentVisibility: 0.74,
        interiorVisibility: 0.86,
        haloVisibility: 0.74,
        chromaGain: 0.86,
        detailFactor: 0.80,
        starVisibility: 0.74,
      });

    case ArchiveGalacticObjectKnowledgeLevel.CONFIRMED:
      return Object.freeze({
        shellVisibility: 1,
        filamentVisibility: 1,
        interiorVisibility: 1,
        haloVisibility: 1,
        chromaGain: 1,
        detailFactor: 1,
        starVisibility: 1,
      });
  }
}

function compositeKnowledgeProfileFor(
  knowledgeLevel:
    ArchiveGalacticObjectKnowledgeLevel,
): KnowledgeProfile {

  switch (
    knowledgeLevel
  ) {
    case ArchiveGalacticObjectKnowledgeLevel.SIGNAL:
      return Object.freeze({
        shellVisibility: 0.24,
        filamentVisibility: 0.08,
        interiorVisibility: 0.18,
        haloVisibility: 0.12,
        chromaGain: 0.26,
        detailFactor: 0.15,
        starVisibility: 0.20,
      });

    case ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED:
      return Object.freeze({
        shellVisibility: 0.50,
        filamentVisibility: 0.32,
        interiorVisibility: 0.52,
        haloVisibility: 0.38,
        chromaGain: 0.56,
        detailFactor: 0.42,
        starVisibility: 0.42,
      });

    case ArchiveGalacticObjectKnowledgeLevel.CATALOGUED:
      return Object.freeze({
        shellVisibility: 0.82,
        filamentVisibility: 0.74,
        interiorVisibility: 0.84,
        haloVisibility: 0.70,
        chromaGain: 0.84,
        detailFactor: 0.80,
        starVisibility: 0.74,
      });

    case ArchiveGalacticObjectKnowledgeLevel.CONFIRMED:
      return Object.freeze({
        shellVisibility: 1,
        filamentVisibility: 1,
        interiorVisibility: 1,
        haloVisibility: 1,
        chromaGain: 1,
        detailFactor: 1,
        starVisibility: 1,
      });
  }
}


function requireSupportedDescriptor(
  descriptor:
    ArchiveGalacticObjectRenderDescriptor,
): void {

  const opaqueRemnantSignal =
    descriptor.kind ===
      ArchiveGalacticObjectRenderKind
        .EXTREME_OBJECT &&
    descriptor.knowledgeLevel ===
      ArchiveGalacticObjectKnowledgeLevel
        .SIGNAL &&
    descriptor.variant ===
      null &&
    (
      descriptor.renderProfile ===
        ArchiveGalacticObjectRenderProfile
          .SUPERNOVA_REMNANT_SHELL ||
      descriptor.renderProfile ===
        ArchiveGalacticObjectRenderProfile
          .SUPERNOVA_REMNANT_PLERION ||
      descriptor.renderProfile ===
        ArchiveGalacticObjectRenderProfile
          .SUPERNOVA_REMNANT_COMPOSITE
    );

  if (
    descriptor.kind !==
      ArchiveGalacticObjectRenderKind
        .SUPERNOVA_REMNANT &&
    !opaqueRemnantSignal
  ) {
    throw new RangeError(
      `SupernovaRemnantRenderModelBuilder only supports SUPERNOVA_REMNANT descriptors or opaque supernova-remnant signal profiles, received ${descriptor.kind}.`,
    );
  }
}

function selectStableIndex(
  word:
    number,

  length:
    number,
): number {

  return Math.floor(
    unitFromUint32(
      word,
    ) *
      length,
  ) % length;
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

function clamp01Range(
  value:
    number,

  min:
    number,

  max:
    number,
): number {

  return Math.min(
    max,
    Math.max(
      min,
      value,
    ),
  );
}

function hashWords(
  value:
    string,
): readonly number[] {

  let stateA =
    0x811c9dc5;

  let stateB =
    0x9e3779b9;

  let stateC =
    0x85ebca6b;

  let stateD =
    0xc2b2ae35;

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    const code =
      value.charCodeAt(
        index,
      );

    stateA =
      Math.imul(
        stateA ^ code,
        16777619,
      );

    stateB =
      Math.imul(
        stateB ^ (code + index),
        2246822519,
      );

    stateC =
      Math.imul(
        stateC ^ (code << 1),
        3266489917,
      );

    stateD =
      Math.imul(
        stateD ^ (code << 16 >>> 0),
        668265263,
      );
  }

  /*
   * Only final fully-mixed states are exposed. The original V1 draft pushed
   * intermediate states every four characters, so the first indices were
   * derived from the constant `SNR-...` prefix and every seed selected the
   * same visual family. These eight words now depend on the complete seed.
   */
  const words =
    [
      stateA >>> 0,
      stateB >>> 0,
      stateC >>> 0,
      stateD >>> 0,
    ];

  let mixer =
    (
      stateA ^
      stateB ^
      stateC ^
      stateD
    ) >>> 0;

  while (
    words.length < 8
  ) {
    mixer ^=
      mixer << 13;

    mixer ^=
      mixer >>> 17;

    mixer ^=
      mixer << 5;

    mixer =
      Math.imul(
        mixer ^
          (
            0x9e3779b9 +
            words.length *
              0x85ebca6b
          ),
        2246822519,
      ) >>> 0;

    words.push(
      mixer,
    );
  }

  return Object.freeze(
    words,
  );
}

function unitFromUint32(
  value:
    number,
): number {

  return (
    value >>> 0
  ) / 4294967295;
}
