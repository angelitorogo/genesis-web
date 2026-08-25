import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  ExplorationResultKind,
  type ExplorationLocatedResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  GalacticObjectScientificSubject,
  GalacticObjectScientificSurveyFamily,
} from '../../domain/galactic-object/galactic-object-scientific-subject';

import {
  NebulaType,
  type NebulaType as NebulaTypeValue,
} from '../../domain/galactic-object/nebula-type';

import {
  StarFormationActivity,
  type StarFormationActivity as StarFormationActivityValue,
} from '../../domain/galactic-object/star-formation-activity';

import {
  SupernovaRemnantMorphology,
  type SupernovaRemnantMorphology as SupernovaRemnantMorphologyValue,
} from '../../domain/galactic-object/supernova-remnant-morphology';

import {
  type GalacticObjectLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  isGalacticNucleusLocator,
} from '../../domain/universe/galactic-center';

import {
  GalacticNucleusState,
} from '../../domain/universe/galactic-nucleus-state';

import {
  GalacticObjectScientificSubjectResolver,
} from '../../simulation/galactic-object/galactic-object-scientific-subject-resolver';

import {
  GlobularClusterGenerator,
} from '../../simulation/galactic-object/globular-cluster-generator';

import {
  HiiRegionGenerator,
} from '../../simulation/galactic-object/hii-region-generator';

import {
  NebulaGenerator,
} from '../../simulation/galactic-object/nebula-generator';

import {
  OpenClusterGenerator,
} from '../../simulation/galactic-object/open-cluster-generator';

import {
  SupernovaRemnantGenerator,
} from '../../simulation/galactic-object/supernova-remnant-generator';

import {
  GalacticCenterNucleusResolver,
} from '../../simulation/nuclear/galactic-center-nucleus-resolver';

import {
  GalaxyGenerator,
} from '../../simulation/universe/galaxy-generator';

import {
  createAgnNucleusRenderModel,
  type AgnNucleusRenderModel,
} from '../laboratory/galactic-objects/agn-nucleus-render-model';

import {
  createQuasarNucleusRenderModel,
  type QuasarNucleusRenderModel,
} from '../laboratory/galactic-objects/quasar-nucleus-render-model';

export const ArchiveGalacticObjectKnowledgeLevel =
  Object.freeze({
    SIGNAL:
      'SIGNAL',

    IDENTIFIED:
      'IDENTIFIED',

    CATALOGUED:
      'CATALOGUED',

    CONFIRMED:
      'CONFIRMED',
  } as const);

export type ArchiveGalacticObjectKnowledgeLevel =
  typeof ArchiveGalacticObjectKnowledgeLevel[
    keyof typeof ArchiveGalacticObjectKnowledgeLevel
  ];

export const ArchiveGalacticObjectRenderKind =
  Object.freeze({
    NEBULA:
      'NEBULA',

    STAR_CLUSTER:
      'STAR_CLUSTER',

    EXTREME_OBJECT:
      'EXTREME_OBJECT',

    HII_REGION:
      'HII_REGION',

    OPEN_CLUSTER:
      'OPEN_CLUSTER',

    GLOBULAR_CLUSTER:
      'GLOBULAR_CLUSTER',

    SUPERNOVA_REMNANT:
      'SUPERNOVA_REMNANT',

    AGN_NUCLEUS:
      'AGN_NUCLEUS',

    QUASAR_NUCLEUS:
      'QUASAR_NUCLEUS',
  } as const);

export type ArchiveGalacticObjectRenderKind =
  typeof ArchiveGalacticObjectRenderKind[
    keyof typeof ArchiveGalacticObjectRenderKind
  ];

export const ArchiveGalacticObjectRenderProfile =
  Object.freeze({
    PLANETARY_VOLUME:
      'PLANETARY_VOLUME',

    HII_LOW_VOLUME:
      'HII_LOW_VOLUME',

    HII_MODERATE_VOLUME:
      'HII_MODERATE_VOLUME',

    HII_HIGH_VOLUME:
      'HII_HIGH_VOLUME',

    HII_INTENSE_VOLUME:
      'HII_INTENSE_VOLUME',

    OPEN_CLUSTER_FIELD:
      'OPEN_CLUSTER_FIELD',

    GLOBULAR_CLUSTER_FIELD:
      'GLOBULAR_CLUSTER_FIELD',

    SUPERNOVA_REMNANT_SHELL:
      'SUPERNOVA_REMNANT_SHELL',

    SUPERNOVA_REMNANT_PLERION:
      'SUPERNOVA_REMNANT_PLERION',

    SUPERNOVA_REMNANT_COMPOSITE:
      'SUPERNOVA_REMNANT_COMPOSITE',
  } as const);

export type ArchiveGalacticObjectRenderProfile =
  typeof ArchiveGalacticObjectRenderProfile[
    keyof typeof ArchiveGalacticObjectRenderProfile
  ];

export interface ArchiveGalacticObjectFact {
  readonly label:
    string;

  readonly value:
    string;
}

/**
 * Point-12.8 renderer-only input.
 *
 * The descriptor never exposes hidden numeric physical properties before
 * CATALOGUED. `renderProfile` is an opaque visual-observation hint: it may keep
 * an already-visible morphology stable across knowledge levels without
 * exposing the scientific subtype through `variant`, labels or facts.
 */
export interface ArchiveGalacticObjectRenderDescriptor {
  readonly kind:
    ArchiveGalacticObjectRenderKind;

  readonly knowledgeLevel:
    ArchiveGalacticObjectKnowledgeLevel;

  readonly seed:
    string;

  readonly accessibleLabel:
    string;

  readonly variant:
    string | null;

  readonly renderProfile?:
    ArchiveGalacticObjectRenderProfile | null;

  /**
   * Central active nuclei are the only point-12.8 descriptors that carry an
   * already-built galaxy-level visual model. The fields stay absent for every
   * ordinary GalacticObject so the existing scientific reveal contract is
   * unchanged outside reserved galactic coordinates (0, 0).
   */
  readonly agnNucleusRenderModel?:
    AgnNucleusRenderModel | null;

