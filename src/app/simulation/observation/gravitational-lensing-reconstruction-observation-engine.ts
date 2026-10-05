import {
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  ScientificObservationEvidenceRule,
} from '../../domain/discovery/scientific-observation-evidence-rule';

import {
  GalacticObjectLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ObservationActionType,
} from '../../domain/observation/observation-action';

import {
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  GravitationalLensingReconstructionProfileEngine,
  type GravitationalLensingReconstructionProfile,
} from '../galactic-object/gravitational-lensing-reconstruction-profile-engine';

export const GRAVITATIONAL_LENSING_RECONSTRUCTION_INSTRUMENT =
  ObservationInstrumentType.OPTICAL;

export const GRAVITATIONAL_LENSING_RECONSTRUCTION_EVIDENCE_DIMENSION =
  'GRAVITATIONAL_LENSING_28_6';

export const GRAVITATIONAL_LENSING_RECONSTRUCTION_EVIDENCE_CODE =
  'GRAVITATIONAL_LENSING_RECONSTRUCTION';

/**
 * 28.6 high-resolution gravitational-lensing campaign. It persists one
 * observational reconstruction/no-detection result without changing PD or
 * DiscoveryState.
 */
export class GravitationalLensingReconstructionObservationEngine {

  private constructor() {}

  static physicalProfileOrNull(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,

    knowledgeState:
      DiscoveryStateValue,
  ): GravitationalLensingReconstructionProfile | null {

    return GravitationalLensingReconstructionProfileEngine
      .resolveConfirmed(
        generationKey,
        locator,
        knowledgeState,
      );
  }

  static evidenceRule():
    ScientificObservationEvidenceRule {

    return new ScientificObservationEvidenceRule({
      profileCode:
        'CANONICAL_COMPACT_MASS_LENS',
      ruleCode:
        'RECONSTRUCT_GRAVITATIONAL_LENS_28_6',
      observationActionType:
        ObservationActionType.REOBSERVE,
      compatibleInstrumentTypes: [
        GRAVITATIONAL_LENSING_RECONSTRUCTION_INSTRUMENT,
      ],
      minimumInstrumentLevel:
        ObservationInstrumentLevel.LEVEL_5,
      dimensionCode:
        GRAVITATIONAL_LENSING_RECONSTRUCTION_EVIDENCE_DIMENSION,
      evidenceCode:
        GRAVITATIONAL_LENSING_RECONSTRUCTION_EVIDENCE_CODE,
      sourceKey:
        'GRAVITATIONAL_LENSING_OPTICAL',
      independenceKey:
        'GRAVITATIONAL_LENSING_RECONSTRUCTION_CAMPAIGN',
    });
  }

  static measurementFacts(
    profile:
      GravitationalLensingReconstructionProfile,
  ): readonly Readonly<{
    label:
      string;

    value:
      string;
  }>[] {

    const base: Readonly<{
      label:
        string;

      value:
        string;
    }>[] = [
      Object.freeze({
        label:
          'Lente analizada',
        value:
          sourceLabel(
            profile,
          ),
      }),
      Object.freeze({
        label:
          'Modelo de lente',
        value:
          'Masa puntual Schwarzschild · fuente compacta de fondo',
      }),
      Object.freeze({
        label:
          'Masa de la lente (modelo previo)',
        value:
          `${formatSolarMasses(profile.lensMassSolarMasses)} M☉`,
      }),
      Object.freeze({
        label:
          'Resultado de la campaña',
        value:
          profile.reconstructableLensingSignatureDetected
            ? 'Configuración de lente gravitacional reconstruible detectada'
            : 'Sin configuración de lente fuerte reconstruible en esta campaña',
      }),
    ];

    if (
      !profile.reconstructableLensingSignatureDetected
    ) {
      return Object.freeze([
        ...base,
        Object.freeze({
          label:
            'Interpretación',
          value:
            'No detección de una configuración fuerte reconstruible; no implica ausencia de lente gravitacional débil',
        }),
        Object.freeze({
          label:
            'Límite del modelo',
          value:
            'No se publica una escala angular de Einstein sin distancias observador-lente-fuente autoritativas',
        }),
      ]);
    }

    assertCompleteReconstruction(
      profile,
    );

    return Object.freeze([
      ...base,
      Object.freeze({
        label:
          'Radio de Schwarzschild (referencia)',
        value:
          `${formatScientific(profile.schwarzschildRadiusKm)} km`,
      }),
      Object.freeze({
        label:
          'Fuente reconstruida · desplazamiento',
        value:
          `β / θE = ${formatCompact(profile.reconstructedSourceOffsetEinsteinRadii!)}`,
      }),
      Object.freeze({
        label:
          'Imagen primaria · paridad positiva',
        value:
          `θ₊ / θE = ${formatCompact(profile.primaryImagePositionEinsteinRadii!)}`,
      }),
      Object.freeze({
        label:
          'Imagen secundaria · paridad invertida',
        value:
          `θ₋ / θE = ${formatCompact(profile.secondaryImagePositionEinsteinRadii!)}`,
      }),
      Object.freeze({
        label:
          'Separación de imágenes',
        value:
          `${formatCompact(profile.imageSeparationEinsteinRadii!)} θE`,
      }),
      Object.freeze({
        label:
          'Magnificación total reconstruida',
        value:
          `μ = ${formatCompact(profile.totalAbsoluteMagnification!)}×`,
      }),
      Object.freeze({
        label:
          'Contraste primaria / secundaria',
        value:
          `${formatCompact(profile.primaryToSecondaryFluxRatio!)} : 1`,
      }),
      Object.freeze({
        label:
          'Flujo intrínseco reconstruido',
        value:
          `${formatPercent(profile.reconstructedIntrinsicFluxFractionOfObserved!)} del flujo total observado`,
      }),
      Object.freeze({
        label:
          'Desplazamiento astrométrico del centroide',
        value:
          `${formatCompact(profile.centroidShiftEinsteinRadii!)} θE`,
      }),
      Object.freeze({
        label:
          'Retardo temporal diferencial',
        value:
          formatDuration(
            profile.differentialTimeDelaySeconds!,
          ),
      }),
      Object.freeze({
        label:
          'Cierre de reconstrucción de fuente',
        value:
          `|Δβ| / θE = ${formatScientific(profile.sourcePlaneClosureResidualEinsteinRadii!)}`,
      }),
      Object.freeze({
        label:
          'Límite del modelo',
        value:
          'Reconstrucción normalizada por θE; sin escala angular absoluta, giro de Kerr, cizalla de la galaxia anfitriona ni morfología extendida inventadas',
      }),
    ]);
  }
}

