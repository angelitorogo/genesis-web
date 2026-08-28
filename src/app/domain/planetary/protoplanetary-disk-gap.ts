import {
  ProtoplanetaryDiskGapKind,
} from './protoplanetary-disk-gap-kind';

/**
 * Point-17.3 axisymmetric annular depletion inside the point-17.2 disk.
 *
 * Gas and dust depletion are stored separately because drift/settling can make
 * a dust gap visually/depositionally deeper than the corresponding gas gap.
 */
export class ProtoplanetaryDiskGap {

  constructor(
    readonly kind:
      ProtoplanetaryDiskGapKind,

    readonly innerRadiusAu:
      number,

    readonly outerRadiusAu:
      number,

    readonly gasDepletionFraction01:
      number,

    readonly dustDepletionFraction01:
      number,
  ) {
    assertPositiveFinite(
      innerRadiusAu,
      'innerRadiusAu',
    );

    assertPositiveFinite(
      outerRadiusAu,
      'outerRadiusAu',
    );

    if (
      outerRadiusAu <=
      innerRadiusAu
    ) {
      throw new RangeError(
        'A protoplanetary-disk gap must satisfy innerRadiusAu < outerRadiusAu.',
      );
    }

    assertNormalized(
      gasDepletionFraction01,
      'gasDepletionFraction01',
    );

    assertNormalized(
      dustDepletionFraction01,
      'dustDepletionFraction01',
    );

    if (
      gasDepletionFraction01 ===
        0 &&
      dustDepletionFraction01 ===
        0
    ) {
      throw new RangeError(
        'A protoplanetary-disk gap must deplete gas, dust or both.',
      );
    }
  }

  get centerRadiusAu():
    number {

    return (
      (
        this.innerRadiusAu +
        this.outerRadiusAu
      ) /
      2
    );
  }

  get widthAu():
    number {

    return (
      this.outerRadiusAu -
      this.innerRadiusAu
    );
  }
}

function assertPositiveFinite(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and greater than 0: ${value}.`,
    );
  }
}

function assertNormalized(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0 ||
    value >
      1
  ) {
    throw new RangeError(
      `${propertyName} must be finite and in range [0, 1]: ${value}.`,
    );
  }
}
