import { StellarActivityProfile } from '../../../../domain/stellar/stellar-activity-profile';
import { StellarActivityRegime } from '../../../../domain/stellar/stellar-activity-regime';
import {
  GreatStellarFlareEventState,
  GreatStellarFlareSourceKind,
  GreatStellarFlareSourceProfile,
} from '../../../../domain/transient/great-stellar-flare-source-profile';
import { GreatStellarFlareEventEngine } from '../../../../simulation/transient/great-stellar-flare-event-engine';

export const GreatStellarFlareLaboratoryCaseId = Object.freeze({
  M_DWARF_SUPERFLARE: 'M_DWARF_SUPERFLARE',
  SOLAR_TYPE_LARGE_FLARE: 'SOLAR_TYPE_LARGE_FLARE',
  YOUNG_K_SUPERFLARE: 'YOUNG_K_SUPERFLARE',
  STATISTICAL_ACTIVITY_ONLY: 'STATISTICAL_ACTIVITY_ONLY',
  COMPACT_REMNANT_BOUNDARY: 'COMPACT_REMNANT_BOUNDARY',
} as const);

export type GreatStellarFlareLaboratoryCaseId =
  typeof GreatStellarFlareLaboratoryCaseId[keyof typeof GreatStellarFlareLaboratoryCaseId];

export interface GreatStellarFlareLaboratoryCase {
  readonly id: GreatStellarFlareLaboratoryCaseId;
  readonly buttonLabel: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly spectralHint: string;
  readonly profile: ReturnType<typeof GreatStellarFlareEventEngine.characterize>;
}

function maximumEnergy(typical: number, activityIndex: number): number {
  return typical * (20 + 180 * activityIndex);
}

function explicitCase(
  sourceLabel: string,
  spectralHint: string,
  radiusSolar: number,
  luminositySolar: number,
  activityIndex: number,
  regime: StellarActivityRegime,
  ratePerDay: number,
  typicalEnergyJoules: number,
  eventEnergyJoules: number,
  durationSeconds: number,
) {
  const activity = new StellarActivityProfile(
    true,
    activityIndex,
    regime,
    ratePerDay,
    typicalEnergyJoules,
    maximumEnergy(typicalEnergyJoules, activityIndex),
  );

  return GreatStellarFlareEventEngine.characterize(new GreatStellarFlareSourceProfile(
    GreatStellarFlareSourceKind.ORDINARY_STAR,
    sourceLabel,
    radiusSolar,
    luminositySolar,
    activity,
    GreatStellarFlareEventState.EXPLICIT_LARGE_FLARE,
    eventEnergyJoules,
    durationSeconds,
  ));
}

export const GREAT_STELLAR_FLARE_LABORATORY_CASES: readonly GreatStellarFlareLaboratoryCase[] =
  Object.freeze([
    Object.freeze({
      id: GreatStellarFlareLaboratoryCaseId.M_DWARF_SUPERFLARE,
      buttonLabel: 'Enana M',
      eyebrow: 'ENANA M · SUPERFLARE',
      title: 'Superflare explícita de una enana M activa',
      description:
        'La alta actividad de 15.4 aporta el contexto estadístico, pero la superflare de 10²⁷ J se declara como evento explícito. La tasa media no se convierte en una hora futura de ocurrencia.',
      spectralHint: 'M · actividad extrema',
      profile: explicitCase(
        'Enana M activa',
        'M',
        0.30,
        0.020,
        0.86,
        StellarActivityRegime.EXTREME,
        1.4,
        2e25,
        1e27,
        3600,
      ),
    }),
    Object.freeze({
      id: GreatStellarFlareLaboratoryCaseId.SOLAR_TYPE_LARGE_FLARE,
      buttonLabel: 'Tipo solar',
      eyebrow: 'TIPO SOLAR · GRAN LLAMARADA',
      title: 'Gran llamarada bolométrica de una estrella tipo solar',
      description:
        'El evento está dentro del máximo estadístico de 15.4. GENESIS puede derivar potencia media y duración equivalente, pero no una curva de luz pico, CME ni fluencia en un planeta.',
      spectralHint: 'G · actividad moderada',
      profile: explicitCase(
        'Análogo solar joven',
        'G',
        1.0,
        1.0,
        0.46,
        StellarActivityRegime.MODERATE,
        0.08,
        1e24,
        4e25,
        1800,
      ),
    }),
    Object.freeze({
      id: GreatStellarFlareLaboratoryCaseId.YOUNG_K_SUPERFLARE,
      buttonLabel: 'K joven',
      eyebrow: 'ENANA K · SUPERFLARE',
      title: 'Superflare de una enana K joven',
      description:
        'Caso intermedio entre el análogo solar y la enana M: el evento es mucho más energético que la llamarada típica, pero sigue dentro del máximo determinista del perfil de actividad.',
      spectralHint: 'K · actividad alta',
      profile: explicitCase(
        'Enana K joven',
        'K',
        0.75,
        0.32,
        0.66,
        StellarActivityRegime.HIGH,
        0.45,
        4e24,
        2.5e26,
        2400,
      ),
    }),
    Object.freeze({
      id: GreatStellarFlareLaboratoryCaseId.STATISTICAL_ACTIVITY_ONLY,
      buttonLabel: 'Solo estadística',
      eyebrow: 'ACTIVIDAD 15.4 · SIN EVENTO',
      title: 'Una estrella activa no implica una llamarada ahora',
      description:
        'El perfil de 15.4 contiene tasa media y energías típica/máxima, pero no agenda eventos. 29.9 mantiene energía, duración y cronología de la siguiente llamarada sin resolver.',
      spectralHint: 'M · actividad extrema',
      profile: GreatStellarFlareEventEngine.characterize(new GreatStellarFlareSourceProfile(
        GreatStellarFlareSourceKind.ORDINARY_STAR,
        'Enana M con actividad estadística',
        0.35,
        0.025,
        new StellarActivityProfile(
          true,
          0.78,
          StellarActivityRegime.EXTREME,
          1.2,
          1.5e25,
          maximumEnergy(1.5e25, 0.78),
        ),
        GreatStellarFlareEventState.STATISTICAL_ACTIVITY_ONLY,
        null,
        null,
      )),
    }),
    Object.freeze({
      id: GreatStellarFlareLaboratoryCaseId.COMPACT_REMNANT_BOUNDARY,
      buttonLabel: 'Remanente compacto',
      eyebrow: 'REMANENTE COMPACTO · LÍMITE',
      title: 'Los bursts de magnetar no son llamaradas estelares ordinarias',
      description:
        '15.4 marca explícitamente los remanentes compactos como no aplicables para el modelo fotosférico de flares. 29.9 conserva esa frontera y no reinterpreta 27.6 o 29.8.',
      spectralHint: 'NS / magnetar · no aplica',
      profile: GreatStellarFlareEventEngine.characterize(new GreatStellarFlareSourceProfile(
        GreatStellarFlareSourceKind.COMPACT_REMNANT_BOUNDARY,
        'Magnetar / estrella de neutrones',
        null,
        null,
        new StellarActivityProfile(false, null, null, null, null, null),
        GreatStellarFlareEventState.ORDINARY_FLARE_MODEL_NOT_APPLICABLE,
        null,
        null,
      )),
    }),
  ]);
