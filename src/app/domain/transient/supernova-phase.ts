export const SupernovaPhase = Object.freeze({
  PRECURSOR: 'PRECURSOR',
  EXPLOSION: 'EXPLOSION',
  RISE: 'RISE',
  PEAK: 'PEAK',
  PLATEAU: 'PLATEAU',
  DECLINE: 'DECLINE',
  EARLY_REMNANT: 'EARLY_REMNANT',
  COMPLETE: 'COMPLETE',
} as const);

export type SupernovaPhase =
  typeof SupernovaPhase[
    keyof typeof SupernovaPhase
  ];
