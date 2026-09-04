import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';

import {
  RouterLink,
} from '@angular/router';

import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../../../domain/discovery/discovery-state';

import {
  ArchiveStellarSystemCardAssembler,
  ArchiveStellarSystemKnowledgeLevel,
  type ArchiveStellarSystemCardModel,
} from '../../../genesis-archive/archive-stellar-system-card';

import {
  StellarSystemProceduralRender,
} from '../../../genesis-archive/stellar-system-procedural-render';

import {
  STELLAR_SYSTEM_LABORATORY_CASES,
  StellarSystemLaboratoryCaseId,
  StellarSystemLaboratoryFamilyId,
  StellarSystemLaboratoryFixtures,
  type StellarSystemLaboratoryCase,
  type StellarSystemLaboratoryFamily,
} from '../stellar-system-laboratory-fixtures';

export interface StellarSystemFicheQaStateOption {
  readonly state:
    DiscoveryStateValue;

  readonly label:
    string;

  readonly shortDescription:
    string;
}

export const STELLAR_SYSTEM_FICHE_QA_STATES:
  readonly StellarSystemFicheQaStateOption[] =
  Object.freeze([
    Object.freeze({
      state:
        DiscoveryState.DETECTED,
      label:
        'Detectado',
      shortDescription:
        'Solo señal persistida; sin identidad ni multiplicidad física.',
    }),
    Object.freeze({
      state:
        DiscoveryState.DISCOVERED,
      label:
        'Descubierto',
      shortDescription:
        'Identidad, multiplicidad y componentes; sin magnitudes físicas.',
    }),
    Object.freeze({
      state:
        DiscoveryState.VISITED,
      label:
        'Visitado',
      shortDescription:
        'Mismo disclosure científico que Descubierto; cambia la progresión, no la física visible.',
    }),
    Object.freeze({
      state:
        DiscoveryState.CATALOGUED,
      label:
        'Catalogado',
      shortDescription:
        'Propiedades estelares y arquitectura orbital ya caracterizadas.',
    }),
    Object.freeze({
      state:
        DiscoveryState.CONFIRMED,
      label:
        'Confirmado',
      shortDescription:
        'Añade únicamente la caracterización final autorizada por confirmación.',
    }),
  ]);

@Component({
  selector:
    'app-stellar-system-fiche-qa',

  standalone:
    true,

  imports: [
    RouterLink,
    StellarSystemProceduralRender,
  ],

  templateUrl:
    './stellar-system-fiche-qa.html',

  styleUrl:
    './stellar-system-fiche-qa.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class StellarSystemFicheQaPage {

  readonly cases =
    STELLAR_SYSTEM_LABORATORY_CASES;

  readonly states =
    STELLAR_SYSTEM_FICHE_QA_STATES;

  readonly knowledgeLevels =
    ArchiveStellarSystemKnowledgeLevel;

  readonly selectedCaseId =
    signal<StellarSystemLaboratoryCaseId>(
      StellarSystemLaboratoryCaseId.BINARY,
    );

  readonly selectedFamilyId =
    signal<StellarSystemLaboratoryFamilyId>(
      StellarSystemLaboratoryFamilyId.A,
    );

  readonly selectedState =
    signal<DiscoveryStateValue>(
      DiscoveryState.CONFIRMED,
    );

  readonly selectedCase =
    computed<StellarSystemLaboratoryCase>(
      () =>
        this.cases.find(
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

  readonly selectedFamily =
    computed<StellarSystemLaboratoryFamily>(
      () =>
        this.families().find(
          candidate =>
            candidate.id ===
            this.selectedFamilyId(),
        ) ??
        this.families()[0]!,
    );

  readonly card =
    computed<ArchiveStellarSystemCardModel>(
      () =>
        ArchiveStellarSystemCardAssembler
          .build(
            StellarSystemLaboratoryFixtures
              .generationKey(),
            this.selectedFamily()
              .locator,
            this.selectedState(),
          ),
    );

  readonly identifiedDisclosureEquivalent =
    computed(
      () => {
        const locator =
          this.selectedFamily()
            .locator;

        const generationKey =
          StellarSystemLaboratoryFixtures
            .generationKey();

        const discovered =
          ArchiveStellarSystemCardAssembler
            .build(
              generationKey,
              locator,
              DiscoveryState.DISCOVERED,
            );

        const visited =
          ArchiveStellarSystemCardAssembler
            .build(
              generationKey,
              locator,
              DiscoveryState.VISITED,
            );

        return JSON.stringify(
          discovered,
        ) ===
          JSON.stringify(
            visited,
          );
      },
    );

  selectCase(
    caseId:
      StellarSystemLaboratoryCaseId,
  ): void {

    this.selectedCaseId.set(
      caseId,
    );

    this.selectedFamilyId.set(
      StellarSystemLaboratoryFamilyId.A,
    );
  }

  selectFamily(
    familyId:
      StellarSystemLaboratoryFamilyId,
  ): void {

    this.selectedFamilyId.set(
      familyId,
    );
  }

  selectState(
    state:
      DiscoveryStateValue,
  ): void {

    this.selectedState.set(
      DiscoveryState.fromCode(
        state.code,
      ),
    );
  }
}
