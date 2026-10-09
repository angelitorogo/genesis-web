import { CompactMergerType, type CompactMergerType as CompactMergerTypeValue } from './compact-merger-type';

export class CompactMergerProgenitorProfile {
  constructor(
    readonly type: CompactMergerTypeValue,
    readonly primaryMassSolar: number,
    readonly secondaryMassSolar: number,
    readonly neutronStarReferenceRadiusKm: number | null,
    readonly orbitalSemiMajorAxisAu: number,
    readonly orbitalEccentricity: number,
    readonly referenceInspiralYears: number,
  ) {
    assertRange(primaryMassSolar, 1.0, 120, 'primaryMassSolar');
    assertRange(secondaryMassSolar, 1.0, 120, 'secondaryMassSolar');
    assertRange(orbitalSemiMajorAxisAu, 1e-8, 1e5, 'orbitalSemiMajorAxisAu');
    assertRange(orbitalEccentricity, 0, 0.999999, 'orbitalEccentricity');
    assertRange(referenceInspiralYears, 1e-9, 13.8e9, 'referenceInspiralYears');

    const masses = [primaryMassSolar, secondaryMassSolar];
    const nsCount = masses.filter(mass => mass >= 1.1 && mass <= 2.2).length;
    const bhCount = masses.filter(mass => mass >= 3.05).length;

    if (type === CompactMergerType.NEUTRON_STAR_NEUTRON_STAR) {
      if (nsCount !== 2 || neutronStarReferenceRadiusKm === null) {
        throw new RangeError('NS-NS merger progenitors require two neutron stars and an explicit NS reference radius.');
      }
      assertRange(neutronStarReferenceRadiusKm, 9, 15.5, 'neutronStarReferenceRadiusKm');
      return;
    }

    if (type === CompactMergerType.NEUTRON_STAR_BLACK_HOLE) {
      if (nsCount !== 1 || bhCount !== 1 || neutronStarReferenceRadiusKm === null) {
        throw new RangeError('NS-BH merger progenitors require exactly one neutron star and one stellar black hole.');
      }
      assertRange(neutronStarReferenceRadiusKm, 9, 15.5, 'neutronStarReferenceRadiusKm');
      return;
    }

    if (bhCount !== 2 || neutronStarReferenceRadiusKm !== null) {
      throw new RangeError('BH-BH merger progenitors require two stellar black holes and no neutron-star radius.');
    }
  }

  get totalMassSolar(): number { return this.primaryMassSolar + this.secondaryMassSolar; }
  get massRatio(): number {
    return Math.min(this.primaryMassSolar, this.secondaryMassSolar) /
      Math.max(this.primaryMassSolar, this.secondaryMassSolar);
  }
  get symmetricMassRatio(): number {
    return this.primaryMassSolar * this.secondaryMassSolar / this.totalMassSolar ** 2;
  }
  get chirpMassSolar(): number {
    return (this.primaryMassSolar * this.secondaryMassSolar) ** (3 / 5) /
      this.totalMassSolar ** (1 / 5);
  }
}

function assertRange(value: number, min: number, max: number, name: string): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${name} must be finite and in [${min}, ${max}].`);
  }
}
