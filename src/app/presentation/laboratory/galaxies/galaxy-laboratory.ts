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
  GalacticMapScene,
} from '../../galaxy-map/galactic-map-scene';

import {
  GalaxyLaboratoryCaseId,
  GALAXY_LABORATORY_CASES,
  GalaxyLaboratoryFixtures,
  type GalaxyLaboratoryCase,
} from './galaxy-laboratory-fixtures';

@Component({
  selector:
    'app-galaxy-laboratory',

  standalone:
    true,

  imports: [
    GalacticMapScene,
    RouterLink,
  ],

  templateUrl:
    './galaxy-laboratory.html',

  styleUrl:
    './galaxy-laboratory.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class GalaxyLaboratoryPage {

  readonly cases =
    GALAXY_LABORATORY_CASES;

  readonly selectedCaseId =
    signal<GalaxyLaboratoryCaseId>(
      GalaxyLaboratoryCaseId
        .SPIRAL,
    );

  readonly selectedCase =
    computed<
      GalaxyLaboratoryCase
    >(
      () =>
        this.cases
          .find(
            candidate =>
              candidate.id ===
              this.selectedCaseId(),
          ) ??
        this.cases[
          0
        ],
    );

  readonly frame =
    computed(
      () =>
        GalaxyLaboratoryFixtures
          .frame(
            this.selectedCaseId(),
          ),
    );

  selectCase(
    caseId:
      GalaxyLaboratoryCaseId,
  ): void {

    this
      .selectedCaseId
      .set(
        caseId,
      );
  }
}
