import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
  hexToBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

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
  GalaxySectorObjectLocation,
} from '../../domain/sector/galaxy-sector-object-location';

import {
  ProceduralTargetResolver,
} from '../regeneration/procedural-target-resolver';

const V1_PLACEMENT_DOMAIN =
  utf8ToBytes(
    'GENESIS-SECTOR-PLACEMENT-V1',
  );

const UINT32_SCALE =
  4294967296;

type PlaceableSectorObjectLocator =
  SystemLocator |
  GalacticObjectLocator;

/**
 * Stateless deterministic resolver for local object placement.
 *
 * Placement is derived exclusively from procedural identity.
 *
 * It does not:
 *
 * - consume GenesisRandom draws;
 * - mutate sector generation;
 * - persist normalized coordinates;
 * - depend on query order;
 * - maintain caches.
 */
export class GalaxySectorObjectLocationResolver {

  private constructor() {}

  static resolve(
    generationKey:
      UniverseGenerationKey,

    locator:
      SystemLocator,
  ): GalaxySectorObjectLocation;

  static resolve(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,
  ): GalaxySectorObjectLocation;

  static resolve(
    generationKey:
      UniverseGenerationKey,

    locator:
      PlaceableSectorObjectLocator,
  ): GalaxySectorObjectLocation {

    if (
      !(
        locator instanceof
        SystemLocator
      ) &&
      !(
        locator instanceof
        GalacticObjectLocator
      )
    ) {
      throw new TypeError(
        'GalaxySectorObjectLocationResolver supports only SystemLocator and GalacticObjectLocator.',
      );
    }

    switch (
      generationKey
        .generatorVersion
        .name
    ) {
      case 'V1':
        return resolveV1(
          generationKey,
          locator,
        );
    }
  }
}

function resolveV1(
  generationKey:
    UniverseGenerationKey,

  locator:
    PlaceableSectorObjectLocator,
): GalaxySectorObjectLocation {

  const targetSeed =
    ProceduralTargetResolver
      .resolveTargetSeed(
        generationKey,
        locator,
      );

  const seedBytes =
    hexToBytes(
      targetSeed
        .normalizedValue,
    );

  const digest =
    sha256
      .create()
      .update(
        V1_PLACEMENT_DOMAIN,
      )
      .update(
        seedBytes,
      )
      .digest();

  const xRaw =
    readUint32BigEndian(
      digest,
      0,
    );

  const yRaw =
    readUint32BigEndian(
      digest,
      4,
    );

  return new GalaxySectorObjectLocation(
    GalaxySectorKeyCodec
      .decode(
        locator.sectorKey,
      ),

    xRaw /
      UINT32_SCALE,

    yRaw /
      UINT32_SCALE,
  );
}

function readUint32BigEndian(
  bytes:
    Uint8Array,

  offset:
    number,
): number {

  return (
    bytes[offset] *
      0x1000000 +
    bytes[
      offset +
      1
    ] *
      0x10000 +
    bytes[
      offset +
      2
    ] *
      0x100 +
    bytes[
      offset +
      3
    ]
  );
}