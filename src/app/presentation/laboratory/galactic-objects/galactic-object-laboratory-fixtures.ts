import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../../domain/discovery/discovery-state';

import {
  ExplorationResultKind,
  type ExplorationLocatedResultKind,
} from '../../../domain/exploration/exploration-sector-result';

import {
  GalacticObjectScientificSubject,
  GalacticObjectScientificSurveyFamily,
} from '../../../domain/galactic-object/galactic-object-scientific-subject';

import {
  ExtremeType,
  extremeTypeDefinition,
  type ExtremeType as ExtremeTypeValue,
} from '../../../domain/galactic-object/extreme-object-type';

import {
  NebulaType,
  type NebulaType as NebulaTypeValue,
} from '../../../domain/galactic-object/nebula-type';

import {
  StarFormationActivity,
  type StarFormationActivity as StarFormationActivityValue,
} from '../../../domain/galactic-object/star-formation-activity';

import {
  SupernovaRemnantMorphology,
  type SupernovaRemnantMorphology as SupernovaRemnantMorphologyValue,
} from '../../../domain/galactic-object/supernova-remnant-morphology';

import {
  GalacticObjectLocator,
} from '../../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../../domain/universe/universe-seed';

import {
  HiiRegionGenerator,
} from '../../../simulation/galactic-object/hii-region-generator';

import {
  NebulaGenerator,
} from '../../../simulation/galactic-object/nebula-generator';

import {
  OpenClusterGenerator,
} from '../../../simulation/galactic-object/open-cluster-generator';

import {
  GlobularClusterGenerator,
} from '../../../simulation/galactic-object/globular-cluster-generator';

import {
  SupernovaRemnantGenerator,
} from '../../../simulation/galactic-object/supernova-remnant-generator';

import {
  ArchiveGalacticObjectCardAssembler,
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  type ArchiveGalacticObjectCardModel,
  type ArchiveGalacticObjectFact,
} from '../../genesis-archive/archive-galactic-object-card';

import {
  compactObjectScientificVisual,
  type CompactObjectVisualKind,
} from '../../genesis-archive/compact-object-scientific-visual';

import {
  neutronStarLaboratoryModel,
  type NeutronStarLaboratoryKind,
} from './neutron-star-laboratory-render-model';

import {
  blackHoleLaboratoryModel,
  type BlackHoleLaboratoryKind,
} from './black-hole-laboratory-render-model';

import {
  OpenClusterRenderModelBuilder,
  type OpenClusterMorphologyFamily,
} from '../../genesis-archive/open-cluster-render-model';

import {
  GlobularClusterRenderModelBuilder,
  type GlobularClusterMorphologyFamily,
} from '../../genesis-archive/globular-cluster-render-model';

import {
  SupernovaRemnantRenderModelBuilder,
  type SupernovaRemnantCompositeVisualFamily,
  type SupernovaRemnantPlerionVisualFamily,
  type SupernovaRemnantVisualFamily,
} from '../../genesis-archive/supernova-remnant-render-model';

import {
  HiiRegionLowRenderModelBuilder,
  type HiiRegionLowMorphologyFamily,
} from '../../genesis-archive/hii-region-low-render-model';

import {
  HiiRegionModerateRenderModelBuilder,
  type HiiRegionModerateMorphologyFamily,
} from '../../genesis-archive/hii-region-moderate-render-model';

import {
  HiiRegionHighRenderModelBuilder,
  type HiiRegionHighMorphologyFamily,
} from '../../genesis-archive/hii-region-high-render-model';

import {
  HiiRegionIntenseRenderModelBuilder,
  type HiiRegionIntenseMorphologyFamily,
} from '../../genesis-archive/hii-region-intense-render-model';

export const GalacticObjectLaboratoryGroup =
  Object.freeze({
    NEBULAE:
      'NEBULAE',

    HII:
      'HII',

    CLUSTERS:
      'CLUSTERS',

    SUPERNOVA_REMNANTS:
      'SUPERNOVA_REMNANTS',

    EXTREME:
      'EXTREME',
  } as const);

export type GalacticObjectLaboratoryGroup =
  typeof GalacticObjectLaboratoryGroup[
    keyof typeof GalacticObjectLaboratoryGroup
  ];

export const GalacticObjectLaboratoryCaseId =
  Object.freeze({
    NEBULA_EMISSION:
      'NEBULA_EMISSION',

    NEBULA_REFLECTION:
      'NEBULA_REFLECTION',

    NEBULA_DARK:
      'NEBULA_DARK',

    NEBULA_PLANETARY:
      'NEBULA_PLANETARY',

    HII_LOW:
      'HII_LOW',

    HII_MODERATE:
      'HII_MODERATE',

    HII_HIGH:
      'HII_HIGH',

    HII_INTENSE:
      'HII_INTENSE',

    OPEN_CLUSTER:
      'OPEN_CLUSTER',

    GLOBULAR_CLUSTER:
      'GLOBULAR_CLUSTER',

    SNR_SHELL:
      'SNR_SHELL',

    SNR_PLERION:
      'SNR_PLERION',

    SNR_COMPOSITE:
      'SNR_COMPOSITE',

    EXTREME_NEUTRON_STAR:
      'EXTREME_NEUTRON_STAR',

    EXTREME_PULSAR:
      'EXTREME_PULSAR',

    EXTREME_MILLISECOND_PULSAR:
      'EXTREME_MILLISECOND_PULSAR',

    EXTREME_MAGNETAR:
      'EXTREME_MAGNETAR',

    EXTREME_STELLAR_MASS_BLACK_HOLE:
      'EXTREME_STELLAR_MASS_BLACK_HOLE',

    EXTREME_INTERMEDIATE_MASS_BLACK_HOLE:
      'EXTREME_INTERMEDIATE_MASS_BLACK_HOLE',

    EXTREME_SUPERMASSIVE_BLACK_HOLE:
      'EXTREME_SUPERMASSIVE_BLACK_HOLE',

    RESERVED_EXTREME:
      'RESERVED_EXTREME',
  } as const);

export type GalacticObjectLaboratoryCaseId =
  typeof GalacticObjectLaboratoryCaseId[
    keyof typeof GalacticObjectLaboratoryCaseId
  ];

export interface GalacticObjectLaboratoryCase {
  readonly id:
    GalacticObjectLaboratoryCaseId;

  readonly group:
    GalacticObjectLaboratoryGroup;

  readonly label:
    string;

  readonly familyLabel:
    string;

  readonly locator:
    GalacticObjectLocator;

  readonly resultKind:
    ExplorationLocatedResultKind;

  readonly expectedSubject:
    GalacticObjectScientificSubject | null;

  readonly expectedNebulaType:
    NebulaTypeValue | null;

  readonly expectedHiiActivity:
    StarFormationActivityValue | null;

  readonly expectedRemnantMorphology:
    SupernovaRemnantMorphologyValue | null;

  /** Lab-only physical specialization for distributed EXTREME_OBJECT cases. */
  readonly extremeType:
    ExtremeTypeValue | null;

  readonly description:
    string;
}

export interface GalacticObjectLaboratoryState {
  readonly state:
    DiscoveryStateValue;

  readonly label:
    string;

  readonly shortLabel:
    string;
}

export interface GalacticObjectLaboratoryFrame {
  readonly state:
    GalacticObjectLaboratoryState;

  readonly card:
    ArchiveGalacticObjectCardModel;
}

export interface EmissionNebulaLaboratorySample {
  readonly index:
    number;

  readonly label:
    string;

  readonly locator:
    GalacticObjectLocator;
}

export interface ReflectionNebulaLaboratorySample {
  readonly index:
    number;

  readonly label:
    string;

  readonly locator:
    GalacticObjectLocator;
}

export interface DarkNebulaLaboratorySample {
  readonly index:
    number;

  readonly label:
    string;

  readonly locator:
    GalacticObjectLocator;
}

export interface PlanetaryNebulaLaboratorySample {
  readonly index:
    number;

  readonly label:
    string;

  readonly locator:
    GalacticObjectLocator;
}

export interface HiiLowLaboratorySample {
  readonly index:
    number;

  readonly label:
    string;

  readonly locator:
    GalacticObjectLocator;
}

export interface HiiModerateLaboratorySample {
  readonly index:
    number;

  readonly label:
    string;

  readonly locator:
    GalacticObjectLocator;
}

export interface HiiHighLaboratorySample {
  readonly index:
    number;

  readonly label:
    string;

  readonly locator:
    GalacticObjectLocator;
}

export interface HiiIntenseLaboratorySample {
  readonly index:
    number;

  readonly label:
    string;

  readonly locator:
    GalacticObjectLocator;
}

export interface OpenClusterLaboratorySample {
  readonly index:
    number;

  readonly label:
    string;

  readonly locator:
    GalacticObjectLocator;
}

export interface GlobularClusterLaboratorySample {
  readonly index:
    number;

  readonly label:
    string;

  readonly locator:
    GalacticObjectLocator;
}

export interface SupernovaRemnantShellLaboratorySample {
  readonly index:
    number;

  readonly label:
    string;

  readonly locator:
    GalacticObjectLocator;
}

export interface SupernovaRemnantPlerionLaboratorySample {
  readonly index:
    number;

  readonly label:
    string;

  readonly locator:
    GalacticObjectLocator;
}

export interface SupernovaRemnantCompositeLaboratorySample {
  readonly index:
    number;

  readonly label:
    string;

  readonly locator:
    GalacticObjectLocator;
}

export const GALACTIC_OBJECT_LABORATORY_STATES:
  readonly GalacticObjectLaboratoryState[] =
  Object.freeze([
    Object.freeze({
      state:
        DiscoveryState.DETECTED,
      label:
        'Detectado',
      shortLabel:
        'DETECTED',
    }),
    Object.freeze({
      state:
        DiscoveryState.DISCOVERED,
      label:
        'Descubierto',
      shortLabel:
        'DISCOVERED',
    }),
    Object.freeze({
      state:
        DiscoveryState.CATALOGUED,
      label:
        'Catalogado',
      shortLabel:
        'CATALOGUED',
    }),
    Object.freeze({
      state:
        DiscoveryState.CONFIRMED,
      label:
        'Confirmado',
      shortLabel:
        'CONFIRMED',
    }),
  ]);

const GENERATION_KEY =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    ),
    GeneratorVersion.V1,
  );

const NEBULA_SECTOR_KEY =
  123456789n;

const EMISSION_NEBULA_SAMPLE_COUNT =
  8;

const REFLECTION_NEBULA_SAMPLE_COUNT =
  8;

const DARK_NEBULA_SAMPLE_COUNT =
  8;

const PLANETARY_NEBULA_SAMPLE_COUNT =
  8;

const HII_LOW_SAMPLE_COUNT =
  8;

const HII_MODERATE_SAMPLE_COUNT =
  8;

const HII_HIGH_SAMPLE_COUNT =
  8;

const HII_INTENSE_SAMPLE_COUNT =
  8;


const OPEN_CLUSTER_SAMPLE_COUNT =
  8;

const GLOBULAR_CLUSTER_SAMPLE_COUNT =
  8;

const SUPERNOVA_REMNANT_SHELL_SAMPLE_COUNT =
  8;

const SUPERNOVA_REMNANT_PLERION_SAMPLE_COUNT =
  8;

const SUPERNOVA_REMNANT_COMPOSITE_SAMPLE_COUNT =
  8;

let cachedEmissionNebulaSamples:
  readonly EmissionNebulaLaboratorySample[] | null =
    null;

let cachedReflectionNebulaSamples:
  readonly ReflectionNebulaLaboratorySample[] | null =
    null;

let cachedDarkNebulaSamples:
  readonly DarkNebulaLaboratorySample[] | null =
    null;

let cachedPlanetaryNebulaSamples:
  readonly PlanetaryNebulaLaboratorySample[] | null =
    null;

let cachedHiiLowSamples:
  readonly HiiLowLaboratorySample[] | null =
    null;

let cachedHiiModerateSamples:
  readonly HiiModerateLaboratorySample[] | null =
    null;

let cachedHiiHighSamples:
  readonly HiiHighLaboratorySample[] | null =
    null;

let cachedHiiIntenseSamples:
  readonly HiiIntenseLaboratorySample[] | null =
    null;


let cachedOpenClusterSamples:
  readonly OpenClusterLaboratorySample[] | null =
    null;

let cachedGlobularClusterSamples:
  readonly GlobularClusterLaboratorySample[] | null =
    null;

let cachedSupernovaRemnantShellSamples:
  readonly SupernovaRemnantShellLaboratorySample[] | null =
    null;

