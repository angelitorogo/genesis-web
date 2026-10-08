export const NovaType = Object.freeze({
  CLASSICAL: 'CLASSICAL',
  RECURRENT: 'RECURRENT',
} as const);

export type NovaType = typeof NovaType[keyof typeof NovaType];

export const NOVA_TYPES = Object.freeze([
  NovaType.CLASSICAL,
  NovaType.RECURRENT,
] as const);
