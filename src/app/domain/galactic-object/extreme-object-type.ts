/**
 * 28.2F.1 — canonical taxonomy for persistent extreme-object specializations.
 *
 * This is deliberately a classification/metadata contract only. It does NOT:
 * - assign one of these types to a generated object;
 * - change generation probabilities or seeds;
 * - imply that an optional capability is physically present in one instance;
 * - expose hidden Ground Truth through discovery state.
 *
 * Some entries are physical objects (for example a neutron star), while others
 * are physical/observational regimes built on top of an underlying compact
 * object (AGN, QUASAR, ULX). `semanticKind` preserves that distinction so
 * callers do not accidentally treat the catalogue as fifteen mutually
 * exclusive spherical bodies.
 */
export const ExtremeType =
  Object.freeze({
    SMBH:
      'SMBH',

    AGN:
      'AGN',

    QUASAR:
      'QUASAR',

    NEUTRON_STAR:
      'NEUTRON_STAR',

    PULSAR:
      'PULSAR',

    MILLISECOND_PULSAR:
      'MILLISECOND_PULSAR',

    MAGNETAR:
      'MAGNETAR',

    STELLAR_MASS_BLACK_HOLE:
      'STELLAR_MASS_BLACK_HOLE',

    INTERMEDIATE_MASS_BLACK_HOLE:
      'INTERMEDIATE_MASS_BLACK_HOLE',

    SUPERNOVA_REMNANT:
      'SUPERNOVA_REMNANT',

    PULSAR_WIND_NEBULA:
      'PULSAR_WIND_NEBULA',

    X_RAY_BINARY_NS:
      'X_RAY_BINARY_NS',

    X_RAY_BINARY_BH:
      'X_RAY_BINARY_BH',

    MICROQUASAR:
      'MICROQUASAR',

    ULX:
      'ULX',
  } as const);

export type ExtremeType =
  typeof ExtremeType[
    keyof typeof ExtremeType
  ];

export const ExtremeFamily =
  Object.freeze({
    GALACTIC_NUCLEUS:
      'GALACTIC_NUCLEUS',

    NEUTRON_STAR:
      'NEUTRON_STAR',

    BLACK_HOLE:
      'BLACK_HOLE',

    SUPERNOVA_REMNANT:
      'SUPERNOVA_REMNANT',

    COMPACT_BINARY:
      'COMPACT_BINARY',

    HIGH_ENERGY_SOURCE:
      'HIGH_ENERGY_SOURCE',
  } as const);

export type ExtremeFamily =
  typeof ExtremeFamily[
    keyof typeof ExtremeFamily
  ];

export const ExtremeSemanticKind =
  Object.freeze({
    COMPACT_OBJECT:
      'COMPACT_OBJECT',

    ACTIVITY_REGIME:
      'ACTIVITY_REGIME',

    REMNANT_STRUCTURE:
      'REMNANT_STRUCTURE',

    BINARY_SYSTEM:
      'BINARY_SYSTEM',

    OBSERVATIONAL_SOURCE:
      'OBSERVATIONAL_SOURCE',
  } as const);

export type ExtremeSemanticKind =
  typeof ExtremeSemanticKind[
    keyof typeof ExtremeSemanticKind
  ];

export interface ExtremeTypeCapabilities {
  /** The model may represent accretion; it does not mean a disk is present. */
  readonly accretion:
    boolean;

  /** The model may represent relativistic jets; it does not mean jets exist. */
  readonly relativisticJets:
    boolean;

  /** A future pulse-timing action may be physically meaningful. */
  readonly pulseTiming:
    boolean;

  /** A future magnetar-style magnetic-activity action may be meaningful. */
  readonly magneticActivity:
    boolean;
}

export interface ExtremeTypeDefinition {
  readonly type:
    ExtremeType;

  readonly family:
    ExtremeFamily;

  readonly semanticKind:
    ExtremeSemanticKind;

