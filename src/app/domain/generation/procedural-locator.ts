const LONG_MIN =
  -(1n << 63n);

const LONG_MAX =
  (1n << 63n) - 1n;

export type ProceduralLocator =
  | GalaxyLocator
  | SectorLocator
  | GalacticObjectLocator
  | SystemLocator
  | BodyLocator
  | CivilizationLocator;

export class GalaxyLocator {
  constructor(
    readonly galaxyIndex:
      bigint,
  ) {
    requireNonNegativeLong(
      galaxyIndex,
      'galaxyIndex',
    );
  }
}

export class SectorLocator {
  constructor(
    readonly galaxyIndex:
      bigint,

    readonly sectorKey:
      bigint,
  ) {
    requireNonNegativeLong(
      galaxyIndex,
      'galaxyIndex',
    );

    requireLong(
      sectorKey,
      'sectorKey',
    );
  }
}

export class GalacticObjectLocator {
  constructor(
    readonly galaxyIndex:
      bigint,

    readonly sectorKey:
      bigint,

    readonly galacticObjectIndex:
      bigint,
  ) {
    requireNonNegativeLong(
      galaxyIndex,
      'galaxyIndex',
    );

    requireLong(
      sectorKey,
      'sectorKey',
    );

    requireNonNegativeLong(
      galacticObjectIndex,
      'galacticObjectIndex',
    );
  }
}

export class SystemLocator {
  constructor(
    readonly galaxyIndex:
      bigint,

    readonly sectorKey:
      bigint,

    readonly galacticObjectIndex:
      bigint,
  ) {
    requireNonNegativeLong(
      galaxyIndex,
      'galaxyIndex',
    );

    requireLong(
      sectorKey,
      'sectorKey',
    );

    requireNonNegativeLong(
      galacticObjectIndex,
      'galacticObjectIndex',
    );
  }
}

export class BodyLocator {
  constructor(
    readonly galaxyIndex:
      bigint,

    readonly sectorKey:
      bigint,

    readonly galacticObjectIndex:
      bigint,

    readonly bodyIndex:
      bigint,
  ) {
    requireNonNegativeLong(
      galaxyIndex,
      'galaxyIndex',
    );

    requireLong(
      sectorKey,
      'sectorKey',
    );

    requireNonNegativeLong(
      galacticObjectIndex,
      'galacticObjectIndex',
    );

    requireNonNegativeLong(
      bodyIndex,
      'bodyIndex',
    );
  }
}

export class CivilizationLocator {
  constructor(
    readonly galaxyIndex:
      bigint,

    readonly sectorKey:
      bigint,

    readonly galacticObjectIndex:
      bigint,

    readonly bodyIndex:
      bigint,

    readonly civilizationIndex:
      bigint,
  ) {
    requireNonNegativeLong(
      galaxyIndex,
      'galaxyIndex',
    );

    requireLong(
      sectorKey,
      'sectorKey',
    );

    requireNonNegativeLong(
      galacticObjectIndex,
      'galacticObjectIndex',
    );

    requireNonNegativeLong(
      bodyIndex,
      'bodyIndex',
    );

    requireNonNegativeLong(
      civilizationIndex,
      'civilizationIndex',
    );
  }
}

function requireLong(
  value: bigint,
  name: string,
): void {
  if (
    typeof value !==
      'bigint' ||
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