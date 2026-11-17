import { effect } from '@angular/core';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import type { Vida9BiologyRecord } from '../../domain/life/vida9-biology-exploration';
import { PlanetMoonColonizationDataSource386b } from '../planet-detail/planet-moon-colonization-data-source-38-6b';
import { moonPreviewWithVerifiedBiology38BisA4 } from './moon-confirmed-record-parity-38-bis-a4';
import { MoonColonialProvenanceDataSource38BisA5,
  type MoonColonialProvenances38BisA5 } from './moon-colonial-provenance-38-bis-a5';
import { Vida9FullSystemBiologyPanel } from '../scientific/vida9-full-system-biology-panel';
import { vida2SupportLabel } from '../../simulation/life/life-plausibility-physical-adapter-vida2';
import { Vida1CompactFiche } from '../scientific/vida-1-compact-fiche';
import { compactMoonSectionsVIDA9e, moonScientificDisplayTextVIDA9f } from './moon-scientific-compact-vida9e';
import { Vida3PrivateMicrobialRuntime } from '../runtime/vida3-private-microbial.runtime';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
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
import { SystemMultihostGameCutover } from '../system/system-multihost-game-cutover';
import { SystemV2SingleScientificSession } from '../system/system-v2-single-scientific-session';
import { SystemCompactHostScientificSession } from '../system/system-compact-host-scientific-session';

import {
  ScientificBodyPreview,
} from '../scientific-body-preview/scientific-body-preview';

