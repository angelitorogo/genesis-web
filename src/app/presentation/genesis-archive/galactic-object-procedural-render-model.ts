import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

export interface GalacticObjectProceduralRenderPalette {
  readonly primary:
    string;

  readonly secondary:
    string;

  readonly accent:
    string;

  readonly highlight:
    string;
}

export interface GalacticObjectProceduralRenderStar {
  readonly x:
    number;

  readonly y:
    number;

  readonly radius:
    number;

  readonly opacity:
    number;

  readonly tone:
    0 | 1 | 2;
}

export interface GalacticObjectProceduralRenderCloud {
  readonly x:
    number;

  readonly y:
    number;

  readonly radiusX:
    number;

  readonly radiusY:
    number;

  readonly rotationDegrees:
    number;

  readonly opacity:
    number;

  readonly tone:
    0 | 1;
}

export interface GalacticObjectProceduralRenderRing {
  readonly radiusX:
    number;

  readonly radiusY:
    number;

  readonly rotationDegrees:
    number;

  readonly strokeWidth:
    number;

  readonly opacity:
    number;
}

export interface GalacticObjectProceduralRenderFilament {
  readonly path:
    string;

  readonly strokeWidth:
    number;

  readonly opacity:
    number;

  readonly tone:
    0 | 1;
}

export interface GalacticObjectProceduralRenderModel {
  readonly palette:
    GalacticObjectProceduralRenderPalette;

  readonly stars:
    readonly GalacticObjectProceduralRenderStar[];

  readonly clouds:
    readonly GalacticObjectProceduralRenderCloud[];

  readonly rings:
    readonly GalacticObjectProceduralRenderRing[];

  readonly filaments:
    readonly GalacticObjectProceduralRenderFilament[];

  readonly coreRadius:
    number;

  readonly coreOpacity:
    number;
}

const VIEWBOX_WIDTH =
  640;

const VIEWBOX_HEIGHT =
  360;

const CENTER_X =
  VIEWBOX_WIDTH /
  2;

const CENTER_Y =
  VIEWBOX_HEIGHT /
  2;

/**
 * Point-12.8 renderer-only deterministic layout.
 *
 * This does not use the simulation PRNG and therefore cannot perturb Ground
 * Truth. Its input has already been filtered by DiscoveryState in
 * ArchiveGalacticObjectCardAssembler, so the renderer cannot infer a hidden
 * physical subtype from DETECTED data.
 */
export class GalacticObjectProceduralRenderModelBuilder {

  private constructor() {}

  static build(
    descriptor:
      ArchiveGalacticObjectRenderDescriptor,
  ): GalacticObjectProceduralRenderModel {

    assertDescriptor(
      descriptor,
    );

    const random =
      createRandom(
        descriptor.seed,
      );

    const palette =
      paletteFor(
        descriptor.kind,
        descriptor.variant,
      );

    const stars:
      GalacticObjectProceduralRenderStar[] =
      [];

    const clouds:
      GalacticObjectProceduralRenderCloud[] =
      [];

    const rings:
      GalacticObjectProceduralRenderRing[] =
      [];

    const filaments:
      GalacticObjectProceduralRenderFilament[] =
      [];

    appendBackgroundStars(
      stars,
      random,
      descriptor,
    );

    switch (
      descriptor.kind
    ) {
      case ArchiveGalacticObjectRenderKind.NEBULA:
        appendNebula(
          stars,
          clouds,
          filaments,
          random,
          descriptor,
        );
        break;

      case ArchiveGalacticObjectRenderKind.HII_REGION:
        appendHiiRegion(
          stars,
          clouds,
          rings,
          filaments,
          random,
          descriptor,
        );
        break;

      case ArchiveGalacticObjectRenderKind.STAR_CLUSTER:
        appendGenericCluster(
          stars,
          random,
          descriptor,
        );
        break;

      case ArchiveGalacticObjectRenderKind.OPEN_CLUSTER:
        appendOpenCluster(
          stars,
          random,
          descriptor,
        );
        break;

      case ArchiveGalacticObjectRenderKind.GLOBULAR_CLUSTER:
        appendGlobularCluster(
          stars,
          random,
          descriptor,
        );
        break;

      case ArchiveGalacticObjectRenderKind.EXTREME_OBJECT:
        appendExtremeSignal(
          rings,
          filaments,
          random,
          descriptor,
        );
        break;

      case ArchiveGalacticObjectRenderKind.SUPERNOVA_REMNANT:
        appendSupernovaRemnant(
          stars,
          rings,
          filaments,
          random,
          descriptor,
        );
        break;
    }

    return Object.freeze({
      palette,
      stars:
        Object.freeze(
          stars,
        ),
      clouds:
        Object.freeze(
          clouds,
        ),
      rings:
        Object.freeze(
          rings,
        ),
      filaments:
        Object.freeze(
          filaments,
        ),
      coreRadius:
        coreRadiusFor(
          descriptor,
        ),
      coreOpacity:
        coreOpacityFor(
          descriptor,
        ),
    });
  }
}

