import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import {
  SpectrumPlotModelBuilder,
  SpectrumPlotRenderKind,
  type SpectrumPlotSource,
} from './spectrum-plot-model';

@Component({
  selector:
    'app-spectrum-plot',

  standalone:
    true,

  templateUrl:
    './spectrum-plot.html',

  styleUrl:
    './spectrum-plot.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class SpectrumPlot {

  readonly spectrum =
    input.required<SpectrumPlotSource>();

  readonly title =
    input(
      'Espectro observado',
    );

  readonly accessibleLabel =
    input(
      'Gráfico espectroscópico de flujo normalizado frente a longitud de onda.',
    );

  readonly renderModel =
    computed(
      () =>
        SpectrumPlotModelBuilder
          .build(
            this.spectrum(),
          ),
    );

  readonly isInstrumental =
    computed(
      () =>
        this
          .renderModel()
          .renderKind ===
        SpectrumPlotRenderKind
          .INSTRUMENTAL,
    );

  readonly resolutionLabel =
    computed(
      () => {
        const value =
          this
            .renderModel()
            .effectiveResolutionElementNanometers;

        return value ===
          null
          ? null
          : `${formatMetric(value)} nm`;
      },
    );

  readonly uncertaintyLabel =
    computed(
      () => {
        const value =
          this
            .renderModel()
            .quantizationFraction;

        return value ===
          null
          ? null
          : `Δ ${formatMetric(value)}`;
      },
    );

  readonly detectabilityLabel =
    computed(
      () => {
        const value =
          this
            .renderModel()
            .minimumDetectableNormalizedContrast;

        return value ===
          null
          ? null
          : `≥ ${formatMetric(value)}`;
      },
    );
}

function formatMetric(
  value:
    number,
): string {

  if (
    value >=
    10
  ) {
    return value
      .toFixed(
        1,
      );
  }

  if (
    value >=
    1
  ) {
    return value
      .toFixed(
        2,
      );
  }

  return value
    .toFixed(
      3,
    );
}