let cachedSupernovaRemnantPlerionSamples:
  readonly SupernovaRemnantPlerionLaboratorySample[] | null =
    null;

let cachedSupernovaRemnantCompositeSamples:
  readonly SupernovaRemnantCompositeLaboratorySample[] | null =
    null;

let cachedHiiRepresentatives:
  ReadonlyMap<
    StarFormationActivityValue,
    GalacticObjectLocator
  > | null =
    null;

let cachedRemnantRepresentatives:
  ReadonlyMap<
    SupernovaRemnantMorphologyValue,
    GalacticObjectLocator
  > | null =
    null;

export const GALACTIC_OBJECT_LABORATORY_CASES:
  readonly GalacticObjectLaboratoryCase[] =
  Object.freeze(
    buildCasesV1(),
  );

export class GalacticObjectLaboratoryFixtures {

  private constructor() {}

  static emissionNebulaSamples():
    readonly EmissionNebulaLaboratorySample[] {

    if (
      cachedEmissionNebulaSamples !==
        null
    ) {
      return cachedEmissionNebulaSamples;
    }

    cachedEmissionNebulaSamples =
      Object.freeze(
        buildEmissionNebulaSamplesV1(),
      );

    return cachedEmissionNebulaSamples;
  }

  static reflectionNebulaSamples():
    readonly ReflectionNebulaLaboratorySample[] {

    if (
      cachedReflectionNebulaSamples !==
        null
    ) {
      return cachedReflectionNebulaSamples;
    }

    cachedReflectionNebulaSamples =
      Object.freeze(
        buildReflectionNebulaSamplesV1(),
      );

    return cachedReflectionNebulaSamples;
  }

  static darkNebulaSamples():
    readonly DarkNebulaLaboratorySample[] {

    if (
      cachedDarkNebulaSamples !==
        null
    ) {
      return cachedDarkNebulaSamples;
    }

    cachedDarkNebulaSamples =
      Object.freeze(
        buildDarkNebulaSamplesV1(),
      );

    return cachedDarkNebulaSamples;
  }

  static planetaryNebulaSamples():
    readonly PlanetaryNebulaLaboratorySample[] {

    if (
      cachedPlanetaryNebulaSamples !==
        null
    ) {
      return cachedPlanetaryNebulaSamples;
    }

    cachedPlanetaryNebulaSamples =
      Object.freeze(
        buildPlanetaryNebulaSamplesV1(),
      );

    return cachedPlanetaryNebulaSamples;
  }

  static hiiLowSamples():
    readonly HiiLowLaboratorySample[] {

    if (
      cachedHiiLowSamples !==
        null
    ) {
      return cachedHiiLowSamples;
    }

    cachedHiiLowSamples =
      Object.freeze(
        buildHiiLowSamplesV1(),
      );

    return cachedHiiLowSamples;
  }

  static hiiModerateSamples():
    readonly HiiModerateLaboratorySample[] {

    if (
      cachedHiiModerateSamples !==
        null
    ) {
      return cachedHiiModerateSamples;
    }

    cachedHiiModerateSamples =
      Object.freeze(
        buildHiiModerateSamplesV1(),
      );

    return cachedHiiModerateSamples;
  }

  static hiiHighSamples():
    readonly HiiHighLaboratorySample[] {

    if (
      cachedHiiHighSamples !==
        null
    ) {
      return cachedHiiHighSamples;
    }

    cachedHiiHighSamples =
      Object.freeze(
        buildHiiHighSamplesV1(),
      );

    return cachedHiiHighSamples;
  }

  static hiiIntenseSamples():
    readonly HiiIntenseLaboratorySample[] {

    if (
      cachedHiiIntenseSamples !==
        null
    ) {
      return cachedHiiIntenseSamples;
    }

    cachedHiiIntenseSamples =
      Object.freeze(
        buildHiiIntenseSamplesV1(),
      );

    return cachedHiiIntenseSamples;
  }


  static openClusterSamples():
    readonly OpenClusterLaboratorySample[] {

    if (
      cachedOpenClusterSamples !==
        null
    ) {
      return cachedOpenClusterSamples;
    }

    cachedOpenClusterSamples =
      Object.freeze(
        buildOpenClusterSamplesV1(),
      );

    return cachedOpenClusterSamples;
  }

  static globularClusterSamples():
    readonly GlobularClusterLaboratorySample[] {

    if (
      cachedGlobularClusterSamples !==
        null
    ) {
      return cachedGlobularClusterSamples;
    }

    cachedGlobularClusterSamples =
      Object.freeze(
        buildGlobularClusterSamplesV1(),
      );

    return cachedGlobularClusterSamples;
  }

  static supernovaRemnantShellSamples():
    readonly SupernovaRemnantShellLaboratorySample[] {

    if (
      cachedSupernovaRemnantShellSamples !==
        null
    ) {
      return cachedSupernovaRemnantShellSamples;
    }

    cachedSupernovaRemnantShellSamples =
      Object.freeze(
        buildSupernovaRemnantShellSamplesV1(),
      );

    return cachedSupernovaRemnantShellSamples;
  }

  static supernovaRemnantPlerionSamples():
    readonly SupernovaRemnantPlerionLaboratorySample[] {

    if (
      cachedSupernovaRemnantPlerionSamples !==
        null
    ) {
      return cachedSupernovaRemnantPlerionSamples;
    }

    cachedSupernovaRemnantPlerionSamples =
      Object.freeze(
        buildSupernovaRemnantPlerionSamplesV1(),
      );

    return cachedSupernovaRemnantPlerionSamples;
  }

  static supernovaRemnantCompositeSamples():
    readonly SupernovaRemnantCompositeLaboratorySample[] {

    if (
      cachedSupernovaRemnantCompositeSamples !==
        null
    ) {
      return cachedSupernovaRemnantCompositeSamples;
    }

    cachedSupernovaRemnantCompositeSamples =
      Object.freeze(
        buildSupernovaRemnantCompositeSamplesV1(),
      );

    return cachedSupernovaRemnantCompositeSamples;
  }

  static caseDefinition(
    caseId:
      GalacticObjectLaboratoryCaseId,

    emissionSampleIndex =
      0,

    reflectionSampleIndex =
      0,

    darkSampleIndex =
      0,

    planetarySampleIndex =
      0,

    hiiLowSampleIndex =
      0,

    hiiModerateSampleIndex =
      0,

    hiiHighSampleIndex =
      0,

    hiiIntenseSampleIndex =
      0,

    openClusterSampleIndex =
      0,

    globularClusterSampleIndex =
      0,

    supernovaRemnantShellSampleIndex =
      0,

    supernovaRemnantPlerionSampleIndex =
      0,

    supernovaRemnantCompositeSampleIndex =
      0,
  ): GalacticObjectLaboratoryCase {

    const caseDefinition =
      GALACTIC_OBJECT_LABORATORY_CASES
        .find(
          candidate =>
            candidate.id ===
            caseId,
        );

    if (
      caseDefinition ===
        undefined
    ) {
      throw new RangeError(
        `Unsupported GalacticObject laboratory case: ${String(caseId)}.`,
      );
    }

    if (
      caseId ===
        GalacticObjectLaboratoryCaseId
          .NEBULA_EMISSION
    ) {
      const sample =
        this
          .emissionNebulaSamples()[
            emissionSampleIndex
          ];

      if (
        sample ===
          undefined
      ) {
        throw new RangeError(
          `Unsupported emission-nebula laboratory sample index: ${emissionSampleIndex}.`,
        );
      }

      return caseOf(
        caseDefinition.id,
        caseDefinition.group,
        caseDefinition.label,
        caseDefinition.familyLabel,
        sample.locator,
        caseDefinition.resultKind,
        caseDefinition.expectedSubject,
        caseDefinition.expectedNebulaType,
        caseDefinition.expectedHiiActivity,
        caseDefinition.expectedRemnantMorphology,
        `Muestra ${sample.label} · ${caseDefinition.description}`,
      );
    }

    if (
      caseId ===
        GalacticObjectLaboratoryCaseId
          .NEBULA_REFLECTION
    ) {
      const sample =
        this
          .reflectionNebulaSamples()[
            reflectionSampleIndex
          ];

      if (
        sample ===
          undefined
      ) {
        throw new RangeError(
          `Unsupported reflection-nebula laboratory sample index: ${reflectionSampleIndex}.`,
        );
      }

      return caseOf(
        caseDefinition.id,
        caseDefinition.group,
        caseDefinition.label,
        caseDefinition.familyLabel,
        sample.locator,
        caseDefinition.resultKind,
        caseDefinition.expectedSubject,
        caseDefinition.expectedNebulaType,
        caseDefinition.expectedHiiActivity,
        caseDefinition.expectedRemnantMorphology,
        `Muestra ${sample.label} · ${caseDefinition.description}`,
      );
    }

    if (
      caseId ===
        GalacticObjectLaboratoryCaseId
          .NEBULA_DARK
    ) {
      const sample =
        this
          .darkNebulaSamples()[
            darkSampleIndex
          ];

      if (
        sample ===
          undefined
      ) {
        throw new RangeError(
          `Unsupported dark-nebula laboratory sample index: ${darkSampleIndex}.`,
        );
      }

      return caseOf(
        caseDefinition.id,
        caseDefinition.group,
        caseDefinition.label,
        caseDefinition.familyLabel,
        sample.locator,
        caseDefinition.resultKind,
        caseDefinition.expectedSubject,
        caseDefinition.expectedNebulaType,
        caseDefinition.expectedHiiActivity,
        caseDefinition.expectedRemnantMorphology,
        `Muestra ${sample.label} · ${caseDefinition.description}`,
      );
    }

    if (
      caseId ===
        GalacticObjectLaboratoryCaseId
          .NEBULA_PLANETARY
    ) {
      const sample =
        this
          .planetaryNebulaSamples()[
            planetarySampleIndex
          ];

      if (
        sample ===
          undefined
      ) {
        throw new RangeError(
          `Unsupported planetary-nebula laboratory sample index: ${planetarySampleIndex}.`,
        );
      }

      return caseOf(
        caseDefinition.id,
        caseDefinition.group,
        caseDefinition.label,
        caseDefinition.familyLabel,
        sample.locator,
        caseDefinition.resultKind,
        caseDefinition.expectedSubject,
        caseDefinition.expectedNebulaType,
        caseDefinition.expectedHiiActivity,
        caseDefinition.expectedRemnantMorphology,
        `Muestra ${sample.label} · ${caseDefinition.description}`,
      );
    }

    if (
      caseId ===
        GalacticObjectLaboratoryCaseId
          .HII_LOW
    ) {
      const sample =
        this
          .hiiLowSamples()[
            hiiLowSampleIndex
          ];

      if (
        sample ===
          undefined
      ) {
        throw new RangeError(
          `Unsupported LOW H II laboratory sample index: ${hiiLowSampleIndex}.`,
        );
      }

      return caseOf(
        caseDefinition.id,
        caseDefinition.group,
        caseDefinition.label,
        caseDefinition.familyLabel,
        sample.locator,
        caseDefinition.resultKind,
        caseDefinition.expectedSubject,
        caseDefinition.expectedNebulaType,
        caseDefinition.expectedHiiActivity,
        caseDefinition.expectedRemnantMorphology,
        `Muestra ${sample.label} · ${caseDefinition.description}`,
      );
    }

    if (
      caseId ===
        GalacticObjectLaboratoryCaseId
          .HII_MODERATE
    ) {
      const sample =
        this
          .hiiModerateSamples()[
            hiiModerateSampleIndex
          ];

      if (
        sample ===
          undefined
      ) {
        throw new RangeError(
          `Unsupported MODERATE H II laboratory sample index: ${hiiModerateSampleIndex}.`,
        );
      }

      return caseOf(
        caseDefinition.id,
        caseDefinition.group,
        caseDefinition.label,
        caseDefinition.familyLabel,
        sample.locator,
        caseDefinition.resultKind,
        caseDefinition.expectedSubject,
        caseDefinition.expectedNebulaType,
        caseDefinition.expectedHiiActivity,
        caseDefinition.expectedRemnantMorphology,
        `Muestra ${sample.label} · ${caseDefinition.description}`,
      );
    }

    if (
      caseId ===
        GalacticObjectLaboratoryCaseId
          .HII_HIGH
    ) {
      const sample =
        this
          .hiiHighSamples()[
            hiiHighSampleIndex
          ];

      if (
        sample ===
          undefined
      ) {
        throw new RangeError(
          `Unsupported HIGH H II laboratory sample index: ${hiiHighSampleIndex}.`,
        );
      }

      return caseOf(
        caseDefinition.id,
        caseDefinition.group,
        caseDefinition.label,
        caseDefinition.familyLabel,
        sample.locator,
        caseDefinition.resultKind,
        caseDefinition.expectedSubject,
        caseDefinition.expectedNebulaType,
        caseDefinition.expectedHiiActivity,
        caseDefinition.expectedRemnantMorphology,
        `Muestra ${sample.label} · ${caseDefinition.description}`,
      );
    }

    if (
      caseId ===
        GalacticObjectLaboratoryCaseId
          .HII_INTENSE
    ) {
      const sample =
        this
          .hiiIntenseSamples()[
            hiiIntenseSampleIndex
          ];

      if (
        sample ===
          undefined
      ) {
        throw new RangeError(
          `Unsupported INTENSE H II laboratory sample index: ${hiiIntenseSampleIndex}.`,
        );
      }

      return caseOf(
        caseDefinition.id,
        caseDefinition.group,
        caseDefinition.label,
        caseDefinition.familyLabel,
        sample.locator,
        caseDefinition.resultKind,
        caseDefinition.expectedSubject,
        caseDefinition.expectedNebulaType,
        caseDefinition.expectedHiiActivity,
        caseDefinition.expectedRemnantMorphology,
        `Muestra ${sample.label} · ${caseDefinition.description}`,
      );
    }

    if (
      caseId ===
        GalacticObjectLaboratoryCaseId
          .OPEN_CLUSTER
    ) {
      const sample =
        this
          .openClusterSamples()[
            openClusterSampleIndex
          ];

      if (
        sample ===
          undefined
      ) {
        throw new RangeError(
          `Unsupported open-cluster laboratory sample index: ${openClusterSampleIndex}.`,
        );
      }

      return caseOf(
        caseDefinition.id,
        caseDefinition.group,
        caseDefinition.label,
        caseDefinition.familyLabel,
        sample.locator,
        caseDefinition.resultKind,
        caseDefinition.expectedSubject,
        caseDefinition.expectedNebulaType,
        caseDefinition.expectedHiiActivity,
        caseDefinition.expectedRemnantMorphology,
        `Muestra ${sample.label} · ${caseDefinition.description}`,
      );
    }

    if (
      caseId ===
        GalacticObjectLaboratoryCaseId
          .GLOBULAR_CLUSTER
    ) {
      const sample =
        this
          .globularClusterSamples()[
            globularClusterSampleIndex
          ];

      if (
        sample ===
          undefined
      ) {
        throw new RangeError(
          `Unsupported globular-cluster laboratory sample index: ${globularClusterSampleIndex}.`,
        );
      }

      return caseOf(
        caseDefinition.id,
        caseDefinition.group,
        caseDefinition.label,
        caseDefinition.familyLabel,
        sample.locator,
        caseDefinition.resultKind,
        caseDefinition.expectedSubject,
        caseDefinition.expectedNebulaType,
        caseDefinition.expectedHiiActivity,
        caseDefinition.expectedRemnantMorphology,
        `Muestra ${sample.label} · ${caseDefinition.description}`,
      );
    }

    if (
      caseId ===
        GalacticObjectLaboratoryCaseId
          .SNR_SHELL
    ) {
      const sample =
        this
          .supernovaRemnantShellSamples()[
            supernovaRemnantShellSampleIndex
          ];

      if (
        sample ===
          undefined
      ) {
        throw new RangeError(
          `Unsupported SHELL supernova-remnant laboratory sample index: ${supernovaRemnantShellSampleIndex}.`,
        );
      }

      return caseOf(
        caseDefinition.id,
        caseDefinition.group,
        caseDefinition.label,
        caseDefinition.familyLabel,
        sample.locator,
        caseDefinition.resultKind,
        caseDefinition.expectedSubject,
        caseDefinition.expectedNebulaType,
        caseDefinition.expectedHiiActivity,
        caseDefinition.expectedRemnantMorphology,
        `Muestra ${sample.label} · ${caseDefinition.description}`,
      );
    }

    if (
      caseId ===
        GalacticObjectLaboratoryCaseId
          .SNR_PLERION
    ) {
      const sample =
        this
          .supernovaRemnantPlerionSamples()[
            supernovaRemnantPlerionSampleIndex
          ];

      if (
        sample ===
          undefined
      ) {
        throw new RangeError(
          `Unsupported PLERION supernova-remnant laboratory sample index: ${supernovaRemnantPlerionSampleIndex}.`,
        );
      }

      return caseOf(
        caseDefinition.id,
        caseDefinition.group,
        caseDefinition.label,
        caseDefinition.familyLabel,
        sample.locator,
        caseDefinition.resultKind,
        caseDefinition.expectedSubject,
        caseDefinition.expectedNebulaType,
        caseDefinition.expectedHiiActivity,
        caseDefinition.expectedRemnantMorphology,
        `Muestra ${sample.label} · ${caseDefinition.description}`,
      );
    }

    if (
      caseId ===
        GalacticObjectLaboratoryCaseId
          .SNR_COMPOSITE
    ) {
      const sample =
        this
          .supernovaRemnantCompositeSamples()[
            supernovaRemnantCompositeSampleIndex
          ];

      if (
        sample ===
          undefined
      ) {
        throw new RangeError(
          `Unsupported COMPOSITE supernova-remnant laboratory sample index: ${supernovaRemnantCompositeSampleIndex}.`,
        );
      }

      return caseOf(
        caseDefinition.id,
        caseDefinition.group,
        caseDefinition.label,
        caseDefinition.familyLabel,
        sample.locator,
        caseDefinition.resultKind,
        caseDefinition.expectedSubject,
        caseDefinition.expectedNebulaType,
        caseDefinition.expectedHiiActivity,
        caseDefinition.expectedRemnantMorphology,
        `Muestra ${sample.label} · ${caseDefinition.description}`,
      );
    }

    return caseDefinition;
  }

