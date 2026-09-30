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
  EXTREME_TYPE_CATALOGUE,
} from '../../../domain/galactic-object/extreme-object-type';

import {
  GalacticMapScene,
} from '../../galaxy-map/galactic-map-scene';

import {
  AgnNucleusRender,
} from './agn-nucleus-render';

import {
  QuiescentNucleusRender,
} from './quiescent-nucleus-render';

import {
  QuasarNucleusRender,
} from './quasar-nucleus-render';

import {
  NeutronStarLaboratoryRender,
} from './neutron-star-laboratory-render';

import { BlackHoleLaboratoryRender } from './black-hole-laboratory-render';
import {
  BLACK_HOLE_LABORATORY_TYPES,
  blackHoleLaboratoryModel,
  blackHoleLaboratorySamples,
  type BlackHoleLaboratoryKind,
} from './black-hole-laboratory-render-model';

import {
  NEUTRON_STAR_LABORATORY_TYPES,
  neutronStarLaboratoryModel,
  neutronStarLaboratorySamples,
  type NeutronStarLaboratoryKind,
} from './neutron-star-laboratory-render-model';

import {
  GalacticObjectProceduralRender,
} from '../../genesis-archive/galactic-object-procedural-render';
import { CompactObjectScientificRender } from '../../genesis-archive/compact-object-scientific-render';
import { compactObjectScientificVisual } from '../../genesis-archive/compact-object-scientific-visual';

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
    AgnNucleusRender,
    QuasarNucleusRender,
    QuiescentNucleusRender,
    NeutronStarLaboratoryRender,
    BlackHoleLaboratoryRender,
    GalacticObjectProceduralRender,
    CompactObjectScientificRender,
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
  /** 28.2F.1 taxonomy only: no generation, persistence or Ground Truth assignment. */
  readonly extremeTaxonomy =
    EXTREME_TYPE_CATALOGUE;

  /** Presentation-only exemplars: NEVER generated celestial objects or discoveries. */
  readonly compactDiagramExamples = Object.freeze([
    compactObjectScientificVisual('BLACK_HOLE'),
    compactObjectScientificVisual('NEUTRON_STAR'),
    compactObjectScientificVisual('PULSAR'),
    compactObjectScientificVisual('MAGNETAR'),
  ]);

  /** 28.2F.2 read-only laboratory classes. These are not generated discoveries. */
  readonly neutronStarLaboratoryTypes = NEUTRON_STAR_LABORATORY_TYPES;

  readonly selectedNeutronStarType = signal<NeutronStarLaboratoryKind>('NEUTRON_STAR');
  readonly selectedNeutronStarSampleIndex = signal(0);

  readonly neutronStarLaboratorySamples = computed(() =>
    neutronStarLaboratorySamples(this.selectedNeutronStarType()),
  );

  readonly selectedNeutronStarLaboratoryModel = computed(() =>
    neutronStarLaboratoryModel(
      this.selectedNeutronStarType(),
      this.selectedNeutronStarSampleIndex(),
    ),
  );

  selectNeutronStarLaboratoryType(type: NeutronStarLaboratoryKind): void {
    if (!NEUTRON_STAR_LABORATORY_TYPES.includes(type)) {
      throw new RangeError(`Unsupported neutron-star laboratory type: ${type}.`);
    }
    this.selectedNeutronStarType.set(type);
    this.selectedNeutronStarSampleIndex.set(0);
  }

  selectNeutronStarLaboratorySample(sampleIndex: number): void {
    if (!Number.isInteger(sampleIndex) || sampleIndex < 0 || sampleIndex >= 8) {
      throw new RangeError(`Unsupported neutron-star laboratory sample index: ${sampleIndex}.`);
    }
    this.selectedNeutronStarSampleIndex.set(sampleIndex);
  }

  neutronStarTypeLabel(type: NeutronStarLaboratoryKind): string {
    return neutronStarLaboratoryModel(type, 0).label;
  }

  /** 28.2F.3 read-only black-hole laboratory classes. */
  readonly blackHoleLaboratoryTypes = BLACK_HOLE_LABORATORY_TYPES;
  readonly selectedBlackHoleType = signal<BlackHoleLaboratoryKind>('STELLAR_MASS_BLACK_HOLE');
  readonly selectedBlackHoleSampleIndex = signal(0);
  readonly blackHoleLaboratorySamples = computed(() => blackHoleLaboratorySamples(this.selectedBlackHoleType()));
  readonly selectedBlackHoleLaboratoryModel = computed(() => blackHoleLaboratoryModel(this.selectedBlackHoleType(), this.selectedBlackHoleSampleIndex()));

  selectBlackHoleLaboratoryType(type: BlackHoleLaboratoryKind): void {
    if (!BLACK_HOLE_LABORATORY_TYPES.includes(type)) throw new RangeError(`Unsupported black-hole laboratory type: ${type}.`);
    this.selectedBlackHoleType.set(type); this.selectedBlackHoleSampleIndex.set(0);
  }
  selectBlackHoleLaboratorySample(sampleIndex: number): void {
    if (!Number.isInteger(sampleIndex) || sampleIndex < 0 || sampleIndex >= 8) throw new RangeError(`Unsupported black-hole laboratory sample index: ${sampleIndex}.`);
    this.selectedBlackHoleSampleIndex.set(sampleIndex);
  }
  blackHoleTypeLabel(type: BlackHoleLaboratoryKind): string { return blackHoleLaboratoryModel(type, 0).label; }


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

  /*
   * Laboratory fixture discovery can scan thousands of procedural targets.
   * Keep each A-H family lazy so opening the default emission-nebula view does
   * not eagerly discover every hidden object and nucleus family. The fixture
   * providers already memoize their results, so repeated getter access after a
   * family is first shown is effectively free.
   */
  get quiescentNucleusSamples() {
    return GalacticNucleusLaboratoryFixtures
      .quiescentSamples();
  }

  get agnNucleusSamples() {
    return GalacticNucleusLaboratoryFixtures
      .agnSamples();
  }

  get quasarNucleusSamples() {
    return GalacticNucleusLaboratoryFixtures
      .quasarSamples();
  }

  get emissionNebulaSamples() {
    return GalacticObjectLaboratoryFixtures
      .emissionNebulaSamples();
  }

  get reflectionNebulaSamples() {
    return GalacticObjectLaboratoryFixtures
      .reflectionNebulaSamples();
  }

  get darkNebulaSamples() {
    return GalacticObjectLaboratoryFixtures
      .darkNebulaSamples();
  }

  get planetaryNebulaSamples() {
    return GalacticObjectLaboratoryFixtures
      .planetaryNebulaSamples();
  }

  get hiiLowSamples() {
    return GalacticObjectLaboratoryFixtures
      .hiiLowSamples();
  }

  get hiiModerateSamples() {
    return GalacticObjectLaboratoryFixtures
      .hiiModerateSamples();
  }

  get hiiHighSamples() {
    return GalacticObjectLaboratoryFixtures
      .hiiHighSamples();
  }

  get hiiIntenseSamples() {
    return GalacticObjectLaboratoryFixtures
      .hiiIntenseSamples();
  }

  get openClusterSamples() {
    return GalacticObjectLaboratoryFixtures
      .openClusterSamples();
  }

  get globularClusterSamples() {
    return GalacticObjectLaboratoryFixtures
      .globularClusterSamples();
  }

  get supernovaRemnantShellSamples() {
    return GalacticObjectLaboratoryFixtures
      .supernovaRemnantShellSamples();
  }

  get supernovaRemnantPlerionSamples() {
    return GalacticObjectLaboratoryFixtures
      .supernovaRemnantPlerionSamples();
  }

  get supernovaRemnantCompositeSamples() {
    return GalacticObjectLaboratoryFixtures
      .supernovaRemnantCompositeSamples();
  }

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

  readonly selectedAgnNucleusSampleIndex =
    signal(
      0,
    );

  readonly selectedQuasarNucleusSampleIndex =
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
            this
              .selectedAgnNucleusSampleIndex(),
            this
              .selectedQuasarNucleusSampleIndex(),
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

  readonly isAgnNucleusSelected =
    computed(
      () =>
        this.isNucleusView() &&
        this.selectedNuclearCaseId() ===
          GalacticNucleusLaboratoryCaseId
            .AGN,
    );

  readonly isQuasarNucleusSelected =
    computed(
      () =>
        this.isNucleusView() &&
        this.selectedNuclearCaseId() ===
          GalacticNucleusLaboratoryCaseId
            .QUASAR,
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

  selectAgnNucleusSample(
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
          .agnNucleusSamples
          .length
    ) {
      throw new RangeError(
        `Unsupported AGN nucleus sample index: ${sampleIndex}.`,
      );
    }

    this
      .selectedAgnNucleusSampleIndex
      .set(
        sampleIndex,
      );

    this
      .selectedNuclearCaseId
      .set(
        GalacticNucleusLaboratoryCaseId
          .AGN,
      );

    this
      .view
      .set(
        LaboratoryView
          .NUCLEUS,
      );
  }

  selectQuasarNucleusSample(
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
          .quasarNucleusSamples
          .length
    ) {
      throw new RangeError(
        `Unsupported QUASAR nucleus sample index: ${sampleIndex}.`,
      );
    }

    this
      .selectedQuasarNucleusSampleIndex
      .set(
        sampleIndex,
      );

    this
      .selectedNuclearCaseId
      .set(
        GalacticNucleusLaboratoryCaseId
          .QUASAR,
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
