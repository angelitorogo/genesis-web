import { ExtremeType } from '../../../domain/galactic-object/extreme-object-type';
import { GalacticNucleusState } from '../../../domain/universe/galactic-nucleus-state';
import { type Galaxy } from '../../../domain/universe/galaxy';

import {
  blackHoleLaboratoryModel,
  type BlackHoleLaboratoryRenderModel,
} from './black-hole-laboratory-render-model';

/**
 * 28.2F.4.1 — Shared canonical SMBH core for galactic nuclei.
 *
 * AGN/QUASAR/QUIESCENT are nuclear activity regimes, not different compact
 * objects. Whenever the canonical Galaxy already contains an SMBH, the
 * laboratory reuses the exact 28.2F.3 SMBH renderer instead of drawing a
 * second ad-hoc black-hole silhouette in the nucleus layer.
 *
 * This helper never creates a new Ground-Truth black hole. A QUIESCENT nucleus
 * without an existing SMBH returns null.
 */
export function createGalacticNucleusBlackHoleCoreModel(
  galaxy: Galaxy,
  familyIndex: number,
): BlackHoleLaboratoryRenderModel | null {
  const nucleus = galaxy.nucleus;
  const source = nucleus?.supermassiveBlackHole;

  if (nucleus === null || nucleus === undefined || source === null || source === undefined) {
    return null;
  }

  const sampleIndex = Math.max(0, Math.min(7, Math.trunc(familyIndex)));
  const base = blackHoleLaboratoryModel(ExtremeType.SMBH, sampleIndex);
  const t = sampleIndex / 7;

  const massSolar = source.massSolarMasses;

  if (nucleus.state === GalacticNucleusState.AGN) {
    // AGN laboratory baseline: use the 28.2F.3 SMBH visual EXACTLY as approved.
    // Only the physical mass/Schwarzschild radius and explanatory label come
    // from the real galactic nucleus. No additional AGN brightness/thickness
    // remapping is applied at this stage.
    return Object.freeze({
      ...base,
      type: ExtremeType.SMBH,
      label: 'AGN · SMBH canónico',
      massSolar,
      schwarzschildRadiusKm: massSolar * 2.95325,
      caveat: `${base.caveat} Núcleo AGN: representación visual canónica 28.2F.3 del SMBH real, sin capa AGN adicional.`,
    });
  }

  if (nucleus.state === GalacticNucleusState.QUASAR) {
    // QUASAR starts from the exact same canonical 28.2F.3 SMBH as AGN.
    // The quasar-specific luminosity, corona and jets are presentation layers
    // owned by QuasarNucleusRender; they are not baked into a second black hole.
    return Object.freeze({
      ...base,
      type: ExtremeType.SMBH,
      label: 'QUASAR · SMBH canónico',
      massSolar,
      schwarzschildRadiusKm: massSolar * 2.95325,
      caveat: `${base.caveat} Núcleo QUASAR: SMBH canónico 28.2F.3 con capas de actividad quásar separadas.`,
    });
  }

  const regime = regimeProfile(nucleus.state, t);

  return Object.freeze({
    ...base,
    type: ExtremeType.SMBH,
    label: regime.label,
    massSolar,
    schwarzschildRadiusKm: massSolar * 2.95325,
    accretionRateEddington: regime.accretionRateEddington,
    diskTemperatureK: base.diskTemperatureK * regime.temperatureScale,
    diskBrightness: regime.diskBrightness,
    diskThickness: regime.diskThickness,
    turbulenceStrength: regime.turbulenceStrength,
    lensingStrength: Math.max(base.lensingStrength, regime.minimumLensingStrength),
    caveat: `${base.caveat} Núcleo ${nucleus.state.name}: el SMBH procede del Ground Truth; el régimen de brillo es una codificación visual de laboratorio y no una nueva generación física.`,
  });
}

interface NuclearRegimeProfile {
  readonly label: string;
  readonly accretionRateEddington: number;
  readonly diskBrightness: number;
  readonly diskThickness: number;
  readonly turbulenceStrength: number;
  readonly temperatureScale: number;
  readonly minimumLensingStrength: number;
}

function regimeProfile(
  state: GalacticNucleusState,
  t: number,
): NuclearRegimeProfile {
  if (state === GalacticNucleusState.QUIESCENT) {
    return Object.freeze({
      label: 'SMBH quiescente',
      accretionRateEddington: round(0.002 + 0.008 * t, 4),
      diskBrightness: round(0.10 + 0.05 * t, 3),
      diskThickness: round(0.008 + 0.006 * t, 3),
      turbulenceStrength: round(0.03 + 0.02 * t, 3),
      temperatureScale: 0.42,
      minimumLensingStrength: 0.92,
    });
  }

  if (state === GalacticNucleusState.QUASAR) {
    return Object.freeze({
      label: 'Quásar · núcleo SMBH',
      accretionRateEddington: round(0.42 + 0.46 * t, 3),
      diskBrightness: round(1.48 + 0.32 * t, 3),
      diskThickness: round(0.050 + 0.024 * t, 3),
      turbulenceStrength: round(0.22 + 0.14 * t, 3),
      temperatureScale: 1.22,
      minimumLensingStrength: 1.12,
    });
  }

  return Object.freeze({
    label: 'AGN · núcleo SMBH',
    accretionRateEddington: round(0.07 + 0.23 * t, 3),
    diskBrightness: round(1.02 + 0.24 * t, 3),
    diskThickness: round(0.032 + 0.020 * t, 3),
    turbulenceStrength: round(0.14 + 0.12 * t, 3),
    temperatureScale: 0.86,
    minimumLensingStrength: 1.02,
  });
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
