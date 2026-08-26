import {
  type StellarBrownDwarfClass,
} from '../../domain/stellar/stellar-brown-dwarf-class';

import {
  StellarColor,
} from '../../domain/stellar/stellar-color';

import {
  StellarSpectralAppearance,
} from '../../domain/stellar/stellar-spectral-appearance';

import {
  type StellarSpectralFamily,
  StellarSpectralType,
} from '../../domain/stellar/stellar-spectral-type';

import {
  type StellarMainSequenceClass,
} from '../../domain/stellar/stellar-main-sequence-class';

export const STELLAR_SPECTRAL_V1_MIN_EFFECTIVE_TEMPERATURE_KELVIN =
  250;

export const STELLAR_SPECTRAL_V1_MAX_EFFECTIVE_TEMPERATURE_KELVIN =
  200_000;

const V1_DISPLAY_COLOR_MIN_KELVIN =
  1_000;

const V1_DISPLAY_COLOR_MAX_KELVIN =
  40_000;

interface V1SubtypeTemperatureRange {
  readonly hotKelvin:
    number;

  readonly coolKelvin:
    number;
}

const V1_SUBTYPE_TEMPERATURE_RANGE:
  Readonly<Record<StellarSpectralFamily, V1SubtypeTemperatureRange>> =
    Object.freeze({
      O: {
        hotKelvin:
          50_000,
        coolKelvin:
          30_000,
      },

      B: {
        hotKelvin:
          30_000,
        coolKelvin:
          10_000,
      },

      A: {
        hotKelvin:
          10_000,
        coolKelvin:
          7_500,
      },

      F: {
        hotKelvin:
          7_500,
        coolKelvin:
          6_000,
      },

      G: {
        hotKelvin:
          6_000,
        coolKelvin:
          5_200,
      },

      K: {
        hotKelvin:
          5_200,
        coolKelvin:
          3_700,
      },

      M: {
        hotKelvin:
          3_700,
        coolKelvin:
          2_400,
      },

      L: {
        hotKelvin:
          2_400,
        coolKelvin:
          1_300,
      },

      T: {
        hotKelvin:
          1_300,
        coolKelvin:
          500,
      },

      Y: {
        hotKelvin:
          500,
        coolKelvin:
          250,
      },
    });

/**
 * Pure point-15.2 spectral/color classifier.
 *
 * The broad family is supplied by the already-frozen phase-14 evolutionary
 * vocabulary. Temperature only resolves the 0..9 subtype and display color, so
 * point 15.2 cannot silently contradict the O/B/A/F/G/K/M or L/T/Y family that
 * phase 14 assigned.
 *
 * The RGB conversion is a bounded black-body-inspired sRGB approximation for
 * display. It is intentionally renderer-independent and not calibrated
 * photometry. Very hot/cool values saturate at the display approximation limits
 * while the scientific spectral temperature envelope remains wider.
 */
export class StellarSpectralClassifier {

  private constructor() {}

  static classify(
    effectiveTemperatureKelvin:
      number,

    mainSequenceClass:
      StellarMainSequenceClass | null,

    brownDwarfClass:
      StellarBrownDwarfClass | null,
  ): StellarSpectralAppearance {

    assertSpectralTemperature(
      effectiveTemperatureKelvin,
    );

    const family =
      resolveFamily(
        mainSequenceClass,
        brownDwarfClass,
      );

    const subtype =
      subtypeForTemperatureV1(
        family,
        effectiveTemperatureKelvin,
      );

    return new StellarSpectralAppearance(
      new StellarSpectralType(
        family,
        subtype,
      ),
      representativeColorV1(
        effectiveTemperatureKelvin,
      ),
    );
  }
}

function resolveFamily(
  mainSequenceClass:
    StellarMainSequenceClass | null,

  brownDwarfClass:
    StellarBrownDwarfClass | null,
): StellarSpectralFamily {

  const hasMainSequenceClass =
    mainSequenceClass !==
      null;

  const hasBrownDwarfClass =
    brownDwarfClass !==
      null;

  if (
    hasMainSequenceClass ===
    hasBrownDwarfClass
  ) {
    throw new RangeError(
      'Exactly one broad phase-14 stellar class must be supplied for point-15.2 spectral classification.',
    );
  }

  return (
    mainSequenceClass?.name ??
    brownDwarfClass!.name
  );
}

function subtypeForTemperatureV1(
  family:
    StellarSpectralFamily,

  temperatureKelvin:
    number,
): number {

  const range =
    V1_SUBTYPE_TEMPERATURE_RANGE[
      family
    ];

  const normalizedCoolness =
    clamp01(
      (
        range.hotKelvin -
        temperatureKelvin
      ) /
      (
        range.hotKelvin -
        range.coolKelvin
      ),
    );

  return Math.min(
    9,
    Math.floor(
      normalizedCoolness *
      10,
    ),
  );
}

function representativeColorV1(
  effectiveTemperatureKelvin:
    number,
): StellarColor {

  const temperatureHundreds =
    clamp(
      effectiveTemperatureKelvin,
      V1_DISPLAY_COLOR_MIN_KELVIN,
      V1_DISPLAY_COLOR_MAX_KELVIN,
    ) /
    100;

  let red:
    number;

  let green:
    number;

  let blue:
    number;

  if (
    temperatureHundreds <=
    66
  ) {
    red =
      255;

    green =
      99.4708025861 *
        Math.log(
          temperatureHundreds,
        ) -
      161.1195681661;

    blue =
      temperatureHundreds <=
        19
        ? 0
        : 138.5177312231 *
            Math.log(
              temperatureHundreds -
                10,
            ) -
          305.0447927307;
  } else {
    const shiftedTemperature =
      temperatureHundreds -
      60;

    red =
      329.698727446 *
      shiftedTemperature **
        -0.1332047592;

    green =
      288.1221695283 *
      shiftedTemperature **
        -0.0755148492;

    blue =
      255;
  }

  return new StellarColor(
    toByte(
      red,
    ),
    toByte(
      green,
    ),
    toByte(
      blue,
    ),
  );
}

function assertSpectralTemperature(
  value:
    number,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      STELLAR_SPECTRAL_V1_MIN_EFFECTIVE_TEMPERATURE_KELVIN ||
    value >
      STELLAR_SPECTRAL_V1_MAX_EFFECTIVE_TEMPERATURE_KELVIN
  ) {
    throw new RangeError(
      `effectiveTemperatureKelvin must be finite and in [${STELLAR_SPECTRAL_V1_MIN_EFFECTIVE_TEMPERATURE_KELVIN}, ${STELLAR_SPECTRAL_V1_MAX_EFFECTIVE_TEMPERATURE_KELVIN}] for point-15.2 classification.`,
    );
  }
}

function toByte(
  value:
    number,
): number {

  return Math.round(
    clamp(
      value,
      0,
      255,
    ),
  );
}

function clamp01(
  value:
    number,
): number {

  return clamp(
    value,
    0,
    1,
  );
}

function clamp(
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
