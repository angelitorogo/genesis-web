export const NovaPhase = Object.freeze({
  QUIESCENT: 'QUIESCENT',
  PRECURSOR: 'PRECURSOR',
  ERUPTION: 'ERUPTION',
  RISE: 'RISE',
  PEAK: 'PEAK',
  DECLINE: 'DECLINE',
  NEBULAR: 'NEBULAR',
  RETURN_TO_QUIESCENCE: 'RETURN_TO_QUIESCENCE',
} as const);

export type NovaPhase = typeof NovaPhase[keyof typeof NovaPhase];
