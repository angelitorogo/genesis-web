export const KilonovaType = Object.freeze({
  BINARY_NEUTRON_STAR: 'BINARY_NEUTRON_STAR',
  NEUTRON_STAR_BLACK_HOLE: 'NEUTRON_STAR_BLACK_HOLE',
} as const);

export type KilonovaType = typeof KilonovaType[keyof typeof KilonovaType];
