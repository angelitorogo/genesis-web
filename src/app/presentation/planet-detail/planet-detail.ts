import {
  ChangeDetectionStrategy,
  Component,
  computed,
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

import {
  PlanetScientificCardAssembler,
  PlanetScientificFicheResolutionKind,
} from './planet-scientific-card';

@Component({
  selector:
    'app-planet-detail-page',

  standalone:
    true,

  imports: [
    GenesisScreen,
    RouterLink,
  ],

  templateUrl:
    './planet-detail.html',

  styleUrl:
    './planet-detail.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class PlanetDetailPage
  implements OnInit {

  readonly facade =
    inject(
      ArchiveDiscoveryDetailFacade,
    );

  private readonly route =
    inject(
      ActivatedRoute,
    );

  private readonly requestedBodyIndex =
    parseNonNegativeBigIntOrNull(
      this
        .route
        .snapshot
        .paramMap
        .get(
          'bodyIndex',
        ),
    );

  readonly resolution =
    computed(
      () => {
        const model =
          this
            .facade
            .model();

        if (
          model ===
            null
        ) {
          return null;
        }

        if (
          this.requestedBodyIndex ===
            null
        ) {
          return Object.freeze({
            kind:
              PlanetScientificFicheResolutionKind.NOT_FOUND,
            reason:
              'El índice planetario indicado en la ruta no es válido.',
          } as const);
        }

        return PlanetScientificCardAssembler
          .build(
            model,
            this.requestedBodyIndex,
          );
      },
    );

  readonly systemRoute =
    computed(
      () => {
        const model =
          this
            .facade
            .model();

        if (
          model ===
            null
        ) {
          return null;
        }

        return [
          '/system',
          model.galaxyIndex.toString(),
          model.sectorKey.toString(),
          model.galacticObjectIndex.toString(),
        ] as const;
      },
    );

  readonly archiveRoute =
    computed(
      () => {
        const model =
          this
            .facade
            .model();

        if (
          model ===
            null
        ) {
          return null;
        }

        return [
          '/archive/system',
          model.galaxyIndex.toString(),
          model.sectorKey.toString(),
          model.galacticObjectIndex.toString(),
        ] as const;
      },
    );

  readonly sourceQueryParams =
    computed(
      () => {
        const model =
          this
            .facade
            .model();

        if (
          model ===
            null
        ) {
          return null;
        }

        return Object.freeze({
          seed:
            model.universeSeed,
          version:
            model.generatorVersionCode,
        });
      },
    );

  ngOnInit():
    void {

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
          false,

        stellarSystemEntryKind:
          null,
      });
  }
}

function parseNonNegativeBigIntOrNull(
  value:
    string | null,
): bigint | null {

  if (
    value ===
      null ||
    !/^(0|[1-9]\d*)$/.test(
      value,
    )
  ) {
    return null;
  }

  try {
    return BigInt(
      value,
    );
  } catch {
    return null;
  }
}
