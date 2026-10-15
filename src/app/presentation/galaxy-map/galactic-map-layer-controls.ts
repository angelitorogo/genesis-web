import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { type GalacticMapExplorationCoverage } from './galactic-map-exploration-coverage';

import {
  GalacticMapLayerId,
  type GalacticMapLayerVisibility,
} from './galactic-map-layer-state';

export interface GalacticMapLayerVisibilityChange {
  readonly layerId:
    GalacticMapLayerId;

  readonly visible:
    boolean;
}

/**
 * Point-10.5 UI-only thematic layer switcher.
 *
 * It owns no Three.js objects, discovery state or persistence. The scene host
 * remains the single owner of the current visibility state.
 */
@Component({
  selector:
    'app-galactic-map-layer-controls',

  standalone:
    true,

  templateUrl:
    './galactic-map-layer-controls.html',

  styleUrl:
    './galactic-map-layer-controls.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class GalacticMapLayerControls {

  readonly layerId =
    GalacticMapLayerId;

  @Input({
    required:
      true,
  })
  visibility!:
    GalacticMapLayerVisibility;

  @Input({ required: true })
  explorationCoverage!: GalacticMapExplorationCoverage | null;

  @Input({ required: true })
  exploredShadingVisible!: boolean;

  @Output()
  readonly exploredShadingVisibleChange = new EventEmitter<boolean>();

  get unexploredSectorCount(): string {
    const coverage = this.explorationCoverage;
    return coverage === null ? '0' :
      (coverage.totalSectorCount - BigInt(coverage.exploredSectorCount)).toString();
  }

  toggleExploredShading(): void {
    this.exploredShadingVisibleChange.emit(!this.exploredShadingVisible);
  }

  @Output()
  readonly visibilityChange =
    new EventEmitter<GalacticMapLayerVisibilityChange>();

  toggle(
    layerId:
      GalacticMapLayerId,
  ): void {

    this
      .visibilityChange
      .emit({
        layerId,
        visible:
          !this.visibility[
            layerId
          ],
      });
  }
}
