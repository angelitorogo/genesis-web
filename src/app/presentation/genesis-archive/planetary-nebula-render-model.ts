import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  ArchiveGalacticObjectRenderProfile,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

export interface PlanetaryNebulaRenderModel {
  /**
   * Frozen generic-nebula macro identity. These values intentionally use the
   * same derivation as the other high-fidelity nebula renderers.
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
   * Seed-stable visual morphology. These are renderer parameters only; they do
   * not create a new scientific subtype in the domain model.
   */
  readonly shellRadius:
    number;

  readonly shellThickness:
    number;

  readonly ellipticity:
    number;

  readonly bipolarity:
    number;

  readonly lobeCount:
    number;

  readonly lobeStrength:
    number;

  readonly shellPhase:
    number;

  readonly outerHaloStrength:
    number;

  /**
   * Seed-stable pseudo-3D projection identity. These values only affect how
   * the expelled volume is projected; they do not create new scientific
   * taxonomy.
   */
  readonly inclinationRadians:
    number;

  readonly depthStretch:
    number;

  readonly expansionAsymmetry:
    number;

  readonly turbulenceStrength:
    number;

  /**
   * Stable chromatic identity of the expelled ionized envelope.
   */
  readonly innerCoolShift:
    number;

  readonly middleMagentaShift:
    number;

  readonly outerWarmShift:
    number;

  readonly paletteBalance:
    number;

  readonly centralStarHeat:
    number;

  readonly detailFactor:
    number;

  readonly starVisibility:
    number;

  readonly planetaryReveal:
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

export class PlanetaryNebulaRenderModelBuilder {

  private constructor() {}

  static build(
    descriptor:
      ArchiveGalacticObjectRenderDescriptor,
  ): PlanetaryNebulaRenderModel {

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

    /*
     * Preserve the same apparent outer footprint used by the generic
     * high-fidelity nebular observation before PLANETARY is authorized.
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

    const morphology =
      hashWords(
        `${descriptor.seed}/PLANETARY-NEBULA-MORPHOLOGY-V1`,
      );

    const palette =
      hashWords(
        `${descriptor.seed}/PLANETARY-NEBULA-PALETTE-V1`,
      );

    const volumeIdentity =
      hashWords(
        `${descriptor.seed}/PLANETARY-NEBULA-VOLUME-V3`,
      );

    const shellRadius =
      0.34 +
      unitFromUint32(
        morphology[
          0
        ],
      ) *
      0.18;

    const shellThickness =
      0.050 +
      unitFromUint32(
        morphology[
          1
        ],
      ) *
      0.060;

    const ellipticity =
      0.70 +
      unitFromUint32(
        morphology[
          2
        ],
      ) *
      0.42;

    const bipolarity =
      unitFromUint32(
        morphology[
          3
        ],
      );

    const lobeSelector =
      unitFromUint32(
        morphology[
          4
        ],
      );

    const lobeCount =
      2 +
      Math.floor(
        lobeSelector *
        4,
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
      shellRadius,
      shellThickness,
      ellipticity,
      bipolarity,
      lobeCount,
      lobeStrength:
        0.08 +
        lobeSelector *
        0.36,
      shellPhase:
        unitFromUint32(
          structuralDiversity[
            1
          ],
        ) *
        Math.PI *
        2,
      outerHaloStrength:
        0.18 +
        unitFromUint32(
          structuralDiversity[
            2
          ],
        ) *
        0.48,
      inclinationRadians:
        (
          unitFromUint32(
            volumeIdentity[
              0
            ],
          ) -
          0.5
        ) *
        Math.PI *
        0.78,
      depthStretch:
        0.68 +
        unitFromUint32(
          volumeIdentity[
            1
          ],
        ) *
        0.72,
      expansionAsymmetry:
        (
          unitFromUint32(
            volumeIdentity[
              2
            ],
          ) -
          0.5
        ) *
        0.46,
      turbulenceStrength:
        0.72 +
        unitFromUint32(
          volumeIdentity[
            3
          ],
        ) *
        0.58,
      innerCoolShift:
        unitFromUint32(
          palette[
            0
          ],
        ),
      middleMagentaShift:
        unitFromUint32(
          palette[
            1
          ],
        ),
      outerWarmShift:
        unitFromUint32(
          palette[
            2
          ],
        ),
      paletteBalance:
        unitFromUint32(
          palette[
            3
          ],
        ),
      centralStarHeat:
        0.72 +
        unitFromUint32(
          palette[
            4
          ],
        ) *
        0.28,
      detailFactor,
      starVisibility:
        0.40 +
        detailFactor *
          0.60,
      planetaryReveal:
        descriptor.variant ===
          'PLANETARY' ||
        descriptor.renderProfile ===
          ArchiveGalacticObjectRenderProfile
            .PLANETARY_VOLUME
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
      'PlanetaryNebulaRenderModelBuilder requires a NEBULA render descriptor.',
    );
  }

  if (
    descriptor.variant !==
      null &&
    descriptor.variant !==
      'PLANETARY'
  ) {
    throw new RangeError(
      `PlanetaryNebulaRenderModelBuilder does not render variant ${descriptor.variant}.`,
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
