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
  scientificRouteUniverseRef,
} from '../scientific/scientific-route-identity';

import {
  ScientificBodyPreview,
} from '../scientific-body-preview/scientific-body-preview';

import {
  MoonScientificCardAssembler,
  MoonScientificFicheResolutionKind,
} from './moon-scientific-card';

@Component({
  selector:
    'app-moon-detail-page',

  standalone:
    true,

  imports: [
    GenesisScreen,
    RouterLink,
    ScientificBodyPreview,
  ],

  templateUrl:
    './moon-detail.html',

  styleUrl:
    './moon-detail.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class MoonDetailPage
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

  private readonly requestedMoonIndex =
    parseNonNegativeBigIntOrNull(
      this
        .route
        .snapshot
        .paramMap
        .get(
          'moonIndex',
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
            null ||
          this.requestedMoonIndex ===
            null
        ) {
          return Object.freeze({
            kind:
              MoonScientificFicheResolutionKind.NOT_FOUND,
            reason:
              'Los índices planetario o lunar indicados en la ruta no son válidos.',
          } as const);
        }

        return MoonScientificCardAssembler
          .build(
            model,
            this.requestedBodyIndex,
            this.requestedMoonIndex,
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

  readonly planetRoute =
    computed(
      () => {
        const model =
          this
            .facade
            .model();

        if (
          model ===
            null ||
          this.requestedBodyIndex ===
            null
        ) {
          return null;
        }

        return [
          '/system',
          model.galaxyIndex.toString(),
          model.sectorKey.toString(),
          model.galacticObjectIndex.toString(),
          'planet',
          this.requestedBodyIndex.toString(),
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

  moonSectionHref(
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
      this.requestedBodyIndex ===
        null ||
      this.requestedMoonIndex ===
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
        'planet',
        this.requestedBodyIndex.toString(),
        'moon',
        this.requestedMoonIndex.toString(),
      ]
        .map(
          (segment, index) =>
            index === 0
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

    return `${path}?${query}#moon-section-${encodeURIComponent(sectionId)}`;
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