  readonly quasarNucleusRenderModel?:
    QuasarNucleusRenderModel | null;

  readonly scale:
    number;

  readonly density:
    number;

  readonly energy:
    number;

  readonly concentration:
    number;
}

export interface ArchiveGalacticObjectCardModel {
  readonly coarseFamily:
    GalacticObjectScientificSurveyFamily;

  readonly scientificSubject:
    GalacticObjectScientificSubject | null;

  readonly knowledgeLevel:
    ArchiveGalacticObjectKnowledgeLevel;

  readonly knowledgeLevelLabel:
    string;

  readonly title:
    string;

  readonly summary:
    string;

  readonly nextScientificStep:
    string;

  readonly facts:
    readonly ArchiveGalacticObjectFact[];

  readonly render:
    ArchiveGalacticObjectRenderDescriptor;
}

/**
 * Point-12.8 projection from persisted scientific state to one basic Archive
 * card and one renderer-only descriptor.
 *
 * It intentionally does not persist physical properties. Ground Truth is
 * regenerated only when the state is already CATALOGUED or CONFIRMED, i.e.
 * after point-12.7 has earned the corresponding scientific progression.
 */
export class ArchiveGalacticObjectCardAssembler {

  private constructor() {}

  static build(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,

    resultKind:
      ExplorationLocatedResultKind,

    observedState:
      DiscoveryStateValue,
  ): ArchiveGalacticObjectCardModel {

    const state =
      DiscoveryState
        .fromCode(
          observedState.code,
        );

    const coarseFamily =
      surveyFamilyFor(
        resultKind,
      );

    const knowledgeLevel =
      knowledgeLevelFor(
        state,
      );

    const renderSeed =
      createRenderSeed(
        generationKey,
        locator,
      );

    const centralActiveNucleusCard =
      activeGalacticNucleusCardOrNull(
        generationKey,
        locator,
        coarseFamily,
        knowledgeLevel,
        renderSeed,
      );

    if (
      centralActiveNucleusCard !==
        null
    ) {
      return centralActiveNucleusCard;
    }

    const earlyRenderProfile =
      renderProfileForObservedMorphology(
        generationKey,
        locator,
        coarseFamily,
      );

    if (
      state.code <
      DiscoveryState.DISCOVERED.code
    ) {
      const title =
        coarseDetectedTitle(
          coarseFamily,
        );

      return Object.freeze({
        coarseFamily,
        scientificSubject:
          null,
        knowledgeLevel,
        knowledgeLevelLabel:
          knowledgeLevelLabel(
            knowledgeLevel,
          ),
        title,
        summary:
          'La señal está localizada, pero la clasificación física permanece restringida hasta completar el reconocimiento científico.',
        nextScientificStep:
          surveyActionLabel(
            coarseFamily,
          ),
        facts:
          Object.freeze([]),
        render:
          createSignalRenderDescriptor(
            coarseFamily,
            renderSeed,
            title,
            earlyRenderProfile,
          ),
      });
    }

    const scientificSubject =
      GalacticObjectScientificSubjectResolver
        .resolve(
          generationKey,
          locator,
          state,
        );

    if (
      scientificSubject ===
      null
    ) {
      const title =
        'Objeto extremo sin clasificación física V1';

      return Object.freeze({
        coarseFamily,
        scientificSubject:
          null,
        knowledgeLevel,
        knowledgeLevelLabel:
          knowledgeLevelLabel(
            knowledgeLevel,
          ),
        title,
        summary:
          'El objeto extremo está descubierto, pero pertenece a la reserva física que 12.6/12.7 mantienen sin especialización inventada.',
        nextScientificStep:
          'Sin cadena científica específica V1',
        facts:
          Object.freeze([]),
        render:
          createIdentifiedRenderDescriptor(
            ArchiveGalacticObjectRenderKind.EXTREME_OBJECT,
            knowledgeLevel,
            renderSeed,
            title,
          ),
      });
    }

    const title =
      scientificSubjectLabel(
        scientificSubject,
      );

    if (
      state.code <
      DiscoveryState.CATALOGUED.code
    ) {
      return Object.freeze({
        coarseFamily,
        scientificSubject,
        knowledgeLevel,
        knowledgeLevelLabel:
          knowledgeLevelLabel(
            knowledgeLevel,
          ),
        title,
        summary:
          identifiedSummary(
            scientificSubject,
          ),
        nextScientificStep:
          characterizationActionLabel(
            scientificSubject,
          ),
        facts:
          Object.freeze([]),
        render:
          createIdentifiedRenderDescriptor(
            renderKindForSubject(
              scientificSubject,
            ),
            knowledgeLevel,
            renderSeed,
            title,
            earlyRenderProfile,
          ),
      });
    }

    return buildPhysicalCard(
      generationKey,
      locator,
      coarseFamily,
      scientificSubject,
      knowledgeLevel,
      renderSeed,
      state,
    );
  }
}

