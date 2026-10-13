import {
  ExtremeFamily,
  ExtremeSemanticKind,
  ExtremeType,
  extremeTypeDefinition,
} from '../galactic-object/extreme-object-type';

import {
  GalacticObjectLocator,
  SystemLocator,
} from '../generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

/**
 * 31.1 — Compact planetary hosts in GENESIS's present-time snapshot.
 * Physical types are exclusive: a PULSAR is not counted a second time as
 * NEUTRON_STAR. An extreme object and a planetary system may reference the
 * same physical source without becoming two systems.
 *
 * This domain contract does not instantiate systems or simulate origins,
 * past explosions, aging, or any time-dependent environmental evolution.
 */
export const COMPACT_PLANETARY_HOST_TYPES = Object.freeze([
  ExtremeType.NEUTRON_STAR,
  ExtremeType.PULSAR,
  ExtremeType.MILLISECOND_PULSAR,
  ExtremeType.MAGNETAR,
  ExtremeType.STELLAR_MASS_BLACK_HOLE,
] as const);

export type CompactPlanetaryHostType =
  typeof COMPACT_PLANETARY_HOST_TYPES[number];

export type CompactHostEmissionChannel =
  | 'THERMAL'
  | 'ROTATIONAL_HIGH_ENERGY'
  | 'MAGNETIC_ACTIVITY'
  | 'ACCRETION';

export interface CompactPlanetaryHostDefinition {
  readonly type: CompactPlanetaryHostType;
  readonly label: string;
  readonly physicalFamily: typeof ExtremeFamily.NEUTRON_STAR | typeof ExtremeFamily.BLACK_HOLE;
  readonly possibleEmissionChannels: readonly CompactHostEmissionChannel[];
  readonly accretionRequiredForAccretionEmission: boolean;
}

function def(
  type: CompactPlanetaryHostType,
  channels: readonly CompactHostEmissionChannel[],
): CompactPlanetaryHostDefinition {
  const extreme = extremeTypeDefinition(type);
  if (
    extreme.semanticKind !== ExtremeSemanticKind.COMPACT_OBJECT ||
    extreme.galacticNucleusOnly ||
    (extreme.family !== ExtremeFamily.NEUTRON_STAR && extreme.family !== ExtremeFamily.BLACK_HOLE)
  ) {
    throw new Error(`Invalid compact-host taxonomy: ${type}.`);
  }
  return Object.freeze({
    type,
    label: extreme.label,
    physicalFamily: extreme.family,
    possibleEmissionChannels: Object.freeze([...channels]),
    accretionRequiredForAccretionEmission: type === ExtremeType.STELLAR_MASS_BLACK_HOLE,
  });
}

export const COMPACT_PLANETARY_HOST_DEFINITIONS: Readonly<
  Record<CompactPlanetaryHostType, CompactPlanetaryHostDefinition>
> = Object.freeze({
  [ExtremeType.NEUTRON_STAR]: def(ExtremeType.NEUTRON_STAR, ['THERMAL']),
  [ExtremeType.PULSAR]: def(ExtremeType.PULSAR, ['THERMAL', 'ROTATIONAL_HIGH_ENERGY']),
  [ExtremeType.MILLISECOND_PULSAR]: def(ExtremeType.MILLISECOND_PULSAR, ['THERMAL', 'ROTATIONAL_HIGH_ENERGY']),
  [ExtremeType.MAGNETAR]: def(ExtremeType.MAGNETAR, ['THERMAL', 'ROTATIONAL_HIGH_ENERGY', 'MAGNETIC_ACTIVITY']),
  [ExtremeType.STELLAR_MASS_BLACK_HOLE]: def(ExtremeType.STELLAR_MASS_BLACK_HOLE, ['ACCRETION']),
});

export function isCompactPlanetaryHostType(value: unknown): value is CompactPlanetaryHostType {
  return typeof value === 'string' &&
    (COMPACT_PLANETARY_HOST_TYPES as readonly string[]).includes(value);
}

/** Null means physically uncharacterized; never infer luminosity from mass. */
export type CompactHostActivityRegime =
  | 'QUIESCENT'
  | 'PULSED'
  | 'MAGNETICALLY_ACTIVE'
  | 'ACCRETING'
  | 'UNRESOLVED';