function appendBackgroundStars(
  stars:
    GalacticObjectProceduralRenderStar[],

  random:
    () => number,

  descriptor:
    ArchiveGalacticObjectRenderDescriptor,
): void {

  const count =
    descriptor.knowledgeLevel ===
      ArchiveGalacticObjectKnowledgeLevel.SIGNAL
      ? 24
      : 34;

  for (
    let index =
      0;
    index <
    count;
    index +=
      1
  ) {
    stars.push(
      Object.freeze({
        x:
          round(
            random() *
              VIEWBOX_WIDTH,
          ),
        y:
          round(
            random() *
              VIEWBOX_HEIGHT,
          ),
        radius:
          round(
            0.45 +
              random() *
                1.25,
          ),
        opacity:
          round(
            0.18 +
              random() *
                0.42,
          ),
        tone:
          randomTone3(
            random,
          ),
      }),
    );
  }
}

function appendNebula(
  stars:
    GalacticObjectProceduralRenderStar[],

  clouds:
    GalacticObjectProceduralRenderCloud[],

  filaments:
    GalacticObjectProceduralRenderFilament[],

  random:
    () => number,

  descriptor:
    ArchiveGalacticObjectRenderDescriptor,
): void {

  const detailFactor =
    knowledgeDetailFactor(
      descriptor.knowledgeLevel,
    );

  const cloudCount =
    Math.round(
      10 +
        14 *
          detailFactor +
        8 *
          descriptor.density,
    );

  const spread =
    92 +
    72 *
      descriptor.scale;

  for (
    let index =
      0;
    index <
    cloudCount;
    index +=
      1
  ) {
    const angle =
      random() *
      Math.PI *
      2;

    const distance =
      Math.sqrt(
        random(),
      ) *
      spread;

    clouds.push(
      Object.freeze({
        x:
          round(
            CENTER_X +
              Math.cos(
                angle,
              ) *
                distance *
                1.25,
          ),
        y:
          round(
            CENTER_Y +
              Math.sin(
                angle,
              ) *
                distance *
                0.72,
          ),
        radiusX:
          round(
            28 +
              random() *
                62 +
              22 *
                descriptor.scale,
          ),
        radiusY:
          round(
            13 +
              random() *
                34,
          ),
        rotationDegrees:
          round(
            random() *
              180,
          ),
        opacity:
          round(
            0.12 +
              random() *
                (
                  0.23 +
                  0.12 *
                    descriptor.energy
                ),
          ),
        tone:
          random() <
            0.58
            ? 0
            : 1,
      }),
    );
  }

  const embeddedStars =
    Math.round(
      16 +
        28 *
          detailFactor +
        18 *
          descriptor.energy,
    );

  appendClusterStars(
    stars,
    random,
    embeddedStars,
    spread *
      1.15,
    0.82,
    0.38,
  );

  const filamentCount =
    Math.round(
      3 +
        detailFactor *
          8,
    );

  for (
    let index =
      0;
    index <
    filamentCount;
    index +=
      1
  ) {
    filaments.push(
      createFilament(
        random,
        70 +
          descriptor.scale *
            95,
        0.12 +
          random() *
            0.22,
      ),
    );
  }
}

