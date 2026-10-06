import {
  ExtremeType,
  type ExtremeType as ExtremeTypeValue,
} from '../../domain/galactic-object/extreme-object-type';

import {
  GalacticObjectScientificSubject,
} from '../../domain/galactic-object/galactic-object-scientific-subject';

import {
  ExtremeScientificCompletionEngine,
  ExtremeScientificStudyCode,
} from './extreme-scientific-completion-engine';

export const ScientificEpistemicBoundaryKind =
  Object.freeze({
    OBSERVATIONAL_EVIDENCE:
      'OBSERVATIONAL_EVIDENCE',

    VERIFIABLE_MODEL:
      'VERIFIABLE_MODEL',

    EXCLUDED_SPECULATION:
      'EXCLUDED_SPECULATION',
  } as const);

export type ScientificEpistemicBoundaryKind =
  typeof ScientificEpistemicBoundaryKind[
    keyof typeof ScientificEpistemicBoundaryKind
  ];

export interface ScientificEpistemicBoundaryEntry {
  readonly code:
    string;

  readonly label:
    string;

  readonly detail:
    string;
}

export interface ExtremeScientificEpistemicBoundaryModel {
  readonly evidence:
    readonly ScientificEpistemicBoundaryEntry[];

  readonly verifiableModels:
    readonly ScientificEpistemicBoundaryEntry[];

  readonly excludedSpeculation:
    readonly ScientificEpistemicBoundaryEntry[];

  readonly completionPolicy:
    string;
}

function entry(
  code:
    string,

  label:
    string,

  detail:
    string,
): ScientificEpistemicBoundaryEntry {

  return Object.freeze({
    code,
    label,
    detail,
  });
}

/**
 * 28.8 epistemic boundary policy for extreme-object science.
 *
 * This engine does not calculate physics and does not inspect renderer state.
 * It only declares which already-implemented phase-28 outputs are evidence,
 * which are explicit testable/inspectable models, and which inferences GENESIS
 * must refuse to make. The policy is derived from the same applicability map
 * used by 28.7 so completion and disclosure cannot drift apart.
 */
export class ExtremeScientificEpistemicBoundaryEngine {
  private constructor() {}

