/**
 * Spectroscopically active molecular species supported by the simplified
 * point-13.3 V1 atmospheric model.
 *
 * This is intentionally NOT the future point-20 atmospheric gas/composition
 * domain. It is a spectroscopy-facing absorber vocabulary. A later
 * AtmosphereGenerator may map its physical gas inventory onto these absorbers
 * without changing the spectroscopy engine.
 */
export enum AtmosphericSpectralAbsorber {
  WATER_VAPOR =
    'WATER_VAPOR',

  CARBON_DIOXIDE =
    'CARBON_DIOXIDE',

  METHANE =
    'METHANE',

  MOLECULAR_OXYGEN =
    'MOLECULAR_OXYGEN',

  OZONE =
    'OZONE',

  CARBON_MONOXIDE =
    'CARBON_MONOXIDE',

  AMMONIA =
    'AMMONIA',

  NITROUS_OXIDE =
    'NITROUS_OXIDE',

  SULFUR_DIOXIDE =
    'SULFUR_DIOXIDE',
}

/**
 * One spectroscopy-facing atmospheric constituent.
 *
 * volumeMixingRatio is dimensionless and must lie in (0, 1]. Components do not
 * need to sum to exactly one: the remainder may represent spectrally inactive
 * or currently unsupported background gases.
 */
export class AtmosphericSpectralComponent {

  constructor(
    readonly absorber:
      AtmosphericSpectralAbsorber,

    readonly volumeMixingRatio:
      number,
  ) {
    if (
      !Number.isFinite(
        volumeMixingRatio,
      ) ||
      volumeMixingRatio <=
        0 ||
      volumeMixingRatio >
        1
    ) {
      throw new RangeError(
        'volumeMixingRatio must be finite and in (0, 1].',
      );
    }
  }
}

/**
 * Minimal point-13.3 physical input for an atmospheric transmission spectrum.
 *
 * relativeColumnScale is deliberately dimensionless. It allows spectroscopy to
 * distinguish no/thin/thick effective absorbing columns before the roadmap
 * introduces physical pressure and density in point 20.2.
 *
 * This class does not identify a body as Planet or Moon and does not generate
 * atmosphere Ground Truth. Both are later-roadmap responsibilities.
 */
export class AtmosphericSpectrumProfile {

  readonly components:
    readonly AtmosphericSpectralComponent[];

  constructor(
    components:
      readonly AtmosphericSpectralComponent[],

    readonly relativeColumnScale:
      number,
  ) {
    if (
      !Number.isFinite(
        relativeColumnScale,
      ) ||
      relativeColumnScale <
        0 ||
      relativeColumnScale >
        1
    ) {
      throw new RangeError(
        'relativeColumnScale must be finite and in [0, 1].',
      );
    }

    const canonicalComponents =
      [
        ...components,
      ]
        .sort(
          (
            left,
            right,
          ) =>
            left
              .absorber
              .localeCompare(
                right.absorber,
              ),
        );

    const absorbers =
      new Set<
        AtmosphericSpectralAbsorber
      >();

    let totalMixingRatio =
      0;

    for (
      const component
      of canonicalComponents
    ) {
      if (
        absorbers.has(
          component
            .absorber,
        )
      ) {
        throw new RangeError(
          `Duplicate atmospheric spectral absorber: ${component.absorber}.`,
        );
      }

      absorbers.add(
        component
          .absorber,
      );

      totalMixingRatio +=
        component
          .volumeMixingRatio;
    }

    if (
      totalMixingRatio >
      1 +
        Number.EPSILON *
        16
    ) {
      throw new RangeError(
        'Atmospheric spectral component mixing ratios must sum to at most 1.',
      );
    }

    this.components =
      Object.freeze(
        canonicalComponents,
      );
  }
}
