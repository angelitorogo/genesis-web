import {
  type SystemLocator,
} from '../generation/procedural-locator';

import {
  PlanetaryOrbitalPeriod,
} from './planetary-orbital-period';

import {
  PlanetarySystemOrbitTopology,
} from './planetary-system-orbit-topology';

const CONSISTENCY_TOLERANCE =
  1e-12;

/**
 * Point-18.4 ordered period set for the mature planetary architecture.
 *
 * A non-empty layout carries one common gravitating host mass because every V1
 * mature planet belongs to the same circumstellar or P-type circumbinary
 * topology. Empty systems deliberately carry a null mass: no orbital period is
 * being asserted for a planet that does not exist.
 */
export class PlanetarySystemOrbitalPeriodLayout {

  readonly periods:
    readonly PlanetaryOrbitalPeriod[];

  constructor(
    readonly systemLocator:
      SystemLocator,

    readonly orbitTopology:
      PlanetarySystemOrbitTopology,

    readonly gravitatingMassSolar:
      number | null,

    periods:
      readonly PlanetaryOrbitalPeriod[],
  ) {
    if (
      !Object.values(
        PlanetarySystemOrbitTopology,
      ).includes(
        orbitTopology,
      )
    ) {
      throw new RangeError(
        'orbitTopology must be a known PlanetarySystemOrbitTopology.',
      );
    }

    validateMass(
      gravitatingMassSolar,
      periods.length,
    );

    validatePeriods(
      systemLocator,
      gravitatingMassSolar,
      periods,
    );

    this.periods =
      Object.freeze([
        ...periods,
      ]);
  }

  get planetCount():
    number {

    return this
      .periods
      .length;
  }

  get hasPeriods():
    boolean {

    return (
      this.planetCount >
      0
    );
  }

  get innerPeriodDays():
    number | null {

    return this.periods[0]
      ?.periodDays ??
      null;
  }

  get outerPeriodDays():
    number | null {

    return this
      .periods[
        this.periods.length -
          1
      ]
      ?.periodDays ??
      null;
  }
}

function validateMass(
  massSolar:
    number | null,

  periodCount:
    number,
): void {

  if (
    periodCount ===
    0
  ) {
    if (
      massSolar !==
      null
    ) {
      throw new RangeError(
        'Empty point-18.4 period layouts must not assert a gravitating host mass.',
      );
    }

    return;
  }

  if (
    massSolar ===
      null ||
    !Number.isFinite(
      massSolar,
    ) ||
    massSolar <=
      0
  ) {
    throw new RangeError(
      'Non-empty point-18.4 period layouts require a positive finite gravitating host mass.',
    );
  }
}

function validatePeriods(
  systemLocator:
    SystemLocator,

  gravitatingMassSolar:
    number | null,

  periods:
    readonly PlanetaryOrbitalPeriod[],
): void {

  let previousPeriodDays =
    -Infinity;

  for (
    let index = 0;
    index <
      periods.length;
    index += 1
  ) {
    const period =
      periods[index];

    if (
      period.planetOrdinal !==
      index +
        1
    ) {
      throw new RangeError(
        'Planetary orbital periods must be contiguous and ordered by planetOrdinal.',
      );
    }

    if (
      !sameSystemLocator(
        systemLocator,
        period.bodyLocator,
      )
    ) {
      throw new RangeError(
        'Every point-18.4 orbital period must belong to the period-layout SystemLocator.',
      );
    }

    if (
      gravitatingMassSolar !==
        null &&
      !approximatelyEqual(
        period.gravitatingMassSolar,
        gravitatingMassSolar,
      )
    ) {
      throw new RangeError(
        'Every point-18.4 period must use the common layout gravitating host mass.',
      );
    }

    if (
      period.periodDays <=
      previousPeriodDays
    ) {
      throw new RangeError(
        'Point-18.4 orbital periods must strictly increase with the ordered semi-major axes.',
      );
    }

    previousPeriodDays =
      period.periodDays;
  }
}

function sameSystemLocator(
  systemLocator:
    SystemLocator,

  bodyLocator:
    PlanetaryOrbitalPeriod['bodyLocator'],
): boolean {

  return (
    systemLocator.galaxyIndex ===
      bodyLocator.galaxyIndex &&
    systemLocator.sectorKey ===
      bodyLocator.sectorKey &&
    systemLocator.galacticObjectIndex ===
      bodyLocator.galacticObjectIndex
  );
}

function approximatelyEqual(
  first:
    number,

  second:
    number,
): boolean {

  return (
    Math.abs(
      first -
      second,
    ) <=
    CONSISTENCY_TOLERANCE *
      Math.max(
        1,
        Math.abs(
          first,
        ),
        Math.abs(
          second,
        ),
      )
  );
}