function activeGalacticNucleusCardOrNull(
  generationKey:
    UniverseGenerationKey,

  locator:
    GalacticObjectLocator,

  coarseFamily:
    GalacticObjectScientificSurveyFamily,

  knowledgeLevel:
    ArchiveGalacticObjectKnowledgeLevel,

  renderSeed:
    string,
): ArchiveGalacticObjectCardModel | null {

  if (
    !isGalacticNucleusLocator(
      locator,
    )
  ) {
    return null;
  }

  const galaxy =
    GalaxyGenerator.generate(
      generationKey,
      locator.galaxyIndex,
    );

  const nucleusState =
    GalacticCenterNucleusResolver
      .resolveState(
        galaxy,
      );

  if (
    nucleusState ===
      GalacticNucleusState.QUIESCENT
  ) {
    return null;
  }

  if (
    coarseFamily !==
      GalacticObjectScientificSurveyFamily.EXTREME_OBJECT
  ) {
    throw new RangeError(
      'AGN and QUASAR galactic-centre targets must use the EXTREME_OBJECT survey family.',
    );
  }

  const isQuasar =
    nucleusState ===
      GalacticNucleusState.QUASAR;

  const title =
    isQuasar
      ? 'QUASAR galáctico'
      : 'Núcleo galáctico activo (AGN)';

  const summary =
    isQuasar
      ? 'La fuente persistente de las coordenadas galácticas 0,0 corresponde al QUASAR del núcleo de esta galaxia.'
      : 'La fuente persistente de las coordenadas galácticas 0,0 corresponde al agujero negro supermasivo activo del núcleo de esta galaxia.';

  const render:
    ArchiveGalacticObjectRenderDescriptor =
    Object.freeze({
      kind:
        isQuasar
          ? ArchiveGalacticObjectRenderKind.QUASAR_NUCLEUS
          : ArchiveGalacticObjectRenderKind.AGN_NUCLEUS,
      knowledgeLevel,
      seed:
        renderSeed,
      accessibleLabel:
        isQuasar
          ? 'Render procedural del QUASAR central de la galaxia'
          : 'Render procedural del agujero negro y núcleo galáctico activo',
      variant:
        nucleusState.name,
      renderProfile:
        null,
      agnNucleusRenderModel:
        isQuasar
          ? null
          : createAgnNucleusRenderModel(
              galaxy,
            ),
      quasarNucleusRenderModel:
        isQuasar
          ? createQuasarNucleusRenderModel(
              galaxy,
            )
          : null,
      scale:
        1,
      density:
        1,
      energy:
        1,
      concentration:
        1,
    });

  return Object.freeze({
    coarseFamily,
    scientificSubject:
      null,
    knowledgeLevel,
    knowledgeLevelLabel:
      knowledgeLevelLabel(
        knowledgeLevel,
      ),
    title,
    summary,
    nextScientificStep:
      isQuasar
        ? 'Caracterización del QUASAR central'
        : 'Caracterización del núcleo galáctico activo',
    facts:
      Object.freeze([]),
    render,
  });
}