export interface CompactHostScientificState {
  /** Present-time state; never derived by evolving a progenitor. */
  readonly activityRegime: CompactHostActivityRegime;
  readonly massSolar: number;
  readonly thermalLuminositySolar: number | null;
  readonly highEnergyLuminositySolar: number | null;
  readonly accretionLuminositySolar: number | null;
  readonly surfaceMagneticFieldTesla: number | null;
  readonly rotationPeriodSeconds: number | null;
}

export interface CompactPlanetaryHostInput {
  readonly generationKey: UniverseGenerationKey;
  readonly systemLocator: SystemLocator;
  readonly type: CompactPlanetaryHostType;
  /** The independent EXTREME_OBJECT catalogue may point at this same source. */
  readonly extremeObjectLocator?: GalacticObjectLocator | null;
  readonly scientificState: CompactHostScientificState;
}

/** Immutable, seed-independent snapshot descriptor for a future system host. */
export class CompactPlanetaryHost {
  readonly generationKey: UniverseGenerationKey;
  readonly systemLocator: SystemLocator;
  readonly extremeObjectLocator: GalacticObjectLocator | null;
  readonly type: CompactPlanetaryHostType;
  readonly scientificState: Readonly<CompactHostScientificState>;

  constructor(input: CompactPlanetaryHostInput) {
    if (!isCompactPlanetaryHostType(input.type)) {
      throw new RangeError('Only the five canonical 31.1 compact types may host planets.');
    }
    if (!(input.systemLocator instanceof SystemLocator)) {
      throw new TypeError('A compact host must have a real SystemLocator.');
    }
    const linked = input.extremeObjectLocator ?? null;
    if (linked !== null && (
      !(linked instanceof GalacticObjectLocator) ||
      linked.galaxyIndex !== input.systemLocator.galaxyIndex
    )) {
      throw new RangeError('A linked extreme object must be in the same galaxy.');
    }
    const s = input.scientificState;
    if (!(['QUIESCENT', 'PULSED', 'MAGNETICALLY_ACTIVE', 'ACCRETING', 'UNRESOLVED'] as const).some(value => value === s.activityRegime)) {
      throw new RangeError('Unsupported snapshot activity regime.');
    }
    if (s.activityRegime === 'ACCRETING' && !(s.accretionLuminositySolar !== null && s.accretionLuminositySolar > 0)) {
      throw new RangeError('An accreting snapshot needs a positive attributed accretion luminosity.');
    }
    if (!Number.isFinite(s.massSolar) || s.massSolar <= 0) {
      throw new RangeError('Compact-host mass must be positive and finite.');
    }
    for (const value of [s.thermalLuminositySolar, s.highEnergyLuminositySolar, s.accretionLuminositySolar, s.surfaceMagneticFieldTesla]) {
      if (value !== null && (!Number.isFinite(value) || value < 0)) {
        throw new RangeError('Compact-host emission and magnetic fields must be non-negative or unknown.');
      }
    }
    if (s.rotationPeriodSeconds !== null && (!Number.isFinite(s.rotationPeriodSeconds) || s.rotationPeriodSeconds <= 0)) {
      throw new RangeError('Known compact-host rotation period must be positive.');
    }
    if (input.type === ExtremeType.STELLAR_MASS_BLACK_HOLE && (
      (s.thermalLuminositySolar ?? 0) > 0 ||
      (s.highEnergyLuminositySolar ?? 0) > 0 ||
      s.surfaceMagneticFieldTesla !== null
    )) {
      throw new RangeError('Black-hole emission must be attributed to accretion; it has no stellar photosphere or surface field.');
    }
    this.generationKey = input.generationKey.copy();
    this.systemLocator = new SystemLocator(input.systemLocator.galaxyIndex, input.systemLocator.sectorKey, input.systemLocator.galacticObjectIndex);
    this.extremeObjectLocator = linked === null ? null : new GalacticObjectLocator(linked.galaxyIndex, linked.sectorKey, linked.galacticObjectIndex);
    this.type = input.type;
    this.scientificState = Object.freeze({ ...s });
    Object.freeze(this);
  }
}
