import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';

import {
  DiscoveryState,
} from '../../../domain/discovery/discovery-state';

import {
  RouterLink,
} from '@angular/router';

import {
  StellarSystemProceduralRender,
} from '../../genesis-archive/stellar-system-procedural-render';

import {
  SystemScene,
} from '../../system/system-scene';

import {
  SystemSceneSnapshotBuilder,
  type SystemSceneSnapshot,
} from '../../system/system-scene-snapshot';

import {
  STELLAR_SYSTEM_LABORATORY_CASES,
  StellarSystemLaboratoryCaseId,
  StellarSystemLaboratoryFamilyId,
  StellarSystemLaboratoryFixtures,
  type StellarSystemLaboratoryCase,
} from './stellar-system-laboratory-fixtures';

@Component({
  selector:
    'app-stellar-system-laboratory',

  standalone:
    true,

  imports: [
    RouterLink,
    StellarSystemProceduralRender,
    SystemScene,
  ],

  templateUrl:
    './stellar-system-laboratory.html',

  styleUrl:
    './stellar-system-laboratory.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class StellarSystemLaboratoryPage {

  readonly cases =
    STELLAR_SYSTEM_LABORATORY_CASES;

  readonly selectedCaseId =
    signal<StellarSystemLaboratoryCaseId>(
      StellarSystemLaboratoryCaseId.SINGLE,
    );

  readonly selectedFamilyId =
    signal<StellarSystemLaboratoryFamilyId>(
      StellarSystemLaboratoryFamilyId.A,
    );

  readonly selectedCase =
    computed<StellarSystemLaboratoryCase>(
      () =>
        this.cases
          .find(
            candidate =>
              candidate.id ===
              this.selectedCaseId(),
          ) ??
        this.cases[0]!,
    );

  readonly families =
    computed(
      () =>
        StellarSystemLaboratoryFixtures
          .families(
            this.selectedCaseId(),
          ),
    );

  readonly frame =
    computed(
      () =>
        StellarSystemLaboratoryFixtures
          .frame(
            this.selectedCaseId(),
            this.selectedFamilyId(),
          ),
    );

  readonly rendererQaStage =
    computed(
      () =>
        this.frame()
          .stages
          .find(
            stage =>
              stage.discoveryState.code ===
              DiscoveryState.CATALOGUED.code,
          ) ??
        this.frame()
          .stages[
            this.frame()
              .stages.length - 1
          ]!,
    );

  readonly rendererQaSnapshot =
    computed<SystemSceneSnapshot>(
      () => {
        const frame =
          this.frame();

        const previewStage =
          this.rendererQaStage();

        const generationKey =
          StellarSystemLaboratoryFixtures
            .generationKey();

        return SystemSceneSnapshotBuilder
          .buildFromSource({
            universeSeed:
              generationKey
                .universeSeed
                .serialize(),
            generatorVersionCode:
              generationKey
                .generatorVersionCode,
            locator:
              frame.family.locator,
            proceduralIdentity:
              `G${frame.family.locator.galaxyIndex.toString()} / S${frame.family.locator.sectorKey.toString()} / O${frame.family.locator.galacticObjectIndex.toString()}`,
            discoveryState:
              previewStage.discoveryState,
            discoveryStateLabel:
              previewStage.label,
            stellarSystemCard:
              previewStage.card,
          });
      },
    );

  selectCase(
    caseId:
      StellarSystemLaboratoryCaseId,
  ): void {

    this
      .selectedCaseId
      .set(
        caseId,
      );

    this
      .selectedFamilyId
      .set(
        StellarSystemLaboratoryFamilyId.A,
      );
  }

  selectFamily(
    familyId:
      StellarSystemLaboratoryFamilyId,
  ): void {

    this
      .selectedFamilyId
      .set(
        familyId,
      );
  }
}
