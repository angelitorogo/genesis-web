import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

export interface EmissionNebulaRenderModel {
  /**
   * Structural values depend ONLY on descriptor.seed.
   *
   * They intentionally ignore DiscoveryState, variant and physical quantities,
   * so the same GalacticObject keeps the same large-scale visual identity at
   * SIGNAL, IDENTIFIED, CATALOGUED and CONFIRMED.
   */
  readonly structureSeedX:
    number;

  readonly structureSeedY:
    number;

  readonly orientationRadians:
    number;

  readonly structureAspect:
    number;

  readonly macroScale:
    number;

  /**
   * Stable apparent framing size. It depends only on renderSeed so the same
   * object never changes apparent extent between knowledge levels.
   *
   * It is intentionally NOT derived from catalogued physical radius because
   * SIGNAL / IDENTIFIED must not leak that Ground Truth before authorization.
   */
  readonly apparentExtent:
    number;

  /**
   * Stable chromatic identity. These values select a physically plausible
   * emission-nebula palette but never depend on DiscoveryState.
   */
  readonly paletteWarmShift:
    number;

  readonly paletteCoolShift:
    number;

  readonly paletteMagentaShift:
    number;

  readonly paletteWarmCoolBalance:
    number;

  /**
   * Knowledge controls how much of the already-existing structure is visible.
   * It never re-rolls or relocates that structure.
   */
  readonly detailFactor:
    number;

  readonly starVisibility:
    number;

  readonly emissionReveal:
    number;

  /**
   * Renderer-only projections of already-authorized descriptor values.
   * They affect appearance/intensity, never the structural seed/domain.
   */
  readonly physicalScale:
    number;

  readonly density:
    number;

  readonly energy:
    number;

  readonly ionization:
    number;
}

/**
 * Renderer-only model for the first high-fidelity GalacticObject renderer.
 *
 * This class never reads simulation Ground Truth directly. It receives only
 * ArchiveGalacticObjectRenderDescriptor, preserving the 12.8 anti-leak
 * boundary. A null variant is the coarse/identified generic nebular view;
 * EMISSION activates the already-authorized emission appearance.
 */
export class EmissionNebulaRenderModelBuilder {

  private constructor() {}

  static build(
    descriptor:
      ArchiveGalacticObjectRenderDescriptor,
  ): EmissionNebulaRenderModel {

    requireSupportedDescriptor(
      descriptor,
    );

    const hashes =
      hashWords(
        descriptor.seed,
      );

    const structureSeedX =
      unitFromUint32(
        hashes[
          0
        ],
      );

    const structureSeedY =
      unitFromUint32(
        hashes[
          1
        ],
      );

    const orientationRadians =
      (
        unitFromUint32(
          hashes[
            2
          ],
        ) -
        0.5
      ) *
      Math.PI *
      0.9;

    const structureAspect =
      0.78 +
      unitFromUint32(
        hashes[
          3
        ],
      ) *
      0.34;

    const macroScale =
      0.92 +
      unitFromUint32(
        hashes[
          4
        ],
      ) *
      0.18;

    const diversityHashes =
      hashWords(
        `${descriptor.seed}/EMISSION-DIVERSITY-V1`,
      );

    /*
     * 0.72 .. 1.20 gives visibly compact / extended nebulae while keeping the
     * complete structure safely inside the laboratory card.
     */
    const apparentExtent =
      0.72 +
      unitFromUint32(
        diversityHashes[
          0
        ],
      ) *
      0.48;

    const paletteWarmShift =
      unitFromUint32(
        diversityHashes[
          1
        ],
      );

    const paletteCoolShift =
      unitFromUint32(
        diversityHashes[
          2
        ],
      );

    const paletteMagentaShift =
      unitFromUint32(
        diversityHashes[
          3
        ],
      );

    const paletteWarmCoolBalance =
      unitFromUint32(
        diversityHashes[
          4
        ],
      );

    const detailFactor =
      detailFactorFor(
        descriptor
          .knowledgeLevel,
      );

    return Object.freeze({
      structureSeedX,
      structureSeedY,
      orientationRadians,
      structureAspect,
      macroScale,
      apparentExtent,
      paletteWarmShift,
      paletteCoolShift,
      paletteMagentaShift,
      paletteWarmCoolBalance,
      detailFactor,
      starVisibility:
        0.34 +
        detailFactor *
          0.66,
      emissionReveal:
        descriptor.variant ===
          'EMISSION'
          ? 1
          : 0,
      physicalScale:
        descriptor.scale,
      density:
        descriptor.density,
      energy:
        descriptor.energy,
      ionization:
        descriptor.concentration,
    });
  }
}

function requireSupportedDescriptor(
  descriptor:
    ArchiveGalacticObjectRenderDescriptor,
): void {

  if (
    descriptor.kind !==
    ArchiveGalacticObjectRenderKind
      .NEBULA
  ) {
    throw new RangeError(
      'EmissionNebulaRenderModelBuilder requires a NEBULA render descriptor.',
    );
  }

  if (
    descriptor.variant !==
      null &&
    descriptor.variant !==
      'EMISSION'
  ) {
    throw new RangeError(
      `EmissionNebulaRenderModelBuilder does not render variant ${descriptor.variant}.`,
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

function detailFactorFor(
  knowledgeLevel:
    ArchiveGalacticObjectKnowledgeLevel,
): number {

  switch (
    knowledgeLevel
  ) {
    case ArchiveGalacticObjectKnowledgeLevel
      .SIGNAL:
      return 0.18;

    case ArchiveGalacticObjectKnowledgeLevel
      .IDENTIFIED:
      return 0.42;

    case ArchiveGalacticObjectKnowledgeLevel
      .CATALOGUED:
      return 0.72;

    case ArchiveGalacticObjectKnowledgeLevel
      .CONFIRMED:
      return 1;
  }

  throw new RangeError(
    `Unsupported ArchiveGalacticObjectKnowledgeLevel: ${String(knowledgeLevel)}.`,
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
