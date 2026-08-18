/**
 * Point-12.2 physical Ground Truth subtype of a Nebula.
 *
 * These values are deliberately more specific than the frozen point-9.4
 * coarse exploration family NEBULA. Observation may continue to expose only
 * the coarse family until scientific progression justifies a finer result.
 */
export const NebulaType =
  Object.freeze({
    EMISSION:
      'EMISSION',

    REFLECTION:
      'REFLECTION',

    DARK:
      'DARK',

    PLANETARY:
      'PLANETARY',
  } as const);

export type NebulaType =
  typeof NebulaType[
    keyof typeof NebulaType
  ];
