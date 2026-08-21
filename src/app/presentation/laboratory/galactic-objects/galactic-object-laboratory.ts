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
  QuiescentNucleusRender,
} from './quiescent-nucleus-render';

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
    QuiescentNucleusRender,
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

  readonly quiescentNucleusSamples =
    GalacticNucleusLaboratoryFixtures
      .quiescentSamples();

  readonly emissionNebulaSamples =
    GalacticObjectLaboratoryFixtures
      .emissionNebulaSamples();

  readonly reflectionNebulaSamples =
    GalacticObjectLaboratoryFixtures
      .reflectionNebulaSamples();

  readonly darkNebulaSamples =
    GalacticObjectLaboratoryFixtures
      .darkNebulaSamples();

  readonly planetaryNebulaSamples =
    GalacticObjectLaboratoryFixtures
      .planetaryNebulaSamples();

  readonly hiiLowSamples =
    GalacticObjectLaboratoryFixtures
      .hiiLowSamples();

  readonly hiiModerateSamples =
    GalacticObjectLaboratoryFixtures
      .hiiModerateSamples();

  readonly hiiHighSamples =
    GalacticObjectLaboratoryFixtures
      .hiiHighSamples();

  readonly hiiIntenseSamples =
    GalacticObjectLaboratoryFixtures
      .hiiIntenseSamples();


  readonly openClusterSamples =
    GalacticObjectLaboratoryFixtures
      .openClusterSamples();

  readonly globularClusterSamples =
    GalacticObjectLaboratoryFixtures
      .globularClusterSamples();

  readonly supernovaRemnantShellSamples =
    GalacticObjectLaboratoryFixtures
      .supernovaRemnantShellSamples();

  readonly supernovaRemnantPlerionSamples =
    GalacticObjectLaboratoryFixtures
      .supernovaRemnantPlerionSamples();

  readonly supernovaRemnantCompositeSamples =
    GalacticObjectLaboratoryFixtures
      .supernovaRemnantCompositeSamples();

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

  readonly selectedQuiescentNucleusSampleIndex =
    signal(
      0,
    );

  readonly selectedEmissionNebulaSampleIndex =
    signal(
      0,
    );

  readonly selectedReflectionNebulaSampleIndex =
    signal(
      0,
    );

  readonly selectedDarkNebulaSampleIndex =
    signal(
      0,
    );

  readonly selectedPlanetaryNebulaSampleIndex =
    signal(
      0,
    );

  readonly selectedHiiLowSampleIndex =
    signal(
      0,
    );

  readonly selectedHiiModerateSampleIndex =
    signal(
      0,
    );

  readonly selectedHiiHighSampleIndex =
    signal(
      0,
    );

  readonly selectedHiiIntenseSampleIndex =
    signal(
      0,
    );


  readonly selectedOpenClusterSampleIndex =
    signal(
      0,
    );

  readonly selectedGlobularClusterSampleIndex =
    signal(
      0,
    );

  readonly selectedSupernovaRemnantShellSampleIndex =
    signal(
      0,
    );

  readonly selectedSupernovaRemnantPlerionSampleIndex =
    signal(
      0,
    );

  readonly selectedSupernovaRemnantCompositeSampleIndex =
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

  readonly selectedDarkNebulaSample =
    computed(
      () =>
        this
          .darkNebulaSamples[
            this
              .selectedDarkNebulaSampleIndex()
          ],
    );

  readonly selectedPlanetaryNebulaSample =
    computed(
      () =>
        this
          .planetaryNebulaSamples[
            this
              .selectedPlanetaryNebulaSampleIndex()
          ],
    );

  readonly selectedHiiLowSample =
    computed(
      () =>
        this
          .hiiLowSamples[
            this
              .selectedHiiLowSampleIndex()
          ],
    );

  readonly selectedHiiModerateSample =
    computed(
      () =>
        this
          .hiiModerateSamples[
            this
              .selectedHiiModerateSampleIndex()
          ],
    );

  readonly selectedHiiHighSample =
    computed(
      () =>
        this
          .hiiHighSamples[
            this
              .selectedHiiHighSampleIndex()
          ],
    );

  readonly selectedHiiIntenseSample =
    computed(
      () =>
        this
          .hiiIntenseSamples[
            this
              .selectedHiiIntenseSampleIndex()
          ],
    );


  readonly selectedOpenClusterSample =
    computed(
      () =>
        this
          .openClusterSamples[
            this
              .selectedOpenClusterSampleIndex()
          ],
    );

  readonly selectedGlobularClusterSample =
    computed(
      () =>
        this
          .globularClusterSamples[
            this
              .selectedGlobularClusterSampleIndex()
          ],
    );

  readonly selectedSupernovaRemnantShellSample =
    computed(
      () =>
        this
          .supernovaRemnantShellSamples[
            this
              .selectedSupernovaRemnantShellSampleIndex()
          ],
    );

  readonly selectedSupernovaRemnantPlerionSample =
    computed(
      () =>
        this
          .supernovaRemnantPlerionSamples[
            this
              .selectedSupernovaRemnantPlerionSampleIndex()
          ],
    );

  readonly selectedSupernovaRemnantCompositeSample =
    computed(
      () =>
        this
          .supernovaRemnantCompositeSamples[
            this
              .selectedSupernovaRemnantCompositeSampleIndex()
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

  readonly isDarkNebulaSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this
          .selectedObjectCaseId() ===
          GalacticObjectLaboratoryCaseId
            .NEBULA_DARK,
    );

  readonly isPlanetaryNebulaSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this
          .selectedObjectCaseId() ===
          GalacticObjectLaboratoryCaseId
            .NEBULA_PLANETARY,
    );

  readonly isHiiLowSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this
          .selectedObjectCaseId() ===
          GalacticObjectLaboratoryCaseId
            .HII_LOW,
    );

  readonly isHiiModerateSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this
          .selectedObjectCaseId() ===
          GalacticObjectLaboratoryCaseId
            .HII_MODERATE,
    );

  readonly isHiiHighSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this
          .selectedObjectCaseId() ===
          GalacticObjectLaboratoryCaseId
            .HII_HIGH,
    );

  readonly isHiiIntenseSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this
          .selectedObjectCaseId() ===
          GalacticObjectLaboratoryCaseId
            .HII_INTENSE,
    );


  readonly isOpenClusterSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this
          .selectedObjectCaseId() ===
          GalacticObjectLaboratoryCaseId
            .OPEN_CLUSTER,
    );

  readonly isGlobularClusterSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this
          .selectedObjectCaseId() ===
          GalacticObjectLaboratoryCaseId
            .GLOBULAR_CLUSTER,
    );

  readonly isSupernovaRemnantShellSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this
          .selectedObjectCaseId() ===
          GalacticObjectLaboratoryCaseId
            .SNR_SHELL,
    );

  readonly isSupernovaRemnantPlerionSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this
          .selectedObjectCaseId() ===
          GalacticObjectLaboratoryCaseId
            .SNR_PLERION,
    );

  readonly isSupernovaRemnantCompositeSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this
          .selectedObjectCaseId() ===
          GalacticObjectLaboratoryCaseId
            .SNR_COMPOSITE,
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
            this
              .selectedDarkNebulaSampleIndex(),
            this
              .selectedPlanetaryNebulaSampleIndex(),
            this
              .selectedHiiLowSampleIndex(),
            this
              .selectedHiiModerateSampleIndex(),
            this
              .selectedHiiHighSampleIndex(),
            this
              .selectedHiiIntenseSampleIndex(),
            this
              .selectedOpenClusterSampleIndex(),
            this
              .selectedGlobularClusterSampleIndex(),
            this
              .selectedSupernovaRemnantShellSampleIndex(),
            this
              .selectedSupernovaRemnantPlerionSampleIndex(),
            this
              .selectedSupernovaRemnantCompositeSampleIndex(),
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
            this
              .selectedDarkNebulaSampleIndex(),
            this
              .selectedPlanetaryNebulaSampleIndex(),
            this
              .selectedHiiLowSampleIndex(),
            this
              .selectedHiiModerateSampleIndex(),
            this
              .selectedHiiHighSampleIndex(),
            this
              .selectedHiiIntenseSampleIndex(),
            this
              .selectedOpenClusterSampleIndex(),
            this
              .selectedGlobularClusterSampleIndex(),
            this
              .selectedSupernovaRemnantShellSampleIndex(),
            this
              .selectedSupernovaRemnantPlerionSampleIndex(),
            this
              .selectedSupernovaRemnantCompositeSampleIndex(),
          ),
    );

  readonly nuclearFrame =
    computed(
      () =>
        GalacticNucleusLaboratoryFixtures
          .frame(
            this
              .selectedNuclearCaseId(),
            this
              .selectedQuiescentNucleusSampleIndex(),
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

  readonly isQuiescentNucleusSelected =
    computed(
      () =>
        this.isNucleusView() &&
        this.selectedNuclearCaseId() ===
          GalacticNucleusLaboratoryCaseId
            .QUIESCENT,
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

  selectDarkNebulaSample(
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
          .darkNebulaSamples
          .length
    ) {
      throw new RangeError(
        `Unsupported dark-nebula sample index: ${sampleIndex}.`,
      );
    }

    this
      .selectedDarkNebulaSampleIndex
      .set(
        sampleIndex,
      );

    this
      .selectedObjectCaseId
      .set(
        GalacticObjectLaboratoryCaseId
          .NEBULA_DARK,
      );

    this
      .view
      .set(
        LaboratoryView
          .OBJECT,
      );
  }

  selectPlanetaryNebulaSample(
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
          .planetaryNebulaSamples
          .length
    ) {
      throw new RangeError(
        `Unsupported planetary-nebula sample index: ${sampleIndex}.`,
      );
    }

    this
      .selectedPlanetaryNebulaSampleIndex
      .set(
        sampleIndex,
      );

    this
      .selectedObjectCaseId
      .set(
        GalacticObjectLaboratoryCaseId
          .NEBULA_PLANETARY,
      );

    this
      .view
      .set(
        LaboratoryView
          .OBJECT,
      );
  }

  selectHiiLowSample(
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
          .hiiLowSamples
          .length
    ) {
      throw new RangeError(
        `Unsupported LOW H II laboratory sample index: ${sampleIndex}.`,
      );
    }

    this
      .selectedHiiLowSampleIndex
      .set(
        sampleIndex,
      );

    this
      .selectedObjectCaseId
      .set(
        GalacticObjectLaboratoryCaseId
          .HII_LOW,
      );

    this
      .view
      .set(
        LaboratoryView
          .OBJECT,
      );
  }

  selectHiiModerateSample(
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
          .hiiModerateSamples
          .length
    ) {
      throw new RangeError(
        `Unsupported MODERATE H II laboratory sample index: ${sampleIndex}.`,
      );
    }

    this
      .selectedHiiModerateSampleIndex
      .set(
        sampleIndex,
      );

    this
      .selectedObjectCaseId
      .set(
        GalacticObjectLaboratoryCaseId
          .HII_MODERATE,
      );

    this
      .view
      .set(
        LaboratoryView
          .OBJECT,
      );
  }

  selectHiiHighSample(
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
          .hiiHighSamples
          .length
    ) {
      throw new RangeError(
        `Unsupported HIGH H II laboratory sample index: ${sampleIndex}.`,
      );
    }

    this
      .selectedHiiHighSampleIndex
      .set(
        sampleIndex,
      );

    this
      .selectedObjectCaseId
      .set(
        GalacticObjectLaboratoryCaseId
          .HII_HIGH,
      );

    this
      .view
      .set(
        LaboratoryView
          .OBJECT,
      );
  }

  selectHiiIntenseSample(
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
          .hiiIntenseSamples
          .length
    ) {
      throw new RangeError(
        `Unsupported INTENSE H II laboratory sample index: ${sampleIndex}.`,
      );
    }

    this
      .selectedHiiIntenseSampleIndex
      .set(
        sampleIndex,
      );

    this
      .selectedObjectCaseId
      .set(
        GalacticObjectLaboratoryCaseId
          .HII_INTENSE,
      );

    this
      .view
      .set(
        LaboratoryView
          .OBJECT,
      );
  }

  selectOpenClusterSample(
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
          .openClusterSamples
          .length
    ) {
      throw new RangeError(
        `Unsupported open-cluster laboratory sample index: ${sampleIndex}.`,
      );
    }

    this
      .selectedOpenClusterSampleIndex
      .set(
        sampleIndex,
      );

    this
      .selectedObjectCaseId
      .set(
        GalacticObjectLaboratoryCaseId
          .OPEN_CLUSTER,
      );

    this
      .view
      .set(
        LaboratoryView
          .OBJECT,
      );
  }

  selectGlobularClusterSample(
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
          .globularClusterSamples
          .length
    ) {
      throw new RangeError(
        `Unsupported globular-cluster laboratory sample index: ${sampleIndex}.`,
      );
    }

    this
      .selectedGlobularClusterSampleIndex
      .set(
        sampleIndex,
      );

    this
      .selectedObjectCaseId
      .set(
        GalacticObjectLaboratoryCaseId
          .GLOBULAR_CLUSTER,
      );

    this
      .view
      .set(
        LaboratoryView
          .OBJECT,
      );
  }

  selectSupernovaRemnantShellSample(
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
          .supernovaRemnantShellSamples
          .length
    ) {
      throw new RangeError(
        `Unsupported SHELL supernova-remnant sample index: ${sampleIndex}.`,
      );
    }

    this
      .selectedSupernovaRemnantShellSampleIndex
      .set(
        sampleIndex,
      );

    this
      .selectedObjectCaseId
      .set(
        GalacticObjectLaboratoryCaseId
          .SNR_SHELL,
      );

    this
      .view
      .set(
        LaboratoryView
          .OBJECT,
      );
  }

  selectSupernovaRemnantPlerionSample(
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
          .supernovaRemnantPlerionSamples
          .length
    ) {
      throw new RangeError(
        `Unsupported PLERION supernova-remnant sample index: ${sampleIndex}.`,
      );
    }

    this
      .selectedSupernovaRemnantPlerionSampleIndex
      .set(
        sampleIndex,
      );

    this
      .selectedObjectCaseId
      .set(
        GalacticObjectLaboratoryCaseId
          .SNR_PLERION,
      );

    this
      .view
      .set(
        LaboratoryView
          .OBJECT,
      );
  }

  selectSupernovaRemnantCompositeSample(
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
          .supernovaRemnantCompositeSamples
          .length
    ) {
      throw new RangeError(
        `Unsupported COMPOSITE supernova-remnant sample index: ${sampleIndex}.`,
      );
    }

    this
      .selectedSupernovaRemnantCompositeSampleIndex
      .set(
        sampleIndex,
      );

    this
      .selectedObjectCaseId
      .set(
        GalacticObjectLaboratoryCaseId
          .SNR_COMPOSITE,
      );

    this
      .view
      .set(
        LaboratoryView
          .OBJECT,
      );
  }

  selectQuiescentNucleusSample(
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
          .quiescentNucleusSamples
          .length
    ) {
      throw new RangeError(
        `Unsupported quiescent nucleus sample index: ${sampleIndex}.`,
      );
    }

    this
      .selectedQuiescentNucleusSampleIndex
      .set(
        sampleIndex,
      );

    this
      .selectedNuclearCaseId
      .set(
        GalacticNucleusLaboratoryCaseId
          .QUIESCENT,
      );

    this
      .view
      .set(
        LaboratoryView
          .NUCLEUS,
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
