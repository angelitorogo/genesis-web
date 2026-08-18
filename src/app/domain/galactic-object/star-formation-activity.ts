/**
 * Point-12.3 Ground Truth level of ongoing massive-star formation associated
 * with an H II region.
 *
 * These values describe intrinsic physical activity. They are not an
 * observation/classification state and must not be exposed before scientific
 * progression allows it.
 */
export const StarFormationActivity =
  Object.freeze({
    LOW:
      'LOW',

    MODERATE:
      'MODERATE',

    HIGH:
      'HIGH',

    INTENSE:
      'INTENSE',
  } as const);

export type StarFormationActivity =
  typeof StarFormationActivity[
    keyof typeof StarFormationActivity
  ];