function buildPhysicalCard(
  generationKey:
    UniverseGenerationKey,

  locator:
    GalacticObjectLocator,

  coarseFamily:
    GalacticObjectScientificSurveyFamily,

  scientificSubject:
    GalacticObjectScientificSubject,

  knowledgeLevel:
    ArchiveGalacticObjectKnowledgeLevel,

  renderSeed:
    string,

  state:
    DiscoveryStateValue,
): ArchiveGalacticObjectCardModel {

  const confirmed =
    state.code >=
    DiscoveryState.CONFIRMED.code;

  const title =
    scientificSubjectLabel(
      scientificSubject,
    );

  switch (
    scientificSubject
  ) {
    case GalacticObjectScientificSubject.NEBULA: {
      const nebula =
        NebulaGenerator
          .generate(
            generationKey,
            locator,
          );

      const facts:
        ArchiveGalacticObjectFact[] =
        [
          fact(
            'Tipo nebular',
            nebulaTypeLabel(
              nebula.nebulaType,
            ),
          ),
          fact(
            'Radio',
            formatQuantity(
              nebula.physicalProperties.radiusParsecs,
              'pc',
              2,
            ),
          ),
          fact(
            'Temperatura del gas',
            formatQuantity(
              nebula.physicalProperties.gasTemperatureKelvin,
              'K',
              0,
            ),
          ),
        ];

      if (
        confirmed
      ) {
        facts.push(
          fact(
            'Masa gaseosa',
            formatQuantity(
              nebula.physicalProperties.massSolarMasses,
              'M☉',
              1,
            ),
          ),
          fact(
            'Densidad H',
            formatQuantity(
              nebula.physicalProperties.hydrogenNumberDensityPerCm3,
              'cm⁻³',
              2,
            ),
          ),
          fact(
            'Fracción ionizada',
            formatPercent(
              nebula.physicalProperties.ionizationFraction,
            ),
          ),
          fact(
            'Polvo / gas',
            formatPercent(
              nebula.physicalProperties.dustToGasMassRatio,
            ),
          ),
        );
      }

      return physicalCard(
        coarseFamily,
        scientificSubject,
        knowledgeLevel,
        title,
        confirmed
          ? 'La caracterización física de la nebulosa está confirmada y la ficha puede mostrar sus magnitudes básicas regenerables.'
          : 'La espectroscopía ya permite una ficha física básica; las magnitudes de confirmación permanecen restringidas.',
        confirmed
          ? 'Ciclo científico completado'
          : confirmationActionLabel(
              scientificSubject,
            ),
        facts,
        Object.freeze({
          kind:
            ArchiveGalacticObjectRenderKind.NEBULA,
          knowledgeLevel,
          seed:
            renderSeed,
          accessibleLabel:
            `Render procedural de ${title}`,
          variant:
            nebula.nebulaType,
          renderProfile:
            nebula.nebulaType ===
              NebulaType.PLANETARY
              ? ArchiveGalacticObjectRenderProfile
                  .PLANETARY_VOLUME
              : null,
          scale:
            normalizeLog(
              nebula.physicalProperties.radiusParsecs,
              0.05,
              500,
            ),
          density:
            confirmed
              ? normalizeLog(
                  nebula.physicalProperties.hydrogenNumberDensityPerCm3,
                  0.01,
                  100_000,
                )
              : 0.48,
          energy:
            normalizeLog(
              nebula.physicalProperties.gasTemperatureKelvin,
              10,
              30_000,
            ),
          concentration:
            confirmed
              ? clamp01(
                  nebula.physicalProperties.ionizationFraction,
                )
              : 0.45,
        }),
      );
    }

    case GalacticObjectScientificSubject.HII_REGION: {
      const hii =
        HiiRegionGenerator
          .generate(
            generationKey,
            locator,
          );

      const facts:
        ArchiveGalacticObjectFact[] =
        [
          fact(
            'Radio ionizado',
            formatQuantity(
              hii.hiiPhysicalProperties.radiusParsecs,
              'pc',
              2,
            ),
          ),
          fact(
            'Temperatura electrónica',
            formatQuantity(
              hii.hiiPhysicalProperties.electronTemperatureKelvin,
              'K',
              0,
            ),
          ),
          fact(
            'Densidad electrónica',
            formatQuantity(
              hii.hiiPhysicalProperties.electronDensityPerCm3,
              'cm⁻³',
              1,
            ),
          ),
        ];

      if (
        confirmed
      ) {
        facts.push(
          fact(
            'Formación estelar',
            starFormationActivityLabel(
              hii.starFormationProfile.activity,
            ),
          ),
          fact(
            'Tasa de formación',
            `${formatNumber(
              hii.starFormationProfile.starFormationRateSolarMassesPerMillionYears,
              2,
            )} M☉/Myr`,
          ),
          fact(
            'Estrellas ionizantes',
            formatInteger(
              hii.starFormationProfile.ionizingStarCount,
            ),
          ),
          fact(
            'Fotones ionizantes',
            `${formatScientific(
              hii.starFormationProfile.ionizingPhotonRatePerSecond,
            )} s⁻¹`,
          ),
        );
      }

      return physicalCard(
        coarseFamily,
        scientificSubject,
        knowledgeLevel,
        title,
        confirmed
          ? 'La región H II está confirmada; la ficha integra ionización y actividad de formación estelar sin persistir Ground Truth duplicado.'
          : 'La caracterización de ionización está catalogada; la actividad de formación estelar sigue pendiente de confirmación.',
        confirmed
          ? 'Ciclo científico completado'
          : confirmationActionLabel(
              scientificSubject,
            ),
        facts,
        Object.freeze({
          kind:
            ArchiveGalacticObjectRenderKind.HII_REGION,
          knowledgeLevel,
          seed:
            renderSeed,
          accessibleLabel:
            `Render procedural de ${title}`,
          variant:
            confirmed
              ? hii.starFormationProfile.activity
              : null,
          renderProfile:
            hii.starFormationProfile.activity ===
              StarFormationActivity.LOW
              ? ArchiveGalacticObjectRenderProfile
                  .HII_LOW_VOLUME
              : hii.starFormationProfile.activity ===
                    StarFormationActivity.MODERATE
                ? ArchiveGalacticObjectRenderProfile
                    .HII_MODERATE_VOLUME
                : hii.starFormationProfile.activity ===
                      StarFormationActivity.HIGH
                  ? ArchiveGalacticObjectRenderProfile
                      .HII_HIGH_VOLUME
                  : hii.starFormationProfile.activity ===
                        StarFormationActivity.INTENSE
                    ? ArchiveGalacticObjectRenderProfile
                        .HII_INTENSE_VOLUME
                    : null,
          scale:
            normalizeLog(
              hii.hiiPhysicalProperties.radiusParsecs,
              0.01,
              300,
            ),
          density:
            normalizeLog(
              hii.hiiPhysicalProperties.electronDensityPerCm3,
              1,
              100_000,
            ),
          energy:
            normalizeLinear(
              hii.hiiPhysicalProperties.electronTemperatureKelvin,
              7_000,
              12_000,
            ),
          concentration:
            confirmed
              ? activityIntensity(
                  hii.starFormationProfile.activity,
                )
              : 0.55,
        }),
      );
    }

    case GalacticObjectScientificSubject.OPEN_CLUSTER: {
      const cluster =
        OpenClusterGenerator
          .generate(
            generationKey,
            locator,
          );

      const facts:
        ArchiveGalacticObjectFact[] =
        [
          fact(
            'Población estelar',
            formatInteger(
              cluster.physicalProperties.stellarCount,
            ),
          ),
          fact(
            'Masa',
            formatQuantity(
              cluster.physicalProperties.massSolarMasses,
              'M☉',
              1,
            ),
          ),
          fact(
            'Radio de semimasa',
            formatQuantity(
              cluster.physicalProperties.halfMassRadiusParsecs,
              'pc',
              2,
            ),
          ),
          fact(
            'Fracción binaria',
            formatPercent(
              cluster.physicalProperties.binaryFraction,
            ),
          ),
        ];

      if (
        confirmed
      ) {
        facts.push(
          fact(
            'Edad',
            formatQuantity(
              cluster.physicalProperties.ageMillionYears,
              'Myr',
              1,
            ),
          ),
          fact(
            'Metalicidad',
            `${formatNumber(
              cluster.physicalProperties.metallicitySolarRatio,
              3,
            )} Z☉`,
          ),
          fact(
            'Radio de marea',
            formatQuantity(
              cluster.physicalProperties.tidalRadiusParsecs,
              'pc',
              2,
            ),
          ),
          fact(
            'Fracción ligada',
            formatPercent(
              cluster.physicalProperties.boundFraction,
            ),
          ),
        );
      }

      return physicalCard(
        coarseFamily,
        scientificSubject,
        knowledgeLevel,
        title,
        confirmed
          ? 'La población, edad y metalicidad del cúmulo abierto están confirmadas.'
          : 'La población estelar está catalogada; edad y metalicidad permanecen pendientes de confirmación.',
        confirmed
          ? 'Ciclo científico completado'
          : confirmationActionLabel(
              scientificSubject,
            ),
        facts,
        Object.freeze({
          kind:
            ArchiveGalacticObjectRenderKind.OPEN_CLUSTER,
          knowledgeLevel,
          seed:
            renderSeed,
          accessibleLabel:
            `Render procedural de ${title}`,
          variant:
            null,
          renderProfile:
            ArchiveGalacticObjectRenderProfile
              .OPEN_CLUSTER_FIELD,
          scale:
            normalizeLog(
              cluster.physicalProperties.halfMassRadiusParsecs,
              0.1,
              30,
            ),
          density:
            normalizeLog(
              cluster.physicalProperties.stellarCount,
              10,
              100_000,
            ),
          energy:
            confirmed
              ? 1 - normalizeLog(
                  cluster.physicalProperties.ageMillionYears,
                  1,
                  10_000,
                )
              : 0.62,
          concentration:
            clamp01(
              cluster.physicalProperties.boundFraction,
            ),
        }),
      );
    }

    case GalacticObjectScientificSubject.GLOBULAR_CLUSTER: {
      const cluster =
        GlobularClusterGenerator
          .generate(
            generationKey,
            locator,
          );

      const facts:
        ArchiveGalacticObjectFact[] =
        [
          fact(
            'Población estelar',
            formatInteger(
              cluster.physicalProperties.stellarCount,
            ),
          ),
          fact(
            'Masa',
            formatQuantity(
              cluster.physicalProperties.massSolarMasses,
              'M☉',
              1,
            ),
          ),
          fact(
            'Radio del núcleo',
            formatQuantity(
              cluster.physicalProperties.coreRadiusParsecs,
              'pc',
              2,
            ),
          ),
          fact(
            'Radio de semiluz',
            formatQuantity(
              cluster.physicalProperties.halfLightRadiusParsecs,
              'pc',
              2,
            ),
          ),
          fact(
            'Concentración central',
            formatPercent(
              cluster.physicalProperties.centralConcentration,
            ),
          ),
        ];

      if (
        confirmed
      ) {
        facts.push(
          fact(
            'Edad',
            formatQuantity(
              cluster.physicalProperties.ageBillionYears,
              'Gyr',
              2,
            ),
          ),
          fact(
            'Metalicidad',
            `${formatNumber(
              cluster.physicalProperties.metallicitySolarRatio,
              3,
            )} Z☉`,
          ),
          fact(
            'Radio de marea',
            formatQuantity(
              cluster.physicalProperties.tidalRadiusParsecs,
              'pc',
              2,
            ),
          ),
          fact(
            'Fracción de remanentes',
            formatPercent(
              cluster.physicalProperties.stellarRemnantFraction,
            ),
          ),
        );
      }

      return physicalCard(
        coarseFamily,
        scientificSubject,
        knowledgeLevel,
        title,
        confirmed
          ? 'La estructura y la población antigua del cúmulo globular están confirmadas.'
          : 'La estructura del cúmulo globular está catalogada; edad, metalicidad y población remanente requieren confirmación.',
        confirmed
          ? 'Ciclo científico completado'
          : confirmationActionLabel(
              scientificSubject,
            ),
        facts,
        Object.freeze({
          kind:
            ArchiveGalacticObjectRenderKind.GLOBULAR_CLUSTER,
          knowledgeLevel,
          seed:
            renderSeed,
          accessibleLabel:
            `Render procedural de ${title}`,
          variant:
            null,
          renderProfile:
            ArchiveGalacticObjectRenderProfile
              .GLOBULAR_CLUSTER_FIELD,
          scale:
            normalizeLog(
              cluster.physicalProperties.halfLightRadiusParsecs,
              0.2,
              20,
            ),
          density:
            normalizeLog(
              cluster.physicalProperties.stellarCount,
              20_000,
              2_000_000,
            ),
          energy:
            confirmed
              ? 1 - normalizeLog(
                  cluster.physicalProperties.ageBillionYears,
                  0.5,
                  14,
                )
              : 0.35,
          concentration:
            clamp01(
              cluster.physicalProperties.centralConcentration,
            ),
        }),
      );
    }

    case GalacticObjectScientificSubject.SUPERNOVA_REMNANT: {
      const remnant =
        SupernovaRemnantGenerator
          .generate(
            generationKey,
            locator,
          );

      const facts:
        ArchiveGalacticObjectFact[] =
        [
          fact(
            'Morfología',
            supernovaRemnantMorphologyLabel(
              remnant.morphology,
            ),
          ),
          fact(
            'Radio',
            formatQuantity(
              remnant.physicalProperties.radiusParsecs,
              'pc',
              2,
            ),
          ),
          fact(
            'Velocidad de expansión',
            formatQuantity(
              remnant.physicalProperties.expansionVelocityKmPerSecond,
              'km/s',
              0,
            ),
          ),
          fact(
            'Temperatura de choque',
            formatScientificQuantity(
              remnant.physicalProperties.shockTemperatureKelvin,
              'K',
            ),
          ),
        ];

      if (
        confirmed
      ) {
        facts.push(
          fact(
            'Edad',
            formatQuantity(
              remnant.physicalProperties.ageYears,
              'años',
              0,
            ),
          ),
          fact(
            'Energía de explosión',
            formatScientificQuantity(
              remnant.physicalProperties.explosionEnergyErgs,
              'erg',
            ),
          ),
          fact(
            'Densidad ambiente H',
            formatQuantity(
              remnant.physicalProperties.ambientHydrogenNumberDensityPerCm3,
              'cm⁻³',
              3,
            ),
          ),
          fact(
            'Masa eyectada',
            formatQuantity(
              remnant.physicalProperties.ejectaMassSolarMasses,
              'M☉',
              2,
            ),
          ),
          fact(
            'Masa barrida',
            formatQuantity(
              remnant.physicalProperties.sweptUpMassSolarMasses,
              'M☉',
              2,
            ),
          ),
        );
      }

      return physicalCard(
        coarseFamily,
        scientificSubject,
        knowledgeLevel,
        title,
        confirmed
          ? 'La evolución física del remanente está confirmada y vinculada a su identidad persistente.'
          : 'La onda de choque está caracterizada; la reconstrucción evolutiva completa permanece pendiente de confirmación.',
        confirmed
          ? 'Ciclo científico completado'
          : confirmationActionLabel(
              scientificSubject,
            ),
        facts,
        Object.freeze({
          kind:
            ArchiveGalacticObjectRenderKind.SUPERNOVA_REMNANT,
          knowledgeLevel,
          seed:
            renderSeed,
          accessibleLabel:
            `Render procedural de ${title}`,
          variant:
            remnant.morphology,
          renderProfile:
            remnant.morphology ===
              SupernovaRemnantMorphology.SHELL
              ? ArchiveGalacticObjectRenderProfile
                  .SUPERNOVA_REMNANT_SHELL
              : remnant.morphology ===
                    SupernovaRemnantMorphology.PLERION
                ? ArchiveGalacticObjectRenderProfile
                    .SUPERNOVA_REMNANT_PLERION
                : ArchiveGalacticObjectRenderProfile
                    .SUPERNOVA_REMNANT_COMPOSITE,
          scale:
            normalizeLog(
              remnant.physicalProperties.radiusParsecs,
              0.6,
              85,
            ),
          density:
            confirmed
              ? normalizeLog(
                  remnant.physicalProperties.ambientHydrogenNumberDensityPerCm3,
                  0.005,
                  10,
                )
              : 0.42,
          energy:
            normalizeLog(
              remnant.physicalProperties.shockTemperatureKelvin,
              10_000,
              1.0e9,
            ),
          concentration:
            confirmed
              ? normalizeLog(
                  remnant.physicalProperties.sweptUpMassSolarMasses +
                    1,
                  1,
                  10_000,
                )
              : 0.5,
        }),
      );
    }
  }

  throw new RangeError(
    `Scientific subject not supported by point 12.8: ${String(scientificSubject)}.`,
  );
}

