export interface SystemSimulationClockState {
  readonly simulationDay:
    number;

  readonly playbackDaysPerRealSecond:
    number;
}

const DEFAULT_PLAYBACK_DAYS_PER_SECOND =
  1;

const TARGET_SHORTEST_ORBIT_REAL_SECONDS =
  18;

const MIN_PLAYBACK_DAYS_PER_SECOND =
  0.05;

const MAX_PLAYBACK_DAYS_PER_SECOND =
  3_650;

/**
 * Point-24.3 scene-local simulation timeline.
 *
 * This is intentionally not an integration accumulator. It anchors one real
 * timestamp and evaluates absolute simulation time from that anchor on every
 * read. Dropped/repeated frames therefore cannot change simulated time.
 */
export class SystemSimulationClock {

  private anchorRealMilliseconds:
    number | null =
    null;

  constructor(
    readonly playbackDaysPerRealSecond:
      number,

    readonly epochSimulationDay:
      number =
      0,
  ) {
    assertPositiveFinite(
      playbackDaysPerRealSecond,
      'playbackDaysPerRealSecond',
    );

    if (
      !Number.isFinite(
        epochSimulationDay,
      )
    ) {
      throw new RangeError(
        `epochSimulationDay must be finite: ${epochSimulationDay}.`,
      );
    }
  }

  read(
    realTimestampMilliseconds:
      number,
  ): SystemSimulationClockState {

    if (
      !Number.isFinite(
        realTimestampMilliseconds,
      )
    ) {
      throw new RangeError(
        `realTimestampMilliseconds must be finite: ${realTimestampMilliseconds}.`,
      );
    }

    if (
      this.anchorRealMilliseconds ===
      null
    ) {
      this.anchorRealMilliseconds =
        realTimestampMilliseconds;
    }

    const elapsedRealSeconds =
      Math.max(
        0,
        realTimestampMilliseconds -
          this.anchorRealMilliseconds,
      ) /
      1_000;

    return Object.freeze({
      simulationDay:
        this.epochSimulationDay +
        elapsedRealSeconds *
          this.playbackDaysPerRealSecond,
      playbackDaysPerRealSecond:
        this.playbackDaysPerRealSecond,
    });
  }
}

export function systemSimulationPlaybackDaysPerSecond(
  orbitalPeriodsDays:
    readonly number[],
): number {

  const validPeriods =
    orbitalPeriodsDays.filter(
      value =>
        Number.isFinite(
          value,
        ) &&
        value >
          0,
    );

  if (
    validPeriods.length ===
    0
  ) {
    return DEFAULT_PLAYBACK_DAYS_PER_SECOND;
  }

  const shortestPeriodDays =
    Math.min(
      ...validPeriods,
    );

  return clamp(
    shortestPeriodDays /
      TARGET_SHORTEST_ORBIT_REAL_SECONDS,
    MIN_PLAYBACK_DAYS_PER_SECOND,
    MAX_PLAYBACK_DAYS_PER_SECOND,
  );
}

function assertPositiveFinite(
  value:
    number,

  name:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${name} must be finite and greater than 0: ${value}.`,
    );
  }
}

function clamp(
  value:
    number,

  minimum:
    number,

  maximum:
    number,
): number {

  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
}
