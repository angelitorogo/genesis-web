import {
  ChangeDetectionStrategy,
  Component,
  computed,
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

import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { multihostManifestMatchesV245, type MultihostModelIdentityV245 } from '../../domain/planetary/multihost-model-manifest-v245';
import { MULTIHOST_MODEL_REPOSITORY_V245 } from '../runtime/multihost-model-v245.runtime';
import { manifestFromMultihostSceneV245 } from './system-scene-multihost-manifest-v245';
import { type ArchiveDiscoveryDetailModel } from '../genesis-archive/archive-discovery-detail.facade';

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

  private readonly multihostModelRepository = inject(MULTIHOST_MODEL_REPOSITORY_V245);
  readonly v245Enabled = signal(false);
  readonly v245Busy = signal(false);
  readonly v245Error = signal<string | null>(null);
  readonly v245Ready = signal(false);

  /** No Ground Truth is exposed while the host is not CONFIRMED. The saved
   * V2 manifest is only an opt-in reference-model view, not discovery data. */
  readonly v245Available = computed(() => {
    const model = this.facade.model();
    return model?.locatorKind === ArchiveDiscoveryLocatorKind.SYSTEM &&
      model.discoveryState.code >= DiscoveryState.CONFIRMED.code &&
      model.stellarSystemCard?.componentCount === 2;
  });

  readonly sceneSnapshot = computed(() => {
    const model = this.facade.model();
    if (model === null || model.locatorKind !== ArchiveDiscoveryLocatorKind.SYSTEM ||
      model.stellarSystemCard === null) return null;
    return SystemSceneSnapshotBuilder.build(model, {
      experimentalMultihostPreview: this.v245Available() && this.v245Enabled(),
    });
  });

  readonly v245Manifest = computed(() => {
    const scene = this.v245Enabled() ? this.sceneSnapshot() : null;
    return scene?.scientificMultihostHabitabilityV244 === undefined ? null :
      manifestFromMultihostSceneV245(scene);
  });

  readonly v245IdentityBySource = computed(() => new Map<string, MultihostModelIdentityV245>(
    this.v245Manifest()?.identities.map((identity: MultihostModelIdentityV245) => [identity.sourceId, identity] as const) ?? [],
  ));

  v245Identity(sourceId: string): MultihostModelIdentityV245 | undefined {
    return this.v245IdentityBySource().get(sourceId);
  }

  v245CountForHost(items: readonly {readonly hostId: string}[], hostId: string): number {
    return items.filter(item => item.hostId === hostId).length;
  }

  private v245PersistenceContext(model: ArchiveDiscoveryDetailModel) {
    return {
      key: new UniverseGenerationKey(
        UniverseSeed.parse(model.universeSeed), GeneratorVersion.fromCode(model.generatorVersionCode),
      ),
      locator: new SystemLocator(model.galaxyIndex, model.sectorKey, model.galacticObjectIndex),
    };
  }

  private async restoreV245(): Promise<void> {
    const model = this.facade.model();
    if (model === null || !this.v245Available()) {
      this.v245Enabled.set(false);
      this.v245Ready.set(true);
      return;
    }
    try {
      const {key, locator} = this.v245PersistenceContext(model);
      const saved = await this.multihostModelRepository.load(key, locator);
      if (saved !== null) {
        const regenerated = manifestFromMultihostSceneV245(
          SystemSceneSnapshotBuilder.build(model, {experimentalMultihostPreview: true}),
        );
        if (!multihostManifestMatchesV245(saved, regenerated)) {
          this.v245Error.set('El modelo V2 guardado no coincide con el generador actual. Selecciona «Actualizar modelo V2» para volver a guardarlo; la partida V1 no se ha modificado.');
        } else {
          this.v245Enabled.set(true);
        }
      }
    } catch (error) {
      this.v245Error.set(error instanceof Error ? error.message : 'No se ha podido restaurar el modelo V2.');
    } finally {
      this.v245Ready.set(true);
    }
  }

  async toggleV245(): Promise<void> {
    const model = this.facade.model();
    if (this.v245Busy() || model === null || !this.v245Available() || !this.v245Ready()) return;
    this.v245Busy.set(true);
    this.v245Error.set(null);
    try {
      const {key, locator} = this.v245PersistenceContext(model);
      if (this.v245Enabled()) {
        await this.multihostModelRepository.clear(key, locator);
        this.v245Enabled.set(false);
      } else {
        const scene = SystemSceneSnapshotBuilder.build(model, {experimentalMultihostPreview: true});
        const manifest = manifestFromMultihostSceneV245(scene);
        await this.multihostModelRepository.save(key, locator, manifest);
        this.v245Enabled.set(true);
      }
    } catch (error) {
      this.v245Error.set(error instanceof Error ? error.message : 'No se ha podido guardar el modelo V2.');
    } finally {
      this.v245Busy.set(false);
    }
  }

  readonly systemFacts =
    computed<readonly ArchiveStellarSystemFactModel[]>(
      () =>
        this
          .facade
          .model()
          ?.stellarSystemCard
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
      }).then(() => this.restoreV245()).catch((error: unknown) => {
        this.v245Error.set(error instanceof Error ? error.message : 'Error cargando el sistema.');
        this.v245Ready.set(true);
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
