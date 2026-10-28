import { planetVida9aAudit } from '../scientific/vida9a-physical-biology-audit-adapter';
import type { Vida9aAuditResult } from '../scientific/vida9a-physical-biology-coherence';
import { Vida9BiologyExploration } from '../../simulation/life/vida9-biology-exploration';
import type { Vida9BiologyRecord } from '../../domain/life/vida9-biology-exploration';
import { Vida8TechnologicalColonization } from '../../simulation/life/vida8-technological-colonization';
import { Vida8LocalOriginDiscovery } from '../../simulation/life/vida8-local-origin-discovery';
import type { Vida8ColonizationSnapshot } from '../../domain/life/vida8-technological-colonization';
import { Vida6EcosystemsSpecies } from '../../simulation/life/vida6-ecosystems-species';
import { Vida7IntelligenceCivilizations } from '../../simulation/life/vida7-intelligence-civilizations';
import type { Vida7IntelligenceCivilizationSnapshot } from '../../domain/life/vida7-intelligence-civilizations';
import type { Vida6EcosystemSnapshot } from '../../domain/life/vida6-ecosystems-species';
import { Vida5BiogenicAtmosphere } from '../../simulation/life/vida5-biogenic-atmosphere';
import { Vida5aEcologyAtmosphere } from '../../simulation/life/vida5a-ecology-atmosphere';
import { Vida5bEcologicalMaturation } from '../../simulation/life/vida5b-ecological-maturation';
import { Vida5cAdvancedBiospheres } from '../../simulation/life/vida5c-advanced-biospheres';
import type { Vida5cAdvancedBiosphere } from '../../domain/life/vida5c-advanced-biospheres';
import type { Vida5bMaturedBiosphere } from '../../domain/life/vida5b-ecological-maturation';
import type { Vida5aCoupledBiosphere } from '../../domain/life/vida5a-ecology-atmosphere';
import type { Vida5AtmosphericFeedback } from '../../domain/life/vida5-biogenic-atmosphere';
import { ProceduralEcologyVIDA4 } from '../../simulation/life/procedural-ecology-vida4';
import { ProceduralMicrobialLifeVIDA3 } from '../../simulation/life/procedural-microbial-life-vida3';
import { Vida2PhysicalInput } from '../../simulation/life/life-plausibility-physical-adapter-vida2';
import type { Vida2WorldAssessment } from '../../simulation/life/life-plausibility-engine-vida2';
import { ObservedHabitabilityFiche31Fe, type ObservedHabitabilityFiche31Fe as ObservedHabitabilityFiche31FeModel } from '../scientific/observed-habitability-fiche-31-f-e';
import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  BodyLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  PlanetScientificTargetResolver,
  type PlanetScientificResolvedTarget,
} from '../../simulation/planetary/planet-scientific-target-resolver';

import {
  PlanetScientificSectionsAssembler,
  type PlanetScientificSectionsModel,
} from './planet-scientific-sections';

import {
  ArchiveDiscoveryLocatorKind,
  type ArchiveDiscoveryDetailModel,
} from '../genesis-archive/archive-discovery-detail.facade';


import {
  ScientificBodyPreviewAssembler,
  DEFAULT_SCIENTIFIC_BODY_PREVIEW_SCENE_RESOLVER,
  type ScientificBodyPreviewModel,
  type ScientificBodyPreviewSceneResolver,
} from '../scientific/scientific-body-preview';

export const PlanetScientificFicheResolutionKind =
  Object.freeze({
    LOCKED:
      'LOCKED',
    AVAILABLE:
      'AVAILABLE',
    NOT_FOUND:
      'NOT_FOUND',
  } as const);

export type PlanetScientificFicheResolutionKind =
  typeof PlanetScientificFicheResolutionKind[
    keyof typeof PlanetScientificFicheResolutionKind
  ];

