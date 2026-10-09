import { type GravitationalWaveEventProfile, type NormalizedGravitationalWaveform } from '../../../../domain/transient/gravitational-wave-event-profile';
import { type CompactMergerType as CompactMergerTypeValue } from '../../../../domain/transient/compact-merger-type';
import { GravitationalWaveEventEngine } from '../../../../simulation/transient/gravitational-wave-event-engine';
import { COMPACT_MERGER_LABORATORY_CASES } from '../compact-mergers/compact-merger-laboratory-fixtures';

export interface GravitationalWaveLaboratoryCase {
  readonly id: CompactMergerTypeValue;
  readonly shortLabel: string;
  readonly title: string;
  readonly description: string;
  readonly profile: GravitationalWaveEventProfile;
  readonly waveform: NormalizedGravitationalWaveform;
  readonly waveformPoints: string;
}

export const GRAVITATIONAL_WAVE_LABORATORY_CASES = Object.freeze(
  COMPACT_MERGER_LABORATORY_CASES.map(item => {
    const profile = GravitationalWaveEventEngine.deriveProfile(item.profile);
    const waveform = GravitationalWaveEventEngine.normalizedFinalInspiral(profile);
    return Object.freeze({
      id: item.id,
      shortLabel: item.shortLabel,
      title: `Ondas gravitacionales · ${item.shortLabel}`,
      description: description(item.shortLabel),
      profile,
      waveform,
      waveformPoints: buildWaveformPoints(waveform),
    });
  }),
);

function description(label: string): string {
  if (label === 'NS–NS') {
    return 'Inspiral cuadrupolar de dos estrellas de neutrones. El tramo final se normaliza para visualizar la fase; el post-merger depende de la ecuación de estado y no se inventa.';
  }
  if (label === 'NS–BH') {
    return 'Inspiral intrínseco NS–BH derivable sin conocer el spin. El merger/ringdown y el strain observado siguen abiertos mientras falten geometría del observador y parámetros Kerr.';
  }
  return 'Inspiral BH–BH derivado de las masas y la órbita canónica de 29.4. La referencia ISCO es Schwarzschild; no sustituye un waveform IMR con spin ni un strain de detector.';
}

function buildWaveformPoints(waveform: NormalizedGravitationalWaveform): string {
  const width = 960;
  const centerY = 150;
  const amplitude = 118;
  return waveform.samples.map((sample, index) => {
    const x = waveform.samples.length <= 1 ? 0 : index / (waveform.samples.length - 1) * width;
    const y = centerY - sample.normalizedStrain * amplitude;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}
