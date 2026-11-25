import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
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
import { SystemTechnosignatureAlert37a } from './system-technosignature-alert-37a';
import { SystemV2SingleScientificSession } from './system-v2-single-scientific-session';
import { SystemCompactHostScientificSession } from './system-compact-host-scientific-session';
import { SystemSceneCivilizationVisualsDataSource } from './system-scene-civilization-visuals.data-source';
import {
  decorateSystemSceneSnapshotWithCivilizationTiers,
  stripSystemSceneBiologyVisuals387,
  type SystemSceneCivilizationVisualRecord,
} from './system-scene-civilization-visuals';

/** 38.7: never reuse biological visuals across universes, generations or systems. */
export function systemSceneBiologyIdentity387(model: Readonly<{
  universeSeed: string;
  generatorVersionCode: number;
  galaxyIndex: bigint;
  sectorKey: bigint;
  galacticObjectIndex: bigint;
}> | null): string | null {
  if (!model || typeof model.universeSeed !== 'string' || model.universeSeed.length === 0 ||
      !Number.isSafeInteger(model.generatorVersionCode)) return null;
  return JSON.stringify([
    model.universeSeed, model.generatorVersionCode,
    String(model.galaxyIndex), String(model.sectorKey), String(model.galacticObjectIndex),
  ]);
}

@Component({
  selector:
    'app-system-page',

  standalone:
    true,

  imports: [
    GenesisScreen,
    RouterLink,
    SystemScene,
    SystemTechnosignatureAlert37a,
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

  /** VISCIV.6e: recover the optional diagnostics input used by system.html. */
  get orbitalInfrastructureDebug(): boolean {
    return this.route.snapshot.queryParamMap.get('debugOrbital') === '1';
  }

  private readonly systemSceneCivilizationVisuals =
    inject(
      SystemSceneCivilizationVisualsDataSource,
    );

  private readonly sceneCivilizationTiers = signal<ReadonlyMap<string, SystemSceneCivilizationVisualRecord>>(
    new Map(),
  );

  /** 38.7: bind the asynchronous biological projection to its exact system. */
  private readonly sceneCivilizationIdentity = signal<string | null>(null);

  private civilizationVisualsRequestId = 0;

  readonly multihostSession = computed(() => {
    const model = this.facade.model();
    return model === null ? null : SystemMultihostGameCutover.sessionOrNull(model);
  });

  readonly compactSession = computed(() => {
    const model = this.facade.model();
    return model === null ? null : SystemCompactHostScientificSession.buildOrNull(model);
  });

  readonly v2SingleSession = computed(() => {
    const model = this.facade.model();
    return model === null || this.compactSession() !== null ? null : SystemV2SingleScientificSession.buildOrNull(model);
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

        const snapshot = this.compactSession()?.scene ?? this.multihostSession()?.scene ?? this.v2SingleSession()?.scene ?? SystemSceneSnapshotBuilder.build(model);

        const sceneIdentity = systemSceneBiologyIdentity387(model);
        const authorized =
          model.stellarSystemCard.knowledgeLevel === ArchiveStellarSystemKnowledgeLevel.CONFIRMED &&
          model.discoveryState.code >= 5 &&
          sceneIdentity !== null &&
          sceneIdentity === this.sceneCivilizationIdentity();
        return authorized
          ? decorateSystemSceneSnapshotWithCivilizationTiers(snapshot, this.sceneCivilizationTiers())
          : stripSystemSceneBiologyVisuals387(snapshot);
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


  constructor() {
    effect(() => {
      const model = this.facade.model();
      void this.refreshSystemSceneCivilizationVisuals(model);
    }, {
      allowSignalWrites: true,
    });
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

  private async refreshSystemSceneCivilizationVisuals(
    model: ReturnType<ArchiveDiscoveryDetailFacade['model']>,
  ): Promise<void> {
    const requestId = ++this.civilizationVisualsRequestId;
    const identity = systemSceneBiologyIdentity387(model);
    if (
      model === null ||
      identity === null ||
      model.locatorKind !== ArchiveDiscoveryLocatorKind.SYSTEM ||
      model.discoveryState.code < 5 ||
      model.stellarSystemCard?.knowledgeLevel !== ArchiveStellarSystemKnowledgeLevel.CONFIRMED
    ) {
      this.sceneCivilizationIdentity.set(null);
      this.sceneCivilizationTiers.set(new Map());
      return;
    }

    const tiers = await this.systemSceneCivilizationVisuals.read({
      universeSeed: model.universeSeed,
      generatorVersionCode: model.generatorVersionCode,
      galaxyIndex: model.galaxyIndex,
      sectorKey: model.sectorKey,
      galacticObjectIndex: model.galacticObjectIndex,
      confirmed: true,
    });

    if (requestId !== this.civilizationVisualsRequestId) {
      return;
    }

    // The identity changes only with the exact, current successful request.
    this.sceneCivilizationIdentity.set(identity);
    this.sceneCivilizationTiers.set(tiers);
  }

}
