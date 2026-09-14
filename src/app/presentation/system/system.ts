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
  DiscoveredToVisitedEntryKind,
} from '../../domain/discovery/discovered-to-visited-entry';

import {
  GenesisScreen,
} from '../../ui/layout/genesis-screen/genesis-screen';

import {
  ArchiveDiscoveryDetailFacade,
  ArchiveDiscoveryLocatorKind,
} from '../genesis-archive/archive-discovery-detail.facade';

import {
  ArchiveStellarSystemKnowledgeLevel,
  type ArchiveStellarSystemFactModel,
} from '../genesis-archive/archive-stellar-system-card';

import {
  scientificRouteUniverseRef,
} from '../scientific/scientific-route-identity';

import {
  SystemScene,
} from './system-scene';

import {
  SystemSceneSnapshotBuilder,
} from './system-scene-snapshot';

@Component({
  selector:
    'app-system-page',

  standalone:
    true,

  imports: [
    GenesisScreen,
    RouterLink,
    SystemScene,
  ],

  templateUrl:
    './system.html',

  styleUrl:
    './system.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class SystemPage
  implements OnInit {

  readonly facade =
    inject(
      ArchiveDiscoveryDetailFacade,
    );

  private readonly route =
    inject(
      ActivatedRoute,
    );

  readonly sceneSnapshot =
    computed(
      () => {
        const model =
          this
            .facade
            .model();

        if (
          model ===
            null ||
          model.locatorKind !==
            ArchiveDiscoveryLocatorKind.SYSTEM ||
          model.stellarSystemCard ===
            null
        ) {
          return null;
        }

        return SystemSceneSnapshotBuilder
          .build(
            model,
          );
      },
    );

  readonly systemFacts =
    computed<readonly ArchiveStellarSystemFactModel[]>(
      () =>
        this
          .facade
          .model()
          ?.stellarSystemCard
          ?.systemFacts
          .filter(
            fact =>
              fact.label !==
              'SystemSeed',
          ) ??
        [],
    );

  readonly sourceQueryParams =
    computed(
      () => {
        const model =
          this
            .facade
            .model();

        return model ===
          null
          ? null
          : Object.freeze({
              u:
                model.routeUniverseRef ??
                scientificRouteUniverseRef(
                  model.universeSeed,
                  model.generatorVersionCode,
                ),
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

        stellarSystemEntryKind:
          DiscoveredToVisitedEntryKind.SCENE,
      });
  }

  isCatalogued(
    knowledgeLevel:
      ArchiveStellarSystemKnowledgeLevel,
  ): boolean {

    return (
      knowledgeLevel ===
        ArchiveStellarSystemKnowledgeLevel.CATALOGUED ||
      knowledgeLevel ===
        ArchiveStellarSystemKnowledgeLevel.CONFIRMED
    );
  }

  isConfirmed(
    knowledgeLevel:
      ArchiveStellarSystemKnowledgeLevel,
  ): boolean {

    return knowledgeLevel ===
      ArchiveStellarSystemKnowledgeLevel.CONFIRMED;
  }

}