function physicalCard(
  coarseFamily:
    GalacticObjectScientificSurveyFamily,

  scientificSubject:
    GalacticObjectScientificSubject,

  knowledgeLevel:
    ArchiveGalacticObjectKnowledgeLevel,

  title:
    string,

  summary:
    string,

  nextScientificStep:
    string,

  facts:
    readonly ArchiveGalacticObjectFact[],

  render:
    ArchiveGalacticObjectRenderDescriptor,
): ArchiveGalacticObjectCardModel {

  return Object.freeze({
    coarseFamily,
    scientificSubject,
    knowledgeLevel,
    knowledgeLevelLabel:
      knowledgeLevelLabel(
        knowledgeLevel,
      ),
    title,
    summary,
    nextScientificStep,
    facts:
      Object.freeze([
        ...facts,
      ]),
    render,
  });
}

function renderProfileForObservedMorphology(
  generationKey:
    UniverseGenerationKey,

  locator:
    GalacticObjectLocator,

  coarseFamily:
    GalacticObjectScientificSurveyFamily,
): ArchiveGalacticObjectRenderProfile | null {

  if (
    coarseFamily ===
      GalacticObjectScientificSurveyFamily.STAR_CLUSTER
  ) {
    return OpenClusterGenerator
      .isOpenClusterLocator(
        generationKey,
        locator,
      )
      ? ArchiveGalacticObjectRenderProfile
          .OPEN_CLUSTER_FIELD
      : ArchiveGalacticObjectRenderProfile
          .GLOBULAR_CLUSTER_FIELD;
  }

  if (
    coarseFamily ===
      GalacticObjectScientificSurveyFamily.EXTREME_OBJECT
  ) {
    if (
      !SupernovaRemnantGenerator
        .isSupernovaRemnantLocator(
          generationKey,
          locator,
        )
    ) {
      return null;
    }

    const morphology =
      SupernovaRemnantGenerator
        .resolveMorphology(
          generationKey,
          locator,
        );

    return morphology ===
      SupernovaRemnantMorphology.SHELL
      ? ArchiveGalacticObjectRenderProfile
          .SUPERNOVA_REMNANT_SHELL
      : morphology ===
          SupernovaRemnantMorphology.PLERION
        ? ArchiveGalacticObjectRenderProfile
            .SUPERNOVA_REMNANT_PLERION
        : ArchiveGalacticObjectRenderProfile
            .SUPERNOVA_REMNANT_COMPOSITE;
  }

  if (
    coarseFamily !==
      GalacticObjectScientificSurveyFamily.NEBULA
  ) {
    return null;
  }

  /*
   * Resolve only discriminators, never numeric physical Ground Truth. The
   * renderer profile is opaque: it preserves an already-observed morphology
   * without exposing nebular subtype, H II activity or cluster specialization
   * through variant/facts.
   */
  const nebulaType =
    NebulaGenerator
      .resolveType(
        generationKey,
        locator,
      );

  if (
    nebulaType ===
      NebulaType.EMISSION
  ) {
    const activity =
      HiiRegionGenerator
        .resolveActivity(
          generationKey,
          locator,
        );

    if (
      activity ===
        StarFormationActivity.LOW
    ) {
      return ArchiveGalacticObjectRenderProfile
        .HII_LOW_VOLUME;
    }

    if (
      activity ===
        StarFormationActivity.MODERATE
    ) {
      return ArchiveGalacticObjectRenderProfile
        .HII_MODERATE_VOLUME;
    }

    if (
      activity ===
        StarFormationActivity.HIGH
    ) {
      return ArchiveGalacticObjectRenderProfile
        .HII_HIGH_VOLUME;
    }

    if (
      activity ===
        StarFormationActivity.INTENSE
    ) {
      return ArchiveGalacticObjectRenderProfile
        .HII_INTENSE_VOLUME;
    }
  }

  return nebulaType ===
    NebulaType.PLANETARY
    ? ArchiveGalacticObjectRenderProfile
        .PLANETARY_VOLUME
    : null;
}

