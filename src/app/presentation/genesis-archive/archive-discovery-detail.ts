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
  GenesisPrimaryButton,
} from '../../ui/components/genesis-primary-button/genesis-primary-button';

import {
  GenesisSectionTitle,
} from '../../ui/components/genesis-section-title/genesis-section-title';

import {
  GenesisScreen,
} from '../../ui/layout/genesis-screen/genesis-screen';

import {
  ArchiveDiscoveryDetailFacade,
} from './archive-discovery-detail.facade';

import {
  GalacticObjectProceduralRender,
} from './galactic-object-procedural-render';

import {
  StellarSystemProceduralRender,
} from './stellar-system-procedural-render';

@Component({
  selector:
    'app-archive-discovery-detail',

  standalone:
    true,

  imports: [
    GenesisScreen,
    GenesisSectionTitle,
    GenesisPrimaryButton,
    RouterLink,
    GalacticObjectProceduralRender,
    StellarSystemProceduralRender,
  ],

  templateUrl:
    './archive-discovery-detail.html',

  styleUrl:
    './archive-discovery-detail.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class ArchiveDiscoveryDetail
  implements OnInit {

  readonly facade =
    inject(
      ArchiveDiscoveryDetailFacade,
    );

  private readonly route =
    inject(
      ActivatedRoute,
    );

  performScientificAction():
    void {

    void this
      .facade
      .performScientificAction();
  }

  ngOnInit():
    void {

    void this
      .facade
      .load({
        locatorKind:
          this
            .route
            .snapshot
            .data[
              'archiveDiscoveryLocatorKind'
            ] ??
          null,

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
      });
  }
}
