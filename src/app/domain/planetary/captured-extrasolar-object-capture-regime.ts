export const CapturedExtrasolarObjectCaptureRegime = Object.freeze({
  PLANETARY_SCATTERING: 'PLANETARY_SCATTERING',
  BINARY_EXCHANGE: 'BINARY_EXCHANGE',
  COMBINED_MULTIBODY: 'COMBINED_MULTIBODY',
} as const);

export type CapturedExtrasolarObjectCaptureRegime =
  (typeof CapturedExtrasolarObjectCaptureRegime)[keyof typeof CapturedExtrasolarObjectCaptureRegime];