function createSignalRenderDescriptor(
  coarseFamily:
    GalacticObjectScientificSurveyFamily,

  seed:
    string,

  title:
    string,

  renderProfile:
    ArchiveGalacticObjectRenderProfile | null =
      null,
): ArchiveGalacticObjectRenderDescriptor {

  const kind =
    coarseFamily ===
      GalacticObjectScientificSurveyFamily.NEBULA
      ? ArchiveGalacticObjectRenderKind.NEBULA
      : coarseFamily ===
          GalacticObjectScientificSurveyFamily.STAR_CLUSTER
        ? ArchiveGalacticObjectRenderKind.STAR_CLUSTER
        : ArchiveGalacticObjectRenderKind.EXTREME_OBJECT;

  return Object.freeze({
    kind,
    knowledgeLevel:
      ArchiveGalacticObjectKnowledgeLevel.SIGNAL,
    seed,
    accessibleLabel:
      `Render procedural de señal no clasificada: ${title}`,
    variant:
      null,
    renderProfile,
    scale:
      0.5,
    density:
      0.5,
    energy:
      0.5,
    concentration:
      0.5,
  });
}

function createIdentifiedRenderDescriptor(
  kind:
    ArchiveGalacticObjectRenderKind,

  knowledgeLevel:
    ArchiveGalacticObjectKnowledgeLevel,

  seed:
    string,

  title:
    string,

  renderProfile:
    ArchiveGalacticObjectRenderProfile | null =
      null,
): ArchiveGalacticObjectRenderDescriptor {

  return Object.freeze({
    kind,
    knowledgeLevel,
    seed,
    accessibleLabel:
      `Render procedural científico de ${title}`,
    variant:
      null,
    renderProfile,
    scale:
      0.5,
    density:
      0.5,
    energy:
      0.5,
    concentration:
      kind ===
        ArchiveGalacticObjectRenderKind.GLOBULAR_CLUSTER
        ? 0.78
        : 0.5,
  });
}

