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
} from '../../../domain/galactic-object/galactic-object-scientific-subject';

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
  SupernovaRemnantGenerator,
} from '../../../simulation/galactic-object/supernova-remnant-generator';

import {
  ArchiveGalacticObjectCardAssembler,
  type ArchiveGalacticObjectCardModel,
} from '../../genesis-archive/archive-galactic-object-card';

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

let cachedEmissionNebulaSamples:
  readonly EmissionNebulaLaboratorySample[] | null =
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

  static caseDefinition(
    caseId:
      GalacticObjectLaboratoryCaseId,

    emissionSampleIndex =
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
      caseId !==
        GalacticObjectLaboratoryCaseId
          .NEBULA_EMISSION
    ) {
      return caseDefinition;
    }

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

  static frames(
    caseId:
      GalacticObjectLaboratoryCaseId,

    emissionSampleIndex =
      0,
  ): readonly GalacticObjectLaboratoryFrame[] {

    const caseDefinition =
      this.caseDefinition(
        caseId,
        emissionSampleIndex,
      );

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
    caseOf(
      GalacticObjectLaboratoryCaseId.RESERVED_EXTREME,
      GalacticObjectLaboratoryGroup.EXTREME,
      'Objeto extremo reservado',
      'Fuente extrema',
      new GalacticObjectLocator(
        0n,
        0n,
        18n,
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
