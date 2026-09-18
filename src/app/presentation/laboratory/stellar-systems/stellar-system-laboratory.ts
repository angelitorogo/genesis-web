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
  PlanetType,
} from '../../../domain/planetary/planet-type';

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
  composeLaboratoryBinaryScene,
} from './stellar-system-laboratory-binary-composition';

import {
  composeLaboratoryTripleScene,
} from './stellar-system-laboratory-triple-composition';
import {
  laboratoryOrbitalSpacingProfile,
} from './stellar-system-laboratory-orbital-spacing';

import {
  STELLAR_SYSTEM_LABORATORY_CASES,
  StellarSystemLaboratoryCaseId,
  StellarSystemLaboratoryFamilyId,
  StellarSystemLaboratoryFixtures,
  type StellarSystemLaboratoryCase,
} from './stellar-system-laboratory-fixtures';

/** All nine canonical point-19.4 types, including types absent from a sample. */
const PLANET_TYPE_LABELS: Readonly<Record<PlanetType, string>> = Object.freeze({
  [PlanetType.ROCKY]: 'Rocosos',
  [PlanetType.SUPER_EARTH]: 'Supertierras',
  [PlanetType.DESERT]: 'Desérticos',
  [PlanetType.OCEAN]: 'Oceánicos',
  [PlanetType.ICE]: 'Helados',
  [PlanetType.VOLCANIC]: 'Volcánicos',
  [PlanetType.MINI_NEPTUNE]: 'Minineptunos',
  [PlanetType.GAS_GIANT]: 'Gigantes gaseosos',
  [PlanetType.ICE_GIANT]: 'Gigantes helados',
});

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

  /**
   * LAB-only hierarchy: BINARY = SINGLE A + SINGLE B.
   * TRIPLE = (SINGLE A + SINGLE B) + SINGLE C.
   */
  readonly rendererQaBaseSnapshot = computed<SystemSceneSnapshot>(() => {
    const active = this.frame();
    const caseId = this.selectedCaseId();
    if (caseId === StellarSystemLaboratoryCaseId.SINGLE) {
      return this.snapshotForFrame(active);
    }
    const sources = active.sourceSystems;
    if (sources === undefined) {
      throw new Error(`${caseId} laboratory source systems must be generated first.`);
    }
    const sourceSnapshots = sources.map(source => this.snapshotForFrame(source));
    const masses = sources.map(source => source.stages.find(stage =>
      stage.discoveryState.code === DiscoveryState.CATALOGUED.code,
    )!.card.render.components[0]?.massSolar);
    if (masses.some(mass => mass == null)) {
      throw new Error(`${caseId} component mass is absent from the generated SINGLE fiches.`);
    }
    if (caseId === StellarSystemLaboratoryCaseId.BINARY) {
      if (sourceSnapshots.length !== 2 || masses.length !== 2) {
        throw new Error('Binary laboratory generation requires exactly two SINGLE sources.');
      }
      return composeLaboratoryBinaryScene(
        sourceSnapshots[0]!,
        sourceSnapshots[1]!,
        active.family,
        [masses[0]!, masses[1]!],
      );
    }
    if (sourceSnapshots.length !== 3 || masses.length !== 3) {
      throw new Error('Triple laboratory generation requires exactly three SINGLE sources.');
    }
    return composeLaboratoryTripleScene(
      sourceSnapshots[0]!,
      sourceSnapshots[1]!,
      sourceSnapshots[2]!,
      active.family,
      [masses[0]!, masses[1]!, masses[2]!],
    );
  });

  // The renderer consumes exactly the SAME generated laboratory binary as
  // its cards/inventory. There is no separate visual redistribution pipeline.
  readonly rendererQaSnapshot = this.rendererQaBaseSnapshot;

  readonly orbitalSpacingProfile = computed(() =>
    laboratoryOrbitalSpacingProfile(this.selectedFamilyId()),
  );

  /** Physical orbital distance ranges; never the display's scene-space units. */
  readonly orbitalDistanceRanges = computed(() => this.rendererQaSnapshot().motions
    .filter(motion => motion.id === 'lab-binary-relative' ||
      motion.id === 'lab-triple-outer-relative')
    .map(motion => Object.freeze({
      id: motion.id,
      label: motion.id === 'lab-binary-relative' ? 'A–B' : '(A–B)–C',
      periastronAu: motion.semiMajorAxisAu * (1 - motion.eccentricity),
      apastronAu: motion.semiMajorAxisAu * (1 + motion.eccentricity),
    })),
  );

  private snapshotForFrame(
    frame: ReturnType<typeof StellarSystemLaboratoryFixtures.frame>,
  ): SystemSceneSnapshot {
    if (frame.caseDefinition.id !== StellarSystemLaboratoryCaseId.SINGLE) {
      throw new RangeError('Laboratory composed multiples must be assembled only from SINGLE sources.');
    }
    const previewStage = frame.stages.find(
      stage => stage.discoveryState.code === DiscoveryState.CATALOGUED.code,
    ) ?? frame.stages[frame.stages.length - 1]!;
    const generationKey = StellarSystemLaboratoryFixtures.generationKey();
    return SystemSceneSnapshotBuilder.buildFromSource({
      universeSeed: generationKey.universeSeed.serialize(),
      generatorVersionCode: generationKey.generatorVersionCode,
      locator: frame.family.locator,
      proceduralIdentity:
        `G${frame.family.locator.galaxyIndex.toString()} / S${frame.family.locator.sectorKey.toString()} / O${frame.family.locator.galacticObjectIndex.toString()}`,
      discoveryState: previewStage.discoveryState,
      discoveryStateLabel: previewStage.label,
      stellarSystemCard: previewStage.card,
      revealMinorBodyGroundTruth: true,
    });
  }

  /** Read-only breakdown from the SAME planets already used by the QA renderer. */
  readonly planetTypeCounts =
    computed(
      () => {
        const planets =
          this.rendererQaSnapshot().planets;

        return Object.values(PlanetType).map(
          type => ({
            type,
            label: PLANET_TYPE_LABELS[type],
            count: planets.filter(
              planet =>
                planet.specialPresentation?.sourcePlanetType === type,
            ).length,
          }),
        );
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