function appendHiiRegion(
  stars:
    GalacticObjectProceduralRenderStar[],

  clouds:
    GalacticObjectProceduralRenderCloud[],

  rings:
    GalacticObjectProceduralRenderRing[],

  filaments:
    GalacticObjectProceduralRenderFilament[],

  random:
    () => number,

  descriptor:
    ArchiveGalacticObjectRenderDescriptor,
): void {

  appendNebula(
    stars,
    clouds,
    filaments,
    random,
    descriptor,
  );

  rings.push(
    Object.freeze({
      radiusX:
        round(
          58 +
            descriptor.scale *
              82,
        ),
      radiusY:
        round(
          42 +
            descriptor.scale *
              57,
        ),
      rotationDegrees:
        round(
          -12 +
            random() *
              24,
        ),
      strokeWidth:
        round(
          1.6 +
            descriptor.energy *
              2.4,
        ),
      opacity:
        round(
          0.38 +
            descriptor.energy *
              0.26,
        ),
    }),
  );

  const ionizingStars =
    Math.round(
      10 +
        24 *
          descriptor.concentration,
    );

  appendClusterStars(
    stars,
    random,
    ionizingStars,
    54 +
      descriptor.scale *
        35,
    0.72,
    0.82,
  );
}

function appendGenericCluster(
  stars:
    GalacticObjectProceduralRenderStar[],

  random:
    () => number,

  descriptor:
    ArchiveGalacticObjectRenderDescriptor,
): void {

  appendClusterStars(
    stars,
    random,
    64,
    128,
    0.9,
    0.5,
  );

  if (
    descriptor.knowledgeLevel !==
    ArchiveGalacticObjectKnowledgeLevel.SIGNAL
  ) {
    appendClusterStars(
      stars,
      random,
      18,
      62,
      0.76,
      0.72,
    );
  }
}

function appendOpenCluster(
  stars:
    GalacticObjectProceduralRenderStar[],

  random:
    () => number,

  descriptor:
    ArchiveGalacticObjectRenderDescriptor,
): void {

  const detailFactor =
    knowledgeDetailFactor(
      descriptor.knowledgeLevel,
    );

  const count =
    Math.round(
      78 +
        62 *
          descriptor.density +
        32 *
          detailFactor,
    );

  appendClusterStars(
    stars,
    random,
    count,
    116 +
      descriptor.scale *
        72,
    0.82,
    0.52 +
      0.24 *
        descriptor.energy,
  );
}

function appendGlobularCluster(
  stars:
    GalacticObjectProceduralRenderStar[],

  random:
    () => number,

  descriptor:
    ArchiveGalacticObjectRenderDescriptor,
): void {

  const detailFactor =
    knowledgeDetailFactor(
      descriptor.knowledgeLevel,
    );

  const count =
    Math.round(
      124 +
        78 *
          descriptor.density +
        38 *
          detailFactor,
    );

  const spread =
    92 +
    36 *
      descriptor.scale;

  for (
    let index =
      0;
    index <
    count;
    index +=
      1
  ) {
    const angle =
      random() *
      Math.PI *
      2;

    const exponent =
      1.35 +
      2.1 *
        descriptor.concentration;

    const distance =
      random() **
        exponent *
      spread;

    stars.push(
      Object.freeze({
        x:
          round(
            CENTER_X +
              Math.cos(
                angle,
              ) *
                distance,
          ),
        y:
          round(
            CENTER_Y +
              Math.sin(
                angle,
              ) *
                distance *
                0.92,
          ),
        radius:
          round(
            0.55 +
              random() *
                2.15,
          ),
        opacity:
          round(
            0.38 +
              random() *
                0.62,
          ),
        tone:
          randomTone3(
            random,
          ),
      }),
    );
  }
}

function appendExtremeSignal(
  rings:
    GalacticObjectProceduralRenderRing[],

  filaments:
    GalacticObjectProceduralRenderFilament[],

  random:
    () => number,

  descriptor:
    ArchiveGalacticObjectRenderDescriptor,
): void {

  const ringCount =
    descriptor.knowledgeLevel ===
      ArchiveGalacticObjectKnowledgeLevel.SIGNAL
      ? 3
      : 4;

  for (
    let index =
      0;
    index <
    ringCount;
    index +=
      1
  ) {
    const radius =
      38 +
      index *
        30;

    rings.push(
      Object.freeze({
        radiusX:
          round(
            radius *
              (
                1 +
                random() *
                  0.18
              ),
          ),
        radiusY:
          round(
            radius *
              (
                0.58 +
                random() *
                  0.18
              ),
          ),
        rotationDegrees:
          round(
            -28 +
              random() *
                56,
          ),
        strokeWidth:
          round(
            1 +
              random() *
                2,
          ),
        opacity:
          round(
            0.18 +
              random() *
                0.26,
          ),
      }),
    );
  }

  for (
    let index =
      0;
    index <
    8;
    index +=
      1
  ) {
    filaments.push(
      createFilament(
        random,
        86,
        0.17 +
          random() *
            0.2,
      ),
    );
  }
}

