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
  type PlanetaryFormationAnchor,
} from '../../../domain/planetary/planetary-formation-anchor';

import {
  type ProtoplanetCandidate,
} from '../../../domain/planetary/protoplanet-candidate';

import {
  ProtoplanetCandidateComposition,
  type ProtoplanetCandidateCompositionName,
} from '../../../domain/planetary/protoplanet-candidate-composition';

import {
  type EarlyProtoplanetBody,
} from '../../../domain/planetary/early-protoplanet-body';

import {
  type EarlyProtoplanetCollision,
} from '../../../domain/planetary/early-protoplanet-collision';

import {
  type ProtoplanetaryCondensationRegion,
} from '../../../domain/planetary/protoplanetary-condensation-region';

import {
  type ProtoplanetaryDiskGap,
} from '../../../domain/planetary/protoplanetary-disk-gap';

import {
  PlanetaryFormationLaboratoryFamilyId,
  PlanetaryFormationLaboratoryFixtures,
  PLANETARY_FORMATION_LABORATORY_FAMILIES,
} from './planetary-formation-laboratory-fixtures';

export const PlanetaryFormationLaboratoryStageId =
  Object.freeze({
    STAR:
      '17.1',
    DISK:
      '17.2',
    STRUCTURE:
      '17.3',
    CANDIDATES:
      '17.4',
    DYNAMICS:
      '17.5',
    ANALYSIS:
      '17.6',
    MATURATION:
      '17.7',
  } as const);

export type PlanetaryFormationLaboratoryStageId =
  typeof PlanetaryFormationLaboratoryStageId[
    keyof typeof PlanetaryFormationLaboratoryStageId
  ];

interface LaboratoryStage {
  readonly id:
    PlanetaryFormationLaboratoryStageId;

  readonly shortLabel:
    string;

  readonly title:
    string;
}

interface VisualPoint {
  readonly x:
    number;

  readonly y:
    number;

  readonly radius:
    number;

  readonly color:
    string;

  readonly label:
    string;

  readonly shortLabel:
    string;

  readonly sourceOrdinals:
    readonly number[];
}

interface MigrationVisual {
  readonly x1:
    number;

  readonly y1:
    number;

  readonly x2:
    number;

  readonly y2:
    number;

  readonly color:
    string;

  readonly label:
    string;

  readonly shortLabel:
    string;

  readonly sourceOrdinals:
    readonly number[];

  readonly hasMigrated:
    boolean;
}

interface FusionConnectorVisual {
  readonly x1:
    number;

  readonly y1:
    number;

  readonly x2:
    number;

  readonly y2:
    number;
}

interface FusionVisual extends VisualPoint {
  readonly eventOrdinal:
    number;

  readonly connectors:
    readonly FusionConnectorVisual[];
}

interface RingVisual {
  readonly rx:
    number;

  readonly ry:
    number;

  readonly width:
    number;

  readonly label:
    string;

  readonly code:
    string;

  readonly color:
    string;

  readonly labelX:
    number;

  readonly labelY:
    number;
}

interface SnowLineVisual {
  readonly rx:
    number;

  readonly ry:
    number;

  readonly label:
    string;

  readonly labelX:
    number;

  readonly labelY:
    number;
}

const VIEWBOX_CENTER_X =
  360;

const VIEWBOX_CENTER_Y =
  220;

const DISK_INNER_VISUAL_RADIUS =
  42;

const DISK_OUTER_VISUAL_RADIUS =
  270;

const DISK_VERTICAL_SCALE =
  0.52;

const GOLDEN_ANGLE_RADIANS =
  2.399_963_229_728_653;