  static frames(
    caseId:
      GalacticObjectLaboratoryCaseId,

    emissionSampleIndex =
      0,

    reflectionSampleIndex =
      0,

    darkSampleIndex =
      0,

    planetarySampleIndex =
      0,

    hiiLowSampleIndex =
      0,

    hiiModerateSampleIndex =
      0,

    hiiHighSampleIndex =
      0,

    hiiIntenseSampleIndex =
      0,

    openClusterSampleIndex =
      0,

    globularClusterSampleIndex =
      0,

    supernovaRemnantShellSampleIndex =
      0,

    supernovaRemnantPlerionSampleIndex =
      0,

    supernovaRemnantCompositeSampleIndex =
      0,
  ): readonly GalacticObjectLaboratoryFrame[] {

    const caseDefinition =
      this.caseDefinition(
        caseId,
        emissionSampleIndex,
        reflectionSampleIndex,
        darkSampleIndex,
        planetarySampleIndex,
        hiiLowSampleIndex,
        hiiModerateSampleIndex,
        hiiHighSampleIndex,
        hiiIntenseSampleIndex,
        openClusterSampleIndex,
        globularClusterSampleIndex,
        supernovaRemnantShellSampleIndex,
        supernovaRemnantPlerionSampleIndex,
        supernovaRemnantCompositeSampleIndex,
      );

    if (
      caseDefinition.extremeType !==
        null
    ) {
      return buildExtremeLaboratoryFrames(
        caseDefinition,
      );
    }

    return Object.freeze(
      GALACTIC_OBJECT_LABORATORY_STATES
        .map(
          state =>
            Object.freeze({
              state,
              card:
                ArchiveGalacticObjectCardAssembler
                  .build(
                    GENERATION_KEY,
                    caseDefinition
                      .locator,
                    caseDefinition
                      .resultKind,
                    state.state,
                  ),
            }),
        ),
    );
  }
}

function buildExtremeLaboratoryFrames(
  caseDefinition:
    GalacticObjectLaboratoryCase,
): readonly GalacticObjectLaboratoryFrame[] {

  if (
    caseDefinition.extremeType ===
      null
  ) {
    throw new RangeError(
      'Extreme laboratory frames require a physical specialization.',
    );
  }

  return Object.freeze(
    GALACTIC_OBJECT_LABORATORY_STATES
      .map(
        state =>
          Object.freeze({
            state,
            card:
              buildExtremeLaboratoryCard(
                caseDefinition,
                state.state,
              ),
          }),
      ),
  );
}

function buildExtremeLaboratoryCard(
  caseDefinition:
    GalacticObjectLaboratoryCase,

  discoveryState:
    DiscoveryStateValue,
): ArchiveGalacticObjectCardModel {

  const extremeType =
    caseDefinition.extremeType;

  if (
    extremeType ===
      null
  ) {
    throw new RangeError(
      'Extreme laboratory card requires a physical specialization.',
    );
  }

  const definition =
    extremeTypeDefinition(
      extremeType,
    );

  const knowledgeLevel =
    knowledgeLevelForLaboratoryState(
      discoveryState,
    );

  const classified =
    knowledgeLevel ===
      ArchiveGalacticObjectKnowledgeLevel.CATALOGUED ||
    knowledgeLevel ===
      ArchiveGalacticObjectKnowledgeLevel.CONFIRMED;

  const confirmed =
    knowledgeLevel ===
      ArchiveGalacticObjectKnowledgeLevel.CONFIRMED;

  const hasSpecializedPreview =
    classified;

  const compactVisual =
    hasSpecializedPreview
      ? compactVisualForExtreme(
          extremeType,
        )
      : null;

  const title =
    knowledgeLevel ===
      ArchiveGalacticObjectKnowledgeLevel.SIGNAL
      ? 'Fuente extrema sin clasificar'
      : knowledgeLevel ===
          ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED
        ? 'Objeto compacto'
        : definition.label;

  const summary =
    knowledgeLevel ===
      ArchiveGalacticObjectKnowledgeLevel.SIGNAL
      ? 'La señal extrema está localizada, pero su naturaleza física permanece restringida hasta completar el reconocimiento científico.'
      : knowledgeLevel ===
          ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED
        ? 'La fuente extrema ya está reconocida como objeto compacto; la especialización física permanece restringida hasta su catalogación.'
        : confirmed
          ? `${definition.label}: la especialización física está confirmada y su caracterización científica principal está disponible.`
          : `${definition.label}: la clasificación física ya está catalogada; quedan pendientes las magnitudes de confirmación.`;

  return Object.freeze({
    coarseFamily:
      GalacticObjectScientificSurveyFamily.EXTREME_OBJECT,
    scientificSubject:
      classified
        ? caseDefinition.expectedSubject
        : null,
    knowledgeLevel,
    knowledgeLevelLabel:
      laboratoryKnowledgeLabel(
        knowledgeLevel,
      ),
    title,
    summary,
    nextScientificStep:
      laboratoryNextStep(
        knowledgeLevel,
      ),
    facts:
      classified
        ? extremeFacts(
            extremeType,
            confirmed,
          )
        : Object.freeze([]),
    scientificSections:
      Object.freeze([]),
    render:
      Object.freeze({
        kind:
          ArchiveGalacticObjectRenderKind.EXTREME_OBJECT,
        knowledgeLevel,
        seed:
          `LAB-EXTREME-${extremeType}`,
        accessibleLabel:
          hasSpecializedPreview
            ? `${definition.label} · representación científica de laboratorio`
            : 'Fuente extrema aún no especializada',
        variant:
          hasSpecializedPreview
            ? extremeType
            : null,
        compactVisual,
        scale:
          hasSpecializedPreview
            ? 0.72
            : 0.48,
        density:
          hasSpecializedPreview
            ? 0.62
            : 0.36,
        energy:
          hasSpecializedPreview
            ? 0.76
            : 0.42,
        concentration:
          hasSpecializedPreview
            ? 0.82
            : 0.54,
      }),
  });
}

function knowledgeLevelForLaboratoryState(
  state:
    DiscoveryStateValue,
): ArchiveGalacticObjectKnowledgeLevel {

  switch (
    state.name
  ) {
    case 'DETECTED':
      return ArchiveGalacticObjectKnowledgeLevel.SIGNAL;

    case 'DISCOVERED':
    case 'VISITED':
      return ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED;

    case 'CATALOGUED':
      return ArchiveGalacticObjectKnowledgeLevel.CATALOGUED;

    case 'CONFIRMED':
      return ArchiveGalacticObjectKnowledgeLevel.CONFIRMED;

    default:
      throw new RangeError(
        `Unsupported extreme laboratory discovery state: ${state.name}.`,
      );
  }
}

