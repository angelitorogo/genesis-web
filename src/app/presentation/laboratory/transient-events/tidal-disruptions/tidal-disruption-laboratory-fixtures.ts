import {
  type NormalizedTidalFallbackCurve,
  type TidalDisruptionEventProfile,
} from '../../../../domain/transient/tidal-disruption-event-profile';
import {
  TidalDisruptionEncounterProfile,
  TidalDisruptionVictimKind,
  type TidalDisruptionVictimKind as TidalDisruptionVictimKindValue,
} from '../../../../domain/transient/tidal-disruption-encounter-profile';
import { TidalDisruptionEventEngine } from '../../../../simulation/transient/tidal-disruption-event-engine';

export const TidalDisruptionLaboratoryCaseId = Object.freeze({
  SOLAR_SMBH: 'SOLAR_SMBH',
  RED_GIANT_SMBH: 'RED_GIANT_SMBH',
  WHITE_DWARF_IMBH: 'WHITE_DWARF_IMBH',
  DIRECT_CAPTURE_REFERENCE: 'DIRECT_CAPTURE_REFERENCE',
} as const);
export type TidalDisruptionLaboratoryCaseId =
  typeof TidalDisruptionLaboratoryCaseId[keyof typeof TidalDisruptionLaboratoryCaseId];

export interface TidalDisruptionLaboratoryCase {
  readonly id: TidalDisruptionLaboratoryCaseId;
  readonly shortLabel: string;
  readonly title: string;
  readonly description: string;
  readonly profile: TidalDisruptionEventProfile;
  readonly fallbackCurve: NormalizedTidalFallbackCurve | null;
  readonly fallbackPoints: string;
  readonly horizonDisplayRadius: number;
  readonly captureDisplayRadius: number;
  readonly tidalDisplayRadius: number;
  readonly pericenterDisplayRadius: number;
}

function makeCase(
  id: TidalDisruptionLaboratoryCaseId,
  shortLabel: string,
  title: string,
  description: string,
  victimKind: TidalDisruptionVictimKindValue,
  blackHoleMassSolar: number,
  stellarMassSolar: number,
  stellarRadiusSolar: number,
  beta: number,
): TidalDisruptionLaboratoryCase {
  const profile = TidalDisruptionEventEngine.deriveProfile(
    new TidalDisruptionEncounterProfile(
      victimKind,
      blackHoleMassSolar,
      stellarMassSolar,
      stellarRadiusSolar,
      beta,
    ),
  );
  const fallbackCurve = TidalDisruptionEventEngine.normalizedFallbackCurve(profile);

  return Object.freeze({
    id,
    shortLabel,
    title,
    description,
    profile,
    fallbackCurve,
    fallbackPoints: buildFallbackPoints(fallbackCurve),
    horizonDisplayRadius: displayRadius(1),
    captureDisplayRadius: displayRadius(2),
    tidalDisplayRadius: displayRadius(profile.tidalToSchwarzschildRatio),
    pericenterDisplayRadius: displayRadius(
      profile.pericenterMeters / profile.schwarzschildRadiusMeters,
    ),
  });
}

export const TIDAL_DISRUPTION_LABORATORY_CASES = Object.freeze([
  makeCase(
    TidalDisruptionLaboratoryCaseId.SOLAR_SMBH,
    'MS–SMBH',
    'Estrella tipo solar frente a un SMBH',
    'Caso clásico de TDE: la estrella cruza su radio de marea muy por fuera de la referencia de captura Schwarzschild. El fallback mostrado es una referencia de masa retornante, no luminosidad.',
    TidalDisruptionVictimKind.MAIN_SEQUENCE_STAR,
    1e6,
    1,
    1,
    1.2,
  ),
  makeCase(
    TidalDisruptionLaboratoryCaseId.RED_GIANT_SMBH,
    'Gigante–SMBH',
    'Encuentro rasante de una gigante roja',
    'El centro estelar no cruza rₜ (β < 1). Puede existir stripping parcial de la envoltura, pero GENESIS no inventa qué fracción queda ligada ni una curva de fallback normalizada.',
    TidalDisruptionVictimKind.RED_GIANT,
    3e6,
    1.3,
    18,
    0.65,
  ),
  makeCase(
    TidalDisruptionLaboratoryCaseId.WHITE_DWARF_IMBH,
    'WD–IMBH',
    'Enana blanca frente a un IMBH',
    'Una enana blanca compacta puede ser disrumpida fuera de la captura relativista por un IMBH suficientemente ligero. Este canal queda separado de las fusiones NS–BH de 29.3/29.4.',
    TidalDisruptionVictimKind.WHITE_DWARF,
    1e4,
    0.6,
    0.012,
    1.35,
  ),
  makeCase(
    TidalDisruptionLaboratoryCaseId.DIRECT_CAPTURE_REFERENCE,
    'Captura ref.',
    'Límite relativista: captura antes de un TDE externo',
    'Para este SMBH la pericéntrica cae dentro de la referencia de captura parabólica Schwarzschild. Sin spin y orientación Kerr no se convierte esta referencia en una afirmación universal.',
    TidalDisruptionVictimKind.MAIN_SEQUENCE_STAR,
    1e8,
    1,
    1,
    1,
  ),
] as const);

function displayRadius(ratioToSchwarzschild: number): number {
  const minRadius = 18;
  const maxRadius = 118;
  const maxRatio = 300;
  const clampedRatio = Math.max(1, Math.min(maxRatio, ratioToSchwarzschild));
  return minRadius +
    (maxRadius - minRadius) * Math.log10(clampedRatio) / Math.log10(maxRatio);
}

function buildFallbackPoints(curve: NormalizedTidalFallbackCurve | null): string {
  if (curve === null) return '';
  const width = 460;
  const height = 120;
  return curve.samples.map((sample, index) => {
    const x = curve.samples.length <= 1
      ? 0
      : index / (curve.samples.length - 1) * width;
    const y = height - sample.normalizedFallbackRate * (height - 8);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}