export interface PlanetScientificCardModel {
  /** Deterministic scenario; does not itself prove an observed biosignature. */
  readonly atmosphericFeedbackVIDA5?: Vida5AtmosphericFeedback;
  /** Internal scenario only; not a direct observed-life disclosure. */
  readonly ecologicalCouplingVIDA5a?: Vida5aCoupledBiosphere;
  /** Current effective ecological scenario; VIDA.5a retained for historical comparison. */
  readonly ecologicalMaturationVIDA5b?: Vida5bMaturedBiosphere;
  /** Private current ecology: previous phases retained unchanged. */
  readonly ecologicalCalibrationVIDA5c?: Vida5cAdvancedBiosphere;
  /** Ground Truth privado; NO mostrar como evidencia observada. */
  readonly privateEcosystemVIDA6?: Vida6EcosystemSnapshot;
  /** Ground Truth privately retained; not observed in the scientific fiche. */
  readonly privateCivilizationVIDA7?: Vida7IntelligenceCivilizationSnapshot;
  /** Private colonization, distinct from native life and observations. */
  readonly privateColonizationVIDA8?: Vida8ColonizationSnapshot;
  /** VIDA.9: fully revealed only because parent system is CONFIRMED. */
  readonly confirmedBiologyVIDA9?: Vida9BiologyRecord;
  readonly coherenceAuditVIDA9a?: Vida9aAuditResult;
  readonly vida2?: Vida2WorldAssessment;
  readonly observedHabitability?: ObservedHabitabilityFiche31FeModel;
  readonly title:
    string;

  readonly summary:
    string;

  readonly hostSystemTitle:
    string;

  readonly planetOrdinal:
    number;

  readonly bodyIndex:
    bigint;

  readonly orbitTopologyLabel:
    string;

  readonly hostPlanetCount:
    number;

  readonly accessLabel:
    string;

  readonly planetaryKnowledgeLabel:
    string;

  readonly locatorLabel:
    string;

  readonly sections:
    PlanetScientificSectionsModel;

  readonly preview:
    ScientificBodyPreviewModel;
}

export type PlanetScientificFicheResolution =
  | {
      readonly kind:
        typeof PlanetScientificFicheResolutionKind.LOCKED;

      readonly reason:
        string;
    }
  | {
      readonly kind:
        typeof PlanetScientificFicheResolutionKind.NOT_FOUND;

      readonly reason:
        string;
    }
  | {
      readonly kind:
        typeof PlanetScientificFicheResolutionKind.AVAILABLE;

      readonly card:
        PlanetScientificCardModel;
    };

export interface PlanetScientificTargetResolutionResolver {
  resolveDetailed(
    generationKey:
      UniverseGenerationKey,

    locator:
      BodyLocator,
  ): PlanetScientificResolvedTarget | null;
}

const DEFAULT_TARGET_RESOLVER:
  PlanetScientificTargetResolutionResolver =
  Object.freeze({
    resolveDetailed(
      generationKey:
        UniverseGenerationKey,

      locator:
        BodyLocator,
    ): PlanetScientificResolvedTarget | null {
      return PlanetScientificTargetResolver
        .resolveDetailed(
          generationKey,
          locator,
        );
    },
  });

/**
 * Point-26.4 state-safe detailed planet fiche assembler.
 *
 * The host system must already be CONFIRMED before the detailed target is
 * materialized. Point 26.4 projects the already-frozen phase-19/20/21 science
 * into explicit UI sections. It does not create a separate planetary
 * DiscoveryState and never exposes generation keys, procedural seeds or domain
 * aggregates to the presentation model.
 */
export class PlanetScientificCardAssembler {

  private constructor() {}

