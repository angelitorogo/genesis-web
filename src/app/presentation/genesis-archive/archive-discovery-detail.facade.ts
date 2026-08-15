import {
  computed,
  inject,
  Injectable,
  signal,
} from '@angular/core';

import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  ExplorationResultKind,
  type ExplorationLocatedResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  GalacticObjectLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxySectorKeyCodec,
} from '../../domain/sector/galaxy-sector-key-codec';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ExplorationSectorResultEngine,
} from '../../simulation/exploration/exploration-sector-result-engine';

import {
  GENESIS_LOCAL_REPOSITORIES,
} from '../runtime/genesis-local-repositories';

import {
  UniverseSeedFacade,
} from '../universe/universe-seed.facade';

const SIGNED_LONG_MIN =
  -(1n << 63n);

const SIGNED_LONG_MAX =
  (1n << 63n) -
  1n;

export const ArchiveDiscoveryLocatorKind =
  Object.freeze({
    SYSTEM:
      'system',

    GALACTIC_OBJECT:
      'galactic-object',
  } as const);

export type ArchiveDiscoveryLocatorKind =
  typeof ArchiveDiscoveryLocatorKind[
    keyof typeof ArchiveDiscoveryLocatorKind
  ];

export interface ArchiveDiscoveryDetailRequest {
  readonly locatorKind:
    string | null;

  readonly galaxyIndex:
    string | null;

  readonly sectorKey:
    string | null;

  readonly galacticObjectIndex:
    string | null;

  readonly universeSeed:
    string | null;

  readonly generatorVersionCode:
    string | null;
}

export interface ArchiveDiscoveryDetailModel {
  readonly universeSeed:
    string;

  readonly generatorVersionCode:
    number;

  readonly locatorKind:
    ArchiveDiscoveryLocatorKind;

  readonly locatorKindLabel:
    string;

  readonly resultKind:
    ExplorationLocatedResultKind;

  readonly familyLabel:
    string;

  readonly discoveryState:
    DiscoveryStateValue;

  readonly discoveryStateLabel:
    string;

  readonly galaxyIndex:
    bigint;

  readonly sectorKey:
    bigint;

  readonly sectorX:
    number;

  readonly sectorY:
    number;

  readonly galacticObjectIndex:
    bigint;

  readonly proceduralIdentity:
    string;
}

export type ArchiveDiscoveryDetailUiState =
  | {
      readonly kind:
        'loading';
    }
  | {
      readonly kind:
        'content';

      readonly model:
        ArchiveDiscoveryDetailModel;
    }
  | {
      readonly kind:
        'not-found';
    }
  | {
      readonly kind:
        'error';

      readonly message:
        string;
    };

@Injectable({
  providedIn:
    'root',
})
export class ArchiveDiscoveryDetailFacade {

  private readonly repositories =
    inject(
      GENESIS_LOCAL_REPOSITORIES,
    );

  private readonly universeSeedFacade =
    inject(
      UniverseSeedFacade,
    );

  private readonly stateSignal =
    signal<ArchiveDiscoveryDetailUiState>({
      kind:
        'loading',
    });

  readonly state =
    this
      .stateSignal
      .asReadonly();

  readonly model =
    computed<ArchiveDiscoveryDetailModel | null>(
      () => {
        const state =
          this.state();

        return state.kind ===
          'content'
          ? state.model
          : null;
      },
    );

  readonly errorMessage =
    computed<string>(
      () => {
        const state =
          this.state();

        return state.kind ===
          'error'
          ? state.message
          : '';
      },
    );