function laboratoryKnowledgeLabel(
  knowledgeLevel:
    ArchiveGalacticObjectKnowledgeLevel,
): string {

  switch (
    knowledgeLevel
  ) {
    case ArchiveGalacticObjectKnowledgeLevel.SIGNAL:
      return 'Señal';

    case ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED:
      return 'Identificado';

    case ArchiveGalacticObjectKnowledgeLevel.CATALOGUED:
      return 'Catalogado';

    case ArchiveGalacticObjectKnowledgeLevel.CONFIRMED:
      return 'Confirmado';

    default:
      throw new RangeError(
        `Unsupported laboratory knowledge level: ${String(knowledgeLevel)}.`,
      );
  }
}

function laboratoryNextStep(
  knowledgeLevel:
    ArchiveGalacticObjectKnowledgeLevel,
): string {

  switch (
    knowledgeLevel
  ) {
    case ArchiveGalacticObjectKnowledgeLevel.SIGNAL:
      return 'Reconocimiento de fuente extrema';

    case ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED:
      return 'Clasificación física del objeto compacto';

    case ArchiveGalacticObjectKnowledgeLevel.CATALOGUED:
      return 'Confirmación física de la especialización';

    case ArchiveGalacticObjectKnowledgeLevel.CONFIRMED:
      return 'Ciclo científico completado';

    default:
      throw new RangeError(
        `Unsupported laboratory knowledge level: ${String(knowledgeLevel)}.`,
      );
  }
}

function compactVisualForExtreme(
  extremeType:
    ExtremeTypeValue,
) {

  const visualKind:
    CompactObjectVisualKind =
    extremeType ===
        ExtremeType.NEUTRON_STAR
      ? 'NEUTRON_STAR'
      : extremeType ===
          ExtremeType.PULSAR
        ? 'PULSAR'
        : extremeType ===
            ExtremeType.MILLISECOND_PULSAR
          ? 'MILLISECOND_PULSAR'
          : extremeType ===
              ExtremeType.MAGNETAR
            ? 'MAGNETAR'
            : 'BLACK_HOLE';

  return compactObjectScientificVisual(
    visualKind,
    visualKind ===
      'BLACK_HOLE',
    false,
  );
}

function extremeFacts(
  extremeType:
    ExtremeTypeValue,

  confirmed:
    boolean,
) {

  if (
    extremeType ===
      ExtremeType.NEUTRON_STAR ||
    extremeType ===
      ExtremeType.PULSAR ||
    extremeType ===
      ExtremeType.MILLISECOND_PULSAR ||
    extremeType ===
      ExtremeType.MAGNETAR
  ) {
    const model =
      neutronStarLaboratoryModel(
        extremeType as
          NeutronStarLaboratoryKind,
        0,
      );

    const facts:
      ArchiveGalacticObjectFact[] = [
      Object.freeze({
        label: 'Masa',
        value: `${model.massSolar} M☉`,
      }),
      Object.freeze({
        label: 'Radio',
        value: `${model.radiusKm} km`,
      }),
    ];

    if (
      confirmed &&
      model.spinPeriodSeconds !==
        null
    ) {
      facts.push(
        Object.freeze({
          label: 'Periodo de giro',
          value: `${model.spinPeriodSeconds} s`,
        }),
      );
    }

    if (
      confirmed &&
      model.magneticFieldTesla !==
        null
    ) {
      facts.push(
        Object.freeze({
          label: 'Campo magnético',
          value: `${model.magneticFieldTesla.toExponential(2)} T`,
        }),
      );
    }

    return Object.freeze(
      facts,
    );
  }

  const model =
    blackHoleLaboratoryModel(
      extremeType as
        BlackHoleLaboratoryKind,
      0,
    );

  const facts:
    ArchiveGalacticObjectFact[] = [
    Object.freeze({
      label: 'Masa',
      value: `${model.massSolar.toExponential(3)} M☉`,
    }),
    Object.freeze({
      label: 'Radio de Schwarzschild',
      value: `${model.schwarzschildRadiusKm.toExponential(3)} km`,
    }),
  ];

  if (
    confirmed
  ) {
    facts.push(
      Object.freeze({
        label: 'Spin a*',
        value: model.spinDimensionless.toString(),
      }),
      Object.freeze({
        label: 'Acreción',
        value: `${(model.accretionRateEddington * 100).toFixed(1)} % Eddington`,
      }),
    );
  }

  return Object.freeze(
    facts,
  );
}

function buildHiiModerateSamplesV1():
  HiiModerateLaboratorySample[] {

  const primary =
    hiiRepresentativesV1()
      .get(
        StarFormationActivity
          .MODERATE,
      );

  if (
    primary ===
      undefined
  ) {
    throw new RangeError(
      'Missing canonical V1 MODERATE H II representative.',
    );
  }

  const primaryMorphology =
    hiiModerateMorphologyFamilyV1(
      primary,
    );

  const selected =
    new Map<
      HiiRegionModerateMorphologyFamily,
      GalacticObjectLocator
    >();

  selected.set(
    primaryMorphology,
    primary,
  );

  for (
    let index =
      0n;
    index <
      65_536n &&
    selected.size <
      HII_MODERATE_SAMPLE_COUNT;
    index +=
      1n
  ) {
    if (
      index ===
        primary.galacticObjectIndex
    ) {
      continue;
    }

    const locator =
      new GalacticObjectLocator(
        0n,
        NEBULA_SECTOR_KEY,
        index,
      );

    if (
      HiiRegionGenerator
        .resolveActivity(
          GENERATION_KEY,
          locator,
        ) !==
      StarFormationActivity
        .MODERATE
    ) {
      continue;
    }

    const morphology =
      hiiModerateMorphologyFamilyV1(
        locator,
      );

    if (
      selected.has(
        morphology,
      )
    ) {
      continue;
    }

    selected.set(
      morphology,
      locator,
    );
  }

  if (
    selected.size !==
      HII_MODERATE_SAMPLE_COUNT
  ) {
    throw new RangeError(
      `The visual laboratory found ${selected.size}/${HII_MODERATE_SAMPLE_COUNT} distinct MODERATE H II morphology families.`,
    );
  }

  const orderedLocators =
    [
      primary,
      ...Array.from(
        selected.values(),
      ).filter(
        locator =>
          locator.galacticObjectIndex !==
          primary.galacticObjectIndex,
      ),
    ];

  return orderedLocators.map(
    (
      locator,
      index,
    ) =>
      Object.freeze({
        index,
        label:
          String.fromCharCode(
            65 +
            index,
          ),
        locator,
      }),
  );
}

function hiiModerateMorphologyFamilyV1(
  locator:
    GalacticObjectLocator,
): HiiRegionModerateMorphologyFamily {

  const confirmed =
    ArchiveGalacticObjectCardAssembler
      .build(
        GENERATION_KEY,
        locator,
        ExplorationResultKind.NEBULA,
        DiscoveryState.CONFIRMED,
      );

  return HiiRegionModerateRenderModelBuilder
    .build(
      confirmed.render,
    )
    .morphologyFamily;
}

function buildHiiHighSamplesV1():
  HiiHighLaboratorySample[] {

  const primary =
    hiiRepresentativesV1()
      .get(
        StarFormationActivity
          .HIGH,
      );

  if (
    primary ===
      undefined
  ) {
    throw new RangeError(
      'Missing canonical V1 HIGH H II representative.',
    );
  }

  const primaryMorphology =
    hiiHighMorphologyFamilyV1(
      primary,
    );

  const selected =
    new Map<
      HiiRegionHighMorphologyFamily,
      GalacticObjectLocator
    >();

  selected.set(
    primaryMorphology,
    primary,
  );

  for (
    let index =
      0n;
    index <
      65_536n &&
    selected.size <
      HII_HIGH_SAMPLE_COUNT;
    index +=
      1n
  ) {
    if (
      index ===
        primary.galacticObjectIndex
    ) {
      continue;
    }

    const locator =
      new GalacticObjectLocator(
        0n,
        NEBULA_SECTOR_KEY,
        index,
      );

    if (
      HiiRegionGenerator
        .resolveActivity(
          GENERATION_KEY,
          locator,
        ) !==
      StarFormationActivity
        .HIGH
    ) {
      continue;
    }

    const morphology =
      hiiHighMorphologyFamilyV1(
        locator,
      );

    if (
      selected.has(
        morphology,
      )
    ) {
      continue;
    }

    selected.set(
      morphology,
      locator,
    );
  }

  if (
    selected.size !==
      HII_HIGH_SAMPLE_COUNT
  ) {
    throw new RangeError(
      `The visual laboratory found ${selected.size}/${HII_HIGH_SAMPLE_COUNT} distinct HIGH H II morphology families.`,
    );
  }

  const orderedLocators =
    [
      primary,
      ...Array.from(
        selected.values(),
      ).filter(
        locator =>
          locator.galacticObjectIndex !==
          primary.galacticObjectIndex,
      ),
    ];

  return orderedLocators.map(
    (
      locator,
      index,
    ) =>
      Object.freeze({
        index,
        label:
          String.fromCharCode(
            65 +
            index,
          ),
        locator,
      }),
  );
}

function hiiHighMorphologyFamilyV1(
  locator:
    GalacticObjectLocator,
): HiiRegionHighMorphologyFamily {

  const confirmed =
    ArchiveGalacticObjectCardAssembler
      .build(
        GENERATION_KEY,
        locator,
        ExplorationResultKind.NEBULA,
        DiscoveryState.CONFIRMED,
      );

  return HiiRegionHighRenderModelBuilder
    .build(
      confirmed.render,
    )
    .morphologyFamily;
}

function buildHiiIntenseSamplesV1():
  HiiIntenseLaboratorySample[] {

  const primary =
    hiiRepresentativesV1()
      .get(
        StarFormationActivity
          .INTENSE,
      );

  if (
    primary ===
      undefined
  ) {
    throw new RangeError(
      'Missing canonical V1 INTENSE H II representative.',
    );
  }

  const primaryMorphology =
    hiiIntenseMorphologyFamilyV1(
      primary,
    );

  const selected =
    new Map<
      HiiRegionIntenseMorphologyFamily,
      GalacticObjectLocator
    >();

  selected.set(
    primaryMorphology,
    primary,
  );

  for (
    let index =
      0n;
    index <
      65_536n &&
    selected.size <
      HII_INTENSE_SAMPLE_COUNT;
    index +=
      1n
  ) {
    if (
      index ===
        primary.galacticObjectIndex
    ) {
      continue;
    }

    const locator =
      new GalacticObjectLocator(
        0n,
        NEBULA_SECTOR_KEY,
        index,
      );

    if (
      HiiRegionGenerator
        .resolveActivity(
          GENERATION_KEY,
          locator,
        ) !==
      StarFormationActivity
        .INTENSE
    ) {
      continue;
    }

    const morphology =
      hiiIntenseMorphologyFamilyV1(
        locator,
      );

    if (
      selected.has(
        morphology,
      )
    ) {
      continue;
    }

    selected.set(
      morphology,
      locator,
    );
  }

  if (
    selected.size !==
      HII_INTENSE_SAMPLE_COUNT
  ) {
    throw new RangeError(
      `The visual laboratory found ${selected.size}/${HII_INTENSE_SAMPLE_COUNT} distinct INTENSE H II morphology families.`,
    );
  }

  const orderedLocators =
    [
      primary,
      ...Array.from(
        selected.values(),
      ).filter(
        locator =>
          locator.galacticObjectIndex !==
          primary.galacticObjectIndex,
      ),
    ];

  return orderedLocators.map(
    (
      locator,
      index,
    ) =>
      Object.freeze({
        index,
        label:
          String.fromCharCode(
            65 +
            index,
          ),
        locator,
      }),
  );
}

function hiiIntenseMorphologyFamilyV1(
  locator:
    GalacticObjectLocator,
): HiiRegionIntenseMorphologyFamily {

  const confirmed =
    ArchiveGalacticObjectCardAssembler
      .build(
        GENERATION_KEY,
        locator,
        ExplorationResultKind.NEBULA,
        DiscoveryState.CONFIRMED,
      );

  return HiiRegionIntenseRenderModelBuilder
    .build(
      confirmed.render,
    )
    .morphologyFamily;
}