import {
  formatMinorMoonNumber,
  formatMinorMoonRadius,
  minorMoonDynamicStateLabel,
} from './minor-moon-scenario-format-pre33-10a';

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
    Vida9FullSystemBiologyPanel,
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

  readonly minorMoonNumber = formatMinorMoonNumber;
  readonly minorMoonRadius = formatMinorMoonRadius;
  readonly minorMoonStatus = minorMoonDynamicStateLabel;

  /** VIDA.2: etiqueta del diagnostico fisico sin proyectar vida observada. */
  readonly vida2SupportLabel = vida2SupportLabel;

  private readonly vida3Private = inject(Vida3PrivateMicrobialRuntime);

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

  readonly multihostSession = computed(() => {
    const model = this.facade.model();
    return model === null ? null : SystemMultihostGameCutover.sessionOrNull(model);
  });

  readonly compactSession = computed(() => {
    const model=this.facade.model();
    return model===null?null:SystemCompactHostScientificSession.buildOrNull(model);
  });

  readonly v2SingleSession = computed(() => {
    const model = this.facade.model();
    return model === null || this.compactSession() !== null ? null : SystemV2SingleScientificSession.buildOrNull(model);
  });

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

        return this.compactSession()?.moonFiche(this.requestedBodyIndex,this.requestedMoonIndex) ??
          this.multihostSession()?.moonFiche(this.requestedBodyIndex, this.requestedMoonIndex) ??
          this.v2SingleSession()?.moonFiche(this.requestedBodyIndex, this.requestedMoonIndex) ??
          ((model.generatorVersionCode === 2 || model.generatorVersionCode === 3)
            ? MoonScientificCardAssembler.build(model, this.requestedBodyIndex, this.requestedMoonIndex,
                { resolveDetailed: () => null })
            : MoonScientificCardAssembler.build(model, this.requestedBodyIndex, this.requestedMoonIndex));
      },
    );

  /** VIDA.1: mantiene la navegacion compacta esperada por moon-detail.html. */
  readonly compactSections = computed(() => {
    const result = this.resolution();
    return result?.kind === 'AVAILABLE'
      ? Vida1CompactFiche.moon(result.card.sections.sections)
      : [];
  });

  /** VIDA.9e: sólo muestra tarjetas lunares esenciales, sin alterar modelos científicos. */
  /** Mostrar nombres y resultados sin nomenclatura del motor, sin modificar los datos. */
  readonly displayScientificText = moonScientificDisplayTextVIDA9f;

  readonly visibleSections = computed(() => {
    const result = this.resolution();
    return result?.kind === 'AVAILABLE' ? compactMoonSectionsVIDA9e(result.card.sections) : [];
  });

  /** 38.bis-a4: the Archive and 38.6b obtain moon colonies from persisted
   * VIDA.9, whereas the scientific assembler may reconstruct a different CT-0
   * projection. The persisted validated record is authoritative for the fiche.
   * A route change invalidates the asynchronous result before it can render.
   */
  private readonly verifiedMoonDataSource38BisA4 = inject(PlanetMoonColonizationDataSource386b);
  private readonly persistedMoon38BisA4 = signal<{
    readonly identityKey:string;
    readonly record:Vida9BiologyRecord|null;
  }|null>(null);

  private readonly moonRecordRequest38BisA4 = computed(() => {
    const model=this.facade.model();
    const resolved=this.resolution();
    const body=this.requestedBodyIndex,moon=this.requestedMoonIndex;
    if(!model || model.locatorKind!==ArchiveDiscoveryLocatorKind.SYSTEM ||
       model.discoveryState.code<DiscoveryState.CONFIRMED.code ||
       model.generatorVersionCode!==3 || body===null || moon===null ||
       moon>BigInt(Number.MAX_SAFE_INTEGER) || resolved?.kind!=='AVAILABLE')return null;
    const moonIndex=Number(moon);
    const request={confirmed:true,universeSeed:model.universeSeed,
      generatorVersionCode:model.generatorVersionCode,galaxyIndex:model.galaxyIndex,
      sectorKey:model.sectorKey,galacticObjectIndex:model.galacticObjectIndex,
      bodyIndex:body,moonIndices:[moonIndex]} as const;
    const identityKey=[model.universeSeed,model.generatorVersionCode,model.galaxyIndex,
      model.sectorKey,model.galacticObjectIndex,body,moon].join('|');
    return {identityKey,request,moonIndex};
  });

  private readonly persistedMoonLoad38BisA4=effect((onCleanup)=>{
    const context=this.moonRecordRequest38BisA4();
    this.persistedMoon38BisA4.set(null);
    if(!context)return;
    let obsolete=false;
    onCleanup(()=>{obsolete=true;});
    void this.verifiedMoonDataSource38BisA4
      .readVerifiedMoonRecord(context.request,context.moonIndex)
      .then(record=>{
        if(!obsolete)this.persistedMoon38BisA4.set({identityKey:context.identityKey,record});
      }).catch(()=>{
        if(!obsolete)this.persistedMoon38BisA4.set({identityKey:context.identityKey,record:null});
      });
  });

  readonly persistedMoonPending38BisA4=computed(()=>{
    const context=this.moonRecordRequest38BisA4();
    return context!==null && this.persistedMoon38BisA4()?.identityKey!==context.identityKey;
  });

  readonly verifiedPersistedMoonBiology38BisA4=computed(()=>{
    const context=this.moonRecordRequest38BisA4();
    const value=this.persistedMoon38BisA4();
    return context!==null&&value?.identityKey===context.identityKey?value.record:null;
  });

  readonly visibleMoonBiology38BisA4=computed(()=>{
    const result=this.resolution();
    if(result?.kind!=='AVAILABLE' || this.persistedMoonPending38BisA4())return null;
    return this.verifiedPersistedMoonBiology38BisA4()??result.card.confirmedBiologyVIDA9??null;
  });

  /** 38.bis-a5: only a validated, confirmed persisted moon may authorize
   * the lookup of its founding planet. An in-flight result cannot cross routes. */
  private readonly founderSource38BisA5=inject(MoonColonialProvenanceDataSource38BisA5);
  private readonly founderResult38BisA5=signal<{
    identityKey:string; values:MoonColonialProvenances38BisA5;
  }|null>(null);
  private readonly founderLoad38BisA5=effect((onCleanup)=>{
    const context=this.moonRecordRequest38BisA4();
    const record=this.verifiedPersistedMoonBiology38BisA4();
    this.founderResult38BisA5.set(null);
    if(!context||!record||record.colonization.colonies.length===0)return;
    let obsolete=false;
    onCleanup(()=>{obsolete=true;});
    void this.founderSource38BisA5.read(record,context.request,context.moonIndex)
      .then(values=>{
        if(!obsolete)this.founderResult38BisA5.set({identityKey:context.identityKey,values});
      }).catch(()=>{
        if(!obsolete)this.founderResult38BisA5.set({identityKey:context.identityKey,values:Object.freeze({})});
      });
  });
  readonly verifiedFounderNames38BisA5=computed(()=>{
    const context=this.moonRecordRequest38BisA4();
    const result=this.founderResult38BisA5();
    return context && result?.identityKey===context.identityKey ? result.values : null;
  });

  readonly moonPreview38BisA4=computed(()=>{
    const result=this.resolution();
    if(result?.kind!=='AVAILABLE')return null;
    return moonPreviewWithVerifiedBiology38BisA4(
      result.card.preview,this.verifiedPersistedMoonBiology38BisA4());
  });

  /** VIDA.6 lunar: persistencia privada, solo en fichas fisicas de sistemas confirmados V3. */
  private readonly vida6Persistence = effect(() => {
    const model = this.facade.model();
    const resolved = this.resolution();
    if (!model || model.generatorVersionCode !== 3 ||
        this.requestedBodyIndex === null || this.requestedMoonIndex === null ||
        resolved?.kind !== 'AVAILABLE' || !resolved.card.vida2) return;
    const identity = {universeSeed:model.universeSeed,generatorVersionCode:3,
      kind:'MOON' as const,galaxyIndex:model.galaxyIndex.toString(),
      sectorKey:model.sectorKey.toString(),galacticObjectIndex:model.galacticObjectIndex.toString(),
      bodyIndex:this.requestedBodyIndex.toString(),moonIndex:this.requestedMoonIndex.toString()};
    const snapshot = resolved.card.privateEcosystemVIDA6;
    const intelligence = resolved.card.privateCivilizationVIDA7;
    const colonization = resolved.card.privateColonizationVIDA8;
    const biology9 = resolved.card.confirmedBiologyVIDA9;
    void this.vida3Private.ensure(identity,resolved.card.vida2)
      .then(() => snapshot ? this.vida3Private.ensureEcosystem(snapshot) : undefined)
      .then(() => intelligence ? this.vida3Private.ensureIntelligenceCivilization(intelligence) : undefined)
      .then(() => colonization ? this.vida3Private.ensureColonization(colonization) : undefined)
      .then(() => biology9 ? this.vida3Private.ensureBiologyVIDA9(biology9) : undefined)
      .catch((error:unknown) => console.error('VIDA.6–VIDA.8 private lunar Ground Truth save failed',error));
  });

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

  readonly rutaBaseEspecies = computed((): readonly string[] | null => {
    const model = this.facade.model();
    return model && this.requestedBodyIndex !== null && this.requestedMoonIndex !== null
      ? ['/system',model.galaxyIndex.toString(),model.sectorKey.toString(),
          model.galacticObjectIndex.toString(),'planet',this.requestedBodyIndex.toString(),
          'moon',this.requestedMoonIndex.toString(),'species']
      : null;
  });

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
