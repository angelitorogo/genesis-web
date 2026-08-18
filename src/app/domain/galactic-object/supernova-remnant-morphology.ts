export const SupernovaRemnantMorphology =
  Object.freeze({
    SHELL:
      'SHELL',

    PLERION:
      'PLERION',

    COMPOSITE:
      'COMPOSITE',
  } as const);

export type SupernovaRemnantMorphology =
  typeof SupernovaRemnantMorphology[
    keyof typeof SupernovaRemnantMorphology
  ];