function buildHiiLowSamplesV1():
  HiiLowLaboratorySample[] {

  const primary =
    hiiRepresentativesV1()
      .get(
        StarFormationActivity
          .LOW,
      );

  if (
    primary ===
      undefined
  ) {
    throw new RangeError(
      'Missing canonical V1 LOW H II representative.',
    );
  }

  const primaryMorphology =
    hiiLowMorphologyFamilyV2(
      primary,
    );

  const lockedFamilies =
    new Set<
      HiiRegionLowMorphologyFamily
    >([
      primaryMorphology,
    ]);

  const bestByFamily =
    new Map<
      HiiRegionLowMorphologyFamily,
      {
        readonly locator:
          GalacticObjectLocator;

        readonly score:
          number;
      }
    >();

  /*
   * V2.2 laboratory refinement: preserve the canonical LOW representative as A
   * and still guarantee one sample per morphology family, but do not stop at
   * the first hit. Search a deterministic real LOW-only window and keep the
   * strongest visual representative found for each remaining family. This keeps
   * the scientific grounding intact while separating families more clearly in
   * the A..H comparison grid.
   */
  for (
    let index =
      0n;
    index <
      32_768n;
    index +=
      1n
  ) {
    if (
      index ===
        primary.galacticObjectIndex
    ) {
      continue;
    }

    const locator =
      new GalacticObjectLocator(
        0n,
        NEBULA_SECTOR_KEY,
        index,
      );

    if (
      HiiRegionGenerator
        .resolveActivity(
          GENERATION_KEY,
          locator,
        ) !==
      StarFormationActivity
        .LOW
    ) {
      continue;
    }

    const model =
      hiiLowRenderModelV2(
        locator,
      );

    const morphology =
      model.morphologyFamily;

    if (
      lockedFamilies.has(
        morphology,
      )
    ) {
      continue;
    }

    const score =
      hiiLowRepresentativeScoreV2(
        model,
      );

    const currentBest =
      bestByFamily.get(
        morphology,
      );

    if (
      currentBest ===
        undefined ||
      score >
        currentBest.score
    ) {
      bestByFamily.set(
        morphology,
        Object.freeze({
          locator,
          score,
        }),
      );
    }
  }

  const orderedFamilies =
    allHiiLowMorphologyFamiliesV2()
      .filter(
        family =>
          family !==
          primaryMorphology,
      );

  const orderedLocators =
    [
      primary,
      ...orderedFamilies.map(
        family => {
          const candidate =
            bestByFamily.get(
              family,
            );

          if (
            candidate ===
              undefined
          ) {
            throw new RangeError(
              `The V2.2 visual laboratory could not find a representative for LOW H II morphology family ${family}.`,
            );
          }

          return candidate.locator;
        },
      ),
    ];

  if (
    orderedLocators.length !==
      HII_LOW_SAMPLE_COUNT
  ) {
    throw new RangeError(
      `The V2.2 visual laboratory found ${orderedLocators.length}/${HII_LOW_SAMPLE_COUNT} LOW H II morphology representatives.`,
    );
  }

  return orderedLocators.map(
    (
      locator,
      index,
    ) =>
      Object.freeze({
        index,
        label:
          String.fromCharCode(
            65 +
            index,
          ),
        locator,
      }),
  );
}

function hiiLowMorphologyFamilyV2(
  locator:
    GalacticObjectLocator,
): HiiRegionLowMorphologyFamily {

  return hiiLowRenderModelV2(
    locator,
  )
    .morphologyFamily;
}

function hiiLowRenderModelV2(
  locator:
    GalacticObjectLocator,
) {

  const confirmed =
    ArchiveGalacticObjectCardAssembler
      .build(
        GENERATION_KEY,
        locator,
        ExplorationResultKind.NEBULA,
        DiscoveryState.CONFIRMED,
      );

  return HiiRegionLowRenderModelBuilder
    .build(
      confirmed.render,
    );
}

function allHiiLowMorphologyFamiliesV2():
  readonly HiiRegionLowMorphologyFamily[] {

  return Object.freeze([
    'BUBBLE',
    'BLISTER',
    'CLUMPY',
    'COMPACT',
    'PILLARS',
    'FILAMENTARY',
    'DOUBLE',
    'BROKEN_SHELL',
  ]);
}

function hiiLowRepresentativeScoreV2(
  model:
    ReturnType<
      typeof HiiRegionLowRenderModelBuilder.build
    >,
): number {

  const common =
    model.apparentExtent *
      0.60 +
    model.volumeDepth *
      0.30 +
    model.edgeSharpness *
      0.40 +
    model.paletteAccent *
      0.18 +
    model.chromaGain *
      0.12;

  switch (
    model.morphologyFamily
  ) {
    case 'BUBBLE':
      return common +
        model.shellStrength *
          1.50 +
        model.cavityStrength *
          0.90 +
        model.cavityRadius *
          0.80 -
        model.asymmetryStrength *
          0.22;

    case 'BLISTER':
      return common +
        model.asymmetryStrength *
          1.40 +
        model.sourceSpread *
          1.10 +
        model.edgeSharpness *
          0.50 +
        model.pillarStrength *
          0.20;

    case 'CLUMPY':
      return common +
        model.morphologyNoiseScale *
          1.15 +
        model.asymmetryStrength *
          0.60 +
        model.sourceSpread *
          0.40;

    case 'COMPACT':
      return common +
        (
          1.20 -
          model.apparentExtent
        ) *
          1.20 +
        model.concentration *
          0.70 +
        model.edgeSharpness *
          0.30;

    case 'PILLARS':
      return common +
        model.pillarStrength *
          1.80 +
        model.dustLaneStrength *
          0.95 +
        model.asymmetryStrength *
          0.30;

    case 'FILAMENTARY':
      return common +
        model.structureAspect *
          1.20 +
        model.morphologyNoiseScale *
          0.90 +
        model.edgeSharpness *
          0.45;

    case 'DOUBLE':
      return common +
        model.lobeStrength *
          1.85 +
        model.sourceSpread *
          0.80 +
        model.apparentExtent *
          0.25;

    case 'BROKEN_SHELL':
      return common +
        model.shellStrength *
          1.30 +
        model.asymmetryStrength *
          1.00 +
        model.cavityRadius *
          0.60;
  }
}

function buildOpenClusterSamplesV1():
  OpenClusterLaboratorySample[] {

  const primary =
    new GalacticObjectLocator(
      0n,
      0n,
      2n,
    );

  if (
    !OpenClusterGenerator
      .isOpenClusterLocator(
        GENERATION_KEY,
        primary,
      )
  ) {
    throw new RangeError(
      'Missing canonical V1 open-cluster representative.',
    );
  }

  const primaryModel =
    openClusterRenderModelV1(
      primary,
    );

  const familyOrder =
    allOpenClusterMorphologyFamiliesV1();

  const candidates =
    new Map<
      OpenClusterMorphologyFamily,
      {
        readonly preferred:
          GalacticObjectLocator | null;

        readonly fallback:
          GalacticObjectLocator | null;
      }
    >();

  for (
    const family
    of familyOrder
  ) {
    candidates.set(
      family,
      Object.freeze({
        preferred:
          family ===
            primaryModel.morphologyFamily
            ? primary
            : null,
        fallback:
          family ===
            primaryModel.morphologyFamily
            ? primary
            : null,
      }),
    );
  }

  for (
    let index =
      0n;
    index <
      16_384n;
    index +=
      1n
  ) {
    if (
      index ===
        primary.galacticObjectIndex
    ) {
      continue;
    }

    const locator =
      new GalacticObjectLocator(
        0n,
        0n,
        index,
      );

    if (
      !OpenClusterGenerator
        .isOpenClusterLocator(
          GENERATION_KEY,
          locator,
        )
    ) {
      continue;
    }

    const model =
      openClusterRenderModelV1(
        locator,
      );

    if (
      model.morphologyFamily ===
        primaryModel.morphologyFamily
    ) {
      continue;
    }

    const current =
      candidates.get(
        model.morphologyFamily,
      );

    if (
      current ===
        undefined
    ) {
      continue;
    }

    const targetPalette =
      openClusterTargetPaletteIndexV1(
        model.morphologyIndex,
        primaryModel.paletteIndex,
      );

    candidates.set(
      model.morphologyFamily,
      Object.freeze({
        preferred:
          current.preferred ??
          (
            model.paletteIndex ===
              targetPalette
              ? locator
              : null
          ),
        fallback:
          current.fallback ??
          locator,
      }),
    );

    const allPreferredFound =
      familyOrder.every(
        family =>
          family ===
            primaryModel.morphologyFamily ||
          (
            candidates.get(
              family,
            )?.preferred ??
            null
          ) !==
            null,
      );

    if (
      allPreferredFound
    ) {
      break;
    }
  }

  const orderedLocators =
    [
      primary,
      ...familyOrder
        .filter(
          family =>
            family !==
            primaryModel.morphologyFamily,
        )
        .map(
          family => {
            const candidate =
              candidates.get(
                family,
              );

            const locator =
              candidate?.preferred ??
              candidate?.fallback ??
              null;

            if (
              locator ===
                null
            ) {
              throw new RangeError(
                `The open-cluster visual laboratory could not find morphology family ${family}.`,
              );
            }

            return locator;
          },
        ),
    ];

  if (
    orderedLocators.length !==
      OPEN_CLUSTER_SAMPLE_COUNT
  ) {
    throw new RangeError(
      `The open-cluster visual laboratory found ${orderedLocators.length}/${OPEN_CLUSTER_SAMPLE_COUNT} morphology representatives.`,
    );
  }

  return orderedLocators.map(
    (
      locator,
      index,
    ) =>
      Object.freeze({
        index,
        label:
          String.fromCharCode(
            65 +
            index,
          ),
        locator,
      }),
  );
}

function openClusterRenderModelV1(
  locator:
    GalacticObjectLocator,
) {

  const detected =
    ArchiveGalacticObjectCardAssembler
      .build(
        GENERATION_KEY,
        locator,
        ExplorationResultKind.STAR_CLUSTER,
        DiscoveryState.DETECTED,
      );

  return OpenClusterRenderModelBuilder
    .build(
      detected.render,
    );
}

function allOpenClusterMorphologyFamiliesV1():
  readonly OpenClusterMorphologyFamily[] {

  return Object.freeze([
    'LOOSE',
    'COMPACT',
    'ELONGATED',
    'SUBCLUSTERED',
    'CHAIN',
    'ASYMMETRIC',
    'HALO',
    'MULTI_CORE',
  ]);
}

function openClusterTargetPaletteIndexV1(
  morphologyIndex:
    number,

  primaryPaletteIndex:
    number,
): number {

  return (
    morphologyIndex +
    primaryPaletteIndex +
    1
  ) %
    6;
}

function buildGlobularClusterSamplesV1():
  GlobularClusterLaboratorySample[] {

  const primary =
    new GalacticObjectLocator(
      0n,
      0n,
      7n,
    );

  if (
    !GlobularClusterGenerator
      .isGlobularClusterLocator(
        GENERATION_KEY,
        primary,
      )
  ) {
    throw new RangeError(
      'Missing canonical V1 globular-cluster representative.',
    );
  }

  const primaryModel =
    globularClusterRenderModelV1(
      primary,
    );

  const familyOrder =
    allGlobularClusterMorphologyFamiliesV1();

  const candidates =
    new Map<
      GlobularClusterMorphologyFamily,
      {
        readonly preferred:
          GalacticObjectLocator | null;

        readonly fallback:
          GalacticObjectLocator | null;
      }
    >();

  for (
    const family
    of familyOrder
  ) {
    candidates.set(
      family,
      Object.freeze({
        preferred:
          family ===
            primaryModel.morphologyFamily
            ? primary
            : null,
        fallback:
          family ===
            primaryModel.morphologyFamily
            ? primary
            : null,
      }),
    );
  }

  for (
    let index =
      0n;
    index <
      16_384n;
    index +=
      1n
  ) {
    if (
      index ===
        primary.galacticObjectIndex
    ) {
      continue;
    }

    const locator =
      new GalacticObjectLocator(
        0n,
        0n,
        index,
      );

    if (
      !GlobularClusterGenerator
        .isGlobularClusterLocator(
          GENERATION_KEY,
          locator,
        )
    ) {
      continue;
    }

    const model =
      globularClusterRenderModelV1(
        locator,
      );

    if (
      model.morphologyFamily ===
        primaryModel.morphologyFamily
    ) {
      continue;
    }

    const current =
      candidates.get(
        model.morphologyFamily,
      );

    if (
      current ===
        undefined
    ) {
      continue;
    }

    const targetPalette =
      globularClusterTargetPaletteIndexV1(
        model.morphologyIndex,
        primaryModel.paletteIndex,
      );

    candidates.set(
      model.morphologyFamily,
      Object.freeze({
        preferred:
          current.preferred ??
          (
            model.paletteIndex ===
              targetPalette
              ? locator
              : null
          ),
        fallback:
          current.fallback ??
          locator,
      }),
    );

    const allPreferredFound =
      familyOrder.every(
        family =>
          family ===
            primaryModel.morphologyFamily ||
          (
            candidates.get(
              family,
            )?.preferred ??
            null
          ) !==
            null,
      );

    if (
      allPreferredFound
    ) {
      break;
    }
  }

  const orderedLocators =
    [
      primary,
      ...familyOrder
        .filter(
          family =>
            family !==
            primaryModel.morphologyFamily,
        )
        .map(
          family => {
            const candidate =
              candidates.get(
                family,
              );

            const locator =
              candidate?.preferred ??
              candidate?.fallback ??
              null;

            if (
              locator ===
                null
            ) {
              throw new RangeError(
                `The globular-cluster visual laboratory could not find morphology family ${family}.`,
              );
            }

            return locator;
          },
        ),
    ];

  if (
    orderedLocators.length !==
      GLOBULAR_CLUSTER_SAMPLE_COUNT
  ) {
    throw new RangeError(
      `The globular-cluster visual laboratory found ${orderedLocators.length}/${GLOBULAR_CLUSTER_SAMPLE_COUNT} morphology representatives.`,
    );
  }

  return orderedLocators.map(
    (
      locator,
      index,
    ) =>
      Object.freeze({
        index,
        label:
          String.fromCharCode(
            65 +
            index,
          ),
        locator,
      }),
  );
}

