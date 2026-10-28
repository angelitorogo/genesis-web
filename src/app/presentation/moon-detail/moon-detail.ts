import { Vida9aPhysicalBiologyAuditPanel } from '../scientific/vida9a-physical-biology-audit-panel';
import { effect } from '@angular/core';
import { Vida9FullSystemBiologyPanel } from '../scientific/vida9-full-system-biology-panel';
import { vida2SupportLabel } from '../../simulation/life/life-plausibility-physical-adapter-vida2';
import { Vida1CompactFiche } from '../scientific/vida-1-compact-fiche';
import { Vida3PrivateMicrobialRuntime } from '../runtime/vida3-private-microbial.runtime';
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
    Vida9aPhysicalBiologyAuditPanel,
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
