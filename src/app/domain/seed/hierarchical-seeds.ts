import {
  GenesisSeed,
} from './genesis-seed';

const NORMALIZED_SEED_PATTERN =
  /^[0-9A-F]{32}$/;

abstract class DerivedSeed
  implements GenesisSeed {

  private readonly normalized:
    string;

  protected constructor(
    value: string,
  ) {
    const normalized =
      value
        .replaceAll(
          '-',
          '',
        )
        .toUpperCase();

    if (
      !NORMALIZED_SEED_PATTERN.test(
        normalized,
      )
    ) {
      throw new RangeError(
        `Seed procedural inválida: "${value}".`,
      );
    }

    this.normalized =
      normalized;
  }

  get normalizedValue():
    string {
    return this.normalized;
  }

  equals(
    other: GenesisSeed,
  ): boolean {
    return (
      this.normalizedValue ===
      other.normalizedValue
    );
  }

  toString():
    string {
    return (
      this.normalized
        .match(/.{4}/g)
        ?.join('-') ??
      ''
    );
  }
}

export class GalaxySeed
  extends DerivedSeed {

  readonly kind =
    'galaxy' as const;

  constructor(
    value: string,
  ) {
    super(value);
  }
}

export class SectorSeed
  extends DerivedSeed {

  readonly kind =
    'sector' as const;

  constructor(
    value: string,
  ) {
    super(value);
  }
}

export class GalacticObjectSeed
  extends DerivedSeed {

  readonly kind =
    'galactic-object' as const;

  constructor(
    value: string,
  ) {
    super(value);
  }
}

export class SystemSeed
  extends DerivedSeed {

  readonly kind =
    'system' as const;

  constructor(
    value: string,
  ) {
    super(value);
  }
}

export class BodySeed
  extends DerivedSeed {

  readonly kind =
    'body' as const;

  constructor(
    value: string,
  ) {
    super(value);
  }
}

export class MoonSeed
  extends DerivedSeed {

  readonly kind =
    'moon' as const;

  constructor(
    value: string,
  ) {
    super(value);
  }
}

export class HistorySeed
  extends DerivedSeed {

  readonly kind =
    'history' as const;

  constructor(
    value: string,
  ) {
    super(value);
  }
}

export class EvolutionSeed
  extends DerivedSeed {

  readonly kind =
    'evolution' as const;

  constructor(
    value: string,
  ) {
    super(value);
  }
}

export class CivilizationSeed
  extends DerivedSeed {

  readonly kind =
    'civilization' as const;

  constructor(
    value: string,
  ) {
    super(value);
  }
}