function globularClusterRenderModelV1(
  locator:
    GalacticObjectLocator,
) {

  const detected =
    ArchiveGalacticObjectCardAssembler
      .build(
        GENERATION_KEY,
        locator,
        ExplorationResultKind.STAR_CLUSTER,
        DiscoveryState.DETECTED,
      );

  return GlobularClusterRenderModelBuilder
    .build(
      detected.render,
    );
}

function allGlobularClusterMorphologyFamiliesV1():
  readonly GlobularClusterMorphologyFamily[] {

  return Object.freeze([
    'CLASSIC',
    'CORE_COLLAPSED',
    'EXTENDED_HALO',
    'ELLIPTICAL',
    'TIDAL_STRETCHED',
    'ASYMMETRIC_HALO',
    'GRANULAR_CORE',
    'RICH_HALO',
  ]);
}

function globularClusterTargetPaletteIndexV1(
  morphologyIndex:
    number,

  primaryPaletteIndex:
    number,
): number {

  return (
    morphologyIndex +
    primaryPaletteIndex +
    2
  ) %
    6;
}

function buildSupernovaRemnantShellSamplesV1():
  SupernovaRemnantShellLaboratorySample[] {

  const primary =
    remnantRepresentativesV1()
      .get(
        SupernovaRemnantMorphology
          .SHELL,
      );

  if (
    primary ===
      undefined
  ) {
    throw new RangeError(
      'Missing canonical V1 SHELL supernova-remnant representative.',
    );
  }

  const primaryModel =
    supernovaRemnantShellRenderModelV1(
      primary,
    );

  const familyOrder =
    allSupernovaRemnantShellVisualFamiliesV1();

  const representatives =
    new Map<
      SupernovaRemnantVisualFamily,
      GalacticObjectLocator
    >();

  representatives.set(
    primaryModel.morphologyFamily,
    primary,
  );

  for (
    let index =
      0n;
    index <
      16_384n;
    index +=
      1n
  ) {
    if (
      index ===
        primary.galacticObjectIndex
    ) {
      continue;
    }

    const locator =
      new GalacticObjectLocator(
        0n,
        0n,
        index,
      );

    if (
      !SupernovaRemnantGenerator
        .isSupernovaRemnantLocator(
          GENERATION_KEY,
          locator,
        )
    ) {
      continue;
    }

    if (
      SupernovaRemnantGenerator
        .resolveMorphology(
          GENERATION_KEY,
          locator,
        ) !==
      SupernovaRemnantMorphology
        .SHELL
    ) {
      continue;
    }

    const model =
      supernovaRemnantShellRenderModelV1(
        locator,
      );

    if (
      !representatives.has(
        model.morphologyFamily,
      )
    ) {
      representatives.set(
        model.morphologyFamily,
        locator,
      );
    }

    if (
      representatives.size ===
        SUPERNOVA_REMNANT_SHELL_SAMPLE_COUNT
    ) {
      break;
    }
  }

  const orderedLocators =
    [
      primary,
      ...familyOrder
        .filter(
          family =>
            family !==
              primaryModel.morphologyFamily,
        )
        .map(
          family => {
            const locator =
              representatives.get(
                family,
              );

            if (
              locator ===
                undefined
            ) {
              throw new RangeError(
                `The SHELL supernova-remnant visual laboratory could not find morphology family ${family}.`,
              );
            }

            return locator;
          },
        ),
    ];

  if (
    orderedLocators.length !==
      SUPERNOVA_REMNANT_SHELL_SAMPLE_COUNT
  ) {
    throw new RangeError(
      `The SHELL supernova-remnant visual laboratory found ${orderedLocators.length}/${SUPERNOVA_REMNANT_SHELL_SAMPLE_COUNT} morphology representatives.`,
    );
  }

  return orderedLocators.map(
    (
      locator,
      index,
    ) =>
      Object.freeze({
        index,
        label:
          String.fromCharCode(
            65 +
            index,
          ),
        locator,
      }),
  );
}

function supernovaRemnantShellRenderModelV1(
  locator:
    GalacticObjectLocator,
) {

  const detected =
    ArchiveGalacticObjectCardAssembler
      .build(
        GENERATION_KEY,
        locator,
        ExplorationResultKind.EXTREME_OBJECT,
        DiscoveryState.DETECTED,
      );

  return SupernovaRemnantRenderModelBuilder
    .build(
      detected.render,
    );
}

function allSupernovaRemnantShellVisualFamiliesV1():
  readonly SupernovaRemnantVisualFamily[] {

  return Object.freeze([
    'FRACTURED_SHELL',
    'FILAMENT_RING',
    'BILOBED_SHELL',
    'KNOTTY_SHELL',
    'WISPY_ARC',
    'BUBBLE_SHELL',
    'OFFSET_SHELL',
    'SHOCK_COMPLEX',
  ]);
}


function buildSupernovaRemnantPlerionSamplesV1():
  SupernovaRemnantPlerionLaboratorySample[] {

  const primary =
    remnantRepresentativesV1()
      .get(
        SupernovaRemnantMorphology
          .PLERION,
      );

  if (
    primary ===
      undefined
  ) {
    throw new RangeError(
      'Missing canonical V1 PLERION supernova-remnant representative.',
    );
  }

  const primaryModel =
    supernovaRemnantPlerionRenderModelV1(
      primary,
    );

  const familyOrder =
    allSupernovaRemnantPlerionVisualFamiliesV1();

  const representatives =
    new Map<
      SupernovaRemnantPlerionVisualFamily,
      GalacticObjectLocator
    >();

  representatives.set(
    primaryModel.morphologyFamily as
      SupernovaRemnantPlerionVisualFamily,
    primary,
  );

  for (
    let index =
      0n;
    index <
      32_768n;
    index +=
      1n
  ) {
    if (
      index ===
        primary.galacticObjectIndex
    ) {
      continue;
    }

    const locator =
      new GalacticObjectLocator(
        0n,
        0n,
        index,
      );

    if (
      !SupernovaRemnantGenerator
        .isSupernovaRemnantLocator(
          GENERATION_KEY,
          locator,
        )
    ) {
      continue;
    }

    if (
      SupernovaRemnantGenerator
        .resolveMorphology(
          GENERATION_KEY,
          locator,
        ) !==
      SupernovaRemnantMorphology
        .PLERION
    ) {
      continue;
    }

    const model =
      supernovaRemnantPlerionRenderModelV1(
        locator,
      );

    const family =
      model.morphologyFamily as
        SupernovaRemnantPlerionVisualFamily;

    if (
      !representatives.has(
        family,
      )
    ) {
      representatives.set(
        family,
        locator,
      );
    }

    if (
      representatives.size ===
        SUPERNOVA_REMNANT_PLERION_SAMPLE_COUNT
    ) {
      break;
    }
  }

  const orderedLocators =
    [
      primary,
      ...familyOrder
        .filter(
          family =>
            family !==
              primaryModel.morphologyFamily,
        )
        .map(
          family => {
            const locator =
              representatives.get(
                family,
              );

            if (
              locator ===
                undefined
            ) {
              throw new RangeError(
                `The PLERION supernova-remnant visual laboratory could not find morphology family ${family}.`,
              );
            }

            return locator;
          },
        ),
    ];

  if (
    orderedLocators.length !==
      SUPERNOVA_REMNANT_PLERION_SAMPLE_COUNT
  ) {
    throw new RangeError(
      `The PLERION supernova-remnant visual laboratory found ${orderedLocators.length}/${SUPERNOVA_REMNANT_PLERION_SAMPLE_COUNT} morphology representatives.`,
    );
  }

  return orderedLocators.map(
    (
      locator,
      index,
    ) =>
      Object.freeze({
        index,
        label:
          String.fromCharCode(
            65 +
            index,
          ),
        locator,
      }),
  );
}

function supernovaRemnantPlerionRenderModelV1(
  locator:
    GalacticObjectLocator,
) {

  const detected =
    ArchiveGalacticObjectCardAssembler
      .build(
        GENERATION_KEY,
        locator,
        ExplorationResultKind.EXTREME_OBJECT,
        DiscoveryState.DETECTED,
      );

  return SupernovaRemnantRenderModelBuilder
    .build(
      detected.render,
    );
}

function allSupernovaRemnantPlerionVisualFamiliesV1():
  readonly SupernovaRemnantPlerionVisualFamily[] {

  return Object.freeze([
    'FILAMENTARY_WIND_NEBULA',
    'PETALLED_CORE',
    'TORUS_JET',
    'ELLIPTICAL_WISPS',
    'KNOTTED_SYNCHROTRON',
    'DOUBLE_HALO',
    'OFFSET_PLUME',
    'TURBULENT_WIND_WEB',
  ]);
}

function buildSupernovaRemnantCompositeSamplesV1():
  SupernovaRemnantCompositeLaboratorySample[] {

  const primary =
    remnantRepresentativesV1()
      .get(
        SupernovaRemnantMorphology
          .COMPOSITE,
      );

  if (
    primary ===
      undefined
  ) {
    throw new RangeError(
      'Missing canonical V1 COMPOSITE supernova-remnant representative.',
    );
  }

  const primaryModel =
    supernovaRemnantCompositeRenderModelV1(
      primary,
    );

  const familyOrder =
    allSupernovaRemnantCompositeVisualFamiliesV1();

  const representatives =
    new Map<
      SupernovaRemnantCompositeVisualFamily,
      GalacticObjectLocator
    >();

  representatives.set(
    primaryModel.morphologyFamily as
      SupernovaRemnantCompositeVisualFamily,
    primary,
  );

  for (
    let index =
      0n;
    index <
      65_536n;
    index +=
      1n
  ) {
    if (
      index ===
        primary.galacticObjectIndex
    ) {
      continue;
    }

    const locator =
      new GalacticObjectLocator(
        0n,
        0n,
        index,
      );

    if (
      !SupernovaRemnantGenerator
        .isSupernovaRemnantLocator(
          GENERATION_KEY,
          locator,
        )
    ) {
      continue;
    }

    if (
      SupernovaRemnantGenerator
        .resolveMorphology(
          GENERATION_KEY,
          locator,
        ) !==
      SupernovaRemnantMorphology
        .COMPOSITE
    ) {
      continue;
    }

    const model =
      supernovaRemnantCompositeRenderModelV1(
        locator,
      );

    const family =
      model.morphologyFamily as
        SupernovaRemnantCompositeVisualFamily;

    if (
      !representatives.has(
        family,
      )
    ) {
      representatives.set(
        family,
        locator,
      );
    }

    if (
      representatives.size ===
        SUPERNOVA_REMNANT_COMPOSITE_SAMPLE_COUNT
    ) {
      break;
    }
  }

  const orderedLocators =
    [
      primary,
      ...familyOrder
        .filter(
          family =>
            family !==
              primaryModel.morphologyFamily,
        )
        .map(
          family => {
            const locator =
              representatives.get(
                family,
              );

            if (
              locator ===
                undefined
            ) {
              throw new RangeError(
                `The COMPOSITE supernova-remnant visual laboratory could not find morphology family ${family}.`,
              );
            }

            return locator;
          },
        ),
    ];

  if (
    orderedLocators.length !==
      SUPERNOVA_REMNANT_COMPOSITE_SAMPLE_COUNT
  ) {
    throw new RangeError(
      `The COMPOSITE supernova-remnant visual laboratory found ${orderedLocators.length}/${SUPERNOVA_REMNANT_COMPOSITE_SAMPLE_COUNT} morphology representatives.`,
    );
  }

  return orderedLocators.map(
    (
      locator,
      index,
    ) =>
      Object.freeze({
        index,
        label:
          String.fromCharCode(
            65 +
            index,
          ),
        locator,
      }),
  );
}

