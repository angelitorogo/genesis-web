import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

export interface ReflectionNebulaRenderModel {
  /**
   * These structural values intentionally mirror the frozen emission-nebula
   * macro field. A nebula therefore keeps the same large-scale identity while
   * SIGNAL / IDENTIFIED are still rendered as a generic nebular observation
   * and REFLECTION becomes scientifically authorized later.
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

  readonly apparentExtent:
    number;

  /**
   * Reflection-specific but still seed-stable visual identity.
   */
  readonly illuminatorBlueMix:
    number;

  readonly illuminatorWarmMix:
    number;

  readonly illuminatorVioletMix:
    number;

  readonly illuminatorBalance:
    number;

  readonly dustScatteringStrength:
    number;

  readonly detailFactor:
    number;

  readonly starVisibility:
    number;

  readonly reflectionReveal:
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

export class ReflectionNebulaRenderModelBuilder {

  private constructor() {}

  static build(
    descriptor:
      ArchiveGalacticObjectRenderDescriptor,
  ): ReflectionNebulaRenderModel {

    requireSupportedDescriptor(
      descriptor,
    );

    /*
     * Keep these first five derivations byte-for-byte equivalent in behaviour
     * to EmissionNebulaRenderModelBuilder. This is what freezes the same cloud
     * silhouette when a generic nebular observation later becomes REFLECTION.
     */
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

    /*
     * Compatibility domain: SIGNAL / IDENTIFIED currently pass through the
     * frozen generic high-fidelity nebula renderer. Reusing this domain keeps
     * apparent extent identical at the REFLECTION transition.
     */
    const structuralDiversity =
      hashWords(
        `${descriptor.seed}/EMISSION-DIVERSITY-V1`,
      );

    const apparentExtent =
      0.72 +
      unitFromUint32(
        structuralDiversity[
          0
        ],
      ) *
      0.48;

    const reflectionIdentity =
      hashWords(
        `${descriptor.seed}/REFLECTION-NEBULA-IDENTITY-V1`,
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
      illuminatorBlueMix:
        unitFromUint32(
          reflectionIdentity[
            0
          ],
        ),
      illuminatorWarmMix:
        unitFromUint32(
          reflectionIdentity[
            1
          ],
        ),
      illuminatorVioletMix:
        unitFromUint32(
          reflectionIdentity[
            2
          ],
        ),
      illuminatorBalance:
        unitFromUint32(
          reflectionIdentity[
            3
          ],
        ),
      dustScatteringStrength:
        0.72 +
        unitFromUint32(
          reflectionIdentity[
            4
          ],
        ) *
        0.38,
      detailFactor,
      starVisibility:
        0.40 +
        detailFactor *
          0.60,
      reflectionReveal:
        descriptor.variant ===
          'REFLECTION'
          ? 1
          : 0,
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
      'ReflectionNebulaRenderModelBuilder requires a NEBULA render descriptor.',
    );
  }

  if (
    descriptor.variant !==
      null &&
    descriptor.variant !==
      'REFLECTION'
  ) {
    throw new RangeError(
      `ReflectionNebulaRenderModelBuilder does not render variant ${descriptor.variant}.`,
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
