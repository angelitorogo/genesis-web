import {
  DestroyRef,
  inject,
  Injectable,
  signal,
} from '@angular/core';

const STANDARD_TRANSITION_DURATION_MS =
  1_450;

const REDUCED_TRANSITION_DURATION_MS =
  280;

const DISMISS_SAFETY_MARGIN_MS =
  120;

export interface GalaxyFocusTransitionRequest {
  readonly previousFocusGalaxyIndex:
    bigint;

  readonly activeGalaxyIndex:
    bigint;
}

export interface ActiveGalaxyFocusTransition {
  readonly id:
    number;

  readonly previousFocusGalaxyIndex:
    bigint;

  readonly activeGalaxyIndex:
    bigint;

  readonly reducedMotion:
    boolean;

  readonly durationMs:
    number;
}

export type GalaxyFocusTransitionState =
  | Readonly<{
      kind:
        'idle';
    }>
  | Readonly<{
      kind:
        'active';

      transition:
        ActiveGalaxyFocusTransition;
    }>;

const IDLE_STATE:
  GalaxyFocusTransitionState =
  Object.freeze({
    kind:
      'idle',
  });

/**
 * Point-11.7 presentation-only transition runtime.
 *
 * This runtime never changes persistence and never decides whether a focus
 * change may happen. Callers invoke presentPersistedFocusChange() only after
 * GALAXY_FOCUS_RUNTIME has committed the new active galaxy and the caller has
 * confirmed the refreshed application context.
 *
 * The transition therefore communicates only a UI/context reorientation. It
 * does not model distance, elapsed travel time, velocity, propulsion or FTL.
 */
@Injectable({
  providedIn:
    'root',
})
export class GalaxyFocusTransitionRuntime {

  private readonly destroyRef =
    inject(
      DestroyRef,
    );

  private readonly stateSignal =
    signal<GalaxyFocusTransitionState>(
      IDLE_STATE,
    );

  private transitionSequence =
    0;

  private dismissTimer:
    ReturnType<typeof setTimeout> | null =
    null;

  readonly state =
    this
      .stateSignal
      .asReadonly();

  constructor() {
    this
      .destroyRef
      .onDestroy(
        () =>
          this.clearDismissTimer(),
      );
  }

  presentPersistedFocusChange(
    request:
      GalaxyFocusTransitionRequest,
  ): ActiveGalaxyFocusTransition {

    validateGalaxyIndex(
      request
        .previousFocusGalaxyIndex,
      'previousFocusGalaxyIndex',
    );

    validateGalaxyIndex(
      request
        .activeGalaxyIndex,
      'activeGalaxyIndex',
    );

    if (
      request
        .previousFocusGalaxyIndex ===
      request
        .activeGalaxyIndex
    ) {
      throw new RangeError(
        'Point 11.7 requires two different galaxy indices for a focus transition.',
      );
    }

    this.clearDismissTimer();

    const reducedMotion =
      prefersReducedMotion();

    const durationMs =
      reducedMotion
        ? REDUCED_TRANSITION_DURATION_MS
        : STANDARD_TRANSITION_DURATION_MS;

    const transition =
      Object.freeze({
        id:
          ++this.transitionSequence,

        previousFocusGalaxyIndex:
          request
            .previousFocusGalaxyIndex,

        activeGalaxyIndex:
          request
            .activeGalaxyIndex,

        reducedMotion,
        durationMs,
      });

    this
      .stateSignal
      .set(
        Object.freeze({
          kind:
            'active',

          transition,
        }),
      );

    this.dismissTimer =
      setTimeout(
        () =>
          this.dismiss(
            transition.id,
          ),
        durationMs +
          DISMISS_SAFETY_MARGIN_MS,
      );

    return transition;
  }

  dismiss(
    transitionId?:
      number,
  ): void {

    const state =
      this.state();

    if (
      state.kind !==
        'active' ||
      (
        transitionId !==
          undefined &&
        state
          .transition
          .id !==
        transitionId
      )
    ) {
      return;
    }

    this.clearDismissTimer();

    this
      .stateSignal
      .set(
        IDLE_STATE,
      );
  }

  private clearDismissTimer():
    void {

    if (
      this.dismissTimer ===
      null
    ) {
      return;
    }

    clearTimeout(
      this.dismissTimer,
    );

    this.dismissTimer =
      null;
  }
}

function validateGalaxyIndex(
  value:
    bigint,

  fieldName:
    string,
): void {

  if (
    value <
    0n
  ) {
    throw new RangeError(
      `${fieldName} must be a non-negative galaxy index.`,
    );
  }
}

function prefersReducedMotion():
  boolean {

  return (
    typeof window !==
      'undefined' &&
    typeof window
      .matchMedia ===
      'function' &&
    window
      .matchMedia(
        '(prefers-reduced-motion: reduce)',
      )
      .matches
  );
}
