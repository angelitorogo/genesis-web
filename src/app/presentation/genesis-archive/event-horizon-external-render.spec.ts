import {
  TestBed,
} from '@angular/core/testing';

import {
  EventHorizonExternalApproachSimulationEngine,
} from '../../simulation/observation/event-horizon-external-approach-simulation-engine';

import {
  EventHorizonExternalRender,
} from './event-horizon-external-render';

describe('28.2d.4 — real procedural-source horizon approach', () => {
  beforeEach(
    () => {
      TestBed.overrideComponent(
        EventHorizonExternalRender,
        {
          set: {
            template:
              '<div data-testid="renderer-test-shell"></div>',
          },
        },
      );
    },
  );

  it('maps the unchanged 28.2a state to a larger visual approach scale', () => {
    const fixture =
      TestBed.createComponent(
        EventHorizonExternalRender,
      );

    let far =
      EventHorizonExternalApproachSimulationEngine
        .start(
          EventHorizonExternalApproachSimulationEngine
            .createFromSchwarzschildRadius(
              100,
            ),
        );

    fixture.componentRef.setInput(
      'simulation',
      far,
    );

    fixture.componentRef.setInput(
      'descriptor',
      {
        kind:
          'AGN_NUCLEUS',
      },
    );

    fixture.detectChanges();

    const farView =
      fixture
        .componentInstance
        .view();

    let near =
      far;

    for (
      let index = 0;
      index < 16;
      index += 1
    ) {
      near =
        EventHorizonExternalApproachSimulationEngine
          .approach(
            near,
          );
    }

    fixture.componentRef.setInput(
      'simulation',
      near,
    );

    fixture.detectChanges();

    const nearView =
      fixture
        .componentInstance
        .view();

    expect(
      nearView.visualScale,
    ).toBeGreaterThan(
      farView.visualScale,
    );

    expect(
      nearView.compactness01,
    ).toBeGreaterThan(
      farView.compactness01,
    );

    expect(
      nearView.signalVisibility01,
    ).toBeLessThan(
      farView.signalVisibility01,
    );

    expect(
      nearView.frequencyPercent,
    ).toBe(
      `${(
        near.sample.receivedToEmittedFrequencyRatio *
        100
      ).toFixed(2)} %`,
    );
  });

  it('remains strictly exterior at the interaction floor', () => {
    const fixture =
      TestBed.createComponent(
        EventHorizonExternalRender,
      );

    let state =
      EventHorizonExternalApproachSimulationEngine
        .start(
          EventHorizonExternalApproachSimulationEngine
            .createFromSchwarzschildRadius(
              100,
            ),
        );

    for (
      let index = 0;
      index < 10_000;
      index += 1
    ) {
      state =
        EventHorizonExternalApproachSimulationEngine
          .approach(
            state,
          );
    }

    fixture.componentRef.setInput(
      'simulation',
      state,
    );

    fixture.componentRef.setInput(
      'descriptor',
      {
        kind:
          'AGN_NUCLEUS',
      },
    );

    fixture.detectChanges();

    expect(
      state.radiusRatioToSchwarzschild,
    ).toBe(
      1.001,
    );

    expect(
      state.radiusRatioToSchwarzschild,
    ).toBeGreaterThan(
      1,
    );
  });
});
