import {
  FastRadioBurstEventProfile,
  FastRadioBurstOutcome,
} from '../../domain/transient/fast-radio-burst-event-profile';
import {
  FastRadioBurstEngineState,
  type FastRadioBurstSourceProfile,
} from '../../domain/transient/fast-radio-burst-source-profile';

const SPEED_OF_LIGHT_M_S = 299_792_458;
const DISPERSION_CONSTANT_SECONDS = 4.148808e-3;

/**
 * 29.8 source-frame FRB projection.
 *
 * The cold-plasma delay uses frequencies in GHz:
 * dt[s] = 4.148808e-3 * DM[pc cm^-3] * (nu_low^-2 - nu_high^-2).
 * DM is never converted into distance. That would require an electron-density
 * model for the source environment, host, IGM and foreground.
 */
export class FastRadioBurstEventEngine {
  private constructor() {}

  static characterize(source: FastRadioBurstSourceProfile): FastRadioBurstEventProfile {
    if (source.engineState === FastRadioBurstEngineState.BURST_ENGINE_UNRESOLVED) {
      return new FastRadioBurstEventProfile(
        source,
        FastRadioBurstOutcome.BURST_ENGINE_UNRESOLVED,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      );
    }

    const duration = source.sourceFrameDurationSeconds!;
    const centerFrequency = source.centerFrequencyHz!;
    const bandwidth = source.bandwidthHz!;
    const lowEdge = centerFrequency - bandwidth / 2;
    const highEdge = centerFrequency + bandwidth / 2;
    const wavelength = SPEED_OF_LIGHT_M_S / centerFrequency;
    const fractionalBandwidth = bandwidth / centerFrequency;
    const lightCrossingUpperScale = SPEED_OF_LIGHT_M_S * duration;

    let dispersionDelay: number | null = null;
    if (
      source.dispersionMeasurePcCm3 !== null &&
      source.observerBandLowHz !== null &&
      source.observerBandHighHz !== null
    ) {
      const lowGHz = source.observerBandLowHz / 1e9;
      const highGHz = source.observerBandHighHz / 1e9;
      dispersionDelay = DISPERSION_CONSTANT_SECONDS * source.dispersionMeasurePcCm3 *
        (lowGHz ** -2 - highGHz ** -2);
    }

    return new FastRadioBurstEventProfile(
      source,
      FastRadioBurstOutcome.INTRINSIC_COHERENT_RADIO_BURST,
      wavelength,
      fractionalBandwidth,
      lightCrossingUpperScale,
      lowEdge,
      highEdge,
      dispersionDelay,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    );
  }
}
