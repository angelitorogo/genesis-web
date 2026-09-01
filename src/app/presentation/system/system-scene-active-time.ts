/**
 * Point-24.9 monotonic renderer time that excludes intervals spent in a hidden
 * browser tab. It is presentation-only: domain/orbital time is still evaluated
 * by SystemSimulationClock from the timestamp projected by this helper.
 */
export class SystemSceneActiveTime {

  private excludedRealMilliseconds =
    0;

  private hiddenSinceRealMilliseconds:
    number | null =
    null;

  setVisible(
    visible:
      boolean,

    realTimestampMilliseconds:
      number,
  ): void {
    assertFiniteTimestamp(
      realTimestampMilliseconds,
    );

    if (
      visible
    ) {
      if (
        this.hiddenSinceRealMilliseconds !==
          null
      ) {
        this.excludedRealMilliseconds +=
          Math.max(
            0,
            realTimestampMilliseconds -
              this.hiddenSinceRealMilliseconds,
          );

        this.hiddenSinceRealMilliseconds =
          null;
      }

      return;
    }

    if (
      this.hiddenSinceRealMilliseconds ===
        null
    ) {
      this.hiddenSinceRealMilliseconds =
        realTimestampMilliseconds;
    }
  }

  project(
    realTimestampMilliseconds:
      number,
  ): number {
    assertFiniteTimestamp(
      realTimestampMilliseconds,
    );

    const currentlyHiddenMilliseconds =
      this.hiddenSinceRealMilliseconds ===
        null
        ? 0
        : Math.max(
            0,
            realTimestampMilliseconds -
              this.hiddenSinceRealMilliseconds,
          );

    return Math.max(
      0,
      realTimestampMilliseconds -
        this.excludedRealMilliseconds -
        currentlyHiddenMilliseconds,
    );
  }
}

export function systemSceneAnimationLoopRequired(
  pageVisible:
    boolean,

  motionCount:
    number,

  bodyTrackingActive:
    boolean,
): boolean {
  return (
    pageVisible &&
    (
      motionCount >
        0 ||
      bodyTrackingActive
    )
  );
}

function assertFiniteTimestamp(
  value:
    number,
): void {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    throw new RangeError(
      `realTimestampMilliseconds must be finite: ${value}.`,
    );
  }
}