function appendSupernovaRemnant(
  stars:
    GalacticObjectProceduralRenderStar[],

  rings:
    GalacticObjectProceduralRenderRing[],

  filaments:
    GalacticObjectProceduralRenderFilament[],

  random:
    () => number,

  descriptor:
    ArchiveGalacticObjectRenderDescriptor,
): void {

  const detailFactor =
    knowledgeDetailFactor(
      descriptor.knowledgeLevel,
    );

  const baseRadius =
    74 +
    78 *
      descriptor.scale;

  const shellDominant =
    descriptor.variant ===
      'SHELL' ||
    descriptor.variant ===
      'COMPOSITE' ||
    descriptor.variant ===
      null;

  if (
    shellDominant
  ) {
    const ringCount =
      Math.round(
        3 +
          detailFactor *
            3,
      );

    for (
      let index =
        0;
      index <
      ringCount;
      index +=
        1
    ) {
      const offset =
        (
          index -
          ringCount /
            2
        ) *
        3.6;

      rings.push(
        Object.freeze({
          radiusX:
            round(
              baseRadius +
                offset +
                random() *
                  5,
            ),
          radiusY:
            round(
              (
                baseRadius +
                offset
              ) *
                (
                  0.68 +
                  random() *
                    0.12
                ),
            ),
          rotationDegrees:
            round(
              -16 +
                random() *
                  32,
            ),
          strokeWidth:
            round(
              1.2 +
                random() *
                  2.8 +
                descriptor.energy *
                  1.6,
            ),
          opacity:
            round(
              0.22 +
                random() *
                  0.34,
            ),
        }),
      );
    }
  }

  const filamentCount =
    Math.round(
      10 +
        16 *
          detailFactor +
        8 *
          descriptor.energy,
    );

  for (
    let index =
      0;
    index <
    filamentCount;
    index +=
      1
  ) {
    filaments.push(
      createShellFilament(
        random,
        baseRadius,
        0.18 +
          random() *
            0.36,
      ),
    );
  }

  if (
    descriptor.variant ===
      'PLERION' ||
    descriptor.variant ===
      'COMPOSITE'
  ) {
    appendClusterStars(
      stars,
      random,
      22 +
        Math.round(
          20 *
            descriptor.energy,
        ),
      44,
      0.68,
      0.76,
    );
  }
}

function appendClusterStars(
  stars:
    GalacticObjectProceduralRenderStar[],

  random:
    () => number,

  count:
    number,

  spread:
    number,

  yRatio:
    number,

  brightness:
    number,
): void {

  for (
    let index =
      0;
    index <
    count;
    index +=
      1
  ) {
    const angle =
      random() *
      Math.PI *
      2;

    const distance =
      Math.sqrt(
        random(),
      ) *
      spread;

    stars.push(
      Object.freeze({
        x:
          round(
            CENTER_X +
              Math.cos(
                angle,
              ) *
                distance,
          ),
        y:
          round(
            CENTER_Y +
              Math.sin(
                angle,
              ) *
                distance *
                yRatio,
          ),
        radius:
          round(
            0.6 +
              random() *
                (
                  1.5 +
                  brightness *
                    1.8
                ),
          ),
        opacity:
          round(
            0.28 +
              brightness *
                0.34 +
              random() *
                0.32,
          ),
        tone:
          randomTone3(
            random,
          ),
      }),
    );
  }
}

function createFilament(
  random:
    () => number,

  spread:
    number,

  opacity:
    number,
): GalacticObjectProceduralRenderFilament {

  const startX =
    CENTER_X +
    (
      random() -
      0.5
    ) *
      spread *
      1.7;

  const startY =
    CENTER_Y +
    (
      random() -
      0.5
    ) *
      spread;

  const endX =
    CENTER_X +
    (
      random() -
      0.5
    ) *
      spread *
      1.7;

  const endY =
    CENTER_Y +
    (
      random() -
      0.5
    ) *
      spread;

  const controlX =
    (
      startX +
      endX
    ) /
      2 +
    (
      random() -
      0.5
    ) *
      70;

  const controlY =
    (
      startY +
      endY
    ) /
      2 +
    (
      random() -
      0.5
    ) *
      54;

  return Object.freeze({
    path:
      `M ${round(startX)} ${round(startY)} Q ${round(controlX)} ${round(controlY)} ${round(endX)} ${round(endY)}`,
    strokeWidth:
      round(
        0.8 +
          random() *
            2.4,
      ),
    opacity:
      round(
        opacity,
      ),
    tone:
      random() <
        0.5
        ? 0
        : 1,
  });
}

