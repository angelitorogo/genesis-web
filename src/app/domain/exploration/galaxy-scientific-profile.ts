import {
  type DiscoveryStateValue,
} from '../discovery/discovery-state';

/**
 * Point-26.1 knowledge-safe scientific projection of one known galaxy.
 *
 * This model deliberately separates three disclosure levels:
 *
 * - below CATALOGUED: no exact physical magnitudes;
 * - CATALOGUED: baseline physical magnitudes;
 * - CONFIRMED: structural and nuclear details in addition to the baseline.
 *
 * It is a read model only. It owns no procedural identity, random state or
 * persistence and must never be used as an alternative source of Ground Truth.
 */
export interface GalaxyScientificProfile {
  readonly knowledgeState:
    DiscoveryStateValue;

  readonly physicalProperties:
    GalaxyScientificPhysicalProperties | null;

  readonly structure:
    GalaxyScientificStructure | null;

  readonly nucleus:
    GalaxyScientificNucleus | null;
}

export interface GalaxyScientificPhysicalProperties {
  readonly ageBillionYears:
    number;

  readonly diameterLightYears:
    number;

  readonly totalMassSolarMasses:
    number;

  readonly stellarPopulation:
    bigint;

  readonly metallicitySolarRatio:
    number;

  readonly starFormationRateSolarMassesPerYear:
    number;
}

export interface GalaxyScientificStructure {
  readonly centralConcentration:
    number;

  readonly flattening:
    number;

  readonly asymmetry:
    number;

  readonly barStrength:
    number;

  readonly spiralArmCount:
    number;
}

export type GalaxyScientificNucleusStateName =
  | 'QUIESCENT'
  | 'AGN'
  | 'QUASAR';

export interface GalaxyScientificNucleus {
  readonly present:
    boolean;

  readonly stateName:
    GalaxyScientificNucleusStateName | null;

  readonly supermassiveBlackHoleMassSolarMasses:
    number | null;
}