function assertCompleteReconstruction(
  profile:
    GravitationalLensingReconstructionProfile,
): void {

  const values = [
    profile.reconstructedSourceOffsetEinsteinRadii,
    profile.primaryImagePositionEinsteinRadii,
    profile.secondaryImagePositionEinsteinRadii,
    profile.imageSeparationEinsteinRadii,
    profile.primaryAbsoluteMagnification,
    profile.secondaryAbsoluteMagnification,
    profile.totalAbsoluteMagnification,
    profile.primaryToSecondaryFluxRatio,
    profile.reconstructedIntrinsicFluxFractionOfObserved,
    profile.centroidShiftEinsteinRadii,
    profile.differentialTimeDelaySeconds,
    profile.sourcePlaneClosureResidualEinsteinRadii,
  ];

  if (
    values.some(
      value =>
        value ===
          null ||
        !Number.isFinite(
          value,
        ),
    )
  ) {
    throw new Error(
      '28.6 detected lensing profile is missing its source reconstruction.',
    );
  }
}

function sourceLabel(
  profile:
    GravitationalLensingReconstructionProfile,
): string {

  switch (
    profile.sourceType
  ) {
    case 'INTERMEDIATE_MASS_BLACK_HOLE':
      return 'Agujero negro de masa intermedia';

    case 'AGN':
      return 'SMBH central de núcleo galáctico activo';

    case 'QUASAR':
      return 'SMBH central de QUASAR';
  }
}

function formatCompact(
  value:
    number,
): string {

  return value.toLocaleString(
    'es-ES',
    {
      maximumFractionDigits:
        6,
    },
  );
}

function formatSolarMasses(
  value:
    number,
): string {

  if (
    value >=
      1_000_000
  ) {
    return value.toExponential(
      4,
    );
  }

  return value.toLocaleString(
    'es-ES',
    {
      maximumFractionDigits:
        2,
    },
  );
}

function formatScientific(
  value:
    number,
): string {

  if (
    value ===
      0
  ) {
    return '0';
  }

  const absolute =
    Math.abs(
      value,
    );

  if (
    absolute >=
      0.001 &&
    absolute <
      1_000_000
  ) {
    return value.toLocaleString(
      'es-ES',
      {
        maximumFractionDigits:
          6,
      },
    );
  }

  return value.toExponential(
    4,
  );
}

function formatPercent(
  fraction:
    number,
): string {

  return (
    fraction *
    100
  ).toLocaleString(
    'es-ES',
    {
      maximumFractionDigits:
        3,
    },
  ) +
    ' %';
}

function formatDuration(
  seconds:
    number,
): string {

  if (
    seconds <
      0.001
  ) {
    return `${(seconds * 1_000_000).toLocaleString('es-ES', { maximumFractionDigits: 3 })} µs`;
  }

  if (
    seconds <
      1
  ) {
    return `${(seconds * 1_000).toLocaleString('es-ES', { maximumFractionDigits: 3 })} ms`;
  }

  if (
    seconds <
      60
  ) {
    return `${seconds.toLocaleString('es-ES', { maximumFractionDigits: 3 })} s`;
  }

  if (
    seconds <
      3_600
  ) {
    return `${(seconds / 60).toLocaleString('es-ES', { maximumFractionDigits: 3 })} min`;
  }

  return `${(seconds / 3_600).toLocaleString('es-ES', { maximumFractionDigits: 3 })} h`;
}
