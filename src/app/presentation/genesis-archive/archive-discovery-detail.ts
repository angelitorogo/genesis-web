import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';

import {
  ActivatedRoute,
  type ParamMap,
  RouterLink,
} from '@angular/router';

import { combineLatest, type Subscription } from 'rxjs';

import {
  DiscoveredToVisitedEntryKind,
} from '../../domain/discovery/discovered-to-visited-entry';

import {
  GenesisPrimaryButton,
} from '../../ui/components/genesis-primary-button/genesis-primary-button';

import {
  GenesisSectionTitle,
} from '../../ui/components/genesis-section-title/genesis-section-title';

import {
  GenesisScreen,
} from '../../ui/layout/genesis-screen/genesis-screen';


import {
  ArchiveDiscoveryDetailFacade,
  ArchiveDiscoveryLocatorKind,
  type ArchiveDiscoveryDetailRequest,
} from './archive-discovery-detail.facade';

import {
  GalacticObjectProceduralRender,
} from './galactic-object-procedural-render';

import {
  StellarSystemProceduralRender,
} from './stellar-system-procedural-render';
import { CompactObjectScientificRender } from './compact-object-scientific-render';

import {
  EventHorizonExternalRender,
} from './event-horizon-external-render';

@Component({
  selector:
    'app-archive-discovery-detail',

  standalone:
    true,

  imports: [
    GenesisScreen,
    GenesisSectionTitle,
    GenesisPrimaryButton,
    RouterLink,
    GalacticObjectProceduralRender,
    StellarSystemProceduralRender,
    CompactObjectScientificRender,
    EventHorizonExternalRender,
  ],

  templateUrl:
    './archive-discovery-detail.html',

  styleUrl:
    './archive-discovery-detail.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class ArchiveDiscoveryDetail
  implements
    OnInit,
    OnDestroy {

  readonly facade =
    inject(
      ArchiveDiscoveryDetailFacade,
    );

  private readonly route =
    inject(
      ActivatedRoute,
    );

  private eventHorizonAutoAdvanceTimer:
    ReturnType<typeof setInterval> | null =
    null;

  /** Angular can reuse this component when navigating between galactic nuclei. */
  private nucleusRouteSubscription: Subscription | null = null;
  private routedIdentity: string | null = null;
  private routedNucleus = false;

  private static readonly EVENT_HORIZON_AUTO_ADVANCE_MS =
    900;

  startEventHorizonApproach():
    void {

    this
      .facade
      .startEventHorizonApproach();

    this
      .syncEventHorizonAutoAdvance();
  }

  pauseOrResumeEventHorizonApproach():
    void {

    this
      .facade
      .pauseOrResumeEventHorizonApproach();

    this
      .syncEventHorizonAutoAdvance();
  }

  approachEventHorizon():
    void {

    this
      .facade
      .approachEventHorizon();

    this
      .syncEventHorizonAutoAdvance();
  }

  retreatFromEventHorizon():
    void {

    this
      .facade
      .retreatFromEventHorizon();

    this
      .syncEventHorizonAutoAdvance();
  }

  resetEventHorizonApproach():
    void {

    this
      .facade
      .resetEventHorizonApproach();

    this
      .stopEventHorizonAutoAdvance();
  }

  formatHorizonRatio(
    value:
      number,
  ): string {

    if (
      !Number.isFinite(value)
    ) {
      return '—';
    }

    return value < 1.1
      ? value.toFixed(4)
      : value < 10
        ? value.toFixed(3)
        : value.toFixed(2);
  }

  formatHorizonFactor(
    value:
      number,
  ): string {

    if (
      !Number.isFinite(value)
    ) {
      return '—';
    }

    return value >= 100
      ? value.toFixed(0)
      : value >= 10
        ? value.toFixed(1)
        : value.toFixed(3);
  }

  performScientificAction():
    void {

    void this
      .facade
      .performScientificAction();
  }


  performPulsarTimingObservation():
    void {

    if (
      this.facade.actionPending()
    ) {
      return;
    }

    void this
      .facade
      .performPulsarTimingObservation();
  }

  performMagnetarActivityObservation():
    void {

    if (
      this.facade.actionPending()
    ) {
      return;
    }

    void this
      .facade
      .performMagnetarActivityObservation();
  }

  performRelativisticJetAnalysis():
    void {

    if (
      this.facade.actionPending()
    ) {
      return;
    }

    void this
      .facade
      .performRelativisticJetAnalysis();
  }

  performGravitationalLensingReconstruction():
    void {

    if (
      this.facade.actionPending()
    ) {
      return;
    }

    void this
      .facade
      .performGravitationalLensingReconstruction();
  }

  performStellarSystemStageObservation():
    void {

    if (
      this.facade.actionPending()
    ) {
      return;
    }

    void this
      .facade
      .performStellarSystemStageObservation();
  }

  ngOnDestroy():
    void {

    this.nucleusRouteSubscription?.unsubscribe();
    this.nucleusRouteSubscription = null;
    this.stopEventHorizonAutoAdvance();
  }

  private syncEventHorizonAutoAdvance():
    void {

    this
      .stopEventHorizonAutoAdvance();

    const current =
      this
        .facade
        .eventHorizonApproachSimulation();

    if (
      current ===
        null ||
      !current.isRunning ||
      current.atMinimumExteriorRadius
    ) {
      return;
    }

    this.eventHorizonAutoAdvanceTimer =
      setInterval(
        () => {
          const state =
            this
              .facade
              .eventHorizonApproachSimulation();

          if (
            state ===
              null ||
            !state.isRunning ||
            state.atMinimumExteriorRadius
          ) {
            this
              .stopEventHorizonAutoAdvance();

            return;
          }

          this
            .facade
            .approachEventHorizon();

          const next =
            this
              .facade
              .eventHorizonApproachSimulation();

          if (
            next?.atMinimumExteriorRadius
          ) {
            this
              .stopEventHorizonAutoAdvance();
          }
        },
        ArchiveDiscoveryDetail
          .EVENT_HORIZON_AUTO_ADVANCE_MS,
      );
  }

  private stopEventHorizonAutoAdvance():
    void {

    if (
      this.eventHorizonAutoAdvanceTimer ===
        null
    ) {
      return;
    }

    clearInterval(
      this.eventHorizonAutoAdvanceTimer,
    );

    this.eventHorizonAutoAdvanceTimer =
      null;
  }

  /** This presentation guard also keeps legacy snapshot-only test fixtures usable. */
  nucleusSupplementaryWarning(): string | null {
    const read = this.facade.nucleusSupplementaryWarning;
    return typeof read === 'function' ? read() : null;
  }

  /** The same request shape is used on first entry and route reuse. */
  private routeRequest(
    locatorKind: string | null,
    params: ParamMap,
    query: ParamMap,
  ): ArchiveDiscoveryDetailRequest {
    const isStellarSystem =
      locatorKind === ArchiveDiscoveryLocatorKind.SYSTEM;

    return {
      locatorKind,
      galaxyIndex: params.get('galaxyIndex'),
      sectorKey: params.get('sectorKey'),
      galacticObjectIndex: params.get('galacticObjectIndex'),
      universeRef: query.get('u'),
      universeSeed: query.get('seed'),
      generatorVersionCode: query.get('version'),
      includeStellarSystemScientificProgression: isStellarSystem,
      stellarSystemEntryKind: isStellarSystem
        ? DiscoveredToVisitedEntryKind.DETAILED_CARD
        : null,
    };
  }

  /** The frozen centre is object 0 of sector 0 in each galaxy. */
  private isNucleusRoute(request: ArchiveDiscoveryDetailRequest): boolean {
    return request.locatorKind === ArchiveDiscoveryLocatorKind.GALACTIC_OBJECT &&
      request.sectorKey === '0' && request.galacticObjectIndex === '0';
  }

  ngOnInit(): void {
    const initial = this.routeRequest(
      this.route.snapshot.data['archiveDiscoveryLocatorKind'] ?? null,
      this.route.snapshot.paramMap,
      this.route.snapshot.queryParamMap,
    );
    this.routedIdentity = JSON.stringify(initial);
    this.routedNucleus = this.isNucleusRoute(initial);
    void this.facade.load(initial);

    // On Angular route reuse, ngOnInit() is not called again. Follow the
    // address of the nuclear object; do not change ordinary object workflows.
    // A snapshot-only mock still supports the previous initialization path.
    if (!this.route.paramMap || !this.route.queryParamMap || !this.route.data) {
      return;
    }
    this.nucleusRouteSubscription = combineLatest([
      this.route.paramMap,
      this.route.queryParamMap,
      this.route.data,
    ]).subscribe(([params, query, data]) => {
      const next = this.routeRequest(
        data['archiveDiscoveryLocatorKind'] ?? null, params, query,
      );
      const identity = JSON.stringify(next);
      if (identity === this.routedIdentity) return;
      const isNucleus = this.isNucleusRoute(next);
      if (!this.routedNucleus && !isNucleus) return;
      this.routedIdentity = identity;
      this.routedNucleus = isNucleus;
      this.stopEventHorizonAutoAdvance();
      void this.facade.load(next);
    });
  }

}