  readonly label:
    string;

  readonly shortLabel:
    string;

  /**
   * True only for classifications belonging to the galaxy-level nuclear
   * source rather than the distributed EXTREME_OBJECT population.
   */
  readonly galacticNucleusOnly:
    boolean;

  readonly capabilities:
    ExtremeTypeCapabilities;
}

function definition(
  value:
    ExtremeTypeDefinition,
): ExtremeTypeDefinition {

  return Object.freeze({
    ...value,
    capabilities:
      Object.freeze({
        ...value.capabilities,
      }),
  });
}

const DEFINITIONS =
  Object.freeze({
    [ExtremeType.SMBH]:
      definition({
        type: ExtremeType.SMBH,
        family: ExtremeFamily.GALACTIC_NUCLEUS,
        semanticKind: ExtremeSemanticKind.COMPACT_OBJECT,
        label: 'Agujero negro supermasivo',
        shortLabel: 'SMBH',
        galacticNucleusOnly: true,
        capabilities: {
          accretion: true,
          relativisticJets: true,
          pulseTiming: false,
          magneticActivity: false,
        },
      }),

    [ExtremeType.AGN]:
      definition({
        type: ExtremeType.AGN,
        family: ExtremeFamily.GALACTIC_NUCLEUS,
        semanticKind: ExtremeSemanticKind.ACTIVITY_REGIME,
        label: 'Núcleo galáctico activo',
        shortLabel: 'AGN',
        galacticNucleusOnly: true,
        capabilities: {
          accretion: true,
          relativisticJets: true,
          pulseTiming: false,
          magneticActivity: false,
        },
      }),

    [ExtremeType.QUASAR]:
      definition({
        type: ExtremeType.QUASAR,
        family: ExtremeFamily.GALACTIC_NUCLEUS,
        semanticKind: ExtremeSemanticKind.ACTIVITY_REGIME,
        label: 'Quásar',
        shortLabel: 'QUASAR',
        galacticNucleusOnly: true,
        capabilities: {
          accretion: true,
          relativisticJets: true,
          pulseTiming: false,
          magneticActivity: false,
        },
      }),

    [ExtremeType.NEUTRON_STAR]:
      definition({
        type: ExtremeType.NEUTRON_STAR,
        family: ExtremeFamily.NEUTRON_STAR,
        semanticKind: ExtremeSemanticKind.COMPACT_OBJECT,
        label: 'Estrella de neutrones',
        shortLabel: 'NS',
        galacticNucleusOnly: false,
        capabilities: {
          accretion: false,
          relativisticJets: false,
          pulseTiming: false,
          magneticActivity: false,
        },
      }),

    [ExtremeType.PULSAR]:
      definition({
        type: ExtremeType.PULSAR,
        family: ExtremeFamily.NEUTRON_STAR,
        semanticKind: ExtremeSemanticKind.COMPACT_OBJECT,
        label: 'Púlsar',
        shortLabel: 'PULSAR',
        galacticNucleusOnly: false,
        capabilities: {
          accretion: false,
          relativisticJets: false,
          pulseTiming: true,
          magneticActivity: false,
        },
      }),

    [ExtremeType.MILLISECOND_PULSAR]:
      definition({
        type: ExtremeType.MILLISECOND_PULSAR,
        family: ExtremeFamily.NEUTRON_STAR,
        semanticKind: ExtremeSemanticKind.COMPACT_OBJECT,
        label: 'Púlsar de milisegundos',
        shortLabel: 'MSP',
        galacticNucleusOnly: false,
        capabilities: {
          accretion: false,
          relativisticJets: false,
          pulseTiming: true,
          magneticActivity: false,
        },
      }),

    [ExtremeType.MAGNETAR]:
      definition({
        type: ExtremeType.MAGNETAR,
        family: ExtremeFamily.NEUTRON_STAR,
        semanticKind: ExtremeSemanticKind.COMPACT_OBJECT,
        label: 'Magnetar',
        shortLabel: 'MAGNETAR',
        galacticNucleusOnly: false,
        capabilities: {
          accretion: false,
          relativisticJets: false,
          pulseTiming: true,
          magneticActivity: true,
        },
      }),

    [ExtremeType.STELLAR_MASS_BLACK_HOLE]:
      definition({
        type: ExtremeType.STELLAR_MASS_BLACK_HOLE,
        family: ExtremeFamily.BLACK_HOLE,
        semanticKind: ExtremeSemanticKind.COMPACT_OBJECT,
        label: 'Agujero negro de masa estelar',
        shortLabel: 'BH ESTELAR',
        galacticNucleusOnly: false,
        capabilities: {
          accretion: true,
          relativisticJets: true,
          pulseTiming: false,
          magneticActivity: false,
        },
      }),

    [ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE]:
      definition({
        type: ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE,
        family: ExtremeFamily.BLACK_HOLE,
        semanticKind: ExtremeSemanticKind.COMPACT_OBJECT,
        label: 'Agujero negro de masa intermedia',
        shortLabel: 'IMBH',
        galacticNucleusOnly: false,
        capabilities: {
          accretion: true,
          relativisticJets: true,
          pulseTiming: false,
          magneticActivity: false,
        },
      }),

    [ExtremeType.SUPERNOVA_REMNANT]:
      definition({
        type: ExtremeType.SUPERNOVA_REMNANT,
        family: ExtremeFamily.SUPERNOVA_REMNANT,
        semanticKind: ExtremeSemanticKind.REMNANT_STRUCTURE,
        label: 'Remanente de supernova',
        shortLabel: 'SNR',
        galacticNucleusOnly: false,
        capabilities: {
          accretion: false,
          relativisticJets: false,
          pulseTiming: false,
          magneticActivity: false,
        },
      }),

    [ExtremeType.PULSAR_WIND_NEBULA]:
      definition({
        type: ExtremeType.PULSAR_WIND_NEBULA,
        family: ExtremeFamily.SUPERNOVA_REMNANT,
        semanticKind: ExtremeSemanticKind.REMNANT_STRUCTURE,
        label: 'Nebulosa de viento de púlsar',
        shortLabel: 'PWN',
        galacticNucleusOnly: false,
        capabilities: {
          accretion: false,
          relativisticJets: false,
          pulseTiming: false,
          magneticActivity: false,
        },
      }),

    [ExtremeType.X_RAY_BINARY_NS]:
      definition({
        type: ExtremeType.X_RAY_BINARY_NS,
        family: ExtremeFamily.COMPACT_BINARY,
        semanticKind: ExtremeSemanticKind.BINARY_SYSTEM,
        label: 'Binaria de rayos X con estrella de neutrones',
        shortLabel: 'XRB · NS',
        galacticNucleusOnly: false,
        capabilities: {
          accretion: true,
          relativisticJets: false,
          pulseTiming: true,
          magneticActivity: false,
        },
      }),

    [ExtremeType.X_RAY_BINARY_BH]:
      definition({
        type: ExtremeType.X_RAY_BINARY_BH,
        family: ExtremeFamily.COMPACT_BINARY,
        semanticKind: ExtremeSemanticKind.BINARY_SYSTEM,
        label: 'Binaria de rayos X con agujero negro',
        shortLabel: 'XRB · BH',
        galacticNucleusOnly: false,
        capabilities: {
          accretion: true,
          relativisticJets: false,
          pulseTiming: false,
          magneticActivity: false,
        },
      }),

    [ExtremeType.MICROQUASAR]:
      definition({
        type: ExtremeType.MICROQUASAR,
        family: ExtremeFamily.COMPACT_BINARY,
        semanticKind: ExtremeSemanticKind.BINARY_SYSTEM,
        label: 'Microquásar',
        shortLabel: 'MICROQUASAR',
        galacticNucleusOnly: false,
        capabilities: {
          accretion: true,
          relativisticJets: true,
          pulseTiming: false,
          magneticActivity: false,
        },
      }),

    [ExtremeType.ULX]:
      definition({
        type: ExtremeType.ULX,
        family: ExtremeFamily.HIGH_ENERGY_SOURCE,
        semanticKind: ExtremeSemanticKind.OBSERVATIONAL_SOURCE,
        label: 'Fuente ultraluminosa de rayos X',
        shortLabel: 'ULX',
        galacticNucleusOnly: false,
        capabilities: {
          accretion: true,
          relativisticJets: false,
          pulseTiming: false,
          magneticActivity: false,
        },
      }),
  } satisfies Record<ExtremeType, ExtremeTypeDefinition>);

