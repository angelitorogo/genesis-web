import { KilonovaType, type KilonovaType as KilonovaTypeValue } from './kilonova-type';

export class KilonovaProgenitorProfile {
  constructor(
    readonly type: KilonovaTypeValue,
    readonly primaryMassSolar: number,
    readonly secondaryMassSolar: number,
    readonly neutronStarRadiusKm: number,
    readonly orbitalSemiMajorAxisAu: number,
    readonly orbitalEccentricity: number,
    readonly referenceInspiralYears: number,
    readonly blackHoleSpinDimensionless: number | null,
    readonly tidalDisruptionRatio: number | null,
  ) {
    assertRange(primaryMassSolar, 1.0, 80, 'primaryMassSolar');
    assertRange(secondaryMassSolar, 1.0, 80, 'secondaryMassSolar');
    assertRange(neutronStarRadiusKm, 9, 15.5, 'neutronStarRadiusKm');
    assertRange(orbitalSemiMajorAxisAu, 1e-7, 1e5, 'orbitalSemiMajorAxisAu');
    assertRange(orbitalEccentricity, 0, 0.999999, 'orbitalEccentricity');
    assertRange(referenceInspiralYears, 1e-9, 1e20, 'referenceInspiralYears');

    if (type === KilonovaType.BINARY_NEUTRON_STAR) {
      assertRange(primaryMassSolar, 1.1, 2.2, 'NS-NS primaryMassSolar');
      assertRange(secondaryMassSolar, 1.1, 2.2, 'NS-NS secondaryMassSolar');
      if (blackHoleSpinDimensionless !== null || tidalDisruptionRatio !== null) {
        throw new RangeError('NS-NS kilonova progenitors cannot carry black-hole disruption parameters.');
      }
      return;
    }

    const masses = [primaryMassSolar, secondaryMassSolar];
    const neutronMasses = masses.filter(mass => mass >= 1.1 && mass <= 2.2);
    const blackHoleMasses = masses.filter(mass => mass >= 3.05);
    if (neutronMasses.length !== 1 || blackHoleMasses.length !== 1) {
      throw new RangeError('NS-BH kilonova progenitors require exactly one neutron star and one stellar black hole.');
    }
    if (blackHoleSpinDimensionless === null || tidalDisruptionRatio === null) {
      throw new RangeError('Resolved NS-BH kilonova progenitors require explicit BH spin and tidal-disruption ratio.');
    }
    assertRange(blackHoleSpinDimensionless, -0.98, 0.98, 'blackHoleSpinDimensionless');
    if (!Number.isFinite(tidalDisruptionRatio) || tidalDisruptionRatio <= 1 || tidalDisruptionRatio > 100) {
      throw new RangeError('Resolved NS-BH kilonova progenitors require tidal disruption outside the ISCO.');
    }
  }
}

function assertRange(value: number, min: number, max: number, name: string): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${name} must be finite and in [${min}, ${max}].`);
  }
}
