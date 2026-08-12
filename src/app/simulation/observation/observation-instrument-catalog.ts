import {
  ObservationInstrument,
  ObservationInstrumentKind,
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

const SUPPORTED_INSTRUMENTS:
  readonly ObservationInstrument[] =
  Object.freeze([
    new ObservationInstrument(
      ObservationInstrumentType
        .OPTICAL,
      ObservationInstrumentKind
        .ELECTROMAGNETIC_BAND,
    ),

    new ObservationInstrument(
      ObservationInstrumentType
        .INFRARED,
      ObservationInstrumentKind
        .ELECTROMAGNETIC_BAND,
    ),

    new ObservationInstrument(
      ObservationInstrumentType
        .RADIO,
      ObservationInstrumentKind
        .ELECTROMAGNETIC_BAND,
    ),

    new ObservationInstrument(
      ObservationInstrumentType
        .SPECTROSCOPY,
      ObservationInstrumentKind
        .SPECTROSCOPIC_TECHNIQUE,
    ),

    new ObservationInstrument(
      ObservationInstrumentType
        .X_RAY,
      ObservationInstrumentKind
        .ELECTROMAGNETIC_BAND,
    ),

    new ObservationInstrument(
      ObservationInstrumentType
        .GAMMA_RAY,
      ObservationInstrumentKind
        .ELECTROMAGNETIC_BAND,
    ),

    new ObservationInstrument(
      ObservationInstrumentType
        .GRAVITATIONAL_WAVE,
      ObservationInstrumentKind
        .GRAVITATIONAL_WAVE_DETECTOR,
    ),
  ]);

const SUPPORTED_INSTRUMENT_TYPES:
  readonly ObservationInstrumentType[] =
  Object.freeze(
    SUPPORTED_INSTRUMENTS
      .map(
        (
          instrument,
        ) =>
          instrument.type,
      ),
  );

/**
 * Frozen V1 catalog of the seven observational instrument families.
 *
 * Point 8.2 only defines family identity and broad scientific kind. Instrument
 * levels, sensitivity, precision and reach belong to point 8.3.
 */
export class ObservationInstrumentCatalogV1 {

  private constructor() {}

  static readonly supportedInstruments =
    SUPPORTED_INSTRUMENTS;

  static readonly supportedInstrumentTypes =
    SUPPORTED_INSTRUMENT_TYPES;

  static instrument(
    type:
      ObservationInstrumentType,
  ): ObservationInstrument {

    const instrument =
      SUPPORTED_INSTRUMENTS
        .find(
          (
            candidate,
          ) =>
            candidate.type ===
            type,
        );

    if (
      instrument ===
      undefined
    ) {
      throw new RangeError(
        `Unsupported ObservationInstrumentType: ${String(type)}.`,
      );
    }

    return instrument;
  }
}
