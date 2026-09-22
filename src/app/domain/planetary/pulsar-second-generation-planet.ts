/**
 * 27.9 V2: a DISTINCT post-collapse body, never an ancestral phase-18 Planet.
 * These identities live in a separate namespace, not in the frozen
 * BodyLocator / BodySeed ordinal sequence. The formation channel is a
 * deliberately speculative GENESIS model, not observed fallback evidence.
 */
export interface PulsarSecondGenerationPlanet {
  readonly identityHex: string;
  readonly ordinal: number;
  readonly origin: 'MODELLED_SUPERNOVA_FALLBACK';
  readonly hostSystemSeedHex: string;
  readonly parentPulsarHostSeedHex: string;
  readonly massEarth: number;
  readonly radiusEarth: number;
  readonly semiMajorAxisAu: number;
  readonly eccentricity: number;
  readonly periastronAu: number;
  readonly apoastronAu: number;
  readonly orbitalPeriodDays: number;
  readonly formedAtAgeBillionYears: number;
  readonly diskMassEarth: number;
  readonly edgeOnTimingSemiAmplitudeSeconds: number;
  readonly isotropicEquivalentSpinDownFluxWm2: number;
}

export interface PulsarSecondGenerationPopulation {
  /** Independent additive model version, never an existing BodyLocator/GeneratorVersion rewrite. */
  readonly modelVersion: 'PULSAR_SECOND_GENERATION_V1';
  readonly origin: 'MODELLED_SUPERNOVA_FALLBACK';
  readonly hostSystemSeedHex: string;
  readonly parentPulsarHostSeedHex: string;
  readonly diskMassEarth: number;
  readonly diskFormationAgeBillionYears: number;
  readonly planetFormationAgeBillionYears: number;
  readonly planets: readonly PulsarSecondGenerationPlanet[];
  /** This is simulated intrinsic Ground Truth, NOT observed scientific evidence. */
  readonly scientificStatus: 'SPECULATIVE_FORMATION_MODEL';
}