/** Stable presentation order. Do not derive ordering from object-key iteration. */
export const EXTREME_TYPE_ORDER:
  readonly ExtremeType[] =
  Object.freeze([
    ExtremeType.SMBH,
    ExtremeType.AGN,
    ExtremeType.QUASAR,
    ExtremeType.NEUTRON_STAR,
    ExtremeType.PULSAR,
    ExtremeType.MILLISECOND_PULSAR,
    ExtremeType.MAGNETAR,
    ExtremeType.STELLAR_MASS_BLACK_HOLE,
    ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE,
    ExtremeType.SUPERNOVA_REMNANT,
    ExtremeType.PULSAR_WIND_NEBULA,
    ExtremeType.X_RAY_BINARY_NS,
    ExtremeType.X_RAY_BINARY_BH,
    ExtremeType.MICROQUASAR,
    ExtremeType.ULX,
  ]);

export const EXTREME_TYPE_DEFINITIONS:
  Readonly<Record<ExtremeType, ExtremeTypeDefinition>> =
  DEFINITIONS;

export const EXTREME_TYPE_CATALOGUE:
  readonly ExtremeTypeDefinition[] =
  Object.freeze(
    EXTREME_TYPE_ORDER
      .map(
        type =>
          EXTREME_TYPE_DEFINITIONS[
            type
          ],
      ),
  );