function surveyFamilyFor(
  resultKind:
    ExplorationLocatedResultKind,
): GalacticObjectScientificSurveyFamily {

  switch (
    resultKind
  ) {
    case ExplorationResultKind.NEBULA:
      return GalacticObjectScientificSurveyFamily.NEBULA;

    case ExplorationResultKind.STAR_CLUSTER:
      return GalacticObjectScientificSurveyFamily.STAR_CLUSTER;

    case ExplorationResultKind.EXTREME_OBJECT:
      return GalacticObjectScientificSurveyFamily.EXTREME_OBJECT;

    case ExplorationResultKind.SYSTEM:
      throw new RangeError(
        'Point-12.8 GalacticObject card does not accept SYSTEM results.',
      );
  }

  throw new RangeError(
    `Unsupported point-12.8 result kind: ${String(resultKind)}.`,
  );
}

function knowledgeLevelFor(
  state:
    DiscoveryStateValue,
): ArchiveGalacticObjectKnowledgeLevel {

  if (
    state.code >=
    DiscoveryState.CONFIRMED.code
  ) {
    return ArchiveGalacticObjectKnowledgeLevel.CONFIRMED;
  }

  if (
    state.code >=
    DiscoveryState.CATALOGUED.code
  ) {
    return ArchiveGalacticObjectKnowledgeLevel.CATALOGUED;
  }

  if (
    state.code >=
    DiscoveryState.DISCOVERED.code
  ) {
    return ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED;
  }

  return ArchiveGalacticObjectKnowledgeLevel.SIGNAL;
}

function knowledgeLevelLabel(
  level:
    ArchiveGalacticObjectKnowledgeLevel,
): string {

  switch (
    level
  ) {
    case ArchiveGalacticObjectKnowledgeLevel.SIGNAL:
      return 'Señal localizada';

    case ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED:
      return 'Identidad científica';

    case ArchiveGalacticObjectKnowledgeLevel.CATALOGUED:
      return 'Caracterización catalogada';

    case ArchiveGalacticObjectKnowledgeLevel.CONFIRMED:
      return 'Confirmación completa';
  }
}

function coarseDetectedTitle(
  family:
    GalacticObjectScientificSurveyFamily,
): string {

  switch (
    family
  ) {
    case GalacticObjectScientificSurveyFamily.NEBULA:
      return 'Firma nebular sin clasificar';

    case GalacticObjectScientificSurveyFamily.STAR_CLUSTER:
      return 'Concentración estelar sin clasificar';

    case GalacticObjectScientificSurveyFamily.EXTREME_OBJECT:
      return 'Fuente extrema sin clasificar';
  }
}

function scientificSubjectLabel(
  subject:
    GalacticObjectScientificSubject,
): string {

  switch (
    subject
  ) {
    case GalacticObjectScientificSubject.NEBULA:
      return 'Nebulosa';

    case GalacticObjectScientificSubject.HII_REGION:
      return 'Región H II';

    case GalacticObjectScientificSubject.OPEN_CLUSTER:
      return 'Cúmulo abierto';

    case GalacticObjectScientificSubject.GLOBULAR_CLUSTER:
      return 'Cúmulo globular';

    case GalacticObjectScientificSubject.SUPERNOVA_REMNANT:
      return 'Remanente de supernova';
  }
}

function identifiedSummary(
  subject:
    GalacticObjectScientificSubject,
): string {

  switch (
    subject
  ) {
    case GalacticObjectScientificSubject.NEBULA:
      return 'La identidad nebular ya está establecida. La caracterización espectroscópica desbloqueará sus primeras magnitudes físicas.';

    case GalacticObjectScientificSubject.HII_REGION:
      return 'La fuente está identificada como región H II. La caracterización de ionización debe preceder a la confirmación de formación estelar.';

    case GalacticObjectScientificSubject.OPEN_CLUSTER:
      return 'La agrupación está identificada como cúmulo abierto. La población debe caracterizarse antes de confirmar edad y metalicidad.';

    case GalacticObjectScientificSubject.GLOBULAR_CLUSTER:
      return 'La agrupación está identificada como cúmulo globular. La estructura debe caracterizarse antes de confirmar su población antigua.';

    case GalacticObjectScientificSubject.SUPERNOVA_REMNANT:
      return 'La fuente extrema está identificada como remanente de supernova persistente. La onda de choque debe caracterizarse antes de reconstruir su evolución.';
  }
}

function surveyActionLabel(
  family:
    GalacticObjectScientificSurveyFamily,
): string {

  switch (
    family
  ) {
    case GalacticObjectScientificSurveyFamily.NEBULA:
      return 'Reconocimiento de nebulosa';

    case GalacticObjectScientificSurveyFamily.STAR_CLUSTER:
      return 'Reconocimiento de cúmulo estelar';

    case GalacticObjectScientificSurveyFamily.EXTREME_OBJECT:
      return 'Localización de fuente extrema';
  }
}

function characterizationActionLabel(
  subject:
    GalacticObjectScientificSubject,
): string {

  switch (
    subject
  ) {
    case GalacticObjectScientificSubject.NEBULA:
      return 'Caracterización espectroscópica de nebulosa';

    case GalacticObjectScientificSubject.HII_REGION:
      return 'Caracterización de ionización H II';

    case GalacticObjectScientificSubject.OPEN_CLUSTER:
      return 'Caracterización de población del cúmulo abierto';

    case GalacticObjectScientificSubject.GLOBULAR_CLUSTER:
      return 'Caracterización estructural del cúmulo globular';

    case GalacticObjectScientificSubject.SUPERNOVA_REMNANT:
      return 'Caracterización de la onda de choque';
  }
}

