export const CapturedExtrasolarObjectCompositionRegime = Object.freeze({
  ROCK_DOMINATED: 'ROCK_DOMINATED',
  MIXED: 'MIXED',
  VOLATILE_RICH: 'VOLATILE_RICH',
} as const);

export type CapturedExtrasolarObjectCompositionRegime =
  (typeof CapturedExtrasolarObjectCompositionRegime)[keyof typeof CapturedExtrasolarObjectCompositionRegime];