export function extremeTypeDefinition(
  type:
    ExtremeType,
): ExtremeTypeDefinition {

  return EXTREME_TYPE_DEFINITIONS[
    type
  ];
}

export function isGalacticNucleusExtremeType(
  type:
    ExtremeType,
): boolean {

  return extremeTypeDefinition(
    type,
  ).galacticNucleusOnly;
}

export function isNeutronStarExtremeType(
  type:
    ExtremeType,
): boolean {

  return extremeTypeDefinition(
    type,
  ).family ===
    ExtremeFamily.NEUTRON_STAR;
}

export function isBlackHoleExtremeType(
  type:
    ExtremeType,
): boolean {

  return extremeTypeDefinition(
    type,
  ).family ===
    ExtremeFamily.BLACK_HOLE ||
    type ===
      ExtremeType.SMBH;
}

export function isCompactBinaryExtremeType(
  type:
    ExtremeType,
): boolean {

  return extremeTypeDefinition(
    type,
  ).family ===
    ExtremeFamily.COMPACT_BINARY;
}

export function supportsPulseObservation(
  type:
    ExtremeType,
): boolean {

  return extremeTypeDefinition(
    type,
  ).capabilities.pulseTiming;
}

export function supportsMagneticObservation(
  type:
    ExtremeType,
): boolean {

  return extremeTypeDefinition(
    type,
  ).capabilities.magneticActivity;
}

export function supportsAccretionObservation(
  type:
    ExtremeType,
): boolean {

  return extremeTypeDefinition(
    type,
  ).capabilities.accretion;
}

export function supportsJetObservation(
  type:
    ExtremeType,
): boolean {

  return extremeTypeDefinition(
    type,
  ).capabilities.relativisticJets;
}
