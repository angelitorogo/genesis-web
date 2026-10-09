export const CompactMergerType = Object.freeze({
  NEUTRON_STAR_NEUTRON_STAR: 'NS_NS',
  NEUTRON_STAR_BLACK_HOLE: 'NS_BH',
  BLACK_HOLE_BLACK_HOLE: 'BH_BH',
} as const);

export type CompactMergerType = typeof CompactMergerType[keyof typeof CompactMergerType];