  async load(
    request:
      ArchiveDiscoveryDetailRequest,
  ): Promise<void> {

    this
      .stateSignal
      .set({
        kind:
          'loading',
      });

    try {
      const parsed =
        parseRequest(
          request,
        );

      const universes =
        await this
          .repositories
          .universeRepository
          .getAll();

      const generationKey =
        resolveGenerationKey(
          parsed,
          this
            .universeSeedFacade
            .activeGenerationKey(),
          universes,
        );

      if (
        generationKey ===
          null
      ) {
        this
          .stateSignal
          .set({
            kind:
              'not-found',
          });

        return;
      }

      const locator =
        createLocator(
          parsed,
        );

      const discoveryState =
        await this
          .repositories
          .discoveryRepository
          .getState(
            generationKey,
            locator,
          );

      if (
        !DiscoveryState.isKnown(
          discoveryState,
        )
      ) {
        this
          .stateSignal
          .set({
            kind:
              'not-found',
          });

        return;
      }

      const resultKind =
        resolveResultKind(
          generationKey,
          locator,
        );

      const coordinates =
        GalaxySectorKeyCodec
          .decode(
            parsed.sectorKey,
          );

      this
        .stateSignal
        .set({
          kind:
            'content',

          model:
            Object.freeze({
              universeSeed:
                generationKey
                  .universeSeed
                  .serialize(),

              generatorVersionCode:
                generationKey
                  .generatorVersion
                  .code,

              locatorKind:
                parsed.locatorKind,

              locatorKindLabel:
                parsed.locatorKind ===
                  ArchiveDiscoveryLocatorKind.SYSTEM
                  ? 'SystemLocator'
                  : 'GalacticObjectLocator',

              resultKind,

              familyLabel:
                familyLabel(
                  resultKind,
                ),

              discoveryState:
                DiscoveryState
                  .fromCode(
                    discoveryState.code,
                  ),

              discoveryStateLabel:
                stateLabel(
                  discoveryState,
                ),

              galaxyIndex:
                parsed.galaxyIndex,

              sectorKey:
                parsed.sectorKey,

              sectorX:
                coordinates.x,

              sectorY:
                coordinates.y,

              galacticObjectIndex:
                parsed
                  .galacticObjectIndex,

              proceduralIdentity:
                [
                  `G${parsed.galaxyIndex.toString(10)}`,
                  `S${parsed.sectorKey.toString(10)}`,
                  `O${parsed.galacticObjectIndex.toString(10)}`,
                ].join(
                  ' / ',
                ),
            }),
        });
    } catch (
      error
    ) {
      this
        .stateSignal
        .set({
          kind:
            'error',

          message:
            error instanceof
              Error
              ? error.message
              : 'No se pudo resolver la ficha del descubrimiento.',
        });
    }
  }
}

interface ParsedArchiveDiscoveryDetailRequest {
  readonly locatorKind:
    ArchiveDiscoveryLocatorKind;

  readonly galaxyIndex:
    bigint;

  readonly sectorKey:
    bigint;

  readonly galacticObjectIndex:
    bigint;

  readonly universeSeed:
    string | null;

  readonly generatorVersionCode:
    number | null;
}

function parseRequest(
  request:
    ArchiveDiscoveryDetailRequest,
): ParsedArchiveDiscoveryDetailRequest {

  if (
    request.locatorKind !==
      ArchiveDiscoveryLocatorKind.SYSTEM &&
    request.locatorKind !==
      ArchiveDiscoveryLocatorKind.GALACTIC_OBJECT
  ) {
    throw new RangeError(
      'Tipo de marcador de archivo no soportado.',
    );
  }

  return {
    locatorKind:
      request.locatorKind,

    galaxyIndex:
      parseNonNegativeLong(
        request.galaxyIndex,
        'galaxyIndex',
      ),

    sectorKey:
      parseSignedLong(
        request.sectorKey,
        'sectorKey',
      ),

    galacticObjectIndex:
      parseNonNegativeLong(
        request.galacticObjectIndex,
        'galacticObjectIndex',
      ),

    ...parseGenerationIdentity(
      request.universeSeed,
      request.generatorVersionCode,
    ),
  };
}

function createLocator(
  request:
    ParsedArchiveDiscoveryDetailRequest,
): SystemLocator | GalacticObjectLocator {

  if (
    request.locatorKind ===
      ArchiveDiscoveryLocatorKind.SYSTEM
  ) {
    return new SystemLocator(
      request.galaxyIndex,
      request.sectorKey,
      request.galacticObjectIndex,
    );
  }

  return new GalacticObjectLocator(
    request.galaxyIndex,
    request.sectorKey,
    request.galacticObjectIndex,
  );
}

function resolveResultKind(
  generationKey:
    UniverseGenerationKey,

  locator:
    SystemLocator | GalacticObjectLocator,
): ExplorationLocatedResultKind {

  if (
    locator instanceof
      SystemLocator
  ) {
    return ExplorationResultKind
      .SYSTEM;
  }

  return ExplorationSectorResultEngine
    .resolveGalacticObjectKind(
      generationKey,
      locator,
    );
}

function familyLabel(
  resultKind:
    ExplorationLocatedResultKind,
): string {

  switch (
    resultKind
  ) {
    case ExplorationResultKind.SYSTEM:
      return 'Sistema';

    case ExplorationResultKind.NEBULA:
      return 'Nebulosa';

    case ExplorationResultKind.STAR_CLUSTER:
      return 'Cúmulo estelar';

    case ExplorationResultKind.EXTREME_OBJECT:
      return 'Objeto extremo';
  }

  throw new RangeError(
    `Familia operacional no soportada: ${String(resultKind)}.`,
  );
}

