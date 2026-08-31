import {
  ArchiveDiscoveryLocatorKind,
  type ArchiveDiscoveryDetailModel,
} from '../genesis-archive/archive-discovery-detail.facade';

import {
  type ArchiveStellarSystemKnowledgeLevel,
} from '../genesis-archive/archive-stellar-system-card';

export interface SystemSceneAddress {
  readonly galaxyIndex:
    string;

  readonly sectorKey:
    string;

  readonly galacticObjectIndex:
    string;
}

/**
 * Point-24.1 presentation snapshot accepted by SystemScene.
 *
 * This is deliberately not a physics model. The snapshot only carries stable
 * identity/knowledge metadata required to establish the scene boundary. Point
 * 24.2+ may extend the snapshot with already-computed domain/simulation
 * projections, but Three.js must never derive authoritative stellar, planetary
 * or orbital physics from renderer state.
 */
export interface SystemSceneSnapshot {
  readonly universeSeed:
    string;

  readonly generatorVersionCode:
    number;

  readonly address:
    SystemSceneAddress;

  readonly proceduralIdentity:
    string;

  readonly title:
    string;

  readonly discoveryStateCode:
    number;

  readonly discoveryStateLabel:
    string;

  readonly knowledgeLevel:
    ArchiveStellarSystemKnowledgeLevel;

  readonly multiplicityName:
    string | null;

  readonly componentCount:
    number | null;

  readonly accessibleLabel:
    string;
}

export class SystemSceneSnapshotBuilder {

  private constructor() {}

  static build(
    model:
      ArchiveDiscoveryDetailModel,
  ): SystemSceneSnapshot {

    if (
      model.locatorKind !==
        ArchiveDiscoveryLocatorKind.SYSTEM ||
      model.stellarSystemCard ===
        null
    ) {
      throw new RangeError(
        'Point-24.1 SystemSceneSnapshot requires one resolved stellar-system Archive model.',
      );
    }

    const systemCard =
      model.stellarSystemCard;

    return Object.freeze({
      universeSeed:
        model.universeSeed,

      generatorVersionCode:
        model.generatorVersionCode,

      address:
        Object.freeze({
          galaxyIndex:
            model.galaxyIndex.toString(),

          sectorKey:
            model.sectorKey.toString(),

          galacticObjectIndex:
            model.galacticObjectIndex.toString(),
        }),

      proceduralIdentity:
        model.proceduralIdentity,

      title:
        systemCard.title,

      discoveryStateCode:
        model.discoveryState.code,

      discoveryStateLabel:
        model.discoveryStateLabel,

      knowledgeLevel:
        systemCard.knowledgeLevel,

      multiplicityName:
        systemCard
          .render
          .multiplicity
          ?.name ??
        null,

      componentCount:
        systemCard.componentCount,

      accessibleLabel:
        `Escena tridimensional del sistema estelar ${systemCard.title}.`,
    });
  }
}
