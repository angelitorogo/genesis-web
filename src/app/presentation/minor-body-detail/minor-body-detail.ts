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
  MinorBodyScientificTargetKind,
  type MinorBodyScientificTargetKind as MinorBodyScientificTargetKindValue,
} from '../../simulation/planetary/minor-body-scientific-target-resolver';

import {
  ArchiveDiscoveryDetailFacade,
  ArchiveDiscoveryLocatorKind,
} from '../genesis-archive/archive-discovery-detail.facade';

import {
  scientificRouteUniverseRef,
} from '../scientific/scientific-route-identity';

import {
  MinorBodyScientificCardAssembler,
  MinorBodyScientificFicheResolutionKind,
} from './minor-body-scientific-card';

@Component({
  selector:
    'app-minor-body-detail-page',

  standalone:
    true,

  imports: [
    GenesisScreen,
    RouterLink,
  ],

  templateUrl:
    './minor-body-detail.html',

  styleUrl:
    './minor-body-detail.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class MinorBodyDetailPage
  implements OnInit {

  readonly facade =
    inject(
      ArchiveDiscoveryDetailFacade,
    );

  private readonly route =
    inject(
      ActivatedRoute,
    );

  private readonly requestedTargetKind =
    parseTargetKindOrNull(
      this
        .route
        .snapshot
        .paramMap
        .get(
          'minorBodyKind',
        ),
    );

  private readonly requestedProceduralId =
    parseProceduralIdOrNull(
      this
        .route
        .snapshot
        .paramMap
        .get(
          'proceduralId',
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
          this.requestedTargetKind ===
            null ||
          this.requestedProceduralId ===
            null
        ) {
          return Object.freeze({
            kind:
              MinorBodyScientificFicheResolutionKind.NOT_FOUND,
            reason:
              'La identidad indicada en la ruta del cuerpo menor no es válida.',
          } as const);
        }

        return MinorBodyScientificCardAssembler
          .build(
            model,
            this.requestedTargetKind,
            this.requestedProceduralId,
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
          u:
            model.routeUniverseRef ??
            scientificRouteUniverseRef(
              model.universeSeed,
              model.generatorVersionCode,
            ),
        });
      },
    );

  minorBodySectionHref(
    sectionId:
      string,
  ): string | null {

    const model =
      this
        .facade
        .model();

    if (
      model ===
        null ||
      this.requestedTargetKind ===
        null ||
      this.requestedProceduralId ===
        null
    ) {
      return null;
    }

    const path =
      [
        '',
        'system',
        model.galaxyIndex.toString(),
        model.sectorKey.toString(),
        model.galacticObjectIndex.toString(),
        'minor-body',
        this.requestedTargetKind,
        this.requestedProceduralId,
      ]
        .map(
          (segment, index) =>
            index ===
              0
              ? segment
              : encodeURIComponent(
                  segment,
                ),
        )
        .join('/');

    const query =
      new URLSearchParams({
        u:
          model.routeUniverseRef ??
          scientificRouteUniverseRef(
            model.universeSeed,
            model.generatorVersionCode,
          ),
      })
        .toString();

    return `${path}?${query}#minor-body-section-${encodeURIComponent(sectionId)}`;
  }

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
          false,

        stellarSystemEntryKind:
          null,
      });
  }
}

function parseTargetKindOrNull(
  value:
    string | null,
): MinorBodyScientificTargetKindValue | null {

  if (
    value ===
      MinorBodyScientificTargetKind.ASTEROID ||
    value ===
      MinorBodyScientificTargetKind.COMET
  ) {
    return value;
  }

  return null;
}

function parseProceduralIdOrNull(
  value:
    string | null,
): string | null {

  if (
    value ===
      null
  ) {
    return null;
  }

  const normalized =
    value.toUpperCase();

  return /^[0-9A-F]{32}$/.test(
    normalized,
  )
    ? normalized
    : null;
}
