import {
  sha256,
} from '@noble/hashes/sha2.js';

import {
  bytesToHex,
  hexToBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

import {
  GenesisSeed,
} from '../../domain/seed/genesis-seed';

import {
  BodySeed,
  CivilizationSeed,
  EvolutionSeed,
  GalacticObjectSeed,
  GalaxySeed,
  HistorySeed,
  MoonSeed,
  SectorSeed,
  SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

const MAGIC_BYTES =
  utf8ToBytes(
    'GENESIS-SEED-DERIVE-V1',
  );

const TAG_GALAXY =
  0x01;

const TAG_SECTOR =
  0x02;

const TAG_GALACTIC_OBJECT =
  0x03;

const TAG_SYSTEM =
  0x04;

const TAG_BODY =
  0x05;

const TAG_HISTORY =
  0x06;

const TAG_EVOLUTION =
  0x07;

const TAG_CIVILIZATION =
  0x08;

// Point 21.8 appends a new tag without renumbering any frozen V1 seed domain.
const TAG_MOON =
  0x09;

const LONG_MIN =
  -(1n << 63n);

const LONG_MAX =
  (1n << 63n) - 1n;

export const SeedDeriver = {
  galaxy(
    parent: UniverseSeed,
    galaxyIndex: bigint,
  ): GalaxySeed {
    requireNonNegativeLong(
      galaxyIndex,
      'galaxyIndex',
    );

    return new GalaxySeed(
      deriveHex(
        parent,
        TAG_GALAXY,
        galaxyIndex,
      ),
    );
  },

  sector(
    parent: GalaxySeed,
    sectorKey: bigint,
  ): SectorSeed {
    requireLong(
      sectorKey,
      'sectorKey',
    );

    return new SectorSeed(
      deriveHex(
        parent,
        TAG_SECTOR,
        sectorKey,
      ),
    );
  },

  galacticObject(
    parent: SectorSeed,
    objectIndex: bigint,
  ): GalacticObjectSeed {
    requireNonNegativeLong(
      objectIndex,
      'objectIndex',
    );

    return new GalacticObjectSeed(
      deriveHex(
        parent,
        TAG_GALACTIC_OBJECT,
        objectIndex,
      ),
    );
  },

  system(
    parent: GalacticObjectSeed,
  ): SystemSeed {
    return new SystemSeed(
      deriveHex(
        parent,
        TAG_SYSTEM,
        0n,
      ),
    );
  },

  body(
    parent: SystemSeed,
    bodyIndex: bigint,
  ): BodySeed {
    requireNonNegativeLong(
      bodyIndex,
      'bodyIndex',
    );

    return new BodySeed(
      deriveHex(
        parent,
        TAG_BODY,
        bodyIndex,
      ),
    );
  },

  moon(
    parent: BodySeed,
    moonIndex: bigint,
  ): MoonSeed {
    requireNonNegativeLong(
      moonIndex,
      'moonIndex',
    );

    return new MoonSeed(
      deriveHex(
        parent,
        TAG_MOON,
        moonIndex,
      ),
    );
  },

  history(
    parent: BodySeed,
  ): HistorySeed {
    return new HistorySeed(
      deriveHex(
        parent,
        TAG_HISTORY,
        0n,
      ),
    );
  },

  evolution(
    parent: HistorySeed,
  ): EvolutionSeed {
    return new EvolutionSeed(
      deriveHex(
        parent,
        TAG_EVOLUTION,
        0n,
      ),
    );
  },

  civilization(
    parent: EvolutionSeed,
    civilizationIndex: bigint,
  ): CivilizationSeed {
    requireNonNegativeLong(
      civilizationIndex,
      'civilizationIndex',
    );

    return new CivilizationSeed(
      deriveHex(
        parent,
        TAG_CIVILIZATION,
        civilizationIndex,
      ),
    );
  },
} as const;

function deriveHex(
  parent: GenesisSeed,
  domainTag: number,
  key: bigint,
): string {
  requireLong(
    key,
    'key',
  );

  const digest =
    sha256
      .create()
      .update(
        MAGIC_BYTES,
      )
      .update(
        hexToBytes(
          parent.normalizedValue,
        ),
      )
      .update(
        Uint8Array.of(
          domainTag,
        ),
      )
      .update(
        longToBigEndianBytes(
          key,
        ),
      )
      .digest();

  return bytesToHex(
    digest.slice(
      0,
      16,
    ),
  ).toUpperCase();
}

function longToBigEndianBytes(
  value: bigint,
): Uint8Array {
  requireLong(
    value,
    'value',
  );

  let unsigned =
    BigInt.asUintN(
      64,
      value,
    );

  const bytes =
    new Uint8Array(8);

  for (
    let index = 7;
    index >= 0;
    index -= 1
  ) {
    bytes[index] =
      Number(
        unsigned &
          0xFFn,
      );

    unsigned >>=
      8n;
  }

  return bytes;
}

function requireLong(
  value: bigint,
  name: string,
): void {
  if (
    value < LONG_MIN ||
    value > LONG_MAX
  ) {
    throw new RangeError(
      `${name} debe pertenecer al rango Long de 64 bits.`,
    );
  }
}

function requireNonNegativeLong(
  value: bigint,
  name: string,
): void {
  requireLong(
    value,
    name,
  );

  if (
    value < 0n
  ) {
    throw new RangeError(
      `${name} debe ser no negativo: ${value}.`,
    );
  }
}