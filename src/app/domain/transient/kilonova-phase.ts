export const KilonovaPhase = Object.freeze({
  PRE_MERGER: 'PRE_MERGER',
  MERGER: 'MERGER',
  BLUE_COMPONENT: 'BLUE_COMPONENT',
  RED_COMPONENT: 'RED_COMPONENT',
  NEBULAR: 'NEBULAR',
  FADE: 'FADE',
} as const);

export type KilonovaPhase = typeof KilonovaPhase[keyof typeof KilonovaPhase];
