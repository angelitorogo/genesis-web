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
  type PlanetScientificIdentitySource,
} from '../../simulation/planetary/planet-scientific-target-resolver';

import {
  ArchiveDiscoveryLocatorKind,
  type ArchiveDiscoveryDetailModel,
} from '../genesis-archive/archive-discovery-detail.facade';

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

  readonly nextScientificStep:
    string;

  readonly locatorLabel:
    string;
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

export interface PlanetScientificIdentityResolver {
  resolve(
    generationKey:
      UniverseGenerationKey,

    locator:
      BodyLocator,
  ): PlanetScientificIdentitySource | null;
}

const DEFAULT_IDENTITY_RESOLVER:
  PlanetScientificIdentityResolver =
  Object.freeze({
    resolve(
      generationKey:
        UniverseGenerationKey,

      locator:
        BodyLocator,
    ): PlanetScientificIdentitySource | null {
      return PlanetScientificTargetResolver
        .resolve(
          generationKey,
          locator,
        );
    },
  });

/**
 * Point-26.3 state-safe planet fiche assembler.
 *
 * The host system must already be CONFIRMED before any procedural planet
 * identity is materialized. Even then, 26.3 exposes only the identity/context
 * layer inherited from the confirmed system. Phase-19 physical Ground Truth and
 * all phase-20/21 environment data remain outside this model until 26.4 defines
 * their own scientific disclosure.
 */
export class PlanetScientificCardAssembler {

  private constructor() {}

  static build(
    systemModel:
      ArchiveDiscoveryDetailModel,

    bodyIndex:
      bigint,

    resolver:
      PlanetScientificIdentityResolver =
        DEFAULT_IDENTITY_RESOLVER,
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
          'La investigación individual de cuerpos requiere que el sistema anfitrión esté CONFIRMED.',
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

    const identity =
      resolver.resolve(
        generationKey,
        locator,
      );

    if (
      identity ===
        null
    ) {
      return Object.freeze({
        kind:
          PlanetScientificFicheResolutionKind.NOT_FOUND,
        reason:
          'El índice solicitado no corresponde a un planeta maduro de este sistema.',
      });
    }

    return Object.freeze({
      kind:
        PlanetScientificFicheResolutionKind.AVAILABLE,
      card:
        Object.freeze({
          title:
            identity.designation,
          summary:
            `${identity.designation} es el planeta ${identity.planetOrdinal} del sistema confirmado ${identity.hostSystemDesignation}. La confirmación del sistema habilita su investigación individual, pero no confirma automáticamente las propiedades científicas del planeta.`,
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
            'Investigación individual habilitada',
          planetaryKnowledgeLabel:
            'Ficha base · sin campaña planetaria propia todavía',
          nextScientificStep:
            '26.4 · General / Órbita / Superficie / Atmósfera / Clima / Geología / Lunas',
          locatorLabel:
            `G${systemModel.galaxyIndex.toString()} / S${systemModel.sectorKey.toString()} / O${systemModel.galacticObjectIndex.toString()} / B${bodyIndex.toString()}`,
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
