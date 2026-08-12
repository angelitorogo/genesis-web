/**
 * Semantic reasons for differentiated Discovery Point bonuses.
 *
 * These reasons do not assert Ground Truth by themselves. Callers must supply
 * them only when future observed knowledge supports the corresponding fact.
 */
export enum DiscoveryRewardReason {
  SYSTEM_DISCOVERY =
    'SYSTEM_DISCOVERY',

  PLANET_DISCOVERY =
    'PLANET_DISCOVERY',

  BIOSPHERE_CONFIRMATION =
    'BIOSPHERE_CONFIRMATION',

  RARE_OBJECT_CATALOGUING =
    'RARE_OBJECT_CATALOGUING',

  EXTREME_EVENT_CONFIRMATION =
    'EXTREME_EVENT_CONFIRMATION',
}