  static build(
    systemModel:
      ArchiveDiscoveryDetailModel,

    bodyIndex:
      bigint,

    resolver:
      PlanetScientificTargetResolutionResolver =
        DEFAULT_TARGET_RESOLVER,

    previewSceneResolver:
      ScientificBodyPreviewSceneResolver =
        DEFAULT_SCIENTIFIC_BODY_PREVIEW_SCENE_RESOLVER,
  ): PlanetScientificFicheResolution {

    if (
      systemModel.locatorKind !==
        ArchiveDiscoveryLocatorKind.SYSTEM ||
      systemModel.stellarSystemCard ===
        null
    ) {
      return Object.freeze({
        kind:
          PlanetScientificFicheResolutionKind.NOT_FOUND,
        reason:
          'La ruta planetaria requiere un sistema estelar persistido.',
      });
    }

    if (
      bodyIndex <
        0n
    ) {
      return Object.freeze({
        kind:
          PlanetScientificFicheResolutionKind.NOT_FOUND,
        reason:
          'El índice planetario de la ruta no es válido.',
      });
    }

    if (
      systemModel.discoveryState.code <
        DiscoveryState.CONFIRMED.code
    ) {
      return Object.freeze({
        kind:
          PlanetScientificFicheResolutionKind.LOCKED,
        reason:
          'La investigación individual de cuerpos requiere que el sistema anfitrión esté confirmado.',
      });
    }

    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          systemModel.universeSeed,
        ),
        GeneratorVersion.fromCode(
          systemModel.generatorVersionCode,
        ),
      );

    const locator =
      new BodyLocator(
        systemModel.galaxyIndex,
        systemModel.sectorKey,
        systemModel.galacticObjectIndex,
        bodyIndex,
      );

    const target =
      resolver.resolveDetailed(
        generationKey,
        locator,
      );

    if (
      target ===
        null
    ) {
      return Object.freeze({
        kind:
          PlanetScientificFicheResolutionKind.NOT_FOUND,
        reason:
          'El índice solicitado no corresponde a un planeta de este sistema.',
      });
    }

    const identity =
      target.identity;

    // VIDA.5: compute biological evolution from the ORIGINAL physical target.
    // The final atmospheric scenario must not feed backwards into the VIDA.2
    // eligibility draw; nor can it mutate the frozen PRE-33 physical baseline.
    const vida2 = systemModel.generatorVersionCode === 3
      ? Vida2PhysicalInput.planet(target) : undefined;
    const microbialVIDA3 = vida2 && systemModel.generatorVersionCode === 3
      ? ProceduralMicrobialLifeVIDA3.evaluate({
          universeSeed: systemModel.universeSeed,
          generatorVersionCode: 3, kind: 'PLANET',
          galaxyIndex: systemModel.galaxyIndex.toString(),
          sectorKey: systemModel.sectorKey.toString(),
          galacticObjectIndex: systemModel.galacticObjectIndex.toString(),
          bodyIndex: bodyIndex.toString(), moonIndex: null,
        }, vida2) : undefined;
    const ecologyVIDA4 = microbialVIDA3 ? ProceduralEcologyVIDA4.evaluate(microbialVIDA3) : undefined;
    const ecologicalCouplingVIDA5a = ecologyVIDA4 &&
      Array.isArray(target.detail.atmosphere.retainedGasComposition)
      ? Vida5aEcologyAtmosphere.evaluate(ecologyVIDA4, target) : undefined;
    const ecologicalMaturationVIDA5b = ecologicalCouplingVIDA5a
      ? Vida5bEcologicalMaturation.evaluate(ecologicalCouplingVIDA5a) : undefined;
    const ecologicalCalibrationVIDA5c = microbialVIDA3 && ecologyVIDA4 && ecologicalMaturationVIDA5b
      ? Vida5cAdvancedBiospheres.evaluate(microbialVIDA3, ecologyVIDA4, ecologicalMaturationVIDA5b, target)
      : undefined;
    const privateEcosystemVIDA6 = microbialVIDA3 && ecologyVIDA4
      ? Vida6EcosystemsSpecies.evaluate(microbialVIDA3, ecologyVIDA4, ecologicalCalibrationVIDA5c)
      : undefined;
    const privateCivilizationVIDA7 = privateEcosystemVIDA6
      ? Vida7IntelligenceCivilizations.evaluate(privateEcosystemVIDA6, ecologicalCalibrationVIDA5c)
      : undefined;
    // VIDA.8: only already-existing native source civilizations in this confirmed
    // V3 system. Do not generate colonies from imaginary unvisited systems.
    const privateColonizationVIDA8 = privateEcosystemVIDA6 && privateCivilizationVIDA7 && vida2
      ? Vida8TechnologicalColonization.evaluate({ecosystem:privateEcosystemVIDA6,
          nativeCivilization:privateCivilizationVIDA7,physical:vida2,
          solidSurface:target.detail.surface.hasDefinedSolidSurfaceBase},
          resolver===DEFAULT_TARGET_RESOLVER ? Vida8LocalOriginDiscovery.findInSystem({
            universeSeed:systemModel.universeSeed,generatorVersionCode:3,
            galaxyIndex:systemModel.galaxyIndex.toString(),
            sectorKey:systemModel.sectorKey.toString(),
            galacticObjectIndex:systemModel.galacticObjectIndex.toString(),
          },identity.hostPlanetCount,(index)=>resolver.resolveDetailed(generationKey,
            new BodyLocator(systemModel.galaxyIndex,systemModel.sectorKey,
              systemModel.galacticObjectIndex,index)),true) : [])
      : undefined;
    const confirmedBiologyVIDA9 = privateEcosystemVIDA6 && privateCivilizationVIDA7 && privateColonizationVIDA8
      ? Vida9BiologyExploration.evaluate(privateEcosystemVIDA6,privateCivilizationVIDA7,privateColonizationVIDA8)
      : undefined;
    const atmosphericFeedbackVIDA5 = ecologicalCalibrationVIDA5c?.atmosphericFeedback ??
      ecologicalMaturationVIDA5b?.atmosphericFeedback;
    const currentTarget = atmosphericFeedbackVIDA5
      ? Vida5BiogenicAtmosphere.applyToTarget(target, atmosphericFeedbackVIDA5)
      : target;

    return Object.freeze({
      kind:
        PlanetScientificFicheResolutionKind.AVAILABLE,
      card:
        Object.freeze({
          title:
            identity.designation,
          summary:
            `${identity.designation} es el planeta ${identity.planetOrdinal} del sistema ${identity.hostSystemDesignation}. Su sistema anfitrión está confirmado y permite consultar esta caracterización científica detallada.` +
            (target.detail.surface.pre33WaterPhaseLimitation === 'NON_CONVERGED_PHASE_MODEL'
              ? ' El escenario complementario de agua PRE-33.03 no es evaluable porque el equilibrio atmosférico de referencia no ha convergido. No se deduce ausencia de agua ni de vida.'
              : ''),
          hostSystemTitle:
            identity.hostSystemDesignation,
          planetOrdinal:
            identity.planetOrdinal,
          bodyIndex,
          orbitTopologyLabel:
            orbitTopologyLabel(
              identity.orbitTopology,
            ),
          hostPlanetCount:
            identity.hostPlanetCount,
          accessLabel:
            'Consulta científica habilitada',
          planetaryKnowledgeLabel:
            'Caracterización científica detallada',
          locatorLabel:
            `G${systemModel.galaxyIndex.toString()} / S${systemModel.sectorKey.toString()} / O${systemModel.galacticObjectIndex.toString()} / B${bodyIndex.toString()}`,
          vida2: vida2 ?? Vida2PhysicalInput.planet(target),
          atmosphericFeedbackVIDA5,
          ecologicalCouplingVIDA5a,
          ecologicalMaturationVIDA5b,
          ecologicalCalibrationVIDA5c,
          privateEcosystemVIDA6,
          privateCivilizationVIDA7,
          privateColonizationVIDA8,
          confirmedBiologyVIDA9,
          coherenceAuditVIDA9a: confirmedBiologyVIDA9
            ? planetVida9aAudit(target,currentTarget,atmosphericFeedbackVIDA5,confirmedBiologyVIDA9)
            : undefined,
          observedHabitability: ObservedHabitabilityFiche31Fe.planet(
            target, systemModel.discoveryState, true,
            `G${systemModel.galaxyIndex}/S${systemModel.sectorKey}/O${systemModel.galacticObjectIndex}/B${bodyIndex}`,
            observedMultiplicity(systemModel),
          ) ?? undefined,
          sections:
            PlanetScientificSectionsAssembler
              .build(
                currentTarget,
                atmosphericFeedbackVIDA5,
              ),
          preview:
            ScientificBodyPreviewAssembler
              .planet(
                target,
                previewSceneResolver.build(systemModel),
                previewSceneResolver.planetBodyId?.(systemModel, bodyIndex),
              ),
        }),
    });
  }
}

function orbitTopologyLabel(
  topology:
    PlanetarySystemOrbitTopology,
): string {

  switch (
    topology
  ) {
    case PlanetarySystemOrbitTopology.CIRCUMSTELLAR:
      return 'Circumestelar';
    case PlanetarySystemOrbitTopology.CIRCUMBINARY:
      return 'Circumbinaria';
  }
}

function observedMultiplicity(model: ArchiveDiscoveryDetailModel): 'SINGLE' | 'BINARY' | 'TRIPLE' | 'UNKNOWN' {
  const name = model.stellarSystemCard?.render?.multiplicity?.name;
  return name === 'SINGLE' || name === 'BINARY' || name === 'TRIPLE' ? name : 'UNKNOWN';
}
