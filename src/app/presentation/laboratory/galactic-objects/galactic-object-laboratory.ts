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
  ExtremeType,
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
import { XrayBinaryLaboratoryRender } from './xray-binary-laboratory-render';
import {
  XRAY_BINARY_LABORATORY_TYPES,
  xrayBinaryLaboratoryModel,
  xrayBinaryLaboratorySamples,
  type XrayBinaryLaboratoryKind,
  type XrayBinaryLaboratoryRenderModel,
} from './xray-binary-laboratory-render-model';
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
  type NeutronStarLaboratoryRenderModel,
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
    XrayBinaryLaboratoryRender,
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

  /**
   * 28.2F extreme discovery progression — neutron-star A-H preview.
   * This selector is laboratory-only and does not alter persisted discoveries.
   */
  readonly extremeNeutronStarDetectedVisual =
    compactObjectScientificVisual(
      'NEUTRON_STAR',
    );

  readonly extremeNeutronStarSamples =
    neutronStarLaboratorySamples(
      ExtremeType.NEUTRON_STAR,
    );

  readonly selectedExtremeNeutronStarSampleIndex =
    signal(0);

  readonly extremeNeutronStarDiscoveredModel =
    computed(
      () =>
        neutronStarProgressionModel(
          neutronStarLaboratoryModel(
            ExtremeType.NEUTRON_STAR,
            this.selectedExtremeNeutronStarSampleIndex(),
          ),
          'DISCOVERED',
        ),
    );

  readonly extremeNeutronStarCataloguedModel =
    computed(
      () =>
        neutronStarProgressionModel(
          neutronStarLaboratoryModel(
            ExtremeType.NEUTRON_STAR,
            this.selectedExtremeNeutronStarSampleIndex(),
          ),
          'CATALOGUED',
        ),
    );

  readonly extremeNeutronStarConfirmedModel =
    computed(
      () =>
        neutronStarLaboratoryModel(
          ExtremeType.NEUTRON_STAR,
          this.selectedExtremeNeutronStarSampleIndex(),
        ),
    );

  selectExtremeNeutronStarSample(
    sampleIndex:
      number,
  ): void {
    if (
      !Number.isInteger(
        sampleIndex,
      ) ||
      sampleIndex < 0 ||
      sampleIndex >=
        this.extremeNeutronStarSamples.length
    ) {
      throw new RangeError(
        `Unsupported extreme neutron-star sample index: ${sampleIndex}.`,
      );
    }

    this.selectedExtremeNeutronStarSampleIndex.set(
      sampleIndex,
    );
  }

  readonly extremePulsarDetectedVisual =
    compactObjectScientificVisual(
      'PULSAR',
    );

  readonly extremePulsarSamples =
    neutronStarLaboratorySamples(
      ExtremeType.PULSAR,
    );

  readonly selectedExtremePulsarSampleIndex =
    signal(0);

  readonly extremePulsarDiscoveredModel =
    computed(
      () =>
        neutronStarProgressionModel(
          neutronStarLaboratoryModel(
            ExtremeType.PULSAR,
            this.selectedExtremePulsarSampleIndex(),
          ),
          'DISCOVERED',
        ),
    );

  readonly extremePulsarCataloguedModel =
    computed(
      () =>
        neutronStarProgressionModel(
          neutronStarLaboratoryModel(
            ExtremeType.PULSAR,
            this.selectedExtremePulsarSampleIndex(),
          ),
          'CATALOGUED',
        ),
    );

  readonly extremePulsarConfirmedModel =
    computed(
      () =>
        neutronStarLaboratoryModel(
          ExtremeType.PULSAR,
          this.selectedExtremePulsarSampleIndex(),
        ),
    );

  selectExtremePulsarSample(
    sampleIndex:
      number,
  ): void {
    if (
      !Number.isInteger(
        sampleIndex,
      ) ||
      sampleIndex < 0 ||
      sampleIndex >=
        this.extremePulsarSamples.length
    ) {
      throw new RangeError(
        `Unsupported extreme pulsar sample index: ${sampleIndex}.`,
      );
    }

    this.selectedExtremePulsarSampleIndex.set(
      sampleIndex,
    );
  }


  readonly extremeMillisecondPulsarDetectedVisual =
    compactObjectScientificVisual(
      'MILLISECOND_PULSAR',
    );

  readonly extremeMillisecondPulsarSamples =
    neutronStarLaboratorySamples(
      ExtremeType.MILLISECOND_PULSAR,
    );

  readonly selectedExtremeMillisecondPulsarSampleIndex =
    signal(0);

  readonly extremeMillisecondPulsarDiscoveredModel =
    computed(
      () =>
        neutronStarProgressionModel(
          neutronStarLaboratoryModel(
            ExtremeType.MILLISECOND_PULSAR,
            this.selectedExtremeMillisecondPulsarSampleIndex(),
          ),
          'DISCOVERED',
        ),
    );

  readonly extremeMillisecondPulsarCataloguedModel =
    computed(
      () =>
        neutronStarProgressionModel(
          neutronStarLaboratoryModel(
            ExtremeType.MILLISECOND_PULSAR,
            this.selectedExtremeMillisecondPulsarSampleIndex(),
          ),
          'CATALOGUED',
        ),
    );

  readonly extremeMillisecondPulsarConfirmedModel =
    computed(
      () =>
        neutronStarLaboratoryModel(
          ExtremeType.MILLISECOND_PULSAR,
          this.selectedExtremeMillisecondPulsarSampleIndex(),
        ),
    );

  selectExtremeMillisecondPulsarSample(
    sampleIndex:
      number,
  ): void {
    if (
      !Number.isInteger(
        sampleIndex,
      ) ||
      sampleIndex < 0 ||
      sampleIndex >=
        this.extremeMillisecondPulsarSamples.length
    ) {
      throw new RangeError(
        `Unsupported extreme millisecond-pulsar sample index: ${sampleIndex}.`,
      );
    }

    this.selectedExtremeMillisecondPulsarSampleIndex.set(
      sampleIndex,
    );
  }


  readonly extremeMagnetarDetectedVisual =
    compactObjectScientificVisual(
      'MAGNETAR',
    );

  readonly extremeMagnetarSamples =
    neutronStarLaboratorySamples(
      ExtremeType.MAGNETAR,
    );

  readonly selectedExtremeMagnetarSampleIndex =
    signal(0);

  readonly extremeMagnetarDiscoveredModel =
    computed(
      () =>
        neutronStarProgressionModel(
          neutronStarLaboratoryModel(
            ExtremeType.MAGNETAR,
            this.selectedExtremeMagnetarSampleIndex(),
          ),
          'DISCOVERED',
        ),
    );

  readonly extremeMagnetarCataloguedModel =
    computed(
      () =>
        neutronStarProgressionModel(
          neutronStarLaboratoryModel(
            ExtremeType.MAGNETAR,
            this.selectedExtremeMagnetarSampleIndex(),
          ),
          'CATALOGUED',
        ),
    );

  readonly extremeMagnetarConfirmedModel =
    computed(
      () =>
        neutronStarLaboratoryModel(
          ExtremeType.MAGNETAR,
          this.selectedExtremeMagnetarSampleIndex(),
        ),
    );

  selectExtremeMagnetarSample(
    sampleIndex:
      number,
  ): void {
    if (
      !Number.isInteger(
        sampleIndex,
      ) ||
      sampleIndex < 0 ||
      sampleIndex >=
        this.extremeMagnetarSamples.length
    ) {
      throw new RangeError(
        `Unsupported extreme magnetar sample index: ${sampleIndex}.`,
      );
    }

    this.selectedExtremeMagnetarSampleIndex.set(
      sampleIndex,
    );
  }

  readonly extremeStellarBlackHoleDetectedVisual =
    compactObjectScientificVisual(
      'BLACK_HOLE',
    );

  readonly extremeStellarBlackHoleSamples =
    blackHoleLaboratorySamples(
      ExtremeType.STELLAR_MASS_BLACK_HOLE,
    );

  readonly selectedExtremeStellarBlackHoleSampleIndex =
    signal(0);

  readonly extremeStellarBlackHoleDiscoveredModel =
    computed(
      () =>
        blackHoleProgressionModel(
          blackHoleLaboratoryModel(
            ExtremeType.STELLAR_MASS_BLACK_HOLE,
            this.selectedExtremeStellarBlackHoleSampleIndex(),
          ),
          'DISCOVERED',
        ),
    );

  readonly extremeStellarBlackHoleCataloguedModel =
    computed(
      () =>
        blackHoleProgressionModel(
          blackHoleLaboratoryModel(
            ExtremeType.STELLAR_MASS_BLACK_HOLE,
            this.selectedExtremeStellarBlackHoleSampleIndex(),
          ),
          'CATALOGUED',
        ),
    );

  readonly extremeStellarBlackHoleConfirmedModel =
    computed(
      () =>
        blackHoleLaboratoryModel(
          ExtremeType.STELLAR_MASS_BLACK_HOLE,
          this.selectedExtremeStellarBlackHoleSampleIndex(),
        ),
    );

  selectExtremeStellarBlackHoleSample(
    sampleIndex:
      number,
  ): void {
    if (
      !Number.isInteger(
        sampleIndex,
      ) ||
      sampleIndex < 0 ||
      sampleIndex >=
        this.extremeStellarBlackHoleSamples.length
    ) {
      throw new RangeError(
        `Unsupported extreme stellar-mass black-hole sample index: ${sampleIndex}.`,
      );
    }

    this.selectedExtremeStellarBlackHoleSampleIndex.set(
      sampleIndex,
    );
  }


  readonly extremeIntermediateBlackHoleDetectedVisual =
    compactObjectScientificVisual(
      'BLACK_HOLE',
    );

  readonly extremeIntermediateBlackHoleSamples =
    blackHoleLaboratorySamples(
      ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE,
    );

  readonly selectedExtremeIntermediateBlackHoleSampleIndex =
    signal(0);

  readonly extremeIntermediateBlackHoleDiscoveredModel =
    computed(
      () =>
        blackHoleProgressionModel(
          blackHoleLaboratoryModel(
            ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE,
            this.selectedExtremeIntermediateBlackHoleSampleIndex(),
          ),
          'DISCOVERED',
        ),
    );

  readonly extremeIntermediateBlackHoleCataloguedModel =
    computed(
      () =>
        blackHoleProgressionModel(
          blackHoleLaboratoryModel(
            ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE,
            this.selectedExtremeIntermediateBlackHoleSampleIndex(),
          ),
          'CATALOGUED',
        ),
    );

  readonly extremeIntermediateBlackHoleConfirmedModel =
    computed(
      () =>
        blackHoleLaboratoryModel(
          ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE,
          this.selectedExtremeIntermediateBlackHoleSampleIndex(),
        ),
    );

  selectExtremeIntermediateBlackHoleSample(
    sampleIndex:
      number,
  ): void {
    if (
      !Number.isInteger(
        sampleIndex,
      ) ||
      sampleIndex < 0 ||
      sampleIndex >=
        this.extremeIntermediateBlackHoleSamples.length
    ) {
      throw new RangeError(
        `Unsupported extreme intermediate-mass black-hole sample index: ${sampleIndex}.`,
      );
    }

    this.selectedExtremeIntermediateBlackHoleSampleIndex.set(
      sampleIndex,
    );
  }


  readonly extremeSupermassiveBlackHoleDetectedVisual =
    compactObjectScientificVisual(
      'BLACK_HOLE',
    );

  readonly extremeSupermassiveBlackHoleSamples =
    blackHoleLaboratorySamples(
      ExtremeType.SMBH,
    );

  readonly selectedExtremeSupermassiveBlackHoleSampleIndex =
    signal(0);

  readonly extremeSupermassiveBlackHoleDiscoveredModel =
    computed(
      () =>
        blackHoleProgressionModel(
          blackHoleLaboratoryModel(
            ExtremeType.SMBH,
            this.selectedExtremeSupermassiveBlackHoleSampleIndex(),
          ),
          'DISCOVERED',
        ),
    );

  readonly extremeSupermassiveBlackHoleCataloguedModel =
    computed(
      () =>
        blackHoleProgressionModel(
          blackHoleLaboratoryModel(
            ExtremeType.SMBH,
            this.selectedExtremeSupermassiveBlackHoleSampleIndex(),
          ),
          'CATALOGUED',
        ),
    );

  readonly extremeSupermassiveBlackHoleConfirmedModel =
    computed(
      () =>
        blackHoleLaboratoryModel(
          ExtremeType.SMBH,
          this.selectedExtremeSupermassiveBlackHoleSampleIndex(),
        ),
    );

  selectExtremeSupermassiveBlackHoleSample(
    sampleIndex:
      number,
  ): void {
    if (
      !Number.isInteger(
        sampleIndex,
      ) ||
      sampleIndex < 0 ||
      sampleIndex >=
        this.extremeSupermassiveBlackHoleSamples.length
    ) {
      throw new RangeError(
        `Unsupported extreme supermassive black-hole sample index: ${sampleIndex}.`,
      );
    }

    this.selectedExtremeSupermassiveBlackHoleSampleIndex.set(
      sampleIndex,
    );
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


  /** 28.2F.5 read-only X-ray compact binary classes. */
  readonly xrayBinaryLaboratoryTypes = XRAY_BINARY_LABORATORY_TYPES;
  readonly selectedXrayBinaryType = signal<XrayBinaryLaboratoryKind>('X_RAY_BINARY_NS');
  readonly selectedXrayBinarySampleIndex = signal(0);
  readonly xrayBinaryLaboratorySamples = computed(() => xrayBinaryLaboratorySamples(this.selectedXrayBinaryType()));
  readonly selectedXrayBinaryLaboratoryModel = computed(() => xrayBinaryLaboratoryModel(this.selectedXrayBinaryType(), this.selectedXrayBinarySampleIndex()));

  selectXrayBinaryLaboratoryType(type: XrayBinaryLaboratoryKind): void {
    if (!XRAY_BINARY_LABORATORY_TYPES.includes(type)) throw new RangeError(`Unsupported X-ray binary laboratory type: ${type}.`);
    this.selectedXrayBinaryType.set(type);
    this.selectedXrayBinarySampleIndex.set(0);
  }

  selectXrayBinaryLaboratorySample(sampleIndex: number): void {
    if (!Number.isInteger(sampleIndex) || sampleIndex < 0 || sampleIndex >= 8) {
      throw new RangeError(`Unsupported X-ray binary laboratory sample index: ${sampleIndex}.`);
    }
    this.selectedXrayBinarySampleIndex.set(sampleIndex);
  }

  xrayBinaryTypeLabel(type: XrayBinaryLaboratoryKind): string {
    return xrayBinaryLaboratoryModel(type, 0).label;
  }

  readonly extremeXrayBinaryNsSamples =
    xrayBinaryLaboratorySamples(
      ExtremeType.X_RAY_BINARY_NS,
    );

  readonly selectedExtremeXrayBinaryNsSampleIndex =
    signal(0);

  readonly extremeXrayBinaryNsDetectedModel =
    computed(
      () =>
        xrayBinaryProgressionModel(
          xrayBinaryLaboratoryModel(
            ExtremeType.X_RAY_BINARY_NS,
            this.selectedExtremeXrayBinaryNsSampleIndex(),
          ),
          'DETECTED',
        ),
    );

  readonly extremeXrayBinaryNsDiscoveredModel =
    computed(
      () =>
        xrayBinaryProgressionModel(
          xrayBinaryLaboratoryModel(
            ExtremeType.X_RAY_BINARY_NS,
            this.selectedExtremeXrayBinaryNsSampleIndex(),
          ),
          'DISCOVERED',
        ),
    );

  readonly extremeXrayBinaryNsCataloguedModel =
    computed(
      () =>
        xrayBinaryProgressionModel(
          xrayBinaryLaboratoryModel(
            ExtremeType.X_RAY_BINARY_NS,
            this.selectedExtremeXrayBinaryNsSampleIndex(),
          ),
          'CATALOGUED',
        ),
    );

  readonly extremeXrayBinaryNsConfirmedModel =
    computed(
      () =>
        xrayBinaryLaboratoryModel(
          ExtremeType.X_RAY_BINARY_NS,
          this.selectedExtremeXrayBinaryNsSampleIndex(),
        ),
    );

  selectExtremeXrayBinaryNsSample(sampleIndex: number): void {
    if (!Number.isInteger(sampleIndex) || sampleIndex < 0 || sampleIndex >= this.extremeXrayBinaryNsSamples.length) {
      throw new RangeError(`Unsupported extreme X-ray binary NS sample index: ${sampleIndex}.`);
    }
    this.selectedExtremeXrayBinaryNsSampleIndex.set(sampleIndex);
  }

  readonly extremeXrayBinaryBhSamples =
    xrayBinaryLaboratorySamples(
      ExtremeType.X_RAY_BINARY_BH,
    );

  readonly selectedExtremeXrayBinaryBhSampleIndex =
    signal(0);

  readonly extremeXrayBinaryBhDetectedModel =
    computed(
      () =>
        xrayBinaryProgressionModel(
          xrayBinaryLaboratoryModel(
            ExtremeType.X_RAY_BINARY_BH,
            this.selectedExtremeXrayBinaryBhSampleIndex(),
          ),
          'DETECTED',
        ),
    );

  readonly extremeXrayBinaryBhDiscoveredModel =
    computed(
      () =>
        xrayBinaryProgressionModel(
          xrayBinaryLaboratoryModel(
            ExtremeType.X_RAY_BINARY_BH,
            this.selectedExtremeXrayBinaryBhSampleIndex(),
          ),
          'DISCOVERED',
        ),
    );

  readonly extremeXrayBinaryBhCataloguedModel =
    computed(
      () =>
        xrayBinaryProgressionModel(
          xrayBinaryLaboratoryModel(
            ExtremeType.X_RAY_BINARY_BH,
            this.selectedExtremeXrayBinaryBhSampleIndex(),
          ),
          'CATALOGUED',
        ),
    );

  readonly extremeXrayBinaryBhConfirmedModel =
    computed(
      () =>
        xrayBinaryLaboratoryModel(
          ExtremeType.X_RAY_BINARY_BH,
          this.selectedExtremeXrayBinaryBhSampleIndex(),
        ),
    );

  selectExtremeXrayBinaryBhSample(sampleIndex: number): void {
    if (!Number.isInteger(sampleIndex) || sampleIndex < 0 || sampleIndex >= this.extremeXrayBinaryBhSamples.length) {
      throw new RangeError(`Unsupported extreme X-ray binary BH sample index: ${sampleIndex}.`);
    }
    this.selectedExtremeXrayBinaryBhSampleIndex.set(sampleIndex);
  }

  readonly extremeMicroquasarSamples =
    xrayBinaryLaboratorySamples(
      ExtremeType.MICROQUASAR,
    );

  readonly selectedExtremeMicroquasarSampleIndex =
    signal(0);

  readonly extremeMicroquasarDetectedModel =
    computed(
      () =>
        xrayBinaryProgressionModel(
          xrayBinaryLaboratoryModel(
            ExtremeType.MICROQUASAR,
            this.selectedExtremeMicroquasarSampleIndex(),
          ),
          'DETECTED',
        ),
    );

  readonly extremeMicroquasarDiscoveredModel =
    computed(
      () =>
        xrayBinaryProgressionModel(
          xrayBinaryLaboratoryModel(
            ExtremeType.MICROQUASAR,
            this.selectedExtremeMicroquasarSampleIndex(),
          ),
          'DISCOVERED',
        ),
    );

  readonly extremeMicroquasarCataloguedModel =
    computed(
      () =>
        xrayBinaryProgressionModel(
          xrayBinaryLaboratoryModel(
            ExtremeType.MICROQUASAR,
            this.selectedExtremeMicroquasarSampleIndex(),
          ),
          'CATALOGUED',
        ),
    );

  readonly extremeMicroquasarConfirmedModel =
    computed(
      () =>
        xrayBinaryLaboratoryModel(
          ExtremeType.MICROQUASAR,
          this.selectedExtremeMicroquasarSampleIndex(),
        ),
    );

  selectExtremeMicroquasarSample(sampleIndex: number): void {
    if (!Number.isInteger(sampleIndex) || sampleIndex < 0 || sampleIndex >= this.extremeMicroquasarSamples.length) {
      throw new RangeError(`Unsupported extreme microquasar sample index: ${sampleIndex}.`);
    }
    this.selectedExtremeMicroquasarSampleIndex.set(sampleIndex);
  }

  readonly extremeUlxSamples =
    xrayBinaryLaboratorySamples(
      ExtremeType.ULX,
    );

  readonly selectedExtremeUlxSampleIndex =
    signal(0);

  readonly extremeUlxDetectedModel =
    computed(
      () =>
        xrayBinaryProgressionModel(
          xrayBinaryLaboratoryModel(
            ExtremeType.ULX,
            this.selectedExtremeUlxSampleIndex(),
          ),
          'DETECTED',
        ),
    );

  readonly extremeUlxDiscoveredModel =
    computed(
      () =>
        xrayBinaryProgressionModel(
          xrayBinaryLaboratoryModel(
            ExtremeType.ULX,
            this.selectedExtremeUlxSampleIndex(),
          ),
          'DISCOVERED',
        ),
    );

  readonly extremeUlxCataloguedModel =
    computed(
      () =>
        xrayBinaryProgressionModel(
          xrayBinaryLaboratoryModel(
            ExtremeType.ULX,
            this.selectedExtremeUlxSampleIndex(),
          ),
          'CATALOGUED',
        ),
    );

  readonly extremeUlxConfirmedModel =
    computed(
      () =>
        xrayBinaryLaboratoryModel(
          ExtremeType.ULX,
          this.selectedExtremeUlxSampleIndex(),
        ),
    );

  selectExtremeUlxSample(sampleIndex: number): void {
    if (!Number.isInteger(sampleIndex) || sampleIndex < 0 || sampleIndex >= this.extremeUlxSamples.length) {
      throw new RangeError(`Unsupported extreme ULX sample index: ${sampleIndex}.`);
    }
    this.selectedExtremeUlxSampleIndex.set(sampleIndex);
  }

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
          'Extremos',
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

  readonly isExtremeNeutronStarSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this.selectedObjectCaseId() ===
          GalacticObjectLaboratoryCaseId
            .EXTREME_NEUTRON_STAR,
    );

  readonly isExtremePulsarSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this.selectedObjectCaseId() ===
          GalacticObjectLaboratoryCaseId
            .EXTREME_PULSAR,
    );


  readonly isExtremeMillisecondPulsarSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this.selectedObjectCaseId() ===
          GalacticObjectLaboratoryCaseId
            .EXTREME_MILLISECOND_PULSAR,
    );


  readonly isExtremeMagnetarSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this.selectedObjectCaseId() ===
          GalacticObjectLaboratoryCaseId
            .EXTREME_MAGNETAR,
    );

  readonly isExtremeStellarBlackHoleSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this.selectedObjectCaseId() ===
          GalacticObjectLaboratoryCaseId
            .EXTREME_STELLAR_MASS_BLACK_HOLE,
    );


  readonly isExtremeIntermediateBlackHoleSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this.selectedObjectCaseId() ===
          GalacticObjectLaboratoryCaseId
            .EXTREME_INTERMEDIATE_MASS_BLACK_HOLE,
    );


  readonly isExtremeSupermassiveBlackHoleSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this.selectedObjectCaseId() ===
          GalacticObjectLaboratoryCaseId
            .EXTREME_SUPERMASSIVE_BLACK_HOLE,
    );

  readonly isExtremeXrayBinaryNsSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this.selectedObjectCaseId() ===
          'EXTREME_X_RAY_BINARY_NS',
    );

  readonly isExtremeXrayBinaryBhSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this.selectedObjectCaseId() ===
          'EXTREME_X_RAY_BINARY_BH',
    );

  readonly isExtremeMicroquasarSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this.selectedObjectCaseId() ===
          'EXTREME_MICROQUASAR',
    );

  readonly isExtremeUlxSelected =
    computed(
      () =>
        this.view() ===
          LaboratoryView.OBJECT &&
        this.selectedObjectCaseId() ===
          'EXTREME_ULX',
    );

  readonly selectedObjectCase =
    computed(
      () => {
        const selectedId =
          this.selectedObjectCaseId();

        // Resolve through the sample-aware fixture factory. All current cases
        // (including the 28.2F compact extremes) are now registered there, so
        // bypassing it through the static selector-grid objects would freeze
        // the active-case locator/description at sample A while A-H changes.
        return GalacticObjectLaboratoryFixtures
          .caseDefinition(
            selectedId,
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
          );
      },
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

type BlackHoleDiscoveryProgressionStage =
  'DISCOVERED' |
  'CATALOGUED';

function blackHoleProgressionModel(
  base:
    ReturnType<typeof blackHoleLaboratoryModel>,

  stage:
    BlackHoleDiscoveryProgressionStage,
): ReturnType<typeof blackHoleLaboratoryModel> {
  if (
    stage ===
      'CATALOGUED'
  ) {
    return Object.freeze({
      ...base,
      caveat:
        'Vista CATALOGUED: geometría relativista completa del laboratorio, detenida para inspección científica estática.',
    });
  }

  return Object.freeze({
    ...base,
    diskBrightness:
      base.diskBrightness *
      0.76,
    lensingStrength:
      base.lensingStrength *
      0.74,
    turbulenceScale:
      base.turbulenceScale *
      0.72,
    turbulenceStrength:
      base.turbulenceStrength *
      0.42,
    diskThickness:
      base.diskThickness *
      0.90,
    caveat:
      'Vista DISCOVERED: firma de agujero negro ya reconocible, pero con acreción, turbulencia y lente deliberadamente simplificadas.',
  });
}

type NeutronStarDiscoveryProgressionStage =
  'DISCOVERED' |
  'CATALOGUED';

function neutronStarProgressionModel(
  base:
    NeutronStarLaboratoryRenderModel,

  stage:
    NeutronStarDiscoveryProgressionStage,
): NeutronStarLaboratoryRenderModel {
  const isDiscovered =
    stage ===
      'DISCOVERED';

  if (!isDiscovered) {
    return Object.freeze({
      ...base,
      caveat:
        'Vista CATALOGUED: morfología compacta completamente caracterizada y estática; la animación final se reserva para CONFIRMED.',
    });
  }

  return Object.freeze({
    ...base,
    surfaceDetailScale:
      base.surfaceDetailScale * 0.58,
    surfaceFineScale:
      base.surfaceFineScale * 0.42,
    surfaceHotIntensity:
      base.surfaceHotIntensity * 0.62,
    surfaceContrast:
      base.surfaceContrast * 0.84,
    surfaceBrightness:
      base.surfaceBrightness * 0.86,
    surfaceFresnelStrength:
      base.surfaceFresnelStrength * 0.68,
    coronaOpacity:
      base.coronaOpacity * 0.38,
    wispCount:
      Math.min(base.wispCount, 2),
    wispOpacity:
      base.wispOpacity * 0.28,
    activityRate:
      base.activityRate * 0.58,
    caveat:
      'Vista DISCOVERED: representación estática con superficie compacta, corona y actividad deliberadamente simplificadas.',
  });
}

type XrayBinaryDiscoveryProgressionStage =
  'DETECTED' |
  'DISCOVERED' |
  'CATALOGUED';

function xrayBinaryProgressionModel(
  base: XrayBinaryLaboratoryRenderModel,
  stage: XrayBinaryDiscoveryProgressionStage,
): XrayBinaryLaboratoryRenderModel {
  if (stage === 'CATALOGUED') {
    return Object.freeze({
      ...base,
      caveat:
        'Vista CATALOGUED: sistema compacto completamente caracterizado y estático; la animación final se reserva para CONFIRMED.',
    });
  }

  if (stage === 'DISCOVERED') {
    return Object.freeze({
      ...base,
      donorScale: base.donorScale * 0.96,
      diskRadiusRem: base.diskRadiusRem * 0.94,
      streamHeightRem: base.streamHeightRem * 0.92,
      streamWidthRem: base.streamWidthRem * 0.88,
      coronaScale: base.coronaScale * 0.84,
      xrayOpacity: base.xrayOpacity * 0.74,
      jetPowerErgS: base.jetPowerErgS === null ? null : Number((base.jetPowerErgS * 0.58).toPrecision(3)),
      jetOpeningDegrees: base.jetOpeningDegrees === null ? null : Math.round((base.jetOpeningDegrees * 1.12) * 10) / 10,
      superEddingtonFactor: base.superEddingtonFactor === null ? null : Math.round((base.superEddingtonFactor * 0.64) * 10) / 10,
      windVelocityFractionC: base.windVelocityFractionC === null ? null : Math.round((base.windVelocityFractionC * 0.82) * 100) / 100,
      caveat:
        'Vista DISCOVERED: morfología compacta reconocible y estática, con transferencia de masa, acreción y emisión deliberadamente simplificadas.',
    });
  }

  return Object.freeze({
    ...base,
    donorScale: base.donorScale * 0.92,
    diskRadiusRem: base.diskRadiusRem * 0.86,
    streamHeightRem: base.streamHeightRem * 0.84,
    streamWidthRem: base.streamWidthRem * 0.74,
    coronaScale: base.coronaScale * 0.70,
    xrayOpacity: base.xrayOpacity * 0.52,
    jetPowerErgS: base.jetPowerErgS === null ? null : Number((base.jetPowerErgS * 0.34).toPrecision(3)),
    jetOpeningDegrees: base.jetOpeningDegrees === null ? null : Math.round((base.jetOpeningDegrees * 1.28) * 10) / 10,
    superEddingtonFactor: base.superEddingtonFactor === null ? null : Math.round((base.superEddingtonFactor * 0.44) * 10) / 10,
    windVelocityFractionC: base.windVelocityFractionC === null ? null : Math.round((base.windVelocityFractionC * 0.66) * 100) / 100,
    caveat:
      'Vista DETECTED: esquema compacto estático de alto nivel para identificar donante, objeto compacto, transferencia de masa y firma energética dominante.',
  });
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
