import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';

import {
  type EventHorizonExternalApproachSimulationState,
} from '../../domain/observation/event-horizon-external-approach-simulation-state';

import {
  GalacticObjectProceduralRender,
} from './galactic-object-procedural-render';

interface EventHorizonExternalRenderView {
  readonly compactness01: number;
  readonly signalVisibility01: number;
  readonly approachProgress01: number;

  readonly visualScale: number;
  readonly visualBrightness: number;
  readonly visualSaturation: number;
  readonly visualContrast: number;
  readonly lensOverlayOpacity: number;

  readonly frequencyPercent: string;
  readonly clockPercent: string;
  readonly redshiftLabel: string;
  readonly signalStretchLabel: string;
  readonly distanceLabel: string;
  readonly phaseLabel: string;
}

/**
 * 28.2d.4 — immersive approach reusing the REAL procedural galactic-object
 * representation from the scientific fiche.
 *
 * The renderer does not manufacture a second AGN/IMBH image. It receives the
 * exact `card.render` descriptor already used by GalacticObjectProceduralRender
 * above and embeds that same renderer here.
 *
 * 28.2a/28.2b remain authoritative for physics and interaction. This component
 * only maps the exterior approach state to presentation zoom/field emphasis.
 * No coordinate at r <= Rs exists here.
 */
@Component({
  selector:
    'app-event-horizon-external-render',

  standalone:
    true,

  imports: [
    GalacticObjectProceduralRender,
  ],

  templateUrl:
    './event-horizon-external-render.html',

  styleUrl:
    './event-horizon-external-render.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class EventHorizonExternalRender {
  @Input({
    required:
      true,
  })
  simulation!:
    EventHorizonExternalApproachSimulationState;

  /**
   * This is the already-built archive render descriptor. It is intentionally
   * not regenerated here.
   */
  @Input({
    required:
      true,
  })
  descriptor!:
    any;

  @Input()
  hasAccretionDisk =
    false;

  view():
    EventHorizonExternalRenderView {

    const state =
      this.simulation;

    const radiusRatio =
      state.radiusRatioToSchwarzschild;

    const compactness01 =
      clamp01(
        1 /
        radiusRatio,
      );

    const signalVisibility01 =
      clamp01(
        state
          .sample
          .receivedToEmittedFrequencyRatio,
      );

    const minAltitude =
      0.001;

    const maxAltitude =
      99;

    const altitude =
      Math.max(
        minAltitude,
        radiusRatio -
        1,
      );

    const approachProgress01 =
      clamp01(
        (
          Math.log(
            maxAltitude,
          ) -
          Math.log(
            altitude,
          )
        ) /
          (
            Math.log(
              maxAltitude,
            ) -
            Math.log(
              minAltitude,
            )
          ),
      );

    const visualScale =
      1 +
      approachProgress01 *
      2.65;

    const visualBrightness =
      Math.max(
        0.64,
        0.94 +
        signalVisibility01 *
        0.12 -
        approachProgress01 *
        0.08,
      );

    const visualSaturation =
      Math.max(
        0.58,
        1 -
        approachProgress01 *
        (
          1 -
          signalVisibility01
        ) *
        0.45,
      );

    const visualContrast =
      1 +
      compactness01 *
      0.18;

    return {
      compactness01,
      signalVisibility01,
      approachProgress01,

      visualScale,
      visualBrightness,
      visualSaturation,
      visualContrast,

      lensOverlayOpacity:
        0.04 +
        compactness01 *
        0.34,

      frequencyPercent:
        `${(
          state
            .sample
            .receivedToEmittedFrequencyRatio *
          100
        ).toFixed(2)} %`,

      clockPercent:
        `${(
          state
            .sample
            .distantClockRateRatio *
          100
        ).toFixed(2)} %`,

      redshiftLabel:
        formatFactor(
          state
            .sample
            .gravitationalRedshiftZ,
        ),

      signalStretchLabel:
        `×${formatFactor(
          state
            .sample
            .signalIntervalStretchFactor,
        )}`,

      distanceLabel:
        `${formatRadius(
          radiusRatio,
        )} Rs`,

      phaseLabel:
        state.phase,
    };
  }
}

function clamp01(
  value:
    number,
): number {

  return Math.max(
    0,
    Math.min(
      1,
      value,
    ),
  );
}

function formatFactor(
  value:
    number,
): string {

  if (
    value >= 100
  ) {
    return value.toFixed(
      0,
    );
  }

  if (
    value >= 10
  ) {
    return value.toFixed(
      1,
    );
  }

  return value.toFixed(
    3,
  );
}

function formatRadius(
  value:
    number,
): string {

  if (
    value < 1.1
  ) {
    return value.toFixed(
      4,
    );
  }

  if (
    value < 10
  ) {
    return value.toFixed(
      3,
    );
  }

  return value.toFixed(
    2,
  );
}