@Component({
  selector:
    'app-planetary-formation-laboratory',

  standalone:
    true,

  imports: [
    RouterLink,
  ],

  templateUrl:
    './planetary-formation-laboratory.html',

  styleUrls: [
    './planetary-formation-laboratory.scss',
    './planetary-formation-laboratory-diagram.scss',
    './planetary-formation-laboratory-readout.scss',
  ],

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class PlanetaryFormationLaboratoryPage {

  readonly Math =
    Math;

  readonly families =
    PLANETARY_FORMATION_LABORATORY_FAMILIES;

  readonly stages:
    readonly LaboratoryStage[] =
    Object.freeze([
      stage('17.1', 'ESTRELLA JOVEN', 'Estrella joven'),
      stage('17.2', 'DISCO', 'Disco protoplanetario'),
      stage('17.3', 'ESTRUCTURA', 'Gas, polvo, condensación y huecos'),
      stage('17.4', 'CANDIDATOS', 'Candidatos protoplanetarios'),
      stage('17.5', 'DINÁMICA', 'Migración y colisiones tempranas'),
      stage('17.6', 'ANALIZAR', 'Lectura científica del disco'),
      stage('17.7', 'MADURACIÓN', 'Anclas de formación maduras'),
    ]);

  readonly selectedFamilyId =
    signal<PlanetaryFormationLaboratoryFamilyId | null>(
      null,
    );

  readonly selectedStageId =
    signal<PlanetaryFormationLaboratoryStageId>(
      PlanetaryFormationLaboratoryStageId.STAR,
    );

  readonly selectedLineage =
    signal<readonly number[] | null>(
      null,
    );

  readonly frame =
    computed(
      () => {
        const familyId =
          this.selectedFamilyId();

        return familyId ===
          null
          ? null
          : PlanetaryFormationLaboratoryFixtures
              .frame(
                familyId,
              );
      },
    );

  readonly selectedStage =
    computed(
      () =>
        this.stages.find(
          value =>
            value.id ===
            this.selectedStageId(),
        ) ??
        this.stages[0]!,
    );

  readonly condensationRings =
    computed<readonly RingVisual[]>(
      () => {
        const frame =
          this.frame();

        if (
          frame ===
          null
        ) {
          return [];
        }

        return frame
          .snapshot
          .diskStructure
          .condensationRegions
          .map(
            (
              region,
              index,
            ) =>
              this.condensationRing(
                region,
                index,
              ),
          );
      },
    );

  readonly gapRings =
    computed<readonly RingVisual[]>(
      () => {
        const frame =
          this.frame();

        if (
          frame ===
          null
        ) {
          return [];
        }

        return frame
          .snapshot
          .diskStructure
          .gaps
          .map(
            (
              gap,
              index,
            ) =>
              this.gapRing(
                gap,
                index,
              ),
          );
      },
    );

  readonly snowLineVisual =
    computed<SnowLineVisual | null>(
      () => {
        const frame =
          this.frame();

        const radiusAu =
          frame
            ?.snapshot
            .diskStructure
            .waterSnowLineRadiusAuOrNull ??
          null;

        if (
          radiusAu ===
          null
        ) {
          return null;
        }

        const radius =
          this.radialVisualRadius(
            radiusAu,
          );

        return {
          rx:
            radius,
          ry:
            radius *
            DISK_VERTICAL_SCALE,
          label:
            `Línea de nieve H₂O · ${this.formatNumber(radiusAu, 2)} AU`,
          labelX:
            VIEWBOX_CENTER_X -
            radius *
              0.72,
          labelY:
            VIEWBOX_CENTER_Y -
            radius *
              DISK_VERTICAL_SCALE *
              0.68,
        };
      },
    );

  readonly candidatePoints =
    computed<readonly VisualPoint[]>(
      () => {
        const frame =
          this.frame();

        if (
          frame ===
          null
        ) {
          return [];
        }

        return frame
          .snapshot
          .candidatePopulation
          .candidates
          .map(
            candidate =>
              this.candidatePoint(
                candidate,
              ),
          );
      },
    );

  readonly migrationVisuals =
    computed<readonly MigrationVisual[]>(
      () => {
        const frame =
          this.frame();

        if (
          frame ===
          null
        ) {
          return [];
        }

        return frame
          .snapshot
          .earlyDynamics
          .bodies
          .map(
            body =>
              this.migrationVisual(
                body,
              ),
          );
      },
    );

  readonly survivorPoints =
    computed<readonly VisualPoint[]>(
      () => {
        const frame =
          this.frame();

        if (
          frame ===
          null
        ) {
          return [];
        }

        return frame
          .snapshot
          .earlyDynamics
          .bodies
          .map(
            body =>
              this.survivorPoint(
                body,
              ),
          );
      },
    );

  readonly fusionVisuals =
    computed<readonly FusionVisual[]>(
      () => {
        const frame =
          this.frame();

        if (
          frame ===
          null
        ) {
          return [];
        }

        return frame
          .snapshot
          .earlyDynamics
          .collisions
          .map(
            collision =>
              this.fusionVisual(
                collision,
              ),
          );
      },
    );

  readonly anchorPoints =
    computed<readonly VisualPoint[]>(
      () => {
        const frame =
          this.frame();

        if (
          frame ===
          null
        ) {
          return [];
        }

        return frame
          .blueprint
          .formationAnchors
          .map(
            anchor =>
              this.anchorPoint(
                anchor,
              ),
          );
      },
    );

  selectFamily(
    familyId:
      PlanetaryFormationLaboratoryFamilyId,
  ): void {

    this.selectedFamilyId.set(
      familyId,
    );

    this.selectedStageId.set(
      PlanetaryFormationLaboratoryStageId.STAR,
    );

    this.selectedLineage.set(
      null,
    );
  }

  selectStage(
    stageId:
      PlanetaryFormationLaboratoryStageId,
  ): void {

    this.selectedStageId.set(
      stageId,
    );
  }

  stageAtLeast(
    stageId:
      PlanetaryFormationLaboratoryStageId,
  ): boolean {

    return this.stageOrdinal(
      this.selectedStageId(),
    ) >=
      this.stageOrdinal(
        stageId,
      );
  }

  stageIs(
    stageId:
      PlanetaryFormationLaboratoryStageId,
  ): boolean {

    return this.selectedStageId() ===
      stageId;
  }

  selectLineage(
    ordinals:
      readonly number[],
  ): void {

    const current =
      this.selectedLineage();

    if (
      current !==
        null &&
      sameLineage(
        current,
        ordinals,
      )
    ) {
      this.selectedLineage.set(
        null,
      );

      return;
    }

    this.selectedLineage.set(
      Object.freeze([
        ...ordinals,
      ]),
    );
  }

  isLineageSelected(
    ordinals:
      readonly number[],
  ): boolean {

    const selected =
      this.selectedLineage();

    return (
      selected !==
        null &&
      sameLineage(
        selected,
        ordinals,
      )
    );
  }

  isLineageDimmed(
    ordinals:
      readonly number[],
  ): boolean {

    const selected =
      this.selectedLineage();

    return (
      selected !==
        null &&
      !lineagesIntersect(
        selected,
        ordinals,
      )
    );
  }

  migrationDirectionLabel(
    value:
      string,
  ): string {

    return ({
      NONE:
        'SIN MIGRACIÓN',
      INWARD:
        'HACIA DENTRO',
      OUTWARD:
        'HACIA FUERA',
    } as Record<string, string>)[value] ??
      value;
  }

  starVisualRadius(
    referenceRadiusMultiplier:
      number,
  ): number {

    const fullRadius =
      20 +
      Math.min(
        17,
        referenceRadiusMultiplier *
          6,
      );

    return this.stageIs(
      PlanetaryFormationLaboratoryStageId.STAR,
    )
      ? fullRadius
      : fullRadius *
          0.76;
  }

  starCoreVisualRadius():
    number {

    return this.stageIs(
      PlanetaryFormationLaboratoryStageId.STAR,
    )
      ? 8
      : 6;
  }

  formatNumber(
    value:
      number,

    fractionDigits =
      3,
  ): string {

    if (
      value ===
      0
    ) {
      return '0';
    }

    if (
      Math.abs(
        value,
      ) <
        0.001 ||
      Math.abs(
        value,
      ) >=
        100_000
    ) {
      return value
        .toExponential(
          2,
        );
    }

    return value
      .toLocaleString(
        'es-ES',
        {
          maximumFractionDigits:
            fractionDigits,
        },
      );
  }

  percent(
    value:
      number,
  ): string {

    return `${this.formatNumber(value * 100, 1)} %`;
  }

  youthStageLabel(
    name:
      string,
  ): string {

    return ({
      PROTOSTAR:
        'Protoestrella',
      PRE_MAIN_SEQUENCE:
        'Presecuencia principal',
      YOUNG_STAR:
        'Estrella joven',
      YOUNG_BROWN_DWARF:
        'Enana marrón joven',
    } as Record<string, string>)[name] ??
      name;
  }

  diskStageLabel(
    name:
      string,
  ): string {

    return ({
      EMBEDDED_ACCRETION_DISK:
        'Disco de acreción embebido',
      MASSIVE_PRIMORDIAL_DISK:
        'Disco primordial masivo',
      EVOLVING_PRIMORDIAL_DISK:
        'Disco primordial en evolución',
      DISPERSING_DISK:
        'Disco en dispersión',
    } as Record<string, string>)[name] ??
      name;
  }

  maturityRegimeLabel(
    value:
      string,
  ): string {

    return ({
      NO_PLANET_FORMING_CORES:
        'Sin núcleos formadores',
      SOLID_CORE_SYSTEM:
        'Sistema de núcleos sólidos',
      VOLATILE_RICH_CORE_SYSTEM:
        'Núcleos ricos en volátiles',
      GAS_ENVELOPE_FAVORED:
        'Envoltura gaseosa favorecida',
      DYNAMICALLY_REWORKED:
        'Sistema reelaborado dinámicamente',
    } as Record<string, string>)[value] ??
      value;
  }

  compositionLabel(
    name:
      string,
  ): string {

    return ({
      REFRACTORY_RICH:
        'Refractario',
      ROCKY:
        'Rocoso',
      ICE_RICH:
        'Rico en hielo',
      VOLATILE_RICH:
        'Rico en volátiles',
    } as Record<string, string>)[name] ??
      name;
  }

  condensationLabel(
    name:
      string,
  ): string {

    return ({
      DUST_SUBLIMATION_ZONE:
        'Sublimación de polvo',
      REFRACTORY_SOLIDS:
        'Sólidos refractarios',
      ROCKY_SILICATE_SOLIDS:
        'Silicatos rocosos',
      WATER_ICE_RICH_SOLIDS:
        'Hielo de agua',
      CO2_ICE_RICH_SOLIDS:
        'Hielo de CO₂',
      VOLATILE_ICE_RICH_SOLIDS:
        'Hielos volátiles',
    } as Record<string, string>)[name] ??
      name;
  }

  gapLabel(
    name:
      string,
  ): string {

    return ({
      VISCOSITY_TRANSITION_GAP:
        'Transición de viscosidad',
      CONDENSATION_FRONT_DEPLETION_GAP:
        'Frente de condensación',
      PHOTOEVAPORATIVE_GAP:
        'Fotoevaporación',
    } as Record<string, string>)[name] ??
      name;
  }

  private stageOrdinal(
    stageId:
      PlanetaryFormationLaboratoryStageId,
  ): number {

    return this.stages.findIndex(
      stageValue =>
        stageValue.id ===
        stageId,
    );
  }

  private radialVisualRadius(
    radiusAu:
      number,
  ): number {

    const frame =
      this.frame();

    if (
      frame ===
      null
    ) {
      return DISK_INNER_VISUAL_RADIUS;
    }

    const disk =
      frame
        .snapshot
        .diskProfile;

    const safeInner =
      Math.max(
        disk.innerRadiusAu,
        1e-6,
      );

    const safeRadius =
      Math.max(
        radiusAu,
        safeInner,
      );

    const normalized =
      Math.max(
        0,
        Math.min(
          1,
          Math.log(
            safeRadius /
              safeInner,
          ) /
            Math.log(
              disk.outerRadiusAu /
                safeInner,
            ),
        ),
      );

    return DISK_INNER_VISUAL_RADIUS +
      normalized *
        (
          DISK_OUTER_VISUAL_RADIUS -
          DISK_INNER_VISUAL_RADIUS
        );
  }

  private pointAt(
    radiusAu:
      number,

    ordinal:
      number,
  ): {
    readonly x:
      number;

    readonly y:
      number;
  } {

    const radius =
      this.radialVisualRadius(
        radiusAu,
      );

    const angle =
      ordinal *
        GOLDEN_ANGLE_RADIANS +
      0.37;

    return {
      x:
        VIEWBOX_CENTER_X +
        Math.cos(
          angle,
        ) *
          radius,
      y:
        VIEWBOX_CENTER_Y +
        Math.sin(
          angle,
        ) *
          radius *
          DISK_VERTICAL_SCALE,
    };
  }

  private condensationRing(
    region:
      ProtoplanetaryCondensationRegion,

    index:
      number,
  ): RingVisual {

    const inner =
      this.radialVisualRadius(
        region.innerRadiusAu,
      );

    const outer =
      this.radialVisualRadius(
        region.outerRadiusAu,
      );

    const radius =
      (
        inner +
        outer
      ) /
      2;

    const labelAngle =
      -0.68;

    return {
      rx:
        radius,
      ry:
        radius *
        DISK_VERTICAL_SCALE,
      width:
        Math.max(
          2,
          outer -
            inner,
        ),
      label:
        this.condensationLabel(
          region.kind.name,
        ),
      code:
        `R${index + 1}`,
      color:
        condensationColor(
          region.kind.name,
        ),
      labelX:
        VIEWBOX_CENTER_X +
        Math.cos(
          labelAngle,
        ) *
          radius,
      labelY:
        VIEWBOX_CENTER_Y +
        Math.sin(
          labelAngle,
        ) *
          radius *
          DISK_VERTICAL_SCALE,
    };
  }

  private gapRing(
    gap:
      ProtoplanetaryDiskGap,

    index:
      number,
  ): RingVisual {

    const inner =
      this.radialVisualRadius(
        gap.innerRadiusAu,
      );

    const outer =
      this.radialVisualRadius(
        gap.outerRadiusAu,
      );

    const radius =
      (
        inner +
        outer
      ) /
      2;

    const labelAngle =
      0.72;

    return {
      rx:
        radius,
      ry:
        radius *
        DISK_VERTICAL_SCALE,
      width:
        Math.max(
          3,
          outer -
            inner,
        ),
      label:
        this.gapLabel(
          gap.kind.name,
        ),
      code:
        `G${index + 1}`,
      color:
        '#ff8e6a',
      labelX:
        VIEWBOX_CENTER_X +
        Math.cos(
          labelAngle,
        ) *
          radius,
      labelY:
        VIEWBOX_CENTER_Y +
        Math.sin(
          labelAngle,
        ) *
          radius *
          DISK_VERTICAL_SCALE,
    };
  }

  private candidatePoint(
    candidate:
      ProtoplanetCandidate,
  ): VisualPoint {

    const point =
      this.pointAt(
        candidate.orbitalRadiusAu,
        candidate.formationOrdinal,
      );

    return {
      ...point,
      radius:
        visualMassRadius(
          candidate.solidMassEarth,
          4,
          10,
        ),
      color:
        compositionColor(
          candidate.composition.name,
        ),
      label:
        `#${candidate.formationOrdinal} · ${this.compositionLabel(candidate.composition.name)} · ${this.formatNumber(candidate.solidMassEarth, 2)} M⊕`,
      shortLabel:
        `#${candidate.formationOrdinal}`,
      sourceOrdinals:
        Object.freeze([
          candidate.formationOrdinal,
        ]),
    };
  }

  private migrationVisual(
    body:
      EarlyProtoplanetBody,
  ): MigrationVisual {

    const ordinal =
      body.sourceFormationOrdinals[0] ??
      1;

    const source =
      this.pointAt(
        body.formationMassWeightedRadiusAu,
        ordinal,
      );

    const destination =
      this.pointAt(
        body.orbitalRadiusAu,
        ordinal,
      );

    return {
      x1:
        source.x,
      y1:
        source.y,
      x2:
        destination.x,
      y2:
        destination.y,
      color:
        body.hasMigrated
          ? '#ffbe6a'
          : '#72839d',
      label:
        `${this.migrationDirectionLabel(body.migrationDirection)} · ${this.percent(body.migrationStrength01)}`,
      shortLabel:
        `[${body.sourceFormationOrdinals.join(',')}]`,
      sourceOrdinals:
        body.sourceFormationOrdinals,
      hasMigrated:
        body.hasMigrated,
    };
  }

  private survivorPoint(
    body:
      EarlyProtoplanetBody,
  ): VisualPoint {

    const ordinal =
      body.sourceFormationOrdinals[0] ??
      1;

    const point =
      this.pointAt(
        body.orbitalRadiusAu,
        ordinal,
      );

    return {
      ...point,
      radius:
        visualMassRadius(
          body.solidMassEarth,
          5,
          12,
        ),
      color:
        compositionColor(
          body.compositionMixture
            .dominantComposition
            .name,
        ),
      label:
        `Linaje [${body.sourceFormationOrdinals.join(',')}] · ${this.formatNumber(body.solidMassEarth, 2)} M⊕`,
      shortLabel:
        `[${body.sourceFormationOrdinals.join(',')}]`,
      sourceOrdinals:
        body.sourceFormationOrdinals,
    };
  }

  private fusionVisual(
    collision:
      EarlyProtoplanetCollision,
  ): FusionVisual {

    const ordinal =
      collision
        .participantSourceFormationOrdinals[0] ??
      collision.eventOrdinal;

    const point =
      this.pointAt(
        collision.orbitalRadiusAu,
        ordinal,
      );

    const frame =
      this.frame();

    const connectors =
      collision
        .participantSourceFormationOrdinals
        .map(
          participantOrdinal => {
            const candidate =
              frame
                ?.snapshot
                .candidatePopulation
                .candidates
                .find(
                  value =>
                    value.formationOrdinal ===
                    participantOrdinal,
                );

            const source =
              this.pointAt(
                candidate
                  ?.orbitalRadiusAu ??
                  collision.orbitalRadiusAu,
                participantOrdinal,
              );

            return {
              x1:
                source.x,
              y1:
                source.y,
              x2:
                point.x,
              y2:
                point.y,
            };
          },
        );

    return {
      ...point,
      radius:
        8 +
        collision.impactSeverity01 *
          6,
      color:
        '#ff8e6a',
      label:
        `Fusión ${collision.eventOrdinal} · linaje [${collision.participantSourceFormationOrdinals.join(',')}] · ${this.percent(collision.impactSeverity01)} · ${this.formatNumber(collision.orbitalRadiusAu, 2)} AU`,
      shortLabel:
        `F${collision.eventOrdinal}`,
      sourceOrdinals:
        collision.participantSourceFormationOrdinals,
      eventOrdinal:
        collision.eventOrdinal,
      connectors:
        Object.freeze(
          connectors,
        ),
    };
  }

  private anchorPoint(
    anchor:
      PlanetaryFormationAnchor,
  ): VisualPoint {

    const ordinal =
      anchor.sourceFormationOrdinals[0] ??
      anchor.anchorOrdinal;

    const point =
      this.pointAt(
        anchor.assemblyRadiusAu,
        ordinal,
      );

    return {
      ...point,
      radius:
        visualMassRadius(
          anchor.solidCoreMassEarth,
          7,
          14,
        ),
      color:
        compositionColor(
          anchor.compositionMixture
            .dominantComposition
            .name,
        ),
      label:
        `Ancla ${anchor.anchorOrdinal} · linaje [${anchor.sourceFormationOrdinals.join(',')}]`,
      shortLabel:
        `[${anchor.sourceFormationOrdinals.join(',')}]`,
      sourceOrdinals:
        anchor.sourceFormationOrdinals,
    };
  }

}

function stage(
  id:
    PlanetaryFormationLaboratoryStageId,

  shortLabel:
    string,

  title:
    string,
): LaboratoryStage {

  return Object.freeze({
    id,
    shortLabel,
    title,
  });
}

function compositionColor(
  composition:
    ProtoplanetCandidateCompositionName,
): string {

  if (
    composition ===
    ProtoplanetCandidateComposition.REFRACTORY_RICH.name
  ) {
    return '#f2a56b';
  }

  if (
    composition ===
    ProtoplanetCandidateComposition.ROCKY.name
  ) {
    return '#d7c2a0';
  }

  if (
    composition ===
    ProtoplanetCandidateComposition.ICE_RICH.name
  ) {
    return '#8edaf7';
  }

  return '#b9a7ff';
}

function visualMassRadius(
  massEarth:
    number,

  min:
    number,

  max:
    number,
): number {

  const compressed =
    Math.log10(
      1 +
        Math.max(
          0,
          massEarth,
        ) *
          6,
    ) /
    2.2;

  return min +
    Math.min(
      1,
      compressed,
    ) *
      (
        max -
        min
      );
}

function condensationColor(
  kindName:
    string,
): string {

  return ({
    DUST_SUBLIMATION_ZONE:
      '#ff8e6a',
    REFRACTORY_SOLIDS:
      '#f2a56b',
    ROCKY_SILICATE_SOLIDS:
      '#d7c2a0',
    WATER_ICE_RICH_SOLIDS:
      '#8edaf7',
    CO2_ICE_RICH_SOLIDS:
      '#90b8ff',
    VOLATILE_ICE_RICH_SOLIDS:
      '#b9a7ff',
  } as Record<string, string>)[kindName] ??
    '#6ad7ff';
}

function sameLineage(
  first:
    readonly number[],

  second:
    readonly number[],
): boolean {

  return (
    first.length ===
      second.length &&
    first.every(
      (
        ordinal,
        index,
      ) =>
        ordinal ===
        second[index],
    )
  );
}

function lineagesIntersect(
  first:
    readonly number[],

  second:
    readonly number[],
): boolean {

  return first.some(
    ordinal =>
      second.includes(
        ordinal,
      ),
  );
}