function createShellFilament(
  random:
    () => number,

  radius:
    number,

  opacity:
    number,
): GalacticObjectProceduralRenderFilament {

  const startAngle =
    random() *
    Math.PI *
    2;

  const arc =
    0.16 +
    random() *
      0.5;

  const endAngle =
    startAngle +
    arc;

  const localRadius =
    radius *
    (
      0.88 +
      random() *
        0.18
    );

  const startX =
    CENTER_X +
    Math.cos(
      startAngle,
    ) *
      localRadius;

  const startY =
    CENTER_Y +
    Math.sin(
      startAngle,
    ) *
      localRadius *
      0.72;

  const endX =
    CENTER_X +
    Math.cos(
      endAngle,
    ) *
      localRadius;

  const endY =
    CENTER_Y +
    Math.sin(
      endAngle,
    ) *
      localRadius *
      0.72;

  const midAngle =
    (
      startAngle +
      endAngle
    ) /
      2;

  const controlRadius =
    localRadius *
    (
      1.02 +
      random() *
        0.09
    );

  const controlX =
    CENTER_X +
    Math.cos(
      midAngle,
    ) *
      controlRadius;

  const controlY =
    CENTER_Y +
    Math.sin(
      midAngle,
    ) *
      controlRadius *
      0.72;

  return Object.freeze({
    path:
      `M ${round(startX)} ${round(startY)} Q ${round(controlX)} ${round(controlY)} ${round(endX)} ${round(endY)}`,
    strokeWidth:
      round(
        1 +
          random() *
            3.4,
      ),
    opacity:
      round(
        opacity,
      ),
    tone:
      random() <
        0.55
        ? 0
        : 1,
  });
}

function coreRadiusFor(
  descriptor:
    ArchiveGalacticObjectRenderDescriptor,
): number {

  switch (
    descriptor.kind
  ) {
    case ArchiveGalacticObjectRenderKind.HII_REGION:
      return round(
        16 +
          descriptor.energy *
            18,
      );

    case ArchiveGalacticObjectRenderKind.GLOBULAR_CLUSTER:
      return round(
        10 +
          descriptor.concentration *
            24,
      );

    case ArchiveGalacticObjectRenderKind.SUPERNOVA_REMNANT:
      return descriptor.variant ===
          'PLERION' ||
        descriptor.variant ===
          'COMPOSITE'
        ? round(
            12 +
              descriptor.energy *
                22,
          )
        : 4;

    case ArchiveGalacticObjectRenderKind.EXTREME_OBJECT:
      return 8;

    default:
      return 6;
  }
}

function coreOpacityFor(
  descriptor:
    ArchiveGalacticObjectRenderDescriptor,
): number {

  if (
    descriptor.knowledgeLevel ===
    ArchiveGalacticObjectKnowledgeLevel.SIGNAL
  ) {
    return 0.24;
  }

  return round(
    0.34 +
      descriptor.energy *
        0.44,
  );
}

