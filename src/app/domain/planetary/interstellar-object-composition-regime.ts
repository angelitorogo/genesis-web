export const InterstellarObjectCompositionRegime = Object.freeze({
  ROCK_DOMINATED: 'ROCK_DOMINATED',
  MIXED: 'MIXED',
  VOLATILE_RICH: 'VOLATILE_RICH',
} as const);
export type InterstellarObjectCompositionRegime = typeof InterstellarObjectCompositionRegime[keyof typeof InterstellarObjectCompositionRegime];
