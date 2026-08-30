/**
 * Point-21.4 mature-system spin-locking state.
 *
 * SYNCHRONIZED means 1:1 spin-orbit locking in the V1 approximation. EVOLVING
 * means tides materially affect the spin but the synchronization threshold is
 * not yet crossed. UNLOCKED means weak present coupling.
 */
export enum MoonTidalLockingRegime {
  UNLOCKED = 'UNLOCKED',
  EVOLVING = 'EVOLVING',
  SYNCHRONIZED = 'SYNCHRONIZED',
}

export function moonTidalLockingRegimeForIndex01(
  tidalLockingIndex01:
    number,
): MoonTidalLockingRegime {

  assertUnitInterval(
    tidalLockingIndex01,
    'tidalLockingIndex01',
  );

  if (
    tidalLockingIndex01 <
    0.20
  ) {
    return MoonTidalLockingRegime.UNLOCKED;
  }

  if (
    tidalLockingIndex01 <
    0.50
  ) {
    return MoonTidalLockingRegime.EVOLVING;
  }

  return MoonTidalLockingRegime.SYNCHRONIZED;
}

function assertUnitInterval(
  value:
    number,

  label:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0 ||
    value >
      1
  ) {
    throw new RangeError(
      `${label} must be finite in [0, 1].`,
    );
  }
}
