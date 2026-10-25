/** PRE-33.08 — Ionizing radiation, photons/particles, columns, dose and uncertainty.
 * A reference 1 MeV transmission, bolometric irradiation and a V1 radiation index
 * CANNOT be treated as complete ionizing spectra or dose. */
export const PRE3308_RADIATION_CONTRACT = 'PRE-33.08/V3-SOURCED-SPECTRAL-RADIATION/v1' as const;
export type RadiationBodyPRE3308 = 'PLANET' | 'MOON';
export type RadiationNichePRE3308 = 'SURFACE' | 'SUBSURFACE' | 'ENVELOPE';
export type RadiationChannelPRE3308 = 'PHOTON' | 'PARTICLE';
export type RadiationStatusPRE3308 = 'UNKNOWN_SOURCE' | 'UNKNOWN_TRANSPORT' |
  'NO_SURFACE_REFERENCE' | 'MODELLED_CT0_DOSE' | 'MODELLED_TRANSIENT_EVENT';
export interface RadiationColumnPRE3308 {
  readonly material: 'GAS' | 'H2O_ICE' | 'H2O_LIQUID' | 'ROCK';
  readonly kilogramsPerSquareMeter: number;
  readonly sourceRecordKey: string;
  readonly provenance: 'CT0_CONSTITUTIVE' | 'INDEPENDENT_QUANTIFIED';
}
/** Source bands must be energy-resolved and cover the declared channel, not total luminosity. */
export interface RadiationSpectralBandPRE3308 {
  readonly energyMeV: number;
  readonly energyFluxWattsPerSquareMeter: number;
  readonly sourceRecordKey: string;
}
export interface RadiationChannelSourcePRE3308 {
  readonly state: 'QUANTIFIED_SPECTRUM' | 'INDEPENDENT_ABSENCE' | 'UNKNOWN';
  readonly sourceRecordKey: string | null;
  readonly spectralCoverageComplete: boolean;
  readonly bands: readonly RadiationSpectralBandPRE3308[];
}
export interface RadiationForcingPRE3308 {
  readonly epoch: 'CT0' | 'DATED_EVENT';
  readonly recordKey: string;
  readonly geometryRecordKey: string;
  /** Full TOA flux/fluence with eclipse and host magnetosphere already resolved in source. */
  readonly geometryTransmission01: number | null;
  readonly photons: RadiationChannelSourcePRE3308;
  readonly particles: RadiationChannelSourcePRE3308;
  /** For steady CT0, null. For transient events, source-supplied integration interval. */
  readonly durationSeconds: number | null;
  /** Event is a single dated fluence; NEVER report as Gy/year. */
  readonly transientEventId: string | null;
}
/** Transport response MUST be independently sourced and cover secondary/scattered dose.
 * Units: Gy at target per (J/m² incident at top of shield), for one given
 * channel/energy/geometry/target column; NOT the 32.F.3 uncollided primary transmission. */
export interface RadiationDoseResponsePRE3308 {
  readonly channel: RadiationChannelPRE3308;
  readonly energyMeV: number;
  readonly grayPerJoulePerSquareMeter: number;
  readonly sourceRecordKey: string;
  readonly includesSecondaryAndScattered: true;
}
export interface RadiationTargetPRE3308 {
  readonly niche: RadiationNichePRE3308;
  readonly targetRecordKey: string;
  readonly columnProfile: readonly RadiationColumnPRE3308[];
  readonly columnProfileComplete: boolean;
  readonly responseRecordKey: string | null;
  readonly responses: readonly RadiationDoseResponsePRE3308[];
}
export interface RadiationDosePRE3308 {
  readonly status: RadiationStatusPRE3308;
  readonly niche: RadiationNichePRE3308;
  readonly doseGrayPerYear: number | null;
  readonly eventDoseGray: number | null;
  readonly sourceRecordKeys: readonly string[];
  readonly reason: string;
  readonly lifeOrSafetyCertified: false;
}
export interface RadiationWorldPRE3308 {
  readonly contract: typeof PRE3308_RADIATION_CONTRACT;
  readonly bodyKind: RadiationBodyPRE3308;
  readonly epoch: 'CT0';
  readonly hasSolidSurface: boolean;
  readonly stellarBolometricIsIonizingSource: false;
  readonly photonSource: 'UNRESOLVED' | 'QUANTIFIED' | 'INDEPENDENT_ABSENCE';
  readonly particleSource: 'UNRESOLVED' | 'QUANTIFIED' | 'INDEPENDENT_ABSENCE';
  readonly magneticParticleTransmission01: null;
  readonly atmosphereColumn: RadiationColumnPRE3308 | null;
  readonly oceanIceColumn: RadiationColumnPRE3308 | null;
  readonly gammaOneMeVReferenceDirectTransmission01: number | null;
  readonly surface: RadiationDosePRE3308;
  readonly subsurface: RadiationDosePRE3308;
  readonly envelope: RadiationDosePRE3308;
  readonly observationallyConfirmed: false;
  readonly biologyEvaluated: false;
  readonly scientificLimits: readonly string[];
}
