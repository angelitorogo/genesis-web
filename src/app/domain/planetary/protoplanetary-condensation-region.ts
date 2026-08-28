import {
  ProtoplanetaryCondensationRegionKind,
} from './protoplanetary-condensation-region-kind';

/**
 * Point-17.3 contiguous radial interval sharing one coarse condensation regime.
 */
export class ProtoplanetaryCondensationRegion {

  constructor(
    readonly kind:
      ProtoplanetaryCondensationRegionKind,

    readonly innerRadiusAu:
      number,

    readonly outerRadiusAu:
      number,

    readonly innerEdgeTemperatureKelvin:
      number,

    readonly outerEdgeTemperatureKelvin:
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
        'A condensation region must satisfy innerRadiusAu < outerRadiusAu.',
      );
    }

    assertPositiveFinite(
      innerEdgeTemperatureKelvin,
      'innerEdgeTemperatureKelvin',
    );

    assertPositiveFinite(
      outerEdgeTemperatureKelvin,
      'outerEdgeTemperatureKelvin',
    );

    if (
      innerEdgeTemperatureKelvin <
      outerEdgeTemperatureKelvin
    ) {
      throw new RangeError(
        'Condensation-region temperature must not increase radially outward in V1.',
      );
    }
  }

  get condensableSolidFraction01():
    number {

    return (
      this.kind
        .condensableSolidFraction01
    );
  }

  get geometricMidpointRadiusAu():
    number {

    return Math.sqrt(
      this.innerRadiusAu *
      this.outerRadiusAu,
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
