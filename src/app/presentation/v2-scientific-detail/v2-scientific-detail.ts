import {ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {type Subscription} from 'rxjs';
import {DiscoveryState} from '../../domain/discovery/discovery-state';
import {GeneratorVersion} from '../../domain/generation/generator-version';
import {SystemLocator} from '../../domain/generation/procedural-locator';
import {UniverseGenerationKey} from '../../domain/generation/universe-generation-key';
import {type MultihostModelIdentityV245, type MultihostModelManifestV245} from '../../domain/planetary/multihost-model-manifest-v245';
import {UniverseSeed} from '../../domain/universe/universe-seed';
import {GenesisScreen} from '../../ui/layout/genesis-screen/genesis-screen';
import {ArchiveDiscoveryDetailFacade, ArchiveDiscoveryLocatorKind,
  type ArchiveDiscoveryDetailModel} from '../genesis-archive/archive-discovery-detail.facade';
import {ScientificBodyPreview} from '../scientific-body-preview/scientific-body-preview';
import {ScientificBodyPreviewAssembler, type ScientificBodyPreviewModel} from '../scientific/scientific-body-preview';
import {scientificRouteUniverseRef} from '../scientific/scientific-route-identity';
import {MULTIHOST_MODEL_REPOSITORY_V245} from '../runtime/multihost-model-v245.runtime';
import {manifestFromMultihostSceneV245} from '../system/system-scene-multihost-manifest-v245';
import {type SystemSceneSnapshot, SystemSceneSnapshotBuilder} from '../system/system-scene-snapshot';
import {type SystemSceneV2ReferenceFiche} from '../system/system-scene-v2-reference-fiche';
import {v2ScientificSections} from './v2-scientific-sections';
import {resolveV2FicheReference} from './v2-fiche-resolution';

type V2FicheStatus = 'loading' | 'available' | 'missing' | 'inactive' | 'stale' | 'error';

/** The same standalone fiche experience as V1, but it resolves ONLY a stored
 * V2 manifest and its exact opaque identity in a confirmed persisted binary.
 * No V1 body index, synthetic BodyLocator or mutation of the save is involved. */
@Component({
  selector: 'app-v2-scientific-detail',
  standalone: true,
  imports: [GenesisScreen, RouterLink, ScientificBodyPreview],
  templateUrl: './v2-scientific-detail.html',
  styleUrl: '../planet-detail/planet-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class V2ScientificDetailPage implements OnInit, OnDestroy {
  private routeSubscription: Subscription | null = null;
  private requestNumber = 0;
  readonly facade = inject(ArchiveDiscoveryDetailFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly repository = inject(MULTIHOST_MODEL_REPOSITORY_V245);
  readonly status = signal<V2FicheStatus>('loading');
  readonly message = signal<string | null>(null);
  readonly fiche = signal<SystemSceneV2ReferenceFiche | null>(null);
  readonly preview = signal<ScientificBodyPreviewModel | null>(null);
  readonly scene = signal<SystemSceneSnapshot | null>(null);
  readonly identity = signal<MultihostModelIdentityV245 | null>(null);
  readonly manifest = signal<MultihostModelManifestV245 | null>(null);
  readonly sections = computed(() => {
    const fiche = this.fiche();
    const scene = this.scene();
    const identity = this.identity();
    return fiche === null || scene === null || identity === null
      ? [] : v2ScientificSections(scene, identity.sourceId, fiche);
  });
  readonly systemRoute = computed(() => {
    const model = this.facade.model();
    return model === null ? null : [
      '/system', model.galaxyIndex.toString(), model.sectorKey.toString(),
      model.galacticObjectIndex.toString(),
    ] as const;
  });
  readonly sourceQueryParams = computed(() => {
    const model = this.facade.model();
    return model === null ? null : Object.freeze({
      u: model.routeUniverseRef ?? scientificRouteUniverseRef(model.universeSeed, model.generatorVersionCode),
    });
  });
  readonly relatedMoons = computed(() => {
    const identity = this.identity();
    if (identity?.kind !== 'PLANET') return [];
    return this.manifest()?.identities.filter(item =>
      item.kind === 'MOON' && item.parentPublicRef === identity.publicRef) ?? [];
  });
  readonly hostPlanet = computed(() => {
    const identity = this.identity();
    if (identity?.kind !== 'MOON') return null;
    return this.manifest()?.identities.find(item =>
      item.kind === 'PLANET' && item.publicRef === identity.parentPublicRef) ?? null;
  });
  ficheRoute(identity: MultihostModelIdentityV245): readonly string[] | null {
    const systemRoute = this.systemRoute();
    return systemRoute === null ? null : [
      ...systemRoute, 'v2', identity.kind.toLowerCase(), identity.publicRef,
    ];
  }
  ngOnInit(): void {
    const params = this.route.snapshot.paramMap;
    const query = this.route.snapshot.queryParamMap;
    void this.facade.load({
      locatorKind: ArchiveDiscoveryLocatorKind.SYSTEM,
      galaxyIndex: params.get('galaxyIndex'), sectorKey: params.get('sectorKey'),
      galacticObjectIndex: params.get('galacticObjectIndex'),
      universeRef: query.get('u'), universeSeed: query.get('seed'),
      generatorVersionCode: query.get('version'),
      includeStellarSystemScientificProgression: false,
      stellarSystemEntryKind: null,
    }).then(() => {
      this.routeSubscription = this.route.paramMap.subscribe(() => {
        this.status.set('loading');
        this.fiche.set(null);
        this.preview.set(null);
        const request = ++this.requestNumber;
        void this.resolve(request);
      });
    }).catch((error: unknown) => {
      this.status.set('error');
      this.message.set(error instanceof Error ? error.message : 'Error al cargar el sistema.');
    });
  }

  ngOnDestroy(): void {
    this.requestNumber++;
    this.routeSubscription?.unsubscribe();
  }

  private async resolve(request: number): Promise<void> {
    const model: ArchiveDiscoveryDetailModel | null = this.facade.model();
    const kind = this.route.snapshot.paramMap.get('kind')?.toUpperCase();
    const ref = this.route.snapshot.paramMap.get('publicRef');
    if (model === null || model.locatorKind !== ArchiveDiscoveryLocatorKind.SYSTEM ||
      model.stellarSystemCard?.componentCount !== 2 ||
      model.discoveryState.code < DiscoveryState.CONFIRMED.code ||
      !['PLANET', 'MOON', 'ASTEROID', 'COMET'].includes(kind ?? '') ||
      ref === null || !/^[0-9A-F]{32}$/.test(ref)) {
      this.status.set('missing');
      this.message.set('La ficha requiere un binario confirmado y una referencia V2 válida.');
      return;
    }
    try {
      const key = new UniverseGenerationKey(
        UniverseSeed.parse(model.universeSeed), GeneratorVersion.fromCode(model.generatorVersionCode),
      );
      const locator = new SystemLocator(model.galaxyIndex, model.sectorKey, model.galacticObjectIndex);
      const saved = await this.repository.load(key, locator);
      if (request !== this.requestNumber) return;
      if (saved === null) {
        this.status.set('inactive');
        this.message.set('El modelo V2 no está habilitado para este sistema. Actívalo desde SystemPage.');
        return;
      }
      const scene = SystemSceneSnapshotBuilder.build(model, {experimentalMultihostPreview: true});
      if (request !== this.requestNumber) return;
      const regenerated = manifestFromMultihostSceneV245(scene);
      const resolution = resolveV2FicheReference(saved, regenerated, scene, kind!, ref);
      if (resolution.status !== 'available') {
        this.status.set(resolution.status);
        this.message.set(resolution.status === 'stale'
          ? 'El modelo V2 guardado no coincide con el generador actual. Actualízalo explícitamente desde SystemPage.'
          : 'No existe un cuerpo científico V2 con esa referencia en este sistema.');
        return;
      }
      const {identity, fiche} = resolution;
      this.identity.set(identity);
      this.manifest.set(saved);
      this.scene.set(scene);
      this.fiche.set(fiche);
      this.preview.set(ScientificBodyPreviewAssembler.referenceV2(scene, identity.sourceId));
      this.status.set('available');
    } catch (error) {
      if (request !== this.requestNumber) return;
      this.status.set('error');
      this.message.set(error instanceof Error ? error.message : 'No se pudo resolver la ficha V2.');
    }
  }
}