  static build(
    extremeType:
      ExtremeTypeValue,

    scientificSubject:
      GalacticObjectScientificSubject | null,
  ): ExtremeScientificEpistemicBoundaryModel {

    const studies =
      new Set(
        ExtremeScientificCompletionEngine
          .applicableStudyCodes(
            extremeType,
            scientificSubject,
          ),
      );

    const evidence:
      ScientificEpistemicBoundaryEntry[] = [
        entry(
          'PERSISTED_CAMPAIGN_RESULTS',
          'Resultados observacionales persistidos',
          'Solo una campaña realmente ejecutada puede aportar evidencia. Una no detección es un resultado válido de la campaña, pero no demuestra ausencia física absoluta.',
        ),
      ];

    const verifiableModels:
      ScientificEpistemicBoundaryEntry[] = [];

    const excludedSpeculation:
      ScientificEpistemicBoundaryEntry[] = [
        entry(
          'RENDERER_IS_NOT_EVIDENCE',
          'El renderer no es evidencia',
          'Color, brillo, geometría, animación y parámetros visuales sirven para representar el objeto; nunca desbloquean una conclusión científica ni cuentan para la completitud.',
        ),
        entry(
          'UNKNOWN_STAYS_UNKNOWN',
          'Lo no modelado permanece desconocido',
          'GENESIS no completa magnitudes ausentes mediante valores plausibles, promedios astrofísicos ni inferencias visuales. Si falta una variable canónica, se declara fuera de alcance.',
        ),
      ];

    if (
      studies.has(
        ExtremeScientificStudyCode.ACCRETION_DISK,
      )
    ) {
      evidence.push(
        entry(
          'ACCRETION_DISK_28_1',
          '28.1 · Observación del disco de acreción',
          'La campaña persistida puede caracterizar el disco que el modelo científico permite observar. La apariencia procedural del disco no sustituye fotometría, espectroscopía ni evidencia.',
        ),
      );

      verifiableModels.push(
        entry(
          'ACCRETION_MODEL_28_1',
          'Modelo canónico de acreción',
          'Las magnitudes derivadas reutilizan el modelo físico canónico disponible para el núcleo; no se crea un segundo modelo a partir de la escena 3D.',
        ),
      );
    }

    if (
      studies.has(
        ExtremeScientificStudyCode.EVENT_HORIZON,
      )
    ) {
      verifiableModels.push(
        entry(
          'SCHWARZSCHILD_EXTERIOR_28_2',
          '28.2 · Aproximación exterior verificable',
          'La simulación usa únicamente el dominio exterior y magnitudes relativistas calculables fuera del horizonte. El límite seguro de aproximación es parte del modelo, no una observación del interior.',
        ),
      );

      excludedSpeculation.push(
        entry(
          'NO_EVENT_HORIZON_INTERIOR',
          'Interior del horizonte excluido',
          'No se simulan el cruce del horizonte, la singularidad, trayectorias interiores ni información causalmente inaccesible al observador exterior.',
        ),
      );
    }

    if (
      studies.has(
        ExtremeScientificStudyCode.PULSAR_TIMING,
      )
    ) {
      evidence.push(
        entry(
          'PULSAR_TIMING_28_3',
          '28.3 · Temporización de pulsos',
          'El período y las magnitudes de temporización proceden de la campaña científica persistida. La cadencia o velocidad de animación del renderer permanece desacoplada de la medición.',
        ),
      );

      excludedSpeculation.push(
        entry(
          'NO_RENDERER_TIMING',
          'Cadencia visual excluida',
          'La animación de haces o pulsos no se interpreta como período físico, deriva temporal ni frecuencia observada.',
        ),
      );
    }

    if (
      studies.has(
        ExtremeScientificStudyCode.MAGNETAR_ACTIVITY,
      )
    ) {
      evidence.push(
        entry(
          'MAGNETAR_MONITORING_28_4',
          '28.4 · Monitorización de alta energía',
          'La actividad registrada y los eventos realmente observados forman la evidencia de campaña. La ausencia de una fulguración gigante durante la ventana observada no prueba que nunca pueda producirse.',
        ),
      );

      verifiableModels.push(
        entry(
          'MAGNETAR_DIPOLE_28_4',
          'Estimación dipolar exterior',
          'El campo publicado es una estimación exterior derivada de la temporización canónica; es un modelo contrastable y no una reconstrucción del campo interno de la corteza.',
        ),
      );

      excludedSpeculation.push(
        entry(
          'NO_MAGNETAR_INTERIOR',
          'Campo interno y estallidos no observados excluidos',
          'No se inventan topología magnética interna, tensiones de corteza ni fulguraciones gigantes que la campaña no haya registrado.',
        ),
      );
    }

    if (
      studies.has(
        ExtremeScientificStudyCode.RELATIVISTIC_JETS,
      )
    ) {
      evidence.push(
        entry(
          'RELATIVISTIC_JET_CAMPAIGN_28_5',
          '28.5 · Campaña radiointerferométrica',
          'La detección o no detección persistida pertenece a la observación. Un jet dibujado por el renderer nunca se toma como una detección científica.',
        ),
      );

      verifiableModels.push(
        entry(
          'RELATIVISTIC_KINEMATICS_28_5',
          'Cinemática relativista derivada',
          'Γ, β, factores Doppler y velocidad aparente se interpretan dentro del modelo relativista de la campaña. Una velocidad aparente superior a c no implica transporte físico superlumínico.',
        ),
      );

      excludedSpeculation.push(
        entry(
          'NO_JET_FROM_VISUALS',
          'Morfología visual del jet excluida',
          'La longitud, color o apertura visual del jet no determinan potencia, velocidad, orientación ni presencia física del flujo.',
        ),
      );
    }

    if (
      studies.has(
        ExtremeScientificStudyCode.GRAVITATIONAL_LENSING,
      )
    ) {
      evidence.push(
        entry(
          'LENSING_CAMPAIGN_28_6',
          '28.6 · Resultado astrométrico de lente',
          'La campaña puede registrar una configuración fuerte reconstruible o una no detección. La no detección no se convierte en prueba de ausencia de lente débil.',
        ),
      );

      verifiableModels.push(
        entry(
          'POINT_LENS_28_6',
          'Reconstrucción de lente puntual Schwarzschild',
          'La reconstrucción usa la masa científica canónica y coordenadas normalizadas por θE. El modelo permite comprobar cierres internos sin fingir una escala angular que no está disponible.',
        ),
      );

      excludedSpeculation.push(
        entry(
          'NO_UNMODELLED_LENS_GEOMETRY',
          'Geometría de lente no modelada excluida',
          'Sin distancias canónicas no se publica θE absoluto; tampoco se inventan giro de Kerr, cizalla de la galaxia anfitriona ni morfología extendida de la fuente.',
        ),
      );
    }

    if (
      extremeType === ExtremeType.STELLAR_MASS_BLACK_HOLE ||
      extremeType === ExtremeType.X_RAY_BINARY_BH
    ) {
      excludedSpeculation.push(
        entry(
          'NO_SYNTHETIC_BLACK_HOLE_MASS',
          'Masa compacta no sintetizada',
          'Si el objeto distribuido no dispone todavía de una masa científica canónica, GENESIS no la deduce de su tamaño visual ni habilita cálculos que dependan de ella.',
        ),
      );
    }

    return Object.freeze({
      evidence:
        Object.freeze(evidence),

      verifiableModels:
        Object.freeze(
          verifiableModels.length > 0
            ? verifiableModels
            : [
                entry(
                  'NO_ADDITIONAL_SPECIAL_MODEL',
                  'Sin simulación especial adicional',
                  'Para este tipo no se añade en la Fase 28 un modelo numérico extra que pretenda resolver física todavía no implementada.',
                ),
              ],
        ),

      excludedSpeculation:
        Object.freeze(excludedSpeculation),

      completionPolicy:
        '28.7 solo puede contar evidencia científica canónica persistida y, para 28.2, su marcador explícito de simulación exterior completada. Renderer, valores inferidos no modelados y especulación nunca conceden completitud ni PD.',
    });
  }
}
