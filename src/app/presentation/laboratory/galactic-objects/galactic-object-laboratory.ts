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
  GalacticObjectProceduralRender,
} from '../../genesis-archive/galactic-object-procedural-render';

import {
  GALACTIC_NUCLEUS_LABORATORY_CASES,
  GalacticNucleusLaboratoryCaseId,
  GalacticNucleusLaboratoryFixtures,
} from './galactic-nucleus-laboratory-fixtures';

import {
  GALACTIC_OBJECT_LABORATORY_CASES,
  GalacticObjectLaboratoryCaseId,
  GalacticObjectLaboratoryFixtures,
  GalacticObjectLaboratoryGroup,
} from './galactic-object-laboratory-fixtures';

const LaboratoryView =
  Object.freeze({
    OBJECT:
      'OBJECT',

    NUCLEUS:
      'NUCLEUS',
  } as const);

type LaboratoryView =
  typeof LaboratoryView[
    keyof typeof LaboratoryView
  ];

@Component({
  selector:
    'app-galactic-object-laboratory',

  standalone:
    true,

  imports: [
    GalacticMapScene,
    GalacticObjectProceduralRender,
    RouterLink,
  ],

  templateUrl:
    './galactic-object-laboratory.html',

  styleUrl:
    './galactic-object-laboratory.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class GalacticObjectLaboratoryPage {

  readonly objectGroups =
    Object.freeze([
      Object.freeze({
        title:
          'Nebulosas',
        cases:
          casesFor(
            GalacticObjectLaboratoryGroup
              .NEBULAE,
          ),
      }),
      Object.freeze({
        title:
          'Regiones H II',
        cases:
          casesFor(
            GalacticObjectLaboratoryGroup
              .HII,
          ),
      }),
      Object.freeze({
        title:
          'Cúmulos',
        cases:
          casesFor(
            GalacticObjectLaboratoryGroup
              .CLUSTERS,
          ),
      }),
      Object.freeze({
        title:
          'Remanentes de supernova',
        cases:
          casesFor(
            GalacticObjectLaboratoryGroup
              .SUPERNOVA_REMNANTS,
          ),
      }),
      Object.freeze({
        title:
          'Extremos sin especializar',
        cases:
          casesFor(
            GalacticObjectLaboratoryGroup
              .EXTREME,
          ),
      }),
    ]);

  readonly nuclearCases =
    GALACTIC_NUCLEUS_LABORATORY_CASES;

  readonly emissionNebulaSamples =
    GalacticObjectLaboratoryFixtures
      .emissionNebulaSamples();

  readonly reflectionNebulaSamples =
    GalacticObjectLaboratoryFixtures
      .reflectionNebulaSamples();

  readonly view =
    signal<LaboratoryView>(
      LaboratoryView
        .OBJECT,
    );

  readonly selectedObjectCaseId =
    signal<GalacticObjectLaboratoryCaseId>(
      GalacticObjectLaboratoryCaseId
        .NEBULA_EMISSION,
    );

  readonly selectedNuclearCaseId =
    signal<GalacticNucleusLaboratoryCaseId>(
      GalacticNucleusLaboratoryCaseId
        .AGN,
    );

  readonly selectedEmissionNebulaSampleIndex =
    signal(
      0,
    );

  readonly selectedReflectionNebulaSampleIndex =
    signal(
      0,
    );

  readonly selectedEmissionNebulaSample =
    computed(
      () =>
        this
          .emissionNebulaSamples[
            this
              .selectedEmissionNebulaSampleIndex()
          ],
    );

  readonly selectedReflectionNebulaSample =
    computed(
      () =>
        this
          .reflectionNebulaSamples[
            this
              .selectedReflectionNebulaSampleIndex()
          ],
    );

  readonly isEmissionNebulaSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this
          .selectedObjectCaseId() ===
          GalacticObjectLaboratoryCaseId
            .NEBULA_EMISSION,
    );

  readonly isReflectionNebulaSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this
          .selectedObjectCaseId() ===
          GalacticObjectLaboratoryCaseId
            .NEBULA_REFLECTION,
    );

  readonly selectedObjectCase =
    computed(
      () =>
        GalacticObjectLaboratoryFixtures
          .caseDefinition(
            this
              .selectedObjectCaseId(),
            this
              .selectedEmissionNebulaSampleIndex(),
            this
              .selectedReflectionNebulaSampleIndex(),
          ),
    );

  readonly objectFrames =
    computed(
      () =>
        GalacticObjectLaboratoryFixtures
          .frames(
            this
              .selectedObjectCaseId(),
            this
              .selectedEmissionNebulaSampleIndex(),
            this
              .selectedReflectionNebulaSampleIndex(),
          ),
    );

  readonly nuclearFrame =
    computed(
      () =>
        GalacticNucleusLaboratoryFixtures
          .frame(
            this
              .selectedNuclearCaseId(),
          ),
    );

  readonly isObjectView =
    computed(
      () =>
        this.view() ===
        LaboratoryView.OBJECT,
    );

  readonly isNucleusView =
    computed(
      () =>
        this.view() ===
        LaboratoryView.NUCLEUS,
    );

  selectObjectCase(
    caseId:
      GalacticObjectLaboratoryCaseId,
  ): void {

    this
      .selectedObjectCaseId
      .set(
        caseId,
      );

    this
      .view
      .set(
        LaboratoryView
          .OBJECT,
      );
  }

  selectEmissionNebulaSample(
    sampleIndex:
      number,
  ): void {

    if (
      !Number.isInteger(
        sampleIndex,
      ) ||
      sampleIndex <
        0 ||
      sampleIndex >=
        this
          .emissionNebulaSamples
          .length
    ) {
      throw new RangeError(
        `Unsupported emission-nebula sample index: ${sampleIndex}.`,
      );
    }

    this
      .selectedEmissionNebulaSampleIndex
      .set(
        sampleIndex,
      );

    this
      .selectedObjectCaseId
      .set(
        GalacticObjectLaboratoryCaseId
          .NEBULA_EMISSION,
      );

    this
      .view
      .set(
        LaboratoryView
          .OBJECT,
      );
  }

  selectReflectionNebulaSample(
    sampleIndex:
      number,
  ): void {

    if (
      !Number.isInteger(
        sampleIndex,
      ) ||
      sampleIndex <
        0 ||
      sampleIndex >=
        this
          .reflectionNebulaSamples
          .length
    ) {
      throw new RangeError(
        `Unsupported reflection-nebula sample index: ${sampleIndex}.`,
      );
    }

    this
      .selectedReflectionNebulaSampleIndex
      .set(
        sampleIndex,
      );

    this
      .selectedObjectCaseId
      .set(
        GalacticObjectLaboratoryCaseId
          .NEBULA_REFLECTION,
      );

    this
      .view
      .set(
        LaboratoryView
          .OBJECT,
      );
  }

  selectNuclearCase(
    caseId:
      GalacticNucleusLaboratoryCaseId,
  ): void {

    this
      .selectedNuclearCaseId
      .set(
        caseId,
      );

    this
      .view
      .set(
        LaboratoryView
          .NUCLEUS,
      );
  }
}

function casesFor(
  group:
    GalacticObjectLaboratoryGroup,
) {

  return GALACTIC_OBJECT_LABORATORY_CASES
    .filter(
      candidate =>
        candidate.group ===
        group,
    );
}
