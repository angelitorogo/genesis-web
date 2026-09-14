import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';

import {
  ActivatedRoute,
  RouterLink,
} from '@angular/router';

import {
  GenesisScreen,
} from '../../ui/layout/genesis-screen/genesis-screen';

import {
  ArchiveDiscoveryDetailFacade,
  ArchiveDiscoveryLocatorKind,
} from '../genesis-archive/archive-discovery-detail.facade';

@Component({
  selector:
    'app-observatory',

  standalone:
    true,

  imports: [
    GenesisScreen,
    RouterLink,
  ],

  templateUrl:
    './observatory.html',

  styleUrl:
    './observatory.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class Observatory
  implements OnInit {

  readonly facade =
    inject(
      ArchiveDiscoveryDetailFacade,
    );

  private readonly route =
    inject(
      ActivatedRoute,
    );

  readonly hasStellarSystemTarget =
    this
      .route
      .snapshot
      .data[
        'observatoryTargetKind'
      ] ===
      ArchiveDiscoveryLocatorKind.SYSTEM;

  ngOnInit():
    void {

    if (
      !this.hasStellarSystemTarget
    ) {
      return;
    }

    void this
      .facade
      .load({
        locatorKind:
          ArchiveDiscoveryLocatorKind.SYSTEM,

        galaxyIndex:
          this
            .route
            .snapshot
            .paramMap
            .get(
              'galaxyIndex',
            ),

        sectorKey:
          this
            .route
            .snapshot
            .paramMap
            .get(
              'sectorKey',
            ),

        galacticObjectIndex:
          this
            .route
            .snapshot
            .paramMap
            .get(
              'galacticObjectIndex',
            ),

        universeRef:
          this
            .route
            .snapshot
            .queryParamMap
            .get(
              'u',
            ),

        universeSeed:
          this
            .route
            .snapshot
            .queryParamMap
            .get(
              'seed',
            ),

        generatorVersionCode:
          this
            .route
            .snapshot
            .queryParamMap
            .get(
              'version',
            ),

        includeStellarSystemScientificProgression:
          true,

        // Deliberately no entry kind here. Selecting a target in the
        // Observatory is not the DISCOVERED -> VISITED interaction milestone.
        stellarSystemEntryKind:
          null,
      });
  }

  performStageObservation():
    void {

    if (
      this.facade.actionPending()
    ) {
      return;
    }

    void this
      .facade
      .performStellarSystemStageObservation();
  }
}
