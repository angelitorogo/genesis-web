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
import { SystemMultihostGameCutover } from './system-multihost-game-cutover';
import { SystemV2SingleScientificSession } from './system-v2-single-scientific-session';

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

  readonly multihostSession = computed(() => {
    const model = this.facade.model();
    return model === null ? null : SystemMultihostGameCutover.sessionOrNull(model);
  });

  readonly v2SingleSession = computed(() => {
    const model = this.facade.model();
    return model === null ? null : SystemV2SingleScientificSession.buildOrNull(model);
  });

  readonly pulsarPlanetPopulation = computed(() => this.v2SingleSession()?.pulsarPlanetPopulation ?? null);

  readonly stellarCard = computed(() =>
    this.multihostSession()?.stellarSystemCard ?? this.facade.model()?.stellarSystemCard ?? null,
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

        return this.multihostSession()?.scene ?? this.v2SingleSession()?.scene ?? SystemSceneSnapshotBuilder.build(model);
      },
    );

  readonly systemFacts =
    computed<readonly ArchiveStellarSystemFactModel[]>(
      () =>
        this
          .stellarCard()
          ?.systemFacts
          .filter(
            (fact: ArchiveStellarSystemFactModel) =>
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