function confirmationActionLabel(
  subject:
    GalacticObjectScientificSubject,
): string {

  switch (
    subject
  ) {
    case GalacticObjectScientificSubject.NEBULA:
      return 'Confirmación física de nebulosa';

    case GalacticObjectScientificSubject.HII_REGION:
      return 'Confirmación de formación estelar H II';

    case GalacticObjectScientificSubject.OPEN_CLUSTER:
      return 'Confirmación de edad y metalicidad';

    case GalacticObjectScientificSubject.GLOBULAR_CLUSTER:
      return 'Confirmación de población globular';

    case GalacticObjectScientificSubject.SUPERNOVA_REMNANT:
      return 'Confirmación evolutiva del remanente';
  }
}

function renderKindForSubject(
  subject:
    GalacticObjectScientificSubject,
): ArchiveGalacticObjectRenderKind {

  switch (
    subject
  ) {
    case GalacticObjectScientificSubject.NEBULA:
      return ArchiveGalacticObjectRenderKind.NEBULA;

    case GalacticObjectScientificSubject.HII_REGION:
      return ArchiveGalacticObjectRenderKind.HII_REGION;

    case GalacticObjectScientificSubject.OPEN_CLUSTER:
      return ArchiveGalacticObjectRenderKind.OPEN_CLUSTER;

    case GalacticObjectScientificSubject.GLOBULAR_CLUSTER:
      return ArchiveGalacticObjectRenderKind.GLOBULAR_CLUSTER;

    case GalacticObjectScientificSubject.SUPERNOVA_REMNANT:
      return ArchiveGalacticObjectRenderKind.SUPERNOVA_REMNANT;
  }
}

function nebulaTypeLabel(
  type:
    NebulaTypeValue,
): string {

  switch (
    type
  ) {
    case NebulaType.EMISSION:
      return 'Emisión';

    case NebulaType.REFLECTION:
      return 'Reflexión';

    case NebulaType.DARK:
      return 'Oscura';

    case NebulaType.PLANETARY:
      return 'Planetaria';
  }
}

function starFormationActivityLabel(
  activity:
    StarFormationActivityValue,
): string {

  switch (
    activity
  ) {
    case StarFormationActivity.LOW:
      return 'Baja';

    case StarFormationActivity.MODERATE:
      return 'Moderada';

    case StarFormationActivity.HIGH:
      return 'Alta';

    case StarFormationActivity.INTENSE:
      return 'Intensa';
  }
}

function supernovaRemnantMorphologyLabel(
  morphology:
    SupernovaRemnantMorphologyValue,
): string {

  switch (
    morphology
  ) {
    case SupernovaRemnantMorphology.SHELL:
      return 'Cáscara';

    case SupernovaRemnantMorphology.PLERION:
      return 'Plerión';

    case SupernovaRemnantMorphology.COMPOSITE:
      return 'Compuesta';
  }
}

function activityIntensity(
  activity:
    StarFormationActivityValue,
): number {

  switch (
    activity
  ) {
    case StarFormationActivity.LOW:
      return 0.28;

    case StarFormationActivity.MODERATE:
      return 0.48;

    case StarFormationActivity.HIGH:
      return 0.72;

    case StarFormationActivity.INTENSE:
      return 0.95;
  }
}

function createRenderSeed(
  generationKey:
    UniverseGenerationKey,

  locator:
    GalacticObjectLocator,
): string {

  return [
    generationKey.universeSeed.serialize(),
    `V${generationKey.generatorVersion.code}`,
    locator.galaxyIndex.toString(10),
    locator.sectorKey.toString(10),
    locator.galacticObjectIndex.toString(10),
    'ARCHIVE-12.8-RENDER-V1',
  ].join(
    '/',
  );
}

function fact(
  label:
    string,

  value:
    string,
): ArchiveGalacticObjectFact {

  return Object.freeze({
    label,
    value,
  });
}

const ES_NUMBER =
  new Intl.NumberFormat(
    'es-ES',
    {
      maximumFractionDigits:
        3,
    },
  );

function formatNumber(
  value:
    number,

  maximumFractionDigits:
    number,
): string {

  return new Intl.NumberFormat(
    'es-ES',
    {
      maximumFractionDigits,
    },
  ).format(
    value,
  );
}

function formatInteger(
  value:
    number,
): string {

  return new Intl.NumberFormat(
    'es-ES',
    {
      maximumFractionDigits:
        0,
    },
  ).format(
    value,
  );
}

function formatQuantity(
  value:
    number,

  unit:
    string,

  maximumFractionDigits:
    number,
): string {

  return `${formatNumber(
    value,
    maximumFractionDigits,
  )} ${unit}`;
}

function formatPercent(
  value:
    number,
): string {

  return `${formatNumber(
    value *
      100,
    1,
  )} %`;
}

function formatScientific(
  value:
    number,
): string {

  if (
    value ===
    0
  ) {
    return '0';
  }

  const exponent =
    Math.floor(
      Math.log10(
        Math.abs(
          value,
        ),
      ),
    );

  const coefficient =
    value /
    10 ** exponent;

  return `${ES_NUMBER.format(
    coefficient,
  )} × 10^${exponent}`;
}

function formatScientificQuantity(
  value:
    number,

  unit:
    string,
): string {

  return `${formatScientific(
    value,
  )} ${unit}`;
}

function normalizeLinear(
  value:
    number,

  minimum:
    number,

  maximum:
    number,
): number {

  return clamp01(
    (
      value -
      minimum
    ) /
    (
      maximum -
      minimum
    ),
  );
}

function normalizeLog(
  value:
    number,

  minimum:
    number,

  maximum:
    number,
): number {

  const safeValue =
    Math.max(
      minimum,
      value,
    );

  return normalizeLinear(
    Math.log10(
      safeValue,
    ),
    Math.log10(
      minimum,
    ),
    Math.log10(
      maximum,
    ),
  );
}

function clamp01(
  value:
    number,
): number {

  return Math.max(
    0,
    Math.min(
      1,
      value,
    ),
  );
}
