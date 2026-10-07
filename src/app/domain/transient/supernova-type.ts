export const SupernovaType = Object.freeze({
  TYPE_IA: 'TYPE_IA',
  TYPE_II: 'TYPE_II',
  TYPE_IB: 'TYPE_IB',
  TYPE_IC: 'TYPE_IC',
} as const);

export type SupernovaType =
  typeof SupernovaType[
    keyof typeof SupernovaType
  ];

export const SUPERNOVA_TYPES = Object.freeze([
  SupernovaType.TYPE_IA,
  SupernovaType.TYPE_II,
  SupernovaType.TYPE_IB,
  SupernovaType.TYPE_IC,
] as const);
