export const TransNeptunianObjectDynamicalRegime = Object.freeze({
  COLD_CLASSICAL:'COLD_CLASSICAL', HOT_CLASSICAL:'HOT_CLASSICAL', RESONANT:'RESONANT', SCATTERED:'SCATTERED', DETACHED:'DETACHED',
} as const);
export type TransNeptunianObjectDynamicalRegime = typeof TransNeptunianObjectDynamicalRegime[keyof typeof TransNeptunianObjectDynamicalRegime];