function paletteFor(
  kind:
    ArchiveGalacticObjectRenderKind,

  variant:
    string | null,
): GalacticObjectProceduralRenderPalette {

  switch (
    kind
  ) {
    case ArchiveGalacticObjectRenderKind.NEBULA:
      if (
        variant ===
        'DARK'
      ) {
        return Object.freeze({
          primary:
            '#6ad7ff',
          secondary:
            '#60708f',
          accent:
            '#1c2440',
          highlight:
            '#d8f6ff',
        });
      }

      if (
        variant ===
        'PLANETARY'
      ) {
        return Object.freeze({
          primary:
            '#6ad7ff',
          secondary:
            '#7fffcf',
          accent:
            '#8476ff',
          highlight:
            '#f1fdff',
        });
      }

      return Object.freeze({
        primary:
          '#6ad7ff',
        secondary:
          '#8a7dff',
        accent:
          '#d36dff',
        highlight:
          '#e7fbff',
      });

    case ArchiveGalacticObjectRenderKind.HII_REGION:
      return Object.freeze({
        primary:
          '#ff6dc8',
        secondary:
          '#6ad7ff',
        accent:
          '#7d67ff',
        highlight:
          '#fff0fb',
      });

    case ArchiveGalacticObjectRenderKind.OPEN_CLUSTER:
    case ArchiveGalacticObjectRenderKind.STAR_CLUSTER:
      return Object.freeze({
        primary:
          '#dff8ff',
        secondary:
          '#6ad7ff',
        accent:
          '#8ea4ff',
        highlight:
          '#ffffff',
      });

    case ArchiveGalacticObjectRenderKind.GLOBULAR_CLUSTER:
      return Object.freeze({
        primary:
          '#ffd99b',
        secondary:
          '#f3f1d4',
        accent:
          '#d59b63',
        highlight:
          '#fffaf0',
      });

    case ArchiveGalacticObjectRenderKind.SUPERNOVA_REMNANT:
      return Object.freeze({
        primary:
          '#ff986a',
        secondary:
          '#6ad7ff',
        accent:
          '#ffd06b',
        highlight:
          '#fff7ef',
      });

    case ArchiveGalacticObjectRenderKind.EXTREME_OBJECT:
      return Object.freeze({
        primary:
          '#6ad7ff',
        secondary:
          '#ff6db5',
        accent:
          '#7c6dff',
        highlight:
          '#effcff',
      });

    case ArchiveGalacticObjectRenderKind.AGN_NUCLEUS:
      return Object.freeze({
        primary:
          '#ffb05f',
        secondary:
          '#6ad7ff',
        accent:
          '#ff6d48',
        highlight:
          '#fff7e8',
      });

    case ArchiveGalacticObjectRenderKind.QUASAR_NUCLEUS:
      return Object.freeze({
        primary:
          '#f5f4ff',
        secondary:
          '#6ad7ff',
        accent:
          '#a978ff',
        highlight:
          '#ffffff',
      });
  }
}

function knowledgeDetailFactor(
  level:
    ArchiveGalacticObjectKnowledgeLevel,
): number {

  switch (
    level
  ) {
    case ArchiveGalacticObjectKnowledgeLevel.SIGNAL:
      return 0;

    case ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED:
      return 0.34;

    case ArchiveGalacticObjectKnowledgeLevel.CATALOGUED:
      return 0.7;

    case ArchiveGalacticObjectKnowledgeLevel.CONFIRMED:
      return 1;
  }
}

function assertDescriptor(
  descriptor:
    ArchiveGalacticObjectRenderDescriptor,
): void {

  if (
    descriptor.seed.length ===
    0
  ) {
    throw new RangeError(
      'Point-12.8 render seed cannot be empty.',
    );
  }

  for (
    const value
    of [
      descriptor.scale,
      descriptor.density,
      descriptor.energy,
      descriptor.concentration,
    ]
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
        'Point-12.8 normalized render parameters must remain inside [0, 1].',
      );
    }
  }
}

function randomTone3(
  random:
    () => number,
): 0 | 1 | 2 {

  const value =
    random();

  if (
    value <
    0.58
  ) {
    return 0;
  }

  if (
    value <
    0.86
  ) {
    return 1;
  }

  return 2;
}

function createRandom(
  seed:
    string,
): () => number {

  let state =
    hashString(
      seed,
    );

  return () => {
    state =
      (
        state +
        0x6D2B79F5
      ) >>>
      0;

    let value =
      state;

    value =
      Math.imul(
        value ^
          (
            value >>>
            15
          ),
        value |
          1,
      );

    value ^=
      value +
      Math.imul(
        value ^
          (
            value >>>
            7
          ),
        value |
          61,
      );

    return (
      (
        value ^
        (
          value >>>
          14
        )
      ) >>>
      0
    ) /
    4_294_967_296;
  };
}

function hashString(
  value:
    string,
): number {

  let hash =
    0x811C9DC5;

  for (
    let index =
      0;
    index <
    value.length;
    index +=
      1
  ) {
    hash ^=
      value.charCodeAt(
        index,
      );

    hash =
      Math.imul(
        hash,
        0x01000193,
      );
  }

  return hash >>>
    0;
}

function round(
  value:
    number,
): number {

  return Math.round(
    value *
      1000,
  ) /
  1000;
}