function supernovaRemnantCompositeRenderModelV1(
  locator:
    GalacticObjectLocator,
) {

  const detected =
    ArchiveGalacticObjectCardAssembler
      .build(
        GENERATION_KEY,
        locator,
        ExplorationResultKind.EXTREME_OBJECT,
        DiscoveryState.DETECTED,
      );

  return SupernovaRemnantRenderModelBuilder
    .build(
      detected.render,
    );
}

function allSupernovaRemnantCompositeVisualFamiliesV1():
  readonly SupernovaRemnantCompositeVisualFamily[] {

  return Object.freeze([
    'BALANCED_CORE_SHELL',
    'BIPOLAR_PWN_SHELL',
    'OFFSET_CORE_SHELL',
    'FILAMENT_BRIDGE',
    'BREAKOUT_COMPOSITE',
    'DOUBLE_ARC_CORE',
    'KNOTTED_RIM_PULSAR',
    'WIND_TAIL_SHELL',
  ]);
}



function buildEmissionNebulaSamplesV1():
  EmissionNebulaLaboratorySample[] {

  const locators:
    GalacticObjectLocator[] =
    [];

  /*
   * Preserve the already-validated O17 representative as sample A.
   */
  const primary =
    new GalacticObjectLocator(
      0n,
      NEBULA_SECTOR_KEY,
      17n,
    );

  requireEmissionNebulaV1(
    primary,
  );

  locators.push(
    primary,
  );

  for (
    let index =
      0n;
    index <
      4_096n &&
    locators.length <
      EMISSION_NEBULA_SAMPLE_COUNT;
    index +=
      1n
  ) {
    if (
      index ===
        primary
          .galacticObjectIndex
    ) {
      continue;
    }

    const locator =
      new GalacticObjectLocator(
        0n,
        NEBULA_SECTOR_KEY,
        index,
      );

    /*
     * GalacticObject indices are partitioned first by the canonical point-9.4
     * coarse family. Never ask NebulaGenerator to materialize a locator that
     * belongs to STAR_CLUSTER or EXTREME_OBJECT.
     */
    if (
      !NebulaGenerator
        .isNebulaLocator(
          GENERATION_KEY,
          locator,
        )
    ) {
      continue;
    }

    const nebula =
      NebulaGenerator
        .generate(
          GENERATION_KEY,
          locator,
        );

    if (
      nebula.nebulaType !==
        NebulaType.EMISSION
    ) {
      continue;
    }

    if (
      HiiRegionGenerator
        .isHiiRegionLocator(
          GENERATION_KEY,
          locator,
        )
    ) {
      continue;
    }

    locators.push(
      locator,
    );
  }

  if (
    locators.length !==
    EMISSION_NEBULA_SAMPLE_COUNT
  ) {
    throw new RangeError(
      `The canonical V1 laboratory sample found ${locators.length}/${EMISSION_NEBULA_SAMPLE_COUNT} non-HII emission nebulae.`,
    );
  }

  return locators.map(
    (
      locator,
      index,
    ) =>
      Object.freeze({
        index,
        label:
          String.fromCharCode(
            65 +
            index,
          ),
        locator,
      }),
  );
}

function buildPlanetaryNebulaSamplesV1():
  PlanetaryNebulaLaboratorySample[] {

  const locators:
    GalacticObjectLocator[] =
    [];

  /*
   * Preserve the already-frozen PLANETARY laboratory representative as A.
   */
  const primary =
    new GalacticObjectLocator(
      0n,
      NEBULA_SECTOR_KEY,
      10n,
    );

  requirePlanetaryNebulaV1(
    primary,
  );

  locators.push(
    primary,
  );

  for (
    let index =
      0n;
    index <
      4_096n &&
    locators.length <
      PLANETARY_NEBULA_SAMPLE_COUNT;
    index +=
      1n
  ) {
    if (
      index ===
        primary
          .galacticObjectIndex
    ) {
      continue;
    }

    const locator =
      new GalacticObjectLocator(
        0n,
        NEBULA_SECTOR_KEY,
        index,
      );

    if (
      !NebulaGenerator
        .isNebulaLocator(
          GENERATION_KEY,
          locator,
        )
    ) {
      continue;
    }

    const nebula =
      NebulaGenerator
        .generate(
          GENERATION_KEY,
          locator,
        );

    if (
      nebula.nebulaType !==
        NebulaType.PLANETARY
    ) {
      continue;
    }

    locators.push(
      locator,
    );
  }

  if (
    locators.length !==
    PLANETARY_NEBULA_SAMPLE_COUNT
  ) {
    throw new RangeError(
      `The canonical V1 laboratory sample found ${locators.length}/${PLANETARY_NEBULA_SAMPLE_COUNT} planetary nebulae.`,
    );
  }

  return locators.map(
    (
      locator,
      index,
    ) =>
      Object.freeze({
        index,
        label:
          String.fromCharCode(
            65 +
            index,
          ),
        locator,
      }),
  );
}

function requirePlanetaryNebulaV1(
  locator:
    GalacticObjectLocator,
): void {

  if (
    !NebulaGenerator
      .isNebulaLocator(
        GENERATION_KEY,
        locator,
      )
  ) {
    throw new RangeError(
      `Frozen locator O${locator.galacticObjectIndex} no longer belongs to the NEBULA family.`,
    );
  }

  const nebula =
    NebulaGenerator
      .generate(
        GENERATION_KEY,
        locator,
      );

  if (
    nebula.nebulaType !==
      NebulaType.PLANETARY
  ) {
    throw new RangeError(
      `Frozen locator O${locator.galacticObjectIndex} is no longer a planetary nebula.`,
    );
  }
}

function buildDarkNebulaSamplesV1():
  DarkNebulaLaboratorySample[] {

  const locators:
    GalacticObjectLocator[] =
    [];

  const primary =
    new GalacticObjectLocator(
      0n,
      NEBULA_SECTOR_KEY,
      16n,
    );

  requireDarkNebulaV1(
    primary,
  );

  locators.push(
    primary,
  );

  for (
    let index =
      0n;
    index <
      4_096n &&
    locators.length <
      DARK_NEBULA_SAMPLE_COUNT;
    index +=
      1n
  ) {
    if (
      index ===
        primary
          .galacticObjectIndex
    ) {
      continue;
    }

    const locator =
      new GalacticObjectLocator(
        0n,
        NEBULA_SECTOR_KEY,
        index,
      );

    if (
      !NebulaGenerator
        .isNebulaLocator(
          GENERATION_KEY,
          locator,
        )
    ) {
      continue;
    }

    const nebula =
      NebulaGenerator
        .generate(
          GENERATION_KEY,
          locator,
        );

    if (
      nebula.nebulaType !==
        NebulaType.DARK
    ) {
      continue;
    }

    locators.push(
      locator,
    );
  }

  if (
    locators.length !==
    DARK_NEBULA_SAMPLE_COUNT
  ) {
    throw new RangeError(
      `The canonical V1 laboratory sample found ${locators.length}/${DARK_NEBULA_SAMPLE_COUNT} dark nebulae.`,
    );
  }

  return locators.map(
    (
      locator,
      index,
    ) =>
      Object.freeze({
        index,
        label:
          String.fromCharCode(
            65 +
            index,
          ),
        locator,
      }),
  );
}

function requireDarkNebulaV1(
  locator:
    GalacticObjectLocator,
): void {

  if (
    !NebulaGenerator
      .isNebulaLocator(
        GENERATION_KEY,
        locator,
      )
  ) {
    throw new RangeError(
      `Frozen locator O${locator.galacticObjectIndex} no longer belongs to the NEBULA family.`,
    );
  }

  const nebula =
    NebulaGenerator
      .generate(
        GENERATION_KEY,
        locator,
      );

  if (
    nebula.nebulaType !==
      NebulaType.DARK
  ) {
    throw new RangeError(
      `Frozen locator O${locator.galacticObjectIndex} is no longer a dark nebula.`,
    );
  }
}

function buildReflectionNebulaSamplesV1():
  ReflectionNebulaLaboratorySample[] {

  const locators:
    GalacticObjectLocator[] =
    [];

  const primary =
    new GalacticObjectLocator(
      0n,
      NEBULA_SECTOR_KEY,
      8n,
    );

  requireReflectionNebulaV1(
    primary,
  );

  locators.push(
    primary,
  );

  for (
    let index =
      0n;
    index <
      4_096n &&
    locators.length <
      REFLECTION_NEBULA_SAMPLE_COUNT;
    index +=
      1n
  ) {
    if (
      index ===
        primary
          .galacticObjectIndex
    ) {
      continue;
    }

    const locator =
      new GalacticObjectLocator(
        0n,
        NEBULA_SECTOR_KEY,
        index,
      );

    if (
      !NebulaGenerator
        .isNebulaLocator(
          GENERATION_KEY,
          locator,
        )
    ) {
      continue;
    }

    const nebula =
      NebulaGenerator
        .generate(
          GENERATION_KEY,
          locator,
        );

    if (
      nebula.nebulaType !==
        NebulaType.REFLECTION
    ) {
      continue;
    }

    locators.push(
      locator,
    );
  }

  if (
    locators.length !==
    REFLECTION_NEBULA_SAMPLE_COUNT
  ) {
    throw new RangeError(
      `The canonical V1 laboratory sample found ${locators.length}/${REFLECTION_NEBULA_SAMPLE_COUNT} reflection nebulae.`,
    );
  }

  return locators.map(
    (
      locator,
      index,
    ) =>
      Object.freeze({
        index,
        label:
          String.fromCharCode(
            65 +
            index,
          ),
        locator,
      }),
  );
}

function requireReflectionNebulaV1(
  locator:
    GalacticObjectLocator,
): void {

  if (
    !NebulaGenerator
      .isNebulaLocator(
        GENERATION_KEY,
        locator,
      )
  ) {
    throw new RangeError(
      `Frozen locator O${locator.galacticObjectIndex} no longer belongs to the NEBULA family.`,
    );
  }

  const nebula =
    NebulaGenerator
      .generate(
        GENERATION_KEY,
        locator,
      );

  if (
    nebula.nebulaType !==
      NebulaType.REFLECTION
  ) {
    throw new RangeError(
      `Frozen locator O${locator.galacticObjectIndex} is no longer a reflection nebula.`,
    );
  }
}

function requireEmissionNebulaV1(
  locator:
    GalacticObjectLocator,
): void {

  const nebula =
    NebulaGenerator
      .generate(
        GENERATION_KEY,
        locator,
      );

  if (
    nebula.nebulaType !==
      NebulaType.EMISSION ||
    HiiRegionGenerator
      .isHiiRegionLocator(
        GENERATION_KEY,
        locator,
      )
  ) {
    throw new RangeError(
      `Frozen locator O${locator.galacticObjectIndex} is no longer a non-HII emission nebula.`,
    );
  }
}

