import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
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

    this
      .stopEventHorizonAutoAdvance();
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

  ngOnInit():
    void {

    const locatorKind =
      this
        .route
        .snapshot
        .data[
          'archiveDiscoveryLocatorKind'
        ] ??
      null;

    const isStellarSystem =
      locatorKind ===
      ArchiveDiscoveryLocatorKind.SYSTEM;

    void this
      .facade
      .load({
        locatorKind,

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
          isStellarSystem,

        stellarSystemEntryKind:
          isStellarSystem
            ? DiscoveredToVisitedEntryKind.DETAILED_CARD
            : null,
      });
  }
}