function stateLabel(
  state:
    DiscoveryStateValue,
): string {

  const canonical =
    DiscoveryState
      .fromCode(
        state.code,
      );

  if (
    canonical ===
      DiscoveryState.DETECTED
  ) {
    return 'Detectado';
  }

  if (
    canonical ===
      DiscoveryState.DISCOVERED
  ) {
    return 'Descubierto';
  }

  if (
    canonical ===
      DiscoveryState.VISITED
  ) {
    return 'Visitado';
  }

  if (
    canonical ===
      DiscoveryState.CATALOGUED
  ) {
    return 'Catalogado';
  }

  if (
    canonical ===
      DiscoveryState.CONFIRMED
  ) {
    return 'Confirmado';
  }

  return 'Desconocido';
}

function parseNonNegativeLong(
  raw:
    string | null,

  propertyName:
    string,
): bigint {

  const value =
    parseSignedLong(
      raw,
      propertyName,
    );

  if (
    value <
      0n
  ) {
    throw new RangeError(
      `${propertyName} debe ser un Long no negativo.`,
    );
  }

  return value;
}

function parseSignedLong(
  raw:
    string | null,

  propertyName:
    string,
): bigint {

  if (
    raw ===
      null ||
    !/^-?\d+$/.test(
      raw,
    )
  ) {
    throw new RangeError(
      `${propertyName} debe ser un entero decimal válido.`,
    );
  }

  const value =
    BigInt(
      raw,
    );

  if (
    value <
      SIGNED_LONG_MIN ||
    value >
      SIGNED_LONG_MAX
  ) {
    throw new RangeError(
      `${propertyName} debe pertenecer al rango Long de 64 bits.`,
    );
  }

  return value;
}

function parseGenerationIdentity(
  universeSeed:
    string | null,

  generatorVersionCode:
    string | null,
): {
  readonly universeSeed:
    string | null;

  readonly generatorVersionCode:
    number | null;
} {

  if (
    universeSeed ===
      null &&
    generatorVersionCode ===
      null
  ) {
    return {
      universeSeed:
        null,

      generatorVersionCode:
        null,
    };
  }

  if (
    universeSeed ===
      null ||
    generatorVersionCode ===
      null
  ) {
    throw new RangeError(
      'La identidad de universo de la ficha requiere seed y versión de generador.',
    );
  }

  if (
    !UniverseSeed.isValid(
      universeSeed,
    )
  ) {
    throw new RangeError(
      'La seed de universo de la ficha no tiene un formato válido.',
    );
  }

  if (
    !/^\d+$/.test(
      generatorVersionCode,
    )
  ) {
    throw new RangeError(
      'generatorVersionCode debe ser un entero decimal válido.',
    );
  }

  const versionCode =
    Number(
      generatorVersionCode,
    );

  if (
    !Number.isSafeInteger(
      versionCode,
    ) ||
    versionCode <=
      0
  ) {
    throw new RangeError(
      'generatorVersionCode debe ser un entero positivo seguro.',
    );
  }

  return {
    universeSeed:
      UniverseSeed
        .parse(
          universeSeed,
        )
        .serialize(),

    generatorVersionCode:
      versionCode,
  };
}

function resolveGenerationKey(
  request:
    ParsedArchiveDiscoveryDetailRequest,

  selectedGenerationKey:
    UniverseGenerationKey,

  persistedUniverses:
    readonly UniverseGenerationKey[],
): UniverseGenerationKey | null {

  if (
    request.universeSeed !==
      null &&
    request.generatorVersionCode !==
      null
  ) {
    return persistedUniverses
      .find(
        (
          candidate,
        ) =>
          candidate
            .universeSeed
            .serialize() ===
            request.universeSeed &&
          candidate
            .generatorVersion
            .code ===
            request.generatorVersionCode,
      ) ??
      null;
  }

  const selected =
    persistedUniverses
      .find(
        (
          candidate,
        ) =>
          sameGenerationKey(
            candidate,
            selectedGenerationKey,
          ),
      );

  if (
    selected !==
      undefined
  ) {
    return selected;
  }

  if (
    persistedUniverses.length ===
      1
  ) {
    return persistedUniverses[
      0
    ];
  }

  return null;
}

function sameGenerationKey(
  left:
    UniverseGenerationKey,

  right:
    UniverseGenerationKey,
): boolean {

  return (
    left
      .generatorVersion
      .code ===
      right
        .generatorVersion
        .code &&
    left
      .universeSeed
      .serialize() ===
      right
        .universeSeed
        .serialize()
  );
}