function buildCasesV1():
  GalacticObjectLaboratoryCase[] {

  const hii =
    hiiRepresentativesV1();

  const remnants =
    remnantRepresentativesV1();

  return [
    caseOf(
      GalacticObjectLaboratoryCaseId.NEBULA_EMISSION,
      GalacticObjectLaboratoryGroup.NEBULAE,
      'Nebulosa de emisión',
      'Nebulosa',
      new GalacticObjectLocator(
        0n,
        NEBULA_SECTOR_KEY,
        17n,
      ),
      ExplorationResultKind.NEBULA,
      GalacticObjectScientificSubject.NEBULA,
      NebulaType.EMISSION,
      null,
      null,
      'Nebulosa de emisión V1 que no cae en la especialización H II.',
    ),
    caseOf(
      GalacticObjectLaboratoryCaseId.NEBULA_REFLECTION,
      GalacticObjectLaboratoryGroup.NEBULAE,
      'Nebulosa de reflexión',
      'Nebulosa',
      new GalacticObjectLocator(
        0n,
        NEBULA_SECTOR_KEY,
        8n,
      ),
      ExplorationResultKind.NEBULA,
      GalacticObjectScientificSubject.NEBULA,
      NebulaType.REFLECTION,
      null,
      null,
      'Nebulosa de reflexión V1 con polvo y gas iluminados por fuentes estelares.',
    ),
    caseOf(
      GalacticObjectLaboratoryCaseId.NEBULA_DARK,
      GalacticObjectLaboratoryGroup.NEBULAE,
      'Nebulosa oscura',
      'Nebulosa',
      new GalacticObjectLocator(
        0n,
        NEBULA_SECTOR_KEY,
        16n,
      ),
      ExplorationResultKind.NEBULA,
      GalacticObjectScientificSubject.NEBULA,
      NebulaType.DARK,
      null,
      null,
      'Nebulosa oscura V1 con alta presencia de polvo y baja ionización.',
    ),
    caseOf(
      GalacticObjectLaboratoryCaseId.NEBULA_PLANETARY,
      GalacticObjectLaboratoryGroup.NEBULAE,
      'Nebulosa planetaria',
      'Nebulosa',
      new GalacticObjectLocator(
        0n,
        NEBULA_SECTOR_KEY,
        10n,
      ),
      ExplorationResultKind.NEBULA,
      GalacticObjectScientificSubject.NEBULA,
      NebulaType.PLANETARY,
      null,
      null,
      'Nebulosa planetaria V1 como envoltura gaseosa compacta.',
    ),
    hiiCase(
      GalacticObjectLaboratoryCaseId.HII_LOW,
      'Región H II · baja',
      StarFormationActivity.LOW,
      hii,
    ),
    hiiCase(
      GalacticObjectLaboratoryCaseId.HII_MODERATE,
      'Región H II · moderada',
      StarFormationActivity.MODERATE,
      hii,
    ),
    hiiCase(
      GalacticObjectLaboratoryCaseId.HII_HIGH,
      'Región H II · alta',
      StarFormationActivity.HIGH,
      hii,
    ),
    hiiCase(
      GalacticObjectLaboratoryCaseId.HII_INTENSE,
      'Región H II · intensa',
      StarFormationActivity.INTENSE,
      hii,
    ),
    caseOf(
      GalacticObjectLaboratoryCaseId.OPEN_CLUSTER,
      GalacticObjectLaboratoryGroup.CLUSTERS,
      'Cúmulo abierto',
      'Cúmulo estelar',
      new GalacticObjectLocator(
        0n,
        0n,
        2n,
      ),
      ExplorationResultKind.STAR_CLUSTER,
      GalacticObjectScientificSubject.OPEN_CLUSTER,
      null,
      null,
      null,
      'Cúmulo abierto V1 con población estelar dispersa.',
    ),
    caseOf(
      GalacticObjectLaboratoryCaseId.GLOBULAR_CLUSTER,
      GalacticObjectLaboratoryGroup.CLUSTERS,
      'Cúmulo globular',
      'Cúmulo estelar',
      new GalacticObjectLocator(
        0n,
        0n,
        7n,
      ),
      ExplorationResultKind.STAR_CLUSTER,
      GalacticObjectScientificSubject.GLOBULAR_CLUSTER,
      null,
      null,
      null,
      'Cúmulo globular V1 de alta concentración central.',
    ),
    remnantCase(
      GalacticObjectLaboratoryCaseId.SNR_SHELL,
      'Remanente SN · cáscara',
      SupernovaRemnantMorphology.SHELL,
      remnants,
    ),
    remnantCase(
      GalacticObjectLaboratoryCaseId.SNR_PLERION,
      'Remanente SN · plerión',
      SupernovaRemnantMorphology.PLERION,
      remnants,
    ),
    remnantCase(
      GalacticObjectLaboratoryCaseId.SNR_COMPOSITE,
      'Remanente SN · compuesto',
      SupernovaRemnantMorphology.COMPOSITE,
      remnants,
    ),
    extremeCase(
      GalacticObjectLaboratoryCaseId.EXTREME_NEUTRON_STAR,
      ExtremeType.NEUTRON_STAR,
      18n,
      'Extremo compacto distribuido · estrella de neutrones.',
    ),
    extremeCase(
      GalacticObjectLaboratoryCaseId.EXTREME_PULSAR,
      ExtremeType.PULSAR,
      19n,
      'Extremo compacto distribuido · púlsar.',
    ),
    extremeCase(
      GalacticObjectLaboratoryCaseId.EXTREME_MILLISECOND_PULSAR,
      ExtremeType.MILLISECOND_PULSAR,
      20n,
      'Extremo compacto distribuido · púlsar de milisegundos.',
    ),
    extremeCase(
      GalacticObjectLaboratoryCaseId.EXTREME_MAGNETAR,
      ExtremeType.MAGNETAR,
      21n,
      'Extremo compacto distribuido · magnetar.',
    ),
    extremeCase(
      GalacticObjectLaboratoryCaseId.EXTREME_STELLAR_MASS_BLACK_HOLE,
      ExtremeType.STELLAR_MASS_BLACK_HOLE,
      22n,
      'Extremo compacto distribuido · agujero negro de masa estelar.',
    ),
    extremeCase(
      GalacticObjectLaboratoryCaseId.EXTREME_INTERMEDIATE_MASS_BLACK_HOLE,
      ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE,
      23n,
      'Extremo compacto distribuido · agujero negro de masa intermedia.',
    ),
    extremeCase(
      GalacticObjectLaboratoryCaseId.EXTREME_SUPERMASSIVE_BLACK_HOLE,
      ExtremeType.SMBH,
      24n,
      'Extremo compacto SMBH mostrado fuera del bloque de estados nucleares del laboratorio.',
    ),
    caseOf(
      GalacticObjectLaboratoryCaseId.RESERVED_EXTREME,
      GalacticObjectLaboratoryGroup.EXTREME,
      'Objeto extremo reservado',
      'Fuente extrema',
      new GalacticObjectLocator(
        0n,
        0n,
        25n,
      ),
      ExplorationResultKind.EXTREME_OBJECT,
      null,
      null,
      null,
      null,
      'Complemento EXTREME_OBJECT deliberadamente sin especialización física V1.',
    ),
  ];
}

function caseOf(
  id:
    GalacticObjectLaboratoryCaseId,

  group:
    GalacticObjectLaboratoryGroup,

  label:
    string,

  familyLabel:
    string,

  locator:
    GalacticObjectLocator,

  resultKind:
    ExplorationLocatedResultKind,

  expectedSubject:
    GalacticObjectScientificSubject | null,

  expectedNebulaType:
    NebulaTypeValue | null,

  expectedHiiActivity:
    StarFormationActivityValue | null,

  expectedRemnantMorphology:
    SupernovaRemnantMorphologyValue | null,

  description:
    string,

  extremeType:
    ExtremeTypeValue | null =
      null,
): GalacticObjectLaboratoryCase {

  return Object.freeze({
    id,
    group,
    label,
    familyLabel,
    locator,
    resultKind,
    expectedSubject,
    expectedNebulaType,
    expectedHiiActivity,
    expectedRemnantMorphology,
    extremeType,
    description,
  });
}

function hiiCase(
  id:
    GalacticObjectLaboratoryCaseId,

  label:
    string,

  activity:
    StarFormationActivityValue,

  representatives:
    ReadonlyMap<
      StarFormationActivityValue,
      GalacticObjectLocator
    >,
): GalacticObjectLaboratoryCase {

  const locator =
    representatives.get(
      activity,
    );

  if (
    locator ===
      undefined
  ) {
    throw new RangeError(
      `Missing V1 H II laboratory representative for ${activity}.`,
    );
  }

  return caseOf(
    id,
    GalacticObjectLaboratoryGroup.HII,
    label,
    'Región H II',
    locator,
    ExplorationResultKind.NEBULA,
    GalacticObjectScientificSubject.HII_REGION,
    NebulaType.EMISSION,
    activity,
    null,
    `Región H II V1 con actividad de formación estelar ${activity}.`,
  );
}

function extremeCase(
  id:
    GalacticObjectLaboratoryCaseId,

  extremeType:
    ExtremeTypeValue,

  objectIndex:
    bigint,

  description:
    string,
): GalacticObjectLaboratoryCase {

  const definition =
    extremeTypeDefinition(
      extremeType,
    );

  return caseOf(
    id,
    GalacticObjectLaboratoryGroup.EXTREME,
    definition.label,
    'Fuente extrema',
    new GalacticObjectLocator(
      0n,
      0n,
      objectIndex,
    ),
    ExplorationResultKind.EXTREME_OBJECT,
    extremeType ===
        ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE
      ? GalacticObjectScientificSubject.INTERMEDIATE_MASS_BLACK_HOLE
      : null,
    null,
    null,
    null,
    description,
    extremeType,
  );
}

function remnantCase(
  id:
    GalacticObjectLaboratoryCaseId,

  label:
    string,

  morphology:
    SupernovaRemnantMorphologyValue,

  representatives:
    ReadonlyMap<
      SupernovaRemnantMorphologyValue,
      GalacticObjectLocator
    >,
): GalacticObjectLaboratoryCase {

  const locator =
    representatives.get(
      morphology,
    );

  if (
    locator ===
      undefined
  ) {
    throw new RangeError(
      `Missing V1 supernova-remnant laboratory representative for ${morphology}.`,
    );
  }

  return caseOf(
    id,
    GalacticObjectLaboratoryGroup.SUPERNOVA_REMNANTS,
    label,
    'Remanente persistente',
    locator,
    ExplorationResultKind.EXTREME_OBJECT,
    GalacticObjectScientificSubject.SUPERNOVA_REMNANT,
    null,
    null,
    morphology,
    `Remanente de supernova V1 con morfología ${morphology}.`,
  );
}

function hiiRepresentativesV1():
  ReadonlyMap<
    StarFormationActivityValue,
    GalacticObjectLocator
  > {

  if (
    cachedHiiRepresentatives !==
      null
  ) {
    return cachedHiiRepresentatives;
  }

  const found =
    new Map<
      StarFormationActivityValue,
      GalacticObjectLocator
    >();

  for (
    let index =
      0n;
    index <
      2_048n;
    index +=
      1n
  ) {
    const locator =
      new GalacticObjectLocator(
        0n,
        NEBULA_SECTOR_KEY,
        index,
      );

    if (
      !HiiRegionGenerator
        .isHiiRegionLocator(
          GENERATION_KEY,
          locator,
        )
    ) {
      continue;
    }

    const region =
      HiiRegionGenerator
        .generate(
          GENERATION_KEY,
          locator,
        );

    if (
      !found.has(
        region
          .starFormationProfile
          .activity,
      )
    ) {
      found.set(
        region
          .starFormationProfile
          .activity,
        locator,
      );
    }

    if (
      found.size ===
      Object.values(
        StarFormationActivity,
      ).length
    ) {
      break;
    }
  }

  if (
    found.size !==
    Object.values(
      StarFormationActivity,
    ).length
  ) {
    throw new RangeError(
      'The canonical V1 laboratory sample did not reach all H II activity levels.',
    );
  }

  cachedHiiRepresentatives =
    found;

  return found;
}

function remnantRepresentativesV1():
  ReadonlyMap<
    SupernovaRemnantMorphologyValue,
    GalacticObjectLocator
  > {

  if (
    cachedRemnantRepresentatives !==
      null
  ) {
    return cachedRemnantRepresentatives;
  }

  const found =
    new Map<
      SupernovaRemnantMorphologyValue,
      GalacticObjectLocator
    >();

  for (
    let index =
      0n;
    index <
      2_048n;
    index +=
      1n
  ) {
    const locator =
      new GalacticObjectLocator(
        0n,
        0n,
        index,
      );

    if (
      !SupernovaRemnantGenerator
        .isSupernovaRemnantLocator(
          GENERATION_KEY,
          locator,
        )
    ) {
      continue;
    }

    const remnant =
      SupernovaRemnantGenerator
        .generate(
          GENERATION_KEY,
          locator,
        );

    if (
      !found.has(
        remnant.morphology,
      )
    ) {
      found.set(
        remnant.morphology,
        locator,
      );
    }

    if (
      found.size ===
      Object.values(
        SupernovaRemnantMorphology,
      ).length
    ) {
      break;
    }
  }

  if (
    found.size !==
    Object.values(
      SupernovaRemnantMorphology,
    ).length
  ) {
    throw new RangeError(
      'The canonical V1 laboratory sample did not reach all supernova-remnant morphologies.',
    );
  }

  cachedRemnantRepresentatives =
    found;

  return found;
}
